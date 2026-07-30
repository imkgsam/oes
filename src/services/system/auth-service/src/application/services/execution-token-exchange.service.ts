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
  readonly tenantId: string
  readonly orgId?: string
  readonly permissionCodes: readonly string[]
  readonly sessionId?: string
  readonly delegationId?: string
  readonly actor?: unknown
  readonly authzVersion?: string | number
}

export interface ExchangeExecutionTokenInput {
  readonly targetAudience: string
  readonly requestedPermissionCodes: readonly string[]
  readonly workloadIdentity: VerifiedExecutionWorkload
  readonly execution: TrustedExecutionContext
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
      tenant_id: input.execution.tenantId,
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
      ...(input.execution.authzVersion === undefined
        ? {}
        : { authz_version: input.execution.authzVersion })
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

  /** Validates only facts already established by upstream authorization and the mTLS transport boundary. */
  private assertTrustedContext(
    input: ExchangeExecutionTokenInput,
    permissionCodes: readonly string[]
  ): void {
    if (
      !input.workloadIdentity.spiffeId.startsWith('spiffe://') ||
      !isThumbprint(input.workloadIdentity.certificateThumbprint) ||
      !input.execution.subject ||
      !input.execution.tenantId ||
      permissionCodes.some((code) => !input.execution.permissionCodes.includes(code))
    ) {
      throw new Error('execution token exchange context is not trusted')
    }
    this.registry.assertIssuanceAllowed(input.workloadIdentity.spiffeId, input.targetAudience)
  }
}

/** Requires a canonical, non-empty, exact permission subset so STS cannot silently issue a broader or partial token. */
function normalizePermissionCodes(permissionCodes: readonly string[]): readonly string[] {
  if (
    permissionCodes.length === 0 ||
    new Set(permissionCodes).size !== permissionCodes.length ||
    permissionCodes.some((code, index) => !code || code !== [...permissionCodes].sort()[index])
  ) {
    throw new Error('execution token permissions must be non-empty, unique, and canonical')
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
