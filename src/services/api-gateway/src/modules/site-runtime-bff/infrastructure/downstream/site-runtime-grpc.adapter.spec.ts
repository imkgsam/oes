import { createHash } from 'node:crypto'
import { of } from 'rxjs'
import { SiteRuntimeGrpcAdapter } from './site-runtime-grpc.adapter'

// Verifies the Site-facing downstream adapter preserves signed request material for site-service verification.
describe('SiteRuntimeGrpcAdapter', () => {
  const runtimeService = {
    getLatestPublishState: jest.fn(),
    listChangedResources: jest.fn(),
    batchGetPublicViews: jest.fn(),
    getSnapshot: jest.fn(),
    reportSyncResult: jest.fn(),
    getPreviewView: jest.fn()
  }
  const client = {
    getService: jest.fn().mockReturnValue(runtimeService)
  }
  const metadata = { metadata: 'internal' }
  const metadataFactory = {
    createInternalCallMetadata: jest.fn().mockReturnValue(metadata)
  }
  const adapter = new SiteRuntimeGrpcAdapter(client as never, metadataFactory as never)
  const rawBody = Buffer.from('{"site_id":"malicious_body_site","local_publish_version":7}')
  const signedRequest = {
    method: 'POST',
    path: '/api/v1/site/sync/latest',
    normalizedQuery: '',
    signedHeaders: {
      'x-oes-site-id': 'site_header',
      'x-oes-client-id': 'client_a',
      'x-oes-credential-id': 'cred_a',
      'x-oes-timestamp': '1781481600000',
      'x-oes-nonce': 'nonce_a',
      'x-oes-signature': 'v1=abc',
      'x-oes-request-id': 'request_runtime',
      'x-oes-trace-id': 'trace_runtime'
    },
    body: { site_id: 'malicious_body_site', local_publish_version: 7 },
    rawBody
  }

  beforeEach(() => {
    jest.clearAllMocks()
    adapter.onModuleInit()
  })

  it('maps latest-state requests without trusting body site_id', async () => {
    runtimeService.getLatestPublishState.mockReturnValue(of({ siteId: 'site_header' }))

    await adapter.getLatestPublishState(signedRequest)

    expect(runtimeService.getLatestPublishState).toHaveBeenCalledWith(
      {
        signedContext: {
          siteId: 'site_header',
          clientId: 'client_a',
          credentialId: 'cred_a',
          requestId: 'request_runtime',
          traceId: 'trace_runtime',
          timestamp: '1781481600000',
          nonce: 'nonce_a',
          signature: 'v1=abc',
          method: 'POST',
          path: '/api/v1/site/sync/latest',
          normalizedQuery: '',
          bodySha256: createHash('sha256').update(rawBody).digest('hex')
        },
        localPublishVersion: 7
      },
      metadata
    )
  })

  it('maps snapshot requests while preserving signed site identity and raw body hash', async () => {
    const snapshotRawBody = Buffer.from(
      '{"site_id":"malicious_body_site","resource_types":["product","blog"],"locales":["en-US"],"page_token":"50","page_size":100}'
    )
    const snapshotRequest = {
      ...signedRequest,
      path: '/api/v1/site/sync/snapshot',
      body: {
        site_id: 'malicious_body_site',
        resource_types: ['product', 'blog'],
        locales: ['en-US'],
        page_token: '50',
        page_size: 100
      },
      rawBody: snapshotRawBody
    }
    runtimeService.getSnapshot.mockReturnValue(of({ siteId: 'site_header', snapshotPublishVersion: 7 }))

    await adapter.getSnapshot(snapshotRequest)

    expect(runtimeService.getSnapshot).toHaveBeenCalledWith(
      {
        signedContext: {
          siteId: 'site_header',
          clientId: 'client_a',
          credentialId: 'cred_a',
          requestId: 'request_runtime',
          traceId: 'trace_runtime',
          timestamp: '1781481600000',
          nonce: 'nonce_a',
          signature: 'v1=abc',
          method: 'POST',
          path: '/api/v1/site/sync/snapshot',
          normalizedQuery: '',
          bodySha256: createHash('sha256').update(snapshotRawBody).digest('hex')
        },
        resourceTypes: ['product', 'blog'],
        locales: ['en-US'],
        pageToken: '50',
        pageSize: 100
      },
      metadata
    )
  })
})
