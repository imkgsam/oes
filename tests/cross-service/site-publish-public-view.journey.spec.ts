import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium, type Browser } from 'playwright'
import { SiteMediaApplicationService } from '../../src/services/system/asset-service/src/application/services/site-media-application.service'
import { buildSiteExposurePublication } from '../../src/services/system/site-service/src/domain/site-page/site-page-governance'
import { verifySignedSiteRequest } from '../../src/services/system/site-service/src/domain/security/site-request-signing'
import {
  createSiteRuntime,
  parseSiteCredential,
  type SiteRuntime
} from '../../src/site-runtime/site-runtime-kit/src'
import { html, json, listen, readJson, type JourneyServer } from './support/http'

/**
 * Prerequisites: Playwright Chromium and a writable temporary directory for the runtime SQLite store.
 * Boundaries: Asset publication resolution -> signed Site API -> Runtime SQLite commit -> storefront browser.
 * Success: the committed product and immutable media URL render from the local public Runtime version.
 * Critical failure: a media-kind mismatch stops publication before the Runtime/storefront boundary.
 * Reproduce: pnpm test:run -- --type journey (or the risk-selected change plan).
 */
describe('Site and Asset publication to storefront Journey', () => {
  let browser: Browser
  let runtime: SiteRuntime
  const servers: JourneyServer[] = []
  const directory = mkdtempSync(join(tmpdir(), 'oes-site-publish-journey-'))

  afterAll(async () => {
    await browser?.close()
    await runtime?.stop()
    await Promise.all(servers.splice(0).map((server) => server.close()))
    rmSync(directory, { recursive: true, force: true })
  })

  it('resolves immutable Asset media, commits a signed publication, and renders it headlessly', async () => {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64'
    )
    const assetServer = await listen(async (request, response) => {
      if (request.url === '/media/basin.png') {
        response.writeHead(200, {
          'content-type': 'image/png',
          'content-length': String(png.length),
          'cache-control': 'public, max-age=31536000, immutable'
        })
        response.end(png)
        return
      }
      response.writeHead(404).end()
    })
    servers.push(assetServer)

    const mediaRecord = {
      assetId: 'journey-basin-asset',
      tenantId: 'journey-site-tenant',
      siteId: 'journey-site',
      ownerSubject: 'journey-publisher',
      mediaKind: 'IMAGE',
      lifecycleStatus: 'ACTIVE',
      deliveryStatus: 'REMOTE_ACTIVE',
      immutablePublicUrl: `${assetServer.origin}/media/basin.png`,
      width: 1,
      height: 1,
      durationMs: null,
      codec: 'png',
      availabilityVersion: 7
    }
    const asset = new SiteMediaApplicationService(
      {
        resolveSiteMedia: async (input: { tenantId: string; siteId: string; assetId: string }) =>
          input.tenantId === mediaRecord.tenantId &&
          input.siteId === mediaRecord.siteId &&
          input.assetId === mediaRecord.assetId
            ? mediaRecord
            : null
      } as never,
      {} as never
    )
    const authority = {
      subject: 'journey-publisher',
      principalType: 'WORKLOAD',
      tenantId: 'journey-site-tenant',
      workload: 'site-service'
    }
    const media = (await asset.resolveSiteMediaForPublication(
      { siteId: 'journey-site', assetId: mediaRecord.assetId, requiredMediaKind: 'IMAGE' },
      authority
    )) as any
    await expect(
      asset.resolveSiteMediaForPublication(
        { siteId: 'journey-site', assetId: mediaRecord.assetId, requiredMediaKind: 'VIDEO' },
        authority
      )
    ).rejects.toThrow('ASSET_MEDIA_KIND_MISMATCH')

    const publishedAt = new Date('2026-09-04T02:00:00.000Z')
    const exposure = buildSiteExposurePublication({
      siteId: 'journey-site',
      publishVersion: 1,
      defaultLocale: 'en-US',
      activeLocales: ['en-US'],
      pages: [
        {
          pageKey: 'PRODUCT_DETAIL',
          available: true,
          enabled: true,
          indexable: true,
          supportedLocales: ['en-US'],
          syncStatus: 'synced',
          lastDiscoveredAt: publishedAt
        }
      ],
      publishedAt
    })
    const acceptedNonces = new Set<string>()
    let syncReports = 0
    const credentialRecord = {
      siteId: 'journey-site',
      clientId: 'journey-runtime',
      credentialId: 'journey-credential',
      clientSecret: 'journey-client-secret',
      scopes: ['site:read', 'site:sync', 'site:status'],
      status: 'active' as const,
      siteStatus: 'active' as const
    }
    const siteApi = await listen(async (request, response) => {
      const bodyText = JSON.stringify(await readJson(request))
      const headers = Object.fromEntries(
        Object.entries(request.headers).map(([key, value]) => [
          key,
          Array.isArray(value) ? value[0] : value
        ])
      )
      const scope = request.url === '/sync/report-result' ? 'site:status' : 'site:sync'
      const verified = await verifySignedSiteRequest(
        { method: request.method ?? '', path: request.url ?? '', body: bodyText, headers },
        {
          now: new Date(),
          requiredScope: scope,
          credential: credentialRecord,
          nonceStore: {
            remember: async ({ nonce }: { nonce: string }) => {
              if (acceptedNonces.has(nonce)) return false
              acceptedNonces.add(nonce)
              return true
            }
          }
        }
      )
      if (!verified.ok) {
        json(response, 401, {
          error: { code: verified.errorCode, message: 'signed request rejected' }
        })
        return
      }
      if (request.url === '/sync/latest') {
        json(response, 200, {
          site_id: 'journey-site',
          latest_publish_version: 1,
          latest_sync_id: 'journey-sync-1',
          has_updates: true,
          server_time: publishedAt.toISOString()
        })
        return
      }
      if (request.url === '/sync/snapshot') {
        json(response, 200, {
          site_id: 'journey-site',
          snapshot_publish_version: 1,
          public_views: [
            {
              site_id: 'journey-site',
              resource_type: 'product',
              resource_id: 'journey-basin',
              slug: 'journey-basin',
              locale: 'en-US',
              status: 'published',
              publish_version: 1,
              updated_at: publishedAt.toISOString(),
              payload: {
                display_title: 'Journey Basin',
                hero_image_url: media.resolved.publicUrl
              }
            }
          ],
          next_page_token: null,
          is_complete: true,
          exposure_publication: exposure
        })
        return
      }
      if (request.url === '/sync/report-result') {
        syncReports += 1
        json(response, 200, { accepted: true, server_time: new Date().toISOString() })
        return
      }
      response.writeHead(404).end()
    })
    servers.push(siteApi)

    const encodedCredential = `oes_site_cred_v1.${Buffer.from(
      JSON.stringify({
        site_id: 'journey-site',
        client_id: 'journey-runtime',
        credential_id: 'journey-credential',
        client_secret: 'journey-client-secret',
        webhook_signing_secret: 'journey-webhook-secret',
        oes_base_url: siteApi.origin,
        environment: 'local'
      }),
      'utf8'
    ).toString('base64url')}`
    runtime = await createSiteRuntime({
      credential: parseSiteCredential(encodedCredential),
      storePath: join(directory, 'runtime.sqlite'),
      pullIntervalMs: 0
    })
    await runtime.start()
    await expect(runtime.getStatus()).resolves.toMatchObject({
      local_publish_version: 1,
      store_ready: true
    })
    expect(syncReports).toBe(1)

    const storefront = await listen(async (request, response) => {
      if (request.url !== '/en-US/products/journey-basin') {
        response.writeHead(404).end()
        return
      }
      const view = await runtime.publicViews.products.getBySlug('journey-basin', 'en-US')
      if (!view) {
        response.writeHead(404).end()
        return
      }
      const payload = view.payload as Record<string, string>
      html(
        response,
        `<!doctype html><html><body><main data-publish-version="${view.publishVersion}"><h1>${payload.display_title}</h1><img id="hero" src="${payload.hero_image_url}" alt="Journey Basin"></main></body></html>`
      )
    })
    servers.push(storefront)

    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    await page.goto(`${storefront.origin}/en-US/products/journey-basin`)
    expect(await page.locator('h1').textContent()).toBe('Journey Basin')
    expect(await page.locator('main').getAttribute('data-publish-version')).toBe('1')
    await page.waitForFunction(() => {
      const image = document.querySelector<HTMLImageElement>('#hero')
      return Boolean(image?.complete && image.naturalWidth === 1)
    })
  })
})
