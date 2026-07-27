import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { SiteManagementApi } from './index'

const requestClient = {
  get: vi.fn(),
  post: vi.fn()
}

vi.mock('#/api/request', () => ({ requestClient }))

const validSitePage: SiteManagementApi.SitePage = {
  pageKey: 'FAQ',
  supportedLocales: ['en-US', 'fr-FR'],
  capabilityAvailable: true,
  enabled: false,
  indexable: false,
  capabilityDrift: false,
  syncStatus: 'pending',
  lastDiscoveredAt: '2026-07-20T08:15:30.000Z'
}

describe('site-management BFF API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses the exact page governance BFF URLs, encodes pageKey, and sends only the complete governance pair', async () => {
    const api = await import('./index')

    requestClient.get.mockResolvedValueOnce({ pages: [] })
    requestClient.post.mockResolvedValueOnce({
      page: { ...validSitePage, pageKey: 'FAQ / HELP' }
    })

    await Promise.all([
      api.listSitePagesApi('tenant/a', 'site/a'),
      api.updateSitePageGovernanceApi('tenant/a', 'site/a', 'FAQ / HELP', {
        enabled: true,
        indexable: false
      })
    ])

    expect(requestClient.get).toHaveBeenCalledWith(
      '/site-management/tenants/tenant%2Fa/sites/site%2Fa/pages'
    )
    expect(requestClient.post).toHaveBeenCalledWith(
      '/site-management/tenants/tenant%2Fa/sites/site%2Fa/pages/FAQ%20%2F%20HELP/governance',
      { enabled: true, indexable: false }
    )
  })

  it('rejects non-plain, missing, non-array, and sparse page list envelopes', async () => {
    const api = await import('./index')
    const sparsePages = new Array(1)
    const malformedResponses = [null, [], {}, { pages: {} }, { pages: sparsePages }]

    for (const response of malformedResponses) {
      requestClient.get.mockResolvedValueOnce(response)
      await expect(api.listSitePagesApi('tenant_a', 'site_a')).rejects.toThrow(
        'Invalid SitePage response'
      )
    }
  })

  it('accepts a dense page list larger than a client-invented capacity', async () => {
    const api = await import('./index')
    const pages = Array.from({ length: 257 }, (_, index) => ({
      ...validSitePage,
      pageKey: `PAGE_${index}`
    }))
    requestClient.get.mockResolvedValueOnce({ pages })

    await expect(api.listSitePagesApi('tenant_a', 'site_a')).resolves.toEqual({ pages })
  })

  it('accepts a dense supported locale list larger than a client-invented capacity', async () => {
    const api = await import('./index')
    const supportedLocales = Array.from({ length: 33 }, (_, index) => `x-locale-${index}`)
    const page = { ...validSitePage, supportedLocales }
    requestClient.get.mockResolvedValueOnce({ pages: [page] })

    await expect(api.listSitePagesApi('tenant_a', 'site_a')).resolves.toEqual({
      pages: [page]
    })
  })

  it('rejects duplicate page keys and malformed complete SitePage fields or locale arrays', async () => {
    const api = await import('./index')
    const sparseLocales = new Array(1)
    const malformedResponses = [
      { pages: [validSitePage, { ...validSitePage }] },
      { pages: [{ ...validSitePage, capabilityAvailable: 'true' }] },
      { pages: [{ ...validSitePage, syncStatus: undefined }] },
      { pages: [{ ...validSitePage, lastDiscoveredAt: undefined }] },
      { pages: [{ ...validSitePage, supportedLocales: 'en-US' }] },
      { pages: [{ ...validSitePage, supportedLocales: sparseLocales }] },
      { pages: [{ ...validSitePage, supportedLocales: ['en-US', 42] }] }
    ]

    for (const response of malformedResponses) {
      requestClient.get.mockResolvedValueOnce(response)
      await expect(api.listSitePagesApi('tenant_a', 'site_a')).rejects.toThrow(
        'Invalid SitePage response'
      )
    }
  })

  it('rejects malformed governance responses and a response page identity that differs from the request', async () => {
    const api = await import('./index')
    const malformedResponses = [
      {},
      { page: [] },
      { page: { ...validSitePage, pageKey: 'HOME' } }
    ]

    for (const response of malformedResponses) {
      requestClient.post.mockResolvedValueOnce(response)
      await expect(
        api.updateSitePageGovernanceApi('tenant_a', 'site_a', 'FAQ', {
          enabled: true,
          indexable: false
        })
      ).rejects.toThrow('Invalid SitePage response')
    }
  })

  it('models the actual SitePage and locale readiness response shapes without page or sitemap inventions', () => {
    const page: SiteManagementApi.SitePage = {
      pageKey: 'FAQ',
      supportedLocales: ['en-US', 'fr-FR'],
      capabilityAvailable: true,
      enabled: false,
      indexable: false,
      capabilityDrift: false,
      syncStatus: 'pending',
      lastDiscoveredAt: '2026-07-20T08:15:30.000Z'
    }
    const readiness: SiteManagementApi.LocaleCompletenessResult = {
      complete: false,
      issues: ['SITE_PAGE_LOCALE_COVERAGE_INCOMPLETE:FAQ:fr-FR'],
      preflightIssues: [
        {
          code: 'SITE_PAGE_LOCALE_COVERAGE_INCOMPLETE',
          pageKey: 'FAQ',
          locale: 'fr-FR'
        }
      ]
    }

    expect(Object.keys(page)).toEqual([
      'pageKey',
      'supportedLocales',
      'capabilityAvailable',
      'enabled',
      'indexable',
      'capabilityDrift',
      'syncStatus',
      'lastDiscoveredAt'
    ])
    expect(readiness.preflightIssues).toEqual([
      expect.objectContaining({ pageKey: 'FAQ', locale: 'fr-FR' })
    ])
    expect(page).not.toHaveProperty('pageKind')
    expect(page).not.toHaveProperty('sitemapEnabled')
  })

  it('uses Admin BFF paths and never exposes Site Runtime credential calls to storefront paths', async () => {
    const api = await import('./index')

    api.listSiteCardsApi('tenant_a')
    api.listLocaleOptionsApi('tenant_a')
    api.createSiteApi('tenant_a', { siteName: 'Brand US', siteType: 'brand', defaultLocale: 'en-US' })
    api.syncSiteApi('tenant_a', 'site_a')
    api.getPendingSyncSummaryApi('tenant_a', 'site_a')
    api.retryLastSyncApi('tenant_a', 'site_a')
    api.resendWebhookApi('tenant_a', 'sync_a')
    api.addPreparingLocaleApi('tenant_a', 'site_a', 'fr-FR')
    api.checkLocaleCompletenessApi('tenant_a', 'site_a', 'fr-FR')
    api.activateLocaleApi('tenant_a', 'site_a', 'fr-FR')
    api.disableLocaleApi('tenant_a', 'site_a', 'fr-FR')
    api.listSiteCategoriesApi('tenant_a', 'site_a', 'en-US')
    api.createSiteCategoryApi('tenant_a', 'site_a', {
      locale: 'en-US',
      slug: 'basins',
      displayTitle: 'Basins',
      seoTitle: 'Basins',
      seoDescription: 'Basins SEO'
    })
    api.updateSiteCategoryApi('tenant_a', 'site_a', 'category_a', { displayTitle: 'Updated Basins' })
    api.unpublishSiteCategoryApi('tenant_a', 'site_a', 'category_a', 'en-US')
    api.listSiteProductsApi('tenant_a', 'site_a', 'en-US')
    api.searchProductMasterForAddApi('tenant_a', 'site_a', 'basin')
    api.getSiteProductPublicationApi('tenant_a', 'site_a', 'publication_a')
    api.addProductsToSiteApi('tenant_a', 'site_a', { productIds: ['product_a'], locales: ['en-US'], categoryIds: ['category_a'] })
    api.updateSiteProductPublicationApi('tenant_a', 'site_a', 'publication_a', { displayTitle: 'Updated Basin' })
    api.unpublishSiteProductApi('tenant_a', 'site_a', 'publication_a')
    api.listSiteContentsApi('tenant_a', 'site_a', 'blog')
    api.getSiteContentApi('tenant_a', 'site_a', 'content_a')
    api.createSiteContentApi('tenant_a', 'site_a', { contentType: 'news' })
    api.saveSiteContentLocaleVersionApi('tenant_a', 'site_a', 'content_a', {
      locale: 'en-US',
      slug: 'launch',
      title: 'Launch',
      coverImageAlt: 'Launch cover alt',
      categoryIds: ['content_category_a'],
      bodyHtml: '<p>Launch</p>',
      seoTitle: 'Launch',
      seoDescription: 'Launch SEO'
    })
    api.unpublishSiteContentApi('tenant_a', 'site_a', 'content_a', 'en-US')
    api.listContentCategoriesApi('tenant_a', 'site_a', 'en-US')
    api.getContentCategoryApi('tenant_a', 'site_a', 'content_category_a')
    api.createContentCategoryApi('tenant_a', 'site_a', {
      sortOrder: 10,
      initialLocaleVersion: { locale: 'en-US', slug: 'guides', displayName: 'Guides' }
    })
    api.saveContentCategoryLocaleVersionApi('tenant_a', 'site_a', 'content_category_a', {
      locale: 'en-US',
      slug: 'guides',
      displayName: 'Guides',
      seoTitle: 'Guides',
      seoDescription: 'Guides SEO'
    })
    api.publishContentCategoryLocaleApi('tenant_a', 'site_a', 'content_category_a', 'en-US')
    api.reorderContentCategoriesApi('tenant_a', 'site_a', ['content_category_a'])
    api.deleteContentCategoryApi('tenant_a', 'site_a', 'content_category_a')
    api.listVisibleContentCategoriesApi('tenant_a', 'site_a', 'blog', 'en-US')
    api.checkContentCategoryCompletenessApi('tenant_a', 'site_a', 'content_category_a', 'en-US')
    api.listContentCategoryUsageApi('tenant_a', 'site_a', 'content_category_a')
    api.listSiteAuditLogsApi('tenant_a', 'site_a')
    api.updateSiteSettingsApi('tenant_a', 'site_a', { primaryDomain: 'brand.example.com' })
    api.disableSiteApi('tenant_a', 'site_a', { reason: 'Runtime retired' })
    api.generateSiteCredentialApi('tenant_a', 'site_a', ['site:read'])
    api.listSiteCredentialsApi('tenant_a', 'site_a')
    api.rotateSiteCredentialApi('tenant_a', 'site_a', 'credential_a')
    api.revokeSiteCredentialApi('tenant_a', 'site_a', 'credential_a')
    api.issuePreviewTokenApi('tenant_a', 'site_a', {
      resourceType: 'blog',
      resourceId: 'content_a',
      locale: 'en-US'
    })

    expect(requestClient.get).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites')
    expect(requestClient.get).toHaveBeenCalledWith('/site-management/tenants/tenant_a/locale-options')
    expect(requestClient.post).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites', {
      siteName: 'Brand US',
      siteType: 'brand',
      defaultLocale: 'en-US'
    })
    expect(requestClient.post).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/sync', {})
    expect(requestClient.get).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/sync/pending-summary')
    expect(requestClient.post).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/sync/retry-last', {})
    expect(requestClient.post).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sync/sync_a/webhook:resend', {})
    expect(requestClient.post).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/locales', { locale: 'fr-FR' })
    expect(requestClient.get).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/locales/fr-FR/completeness')
    expect(requestClient.post).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/locales/fr-FR/activate', {})
    expect(requestClient.post).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/locales/fr-FR/disable', {})
    expect(requestClient.get).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/categories', {
      params: { locale: 'en-US' }
    })
    expect(requestClient.post).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/categories', {
      locale: 'en-US',
      slug: 'basins',
      displayTitle: 'Basins',
      seoTitle: 'Basins',
      seoDescription: 'Basins SEO'
    })
    expect(requestClient.post).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/categories/category_a', {
      displayTitle: 'Updated Basins'
    })
    expect(requestClient.post).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/categories/category_a/unpublish', {
      locale: 'en-US'
    })
    expect(requestClient.get).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/products', {
      params: { locale: 'en-US' }
    })
    expect(requestClient.get).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/product-master-candidates', {
      params: { keyword: 'basin' }
    })
    expect(requestClient.get).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/products/publication_a')
    expect(requestClient.post).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/products:add', {
      productIds: ['product_a'],
      locales: ['en-US'],
      categoryIds: ['category_a']
    })
    expect(requestClient.post).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/products/publication_a', {
      displayTitle: 'Updated Basin'
    })
    expect(requestClient.post).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/products/publication_a/unpublish', {})
    expect(requestClient.get).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/contents', {
      params: { contentType: 'blog' }
    })
    expect(requestClient.get).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/contents/content_a')
    expect(requestClient.post).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/contents', { contentType: 'news' })
    expect(requestClient.post).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/contents/content_a/locale-version', {
      locale: 'en-US',
      slug: 'launch',
      title: 'Launch',
      coverImageAlt: 'Launch cover alt',
      categoryIds: ['content_category_a'],
      bodyHtml: '<p>Launch</p>',
      seoTitle: 'Launch',
      seoDescription: 'Launch SEO'
    })
    expect(requestClient.post).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/contents/content_a/unpublish', {
      locale: 'en-US'
    })
    expect(requestClient.get).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/content-categories', {
      params: { locale: 'en-US' }
    })
    expect(requestClient.get).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/content-categories/content_category_a')
    expect(requestClient.post).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/content-categories', {
      sortOrder: 10,
      initialLocaleVersion: { locale: 'en-US', slug: 'guides', displayName: 'Guides' }
    })
    expect(requestClient.post).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/content-categories/content_category_a/locale-version', {
      locale: 'en-US',
      slug: 'guides',
      displayName: 'Guides',
      seoTitle: 'Guides',
      seoDescription: 'Guides SEO'
    })
    expect(requestClient.post).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/content-categories/content_category_a/publish', { locale: 'en-US' })
    expect(requestClient.post).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/content-categories/reorder', { orderedCategoryIds: ['content_category_a'] })
    expect(requestClient.post).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/content-categories/content_category_a/delete', {})
    expect(requestClient.get).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/content-categories/visible', { params: { contentType: 'blog', locale: 'en-US' } })
    expect(requestClient.get).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/content-categories/content_category_a/completeness', { params: { locale: 'en-US' } })
    expect(requestClient.get).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/content-categories/content_category_a/usage')
    expect(requestClient.get).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/audit')
    expect(requestClient.post).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/settings', {
      primaryDomain: 'brand.example.com'
    })
    expect(requestClient.post).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/disable', {
      reason: 'Runtime retired'
    })
    expect(requestClient.post).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/credentials', {
      scopes: ['site:read']
    })
    expect(requestClient.get).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/credentials')
    expect(requestClient.post).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/credentials/credential_a/rotate', {})
    expect(requestClient.post).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/credentials/credential_a/revoke', {})
    expect(requestClient.post).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/preview-token', {
      resourceType: 'blog',
      resourceId: 'content_a',
      locale: 'en-US'
    })
  })

  it('uses only the frozen Admin BFF FAQ routes with encoded tenant, site, and resource identities', async () => {
    const api = await import('./index')
    api.listFaqCategoriesApi('tenant/a', 'site/a', 'en-US')
    api.createFaqEntryApi('tenant/a', 'site/a', { categoryId: 'category/a' })
    api.saveFaqEntryLocaleVersionApi('tenant/a', 'site/a', 'entry/a', { locale: 'en-US', question: 'How?', answerHtml: '<p>Carefully</p>', sortOrder: 1 })
    api.unpublishFaqEntryApi('tenant/a', 'site/a', 'entry/a', 'en-US')
    api.checkFaqCompletenessApi('tenant/a', 'site/a', 'en-US')
    expect(requestClient.get).toHaveBeenCalledWith('/site-management/tenants/tenant%2Fa/sites/site%2Fa/faqs/categories', { params: { locale: 'en-US' } })
    expect(requestClient.post).toHaveBeenCalledWith('/site-management/tenants/tenant%2Fa/sites/site%2Fa/faqs/entries/entry%2Fa/locale-version', { locale: 'en-US', question: 'How?', answerHtml: '<p>Carefully</p>', sortOrder: 1 })
    expect(requestClient.get).toHaveBeenCalledWith('/site-management/tenants/tenant%2Fa/sites/site%2Fa/faqs/completeness', { params: { locale: 'en-US' } })
  })
})
