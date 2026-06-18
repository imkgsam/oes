import type { SiteCredential } from '../types'
import { buildWebhookCanonicalRequest, verifySignature } from './canonical-request'

export interface NonceReplayStore {
  has(nonce: string): Promise<boolean>
  remember(nonce: string): Promise<void>
}

export interface WebhookVerificationInput {
  credential: SiteCredential
  method: string
  url: string
  body: string
  headers: Record<string, string | string[] | undefined>
  nonceStore: NonceReplayStore
  now?: () => number
}

export interface WebhookVerificationResult {
  ok: true
  duplicate: boolean
  eventId: string
}

// verifyWebhookRequest fail-closed validates OES webhook identity, replay windows, and HMAC signature.
export async function verifyWebhookRequest(
  input: WebhookVerificationInput
): Promise<WebhookVerificationResult> {
  const siteId = singleHeader(input.headers, 'x-oes-site-id')
  const timestamp = singleHeader(input.headers, 'x-oes-timestamp')
  const nonce = singleHeader(input.headers, 'x-oes-nonce')
  const eventId = singleHeader(input.headers, 'x-oes-event-id')
  const signature = singleHeader(input.headers, 'x-oes-signature')

  if (!siteId || siteId !== input.credential.siteId) {
    throw new Error('WEBHOOK_SITE_MISMATCH')
  }
  if (!timestamp || !/^\d+$/.test(timestamp)) {
    throw new Error('TIMESTAMP_INVALID')
  }
  if (Math.abs((input.now?.() ?? Date.now()) - Number(timestamp)) > 5 * 60 * 1000) {
    throw new Error('TIMESTAMP_EXPIRED')
  }
  if (!nonce) {
    throw new Error('NONCE_MISSING')
  }
  if (await input.nonceStore.has(nonce)) {
    throw new Error('NONCE_REPLAYED')
  }
  if (!eventId) {
    throw new Error('EVENT_ID_MISSING')
  }

  const payload = parseWebhookPayload(input.body)
  if (payload.event_id !== eventId) {
    throw new Error('EVENT_ID_MISMATCH')
  }
  if (payload.site_id !== input.credential.siteId) {
    throw new Error('WEBHOOK_SITE_MISMATCH')
  }
  if (payload.event_type !== 'site.publish.available') {
    throw new Error('EVENT_TYPE_UNSUPPORTED')
  }

  const canonical = buildWebhookCanonicalRequest({
    method: input.method,
    url: input.url,
    body: input.body,
    siteId,
    eventId,
    timestamp,
    nonce
  })
  if (!signature || !verifySignature(canonical, input.credential.webhookSigningSecret, signature)) {
    throw new Error('SIGNATURE_INVALID')
  }

  await input.nonceStore.remember(nonce)
  return { ok: true, duplicate: false, eventId }
}

// singleHeader normalizes Node/Nest style request headers into a single string value.
function singleHeader(headers: Record<string, string | string[] | undefined>, name: string): string | undefined {
  const value = headers[name] ?? headers[name.toLowerCase()]
  return Array.isArray(value) ? value[0] : value
}

// parseWebhookPayload validates the minimal site.publish.available event body.
function parseWebhookPayload(body: string): { event_id: string; site_id: string; event_type: string } {
  try {
    const payload = JSON.parse(body) as Record<string, unknown>
    return {
      event_id: String(payload.event_id ?? ''),
      site_id: String(payload.site_id ?? ''),
      event_type: String(payload.event_type ?? '')
    }
  } catch {
    throw new Error('WEBHOOK_PAYLOAD_INVALID')
  }
}
