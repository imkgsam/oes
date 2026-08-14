import { Metadata } from '@grpc/grpc-js'
import {
  AUTHORIZATION_METADATA_KEY,
  REQUEST_ID_METADATA_KEY,
  TRACE_ID_METADATA_KEY,
  TRACEPARENT_METADATA_KEY,
  TRACESTATE_METADATA_KEY
} from '../constants'
import {
  CertificateBoundExecutionTokenCache,
  CertificateBoundExecutionTokenCacheKey
} from './certificate-bound-execution-token-cache'
import {
  TrustedExecutionContext,
  TrustedExecutionContextAccessor
} from './trusted-execution-context'
import { TrustedExecutionRegistry } from './trusted-execution-registry'
import { VerifiedWorkloadIdentity } from './execution-token-verifier'
import { ExecutionTokenExchangeSourceCredentialCarrier } from '../../transport/grpc/execution-token-exchange-source-credential.carrier'
import { AsyncLocalTransportPrivateSourceCredentialAccessor } from './transport-private-source-credential'

/** Carries exactly the two caller-prepared fields admitted by the frozen STS wire contract. */
export type ExecutionTokenExchangeRequest = {
  readonly targetAudience: string
  readonly requestedPermissionCodes: readonly string[]
}

/** Carries the cache-safe successful result of the frozen STS exchange contract. */
export type ExecutionTokenExchangeResult = {
  readonly accessToken: string
  readonly tokenType: string
  readonly expiresAtUnixSeconds: number
  readonly expiresInSeconds: number
  readonly kid: string
  readonly grantedPermissionCodes: readonly string[]
  readonly grantedAudience: string
}

/** Abstracts the trusted Auth client while preventing identity or tenant facts from entering its request DTO. */
export interface ExecutionTokenExchangeClient {
  exchange(
    request: ExecutionTokenExchangeRequest,
    metadata: Metadata
  ): Promise<ExecutionTokenExchangeResult>
}

/** Resolves the current process workload and leaf-certificate binding from trusted deployment transport. */
export interface LocalWorkloadIdentityProvider {
  getVerifiedWorkloadIdentity(): Promise<VerifiedWorkloadIdentity>
}

/** Configures the single provider from immutable trust, request-local authority, STS, and local cache ports. */
export type TrustedGrpcMetadataProviderOptions = {
  readonly contextAccessor: TrustedExecutionContextAccessor
  readonly registry: TrustedExecutionRegistry
  readonly tokenCache: CertificateBoundExecutionTokenCache
  readonly exchangeClient: ExecutionTokenExchangeClient
  readonly sourceCredentialAccessor: AsyncLocalTransportPrivateSourceCredentialAccessor
  readonly localWorkloadIdentity: LocalWorkloadIdentityProvider
  readonly now?: () => number
}

/** Produces target-bound gRPC metadata solely from trusted execution facts and exact adapter declarations. */
export class TrustedGrpcMetadataProvider {
  private readonly contextAccessor: TrustedExecutionContextAccessor
  private readonly registry: TrustedExecutionRegistry
  private readonly tokenCache: CertificateBoundExecutionTokenCache
  private readonly exchangeClient: ExecutionTokenExchangeClient
  private readonly sourceCredentialCarrier: ExecutionTokenExchangeSourceCredentialCarrier
  private readonly localWorkloadIdentity: LocalWorkloadIdentityProvider
  private readonly now: () => number

  constructor(options: TrustedGrpcMetadataProviderOptions) {
    this.contextAccessor = options.contextAccessor
    this.registry = options.registry
    this.tokenCache = options.tokenCache
    this.exchangeClient = options.exchangeClient
    this.sourceCredentialCarrier = new ExecutionTokenExchangeSourceCredentialCarrier(
      options.sourceCredentialAccessor
    )
    this.localWorkloadIdentity = options.localWorkloadIdentity
    this.now = options.now ?? (() => Math.floor(Date.now() / 1000))
  }

  /** Produces metadata for a BUSINESS RPC with one non-empty exact Permission Code set. */
  forBusinessCall(
    targetAudience: string,
    requiredPermissionCodes: readonly string[]
  ): Promise<Metadata> {
    return this.produce('BUSINESS', targetAudience, requiredPermissionCodes)
  }

  /** Produces metadata for a SELF_SERVICE RPC using the contract-controlled empty business Code set. */
  forSelfServiceCall(targetAudience: string): Promise<Metadata> {
    return this.produce('SELF_SERVICE', targetAudience, [])
  }

  /** Produces metadata for an INTERNAL RPC with one non-empty exact INTERNAL Code set. */
  forInternalCall(
    targetAudience: string,
    requiredInternalPermissionCodes: readonly string[]
  ): Promise<Metadata> {
    return this.produce('INTERNAL', targetAudience, requiredInternalPermissionCodes)
  }

  /** Resolves exact authority/cache bindings, exchanges on miss, and never consults request bodies. */
  private async produce(
    mode: 'BUSINESS' | 'SELF_SERVICE' | 'INTERNAL',
    targetAudience: string,
    permissionCodes: readonly string[]
  ): Promise<Metadata> {
    const context = this.contextAccessor.requireCurrent()
    this.sourceCredentialCarrier.assertCurrent()
    this.registry.assertAudience(targetAudience)
    const normalizedPermissionCodes = normalizePermissionCodes(mode, permissionCodes)
    const workloadIdentity = await this.localWorkloadIdentity.getVerifiedWorkloadIdentity()
    this.registry.assertWorkloadIdentity(workloadIdentity.spiffeId)
    validateThumbprint(workloadIdentity.certificateThumbprint)

    const cacheKey = buildCacheKey(
      context,
      targetAudience,
      normalizedPermissionCodes,
      workloadIdentity,
      this.sourceCredentialCarrier.referenceCurrent()
    )
    let cached = this.tokenCache.get(cacheKey)
    if (cached === undefined) {
      const request = Object.freeze({
        targetAudience,
        requestedPermissionCodes: Object.freeze(normalizedPermissionCodes)
      })
      const exchanged = await this.exchangeClient.exchange(
        request,
        this.sourceCredentialCarrier.createMetadata(context)
      )
      const validated = validateExchangeResult(
        exchanged,
        targetAudience,
        normalizedPermissionCodes,
        this.now()
      )
      this.tokenCache.set(cacheKey, validated)
      cached = validated
    }

    return buildMetadata(cached.accessToken, context)
  }
}

/** Canonicalizes one exact method-owned Code set and reserves empty scope for SELF_SERVICE only. */
function normalizePermissionCodes(
  mode: 'BUSINESS' | 'SELF_SERVICE' | 'INTERNAL',
  permissionCodes: readonly string[]
): string[] {
  if (!Array.isArray(permissionCodes)) {
    throw new Error(`${mode} gRPC permission codes must be an array`)
  }
  const normalized = permissionCodes.map((code) => {
    if (typeof code !== 'string' || code.trim().length === 0) {
      throw new Error(`${mode} gRPC permission codes must be non-empty strings`)
    }
    return code.trim()
  })
  const canonical = [...new Set(normalized)].sort()
  if (mode !== 'SELF_SERVICE' && canonical.length === 0) {
    throw new Error(`${mode} gRPC permission codes must not be empty`)
  }
  if (mode === 'SELF_SERVICE' && canonical.length !== 0) {
    throw new Error('SELF_SERVICE gRPC calls cannot request business Permission Codes')
  }
  return canonical
}

/** Builds the complete cache key from trusted authority and the current local workload certificate. */
function buildCacheKey(
  context: TrustedExecutionContext,
  targetAudience: string,
  permissionCodes: readonly string[],
  workloadIdentity: VerifiedWorkloadIdentity,
  sourceCredentialReference: string
): CertificateBoundExecutionTokenCacheKey {
  return {
    subject: context.subject,
    principalType: context.principalType,
    ...(context.actor === undefined ? {} : { actor: context.actor }),
    ...(context.delegationId === undefined ? {} : { delegationId: context.delegationId }),
    ...(context.tenantId === undefined ? {} : { tenantId: context.tenantId }),
    ...(context.orgId === undefined ? {} : { orgId: context.orgId }),
    targetAudience,
    permissionCodes,
    workloadIdentity: workloadIdentity.spiffeId,
    certificateThumbprint: workloadIdentity.certificateThumbprint,
    sourceCredentialReference,
    ...(context.sessionId === undefined ? {} : { sessionId: context.sessionId }),
    ...(context.sessionTerminal === undefined ? {} : { sessionTerminal: context.sessionTerminal }),
    ...(context.authzVersion === undefined ? {} : { authzVersion: context.authzVersion })
  }
}

/** Validates the complete STS result before any bearer material is cached or propagated. */
function validateExchangeResult(
  result: ExecutionTokenExchangeResult,
  targetAudience: string,
  requestedPermissionCodes: readonly string[],
  now: number
): { readonly accessToken: string; readonly expiresAt: number } {
  if (result?.tokenType !== 'Bearer' || !isCompactJws(result.accessToken)) {
    throw new Error('ExecutionToken exchange returned an invalid bearer credential')
  }
  if (result.grantedAudience !== targetAudience) {
    throw new Error('ExecutionToken exchange granted an unexpected audience')
  }
  const grantedPermissionCodes = normalizeGrantedPermissionCodes(result.grantedPermissionCodes)
  if (JSON.stringify(grantedPermissionCodes) !== JSON.stringify(requestedPermissionCodes)) {
    throw new Error('ExecutionToken exchange granted an unexpected Permission Code set')
  }
  if (
    typeof result.kid !== 'string' ||
    result.kid.length === 0 ||
    result.kid.trim() !== result.kid
  ) {
    throw new Error('ExecutionToken exchange returned an invalid kid')
  }
  if (
    !Number.isInteger(result.expiresAtUnixSeconds) ||
    !Number.isInteger(result.expiresInSeconds) ||
    result.expiresAtUnixSeconds <= now ||
    result.expiresInSeconds <= 0 ||
    result.expiresInSeconds > 300
  ) {
    throw new Error('ExecutionToken exchange returned an invalid expiry')
  }

  return Object.freeze({
    accessToken: result.accessToken,
    expiresAt: Math.min(result.expiresAtUnixSeconds, now + result.expiresInSeconds)
  })
}

/** Requires the granted STS Code set to already be unique and canonically sorted. */
function normalizeGrantedPermissionCodes(permissionCodes: readonly string[]): string[] {
  if (!Array.isArray(permissionCodes)) {
    throw new Error('ExecutionToken exchange returned invalid granted Permission Codes')
  }
  const normalized = permissionCodes.map((code) => {
    if (typeof code !== 'string' || code.length === 0 || code.trim() !== code) {
      throw new Error('ExecutionToken exchange returned invalid granted Permission Codes')
    }
    return code
  })
  if (
    new Set(normalized).size !== normalized.length ||
    [...normalized].sort().join('|') !== normalized.join('|')
  ) {
    throw new Error('ExecutionToken exchange returned non-canonical granted Permission Codes')
  }
  return normalized
}

/** Builds the only accepted outbound metadata set without legacy service or operator headers. */
function buildMetadata(accessToken: string, context: TrustedExecutionContext): Metadata {
  const metadata = new Metadata()
  metadata.set(AUTHORIZATION_METADATA_KEY, `Bearer ${accessToken}`)
  metadata.set(REQUEST_ID_METADATA_KEY, context.requestId)
  metadata.set(TRACEPARENT_METADATA_KEY, context.traceparent)
  metadata.set(TRACE_ID_METADATA_KEY, context.traceparent.slice(3, 35))
  if (context.tracestate !== undefined) {
    metadata.set(TRACESTATE_METADATA_KEY, context.tracestate)
  }
  return metadata
}

/** Accepts only an opaque compact-JWS shape before handing the credential to gRPC transport. */
function isCompactJws(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.split('.').length === 3 &&
    value.split('.').every((segment) => /^[A-Za-z0-9_-]+$/.test(segment))
  )
}

/** Rejects a malformed local certificate binding before it can influence cache reuse. */
function validateThumbprint(value: string): void {
  if (!/^[A-Za-z0-9_-]{43}$/.test(value)) {
    throw new Error('Local workload certificate thumbprint is invalid')
  }
}
