import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { NonceReplayStore } from './nonce-replay-store'

export type SiteCredentialStatus = 'active' | 'rotating' | 'revoked'
export type SignedSiteRequestErrorCode =
  | 'AUTH_MISSING'
  | 'CREDENTIAL_REVOKED'
  | 'NONCE_REPLAYED'
  | 'SCOPE_INSUFFICIENT'
  | 'SIGNATURE_INVALID'
  | 'SITE_DISABLED'
  | 'TIMESTAMP_EXPIRED'

export interface CredentialBundleInput {
  siteId: string
  clientId: string
  credentialId: string
  clientSecret: string
  webhookSigningSecret?: string | null
  oesBaseUrl: string
  environment: string
}

export interface CanonicalRequestInput {
  method: string
  path: string
  query?: Record<string, string | string[] | undefined>
  normalizedQuery?: string
  body?: string | Buffer
  bodySha256?: string
  siteId: string
  clientId: string
  credentialId: string
  timestamp: string
  nonce: string
}

export interface SignedSiteRequest {
  method: string
  path: string
  query?: Record<string, string | string[] | undefined>
  normalizedQuery?: string
  body?: string | Buffer
  bodySha256?: string
  headers: Record<string, string | undefined>
}

export interface SiteCredentialVerificationRecord {
  siteId: string
  clientId: string
  credentialId: string
  clientSecret: string
  scopes: string[]
  status: SiteCredentialStatus
  siteStatus: 'active' | 'draft' | 'disabled'
}

export interface VerifySignedSiteRequestOptions {
  now: Date
  requiredScope: string
  nonceStore: NonceReplayStore
  credential: SiteCredentialVerificationRecord | null
  allowedClockSkewMilliseconds?: number
}

export type SignedSiteRequestVerificationResult =
  | {
      ok: true
      siteId: string
      clientId: string
      credentialId: string
      requestId: string
      traceId: string
    }
  | {
      ok: false
      errorCode: SignedSiteRequestErrorCode
      requestId: string | null
      traceId: string | null
    }

const CREDENTIAL_PREFIX = 'oes_site_cred_v1.'
const SIGNATURE_PREFIX = 'v1='
const DEFAULT_CLOCK_SKEW_MILLISECONDS = 5 * 60 * 1000

/** createCredentialBundle serializes one OES_SITE_CREDENTIAL bundle in the frozen v1 format. */
export function createCredentialBundle(input: CredentialBundleInput): string {
  const payload = {
    site_id: input.siteId,
    client_id: input.clientId,
    credential_id: input.credentialId,
    client_secret: input.clientSecret,
    ...(input.webhookSigningSecret ? { webhook_signing_secret: input.webhookSigningSecret } : {}),
    oes_base_url: input.oesBaseUrl,
    environment: input.environment
  }

  return `${CREDENTIAL_PREFIX}${Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')}`
}

/** buildCanonicalRequest builds the newline-joined request string covered by HMAC-SHA256. */
export function buildCanonicalRequest(input: CanonicalRequestInput): string {
  return [
    input.method.toUpperCase(),
    input.path,
    input.normalizedQuery ?? normalizeQuery(input.query ?? {}),
    input.bodySha256 ?? sha256Hex(input.body ?? ''),
    `x-oes-site-id:${input.siteId}`,
    `x-oes-client-id:${input.clientId}`,
    `x-oes-credential-id:${input.credentialId}`,
    `x-oes-timestamp:${input.timestamp}`,
    `x-oes-nonce:${input.nonce}`
  ].join('\n')
}

/** formatSignature adds the frozen v1 signature prefix to a lowercase HMAC hex digest. */
export function formatSignature(hexDigest: string): string {
  return `${SIGNATURE_PREFIX}${hexDigest.toLowerCase()}`
}

/** verifySignedSiteRequest validates signed Site Runtime calls with fail-closed error semantics. */
export async function verifySignedSiteRequest(
  request: SignedSiteRequest,
  options: VerifySignedSiteRequestOptions
): Promise<SignedSiteRequestVerificationResult> {
  const headers = normalizeHeaders(request.headers)
  const requestId = headers['x-oes-request-id'] ?? null
  const traceId = headers['x-oes-trace-id'] ?? null
  const siteId = headers['x-oes-site-id']
  const clientId = headers['x-oes-client-id']
  const credentialId = headers['x-oes-credential-id']
  const timestamp = headers['x-oes-timestamp']
  const nonce = headers['x-oes-nonce']
  const signature = headers['x-oes-signature']

  if (!siteId || !clientId || !credentialId || !timestamp || !nonce || !signature || !requestId || !traceId) {
    return { ok: false, errorCode: 'AUTH_MISSING', requestId, traceId }
  }

  const timestampNumber = Number(timestamp)
  const allowedClockSkew = options.allowedClockSkewMilliseconds ?? DEFAULT_CLOCK_SKEW_MILLISECONDS
  if (!Number.isSafeInteger(timestampNumber) || Math.abs(options.now.getTime() - timestampNumber) > allowedClockSkew) {
    return { ok: false, errorCode: 'TIMESTAMP_EXPIRED', requestId, traceId }
  }

  if (!options.credential) {
    return { ok: false, errorCode: 'AUTH_MISSING', requestId, traceId }
  }

  const credential = options.credential
  if (credential.siteId !== siteId || credential.clientId !== clientId || credential.credentialId !== credentialId) {
    return { ok: false, errorCode: 'SIGNATURE_INVALID', requestId, traceId }
  }
  if (credential.status === 'revoked') {
    return { ok: false, errorCode: 'CREDENTIAL_REVOKED', requestId, traceId }
  }
  if (credential.siteStatus === 'disabled') {
    return { ok: false, errorCode: 'SITE_DISABLED', requestId, traceId }
  }
  if (!credential.scopes.includes(options.requiredScope)) {
    return { ok: false, errorCode: 'SCOPE_INSUFFICIENT', requestId, traceId }
  }

  const canonicalRequest = buildCanonicalRequest({
    method: request.method,
    path: request.path,
    query: request.query,
    normalizedQuery: request.normalizedQuery,
    body: request.body,
    bodySha256: request.bodySha256,
    siteId,
    clientId,
    credentialId,
    timestamp,
    nonce
  })
  const expected = formatSignature(createHmac('sha256', credential.clientSecret).update(canonicalRequest).digest('hex'))

  if (!safeEqual(signature, expected)) {
    return { ok: false, errorCode: 'SIGNATURE_INVALID', requestId, traceId }
  }

  const nonceAccepted = await options.nonceStore.remember({
    siteId,
    credentialId,
    nonce,
    now: options.now,
    ttlMilliseconds: allowedClockSkew
  })

  if (!nonceAccepted) {
    return { ok: false, errorCode: 'NONCE_REPLAYED', requestId, traceId }
  }

  return { ok: true, siteId, clientId, credentialId, requestId, traceId }
}

/** sha256Hex hashes a request body using lowercase hexadecimal SHA-256. */
function sha256Hex(body: string | Buffer): string {
  return createHash('sha256').update(body).digest('hex')
}

/** normalizeHeaders lowercases header names while preserving string values. */
function normalizeHeaders(headers: Record<string, string | undefined>): Record<string, string | undefined> {
  return Object.entries(headers).reduce<Record<string, string | undefined>>((normalized, [key, value]) => {
    normalized[key.toLowerCase()] = value
    return normalized
  }, {})
}

/** normalizeQuery serializes query parameters with stable RFC3986 key/value ordering. */
function normalizeQuery(query: Record<string, string | string[] | undefined>): string {
  const pairs: Array<[string, string]> = []
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) {
      continue
    }
    const values = Array.isArray(value) ? value : [value]
    for (const item of values) {
      pairs.push([key, item])
    }
  }

  return pairs
    .sort(([leftKey, leftValue], [rightKey, rightValue]) =>
      leftKey === rightKey ? leftValue.localeCompare(rightValue) : leftKey.localeCompare(rightKey)
    )
    .map(([key, value]) => `${encodeRfc3986(key)}=${encodeRfc3986(value)}`)
    .join('&')
}

/** encodeRfc3986 encodes query keys and values using strict percent escaping. */
function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  )
}

/** safeEqual compares signatures without leaking prefix-length timing details. */
function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}
