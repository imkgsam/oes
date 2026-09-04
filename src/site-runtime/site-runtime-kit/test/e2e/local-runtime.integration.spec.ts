import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { Test } from '@nestjs/testing'

import {
  buildWebhookCanonicalRequest,
  OesSiteRuntimeModule,
  OesSiteRuntimeService,
  signCanonicalRequest,
  type ChangedResourceRef
} from '../../src'

function encodeCredential(payload: Record<string, unknown>): string {
  return `oes_site_cred_v1.${Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')}`
}

function signedWebhook(): { body: string; headers: Record<string, string> } {
  const body = JSON.stringify({
    event_id: 'evt_e2e_1',
    site_id: 'brand-us',
    event_type: 'site.publish.available',
    publish_version: 1,
    occurred_at: '2026-06-15T00:00:00.000Z'
  })
  const timestamp = '1781488327000'
  const nonce = 'nonce_e2e_1'
  const canonical = buildWebhookCanonicalRequest({
    method: 'POST',
    url: 'https://site.example.test/api/oes/webhook',
    body,
    siteId: 'brand-us',
    eventId: 'evt_e2e_1',
    timestamp,
    nonce
  })
  return {
    body,
    headers: {
      'x-oes-site-id': 'brand-us',
      'x-oes-timestamp': timestamp,
      'x-oes-nonce': nonce,
      'x-oes-event-id': 'evt_e2e_1',
      'x-oes-signature': signCanonicalRequest(canonical, 'webhook_secret')
    }
  }
}

describe('local Site Runtime E2E', () => {
  const originalEnv = process.env

  afterEach(() => {
    process.env = originalEnv
  })

  it('syncs from mock OES Site API into SQLite and serves publicViews through Nest service', async () => {
    process.env = {
      ...originalEnv,
      OES_SITE_CREDENTIAL: encodeCredential({
        site_id: 'brand-us',
        client_id: 'client_123',
        credential_id: 'cred_123',
        client_secret: 'client_secret',
        webhook_signing_secret: 'webhook_secret',
        oes_base_url: 'https://oes.example.test/site-api',
        environment: 'local'
      }),
      OES_SITE_STORE_PATH: join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-e2e-')), 'runtime.sqlite'),
      OES_SITE_PULL_INTERVAL_MS: '0'
    }
    const changed: ChangedResourceRef[] = [
      { resource_type: 'product', resource_id: 'product_1', locale: 'en-US' }
    ]
    const moduleRef = await Test.createTestingModule({
      imports: [
        OesSiteRuntimeModule.forRootFromEnv({
          runtimeOverrides: {
            client: {
              getLatestPublishState: jest.fn(async () => ({
                site_id: 'brand-us',
                latest_publish_version: 1,
                latest_sync_id: 'sync_1',
                has_updates: true,
                server_time: '2026-06-15T00:00:00.000Z'
              })),
              getSnapshot: jest.fn(async () => ({
                site_id: 'brand-us',
                snapshot_publish_version: 1,
                public_views: [
                  {
                    site_id: 'brand-us',
                    resource_type: 'product',
                    resource_id: 'product_1',
                    slug: 'basin',
                    locale: 'en-US',
                    status: 'published',
                    publish_version: 1,
                    updated_at: '2026-06-15T00:00:00.000Z',
                    payload: { display_title: 'Basin' }
                  }
                ],
                next_page_token: null,
                is_complete: true,
                exposure_publication: {
                  siteId: 'brand-us',
                  publishVersion: 1,
                  defaultLocale: 'en-US',
                  activeLocales: ['en-US'],
                  pages: [
                    {
                      pageKey: 'PRODUCT_DETAIL',
                      enabled: true,
                      indexable: true,
                      supportedLocales: ['en-US']
                    }
                  ],
                  publishedAt: '2026-06-15T00:00:00.000Z'
                }
              })),
              listChangedResources: jest.fn(async () => ({
                site_id: 'brand-us',
                from_publish_version: 0,
                to_publish_version: 1,
                requires_snapshot: false,
                changed_resources: changed
              })),
              batchGetPublicViews: jest.fn(),
              reportSyncResult: jest.fn(async () => ({ accepted: true, server_time: '2026-06-15T00:00:00.000Z' }))
            }
          },
          now: () => 1781488327000
        })
      ]
    }).compile()
    await moduleRef.init()
    const service = moduleRef.get(OesSiteRuntimeService)
    const webhook = signedWebhook()

    await service.handleWebhook({
      method: 'POST',
      url: 'https://site.example.test/api/oes/webhook',
      body: webhook.body,
      headers: webhook.headers
    })

    await expect(service.getRuntime().publicViews.products.getBySlug('basin', 'en-US')).resolves.toMatchObject({
      payload: { display_title: 'Basin' }
    })
    await expect(
      service.getRuntime().publicViews.exposure.getPagePolicy('PRODUCT_DETAIL', 'en-US')
    ).resolves.toMatchObject({ accessible: true, indexEligible: true, committedPublishVersion: 1 })
    await expect(service.getRuntime().health.ready()).resolves.toEqual({
      ready: true,
      status: 'healthy'
    })
    await expect(service.getRuntime().getStatus()).resolves.toMatchObject({
      site_id: 'brand-us',
      local_publish_version: 1,
      store_ready: true
    })

    await moduleRef.close()
  })
})
