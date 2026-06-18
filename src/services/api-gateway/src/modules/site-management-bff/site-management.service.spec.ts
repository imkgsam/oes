import { SiteManagementService, SiteManagementDownstream } from './site-management.service'

// Verifies the Admin BFF service maps authenticated gateway context into the site-service downstream port.
describe('SiteManagementService', () => {
  const downstream: jest.Mocked<SiteManagementDownstream> = {
    listSiteCards: jest.fn(),
    createSite: jest.fn(),
    updateSiteSettings: jest.fn(),
    disableSite: jest.fn(),
    addPreparingLocale: jest.fn(),
    checkLocaleCompleteness: jest.fn(),
    activateLocale: jest.fn(),
    disableLocale: jest.fn(),
    listSiteCategories: jest.fn(),
    createSiteCategory: jest.fn(),
    updateSiteCategory: jest.fn(),
    unpublishSiteCategory: jest.fn(),
    listSiteProducts: jest.fn(),
    searchProductMasterForAdd: jest.fn(),
    getSiteProductPublication: jest.fn(),
    addProductsToSite: jest.fn(),
    updateSiteProductPublication: jest.fn(),
    unpublishSiteProduct: jest.fn(),
    syncAllPendingChanges: jest.fn(),
    getPendingSyncSummary: jest.fn(),
    listPendingSyncResources: jest.fn(),
    listSyncHistory: jest.fn(),
    getSyncDetail: jest.fn(),
    retryLastSync: jest.fn(),
    resendWebhook: jest.fn(),
    issuePreviewToken: jest.fn(),
    generateSiteCredential: jest.fn(),
    listSiteCredentials: jest.fn(),
    rotateSiteCredential: jest.fn(),
    revokeSiteCredential: jest.fn(),
    createSiteContent: jest.fn(),
    updateSiteContentLocaleVersion: jest.fn(),
    listSiteContents: jest.fn(),
    getSiteContent: jest.fn(),
    unpublishSiteContent: jest.fn(),
    listSiteAuditLogs: jest.fn()
  }
  const service = new SiteManagementService(downstream)
  const source = {
    requestId: 'request_admin',
    traceId: 'trace_admin',
    user: {
      holderId: 'operator_a',
      tenantId: 'tenant_from_token',
      orgId: 'org_a'
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('delegates list/create/sync/preview with explicit admin context', async () => {
    downstream.listSiteCards.mockResolvedValue({ cards: [] })
    downstream.createSite.mockResolvedValue({ siteId: 'site_a', status: 'draft', defaultLocale: 'en-US' })
    downstream.syncAllPendingChanges.mockResolvedValue({ syncId: 'sync_a', publishVersion: 8 })
    downstream.getPendingSyncSummary.mockResolvedValue({ pendingCount: 1, resourceTypes: ['blog'] })
    downstream.listSiteCategories.mockResolvedValue({ categories: [] })
    downstream.createSiteCategory.mockResolvedValue({ category: { categoryId: 'category_a' } })
    downstream.listSiteProducts.mockResolvedValue({ products: [] })
    downstream.addProductsToSite.mockResolvedValue({ publications: [] })
    downstream.listSiteAuditLogs.mockResolvedValue({ auditLogs: [] })
    downstream.issuePreviewToken.mockResolvedValue({
      previewToken: 'preview_token',
      previewUrl: 'https://brand.example/preview',
      expiresAt: '2026-06-15T08:15:00.000Z'
    })
    downstream.generateSiteCredential.mockResolvedValue({ credentialBundle: 'bundle' })
    downstream.listSiteCredentials.mockResolvedValue({ credentials: [] })
    downstream.rotateSiteCredential.mockResolvedValue({ credentialBundle: 'rotated' })
    downstream.revokeSiteCredential.mockResolvedValue({ revoked: true })
    downstream.createSiteContent.mockResolvedValue({ content: { contentId: 'content_a' } })
    downstream.updateSiteContentLocaleVersion.mockResolvedValue({ version: { contentId: 'content_a' } })

    await service.listSiteCards('tenant_path', source)
    await service.createSite(
      'tenant_path',
      {
        siteName: 'Brand US',
        siteType: 'brand',
        defaultLocale: 'en-US',
        primaryDomain: 'brand.example',
        previewBaseUrl: 'https://brand.example/preview'
      },
      source
    )
    await service.syncAllPendingChanges('tenant_path', 'site_a', source)
    await service.getPendingSyncSummary('tenant_path', 'site_a', source)
    await service.listSiteCategories('tenant_path', 'site_a', 'en-US', source)
    await service.createSiteCategory(
      'tenant_path',
      'site_a',
      {
        locale: 'en-US',
        slug: 'basins',
        displayTitle: 'Basins',
        seoTitle: 'Basins',
        seoDescription: 'Basins SEO'
      },
      source
    )
    await service.listSiteProducts('tenant_path', 'site_a', 'en-US', source)
    await service.addProductsToSite('tenant_path', 'site_a', { productIds: ['product_a'], locales: ['en-US'] }, source)
    await service.listSiteAuditLogs('tenant_path', 'site_a', source)
    await service.issuePreviewToken(
      'tenant_path',
      'site_a',
      { resourceType: 'blog', resourceId: 'blog_a', locale: 'en-US' },
      source
    )
    await service.generateSiteCredential('tenant_path', 'site_a', { scopes: ['site:read'] }, source)
    await service.listSiteCredentials('tenant_path', 'site_a', source)
    await service.rotateSiteCredential('tenant_path', 'site_a', 'cred_a', source)
    await service.revokeSiteCredential('tenant_path', 'site_a', 'cred_a', source)
    await service.createSiteContent('tenant_path', 'site_a', { contentType: 'blog' }, source)
    await service.updateSiteContentLocaleVersion(
      'tenant_path',
      'site_a',
      {
        contentId: 'content_a',
        locale: 'en-US',
        slug: 'launch',
        title: 'Launch',
        bodyHtml: '<p>Hello</p>',
        seoTitle: 'Launch',
        seoDescription: 'Launch'
      },
      source
    )

    const context = {
      tenantId: 'tenant_path',
      orgId: 'org_a',
      operatorId: 'operator_a',
      requestId: 'request_admin',
      traceId: 'trace_admin'
    }
    expect(downstream.listSiteCards).toHaveBeenCalledWith(context, source)
    expect(downstream.createSite).toHaveBeenCalledWith(
      {
        ...context,
        siteName: 'Brand US',
        siteType: 'brand',
        defaultLocale: 'en-US',
        primaryDomain: 'brand.example',
        previewBaseUrl: 'https://brand.example/preview'
      },
      source
    )
    expect(downstream.syncAllPendingChanges).toHaveBeenCalledWith(
      { context, siteId: 'site_a' },
      source
    )
    expect(downstream.getPendingSyncSummary).toHaveBeenCalledWith(
      { context, siteId: 'site_a' },
      source
    )
    expect(downstream.listSiteCategories).toHaveBeenCalledWith(
      { context, siteId: 'site_a', locale: 'en-US' },
      source
    )
    expect(downstream.createSiteCategory).toHaveBeenCalledWith(
      {
        context,
        siteId: 'site_a',
        locale: 'en-US',
        slug: 'basins',
        displayTitle: 'Basins',
        seoTitle: 'Basins',
        seoDescription: 'Basins SEO'
      },
      source
    )
    expect(downstream.listSiteProducts).toHaveBeenCalledWith(
      { context, siteId: 'site_a', locale: 'en-US' },
      source
    )
    expect(downstream.addProductsToSite).toHaveBeenCalledWith(
      { context, siteId: 'site_a', productIds: ['product_a'], locales: ['en-US'] },
      source
    )
    expect(downstream.listSiteAuditLogs).toHaveBeenCalledWith(
      { context, siteId: 'site_a' },
      source
    )
    expect(downstream.issuePreviewToken).toHaveBeenCalledWith(
      { context, siteId: 'site_a', resourceType: 'blog', resourceId: 'blog_a', locale: 'en-US' },
      source
    )
    expect(downstream.generateSiteCredential).toHaveBeenCalledWith(
      { context, siteId: 'site_a', scopes: ['site:read'] },
      source
    )
    expect(downstream.listSiteCredentials).toHaveBeenCalledWith(
      { context, siteId: 'site_a' },
      source
    )
    expect(downstream.rotateSiteCredential).toHaveBeenCalledWith(
      { context, siteId: 'site_a', credentialId: 'cred_a' },
      source
    )
    expect(downstream.revokeSiteCredential).toHaveBeenCalledWith(
      { context, siteId: 'site_a', credentialId: 'cred_a' },
      source
    )
    expect(downstream.createSiteContent).toHaveBeenCalledWith(
      { context, siteId: 'site_a', contentType: 'blog' },
      source
    )
    expect(downstream.updateSiteContentLocaleVersion).toHaveBeenCalledWith(
      {
        context,
        siteId: 'site_a',
        version: {
          contentId: 'content_a',
          locale: 'en-US',
          slug: 'launch',
          title: 'Launch',
          bodyHtml: '<p>Hello</p>',
          seoTitle: 'Launch',
          seoDescription: 'Launch'
        }
      },
      source
    )
  })
})
