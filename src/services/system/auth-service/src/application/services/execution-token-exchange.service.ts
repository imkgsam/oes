import { randomUUID } from 'node:crypto'
import { ExecutionTokenSigningPort } from '../../domain/ports/execution-token-signing.port'
import { ExecutionTokenRegistry } from '../../domain/services/execution-token-registry'

export interface VerifiedExecutionWorkload {
  readonly spiffeId: string
  readonly certificateThumbprint: string
}

export interface TrustedExecutionContext {
  readonly subject: string
  readonly principalType: 'HUMAN' | 'MACHINE' | 'DELEGATED'
  readonly scopeLevel?: 'SYSTEM' | 'TENANT'
  readonly tenantId?: string
  readonly orgId?: string
  /** @deprecated Legacy context field retained only for compile compatibility; the signing gate never reads it. */
  readonly permissionCodes?: readonly string[]
  readonly sessionId?: string
  readonly delegationId?: string
  readonly actor?: unknown
}

/** Carries only Permission's authoritative, request-bound issuance upper bound into the signing gate. */
export interface ExecutionTokenAuthorizationDecision {
  readonly allowed: boolean
  readonly kind: 'BUSINESS' | 'INTERNAL' | 'SELF_SERVICE'
  readonly grantedPermissionCodes: readonly string[]
  readonly deniedPermissionCodes: readonly string[]
  readonly principalType: 'HUMAN' | 'MACHINE' | 'DELEGATED'
  readonly principalId: string
  readonly scopeLevel: 'SYSTEM' | 'TENANT'
  readonly tenantId?: string
  readonly orgId?: string
  readonly targetAudience: string
  readonly originalWorkloadSpiffeId?: string
  readonly requestedPermissionCodes: readonly string[]
  readonly decisionReference: string
  readonly authzVersion: string
}

export interface ExchangeExecutionTokenInput {
  readonly targetAudience: string
  readonly requestedPermissionCodes: readonly string[]
  readonly workloadIdentity: VerifiedExecutionWorkload
  readonly execution: TrustedExecutionContext
  readonly authorizationDecision: ExecutionTokenAuthorizationDecision
}

export interface IssuedExecutionToken {
  readonly accessToken: string
  readonly tokenType: 'Bearer'
  readonly expiresAtUnixSeconds: number
  readonly expiresInSeconds: number
  readonly kid: string
  readonly grantedPermissionCodes: readonly string[]
  readonly grantedAudience: string
}

/** Issues a five-minute ES256 at+jwt only from transport-verified execution context and immutable registry facts. */
export class ExecutionTokenExchangeService {
  static readonly MAX_TTL_SECONDS = 300
  static readonly JWKS_CACHE_SECONDS = 300

  constructor(
    private readonly registry: ExecutionTokenRegistry,
    private readonly signer: ExecutionTokenSigningPort,
    private readonly now: () => number = () => Math.floor(Date.now() / 1_000)
  ) {}

  /** Signs one exact-audience, certificate-bound credential after rejecting caller-selected trust and privilege expansion. */
  async exchange(input: ExchangeExecutionTokenInput): Promise<IssuedExecutionToken> {
    const permissions = normalizePermissionCodes(input.requestedPermissionCodes)
    this.assertTrustedContext(input, permissions)
    const signingKey = await this.signer.currentSigningKey()
    const now = this.now()
    assertSigningKeyEligible(signingKey, now)

    const expiresAtUnixSeconds = now + ExecutionTokenExchangeService.MAX_TTL_SECONDS
    const header = encodeSegment({ alg: 'ES256', kid: signingKey.kid, typ: 'at+jwt' })
    const claims = encodeSegment({
      iss: this.registry.issuer,
      aud: input.targetAudience,
      sub: input.execution.subject,
      principal_type: input.execution.principalType,
      client_id: input.workloadIdentity.spiffeId,
      ...(input.execution.tenantId === undefined ? {} : { tenant_id: input.execution.tenantId }),
      ...(input.execution.orgId === undefined ? {} : { org_id: input.execution.orgId }),
      scope: permissions.join(' '),
      jti: randomUUID(),
      iat: now,
      nbf: now,
      exp: expiresAtUnixSeconds,
      cnf: { 'x5t#S256': input.workloadIdentity.certificateThumbprint },
      ...(input.execution.sessionId === undefined ? {} : { session_id: input.execution.sessionId }),
      ...(input.execution.delegationId === undefined
        ? {}
        : { delegation_id: input.execution.delegationId }),
      ...(input.execution.actor === undefined ? {} : { act: input.execution.actor }),
      authz_version: input.authorizationDecision.authzVersion
    })
    const signingInput = `${header}.${claims}`
    const signature = await this.signer.sign(signingKey.kid, Buffer.from(signingInput, 'utf8'))

    return Object.freeze({
      accessToken: `${signingInput}.${Buffer.from(signature).toString('base64url')}`,
      tokenType: 'Bearer',
      expiresAtUnixSeconds,
      expiresInSeconds: ExecutionTokenExchangeService.MAX_TTL_SECONDS,
      kid: signingKey.kid,
      grantedPermissionCodes: permissions,
      grantedAudience: input.targetAudience
    })
  }

  /** Validates the transport facts and Permission-owned upper bound before the signing port is reachable. */
  private assertTrustedContext(
    input: ExchangeExecutionTokenInput,
    permissionCodes: readonly string[]
  ): void {
    if (
      !input.workloadIdentity.spiffeId.startsWith('spiffe://') ||
      !isThumbprint(input.workloadIdentity.certificateThumbprint) ||
      !input.execution.subject ||
      !authorizationDecisionMatches(input, permissionCodes)
    ) {
      throw new Error('execution token exchange lacks an authoritative Permission decision')
    }
    this.registry.assertIssuanceAllowed(input.workloadIdentity.spiffeId, input.targetAudience)
  }
}

/** Requires requested Codes to be a true subset of Permission's bound authoritative grant. */
function authorizationDecisionMatches(
  input: ExchangeExecutionTokenInput,
  requestedPermissionCodes: readonly string[]
): boolean {
  const decision = input.authorizationDecision
  const granted = canonicalDecisionCodes(decision?.grantedPermissionCodes)
  const denied = canonicalDecisionCodes(decision?.deniedPermissionCodes)
  const requested = [...requestedPermissionCodes]
  if (
    !decision?.allowed ||
    !isExact(decision.decisionReference) ||
    !isExact(decision.authzVersion) ||
    decision.principalType !== input.execution.principalType ||
    decision.principalId !== input.execution.subject ||
    decision.scopeLevel !== input.execution.scopeLevel ||
    decision.tenantId !== input.execution.tenantId ||
    decision.orgId !== input.execution.orgId ||
    decision.targetAudience !== input.targetAudience ||
    !sameCodes(decision.requestedPermissionCodes, requested) ||
    granted === undefined ||
    denied === undefined ||
    requested.some((code) => !granted.includes(code) || denied.includes(code))
  ) {
    return false
  }
  if (decision.kind === 'SELF_SERVICE') {
    return (
      requested.length === 0 && granted.length === 0 && input.execution.principalType === 'HUMAN'
    )
  }
  if (requested.length === 0) return false
  return (
    decision.kind === 'BUSINESS' ||
    (decision.kind === 'INTERNAL' &&
      decision.originalWorkloadSpiffeId === input.workloadIdentity.spiffeId)
  )
}

/** Accepts only exact, unique, canonically sorted Code arrays from the decision boundary. */
function canonicalDecisionCodes(
  codes: readonly string[] | undefined
): readonly string[] | undefined {
  if (!Array.isArray(codes) || codes.some((code) => !isExact(code))) return undefined
  const canonical = [...new Set(codes)].sort()
  return sameCodes(codes, canonical) ? canonical : undefined
}

/** Compares two already-bounded Code lists without treating either list as authority by itself. */
function sameCodes(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((code, index) => code === right[index])
}

/** Requires a non-empty exact string for stable decision references and authorization versions. */
function isExact(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.trim() === value
}

/** Requires an exact canonical request while reserving the empty set for the later SELF_SERVICE gate. */
function normalizePermissionCodes(permissionCodes: readonly string[]): readonly string[] {
  if (
    new Set(permissionCodes).size !== permissionCodes.length ||
    permissionCodes.some((code, index) => !code || code !== [...permissionCodes].sort()[index])
  ) {
    throw new Error('execution token permissions must be unique and canonical')
  }
  return Object.freeze([...permissionCodes])
}

/** Guarantees the active key was published for the full verifier cache period before Auth uses it for signing. */
function assertSigningKeyEligible(
  key: Awaited<ReturnType<ExecutionTokenSigningPort['currentSigningKey']>>,
  now: number
): void {
  if (
    !key.kid ||
    key.publishNotBeforeUnixSeconds + ExecutionTokenExchangeService.JWKS_CACHE_SECONDS >
      key.signingNotBeforeUnixSeconds ||
    key.signingNotBeforeUnixSeconds > now ||
    key.retireAfterUnixSeconds <= now
  ) {
    throw new Error('execution token signing key is not eligible')
  }
}

/** Encodes a controlled JWS JSON segment without accepting caller-controlled serialization. */
function encodeSegment(value: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url')
}

/** Validates the standard SHA-256 base64url certificate-thumbprint representation. */
function isThumbprint(value: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(value)
}
