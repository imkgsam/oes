import type { SiteCredential } from '../types'

const CREDENTIAL_PREFIX = 'oes_site_cred_v1.'

const REQUIRED_CREDENTIAL_FIELDS = [
  'site_id',
  'client_id',
  'credential_id',
  'client_secret',
  'oes_base_url',
  'environment'
] as const

// parseSiteCredential decodes and validates the opaque OES_SITE_CREDENTIAL bundle.
export function parseSiteCredential(rawCredential: string): SiteCredential {
  if (!rawCredential?.startsWith(CREDENTIAL_PREFIX)) {
    throw new Error('Invalid OES_SITE_CREDENTIAL: expected oes_site_cred_v1 bundle')
  }

  let payload: Record<string, unknown>
  try {
    const encodedJson = rawCredential.slice(CREDENTIAL_PREFIX.length)
    payload = JSON.parse(Buffer.from(encodedJson, 'base64url').toString('utf8')) as Record<
      string,
      unknown
    >
  } catch {
    throw new Error('Invalid OES_SITE_CREDENTIAL: bundle payload is not valid base64url JSON')
  }

  for (const field of REQUIRED_CREDENTIAL_FIELDS) {
    if (typeof payload[field] !== 'string' || payload[field].trim().length === 0) {
      throw new Error(`Invalid OES_SITE_CREDENTIAL: missing required field ${field}`)
    }
  }

  const webhookSigningSecret =
    typeof payload.webhook_signing_secret === 'string' && payload.webhook_signing_secret.length > 0
      ? payload.webhook_signing_secret
      : payload.client_secret

  return {
    siteId: payload.site_id as string,
    clientId: payload.client_id as string,
    credentialId: payload.credential_id as string,
    clientSecret: payload.client_secret as string,
    webhookSigningSecret: webhookSigningSecret as string,
    oesBaseUrl: payload.oes_base_url as string,
    environment: payload.environment as string
  }
}
