import 'reflect-metadata'

import { Controller, Get, Module, NotFoundException, Param, Query } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

import {
  buildCanonicalRequest,
  OesSiteRuntimeModule,
  OesSiteRuntimeService,
  signCanonicalRequest
} from '../src'

const PORT = Number(process.env.OES_SITE_RUNTIME_SMOKE_PORT ?? 49321)
const SITE_URL = `http://127.0.0.1:${PORT}`
const LOCAL_SIGNATURE_URL = 'http://127.0.0.1'
const WEBHOOK_SECRET = 'webhook_secret'

// ExampleProductsController exposes a tiny site route backed only by runtime.publicViews.
@Controller('/example/products')
class ExampleProductsController {
  constructor(private readonly runtimeService: OesSiteRuntimeService) {}

  // bySlug reads local published data through runtime.publicViews for smoke verification.
  @Get('/:slug')
  async bySlug(@Param('slug') slug: string, @Query('locale') locale = 'en-US'): Promise<unknown> {
    const product = await this.runtimeService.getRuntime().publicViews.products.getBySlug(slug, locale)
    if (!product) {
      throw new NotFoundException()
    }
    return product
  }
}

// SmokeAppModule wires the runtime module with a mock OES Site API client.
@Module({
  imports: [
    OesSiteRuntimeModule.forRootFromEnv({
      runtimeOverrides: {
        client: {
          getLatestPublishState: async () => ({
            site_id: 'brand-us',
            latest_publish_version: 1,
            latest_sync_id: 'sync_1',
            has_updates: true,
            server_time: '2026-06-15T00:00:00.000Z'
          }),
          getSnapshot: async () => ({
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
                payload: { display_title: 'Smoke Basin' }
              }
            ],
            next_page_token: null,
            is_complete: true
          }),
          reportSyncResult: async () => ({ accepted: true, server_time: '2026-06-15T00:00:00.000Z' })
        }
      }
    })
  ],
  controllers: [ExampleProductsController]
})
class SmokeAppModule {}

// main starts the smoke runtime, exercises HTTP endpoints, prints sanitized results, and shuts down.
async function main(): Promise<void> {
  process.env.OES_SITE_CREDENTIAL = encodeCredential({
    site_id: 'brand-us',
    client_id: 'client_123',
    credential_id: 'cred_123',
    client_secret: 'client_secret',
    webhook_signing_secret: WEBHOOK_SECRET,
    oes_base_url: 'https://oes.example.test/site-api',
    environment: 'local'
  })
  process.env.OES_SITE_STORE_PATH = ':memory:'
  process.env.OES_SITE_PULL_INTERVAL_MS = '0'

  const app = await NestFactory.create(SmokeAppModule, { logger: false, rawBody: true })
  await app.listen(PORT, '127.0.0.1')
  try {
    const live = await getJson('/health/live')
    const ready = await getJson('/health/ready')
    const statusBefore = await getJson('/api/oes/runtime-status', signedHeaders('GET', '/api/oes/runtime-status', ''))
    const webhookBody = JSON.stringify({
      event_id: 'evt_smoke_1',
      site_id: 'brand-us',
      event_type: 'site.publish.available',
      publish_version: 1,
      occurred_at: '2026-06-15T00:00:00.000Z'
    })
    const webhook = await postJson(
      '/api/oes/webhook',
      webhookBody,
      signedHeaders('POST', '/api/oes/webhook', webhookBody, {
        'x-oes-event-id': 'evt_smoke_1'
      })
    )
    const statusAfter = await getJson('/api/oes/runtime-status', signedHeaders('GET', '/api/oes/runtime-status', '', 'status_nonce_2'))
    const product = await getJson('/example/products/basin?locale=en-US')

    console.log(
      JSON.stringify(
        {
          live,
          ready,
          statusBefore: summarizeStatus(statusBefore),
          webhook,
          statusAfter: summarizeStatus(statusAfter),
          product
        },
        null,
        2
      )
    )
  } finally {
    await app.close()
  }
}

// encodeCredential produces a local v1 credential bundle for the smoke app.
function encodeCredential(payload: Record<string, unknown>): string {
  return `oes_site_cred_v1.${Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')}`
}

// signedHeaders signs runtime-side protected endpoints using the P1 OES-to-runtime secret.
function signedHeaders(
  method: string,
  path: string,
  body: string,
  extra: Record<string, string> | string = {},
  nonce = typeof extra === 'string' ? extra : `${method.toLowerCase()}_nonce`
): Record<string, string> {
  const headersExtra = typeof extra === 'string' ? {} : extra
  const timestamp = String(Date.now())
  const canonical = buildCanonicalRequest({
    method,
    url: `${LOCAL_SIGNATURE_URL}${path}`,
    body,
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
    'x-oes-signature': signCanonicalRequest(canonical, WEBHOOK_SECRET),
    ...headersExtra
  }
}

// getJson performs a smoke HTTP GET and fails on non-2xx responses.
async function getJson(path: string, headers: Record<string, string> = {}): Promise<unknown> {
  const response = await fetch(`${SITE_URL}${path}`, { headers })
  return readJsonResponse(response)
}

// postJson performs a smoke HTTP POST and fails on non-2xx responses.
async function postJson(path: string, body: string, headers: Record<string, string>): Promise<unknown> {
  const response = await fetch(`${SITE_URL}${path}`, {
    method: 'POST',
    headers: { ...headers, 'content-type': 'application/json' },
    body
  })
  return readJsonResponse(response)
}

// readJsonResponse parses HTTP responses and includes status in failures without leaking secrets.
async function readJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text}`)
  }
  return text ? JSON.parse(text) : null
}

// summarizeStatus keeps smoke output compact and verifies no secrets are printed.
function summarizeStatus(status: unknown): unknown {
  const value = status as Record<string, unknown>
  return {
    site_id: value.site_id,
    status: value.status,
    local_publish_version: value.local_publish_version,
    store_ready: value.store_ready,
    sync_in_progress: value.sync_in_progress,
    pending_sync: value.pending_sync
  }
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
