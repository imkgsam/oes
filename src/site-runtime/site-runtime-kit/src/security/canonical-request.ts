import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'

export interface CanonicalRequestInput {
  method: string
  url: string
  body?: string | Buffer | null
  siteId: string
  clientId: string
  credentialId: string
  timestamp: string
  nonce: string
}

export interface WebhookCanonicalRequestInput {
  method: string
  url: string
  body?: string | Buffer | null
  siteId: string
  eventId: string
  timestamp: string
  nonce: string
}

// buildCanonicalRequest creates the frozen newline-delimited request string used for HMAC signing.
export function buildCanonicalRequest(input: CanonicalRequestInput): string {
  const url = new URL(input.url)
  return [
    input.method.toUpperCase(),
    url.pathname || '/',
    normalizeQuery(url.searchParams),
    hashBody(input.body),
    `x-oes-site-id:${input.siteId}`,
    `x-oes-client-id:${input.clientId}`,
    `x-oes-credential-id:${input.credentialId}`,
    `x-oes-timestamp:${input.timestamp}`,
    `x-oes-nonce:${input.nonce}`
  ].join('\n')
}

// buildWebhookCanonicalRequest creates the frozen webhook-specific HMAC string used by OES.
export function buildWebhookCanonicalRequest(input: WebhookCanonicalRequestInput): string {
  const url = new URL(input.url)
  return [
    input.method.toUpperCase(),
    url.pathname || '/',
    normalizeQuery(url.searchParams),
    hashBody(input.body),
    `x-oes-site-id:${input.siteId}`,
    `x-oes-event-id:${input.eventId}`,
    `x-oes-timestamp:${input.timestamp}`,
    `x-oes-nonce:${input.nonce}`
  ].join('\n')
}

// signCanonicalRequest returns the v1 lowercase hex HMAC-SHA256 signature header value.
export function signCanonicalRequest(canonicalRequest: string, secret: string): string {
  return `v1=${createHmac('sha256', secret).update(canonicalRequest).digest('hex')}`
}

// verifySignature compares a supplied signature with the expected HMAC without leaking timing.
export function verifySignature(canonicalRequest: string, secret: string, signature: string): boolean {
  const expected = signCanonicalRequest(canonicalRequest, secret)
  const expectedBuffer = Buffer.from(expected)
  const suppliedBuffer = Buffer.from(signature)
  return (
    expectedBuffer.length === suppliedBuffer.length &&
    timingSafeEqual(expectedBuffer, suppliedBuffer)
  )
}

// createNonce returns a 128-bit random base64url nonce for signed requests.
export function createNonce(): string {
  return randomBytes(16).toString('base64url')
}

// createRequestId returns a globally unique request id for OES signed request headers.
export function createRequestId(): string {
  return randomUUID()
}

// hashBody produces the lowercase SHA-256 hash of the exact request body bytes.
export function hashBody(body?: string | Buffer | null): string {
  const normalizedBody = body ?? ''
  return createHash('sha256').update(normalizedBody).digest('hex')
}

// normalizeQuery encodes and sorts query pairs using RFC3986-compatible escaping.
function normalizeQuery(searchParams: URLSearchParams): string {
  const pairs = Array.from(searchParams.entries()).sort(([leftKey, leftValue], [rightKey, rightValue]) => {
    if (leftKey === rightKey) {
      return leftValue.localeCompare(rightValue)
    }
    return leftKey.localeCompare(rightKey)
  })

  return pairs
    .map(([key, value]) => `${rfc3986Encode(key)}=${rfc3986Encode(value)}`)
    .join('&')
}

// rfc3986Encode encodes query components with stable uppercase percent escapes.
function rfc3986Encode(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  )
}
