import { describe, expect, it, vi } from 'vitest'

const requestClient = {
  get: vi.fn(),
  post: vi.fn()
}

vi.mock('#/api/request', () => ({ requestClient }))

describe('site-management BFF API', () => {
  it('uses Admin BFF paths and never exposes Site Runtime credential calls to storefront paths', async () => {
    const api = await import('./index')

    api.listSiteCardsApi('tenant_a')
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
      bodyHtml: '<p>Launch</p>',
      seoTitle: 'Launch',
      seoDescription: 'Launch SEO'
    })
    api.unpublishSiteContentApi('tenant_a', 'site_a', 'content_a', 'en-US')
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
      bodyHtml: '<p>Launch</p>',
      seoTitle: 'Launch',
      seoDescription: 'Launch SEO'
    })
    expect(requestClient.post).toHaveBeenCalledWith('/site-management/tenants/tenant_a/sites/site_a/contents/content_a/unpublish', {
      locale: 'en-US'
    })
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
})
