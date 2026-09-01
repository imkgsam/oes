import { Metadata } from '@grpc/grpc-js'
import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import {
  AsyncLocalTransportPrivateSourceCredentialAccessor,
  AsyncLocalTrustedExecutionContextAccessor,
  CertificateBoundExecutionTokenCache,
  createTrustedExecutionContext,
  ExecutionTokenExchangeClient,
  ExecutionTokenExchangeRequest,
  ExecutionTokenExchangeResult,
  inboundExecutionTokenCredentialScope,
  InternalTrustedGrpcCaller,
  TransportPrivateSourceCredentialIssuer,
  TrustedExecutionRegistry,
  TrustedGrpcMetadataProvider
} from '@oes/common/authorization'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import {
  EXECUTION_TOKEN_SERVICE_NAME,
  ExecutionTokenServiceClient,
  MachineWorkloadSourceCredentialServiceClient
} from '@oes/common/generated/auth_service'
import {
  createGrpcClientCredentials,
  readLocalVerifiedWorkloadIdentity,
  safeGrpcCall
} from '@oes/common/transport'

export type PublicEntryFoundationTargetProfile = Readonly<{ audience: string }>

/** Freezes PublicEntry's exact target audiences; execution source is selected only from verified admission state. */
export const PUBLIC_ENTRY_FOUNDATION_TARGETS = Object.freeze({
  'identity-service': Object.freeze({ audience: 'urn:oes:service:identity-service' }),
  'permission-service': Object.freeze({ audience: 'urn:oes:service:permission-service' }),
  'hr-service': Object.freeze({ audience: 'urn:oes:service:hr-service' }),
  'tenant-org-service': Object.freeze({ audience: 'urn:oes:service:tenant-org-service' })
}) satisfies Readonly<Record<string, PublicEntryFoundationTargetProfile>>
export const PUBLICENTRY_FOUNDATION_TARGETS = PUBLIC_ENTRY_FOUNDATION_TARGETS

const ERRORS = Object.freeze({
  CONTEXT_REQUIRED: 'PUBLIC_ENTRY_FOUNDATION_EXECUTION_CONTEXT_REQUIRED',
  FOUNDATION_UNAVAILABLE: 'PUBLIC_ENTRY_FOUNDATION_EXECUTION_UNAVAILABLE',
  SOURCE_CREDENTIAL_INVALID: 'PUBLIC_ENTRY_FOUNDATION_SOURCE_CREDENTIAL_INVALID'
})

type Target = keyof typeof PUBLIC_ENTRY_FOUNDATION_TARGETS
type Mode = 'BUSINESS' | 'INTERNAL'

/** Produces HUMAN_OBO metadata when a HUMAN ET exists, otherwise an exact service MACHINE root. */
export class PublicEntryFoundationTrustedGrpcExecutionProducer {
  private readonly context = new AsyncLocalTrustedExecutionContextAccessor()
  private readonly exchange = new PublicEntryFoundationExecutionTokenExchangeClient()
  private readonly machine = new PublicEntryFoundationMachineSourceCredentialProvider(
    new PublicEntryFoundationMachineSourceCredentialClient()
  )
  private readonly callers = new Map<string, InternalTrustedGrpcCaller>()

  forBusinessCall(target: Target, codes: readonly string[]): Promise<Metadata> {
    return this.produce(target, 'BUSINESS', codes)
  }

  forInternalCall(target: Target, code: string): Promise<Metadata> {
    return this.produce(target, 'INTERNAL', [code])
  }

  /** Produces the fixed tenantless Public Entry MACHINE root even inside an admitted HUMAN request. */
  forInternalMachineCall(target: Target, code: string): Promise<Metadata> {
    return this.produce(target, 'INTERNAL', [code], true)
  }

  /** Selects execution source from guard-owned request scope and never from request DTO values. */
  private async produce(
    target: Target,
    mode: Mode,
    codes: readonly string[],
    forceMachineRoot = false
  ): Promise<Metadata> {
    const profile = requirePublicEntryFoundationTarget(target)
    const correlation = inboundExecutionTokenCredentialScope.requireCorrelation()
    let inbound:
      | ReturnType<typeof inboundExecutionTokenCredentialScope.requireVerifiedExecution>
      | undefined
    try {
      inbound = inboundExecutionTokenCredentialScope.requireVerifiedExecution()
    } catch {
      inbound = undefined
    }
    const isHuman = !forceMachineRoot && inbound?.principalType === 'HUMAN'
    const root = isHuman
      ? createTrustedExecutionContext({
          subject: inbound.subject,
          principalType: 'HUMAN',
          tenantId: requiredValue(inbound.tenantId),
          ...(inbound.orgId === undefined ? {} : { orgId: inbound.orgId }),
          sessionId: requiredValue(inbound.sessionId),
          sessionTerminal: inbound.sessionTerminal,
          ...(inbound.authzVersion === undefined ? {} : { authzVersion: inbound.authzVersion }),
          requestId: correlation.requestId,
          traceparent: correlation.traceparent,
          ...(correlation.tracestate === undefined ? {} : { tracestate: correlation.tracestate })
        })
      : createTrustedExecutionContext({
          subject: required('PUBLIC_ENTRY_FOUNDATION_MACHINE_PRINCIPAL_ID'),
          principalType: 'MACHINE',
          requestId: correlation.requestId,
          traceparent: correlation.traceparent,
          ...(correlation.tracestate === undefined ? {} : { tracestate: correlation.tracestate })
        })
    const source = isHuman ? inboundExecutionTokenCredentialScope : this.machine
    return this.context.run(root, () => {
      const caller = this.caller(profile.audience, isHuman ? 'HUMAN_OBO' : 'MACHINE_ROOT', source)
      return mode === 'BUSINESS'
        ? caller.forBusinessCall(codes, async (metadata) => metadata)
        : caller.forInternalCall(codes[0] ?? '', async (metadata) => metadata)
    })
  }

  private caller(
    audience: string,
    executionSource: 'HUMAN_OBO' | 'MACHINE_ROOT',
    source: { run<T>(callback: () => Promise<T>): Promise<T> }
  ): InternalTrustedGrpcCaller {
    const key = `${executionSource}:${audience}`
    const existing = this.callers.get(key)
    if (existing) return existing
    const sourceAccessor =
      executionSource === 'HUMAN_OBO'
        ? inboundExecutionTokenCredentialScope.accessor
        : this.machine.accessor
    const metadata = new TrustedGrpcMetadataProvider({
      contextAccessor: this.context,
      registry: new TrustedExecutionRegistry({
        issuer: required('AUTH_EXECUTION_ISSUER'),
        audiences: [audience],
        workloadIdentities: [required('OES_WORKLOAD_SPIFFE_ID')]
      }),
      tokenCache: new CertificateBoundExecutionTokenCache({ refreshMarginSeconds: 15 }),
      exchangeClient: this.exchange,
      sourceCredentialAccessor: sourceAccessor,
      localWorkloadIdentity: {
        getVerifiedWorkloadIdentity: async () => readLocalVerifiedWorkloadIdentity()
      }
    })
    const caller = new InternalTrustedGrpcCaller(this.context, metadata, source, {
      executionSource,
      targetAudience: audience,
      errors: ERRORS
    })
    this.callers.set(key, caller)
    return caller
  }
}

/** Exchanges only Common private-carrier metadata with Auth's mTLS STS. */
class PublicEntryFoundationExecutionTokenExchangeClient implements ExecutionTokenExchangeClient {
  private client?: ClientGrpc
  private service?: ExecutionTokenServiceClient
  async exchange(
    request: ExecutionTokenExchangeRequest,
    metadata: Metadata
  ): Promise<ExecutionTokenExchangeResult> {
    const response = await safeGrpcCall(
      this.execution().exchangeExecutionToken(
        {
          targetAudience: request.targetAudience,
          requestedPermissionCodes: [...request.requestedPermissionCodes]
        },
        metadata
      ),
      { caller: 'public-entry-service', method: 'ExchangeExecutionToken' }
    )
    return Object.freeze({
      accessToken: response.accessToken ?? '',
      tokenType: response.tokenType ?? '',
      expiresAtUnixSeconds: Number(response.expiresAtUnixSeconds),
      expiresInSeconds: Number(response.expiresInSeconds),
      kid: response.kid ?? '',
      grantedPermissionCodes: Object.freeze([...(response.grantedPermissionCodes ?? [])]),
      grantedAudience: response.grantedAudience ?? ''
    })
  }
  private execution(): ExecutionTokenServiceClient {
    return (this.service ??= this.grpc().getService<ExecutionTokenServiceClient>(
      EXECUTION_TOKEN_SERVICE_NAME
    ))
  }
  private grpc(): ClientGrpc {
    return (this.client ??= ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'auth_service',
        protoPath: [
          resolveCommonProtoPath('auth_service/execution_token.proto'),
          resolveCommonProtoPath('auth_service/machine_workload_source_credential.proto')
        ],
        url: authUrl(),
        credentials: createGrpcClientCredentials()
      }
    }) as unknown as ClientGrpc)
  }
}

/** Obtains the service's own opaque SYSTEM MACHINE source credential over the accepted Auth bootstrap. */
class PublicEntryFoundationMachineSourceCredentialClient {
  private client?: ClientGrpc
  private service?: MachineWorkloadSourceCredentialServiceClient
  async issue(): Promise<string> {
    const metadata = buildPublicEntryMachineSourceCredentialMetadata()
    const response = await safeGrpcCall(
      this.machine().issueMachineWorkloadSourceCredential(
        {
          machinePrincipalId: required('PUBLIC_ENTRY_FOUNDATION_MACHINE_PRINCIPAL_ID'),
          machineWorkloadBindingId: required('PUBLIC_ENTRY_FOUNDATION_MACHINE_WORKLOAD_BINDING_ID'),
          machineWorkloadBindingVersion: required(
            'PUBLIC_ENTRY_FOUNDATION_MACHINE_WORKLOAD_BINDING_VERSION'
          )
        },
        metadata
      ),
      { caller: 'public-entry-service', method: 'IssueMachineWorkloadSourceCredential' }
    )
    if (response.tokenType !== 'Bearer' || !response.sourceCredential?.trim()) {
      throw new Error(ERRORS.SOURCE_CREDENTIAL_INVALID)
    }
    return response.sourceCredential
  }
  private machine(): MachineWorkloadSourceCredentialServiceClient {
    this.client ??= ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'auth_service',
        protoPath: resolveCommonProtoPath('auth_service/machine_workload_source_credential.proto'),
        url: authUrl(),
        credentials: createGrpcClientCredentials()
      }
    }) as unknown as ClientGrpc
    return (this.service ??= this.client.getService<MachineWorkloadSourceCredentialServiceClient>(
      'MachineWorkloadSourceCredentialService'
    ))
  }
}

/** Propagates only guard-verified request correlation to Auth's machine-source bootstrap. */
export function buildPublicEntryMachineSourceCredentialMetadata(): Metadata {
  const correlation = inboundExecutionTokenCredentialScope.requireCorrelation()
  const metadata = new Metadata()
  metadata.set('x-request-id', correlation.requestId)
  metadata.set('traceparent', correlation.traceparent)
  if (correlation.tracestate) metadata.set('tracestate', correlation.tracestate)
  return metadata
}

/** Scopes one opaque MACHINE source credential to exactly one STS exchange. */
class PublicEntryFoundationMachineSourceCredentialProvider {
  readonly accessor = new AsyncLocalTransportPrivateSourceCredentialAccessor()
  private readonly issuer = new TransportPrivateSourceCredentialIssuer()
  constructor(private readonly client: PublicEntryFoundationMachineSourceCredentialClient) {}
  async run<T>(callback: () => Promise<T>): Promise<T> {
    const credential = await this.client.issue()
    return this.accessor.run(
      this.issuer.issueVerifiedMachineOrDelegationCredential(credential),
      callback
    )
  }
}

/** Returns only a statically registered package-local target. */
export function requirePublicEntryFoundationTarget(
  target: Target
): PublicEntryFoundationTargetProfile {
  const profile = PUBLIC_ENTRY_FOUNDATION_TARGETS[target]
  if (!profile || profile.audience.includes('*'))
    throw new Error('PublicEntry foundation target is not registered')
  return profile
}

function authUrl(): string {
  return `${process.env.AUTH_SERVICE_HOST?.trim() || '127.0.0.1'}:${process.env.AUTH_SERVICE_PORT?.trim() || '50050'}`
}

/** Requires deployment-owned trust configuration without introducing defaults. */
function required(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(ERRORS.FOUNDATION_UNAVAILABLE)
  return value
}

/** Narrows verified optional HUMAN claims after the principal gate. */
function requiredValue(value: string | undefined): string {
  if (!value) throw new Error(ERRORS.CONTEXT_REQUIRED)
  return value
}
