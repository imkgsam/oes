import { Module } from '@nestjs/common'
import { randomBytes } from 'node:crypto'
import { Metadata } from '@grpc/grpc-js'
import { CqrsModule, QueryBus } from '@nestjs/cqrs'
import { ClientGrpc } from '@nestjs/microservices'
import { firstValueFrom } from 'rxjs'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  AuthorizationPrincipalTypeProto,
  AuthorizationScopeLevelProto,
  PERMISSION_CHECK_SERVICE_NAME,
  PermissionCheckServiceClient,
  ResolvePrincipalAuthorizationResponse,
  ResolveWorkloadIssuanceResponse
} from '@oes/common/generated/permission_service'
import { PERMISSION_INTERNAL_PERMISSION_CODES } from '@oes/common/authorization'
import {
  GrpcTransportModule,
  getGrpcClientToken,
  readLocalVerifiedWorkloadIdentity
} from '@oes/common/transport'
import { EXECUTION_TOKEN_EXCHANGE_CONTEXT } from '../../application/ports/execution-token-exchange-context.port'
import {
  ExecutionTokenAuthorizationDecision,
  ExecutionTokenExchangeService,
  TrustedExecutionContext,
  VerifiedExecutionWorkload
} from '../../application/services/execution-token-exchange.service'
import { ExecutionTokenJwksService } from '../../application/services/execution-token-jwks.service'
import { ValidateAccessTokenQuery } from '../../application/queries/session/validate-access-token.query'
import { ValidateAccessTokenResult } from '../../application/queries/session/validate-access-token.handler'
import { ExecutionTokenSigningPort } from '../../domain/ports/execution-token-signing.port'
import {
  ExecutionTokenRegistry,
  WorkloadIssuancePolicy
} from '../../domain/services/execution-token-registry'
import {
  KmsHsmExecutionTokenClient,
  KmsHsmExecutionTokenSigningAdapter
} from '../../infrastructure/services/kms-hsm-execution-token-signing.adapter'
import {
  createVerifiedExecutionTokenContext,
  ExecutionTokenContextConfiguration
} from '../../infrastructure/execution-token-signer/execution-token-context-bootstrap'
import {
  ExecutionTokenPermissionDecisionResolver,
  ExecutionTokenSourceCredentialVerifier
} from '../../infrastructure/execution-token-signer/verified-execution-token-context.provider'
import { UdsSignerClient } from '../../infrastructure/execution-token-signer/uds-signer.client'
import { verifySignerBootstrap } from '../../infrastructure/execution-token-signer/signer-preflight'
import { ExecutionTokenGrpcController } from '../../interfaces/grpc/execution-token.grpc.controller'
import { ExecutionTokenMetadataHttpController } from '../../interfaces/http/execution-token-metadata.http.controller'
import { MachineWorkloadSourceCredentialVerifier } from '../../infrastructure/execution-token-signer/machine-workload-source-credential.verifier'
import { PrismaMachineWorkloadSourceCredentialRepository } from '../../infrastructure/repositories/prisma/prisma.machine-workload-source-credential.repository'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { ExternalServicesModule } from '../../infrastructure/modules/external-services.module'
import { IDENTITY_SERVICE } from '@oes/common/constants'
import { IIdentityServicePort } from '../../application/ports/identity-service.port'

const KMS_HSM_EXECUTION_TOKEN_CLIENT = 'KmsHsmExecutionTokenClient'
export const EXECUTION_TOKEN_SIGNER = 'ExecutionTokenSigner'
export const EXECUTION_TOKEN_SOURCE_CREDENTIAL_VERIFIER = 'ExecutionTokenSourceCredentialVerifier'
export const EXECUTION_TOKEN_PERMISSION_DECISION_RESOLVER =
  'ExecutionTokenPermissionDecisionResolver'
const EXECUTION_TOKEN_RUNTIME_CONFIGURATION = 'ExecutionTokenRuntimeConfiguration'

type ExecutionTokenRuntimeConfiguration = ExecutionTokenContextConfiguration &
  Readonly<{
    permissionIssuancePolicyVersion: string
    localWorkloadIdentity: VerifiedExecutionWorkload
  }>

const PERMISSION_SERVICE_AUDIENCE = 'urn:oes:service:permission-service'
const PRINCIPAL_AUTHORIZATION_CODE =
  PERMISSION_INTERNAL_PERMISSION_CODES.PRINCIPAL_AUTHORIZATION_RESOLVE

/** Assembles the fail-closed STS runtime; deployment must bind trusted context and a protected KMS/HSM client. */
@Module({
  imports: [
    CqrsModule,
    PrismaModule,
    ExternalServicesModule,
    GrpcTransportModule.forFeature([SERVICE_NAMES.PERMISSION])
  ],
  providers: [
    {
      provide: EXECUTION_TOKEN_RUNTIME_CONFIGURATION,
      useFactory: (): ExecutionTokenRuntimeConfiguration =>
        Object.freeze({
          issuer: requireEnv('AUTH_EXECUTION_ISSUER'),
          workloadPolicies: parsePolicies(requireEnv('AUTH_EXECUTION_WORKLOAD_POLICIES')),
          permissionIssuancePolicyVersion: requireEnv(
            'AUTH_PERMISSION_WORKLOAD_ISSUANCE_POLICY_VERSION'
          ),
          localWorkloadIdentity: readLocalVerifiedWorkloadIdentity()
        })
    },
    {
      provide: ExecutionTokenRegistry,
      useFactory: (configuration: ExecutionTokenRuntimeConfiguration) =>
        new ExecutionTokenRegistry(configuration),
      inject: [EXECUTION_TOKEN_RUNTIME_CONFIGURATION]
    },
    {
      provide: KMS_HSM_EXECUTION_TOKEN_CLIENT,
      useFactory: (): KmsHsmExecutionTokenClient => {
        requireEnv('AUTH_EXECUTION_KMS_KEY_REF')
        return new UdsSignerClient(requireAbsoluteSocketPath('AUTH_EXECUTION_SIGNER_SOCKET_PATH'))
      },
      inject: []
    },
    {
      provide: EXECUTION_TOKEN_SIGNER,
      useFactory: (client: KmsHsmExecutionTokenClient) => bootstrapProtectedSigner(client),
      inject: [KMS_HSM_EXECUTION_TOKEN_CLIENT]
    },
    {
      provide: ExecutionTokenExchangeService,
      useFactory: (registry: ExecutionTokenRegistry, signer: ExecutionTokenSigningPort) =>
        new ExecutionTokenExchangeService(registry, signer),
      inject: [ExecutionTokenRegistry, EXECUTION_TOKEN_SIGNER]
    },
    {
      provide: ExecutionTokenJwksService,
      useFactory: (registry: ExecutionTokenRegistry, signer: ExecutionTokenSigningPort) =>
        new ExecutionTokenJwksService(registry, signer),
      inject: [ExecutionTokenRegistry, EXECUTION_TOKEN_SIGNER]
    },
    {
      provide: EXECUTION_TOKEN_SOURCE_CREDENTIAL_VERIFIER,
      useFactory: (
        queryBus: QueryBus,
        repository: PrismaMachineWorkloadSourceCredentialRepository,
        signer: ExecutionTokenSigningPort,
        identity: IIdentityServicePort,
        configuration: ExecutionTokenRuntimeConfiguration
      ) =>
        new CompositeSourceCredentialVerifier(
          new AuthSessionSourceCredentialVerifier(queryBus),
          new MachineWorkloadSourceCredentialVerifier(
            repository,
            signer,
            identity,
            configuration.issuer
          )
        ),
      inject: [
        QueryBus,
        PrismaMachineWorkloadSourceCredentialRepository,
        EXECUTION_TOKEN_SIGNER,
        IDENTITY_SERVICE,
        EXECUTION_TOKEN_RUNTIME_CONFIGURATION
      ]
    },
    {
      provide: EXECUTION_TOKEN_PERMISSION_DECISION_RESOLVER,
      useFactory: (
        permissionClient: ClientGrpc,
        exchangeService: ExecutionTokenExchangeService,
        configuration: ExecutionTokenRuntimeConfiguration
      ) =>
        new PermissionDecisionGrpcResolver(
          permissionClient,
          exchangeService,
          configuration.localWorkloadIdentity,
          configuration.permissionIssuancePolicyVersion
        ),
      inject: [
        getGrpcClientToken(SERVICE_NAMES.PERMISSION),
        ExecutionTokenExchangeService,
        EXECUTION_TOKEN_RUNTIME_CONFIGURATION
      ]
    },
    {
      provide: EXECUTION_TOKEN_EXCHANGE_CONTEXT,
      useFactory: (
        configuration: ExecutionTokenRuntimeConfiguration,
        sourceCredentialVerifier: ExecutionTokenSourceCredentialVerifier,
        permissionDecisionResolver: ExecutionTokenPermissionDecisionResolver
      ) =>
        createVerifiedExecutionTokenContext(
          configuration,
          sourceCredentialVerifier,
          permissionDecisionResolver
        ),
      inject: [
        EXECUTION_TOKEN_RUNTIME_CONFIGURATION,
        EXECUTION_TOKEN_SOURCE_CREDENTIAL_VERIFIER,
        EXECUTION_TOKEN_PERMISSION_DECISION_RESOLVER
      ]
    },
    PrismaMachineWorkloadSourceCredentialRepository
  ],
  controllers: [ExecutionTokenGrpcController, ExecutionTokenMetadataHttpController],
  exports: [EXECUTION_TOKEN_SIGNER]
})
export class ExecutionTokenModule {}

/** Resolves a HUMAN source only after Auth validates the bearer against active session truth. */
export class AuthSessionSourceCredentialVerifier implements ExecutionTokenSourceCredentialVerifier {
  constructor(private readonly queryBus: QueryBus) {}

  /** Converts the active-session query result into principal facts without copying roles or requested Codes. */
  async verify(
    sourceCredential: string,
    _workloadIdentity: VerifiedExecutionWorkload
  ): Promise<TrustedExecutionContext> {
    const session = await this.queryBus.execute<
      ValidateAccessTokenQuery,
      ValidateAccessTokenResult
    >(new ValidateAccessTokenQuery(sourceCredential))
    return Object.freeze({
      subject: session.accountId,
      principalType: 'HUMAN',
      scopeLevel: session.scopeLevel,
      ...(session.tenantId === undefined ? {} : { tenantId: session.tenantId }),
      sessionId: session.sessionId,
      sessionTerminal: requireSessionTerminal(session.terminal)
    })
  }
}

/** Requires the terminal fact returned by Auth's active-session query before it is signed. */
function requireSessionTerminal(terminal: string): string {
  if (typeof terminal !== 'string' || terminal.length === 0 || terminal.trim() !== terminal) {
    throw new Error('active session terminal is required')
  }
  return terminal
}

/** Preserves HUMAN session validation while routing only the dedicated machine JWS profile to its strict verifier. */
export class CompositeSourceCredentialVerifier implements ExecutionTokenSourceCredentialVerifier {
  constructor(
    private readonly human: AuthSessionSourceCredentialVerifier,
    private readonly machine: MachineWorkloadSourceCredentialVerifier
  ) {}
  async verify(
    sourceCredential: string,
    workloadIdentity: VerifiedExecutionWorkload
  ): Promise<TrustedExecutionContext> {
    return isMachineSourceProfile(sourceCredential)
      ? this.machine.verify(sourceCredential, workloadIdentity)
      : this.human.verify(sourceCredential, workloadIdentity)
  }
}

/** Detects only the exact protected type before selection; malformed or alternate JWTs remain on the unchanged HUMAN path. */
function isMachineSourceProfile(sourceCredential: string): boolean {
  const [header] = sourceCredential.split('.')
  if (!header) return false
  try {
    return (
      (JSON.parse(Buffer.from(header, 'base64url').toString('utf8')) as { typ?: unknown }).typ ===
      'oes-machine-source+jwt'
    )
  } catch {
    return false
  }
}

/** Calls Permission's current issuance RPCs and returns their outputs as the sole privilege upper bound. */
export class PermissionDecisionGrpcResolver implements ExecutionTokenPermissionDecisionResolver {
  private permissionService?: PermissionCheckServiceClient

  constructor(
    private readonly permissionClient: ClientGrpc,
    private readonly exchangeService: ExecutionTokenExchangeService,
    private readonly localWorkloadIdentity: VerifiedExecutionWorkload,
    private readonly issuancePolicyVersion: string
  ) {}

  /** Selects SELF, BUSINESS, or INTERNAL fail-closed resolution without granting from Code spelling. */
  async resolve(
    input: Parameters<ExecutionTokenPermissionDecisionResolver['resolve']>[0]
  ): Promise<ExecutionTokenAuthorizationDecision> {
    const requested = input.request.requestedPermissionCodes
    if (requested.length === 0) return selfServiceDecision(input)
    const internalShape = requested.map((code) => code.includes('.internal.'))
    if (internalShape.some(Boolean) && !internalShape.every(Boolean)) {
      throw new Error('mixed BUSINESS and INTERNAL Permission request is denied')
    }
    return internalShape.every(Boolean)
      ? this.resolveWorkload(input, input.workloadIdentity, requested)
      : this.resolvePrincipal(input, requested)
  }

  /** Obtains the protected principal resolver Token, then consumes its BUSINESS decision. */
  private async resolvePrincipal(
    input: Parameters<ExecutionTokenPermissionDecisionResolver['resolve']>[0],
    requestedPermissionCodes: readonly string[]
  ): Promise<ExecutionTokenAuthorizationDecision> {
    const bootstrapDecision = await this.resolveWorkload(
      input,
      this.localWorkloadIdentity,
      [PRINCIPAL_AUTHORIZATION_CODE],
      PERMISSION_SERVICE_AUDIENCE
    )
    const permissionToken = await this.exchangeService.exchange({
      targetAudience: PERMISSION_SERVICE_AUDIENCE,
      requestedPermissionCodes: [PRINCIPAL_AUTHORIZATION_CODE],
      workloadIdentity: this.localWorkloadIdentity,
      execution: input.execution,
      authorizationDecision: bootstrapDecision
    })
    const metadata = correlationMetadata(input)
    metadata.set('authorization', `Bearer ${permissionToken.accessToken}`)
    const response = await firstValueFrom(
      this.client().resolvePrincipalAuthorization(
        {
          principalType: toPrincipalTypeProto(input.execution.principalType),
          principalId: input.execution.subject,
          scopeLevel: toScopeLevelProto(input.execution.scopeLevel),
          tenantId: input.execution.tenantId,
          orgId: input.execution.orgId,
          targetAudience: input.request.targetAudience,
          requestedBusinessPermissionCodes: [...requestedPermissionCodes],
          sessionReference: input.execution.sessionId
        },
        metadata
      )
    )
    return principalDecision(response)
  }

  /** Consumes the sole mTLS-only workload bootstrap decision with no Authorization metadata. */
  private async resolveWorkload(
    input: Parameters<ExecutionTokenPermissionDecisionResolver['resolve']>[0],
    originalWorkload: VerifiedExecutionWorkload,
    requestedPermissionCodes: readonly string[],
    targetAudience = input.request.targetAudience
  ): Promise<ExecutionTokenAuthorizationDecision> {
    const response = await firstValueFrom(
      this.client().resolveWorkloadIssuance(
        {
          originalWorkloadSpiffeId: originalWorkload.spiffeId,
          targetAudience,
          requestedInternalPermissionCodes: [...requestedPermissionCodes],
          scopeLevel: toScopeLevelProto(input.execution.scopeLevel),
          tenantId: input.execution.tenantId,
          orgId: input.execution.orgId,
          principalType: toPrincipalTypeProto(input.execution.principalType),
          principalId: input.execution.subject,
          issuancePolicyVersion: this.issuancePolicyVersion
        },
        correlationMetadata(input)
      )
    )
    return workloadDecision(response)
  }

  /** Lazily resolves the generated client without creating a second transport or trust path. */
  private client(): PermissionCheckServiceClient {
    this.permissionService ??= this.permissionClient.getService<PermissionCheckServiceClient>(
      PERMISSION_CHECK_SERVICE_NAME
    )
    return this.permissionService
  }
}

/** Builds the only local SELF_SERVICE decision after source verification and with no requested Code. */
function selfServiceDecision(
  input: Parameters<ExecutionTokenPermissionDecisionResolver['resolve']>[0]
): ExecutionTokenAuthorizationDecision {
  if (input.execution.principalType !== 'HUMAN' || !input.execution.sessionId) {
    throw new Error('SELF_SERVICE requires an active HUMAN session source')
  }
  return Object.freeze({
    allowed: true,
    kind: 'SELF_SERVICE',
    grantedPermissionCodes: [],
    deniedPermissionCodes: [],
    principalType: input.execution.principalType,
    principalId: input.execution.subject,
    scopeLevel: input.execution.scopeLevel,
    ...(input.execution.tenantId === undefined ? {} : { tenantId: input.execution.tenantId }),
    ...(input.execution.orgId === undefined ? {} : { orgId: input.execution.orgId }),
    targetAudience: input.request.targetAudience,
    requestedPermissionCodes: [],
    decisionReference: `self-service-session:${input.execution.sessionId}`,
    authzVersion: `session:${input.execution.sessionId}`
  })
}

/** Maps Permission's principal response without substituting request values for granted fields. */
function principalDecision(
  response: ResolvePrincipalAuthorizationResponse
): ExecutionTokenAuthorizationDecision {
  return Object.freeze({
    allowed: response.allowed ?? false,
    kind: 'BUSINESS',
    grantedPermissionCodes: Object.freeze([...(response.grantedPermissionCodes ?? [])]),
    deniedPermissionCodes: Object.freeze([...(response.deniedPermissionCodes ?? [])]),
    principalType: fromPrincipalTypeProto(response.principalType),
    principalId: response.principalId ?? '',
    scopeLevel: fromScopeLevelProto(response.scopeLevel),
    ...optionalExact('tenantId', response.tenantId),
    ...optionalExact('orgId', response.orgId),
    targetAudience: response.targetAudience ?? '',
    requestedPermissionCodes: Object.freeze([...(response.requestedPermissionCodes ?? [])]),
    decisionReference: response.decisionReference ?? '',
    authzVersion: response.authzVersion ?? ''
  })
}

/** Maps Permission's workload response while preserving its exact original-workload binding. */
function workloadDecision(
  response: ResolveWorkloadIssuanceResponse
): ExecutionTokenAuthorizationDecision {
  return Object.freeze({
    allowed: response.allowed ?? false,
    kind: 'INTERNAL',
    grantedPermissionCodes: Object.freeze([...(response.grantedPermissionCodes ?? [])]),
    deniedPermissionCodes: Object.freeze([...(response.deniedPermissionCodes ?? [])]),
    principalType: fromPrincipalTypeProto(response.principalType),
    principalId: response.principalId ?? '',
    scopeLevel: fromScopeLevelProto(response.scopeLevel),
    ...optionalExact('tenantId', response.tenantId),
    ...optionalExact('orgId', response.orgId),
    targetAudience: response.targetAudience ?? '',
    originalWorkloadSpiffeId: response.originalWorkloadSpiffeId ?? '',
    requestedPermissionCodes: Object.freeze([...(response.requestedPermissionCodes ?? [])]),
    decisionReference: response.decisionReference ?? '',
    authzVersion: response.authzVersion ?? ''
  })
}

/** Maps one trusted principal type to the current Permission proto enum. */
function toPrincipalTypeProto(
  principalType: TrustedExecutionContext['principalType']
): AuthorizationPrincipalTypeProto {
  if (principalType === 'HUMAN') {
    return AuthorizationPrincipalTypeProto.AUTHORIZATION_PRINCIPAL_TYPE_PROTO_HUMAN
  }
  if (principalType === 'MACHINE') {
    return AuthorizationPrincipalTypeProto.AUTHORIZATION_PRINCIPAL_TYPE_PROTO_MACHINE
  }
  return AuthorizationPrincipalTypeProto.AUTHORIZATION_PRINCIPAL_TYPE_PROTO_DELEGATED
}

/** Maps one current Permission proto principal enum without accepting unspecified authority. */
function fromPrincipalTypeProto(
  principalType: AuthorizationPrincipalTypeProto | undefined
): TrustedExecutionContext['principalType'] {
  if (principalType === AuthorizationPrincipalTypeProto.AUTHORIZATION_PRINCIPAL_TYPE_PROTO_HUMAN) {
    return 'HUMAN'
  }
  if (
    principalType === AuthorizationPrincipalTypeProto.AUTHORIZATION_PRINCIPAL_TYPE_PROTO_MACHINE
  ) {
    return 'MACHINE'
  }
  if (
    principalType === AuthorizationPrincipalTypeProto.AUTHORIZATION_PRINCIPAL_TYPE_PROTO_DELEGATED
  ) {
    return 'DELEGATED'
  }
  return '' as TrustedExecutionContext['principalType']
}

/** Maps one trusted scope level to the current Permission proto enum. */
function toScopeLevelProto(
  scopeLevel: TrustedExecutionContext['scopeLevel']
): AuthorizationScopeLevelProto {
  if (scopeLevel === 'SYSTEM') {
    return AuthorizationScopeLevelProto.AUTHORIZATION_SCOPE_LEVEL_PROTO_SYSTEM
  }
  if (scopeLevel === 'TENANT') {
    return AuthorizationScopeLevelProto.AUTHORIZATION_SCOPE_LEVEL_PROTO_TENANT
  }
  return AuthorizationScopeLevelProto.AUTHORIZATION_SCOPE_LEVEL_PROTO_UNSPECIFIED
}

/** Maps one current Permission proto scope without accepting unspecified authority. */
function fromScopeLevelProto(
  scopeLevel: AuthorizationScopeLevelProto | undefined
): TrustedExecutionContext['scopeLevel'] {
  if (scopeLevel === AuthorizationScopeLevelProto.AUTHORIZATION_SCOPE_LEVEL_PROTO_SYSTEM) {
    return 'SYSTEM'
  }
  if (scopeLevel === AuthorizationScopeLevelProto.AUTHORIZATION_SCOPE_LEVEL_PROTO_TENANT) {
    return 'TENANT'
  }
  return '' as TrustedExecutionContext['scopeLevel']
}

/** Preserves only exact non-empty optional response bindings and leaves malformed values to fail closed. */
function optionalExact(name: string, value: string | undefined): Record<string, string> {
  return typeof value === 'string' && value.length > 0 && value.trim() === value
    ? { [name]: value }
    : {}
}

/** Propagates only request/trace correlation to Permission and never the source credential bearer. */
function correlationMetadata(
  input: Parameters<ExecutionTokenPermissionDecisionResolver['resolve']>[0]
): Metadata {
  const metadata = new Metadata()
  if (input.requestId) metadata.set('x-request-id', input.requestId)
  if (input.traceparent) metadata.set('traceparent', input.traceparent)
  if (input.tracestate) metadata.set('tracestate', input.tracestate)
  return metadata
}

/** Reads mandatory non-secret deployment configuration while refusing permissive local fallbacks. */
function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required`)
  return value
}
/** Parses only deployment-owned SPIFFE-to-audience policy facts, never request-supplied registry data. */
function parsePolicies(value: string): readonly WorkloadIssuancePolicy[] {
  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) throw new Error('not an array')
    return parsed as readonly WorkloadIssuancePolicy[]
  } catch {
    throw new Error('AUTH_EXECUTION_WORKLOAD_POLICIES must be valid JSON')
  }
}
/** Reads the sole permitted pod-local signer endpoint and rejects TCP, DNS, and relative-path substitutions. */
function requireAbsoluteSocketPath(name: string): string {
  const value = requireEnv(name)
  if (!value.startsWith('/')) throw new Error(`${name} must be an absolute Unix socket path`)
  return value
}
/** Performs Auth startup's public-key timeline and sign/verify challenge before exposing STS or JWKS routes. */
async function bootstrapProtectedSigner(
  client: KmsHsmExecutionTokenClient
): Promise<ExecutionTokenSigningPort> {
  const signer = new KmsHsmExecutionTokenSigningAdapter(client)
  const active = await signer.currentSigningKey()
  const published = await signer.publishedKeys()
  if (!published.some((key) => key.kid === active.kid))
    throw new Error('active signer key is not published')
  const challenge = randomBytes(32)
  verifySignerBootstrap(active.publicJwk, challenge, await signer.sign(active.kid, challenge))
  return signer
}
