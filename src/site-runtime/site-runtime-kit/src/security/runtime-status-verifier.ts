import type { SiteCredential } from '../types'
import { buildCanonicalRequest, verifySignature } from './canonical-request'

export interface RuntimeStatusVerificationInput {
  credential: SiteCredential
  method: string
  url: string
  headers: Record<string, string | string[] | undefined>
  body?: string
  now?: () => number
  nonceStore?: {
    has(nonce: string): Promise<boolean>
    remember(nonce: string): Promise<void>
  }
}

// verifyRuntimeStatusRequest protects OES runtime-status polling with the webhook signing secret.
export async function verifyRuntimeStatusRequest(input: RuntimeStatusVerificationInput): Promise<void> {
  const siteId = singleHeader(input.headers, 'x-oes-site-id')
  const timestamp = singleHeader(input.headers, 'x-oes-timestamp')
  const nonce = singleHeader(input.headers, 'x-oes-nonce')
  const signature = singleHeader(input.headers, 'x-oes-signature')
  if (!siteId || siteId !== input.credential.siteId) {
    throw new Error('RUNTIME_STATUS_SITE_MISMATCH')
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
  if (await input.nonceStore?.has(nonce)) {
    throw new Error('NONCE_REPLAYED')
  }
  const canonical = buildCanonicalRequest({
    method: input.method,
    url: input.url,
    body: input.body ?? '',
    siteId,
    clientId: '',
    credentialId: '',
    timestamp,
    nonce
  })
  if (!signature || !verifySignature(canonical, input.credential.webhookSigningSecret, signature)) {
    throw new Error('SIGNATURE_INVALID')
  }
  await input.nonceStore?.remember(nonce)
}

// singleHeader normalizes Node/Nest style headers into a single string value.
function singleHeader(headers: Record<string, string | string[] | undefined>, name: string): string | undefined {
  const value = headers[name] ?? headers[name.toLowerCase()]
  return Array.isArray(value) ? value[0] : value
}
