import 'reflect-metadata'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY } from '@oes/common/auth'
import { SiteRuntimeController } from '../../../../../../../src/modules/site-runtime-bff/interface/http/controllers/site-runtime.controller'

// Verifies Site Runtime BFF is anonymous at JWT level but always forwards signed request material.
describe('SiteRuntimeController', () => {
  const service = {
    registerPageCapabilities: jest.fn(),
    getLatestPublishState: jest.fn(),
    listChangedResources: jest.fn(),
    batchGetPublicViews: jest.fn(),
    getSnapshot: jest.fn(),
    reportSyncResult: jest.fn(),
    getPreviewView: jest.fn()
  }
  const controller = new SiteRuntimeController(service as never)
  const signedHeaders = {
    'x-oes-site-id': 'site_from_header',
    'x-oes-client-id': 'client_a',
    'x-oes-credential-id': 'cred_a',
    'x-oes-timestamp': '1781481600000',
    'x-oes-nonce': 'nonce_a',
    'x-oes-signature': 'v1=abc',
    'x-oes-request-id': 'request_runtime',
    'x-oes-trace-id': 'trace_runtime'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('marks Site-facing endpoints public for JWT while keeping signed material delegation explicit', () => {
    const reflector = new Reflector()

    expect(
      reflector.get(IS_PUBLIC_KEY, SiteRuntimeController.prototype.getLatestPublishState)
    ).toBe(true)
    expect(
      reflector.get(
        IS_PUBLIC_KEY,
        (SiteRuntimeController.prototype as any).registerPageCapabilities
      )
    ).toBe(true)
    expect(reflector.get(IS_PUBLIC_KEY, SiteRuntimeController.prototype.listChangedResources)).toBe(
      true
    )
    expect(reflector.get(IS_PUBLIC_KEY, SiteRuntimeController.prototype.batchGetPublicViews)).toBe(
      true
    )
    expect(reflector.get(IS_PUBLIC_KEY, SiteRuntimeController.prototype.getSnapshot)).toBe(true)
    expect(reflector.get(IS_PUBLIC_KEY, SiteRuntimeController.prototype.reportSyncResult)).toBe(
      true
    )
    expect(reflector.get(IS_PUBLIC_KEY, SiteRuntimeController.prototype.getPreviewView)).toBe(true)
  })

  it('delegates complete capability registration on the signed site-facing path', async () => {
    service.registerPageCapabilities.mockResolvedValue({ accepted: true })
    const body = {
      idempotency_key: 'deployment-1',
      capabilities: [{ page_key: 'HOME', supported_locales: ['en-US'] }]
    }
    const rawBody = Buffer.from(JSON.stringify(body))

    await (controller as any).registerPageCapabilities(signedHeaders, body, rawBody)

    expect(service.registerPageCapabilities).toHaveBeenCalledWith({
      method: 'POST',
      path: '/api/v1/site/capabilities/pages:register',
      normalizedQuery: '',
      signedHeaders,
      body,
      rawBody
    })
  })

  it('delegates latest state without trusting site_id from body or query', async () => {
    service.getLatestPublishState.mockResolvedValue({
      siteId: 'site_from_header',
      latestPublishVersion: 8,
      latestSyncId: 'sync_a',
      hasUpdates: true,
      serverTime: '2026-06-15T08:00:00.000Z'
    })

    await controller.getLatestPublishState(
      signedHeaders,
      { site_id: 'malicious_body_site', local_publish_version: 3 },
      Buffer.from('{"site_id":"malicious_body_site","local_publish_version":3}')
    )

    expect(service.getLatestPublishState).toHaveBeenCalledWith({
      method: 'POST',
      path: '/api/v1/site/sync/latest',
      normalizedQuery: '',
      signedHeaders,
      rawBody: Buffer.from('{"site_id":"malicious_body_site","local_publish_version":3}'),
      body: { site_id: 'malicious_body_site', local_publish_version: 3 }
    })
  })

  it('uses Nest rawBody bytes for signature hashing when Express has already parsed body', async () => {
    const rawBody = Buffer.from('{\n  "local_publish_version": 3\n}')
    service.getLatestPublishState.mockResolvedValue({ hasUpdates: false })

    await controller.getLatestPublishState(signedHeaders, { local_publish_version: 3 }, {
      body: { local_publish_version: 3 },
      rawBody
    } as never)

    expect(service.getLatestPublishState).toHaveBeenCalledWith(
      expect.objectContaining({
        rawBody
      })
    )
  })

  it('delegates changed resources, public views, snapshot, sync result, and preview view to the service', async () => {
    service.listChangedResources.mockResolvedValue({ changedResources: [] })
    service.batchGetPublicViews.mockResolvedValue({ publicViews: [] })
    service.getSnapshot.mockResolvedValue({
      snapshotPublishVersion: 8,
      exposurePublication: { pages: [] }
    })
    service.reportSyncResult.mockResolvedValue({ accepted: true })
    service.getPreviewView.mockResolvedValue({ noindex: true, cachePolicy: 'no-store' })

    await controller.listChangedResources(
      signedHeaders,
      { from_publish_version: 1 },
      Buffer.from('{}')
    )
    await controller.batchGetPublicViews(signedHeaders, { resources: [], target_publish_version: 8 }, Buffer.from('{"target_publish_version":8}'))
    await controller.getSnapshot(signedHeaders, { page_size: 100, target_publish_version: 8 }, Buffer.from('{"target_publish_version":8}'))
    await controller.reportSyncResult(
      signedHeaders,
      { local_publish_version: 8, status: 'completed' },
      Buffer.from('{}')
    )
    await controller.getPreviewView(
      signedHeaders,
      { preview_token: 'token', resource_type: 'blog', resource_id: 'blog_a', locale: 'en-US' },
      Buffer.from('{}')
    )

    expect(service.listChangedResources).toHaveBeenCalledWith({
      method: 'POST',
      path: '/api/v1/site/sync/changed-resources',
      normalizedQuery: '',
      signedHeaders,
      body: { from_publish_version: 1 },
      rawBody: Buffer.from('{}')
    })
    expect(service.batchGetPublicViews).toHaveBeenCalledWith({
      method: 'POST',
      path: '/api/v1/site/sync/public-views:batchGet',
      normalizedQuery: '',
      signedHeaders,
      body: { resources: [], target_publish_version: 8 },
      rawBody: Buffer.from('{"target_publish_version":8}')
    })
    expect(service.getSnapshot).toHaveBeenCalledWith({
      method: 'POST',
      path: '/api/v1/site/sync/snapshot',
      normalizedQuery: '',
      signedHeaders,
      body: { page_size: 100, target_publish_version: 8 },
      rawBody: Buffer.from('{"target_publish_version":8}')
    })
    expect(service.reportSyncResult).toHaveBeenCalledWith({
      method: 'POST',
      path: '/api/v1/site/sync/report-result',
      normalizedQuery: '',
      signedHeaders,
      body: { local_publish_version: 8, status: 'completed' },
      rawBody: Buffer.from('{}')
    })
    expect(service.getPreviewView).toHaveBeenCalledWith({
      method: 'POST',
      path: '/api/v1/site/preview/view',
      normalizedQuery: '',
      signedHeaders,
      body: {
        preview_token: 'token',
        resource_type: 'blog',
        resource_id: 'blog_a',
        locale: 'en-US'
      },
      rawBody: Buffer.from('{}')
    })
  })
})
