import { createHash, createHmac } from 'node:crypto'

import {
  buildCanonicalRequest,
  buildWebhookCanonicalRequest,
  parseSiteCredential,
  signCanonicalRequest,
  verifyWebhookRequest
} from '../../src'

function encodeCredential(payload: Record<string, unknown>): string {
  return `oes_site_cred_v1.${Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')}`
}

describe('credential parsing and HMAC signing', () => {
  it('parses a v1 credential bundle and falls back webhook secret to client secret', () => {
    const credential = parseSiteCredential(
      encodeCredential({
        site_id: 'brand-us',
        client_id: 'client_123',
        credential_id: 'cred_123',
        client_secret: 'secret_123',
        oes_base_url: 'https://oes.example.test/site-api',
        environment: 'staging'
      })
    )

    expect(credential).toEqual({
      siteId: 'brand-us',
      clientId: 'client_123',
      credentialId: 'cred_123',
      clientSecret: 'secret_123',
      webhookSigningSecret: 'secret_123',
      oesBaseUrl: 'https://oes.example.test/site-api',
      environment: 'staging'
    })
  })

  it('rejects malformed or incomplete credential bundles without exposing secrets', () => {
    expect(() => parseSiteCredential('bad.prefix')).toThrow(/OES_SITE_CREDENTIAL/)
    expect(() =>
      parseSiteCredential(
        encodeCredential({
          site_id: 'brand-us',
          client_id: 'client_123',
          credential_id: 'cred_123',
          client_secret: 'secret_123',
          environment: 'staging'
        })
      )
    ).toThrow(/oes_base_url/)
  })

  it('builds the frozen canonical request and HMAC signature', () => {
    const canonical = buildCanonicalRequest({
      method: 'post',
      url: 'https://oes.example.test/site-api/sync/latest?b=2&a=hello world',
      body: JSON.stringify({ local_publish_version: 3 }),
      siteId: 'brand-us',
      clientId: 'client_123',
      credentialId: 'cred_123',
      timestamp: '1781488327000',
      nonce: 'nonce_abc'
    })

    const bodyHash = createHash('sha256')
      .update(JSON.stringify({ local_publish_version: 3 }))
      .digest('hex')

    expect(canonical).toBe(
      [
        'POST',
        '/site-api/sync/latest',
        'a=hello%20world&b=2',
        bodyHash,
        'x-oes-site-id:brand-us',
        'x-oes-client-id:client_123',
        'x-oes-credential-id:cred_123',
        'x-oes-timestamp:1781488327000',
        'x-oes-nonce:nonce_abc'
      ].join('\n')
    )
    expect(signCanonicalRequest(canonical, 'secret_123')).toBe(
      `v1=${createHmac('sha256', 'secret_123').update(canonical).digest('hex')}`
    )
  })

  it('verifies signed webhook requests and rejects replayed nonces before syncing', async () => {
    const credential = parseSiteCredential(
      encodeCredential({
        site_id: 'brand-us',
        client_id: 'client_123',
        credential_id: 'cred_123',
        client_secret: 'client_secret',
        webhook_signing_secret: 'webhook_secret',
        oes_base_url: 'https://oes.example.test/site-api',
        environment: 'local'
      })
    )
    const body = JSON.stringify({
      event_id: 'evt_1',
      site_id: 'brand-us',
      event_type: 'site.publish.available',
      publish_version: 12,
      occurred_at: '2026-06-15T00:00:00.000Z'
    })
    const timestamp = String(Date.now())
    const canonical = buildWebhookCanonicalRequest({
      method: 'POST',
      url: 'https://site.example.test/api/oes/webhook',
      body,
      siteId: 'brand-us',
      eventId: 'evt_1',
      timestamp,
      nonce: 'nonce-webhook-1'
    })
    const seen = new Set<string>()
    const first = await verifyWebhookRequest({
      credential,
      method: 'POST',
      url: 'https://site.example.test/api/oes/webhook',
      body,
      headers: {
        'x-oes-site-id': 'brand-us',
        'x-oes-timestamp': timestamp,
        'x-oes-nonce': 'nonce-webhook-1',
        'x-oes-event-id': 'evt_1',
        'x-oes-signature': signCanonicalRequest(canonical, 'webhook_secret')
      },
      nonceStore: {
        has: async (nonce) => seen.has(nonce),
        remember: async (nonce) => {
          seen.add(nonce)
        }
      },
      now: () => Number(timestamp)
    })

    expect(first).toEqual({ ok: true, duplicate: false, eventId: 'evt_1' })
    await expect(
      verifyWebhookRequest({
        credential,
        method: 'POST',
        url: 'https://site.example.test/api/oes/webhook',
        body,
        headers: {
          'x-oes-site-id': 'brand-us',
          'x-oes-timestamp': timestamp,
          'x-oes-nonce': 'nonce-webhook-1',
          'x-oes-event-id': 'evt_1',
          'x-oes-signature': signCanonicalRequest(canonical, 'webhook_secret')
        },
        nonceStore: {
          has: async (nonce) => seen.has(nonce),
          remember: async (nonce) => {
            seen.add(nonce)
          }
        },
        now: () => Number(timestamp)
      })
    ).rejects.toThrow(/NONCE_REPLAYED/)
  })
})
