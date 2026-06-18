import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

import {
  createSiteRuntime,
  createSiteRuntimeFromEnv,
  parseSiteCredential,
  SiteRuntimeError,
  signCanonicalRequest
} from '../../src'

function encodeCredential(payload: Record<string, unknown>): string {
  return `oes_site_cred_v1.${Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')}`
}

function credential(baseUrl = 'https://oes.example.test/site-api'): string {
  return encodeCredential({
    site_id: 'brand-us',
    client_id: 'client_123',
    credential_id: 'cred_123',
    client_secret: 'client_secret',
    webhook_signing_secret: 'webhook_secret',
    oes_base_url: baseUrl,
    environment: 'local'
  })
}

function signedWebhook(nonce: string): { body: string; headers: Record<string, string> } {
  const body = JSON.stringify({
    event_id: 'evt_1',
    site_id: 'brand-us',
    event_type: 'site.publish.available',
    publish_version: 2,
    occurred_at: '2026-06-15T00:00:00.000Z'
  })
  const timestamp = '1781488327000'
  const canonical = [
    'POST',
    '/api/oes/webhook',
    '',
    createHash('sha256').update(body).digest('hex'),
    'x-oes-site-id:brand-us',
    'x-oes-event-id:evt_1',
    `x-oes-timestamp:${timestamp}`,
    `x-oes-nonce:${nonce}`
  ].join('\n')
  return {
    body,
    headers: {
      'x-oes-site-id': 'brand-us',
      'x-oes-timestamp': timestamp,
      'x-oes-nonce': nonce,
      'x-oes-event-id': 'evt_1',
      'x-oes-signature': signCanonicalRequest(canonical, 'webhook_secret')
    }
  }
}

describe('SiteRuntime kernel', () => {
  it('creates a runtime from env, starts the SQLite store, and reports safe health', async () => {
    const runtime = await createSiteRuntimeFromEnv(
      {
        OES_SITE_CREDENTIAL: credential(),
        OES_SITE_STORE_PATH: join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-env-')), 'runtime.sqlite'),
        OES_SITE_PULL_INTERVAL_MS: '0'
      },
      {
        client: {
          getLatestPublishState: jest.fn(async () => ({
            site_id: 'brand-us',
            latest_publish_version: 0,
            latest_sync_id: null,
            has_updates: false,
            server_time: '2026-06-15T00:00:00.000Z'
          }))
        }
      }
    )

    await runtime.start()
    await expect(runtime.health.ready()).resolves.toEqual({ ready: true, status: 'healthy' })
    await expect(runtime.getStatus()).resolves.toEqual(
      expect.not.objectContaining({
        clientSecret: expect.anything(),
        webhookSigningSecret: expect.anything()
      })
    )
    await runtime.stop()
  })

  it('verifies webhooks, records duplicate event ids as success, and avoids duplicate sync', async () => {
    const syncToLatest = jest.fn(async () => ({ status: 'completed', localPublishVersion: 2 }))
    const runtime = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      storePath: join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-webhook-')), 'runtime.sqlite'),
      client: {
        getLatestPublishState: jest.fn()
      },
      sync: { syncToLatest },
      now: () => 1781488327000
    })
    await runtime.start()

    const first = signedWebhook('nonce_1')
    await expect(
      runtime.handleWebhook({
        method: 'POST',
        url: 'https://site.example.test/api/oes/webhook',
        headers: first.headers,
        body: first.body
      })
    ).resolves.toEqual({ accepted: true, duplicate: false, eventId: 'evt_1' })

    const second = signedWebhook('nonce_2')
    await expect(
      runtime.handleWebhook({
        method: 'POST',
        url: 'https://site.example.test/api/oes/webhook',
        headers: second.headers,
        body: second.body
      })
    ).resolves.toEqual({ accepted: true, duplicate: true, eventId: 'evt_1' })

    expect(syncToLatest).toHaveBeenCalledTimes(1)
    await runtime.stop()
  })

  it('rejects invalid webhook signatures without triggering sync', async () => {
    const syncToLatest = jest.fn()
    const runtime = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      storePath: join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-webhook-bad-')), 'runtime.sqlite'),
      client: {
        getLatestPublishState: jest.fn()
      },
      sync: { syncToLatest },
      now: () => 1781488327000
    })
    await runtime.start()
    const webhook = signedWebhook('nonce_1')

    await expect(
      runtime.handleWebhook({
        method: 'POST',
        url: 'https://site.example.test/api/oes/webhook',
        headers: { ...webhook.headers, 'x-oes-signature': 'v1=bad' },
        body: webhook.body
      })
    ).rejects.toThrow(/SIGNATURE_INVALID/)
    expect(syncToLatest).not.toHaveBeenCalled()
    await runtime.stop()
  })

  it('fetches preview views through the signed client without writing published resources', async () => {
    const runtime = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      storePath: join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-preview-')), 'runtime.sqlite'),
      client: {
        getLatestPublishState: jest.fn(),
        getPreviewView: jest.fn(async () => ({
          preview_view: {
            site_id: 'brand-us',
            resource_type: 'product',
            resource_id: 'product_1',
            slug: 'draft-basin',
            locale: 'en-US',
            status: 'draft_preview',
            publish_version: 0,
            updated_at: '2026-06-15T00:00:00.000Z',
            payload: { display_title: 'Draft Basin' }
          },
          expires_at: '2026-06-15T00:15:00.000Z',
          noindex: true,
          cache_policy: 'no-store'
        }))
      }
    })
    await runtime.start()

    await expect(
      runtime.getPreviewView({
        preview_token: 'preview_token',
        resource_type: 'product',
        resource_id: 'product_1',
        locale: 'en-US'
      })
    ).resolves.toMatchObject({
      preview_view: {
        status: 'draft_preview',
        payload: { display_title: 'Draft Basin' }
      },
      noindex: true,
      cache_policy: 'no-store'
    })
    await expect(runtime.publicViews.products.getBySlug('draft-basin', 'en-US')).resolves.toBeNull()
    await runtime.stop()
  })

  it('moves runtime status to blocked when sync fails with site disabled', async () => {
    const runtime = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      storePath: join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-blocked-')), 'runtime.sqlite'),
      client: {
        getLatestPublishState: jest.fn()
      },
      sync: {
        syncToLatest: jest.fn(async () => {
          throw new SiteRuntimeError({
            code: 'SITE_DISABLED',
            message: 'site disabled',
            httpStatus: 403
          })
        })
      }
    })
    await runtime.start()

    await expect(runtime.sync.syncToLatest('pull')).rejects.toMatchObject({
      runtimeStatus: 'blocked'
    })
    await expect(runtime.getStatus()).resolves.toMatchObject({
      status: 'blocked',
      last_sync_status: 'blocked',
      last_error_code: 'SITE_DISABLED'
    })
    await runtime.stop()
  })
})
