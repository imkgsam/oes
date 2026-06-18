import { of } from 'rxjs'
import { SiteAdminGrpcAdapter } from './site-admin-grpc.adapter'

// Verifies the Admin downstream adapter maps BFF context into the internal site-service gRPC contract.
describe('SiteAdminGrpcAdapter', () => {
  const siteAdminService = {
    listSiteCards: jest.fn(),
    createSite: jest.fn(),
    syncAllPendingChanges: jest.fn(),
    issuePreviewToken: jest.fn()
  }
  const client = {
    getService: jest.fn().mockReturnValue(siteAdminService)
  }
  const metadata = { metadata: 'operator-scoped' }
  const metadataFactory = {
    createOperatorScopedMetadata: jest.fn().mockReturnValue(metadata)
  }
  const adapter = new SiteAdminGrpcAdapter(client as never, metadataFactory as never)
  const source = {
    requestId: 'request_admin',
    traceId: 'trace_admin',
    user: { holderId: 'operator_a', tenantId: 'tenant_a', orgId: 'org_a' }
  }
  const context = {
    tenantId: 'tenant_a',
    orgId: 'org_a',
    operatorId: 'operator_a',
    requestId: 'request_admin',
    traceId: 'trace_admin'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    adapter.onModuleInit()
  })

  it('forwards Site Management requests through the generated gRPC client', async () => {
    siteAdminService.listSiteCards.mockReturnValue(of({ cards: [] }))
    siteAdminService.createSite.mockReturnValue(of({ siteId: 'site_a', status: 'draft', defaultLocale: 'en-US' }))
    siteAdminService.syncAllPendingChanges.mockReturnValue(of({ syncId: 'sync_a', publishVersion: 3 }))
    siteAdminService.issuePreviewToken.mockReturnValue(of({ previewToken: 'preview_a' }))

    await adapter.listSiteCards(context, source)
    await adapter.createSite({ ...context, siteName: 'Brand US', siteType: 'brand', defaultLocale: 'en-US' }, source)
    await adapter.syncAllPendingChanges({ context, siteId: 'site_a' }, source)
    await adapter.issuePreviewToken(
      { context, siteId: 'site_a', resourceType: 'blog', resourceId: 'blog_a', locale: 'en-US' },
      source
    )

    expect(siteAdminService.listSiteCards).toHaveBeenCalledWith(
      { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_admin' },
      metadata
    )
    expect(siteAdminService.createSite).toHaveBeenCalledWith(
      {
        tenantId: 'tenant_a',
        orgId: 'org_a',
        operatorId: 'operator_a',
        traceId: 'trace_admin',
        siteName: 'Brand US',
        siteType: 'brand',
        defaultLocale: 'en-US'
      },
      metadata
    )
    expect(siteAdminService.syncAllPendingChanges).toHaveBeenCalledWith({ context, siteId: 'site_a' }, metadata)
    expect(siteAdminService.issuePreviewToken).toHaveBeenCalledWith(
      { context, siteId: 'site_a', resourceType: 'blog', resourceId: 'blog_a', locale: 'en-US' },
      metadata
    )
  })
})
