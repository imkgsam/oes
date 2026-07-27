import { createHash, createVerify } from 'node:crypto'
import { ExecutionTokenJwksCache } from './execution-token-jwks-cache'
import { TrustedExecutionRegistry } from './trusted-execution-registry'

export interface VerifiedWorkloadIdentity {
  spiffeId: string
  certificateDer: Uint8Array
}

export interface VerifiedExecutionToken {
  issuer: string
  audience: string
  subject: string
  principalType: string
  tenantId: string
  orgId?: string
  permissionCodes: readonly string[]
  keyId: string
  tokenId: string
}

type CompactJwsHeader = { alg: string; typ: string; kid: string; [key: string]: unknown }
type ExecutionTokenPayload = Record<string, unknown>

/** Verifies only frozen ES256 ExecutionTokens against local JWKS and the current mTLS workload identity. */
export class ExecutionTokenVerifier {
  constructor(
    private readonly registry: TrustedExecutionRegistry,
    private readonly jwks: ExecutionTokenJwksCache,
    private readonly now: () => number = Date.now,
    private readonly clockSkewSeconds = 60
  ) {}

  /** Validates JOSE, signature, claims, registered audience, SPIFFE identity, and certificate thumbprint as one fail-closed operation. */
  async verify(
    token: string,
    workload: VerifiedWorkloadIdentity,
    targetService: string
  ): Promise<VerifiedExecutionToken> {
    const [encodedHeader, encodedPayload, encodedSignature] = splitCompactJws(token)
    const header = parseJsonSegment<CompactJwsHeader>(encodedHeader, 'header')
    this.assertSupportedHeader(header)
    const payload = parseJsonSegment<ExecutionTokenPayload>(encodedPayload, 'payload')
    const expectedAudience = this.registry.audienceForService(targetService)
    if (!expectedAudience) {
      throw new Error('unregistered target audience')
    }
    this.assertPayload(payload, expectedAudience, workload)

    const key = await this.jwks.getKey(header.kid, this.registry.issuer)
    if (!key) {
      throw new Error('unknown JWKS kid')
    }
    const verifier = createVerify('SHA256')
    verifier.update(`${encodedHeader}.${encodedPayload}`)
    verifier.end()
    if (!verifier.verify({ key, dsaEncoding: 'ieee-p1363' }, decodeBase64Url(encodedSignature))) {
      throw new Error('invalid ExecutionToken signature')
    }

    return {
      issuer: payload.iss as string,
      audience: payload.aud as string,
      subject: payload.sub as string,
      principalType: payload.principal_type as string,
      tenantId: payload.tenant_id as string,
      orgId: asOptionalString(payload.org_id),
      permissionCodes: (payload.scope as string).split(' ').filter(Boolean),
      keyId: header.kid,
      tokenId: payload.jti as string
    }
  }

  /** Rejects every JOSE extension so Tokens cannot select algorithms or remote key material. */
  private assertSupportedHeader(header: CompactJwsHeader): void {
    const keys = Object.keys(header)
    if (keys.some((key) => key !== 'alg' && key !== 'typ' && key !== 'kid')) {
      throw new Error('unsupported JOSE header')
    }
    if (
      header.alg !== 'ES256' ||
      header.typ !== 'at+jwt' ||
      typeof header.kid !== 'string' ||
      !header.kid.trim()
    ) {
      throw new Error('unsupported ExecutionToken header')
    }
  }

  /** Enforces exact registry, temporal, SPIFFE client_id, and x5t#S256 certificate-binding claims. */
  private assertPayload(
    payload: ExecutionTokenPayload,
    expectedAudience: string,
    workload: VerifiedWorkloadIdentity
  ): void {
    if (!this.registry.permitsWorkload(workload.spiffeId)) {
      throw new Error('untrusted SPIFFE workload')
    }
    if (
      payload.iss !== this.registry.issuer ||
      typeof payload.aud !== 'string' ||
      payload.aud !== expectedAudience ||
      payload.client_id !== workload.spiffeId
    ) {
      throw new Error('ExecutionToken issuer, audience, or workload mismatch')
    }
    for (const requiredClaim of ['sub', 'principal_type', 'tenant_id', 'scope', 'jti']) {
      if (
        typeof payload[requiredClaim] !== 'string' ||
        !(payload[requiredClaim] as string).trim()
      ) {
        throw new Error(`missing ExecutionToken ${requiredClaim}`)
      }
    }
    this.assertTimes(payload)
    const cnf = payload.cnf
    if (!isCnf(cnf) || cnf['x5t#S256'] !== certificateThumbprint(workload.certificateDer)) {
      throw new Error('ExecutionToken certificate binding mismatch')
    }
  }

  /** Bounds token validity and rejects future-issued, not-yet-valid, expired, or overly long-lived credentials. */
  private assertTimes(payload: ExecutionTokenPayload): void {
    const issuedAt = payload.iat
    const notBefore = payload.nbf
    const expiresAt = payload.exp
    if (![issuedAt, notBefore, expiresAt].every((value) => Number.isInteger(value))) {
      throw new Error('invalid ExecutionToken timestamps')
    }
    const nowSeconds = Math.floor(this.now() / 1_000)
    if (
      (issuedAt as number) > nowSeconds + this.clockSkewSeconds ||
      (notBefore as number) > nowSeconds + this.clockSkewSeconds ||
      (expiresAt as number) <= nowSeconds - this.clockSkewSeconds ||
      (expiresAt as number) - (issuedAt as number) > 300
    ) {
      throw new Error('ExecutionToken temporal validation failed')
    }
  }
}

/** Computes the required base64url SHA-256 thumbprint for a verified leaf certificate. */
export function certificateThumbprint(certificateDer: Uint8Array): string {
  return createHash('sha256').update(certificateDer).digest('base64url')
}

/** Splits a compact JWS while rejecting detached, nested, and malformed token forms. */
function splitCompactJws(token: string): [string, string, string] {
  const segments = token.split('.')
  if (segments.length !== 3 || segments.some((segment) => !/^[A-Za-z0-9_-]+$/.test(segment))) {
    throw new Error('invalid compact ExecutionToken')
  }
  return segments as [string, string, string]
}

/** Decodes a base64url JSON segment without accepting non-object JSON values. */
function parseJsonSegment<T extends Record<string, unknown>>(segment: string, label: string): T {
  try {
    const value: unknown = JSON.parse(decodeBase64Url(segment).toString('utf8'))
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('not an object')
    }
    return value as T
  } catch {
    throw new Error(`invalid ExecutionToken ${label}`)
  }
}

/** Decodes a strict base64url segment after compact-JWS validation. */
function decodeBase64Url(value: string): Buffer {
  return Buffer.from(value, 'base64url')
}

/** Narrows cnf to the sole standard certificate-thumbprint member. */
function isCnf(value: unknown): value is { 'x5t#S256': string } {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).length === 1 &&
    typeof (value as Record<string, unknown>)['x5t#S256'] === 'string'
  )
}

/** Preserves an optional, already validated string claim for the immutable execution context. */
function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}
