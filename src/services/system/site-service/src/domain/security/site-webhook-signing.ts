import { createHash, createHmac } from 'node:crypto'

export interface WebhookCanonicalRequestInput {
  method: string
  path: string
  normalizedQuery?: string
  body?: string | Buffer
  bodySha256?: string
  siteId: string
  eventId: string
  timestamp: string
  nonce: string
}

export interface SignSiteWebhookInput extends WebhookCanonicalRequestInput {
  secret: string
}

/** buildWebhookCanonicalRequest builds the frozen P1 OES-to-runtime webhook string for HMAC coverage. */
export function buildWebhookCanonicalRequest(input: WebhookCanonicalRequestInput): string {
  return [
    input.method.toUpperCase(),
    input.path,
    input.normalizedQuery ?? '',
    input.bodySha256 ?? sha256Hex(input.body ?? ''),
    `x-oes-site-id:${input.siteId}`,
    `x-oes-event-id:${input.eventId}`,
    `x-oes-timestamp:${input.timestamp}`,
    `x-oes-nonce:${input.nonce}`
  ].join('\n')
}

/** signSiteWebhook signs one OES-to-runtime webhook with the dedicated P1 webhook canonical request. */
export function signSiteWebhook(input: SignSiteWebhookInput): { signature: string; canonicalRequest: string } {
  const canonicalRequest = buildWebhookCanonicalRequest(input)
  const signature = createHmac('sha256', input.secret).update(canonicalRequest).digest('hex')

  return {
    canonicalRequest,
    signature: `v1=${signature.toLowerCase()}`
  }
}

/** sha256Hex hashes a webhook body using lowercase hexadecimal SHA-256. */
function sha256Hex(body: string | Buffer): string {
  return createHash('sha256').update(body).digest('hex')
}
