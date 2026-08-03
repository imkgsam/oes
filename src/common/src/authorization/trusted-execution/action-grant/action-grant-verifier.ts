import { verify as verifySignature } from 'node:crypto'
import { ExecutionTokenJwksCache } from '../execution-token-jwks-cache'
import {
  type VerifiedExecutionToken,
  type VerifiedWorkloadIdentity
} from '../execution-token-verifier'
import { TrustedExecutionRegistry } from '../trusted-execution-registry'
import {
  type ActionDescriptorV1,
  actionDescriptorDigest,
  actionValueDigest
} from './action-descriptor'

const HEADER_FIELDS = new Set(['alg', 'kid', 'typ'])

export type VerifyActionGrantInput = {
  readonly token: string
  readonly targetAudience: string
  readonly workloadIdentity: VerifiedWorkloadIdentity
  readonly executionToken: VerifiedExecutionToken
  readonly expectedDescriptor: ActionDescriptorV1
}

export type VerifiedActionGrant = {
  readonly actionGrantJti: string
  readonly humanPrincipalId: string
  readonly delegationId: string
  readonly agentPrincipalId: string
  readonly tenantId: string
  readonly orgId?: string
  readonly audience: string
  readonly operationKey: string
  readonly toolContractId: string
  readonly toolContractVersion: string
  readonly descriptorDigest: string
  readonly idempotencyKey: string
  readonly confirmationReference: string
  readonly authorizationDecisionReference: string
  readonly stepUpReference?: string
  readonly expiresAt: number
}

export type ActionGrantVerifierOptions = {
  readonly registry: TrustedExecutionRegistry
  readonly jwksCache: ExecutionTokenJwksCache
  readonly clockSkewSeconds?: number
  readonly now?: () => number
}

/** Verifies Auth-issued ES256 ActionGrants against the exact descriptor and matching DELEGATED ExecutionToken. */
export class ActionGrantVerifier {
  private readonly clockSkewSeconds: number
  private readonly now: () => number

  constructor(private readonly options: ActionGrantVerifierOptions) {
    this.clockSkewSeconds = options.clockSkewSeconds ?? 60
    if (
      !Number.isInteger(this.clockSkewSeconds) ||
      this.clockSkewSeconds < 0 ||
      this.clockSkewSeconds > 60
    ) {
      throw new Error('ActionGrant clock skew must be an integer between 0 and 60 seconds')
    }
    this.now = options.now ?? (() => Math.floor(Date.now() / 1_000))
  }

  /** Validates signature, DG-1 trust bindings, delegated attribution and every ActionDescriptorV1 claim. */
  async verify(input: VerifyActionGrantInput): Promise<VerifiedActionGrant> {
    this.options.registry.assertAudience(input.targetAudience)
    this.options.registry.assertWorkloadIdentity(input.workloadIdentity.spiffeId)
    assertThumbprint(input.workloadIdentity.certificateThumbprint)
    const [encodedHeader, encodedClaims, encodedSignature] = splitCompactJws(input.token)
    const header = decodeObject(encodedHeader, 'header')
    assertHeader(header)
    const key = await this.options.jwksCache.getKey(header.kid as string)
    const signature = Buffer.from(encodedSignature, 'base64url')
    if (
      signature.length !== 64 ||
      !verifySignature(
        'sha256',
        Buffer.from(`${encodedHeader}.${encodedClaims}`),
        { key, dsaEncoding: 'ieee-p1363' },
        signature
      )
    ) {
      throw new Error('ActionGrant signature is invalid')
    }
    const claims = decodeObject(encodedClaims, 'claims')
    return this.validateClaims(claims, input)
  }

  /** Applies all signed claim equality and time checks after cryptographic verification succeeds. */
  private validateClaims(
    claims: Record<string, unknown>,
    input: VerifyActionGrantInput
  ): VerifiedActionGrant {
    const issuer = textClaim(claims, 'iss')
    this.options.registry.assertIssuer(issuer)
    const audience = textClaim(claims, 'aud')
    if (audience !== input.targetAudience) throw new Error('ActionGrant audience mismatch')
    const clientId = textClaim(claims, 'client_id')
    if (
      clientId !== input.workloadIdentity.spiffeId ||
      clientId !== input.executionToken.clientId
    ) {
      throw new Error('ActionGrant workload binding mismatch')
    }
    const thumbprint = certificateThumbprint(claims.cnf)
    if (
      thumbprint !== input.workloadIdentity.certificateThumbprint ||
      thumbprint !== input.executionToken.certificateThumbprint
    ) {
      throw new Error('ActionGrant certificate binding mismatch')
    }
    if (
      claims.principal_type !== 'DELEGATED' ||
      input.executionToken.principalType !== 'DELEGATED'
    ) {
      throw new Error('ActionGrant requires a matching DELEGATED ExecutionToken')
    }
    const humanPrincipalId = delegatedHumanId(input.executionToken.actor)
    const delegationId = textClaim(claims, 'delegation_id')
    if (
      textClaim(claims, 'sub') !== humanPrincipalId ||
      textClaim(claims, 'agent_id') !== input.executionToken.subject ||
      delegationId !== input.executionToken.delegationId
    ) {
      throw new Error('ActionGrant delegated attribution mismatch')
    }
    const tenantId = textClaim(claims, 'tenant_id')
    if (tenantId !== input.executionToken.tenantId) throw new Error('ActionGrant tenant mismatch')
    const orgId = optionalTextClaim(claims, 'org_id')
    if (orgId !== input.executionToken.orgId) throw new Error('ActionGrant organization mismatch')
    const issuedAt = integerClaim(claims, 'iat')
    const notBefore = integerClaim(claims, 'nbf')
    const expiresAt = integerClaim(claims, 'exp')
    const now = this.now()
    if (expiresAt <= now - this.clockSkewSeconds) throw new Error('ActionGrant is expired')
    if (issuedAt > now + this.clockSkewSeconds || notBefore > now + this.clockSkewSeconds) {
      throw new Error('ActionGrant is not active yet')
    }
    if (expiresAt <= issuedAt || expiresAt - issuedAt > 300) {
      throw new Error('ActionGrant lifetime exceeds the DG-1 maximum profile')
    }

    const descriptorDigest = actionDescriptorDigest(input.expectedDescriptor)
    const expected = {
      operation_key: input.expectedDescriptor.operationKey,
      tool_contract_id: input.expectedDescriptor.toolContract.id,
      tool_contract_version: input.expectedDescriptor.toolContract.version,
      target_digest: actionValueDigest(input.expectedDescriptor.target),
      input_digest: actionValueDigest(input.expectedDescriptor.input),
      descriptor_digest: descriptorDigest,
      idempotency_key: input.expectedDescriptor.idempotencyKey
    }
    for (const [claim, value] of Object.entries(expected)) {
      if (textClaim(claims, claim) !== value) throw new Error('ActionGrant descriptor mismatch')
    }

    return Object.freeze({
      actionGrantJti: textClaim(claims, 'jti'),
      humanPrincipalId,
      delegationId,
      agentPrincipalId: input.executionToken.subject,
      tenantId,
      ...(orgId === undefined ? {} : { orgId }),
      audience,
      operationKey: input.expectedDescriptor.operationKey,
      toolContractId: input.expectedDescriptor.toolContract.id,
      toolContractVersion: input.expectedDescriptor.toolContract.version,
      descriptorDigest,
      idempotencyKey: input.expectedDescriptor.idempotencyKey,
      confirmationReference: textClaim(claims, 'confirmation_ref'),
      authorizationDecisionReference: textClaim(claims, 'authorization_decision_ref'),
      ...optionalClaimProperty(claims, 'step_up_ref', 'stepUpReference'),
      expiresAt
    })
  }
}

/** Splits one ActionGrant compact JWS without accepting padding or additional segments. */
function splitCompactJws(token: string): [string, string, string] {
  const parts = typeof token === 'string' ? token.split('.') : []
  if (parts.length !== 3 || parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))) {
    throw new Error('ActionGrant must use compact JWS encoding')
  }
  return parts as [string, string, string]
}

/** Decodes a protected ActionGrant JSON object while rejecting arrays and primitives. */
function decodeObject(segment: string, label: string): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'))
    if (value === null || typeof value !== 'object' || Array.isArray(value))
      throw new Error('object required')
    return value as Record<string, unknown>
  } catch {
    throw new Error(`ActionGrant ${label} is invalid`)
  }
}

/** Enforces the exact ag+jwt ES256 protected header and rejects dynamic key-source fields. */
function assertHeader(header: Record<string, unknown>): void {
  if (
    header.alg !== 'ES256' ||
    header.typ !== 'ag+jwt' ||
    typeof header.kid !== 'string' ||
    header.kid.length === 0 ||
    Object.keys(header).some((field) => !HEADER_FIELDS.has(field))
  ) {
    throw new Error('ActionGrant protected header is invalid')
  }
}

/** Reads an exact non-empty string claim. */
function textClaim(claims: Record<string, unknown>, name: string): string {
  const value = claims[name]
  if (typeof value !== 'string' || value.length === 0 || value.trim() !== value) {
    throw new Error(`ActionGrant ${name} claim is invalid`)
  }
  return value
}

/** Reads an optional exact string claim. */
function optionalTextClaim(claims: Record<string, unknown>, name: string): string | undefined {
  return claims[name] === undefined ? undefined : textClaim(claims, name)
}

/** Reads a mandatory integer NumericDate claim. */
function integerClaim(claims: Record<string, unknown>, name: string): number {
  const value = claims[name]
  if (!Number.isInteger(value)) throw new Error(`ActionGrant ${name} claim is invalid`)
  return value as number
}

/** Reads standard x5t#S256 certificate confirmation without allowing additional cnf members. */
function certificateThumbprint(value: unknown): string {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('ActionGrant cnf claim is invalid')
  }
  const entries = Object.entries(value)
  if (entries.length !== 1 || entries[0]?.[0] !== 'x5t#S256')
    throw new Error('ActionGrant cnf claim is invalid')
  return assertThumbprint(entries[0][1])
}

/** Validates the standard unpadded SHA-256 certificate thumbprint. */
function assertThumbprint(value: unknown): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(value)) {
    throw new Error('ActionGrant certificate thumbprint is invalid')
  }
  return value
}

/** Resolves the HUMAN attribution frozen into a DELEGATED ExecutionToken act claim. */
function delegatedHumanId(actor: unknown): string {
  if (typeof actor === 'string' && actor.length > 0 && actor.trim() === actor) return actor
  if (actor !== null && typeof actor === 'object' && !Array.isArray(actor)) {
    const subject = (actor as Record<string, unknown>).sub
    if (typeof subject === 'string' && subject.length > 0 && subject.trim() === subject)
      return subject
  }
  throw new Error('DELEGATED ExecutionToken human actor is invalid')
}

/** Copies an optional signed claim to the immutable verified result. */
function optionalClaimProperty(
  claims: Record<string, unknown>,
  claimName: string,
  propertyName: string
): Record<string, string> {
  const value = optionalTextClaim(claims, claimName)
  return value === undefined ? {} : { [propertyName]: value }
}
