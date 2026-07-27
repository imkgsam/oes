import { verify as verifySignature } from 'node:crypto'
import { ExecutionTokenJwksCache } from './execution-token-jwks-cache'
import { TrustedExecutionRegistry } from './trusted-execution-registry'

const ALLOWED_HEADER_FIELDS = new Set(['alg', 'typ', 'kid'])
const PRINCIPAL_TYPES = new Set(['HUMAN', 'MACHINE', 'DELEGATED'])

/** Represents identity evidence already established by the trusted transport adapter. */
export type VerifiedWorkloadIdentity = {
  readonly spiffeId: string
  readonly certificateThumbprint: string
}

/** Supplies the token and the resource server's non-caller-configurable verification expectations. */
export type VerifyExecutionTokenInput = {
  readonly token: string
  readonly targetAudience: string
  readonly workloadIdentity: VerifiedWorkloadIdentity
}

/** Exposes immutable verified claims without retaining the original bearer token. */
export type VerifiedExecutionToken = {
  readonly issuer: string
  readonly audience: string
  readonly subject: string
  readonly principalType: 'HUMAN' | 'MACHINE' | 'DELEGATED'
  readonly clientId: string
  readonly tenantId?: string
  readonly orgId?: string
  readonly permissionCodes: readonly string[]
  readonly tokenId: string
  readonly issuedAt: number
  readonly notBefore: number
  readonly expiresAt: number
  readonly certificateThumbprint: string
  readonly actor?: unknown
  readonly delegationId?: string
  readonly sessionId?: string
  readonly authzVersion?: string | number
}

/** Configures strict local verification against deployment registry and cached configured-issuer keys. */
export type ExecutionTokenVerifierOptions = {
  readonly registry: TrustedExecutionRegistry
  readonly jwksCache: ExecutionTokenJwksCache
  readonly clockSkewSeconds?: number
  readonly now?: () => number
}

/** Verifies ES256 at+jwt credentials locally and enforces exact registry, time, and workload bindings. */
export class ExecutionTokenVerifier {
  private readonly registry: TrustedExecutionRegistry
  private readonly jwksCache: ExecutionTokenJwksCache
  private readonly clockSkewSeconds: number
  private readonly now: () => number

  constructor(options: ExecutionTokenVerifierOptions) {
    const clockSkewSeconds = options.clockSkewSeconds ?? 60
    if (!Number.isInteger(clockSkewSeconds) || clockSkewSeconds < 0 || clockSkewSeconds > 60) {
      throw new Error('ExecutionToken clock skew must be an integer between 0 and 60 seconds')
    }
    this.registry = options.registry
    this.jwksCache = options.jwksCache
    this.clockSkewSeconds = clockSkewSeconds
    this.now = options.now ?? (() => Math.floor(Date.now() / 1000))
  }

  /** Validates one bearer token without Auth introspection or any legacy identity fallback. */
  async verify(input: VerifyExecutionTokenInput): Promise<VerifiedExecutionToken> {
    this.registry.assertAudience(input.targetAudience)
    this.registry.assertWorkloadIdentity(input.workloadIdentity.spiffeId)
    validateThumbprint(input.workloadIdentity.certificateThumbprint, 'transport certificate')

    const [encodedHeader, encodedClaims, encodedSignature] = splitCompactToken(input.token)
    const header = decodeJsonObject(encodedHeader, 'header')
    validateProtectedHeader(header)
    const claims = decodeJsonObject(encodedClaims, 'claims')
    const key = await this.jwksCache.getKey(header.kid as string)
    const signature = Buffer.from(encodedSignature, 'base64url')
    if (
      signature.length !== 64 ||
      !verifySignature(
        'sha256',
        Buffer.from(`${encodedHeader}.${encodedClaims}`),
        {
          key,
          dsaEncoding: 'ieee-p1363'
        },
        signature
      )
    ) {
      throw new Error('ExecutionToken signature is invalid')
    }

    return this.validateClaims(claims, input)
  }

  /** Enforces exact registered values, time bounds, and certificate-bound workload identity claims. */
  private validateClaims(
    claims: Record<string, unknown>,
    input: VerifyExecutionTokenInput
  ): VerifiedExecutionToken {
    const issuer = requireStringClaim(claims, 'iss')
    this.registry.assertIssuer(issuer)

    if (typeof claims.aud !== 'string' || claims.aud !== input.targetAudience) {
      throw new Error('ExecutionToken audience must equal the exact target audience')
    }
    this.registry.assertAudience(claims.aud)

    const clientId = requireStringClaim(claims, 'client_id')
    if (clientId !== input.workloadIdentity.spiffeId) {
      throw new Error('ExecutionToken client_id does not match the verified workload identity')
    }
    this.registry.assertWorkloadIdentity(clientId)

    const certificateThumbprint = readCertificateThumbprint(claims.cnf)
    if (certificateThumbprint !== input.workloadIdentity.certificateThumbprint) {
      throw new Error('ExecutionToken certificate binding does not match the current mTLS leaf')
    }

    const issuedAt = requireIntegerClaim(claims, 'iat')
    const notBefore = requireIntegerClaim(claims, 'nbf')
    const expiresAt = requireIntegerClaim(claims, 'exp')
    const now = this.now()
    if (expiresAt <= now - this.clockSkewSeconds) {
      throw new Error('ExecutionToken is expired')
    }
    if (notBefore > now + this.clockSkewSeconds || issuedAt > now + this.clockSkewSeconds) {
      throw new Error('ExecutionToken is not active yet')
    }
    if (expiresAt <= issuedAt || expiresAt - issuedAt > 300) {
      throw new Error('ExecutionToken lifetime exceeds the frozen five-minute profile')
    }

    const principalType = requireStringClaim(claims, 'principal_type')
    if (!PRINCIPAL_TYPES.has(principalType)) {
      throw new Error('ExecutionToken principal_type is unsupported')
    }
    const tenantId = optionalStringClaim(claims, 'tenant_id')
    if (tenantId === '*') {
      throw new Error('ExecutionToken tenant_id wildcard is forbidden')
    }

    const permissionCodes = parseScope(claims.scope)
    return Object.freeze({
      issuer,
      audience: claims.aud,
      subject: requireStringClaim(claims, 'sub'),
      principalType: principalType as VerifiedExecutionToken['principalType'],
      clientId,
      ...(tenantId === undefined ? {} : { tenantId }),
      ...optionalProperty(claims, 'org_id', 'orgId'),
      permissionCodes: Object.freeze(permissionCodes),
      tokenId: requireStringClaim(claims, 'jti'),
      issuedAt,
      notBefore,
      expiresAt,
      certificateThumbprint,
      ...(claims.act === undefined ? {} : { actor: deepFreezeJson(claims.act) }),
      ...optionalProperty(claims, 'delegation_id', 'delegationId'),
      ...optionalProperty(claims, 'session_id', 'sessionId'),
      ...(claims.authz_version === undefined
        ? {}
        : { authzVersion: claims.authz_version as string | number })
    })
  }
}

/** Splits and validates compact-JWS base64url segments before parsing. */
function splitCompactToken(token: string): [string, string, string] {
  if (typeof token !== 'string') {
    throw new Error('ExecutionToken must be a compact JWS string')
  }
  const segments = token.split('.')
  if (segments.length !== 3 || segments.some((segment) => !/^[A-Za-z0-9_-]+$/.test(segment))) {
    throw new Error('ExecutionToken must use compact JWS encoding')
  }
  return segments as [string, string, string]
}

/** Parses one JWS JSON object while rejecting arrays, primitives, and malformed data. */
function decodeJsonObject(encoded: string, label: string): Record<string, unknown> {
  try {
    const decoded: unknown = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
    if (decoded === null || typeof decoded !== 'object' || Array.isArray(decoded)) {
      throw new Error('not an object')
    }
    return decoded as Record<string, unknown>
  } catch {
    throw new Error(`ExecutionToken ${label} is invalid`)
  }
}

/** Enforces the frozen minimal JOSE header and rejects all dynamic key-source extensions. */
function validateProtectedHeader(header: Record<string, unknown>): void {
  if (header.alg !== 'ES256') {
    throw new Error('ExecutionToken algorithm must be ES256')
  }
  if (header.typ !== 'at+jwt') {
    throw new Error('ExecutionToken type must be at+jwt')
  }
  if (typeof header.kid !== 'string' || header.kid.length === 0) {
    throw new Error('ExecutionToken kid must be a non-empty string')
  }
  if (Object.keys(header).some((field) => !ALLOWED_HEADER_FIELDS.has(field))) {
    throw new Error('ExecutionToken contains an unsupported JOSE header')
  }
}

/** Reads a mandatory non-empty string claim. */
function requireStringClaim(claims: Record<string, unknown>, name: string): string {
  const value = claims[name]
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`ExecutionToken ${name} claim must be a non-empty string`)
  }
  return value
}

/** Reads an optional non-empty string claim. */
function optionalStringClaim(claims: Record<string, unknown>, name: string): string | undefined {
  if (claims[name] === undefined) {
    return undefined
  }
  return requireStringClaim(claims, name)
}

/** Reads a mandatory integer NumericDate claim. */
function requireIntegerClaim(claims: Record<string, unknown>, name: string): number {
  const value = claims[name]
  if (!Number.isInteger(value)) {
    throw new Error(`ExecutionToken ${name} claim must be an integer NumericDate`)
  }
  return value as number
}

/** Accepts the standard cnf object only when it contains exactly one valid x5t#S256 member. */
function readCertificateThumbprint(cnf: unknown): string {
  if (cnf === null || typeof cnf !== 'object' || Array.isArray(cnf)) {
    throw new Error('ExecutionToken cnf claim must contain one certificate thumbprint')
  }
  const entries = Object.entries(cnf)
  if (entries.length !== 1 || entries[0]?.[0] !== 'x5t#S256') {
    throw new Error('ExecutionToken cnf claim must contain only x5t#S256')
  }
  return validateThumbprint(entries[0][1], 'certificate')
}

/** Validates an unpadded base64url SHA-256 thumbprint. */
function validateThumbprint(value: unknown, label: string): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(value)) {
    throw new Error(`ExecutionToken ${label} thumbprint is invalid`)
  }
  return value
}

/** Parses a canonical space-separated permission set while rejecting duplicates and malformed spacing. */
function parseScope(scope: unknown): string[] {
  if (typeof scope !== 'string') {
    throw new Error('ExecutionToken scope claim must be a string')
  }
  if (scope.length === 0) {
    return []
  }
  const permissionCodes = scope.split(' ')
  if (
    permissionCodes.some((code) => code.length === 0 || code.trim() !== code) ||
    new Set(permissionCodes).size !== permissionCodes.length ||
    [...permissionCodes].sort().join(' ') !== scope
  ) {
    throw new Error('ExecutionToken scope claim must be a unique canonically sorted permission set')
  }
  return permissionCodes
}

/** Copies an optional string claim to its public verified-token field. */
function optionalProperty(
  claims: Record<string, unknown>,
  claimName: string,
  propertyName: string
): Record<string, string> {
  const value = optionalStringClaim(claims, claimName)
  return value === undefined ? {} : { [propertyName]: value }
}

/** Recursively freezes JSON actor attribution before exposing it to downstream runtime code. */
function deepFreezeJson(value: unknown): unknown {
  if (value !== null && typeof value === 'object') {
    for (const nested of Object.values(value)) {
      deepFreezeJson(nested)
    }
    Object.freeze(value)
  }
  return value
}
