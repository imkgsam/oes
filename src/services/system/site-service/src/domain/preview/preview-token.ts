import { createHmac, timingSafeEqual } from 'node:crypto'

export interface IssuePreviewTokenInput {
  secret: string
  now: Date
  siteId: string
  resourceType: 'product' | 'blog' | 'news'
  resourceId: string
  locale: string
  operatorId: string
}

export interface IssuedPreviewToken {
  token: string
  expiresAt: Date
}

export interface ValidatePreviewTokenInput {
  secret: string
  now: Date
  expectedSiteId: string
  expectedResourceType: 'product' | 'blog' | 'news'
  expectedResourceId: string
  expectedLocale: string
}

export type PreviewTokenValidationResult =
  | { ok: true; operatorId: string; expiresAt: Date }
  | { ok: false; errorCode: 'TOKEN_EXPIRED' | 'TOKEN_INVALID' | 'TOKEN_RESOURCE_MISMATCH' }

interface PreviewTokenPayload {
  site_id: string
  resource_type: 'product' | 'blog' | 'news'
  resource_id: string
  locale: string
  operator_id: string
  expires_at: string
}

const PREVIEW_TOKEN_PREFIX = 'oes_preview_v1'
const PREVIEW_TOKEN_TTL_MS = 15 * 60 * 1000

/** issuePreviewToken creates a signed opaque token that binds preview access to one saved draft target. */
export function issuePreviewToken(input: IssuePreviewTokenInput): IssuedPreviewToken {
  const expiresAt = new Date(input.now.getTime() + PREVIEW_TOKEN_TTL_MS)
  const payload: PreviewTokenPayload = {
    site_id: input.siteId,
    resource_type: input.resourceType,
    resource_id: input.resourceId,
    locale: input.locale,
    operator_id: input.operatorId,
    expires_at: expiresAt.toISOString()
  }
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  const signature = signPreviewPayload(encodedPayload, input.secret)

  return {
    token: `${PREVIEW_TOKEN_PREFIX}.${encodedPayload}.${signature}`,
    expiresAt
  }
}

/** validatePreviewToken verifies signature, expiry, and bound preview resource identity. */
export function validatePreviewToken(
  token: string,
  input: ValidatePreviewTokenInput
): PreviewTokenValidationResult {
  const parts = token.split('.')
  if (parts.length !== 3 || parts[0] !== PREVIEW_TOKEN_PREFIX) {
    return { ok: false, errorCode: 'TOKEN_INVALID' }
  }

  const [, encodedPayload, signature] = parts
  if (!safeEqual(signature, signPreviewPayload(encodedPayload, input.secret))) {
    return { ok: false, errorCode: 'TOKEN_INVALID' }
  }

  const payload = parsePayload(encodedPayload)
  if (!payload) {
    return { ok: false, errorCode: 'TOKEN_INVALID' }
  }

  const expiresAt = new Date(payload.expires_at)
  if (Number.isNaN(expiresAt.getTime())) {
    return { ok: false, errorCode: 'TOKEN_INVALID' }
  }
  if (expiresAt.getTime() <= input.now.getTime()) {
    return { ok: false, errorCode: 'TOKEN_EXPIRED' }
  }

  if (
    payload.site_id !== input.expectedSiteId ||
    payload.resource_type !== input.expectedResourceType ||
    payload.resource_id !== input.expectedResourceId ||
    payload.locale !== input.expectedLocale
  ) {
    return { ok: false, errorCode: 'TOKEN_RESOURCE_MISMATCH' }
  }

  return {
    ok: true,
    operatorId: payload.operator_id,
    expiresAt
  }
}

/** signPreviewPayload signs the encoded preview payload without embedding draft content. */
function signPreviewPayload(encodedPayload: string, secret: string): string {
  return createHmac('sha256', secret).update(encodedPayload).digest('hex')
}

/** parsePayload decodes one preview payload while keeping malformed tokens fail-closed. */
function parsePayload(encodedPayload: string): PreviewTokenPayload | null {
  try {
    return JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as PreviewTokenPayload
  } catch {
    return null
  }
}

/** safeEqual compares token signatures using a constant-time primitive when lengths match. */
function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}
