import { SiteManagementService, SiteManagementDownstream } from './site-management.service'
import { VerifiedTenantTarget } from '../../common/tenant-target'

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
    listSitePages: jest.fn(),
    updateSitePageGovernance: jest.fn(),
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
    listContentCategories: jest.fn(),
    getContentCategory: jest.fn(),
    createContentCategory: jest.fn(),
    updateContentCategoryLocaleVersion: jest.fn(),
    publishContentCategoryLocale: jest.fn(),
    reorderContentCategories: jest.fn(),
    deleteContentCategory: jest.fn(),
    listVisibleContentCategories: jest.fn(),
    checkContentCategoryCompleteness: jest.fn(),
    listContentCategoryUsage: jest.fn(),
    listFaqCategories: jest.fn(),
    getFaqCategory: jest.fn(),
    createFaqCategory: jest.fn(),
    updateFaqCategoryLocaleVersion: jest.fn(),
    disableFaqCategory: jest.fn(),
    listFaqEntries: jest.fn(),
    getFaqEntry: jest.fn(),
    createFaqEntry: jest.fn(),
    updateFaqEntryLocaleVersion: jest.fn(),
    unpublishFaqEntry: jest.fn(),
    checkFaqCompleteness: jest.fn(),
    listSiteAuditLogs: jest.fn()
  }
  const service = new SiteManagementService(downstream)
  const verifiedTenantTarget = 'tenant_path' as VerifiedTenantTarget
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

  it('forwards FAQ commands and reads with the verified tenant/operator context', async () => {
    downstream.createFaqCategory.mockResolvedValue({ category: { categoryId: 'faq_category_a' } })
    downstream.updateFaqEntryLocaleVersion.mockResolvedValue({ version: { entryId: 'faq_entry_a' } })
    downstream.checkFaqCompleteness.mockResolvedValue({ complete: true, issues: [] })
    await service.createFaqCategory(verifiedTenantTarget, 'site_a', source)
    await service.updateFaqEntryLocaleVersion(verifiedTenantTarget, 'site_a', 'faq_entry_a', { entryId: 'ignored', locale: 'en-US', question: 'How?', answerHtml: '<p>Carefully</p>', sortOrder: 1 }, source)
    await service.checkFaqCompleteness(verifiedTenantTarget, 'site_a', 'en-US', source)
    expect(downstream.createFaqCategory).toHaveBeenCalledWith({ context: expect.objectContaining({ tenantId: 'tenant_path', operatorId: 'operator_a' }), siteId: 'site_a' }, source)
    expect(downstream.updateFaqEntryLocaleVersion).toHaveBeenCalledWith(expect.objectContaining({ siteId: 'site_a', version: expect.objectContaining({ entryId: 'faq_entry_a' }) }), source)
  })

  it('delegates page-wide enabled/index governance without a locale or sitemap switch', async () => {
    downstream.listSitePages.mockResolvedValue({ pages: [] })
    downstream.updateSitePageGovernance.mockResolvedValue({
      page: { pageKey: 'HOME', enabled: true, indexable: false }
    })

    await service.listSitePages(verifiedTenantTarget, 'site_a', source)
    await service.updateSitePageGovernance(
      verifiedTenantTarget,
      'site_a',
      'HOME',
      { enabled: true, indexable: false },
      source
    )

    const context = {
      tenantId: 'tenant_path',
      orgId: 'org_a',
      operatorId: 'operator_a',
      requestId: 'request_admin',
      traceId: 'trace_admin'
    }
    expect(downstream.listSitePages).toHaveBeenCalledWith({ context, siteId: 'site_a' }, source)
    expect(downstream.updateSitePageGovernance).toHaveBeenCalledWith(
      {
        context,
        siteId: 'site_a',
        pageKey: 'HOME',
        enabled: true,
        indexable: false
      },
      source
    )
  })

  it('builds Admin context only from the guard-verified target, not the session tenant field', async () => {
    downstream.listSiteCards.mockResolvedValue({ cards: [] })

    await service.listSiteCards(verifiedTenantTarget, source)

    expect(downstream.listSiteCards).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant_path' }),
      source
    )
  })

  it('delegates list/create/sync/preview with explicit admin context', async () => {
    downstream.listSiteCards.mockResolvedValue({ cards: [] })
    downstream.createSite.mockResolvedValue({
      siteId: 'site_a',
      status: 'draft',
      defaultLocale: 'en-US'
    })
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
    downstream.updateSiteContentLocaleVersion.mockResolvedValue({
      version: { contentId: 'content_a' }
    })
    downstream.listContentCategories.mockResolvedValue({ categories: [] })
    downstream.getContentCategory.mockResolvedValue({
      category: { categoryId: 'content_category_a' }
    })
    downstream.createContentCategory.mockResolvedValue({
      category: { categoryId: 'content_category_a' }
    })
    downstream.updateContentCategoryLocaleVersion.mockResolvedValue({
      version: { categoryId: 'content_category_a' }
    })
    downstream.publishContentCategoryLocale.mockResolvedValue({ version: { categoryId: 'content_category_a' } })

    await service.listSiteCards(verifiedTenantTarget, source)
    await expect(service.listLocaleOptions()).toEqual({
      locales: expect.arrayContaining([
        { locale: 'en-US', nativeName: 'English (United States)' },
        { locale: 'zh-CN', nativeName: '简体中文' }
      ])
    })
    await service.createSite(
      verifiedTenantTarget,
      {
        siteName: 'Brand US',
        siteType: 'brand',
        defaultLocale: 'en-US',
        primaryDomain: 'brand.example',
        previewBaseUrl: 'https://brand.example/preview'
      },
      source
    )
    await service.syncAllPendingChanges(verifiedTenantTarget, 'site_a', source)
    await service.getPendingSyncSummary(verifiedTenantTarget, 'site_a', source)
    await service.listSiteCategories(verifiedTenantTarget, 'site_a', 'en-US', source)
    await service.createSiteCategory(
      verifiedTenantTarget,
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
    await service.listSiteProducts(verifiedTenantTarget, 'site_a', 'en-US', source)
    await service.addProductsToSite(
      verifiedTenantTarget,
      'site_a',
      { productIds: ['product_a'], locales: ['en-US'] },
      source
    )
    await service.listSiteAuditLogs(verifiedTenantTarget, 'site_a', source)
    await service.issuePreviewToken(
      verifiedTenantTarget,
      'site_a',
      { resourceType: 'blog', resourceId: 'blog_a', locale: 'en-US' },
      source
    )
    await service.generateSiteCredential(
      verifiedTenantTarget,
      'site_a',
      { scopes: ['site:read'] },
      source
    )
    await service.listSiteCredentials(verifiedTenantTarget, 'site_a', source)
    await service.rotateSiteCredential(verifiedTenantTarget, 'site_a', 'cred_a', source)
    await service.revokeSiteCredential(verifiedTenantTarget, 'site_a', 'cred_a', source)
    await service.createSiteContent(verifiedTenantTarget, 'site_a', { contentType: 'blog' }, source)
    await service.updateSiteContentLocaleVersion(
      verifiedTenantTarget,
      'site_a',
      {
        contentId: 'content_a',
        locale: 'en-US',
        slug: 'launch',
        title: 'Launch',
        coverImageAlt: 'Launch cover alt',
        bodyHtml: '<p>Hello</p>',
        seoTitle: 'Launch',
        seoDescription: 'Launch'
      },
      source
    )
    await service.listContentCategories(verifiedTenantTarget, 'site_a', 'en-US', source)
    await service.getContentCategory(verifiedTenantTarget, 'site_a', 'content_category_a', source)
    await service.createContentCategory(
      verifiedTenantTarget,
      'site_a',
      {
        sortOrder: 10,
        initialLocaleVersion: { locale: 'en-US', slug: 'guides', displayName: 'Guides' }
      },
      source
    )
    await service.updateContentCategoryLocaleVersion(
      verifiedTenantTarget,
      'site_a',
      'content_category_a',
      {
        locale: 'en-US',
        slug: 'guides',
        displayName: 'Guides',
        seoTitle: 'Guides',
        seoDescription: 'Guides SEO'
      },
      source
    )
    await service.publishContentCategoryLocale(
      verifiedTenantTarget,
      'site_a',
      'content_category_a',
      'en-US',
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
    expect(downstream.listSiteAuditLogs).toHaveBeenCalledWith({ context, siteId: 'site_a' }, source)
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
          coverImageAlt: 'Launch cover alt',
          bodyHtml: '<p>Hello</p>',
          seoTitle: 'Launch',
          seoDescription: 'Launch'
        }
      },
      source
    )
    expect(downstream.listContentCategories).toHaveBeenCalledWith(
      { context, siteId: 'site_a', locale: 'en-US' },
      source
    )
    expect(downstream.getContentCategory).toHaveBeenCalledWith(
      { context, siteId: 'site_a', categoryId: 'content_category_a' },
      source
    )
    expect(downstream.createContentCategory).toHaveBeenCalledWith(
      {
        context,
        siteId: 'site_a',
        sortOrder: 10,
        initialLocaleVersion: { locale: 'en-US', slug: 'guides', displayName: 'Guides' }
      },
      source
    )
    expect(downstream.updateContentCategoryLocaleVersion).toHaveBeenCalledWith(
      {
        context,
        siteId: 'site_a',
        version: {
          categoryId: 'content_category_a',
          locale: 'en-US',
          slug: 'guides',
          displayName: 'Guides',
          seoTitle: 'Guides',
          seoDescription: 'Guides SEO'
        }
      },
      source
    )
    expect(downstream.publishContentCategoryLocale).toHaveBeenCalledWith(
      { context, siteId: 'site_a', categoryId: 'content_category_a', locale: 'en-US' },
      source
    )
  })
})
