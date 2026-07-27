import { SiteRuntimeDownstream, SiteRuntimeService } from './site-runtime.service'

// Verifies the Site-facing BFF service delegates only signed request material to site-service.
describe('SiteRuntimeService', () => {
  const downstream: jest.Mocked<SiteRuntimeDownstream> = {
    registerPageCapabilities: jest.fn(),
    getLatestPublishState: jest.fn(),
    listChangedResources: jest.fn(),
    batchGetPublicViews: jest.fn(),
    getSnapshot: jest.fn(),
    reportSyncResult: jest.fn(),
    getPreviewView: jest.fn()
  }
  const service = new SiteRuntimeService(downstream)
  const signedRequest = {
    method: 'POST',
    path: '/api/v1/site/sync/latest',
    normalizedQuery: '',
    signedHeaders: {
      'x-oes-site-id': 'site_header',
      'x-oes-client-id': 'client_a',
      'x-oes-credential-id': 'cred_a',
      'x-oes-request-id': 'request_runtime',
      'x-oes-trace-id': 'trace_runtime'
    },
    body: { site_id: 'malicious_body_site', local_publish_version: 7 },
    rawBody: Buffer.from('{"site_id":"malicious_body_site","local_publish_version":7}')
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('forwards signed headers and raw body without trusting ordinary body site id', async () => {
    downstream.getLatestPublishState.mockResolvedValue({ siteId: 'site_header' })

    await service.getLatestPublishState(signedRequest)

    expect(downstream.getLatestPublishState).toHaveBeenCalledWith(signedRequest)
  })

  it('forwards signed complete capability registration requests unchanged', async () => {
    downstream.registerPageCapabilities.mockResolvedValue({ accepted: true })
    const request = {
      ...signedRequest,
      path: '/api/v1/site/capabilities/pages:register',
      body: { idempotency_key: 'deployment-1', capabilities: [{ page_key: 'HOME', supported_locales: ['en-US'] }] }
    }

    await (service as any).registerPageCapabilities(request)

    expect(downstream.registerPageCapabilities).toHaveBeenCalledWith(request)
  })
})
