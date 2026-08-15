import { Metadata } from '@grpc/grpc-js'
import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import {
  AsyncLocalTrustedExecutionContextAccessor,
  CertificateBoundExecutionTokenCache,
  createTrustedExecutionContext,
  ExecutionTokenExchangeClient,
  ExecutionTokenExchangeRequest,
  ExecutionTokenExchangeResult,
  inboundExecutionTokenCredentialScope,
  InternalTrustedGrpcCaller,
  TrustedExecutionRegistry,
  TrustedGrpcMetadataProvider
} from '@oes/common/authorization'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import {
  EXECUTION_TOKEN_SERVICE_NAME,
  ExecutionTokenServiceClient
} from '@oes/common/generated/auth_service'
import {
  createGrpcClientCredentials,
  readLocalVerifiedWorkloadIdentity,
  safeGrpcCall
} from '@oes/common/transport'

export type PermissionFoundationTargetProfile = Readonly<{
  audience: string
  execution: 'HUMAN_OBO'
}>

/** Freezes Permission's package-owned target audiences without importing another service's producer. */
export const PERMISSION_FOUNDATION_TARGETS = Object.freeze({
  'identity-service': Object.freeze({
    audience: 'urn:oes:service:identity-service',
    execution: 'HUMAN_OBO' as const
  })
}) satisfies Readonly<Record<string, PermissionFoundationTargetProfile>>

const ERRORS = Object.freeze({
  CONTEXT_REQUIRED: 'PERMISSION_FOUNDATION_EXECUTION_CONTEXT_REQUIRED',
  FOUNDATION_UNAVAILABLE: 'PERMISSION_FOUNDATION_EXECUTION_UNAVAILABLE',
  SOURCE_CREDENTIAL_INVALID: 'PERMISSION_FOUNDATION_SOURCE_CREDENTIAL_INVALID'
})

/** Produces target-bound HUMAN_OBO metadata solely from the guard-retained inbound HUMAN credential. */
export class PermissionFoundationTrustedGrpcExecutionProducer {
  private readonly context = new AsyncLocalTrustedExecutionContextAccessor()
  private readonly exchange = new PermissionFoundationExecutionTokenExchangeClient()
  private readonly callers = new Map<string, InternalTrustedGrpcCaller>()

  async forBusinessCall(
    target: keyof typeof PERMISSION_FOUNDATION_TARGETS,
    codes: readonly string[]
  ): Promise<Metadata> {
    const profile = requirePermissionFoundationTarget(target)
    const inbound = requireInbound()
    const correlation = inboundExecutionTokenCredentialScope.requireCorrelation()
    const root = createTrustedExecutionContext({
      subject: inbound.subject,
      principalType: 'HUMAN',
      tenantId: inbound.tenantId,
      ...(inbound.orgId === undefined ? {} : { orgId: inbound.orgId }),
      sessionId: inbound.sessionId,
      sessionTerminal: inbound.sessionTerminal,
      ...(inbound.authzVersion === undefined ? {} : { authzVersion: inbound.authzVersion }),
      requestId: correlation.requestId,
      traceparent: correlation.traceparent,
      ...(correlation.tracestate === undefined ? {} : { tracestate: correlation.tracestate })
    })
    return this.context.run(root, () =>
      this.caller(profile.audience).forBusinessCall(codes, async (metadata) => metadata)
    )
  }

  /** Exchanges an exact INTERNAL transport Code while preserving the verified HUMAN subject. */
  async forInternalCall(
    target: keyof typeof PERMISSION_FOUNDATION_TARGETS,
    code: string
  ): Promise<Metadata> {
    const profile = requirePermissionFoundationTarget(target)
    const inbound = requireInbound()
    const correlation = inboundExecutionTokenCredentialScope.requireCorrelation()
    const root = createTrustedExecutionContext({
      subject: inbound.subject,
      principalType: 'HUMAN',
      tenantId: inbound.tenantId,
      ...(inbound.orgId === undefined ? {} : { orgId: inbound.orgId }),
      sessionId: inbound.sessionId,
      sessionTerminal: inbound.sessionTerminal,
      ...(inbound.authzVersion === undefined ? {} : { authzVersion: inbound.authzVersion }),
      requestId: correlation.requestId,
      traceparent: correlation.traceparent,
      ...(correlation.tracestate === undefined ? {} : { tracestate: correlation.tracestate })
    })
    return this.context.run(root, () =>
      this.caller(profile.audience).forInternalCall(code, async (metadata) => metadata)
    )
  }

  private caller(audience: string): InternalTrustedGrpcCaller {
    const existing = this.callers.get(audience)
    if (existing) return existing
    const metadata = new TrustedGrpcMetadataProvider({
      contextAccessor: this.context,
      registry: new TrustedExecutionRegistry({
        issuer: required('AUTH_EXECUTION_ISSUER'),
        audiences: [audience],
        workloadIdentities: [required('OES_WORKLOAD_SPIFFE_ID')]
      }),
      tokenCache: new CertificateBoundExecutionTokenCache({ refreshMarginSeconds: 15 }),
      exchangeClient: this.exchange,
      sourceCredentialAccessor: inboundExecutionTokenCredentialScope.accessor,
      localWorkloadIdentity: {
        getVerifiedWorkloadIdentity: async () => readLocalVerifiedWorkloadIdentity()
      }
    })
    const caller = new InternalTrustedGrpcCaller(
      this.context,
      metadata,
      inboundExecutionTokenCredentialScope,
      { executionSource: 'HUMAN_OBO', targetAudience: audience, errors: ERRORS }
    )
    this.callers.set(audience, caller)
    return caller
  }
}

/** Exchanges the opaque current-hop subject credential only with Auth's mTLS STS. */
class PermissionFoundationExecutionTokenExchangeClient implements ExecutionTokenExchangeClient {
  private client?: ClientGrpc
  private service?: ExecutionTokenServiceClient

  async exchange(
    request: ExecutionTokenExchangeRequest,
    metadata: Metadata
  ): Promise<ExecutionTokenExchangeResult> {
    const response = await safeGrpcCall(
      this.getService().exchangeExecutionToken(
        {
          targetAudience: request.targetAudience,
          requestedPermissionCodes: [...request.requestedPermissionCodes]
        },
        metadata
      ),
      { caller: 'permission-service', method: 'ExchangeExecutionToken' }
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

  private getService(): ExecutionTokenServiceClient {
    this.client ??= ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'auth_service',
        protoPath: resolveCommonProtoPath('auth_service/execution_token.proto'),
        url: `${process.env.AUTH_SERVICE_HOST?.trim() || '127.0.0.1'}:${process.env.AUTH_SERVICE_PORT?.trim() || '50050'}`,
        credentials: createGrpcClientCredentials()
      }
    }) as unknown as ClientGrpc
    return (this.service ??= this.client.getService<ExecutionTokenServiceClient>(
      EXECUTION_TOKEN_SERVICE_NAME
    ))
  }
}

/** Resolves one immutable Permission target profile and rejects caller-selected or wildcard audiences. */
export function requirePermissionFoundationTarget(
  target: keyof typeof PERMISSION_FOUNDATION_TARGETS
): PermissionFoundationTargetProfile {
  const profile = PERMISSION_FOUNDATION_TARGETS[target]
  if (!profile || profile.audience.includes('*')) {
    throw new Error('Permission foundation target is not registered')
  }
  return profile
}

/** Reads only the request-scoped HUMAN credential retained after local ET verification. */
function requireInbound() {
  const inbound = inboundExecutionTokenCredentialScope.requireVerifiedExecution()
  if (inbound.principalType !== 'HUMAN' || !inbound.tenantId || !inbound.sessionId) {
    throw new Error(ERRORS.CONTEXT_REQUIRED)
  }
  return inbound
}

/** Requires deployment-owned trust facts without inventing local fallback authority. */
function required(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(ERRORS.FOUNDATION_UNAVAILABLE)
  return value
}

/** Owns Permission's certificate-bound channel to Identity without a generic client token. */
export class PermissionIdentityTrustedGrpcClient {
  private client?: ClientGrpc
  getClient(): ClientGrpc {
    return (this.client ??= ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'identity_service',
        protoPath: resolveCommonProtoPath('identity_service/identity_query.proto'),
        url: permissionIdentityUrl(),
        credentials: createGrpcClientCredentials()
      }
    }) as unknown as ClientGrpc)
  }
}

/** Resolves Identity's deployment URL and permits the local endpoint only outside production. */
function permissionIdentityUrl(): string {
  const configured = process.env.GRPC_SERVICE_IDENTITY_URL?.trim()
  if (configured) return configured
  if ((process.env.NODE_ENV ?? 'development') !== 'production') return '127.0.0.1:50052'
  throw new Error(ERRORS.FOUNDATION_UNAVAILABLE)
}
