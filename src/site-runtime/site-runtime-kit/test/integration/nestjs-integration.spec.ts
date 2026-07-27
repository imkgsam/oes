import { Test } from '@nestjs/testing'

import {
  buildCanonicalRequest,
  hashSiteCapabilityManifest,
  OesSiteRuntimeHealthController,
  OesSiteRuntimeModule,
  OesSiteRuntimeService,
  OesSiteRuntimeStatusController,
  signCanonicalRequest
} from '../../src'

function encodeCredential(payload: Record<string, unknown>): string {
  return `oes_site_cred_v1.${Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')}`
}

function credential(): string {
  return encodeCredential({
    site_id: 'brand-us',
    client_id: 'client_123',
    credential_id: 'cred_123',
    client_secret: 'client_secret',
    webhook_signing_secret: 'webhook_secret',
    oes_base_url: 'https://oes.example.test/site-api',
    environment: 'local'
  })
}

function signRuntimeStatus(timestamp = '1781488327000', nonce = 'status_nonce'): Record<string, string> {
  const canonical = buildCanonicalRequest({
    method: 'GET',
    url: 'http://127.0.0.1/api/oes/runtime-status',
    body: '',
    siteId: 'brand-us',
    clientId: '',
    credentialId: '',
    timestamp,
    nonce
  })
  return {
    'x-oes-site-id': 'brand-us',
    'x-oes-timestamp': timestamp,
    'x-oes-nonce': nonce,
    'x-oes-signature': signCanonicalRequest(canonical, 'webhook_secret')
  }
}

describe('OesSiteRuntimeModule', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      OES_SITE_CREDENTIAL: credential(),
      OES_SITE_STORE_PATH: ':memory:',
      OES_SITE_PULL_INTERVAL_MS: '0'
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('registers service, health endpoints, webhook endpoint, and protected runtime status', async () => {
    const manifest = { pages: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }] }
    const syncToLatest = jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 0 }))
    const registerPageCapabilities = jest.fn(async () => ({
      accepted: true,
      idempotent_replay: false,
      manifest_hash: hashSiteCapabilityManifest(manifest),
      discovered_count: 1,
      unavailable_page_keys: [],
      drift_page_keys: [],
      recovered_page_keys: [],
      registration_generation: '1'
    }))
    const moduleRef = await Test.createTestingModule({
      imports: [
        OesSiteRuntimeModule.forRootFromEnv({
          controllers: true,
          pullIntervalMs: 0,
          capabilityManifest: manifest,
          runtimeOverrides: {
            sync: { syncToLatest },
            client: {
              registerPageCapabilities,
              getLatestPublishState: jest.fn(async () => ({
                site_id: 'brand-us',
                latest_publish_version: 0,
                latest_sync_id: null,
                has_updates: false,
                server_time: '2026-06-15T00:00:00.000Z'
              }))
            }
          },
          now: () => 1781488327000
        })
      ]
    }).compile()

    await moduleRef.init()

    expect(moduleRef.get(OesSiteRuntimeService)).toBeInstanceOf(OesSiteRuntimeService)
    expect(registerPageCapabilities).toHaveBeenCalledWith(
      { pages: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }] },
      '0.1.0',
      expect.stringMatching(/^site-capabilities:/),
      '0'
    )
    const healthController = moduleRef.get(OesSiteRuntimeHealthController)
    const statusController = moduleRef.get(OesSiteRuntimeStatusController)
    await expect(healthController.live()).resolves.toEqual({ live: true })
    await expect(healthController.ready()).resolves.toEqual({ ready: true, status: 'healthy' })
    await expect(
      statusController.runtimeStatus({ method: 'GET', originalUrl: '/api/oes/runtime-status' } as never, {})
    ).rejects.toThrow(/Unauthorized/)
    const statusResponse = await statusController.runtimeStatus(
      { method: 'GET', originalUrl: '/api/oes/runtime-status' } as never,
      signRuntimeStatus()
    )
    expect(statusResponse).toEqual(
      expect.objectContaining({
        site_id: 'brand-us',
        status: 'healthy',
        store_ready: true
      })
    )
    expect(JSON.stringify(statusResponse)).not.toContain('secret')

    await moduleRef.close()
  })
})
