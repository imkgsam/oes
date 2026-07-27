import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { PrismaSiteRepository } from '../../src/infrastructure/repositories/prisma-site.repository'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'

// Verifies Prisma preview facts and draft reads preserve Site/type/id/locale ownership boundaries.
describe('Prisma site preview ownership L2', () => {
  let prisma: PrismaService
  let repository: PrismaSiteRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    repository = new PrismaSiteRepository(prisma)
  })

  beforeEach(async () => {
    prefix = createTestPrefix()
    await cleanupByPrefix(prisma, prefix)
  })

  afterEach(async () => {
    await cleanupByPrefix(prisma, prefix)
  })

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  /** createSite seeds one tenant-owned Site without adding unrelated preview state. */
  async function createSite(siteId: string, tenantId: string, suffix: string): Promise<void> {
    await repository.createSiteWithDefaultLocale({
      siteId,
      tenantId,
      siteCode: `${prefix}_${suffix}`,
      siteName: `${prefix} ${suffix}`,
      siteType: 'brand',
      defaultLocale: 'en-US',
      primaryDomain: null,
      previewBaseUrl: null,
      createdBy: `${prefix}_operator`
    })
  }

  /** createContent seeds one saved Blog/News locale version for preview ownership checks. */
  async function createContent(input: {
    siteId: string
    tenantId: string
    contentId: string
    contentType: 'blog' | 'news'
    locale: string
  }): Promise<void> {
    await repository.createContentWithLocaleVersion({
      contentId: input.contentId,
      contentVersionId: `${input.contentId}_${input.locale}`,
      siteId: input.siteId,
      tenantId: input.tenantId,
      contentType: input.contentType,
      locale: input.locale,
      slug: `${input.contentId}-${input.locale.toLowerCase()}`,
      title: `${input.contentType} ${input.contentId}`,
      bodyHtml: `<p>${input.contentId}</p>`,
      summary: input.contentId,
      coverImage: null,
      coverImageAlt: null,
      author: 'OES',
      categoryIds: [],
      seoTitle: input.contentId,
      seoDescription: input.contentId,
      seoImage: null,
      publishedAt: null,
      status: 'draft',
      syncStatus: 'pending'
    })
  }

  /** createProduct seeds one existing site-scoped SiteProductPublication safety-gate fact. */
  async function createProduct(input: {
    publicationId: string
    siteId: string
    tenantId: string
    productId: string
    locale: string
  }): Promise<void> {
    await repository.addProductPublication({
      publicationId: input.publicationId,
      siteId: input.siteId,
      tenantId: input.tenantId,
      productId: input.productId,
      locale: input.locale,
      slug: `${input.productId}-${input.locale.toLowerCase()}`,
      displayTitle: input.productId,
      displayDescription: input.productId,
      seoTitle: input.productId,
      seoDescription: input.productId,
      seoImage: null,
      imageOverride: null,
      publishStatus: 'draft',
      syncStatus: 'pending'
    })
  }

  it('returns minimal ownership facts across tenants, Sites, content types, locales, and Products', async () => {
    const tenantA = `${prefix}_tenant_a`
    const tenantForeign = `${prefix}_tenant_foreign`
    const siteA = `${prefix}_site_a`
    const siteB = `${prefix}_site_b`
    const siteForeign = `${prefix}_site_foreign`
    const blogA = `${prefix}_blog_a`
    const blogB = `${prefix}_blog_b`
    const newsA = `${prefix}_news_a`
    const blogForeign = `${prefix}_blog_foreign`
    const sharedProduct = `${prefix}_product_shared`
    const multiLocaleProduct = `${prefix}_product_multi_locale`
    const foreignProduct = `${prefix}_product_foreign`

    await createSite(siteA, tenantA, 'a')
    await createSite(siteB, tenantA, 'b')
    await createSite(siteForeign, tenantForeign, 'foreign')
    await createContent({
      siteId: siteA,
      tenantId: tenantA,
      contentId: blogA,
      contentType: 'blog',
      locale: 'en-US'
    })
    await createContent({
      siteId: siteB,
      tenantId: tenantA,
      contentId: blogB,
      contentType: 'blog',
      locale: 'en-US'
    })
    await createContent({
      siteId: siteA,
      tenantId: tenantA,
      contentId: newsA,
      contentType: 'news',
      locale: 'en-US'
    })
    await createContent({
      siteId: siteForeign,
      tenantId: tenantForeign,
      contentId: blogForeign,
      contentType: 'blog',
      locale: 'zh-CN'
    })
    await createProduct({
      publicationId: `${prefix}_publication_a`,
      siteId: siteA,
      tenantId: tenantA,
      productId: sharedProduct,
      locale: 'en-US'
    })
    await createProduct({
      publicationId: `${prefix}_publication_b`,
      siteId: siteB,
      tenantId: tenantA,
      productId: sharedProduct,
      locale: 'zh-CN'
    })
    await createProduct({
      publicationId: `${prefix}_publication_multi_en`,
      siteId: siteA,
      tenantId: tenantA,
      productId: multiLocaleProduct,
      locale: 'en-US'
    })
    await createProduct({
      publicationId: `${prefix}_publication_multi_zh`,
      siteId: siteA,
      tenantId: tenantA,
      productId: multiLocaleProduct,
      locale: 'zh-CN'
    })
    await createProduct({
      publicationId: `${prefix}_publication_foreign`,
      siteId: siteForeign,
      tenantId: tenantForeign,
      productId: foreignProduct,
      locale: 'en-US'
    })

    await expect(
      repository.findPreviewResourceOwnership({
        siteId: siteA,
        resourceType: 'blog',
        resourceId: blogA,
        locale: 'en-US'
      })
    ).resolves.toEqual({ siteId: siteA, resourceType: 'blog', localeMatched: true })
    await expect(
      repository.findPreviewResourceOwnership({
        siteId: siteA,
        resourceType: 'blog',
        resourceId: blogB,
        locale: 'en-US'
      })
    ).resolves.toEqual({ siteId: siteB, resourceType: 'blog', localeMatched: true })
    await expect(
      repository.findPreviewResourceOwnership({
        siteId: siteA,
        resourceType: 'blog',
        resourceId: blogForeign,
        locale: 'zh-CN'
      })
    ).resolves.toEqual({ siteId: siteForeign, resourceType: 'blog', localeMatched: true })
    await expect(
      repository.findPreviewResourceOwnership({
        siteId: siteA,
        resourceType: 'blog',
        resourceId: newsA,
        locale: 'en-US'
      })
    ).resolves.toEqual({ siteId: siteA, resourceType: 'news', localeMatched: true })
    await expect(
      repository.findPreviewResourceOwnership({
        siteId: siteA,
        resourceType: 'blog',
        resourceId: blogA,
        locale: 'zh-CN'
      })
    ).resolves.toEqual({ siteId: siteA, resourceType: 'blog', localeMatched: false })
    await expect(
      repository.findPreviewResourceOwnership({
        siteId: siteA,
        resourceType: 'blog',
        resourceId: `${prefix}_missing`,
        locale: 'en-US'
      })
    ).resolves.toBeNull()
    await expect(
      repository.findPreviewResourceOwnership({
        siteId: siteA,
        resourceType: 'product',
        resourceId: sharedProduct,
        locale: 'zh-CN'
      })
    ).resolves.toEqual({ siteId: siteA, resourceType: 'product', localeMatched: false })
    await expect(
      repository.findPreviewResourceOwnership({
        siteId: siteA,
        resourceType: 'product',
        resourceId: multiLocaleProduct,
        locale: 'zh-CN'
      })
    ).resolves.toEqual({ siteId: siteA, resourceType: 'product', localeMatched: true })
    await expect(
      repository.findPreviewResourceOwnership({
        siteId: siteA,
        resourceType: 'product',
        resourceId: foreignProduct,
        locale: 'en-US'
      })
    ).resolves.toEqual({ siteId: siteForeign, resourceType: 'product', localeMatched: true })

    await expect(
      repository.getPreviewContentVersionForPublicView({
        siteId: siteA,
        resourceType: 'blog',
        contentId: blogA,
        locale: 'en-US'
      })
    ).resolves.toEqual(expect.objectContaining({ contentId: blogA, contentType: 'blog' }))
    await expect(
      repository.getPreviewContentVersionForPublicView({
        siteId: siteA,
        resourceType: 'blog',
        contentId: blogB,
        locale: 'en-US'
      })
    ).resolves.toBeNull()
    await expect(
      repository.getPreviewContentVersionForPublicView({
        siteId: siteA,
        resourceType: 'blog',
        contentId: newsA,
        locale: 'en-US'
      })
    ).resolves.toBeNull()
    await expect(
      repository.getPreviewContentVersionForPublicView({
        siteId: siteA,
        resourceType: 'blog',
        contentId: blogA,
        locale: 'zh-CN'
      })
    ).resolves.toBeNull()
  })
})
