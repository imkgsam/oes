import 'reflect-metadata'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY } from '@oes/common/auth'
import { REQUIRE_PERMISSIONS_METADATA_KEY, SITE_MANAGEMENT_PERMISSION_CODES } from '@oes/common/authorization'
import { SiteManagementController } from './site-management.controller'

// Verifies Site Management BFF keeps Admin-only permissions and delegates HTTP shape to the service layer.
describe('SiteManagementController', () => {
  const service = {
    createSite: jest.fn(),
    listSiteCards: jest.fn(),
    issuePreviewToken: jest.fn(),
    syncAllPendingChanges: jest.fn(),
    listSiteCategories: jest.fn(),
    createSiteCategory: jest.fn(),
    generateSiteCredential: jest.fn(),
    listSiteCredentials: jest.fn(),
    rotateSiteCredential: jest.fn(),
    revokeSiteCredential: jest.fn(),
    createSiteContent: jest.fn(),
    updateSiteContentLocaleVersion: jest.fn()
  }
  const controller = new SiteManagementController(service as never)
  const source = {
    requestId: 'request_admin',
    traceId: 'trace_admin',
    user: { aid: 'operator_a', tid: 'tenant_a' }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('declares site management permissions and is not anonymous', () => {
    const reflector = new Reflector()

    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, SiteManagementController.prototype.listSiteCards)
    ).toEqual({ all: [SITE_MANAGEMENT_PERMISSION_CODES.READ] })
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, SiteManagementController.prototype.createSite)
    ).toEqual({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, SiteManagementController.prototype.syncAllPendingChanges)
    ).toEqual({ all: [SITE_MANAGEMENT_PERMISSION_CODES.SYNC] })
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, SiteManagementController.prototype.issuePreviewToken)
    ).toEqual({ all: [SITE_MANAGEMENT_PERMISSION_CODES.PREVIEW] })
    expect(reflector.get(IS_PUBLIC_KEY, SiteManagementController.prototype.listSiteCards)).toBeUndefined()
  })

  it('delegates Site Management core paths to the BFF service', async () => {
    service.listSiteCards.mockResolvedValue({ cards: [] })
    service.createSite.mockResolvedValue({ siteId: 'site_a', status: 'draft', defaultLocale: 'en-US' })
    service.syncAllPendingChanges.mockResolvedValue({ syncId: 'sync_a', publishVersion: 1, webhookDispatched: true })
    service.listSiteCategories.mockResolvedValue({ categories: [] })
    service.createSiteCategory.mockResolvedValue({ category: { categoryId: 'category_a' } })
    service.issuePreviewToken.mockResolvedValue({
      previewToken: 'preview_token',
      previewUrl: 'https://site.example/preview',
      expiresAt: '2026-06-15T08:15:00.000Z'
    })
    service.generateSiteCredential.mockResolvedValue({ credentialBundle: 'bundle' })
    service.listSiteCredentials.mockResolvedValue({ credentials: [] })
    service.rotateSiteCredential.mockResolvedValue({ credentialBundle: 'rotated' })
    service.revokeSiteCredential.mockResolvedValue({ revoked: true })
    service.createSiteContent.mockResolvedValue({ content: { contentId: 'content_a' } })
    service.updateSiteContentLocaleVersion.mockResolvedValue({ version: { contentId: 'content_a' } })

    await controller.listSiteCards('tenant_a', source as never)
    await controller.createSite(
      'tenant_a',
      {
        siteName: 'Brand US',
        siteType: 'brand',
        defaultLocale: 'en-US',
        primaryDomain: 'brand.example.com',
        previewBaseUrl: 'https://brand.example.com/preview'
      },
      source as never
    )
    await controller.syncAllPendingChanges('tenant_a', 'site_a', source as never)
    await controller.listSiteCategories('tenant_a', 'site_a', 'en-US', source as never)
    await controller.createSiteCategory(
      'tenant_a',
      'site_a',
      {
        locale: 'en-US',
        slug: 'basins',
        displayTitle: 'Basins',
        seoTitle: 'Basins',
        seoDescription: 'Basins SEO'
      },
      source as never
    )
    await controller.issuePreviewToken(
      'tenant_a',
      'site_a',
      { resourceType: 'blog', resourceId: 'blog_a', locale: 'en-US' },
      source as never
    )
    await controller.generateSiteCredential('tenant_a', 'site_a', { scopes: ['site:read'] }, source as never)
    await controller.listSiteCredentials('tenant_a', 'site_a', source as never)
    await controller.rotateSiteCredential('tenant_a', 'site_a', 'cred_a', source as never)
    await controller.revokeSiteCredential('tenant_a', 'site_a', 'cred_a', source as never)
    await controller.createSiteContent('tenant_a', 'site_a', { contentType: 'blog' }, source as never)
    await controller.updateSiteContentLocaleVersion(
      'tenant_a',
      'site_a',
      'content_a',
      {
        locale: 'en-US',
        slug: 'launch',
        title: 'Launch',
        bodyHtml: '<p>Hello</p>',
        seoTitle: 'Launch',
        seoDescription: 'Launch'
      },
      source as never
    )

    expect(service.listSiteCards).toHaveBeenCalledWith('tenant_a', source)
    expect(service.createSite).toHaveBeenCalledWith(
      'tenant_a',
      {
        siteName: 'Brand US',
        siteType: 'brand',
        defaultLocale: 'en-US',
        primaryDomain: 'brand.example.com',
        previewBaseUrl: 'https://brand.example.com/preview'
      },
      source
    )
    expect(service.syncAllPendingChanges).toHaveBeenCalledWith('tenant_a', 'site_a', source)
    expect(service.listSiteCategories).toHaveBeenCalledWith('tenant_a', 'site_a', 'en-US', source)
    expect(service.createSiteCategory).toHaveBeenCalledWith(
      'tenant_a',
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
    expect(service.issuePreviewToken).toHaveBeenCalledWith(
      'tenant_a',
      'site_a',
      { resourceType: 'blog', resourceId: 'blog_a', locale: 'en-US' },
      source
    )
    expect(service.generateSiteCredential).toHaveBeenCalledWith('tenant_a', 'site_a', { scopes: ['site:read'] }, source)
    expect(service.listSiteCredentials).toHaveBeenCalledWith('tenant_a', 'site_a', source)
    expect(service.rotateSiteCredential).toHaveBeenCalledWith('tenant_a', 'site_a', 'cred_a', source)
    expect(service.revokeSiteCredential).toHaveBeenCalledWith('tenant_a', 'site_a', 'cred_a', source)
    expect(service.createSiteContent).toHaveBeenCalledWith('tenant_a', 'site_a', { contentType: 'blog' }, source)
    expect(service.updateSiteContentLocaleVersion).toHaveBeenCalledWith(
      'tenant_a',
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
  })
})
