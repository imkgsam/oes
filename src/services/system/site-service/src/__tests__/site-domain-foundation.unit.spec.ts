import { createHash, createHmac } from 'node:crypto'
import { SiteAggregate } from '../domain/site/site.aggregate'
import { SiteStatus } from '../domain/site/site.enums'
import { SiteDomainError } from '../domain/site/site.errors'
import {
  buildCanonicalRequest,
  createCredentialBundle,
  formatSignature,
  verifySignedSiteRequest
} from '../domain/security/site-request-signing'
import { buildWebhookCanonicalRequest, signSiteWebhook } from '../domain/security/site-webhook-signing'
import { InMemoryNonceReplayStore } from '../domain/security/nonce-replay-store'
import { sanitizeSiteHtml } from '../domain/content/site-html-sanitizer'

describe('site-service domain foundation Unit', () => {
  it('Site lifecycle / creates a draft site with exactly one active default locale', () => {
    const site = SiteAggregate.createDraft({
      siteId: 'site_brand_us',
      tenantId: 'tenant_a',
      siteCode: 'brand-us',
      siteName: 'Brand US',
      siteType: 'brand',
      defaultLocale: 'en-US',
      operatorId: 'operator_a'
    })

    expect(site.status).toBe(SiteStatus.DRAFT)
    expect(site.defaultLocale).toBe('en-US')
    expect(site.locales).toEqual([
      expect.objectContaining({
        locale: 'en-US',
        isDefault: true,
        status: 'active'
      })
    ])
  })

  it('SiteLocale lifecycle / rejects disabling the default locale', () => {
    const site = SiteAggregate.createDraft({
      siteId: 'site_brand_us',
      tenantId: 'tenant_a',
      siteCode: 'brand-us',
      siteName: 'Brand US',
      siteType: 'brand',
      defaultLocale: 'en-US',
      operatorId: 'operator_a'
    })

    expect(() => site.disableLocale('en-US')).toThrow(SiteDomainError)
  })

  it('Credential bundle / emits the frozen opaque OES_SITE_CREDENTIAL format', () => {
    const bundle = createCredentialBundle({
      siteId: 'site_brand_us',
      clientId: 'client_a',
      credentialId: 'cred_a',
      clientSecret: 'client_secret_a',
      webhookSigningSecret: 'webhook_secret_a',
      oesBaseUrl: 'https://oes.example.com/api/site/v1',
      environment: 'staging'
    })
    const encoded = bundle.replace('oes_site_cred_v1.', '')
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))

    expect(bundle.startsWith('oes_site_cred_v1.')).toBe(true)
    expect(parsed).toEqual({
      site_id: 'site_brand_us',
      client_id: 'client_a',
      credential_id: 'cred_a',
      client_secret: 'client_secret_a',
      webhook_signing_secret: 'webhook_secret_a',
      oes_base_url: 'https://oes.example.com/api/site/v1',
      environment: 'staging'
    })
  })

  it('Webhook signing / uses the dedicated P1 canonical request without client credential headers', () => {
    const body = Buffer.from('{"event_id":"event_a","site_id":"site_brand_us"}')
    const canonicalRequest = buildWebhookCanonicalRequest({
      method: 'post',
      path: '/oes/webhooks/site',
      normalizedQuery: '',
      body,
      siteId: 'site_brand_us',
      eventId: 'event_a',
      timestamp: '1781496000000',
      nonce: 'nonce_webhook_a'
    })
    const signed = signSiteWebhook({
      method: 'post',
      path: '/oes/webhooks/site',
      normalizedQuery: '',
      body,
      siteId: 'site_brand_us',
      eventId: 'event_a',
      timestamp: '1781496000000',
      nonce: 'nonce_webhook_a',
      secret: 'webhook_secret_a'
    })

    expect(canonicalRequest.split('\n')).toEqual([
      'POST',
      '/oes/webhooks/site',
      '',
      createHash('sha256').update(body).digest('hex'),
      'x-oes-site-id:site_brand_us',
      'x-oes-event-id:event_a',
      'x-oes-timestamp:1781496000000',
      'x-oes-nonce:nonce_webhook_a'
    ])
    expect(canonicalRequest).not.toContain('x-oes-client-id')
    expect(canonicalRequest).not.toContain('x-oes-credential-id')
    expect(signed.signature).toMatch(/^v1=[a-f0-9]{64}$/)
  })

  it('Signed request / builds and verifies the frozen canonical HMAC request', async () => {
    const body = JSON.stringify({ local_publish_version: 3 })
    const timestamp = Date.parse('2026-06-15T08:00:00.000Z')
    const nonceStore = new InMemoryNonceReplayStore()
    const canonicalRequest = buildCanonicalRequest({
      method: 'post',
      path: '/api/site/v1/sync/latest',
      query: { b: '2', a: '1' },
      body,
      siteId: 'site_brand_us',
      clientId: 'client_a',
      credentialId: 'cred_a',
      timestamp: `${timestamp}`,
      nonce: 'nonce_128_bits_abcdef'
    })
    const expectedBodyHash = createHash('sha256').update(body).digest('hex')
    const expectedSignature = createHmac('sha256', 'client_secret_a')
      .update(canonicalRequest)
      .digest('hex')

    expect(canonicalRequest.split('\n')).toEqual([
      'POST',
      '/api/site/v1/sync/latest',
      'a=1&b=2',
      expectedBodyHash,
      'x-oes-site-id:site_brand_us',
      'x-oes-client-id:client_a',
      'x-oes-credential-id:cred_a',
      `x-oes-timestamp:${timestamp}`,
      'x-oes-nonce:nonce_128_bits_abcdef'
    ])

    const result = await verifySignedSiteRequest(
      {
        method: 'POST',
        path: '/api/site/v1/sync/latest',
        query: { a: '1', b: '2' },
        body,
        headers: {
          'x-oes-site-id': 'site_brand_us',
          'x-oes-client-id': 'client_a',
          'x-oes-credential-id': 'cred_a',
          'x-oes-timestamp': `${timestamp}`,
          'x-oes-nonce': 'nonce_128_bits_abcdef',
          'x-oes-signature': formatSignature(expectedSignature),
          'x-oes-request-id': 'request_a',
          'x-oes-trace-id': 'trace_a'
        }
      },
      {
        now: new Date(timestamp + 1000),
        requiredScope: 'site:sync',
        nonceStore,
        credential: {
          siteId: 'site_brand_us',
          clientId: 'client_a',
          credentialId: 'cred_a',
          clientSecret: 'client_secret_a',
          scopes: ['site:read', 'site:sync'],
          status: 'active',
          siteStatus: 'active'
        }
      }
    )

    expect(result).toEqual({
      ok: true,
      siteId: 'site_brand_us',
      clientId: 'client_a',
      credentialId: 'cred_a',
      requestId: 'request_a',
      traceId: 'trace_a'
    })
  })

  it('Signed request / rejects nonce replay and insufficient scope with fail-closed errors', async () => {
    const timestamp = Date.parse('2026-06-15T08:00:00.000Z')
    const nonceStore = new InMemoryNonceReplayStore()
    const canonicalRequest = buildCanonicalRequest({
      method: 'GET',
      path: '/api/site/v1/sync/latest',
      query: {},
      body: '',
      siteId: 'site_brand_us',
      clientId: 'client_a',
      credentialId: 'cred_a',
      timestamp: `${timestamp}`,
      nonce: 'nonce_replay_abcdef'
    })
    const signature = createHmac('sha256', 'client_secret_a')
      .update(canonicalRequest)
      .digest('hex')
    const request = {
      method: 'GET',
      path: '/api/site/v1/sync/latest',
      query: {},
      body: '',
      headers: {
        'x-oes-site-id': 'site_brand_us',
        'x-oes-client-id': 'client_a',
        'x-oes-credential-id': 'cred_a',
        'x-oes-timestamp': `${timestamp}`,
        'x-oes-nonce': 'nonce_replay_abcdef',
        'x-oes-signature': formatSignature(signature),
        'x-oes-request-id': 'request_a',
        'x-oes-trace-id': 'trace_a'
      }
    }
    const credential = {
      siteId: 'site_brand_us',
      clientId: 'client_a',
      credentialId: 'cred_a',
      clientSecret: 'client_secret_a',
      scopes: ['site:read'],
      status: 'active' as const,
      siteStatus: 'active' as const
    }

    await expect(
      verifySignedSiteRequest(request, {
        now: new Date(timestamp),
        requiredScope: 'site:sync',
        nonceStore,
        credential
      })
    ).resolves.toEqual(
      expect.objectContaining({
        ok: false,
        errorCode: 'SCOPE_INSUFFICIENT'
      })
    )

    await expect(
      verifySignedSiteRequest(request, {
        now: new Date(timestamp),
        requiredScope: 'site:read',
        nonceStore,
        credential
      })
    ).resolves.toEqual(expect.objectContaining({ ok: true }))

    await expect(
      verifySignedSiteRequest(request, {
        now: new Date(timestamp),
        requiredScope: 'site:read',
        nonceStore,
        credential
      })
    ).resolves.toEqual(
      expect.objectContaining({
        ok: false,
        errorCode: 'NONCE_REPLAYED'
      })
    )
  })

  it('Content sanitizer / removes scripts, inline event handlers, and untrusted iframes', () => {
    const sanitized = sanitizeSiteHtml(`
      <h1 onclick="steal()">Title</h1>
      <script>alert('x')</script>
      <p>Safe <strong>copy</strong></p>
      <iframe src="https://evil.example/embed"></iframe>
      <iframe src="https://www.youtube.com/embed/video-id"></iframe>
    `)

    expect(sanitized).toContain('<h1>Title</h1>')
    expect(sanitized).toContain('<strong>copy</strong>')
    expect(sanitized).toContain('https://www.youtube.com/embed/video-id')
    expect(sanitized).not.toContain('onclick')
    expect(sanitized).not.toContain('<script')
    expect(sanitized).not.toContain('evil.example')
  })
})
