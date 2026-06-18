import { createHash } from 'node:crypto'

import {
  parseSiteCredential,
  signCanonicalRequest,
  SignedOesClient,
  SiteRuntimeError
} from '../../src'

function encodeCredential(payload: Record<string, unknown>): string {
  return `oes_site_cred_v1.${Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')}`
}

describe('SignedOesClient', () => {
  it('sends frozen signed headers for Site-facing API calls', async () => {
    const baseUrl = 'https://oes.example.test/site-api'
    const fetchMock = jest.fn(async (url: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers)
      const body = String(init?.body ?? '')
      expect(init?.method).toBe('POST')
      expect(url).toBe('https://oes.example.test/site-api/sync/latest')
      expect(headers.get('x-oes-site-id')).toBe('brand-us')
      expect(headers.get('x-oes-client-id')).toBe('client_123')
      expect(headers.get('x-oes-credential-id')).toBe('cred_123')
      expect(headers.get('x-oes-request-id')).toBe('request_1')
      expect(headers.get('x-oes-trace-id')).toBe('trace_1')
      const bodyHash = createHash('sha256').update(body).digest('hex')
      const canonical = [
        init?.method ?? 'POST',
        '/site-api/sync/latest',
        '',
        bodyHash,
        'x-oes-site-id:brand-us',
        'x-oes-client-id:client_123',
        'x-oes-credential-id:cred_123',
        `x-oes-timestamp:${String(headers.get('x-oes-timestamp'))}`,
        `x-oes-nonce:${String(headers.get('x-oes-nonce'))}`
      ].join('\n')
      expect(headers.get('x-oes-signature')).toBe(signCanonicalRequest(canonical, 'client_secret'))
      return new Response(
          JSON.stringify({
            site_id: 'brand-us',
            latest_publish_version: 3,
            latest_sync_id: 'sync_3',
            has_updates: true,
            server_time: '2026-06-15T00:00:00.000Z'
          }),
          { headers: { 'content-type': 'application/json' } }
        )
    })
    const credential = parseSiteCredential(
      encodeCredential({
        site_id: 'brand-us',
        client_id: 'client_123',
        credential_id: 'cred_123',
        client_secret: 'client_secret',
        oes_base_url: baseUrl,
        environment: 'local'
      })
    )
    const client = new SignedOesClient({
      credential,
      fetch: fetchMock,
      requestIdFactory: () => 'request_1',
      traceIdFactory: () => 'trace_1',
      nonceFactory: () => 'nonce_1',
      now: () => 1781488327000
    })

    await expect(client.getLatestPublishState(1)).resolves.toEqual({
      site_id: 'brand-us',
      latest_publish_version: 3,
      latest_sync_id: 'sync_3',
      has_updates: true,
      server_time: '2026-06-15T00:00:00.000Z'
    })
  })

  it('normalizes api-gateway response envelopes and generated camelCase DTO fields', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(new Response(
        JSON.stringify({
          code: 0,
          data: {
            siteId: 'brand-us',
            latestPublishVersion: 4,
            latestSyncId: 'sync_4',
            hasUpdates: true,
            serverTime: '2026-06-15T01:00:00.000Z'
          },
          meta: {}
        }),
        { headers: { 'content-type': 'application/json' } }
      ))
      .mockResolvedValueOnce(new Response(
        JSON.stringify({
          code: 0,
          data: {
            publicViews: [
              {
                siteId: 'brand-us',
                resourceType: 'product',
                resourceId: 'product_1',
                locale: 'en-US',
                slug: 'basin',
                status: 'published',
                publishVersion: 4,
                updatedAt: '2026-06-15T01:00:00.000Z',
                payloadJson: '{"display_title":"Basin"}'
              }
            ],
            missingResources: [],
            serverPublishVersion: 4
          },
          meta: {}
        }),
        { headers: { 'content-type': 'application/json' } }
      ))
    const client = new SignedOesClient({
      credential: parseSiteCredential(
        encodeCredential({
          site_id: 'brand-us',
          client_id: 'client_123',
          credential_id: 'cred_123',
          client_secret: 'client_secret',
          oes_base_url: 'https://oes.example.test/site-api',
          environment: 'local'
        })
      ),
      fetch: fetchMock
    })

    await expect(client.getLatestPublishState(3)).resolves.toEqual({
      site_id: 'brand-us',
      latest_publish_version: 4,
      latest_sync_id: 'sync_4',
      has_updates: true,
      server_time: '2026-06-15T01:00:00.000Z'
    })
    await expect(
      client.batchGetPublicViews([{ resource_type: 'product', resource_id: 'product_1', locale: 'en-US' }])
    ).resolves.toEqual({
      public_views: [
        expect.objectContaining({
          siteId: 'brand-us',
          resourceType: 'product',
          resourceId: 'product_1',
          payload: { display_title: 'Basin' }
        })
      ],
      missing_resources: [],
      server_publish_version: 4
    })
  })

  it('retries temporary failures but never retries blocked authentication failures', async () => {
    let attempts = 0
    const retryFetch = jest.fn(async () => {
        attempts += 1
        if (attempts < 3) {
        return new Response(JSON.stringify({ error: { code: 'SERVER_ERROR', message: 'temporary' } }), {
          status: 503,
          headers: { 'content-type': 'application/json' }
        })
        }
      return new Response(
          JSON.stringify({
            site_id: 'brand-us',
            latest_publish_version: 1,
            latest_sync_id: 'sync_1',
            has_updates: false,
            server_time: '2026-06-15T00:00:00.000Z'
          }),
        { headers: { 'content-type': 'application/json' } }
        )
    })
    const client = new SignedOesClient({
      credential: parseSiteCredential(
        encodeCredential({
          site_id: 'brand-us',
          client_id: 'client_123',
          credential_id: 'cred_123',
          client_secret: 'client_secret',
          oes_base_url: 'https://oes.example.test/site-api',
          environment: 'local'
        })
      ),
      fetch: retryFetch,
      retry: { maxAttempts: 3, baseDelayMs: 0 }
    })

    await client.getLatestPublishState(0)
    expect(attempts).toBe(3)

    let blockedAttempts = 0
    const blockedFetch = jest.fn(async () => {
      blockedAttempts += 1
      return new Response(
        JSON.stringify({
          error: { code: 'SITE_DISABLED', message: 'site disabled' },
          request_id: 'request_1',
          trace_id: 'trace_1'
        }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      )
    })
    const blockedClient = new SignedOesClient({
      credential: parseSiteCredential(
        encodeCredential({
          site_id: 'brand-us',
          client_id: 'client_123',
          credential_id: 'cred_123',
          client_secret: 'client_secret',
          oes_base_url: 'https://oes.example.test/site-api',
          environment: 'local'
        })
      ),
      fetch: blockedFetch,
      retry: { maxAttempts: 3, baseDelayMs: 0 }
    })

    await expect(blockedClient.getLatestPublishState(0)).rejects.toMatchObject({
      code: 'SITE_DISABLED',
      runtimeStatus: 'blocked'
    } satisfies Partial<SiteRuntimeError>)
    expect(blockedAttempts).toBe(1)
  })
})
