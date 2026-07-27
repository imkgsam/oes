import { SiteAdminApplicationService } from '../../src/application/services/site-admin-application.service'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { PrismaSiteRepository } from '../../src/infrastructure/repositories/prisma-site.repository'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'

// Verifies database-owned dynamic slug reservation and publication transitions against PostgreSQL.
describe('site-service dynamic slug ledger L2', () => {
  let prisma: PrismaService
  let repository: PrismaSiteRepository
  let prefix: string
  let sequence: number

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    repository = new PrismaSiteRepository(prisma)
  })

  beforeEach(() => {
    prefix = createTestPrefix()
    sequence = 0
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    await cleanupByPrefix(prisma, prefix)
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('lets the database accept only one of two concurrent resources claiming the same normalized slug', async () => {
    const { admin, siteId, context } = await createSite()
    const blogA = await createContent(admin, siteId, context, 'blog')
    const blogB = await createContent(admin, siteId, context, 'blog')

    const results = await Promise.allSettled([
      saveContent(admin, siteId, context, blogA, '  Ｓｈａｒｅｄ-Ｓｌｕｇ  '),
      saveContent(admin, siteId, context, blogB, 'shared-slug')
    ])

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1)
    expect(
      await prisma.getExecutionClient().siteSlugLedger.count({
        where: { siteId, namespace: 'blog', locale: 'en-US', normalizedSlug: 'shared-slug' }
      })
    ).toBe(1)
    expect(
      await prisma.getExecutionClient().siteContentLocaleVersion.count({
        where: { contentId: { in: [blogA, blogB] } }
      })
    ).toBe(1)
  })

  it('never lets another resource reuse a historical slug', async () => {
    const { admin, siteId, context } = await createSite()
    const owner = await createContent(admin, siteId, context, 'blog')
    await saveContent(admin, siteId, context, owner, 'first-slug')
    await sync(admin, siteId, context)
    await saveContent(admin, siteId, context, owner, 'second-slug')
    await sync(admin, siteId, context)
    const other = await createContent(admin, siteId, context, 'blog')

    await expect(saveContent(admin, siteId, context, other, 'first-slug')).rejects.toThrow()
    expect(
      await prisma.getExecutionClient().siteSlugLedger.findUnique({
        where: {
          siteId_namespace_locale_normalizedSlug: {
            siteId,
            namespace: 'blog',
            locale: 'en-US',
            normalizedSlug: 'first-slug'
          }
        }
      })
    ).toEqual(expect.objectContaining({ resourceId: owner, publicationRole: 'historical' }))
  })

  it('releases the previous draft-only slug when an unpublished resource is renamed', async () => {
    const { admin, siteId, context } = await createSite()
    const first = await createContent(admin, siteId, context, 'blog')
    await saveContent(admin, siteId, context, first, 'draft-one')
    await saveContent(admin, siteId, context, first, 'draft-two')
    const second = await createContent(admin, siteId, context, 'blog')

    await expect(saveContent(admin, siteId, context, second, 'draft-one')).resolves.toBeDefined()
    const rows = await prisma.getExecutionClient().siteSlugLedger.findMany({
      where: { siteId, namespace: 'blog', locale: 'en-US' },
      orderBy: { normalizedSlug: 'asc' }
    })
    expect(rows).toEqual([
      expect.objectContaining({ normalizedSlug: 'draft-one', resourceId: second }),
      expect.objectContaining({ normalizedSlug: 'draft-two', resourceId: first })
    ])
  })

  it('keeps the published canonical live until Sync promotes the new draft slug', async () => {
    const { admin, siteId, context } = await createSite()
    const contentId = await createContent(admin, siteId, context, 'blog')
    await saveContent(admin, siteId, context, contentId, 'canonical-one')
    await sync(admin, siteId, context)
    await saveContent(admin, siteId, context, contentId, 'draft-two')

    const view = await publicView(siteId, 'blog', contentId)
    const ledgers = await prisma.getExecutionClient().siteSlugLedger.findMany({
      where: { siteId, namespace: 'blog', resourceId: contentId },
      orderBy: { normalizedSlug: 'asc' }
    })
    expect(view).toEqual(expect.objectContaining({ slug: 'canonical-one' }))
    expect(ledgers).toEqual([
      expect.objectContaining({ normalizedSlug: 'canonical-one', publicationRole: 'canonical' }),
      expect.objectContaining({ normalizedSlug: 'draft-two', draftReserved: true })
    ])
  })

  it('materializes history from the ledger and keeps a swap-back redirect single-hop', async () => {
    const { admin, siteId, context } = await createSite()
    const contentId = await createContent(admin, siteId, context, 'blog')
    await saveContent(admin, siteId, context, contentId, 'slug-one')
    await sync(admin, siteId, context)
    await saveContent(admin, siteId, context, contentId, 'slug-two')
    await sync(admin, siteId, context)
    expect(await publicView(siteId, 'blog', contentId)).toEqual(
      expect.objectContaining({
        slug: 'slug-two',
        payload: expect.objectContaining({ historical_slugs: ['slug-one'] })
      })
    )

    await saveContent(admin, siteId, context, contentId, 'slug-one')
    await sync(admin, siteId, context)

    expect(await publicView(siteId, 'blog', contentId)).toEqual(
      expect.objectContaining({
        slug: 'slug-one',
        payload: expect.objectContaining({ historical_slugs: ['slug-two'] })
      })
    )
  })

  it('allows Blog and News to use the same slug because their URL namespaces are independent', async () => {
    const { admin, siteId, context } = await createSite()
    const blog = await createContent(admin, siteId, context, 'blog')
    const news = await createContent(admin, siteId, context, 'news')

    await expect(saveContent(admin, siteId, context, blog, 'shared-detail')).resolves.toBeDefined()
    await expect(saveContent(admin, siteId, context, news, 'shared-detail')).resolves.toBeDefined()
    expect(
      await prisma.getExecutionClient().siteSlugLedger.findMany({
        where: { siteId, locale: 'en-US', normalizedSlug: 'shared-detail' },
        orderBy: { namespace: 'asc' }
      })
    ).toEqual([
      expect.objectContaining({ namespace: 'blog', resourceId: blog }),
      expect.objectContaining({ namespace: 'news', resourceId: news })
    ])
  })

  it('uses one article-category namespace for the shared Content Category object', async () => {
    const { admin, siteId, context } = await createSite()
    const blogCategory = await admin.createContentCategory({
      context,
      siteId,
      appliesTo: 'blog'
    })
    const newsCategory = await admin.createContentCategory({
      context,
      siteId,
      appliesTo: 'news'
    })
    await saveCategory(
      admin,
      siteId,
      context,
      blogCategory.category.categoryId,
      'shared-category'
    )

    await expect(
      saveCategory(
        admin,
        siteId,
        context,
        newsCategory.category.categoryId,
        'shared-category'
      )
    ).rejects.toThrow()
  })

  it('rolls back slug promotion, public view, and CAS clearing when Sync fails', async () => {
    const { admin, siteId, context } = await createSite()
    const contentId = await createContent(admin, siteId, context, 'blog')
    await saveContent(admin, siteId, context, contentId, 'stable-slug')
    await sync(admin, siteId, context)
    await saveContent(admin, siteId, context, contentId, 'failed-slug')
    jest.spyOn(repository, 'upsertPublicView').mockRejectedValueOnce(new Error('public view failed'))

    await expect(sync(admin, siteId, context)).rejects.toThrow('public view failed')

    expect(await publicView(siteId, 'blog', contentId)).toEqual(
      expect.objectContaining({ slug: 'stable-slug' })
    )
    expect(
      await prisma.getExecutionClient().siteSlugLedger.findMany({
        where: { siteId, namespace: 'blog', resourceId: contentId },
        orderBy: { normalizedSlug: 'asc' }
      })
    ).toEqual([
      expect.objectContaining({ normalizedSlug: 'failed-slug', draftReserved: true }),
      expect.objectContaining({ normalizedSlug: 'stable-slug', publicationRole: 'canonical' })
    ])
    expect(
      await prisma.getExecutionClient().siteContentLocaleVersion.findUnique({
        where: { contentId_locale: { contentId, locale: 'en-US' } },
        select: { syncStatus: true }
      })
    ).toEqual({ syncStatus: 'pending' })
  })

  /** createSite builds one tenant-owned Site and a real application service for each test. */
  async function createSite() {
    const admin = new SiteAdminApplicationService(repository, {
      previewTokenSecret: 'site-service-local-preview-secret',
      now: () => new Date('2026-07-22T08:00:00.000Z'),
      randomId: (kind) => `${prefix}_${kind}_${++sequence}`,
      randomSecret: () => `${prefix}_secret`,
      oesBaseUrl: 'https://oes.example/api/v1/site',
      environment: 'test'
    })
    const context = {
      tenantId: `${prefix}_tenant`,
      operatorId: `${prefix}_operator`,
      traceId: `${prefix}_trace`
    }
    const site = await admin.createSite({
      ...context,
      siteName: `${prefix} Site`,
      siteType: 'brand',
      defaultLocale: 'en-US'
    })
    return { admin, siteId: site.siteId, context }
  }

  /** createContent creates one Blog or News aggregate without a locale child. */
  async function createContent(
    admin: SiteAdminApplicationService,
    siteId: string,
    context: { tenantId: string; operatorId: string; traceId: string },
    contentType: 'blog' | 'news'
  ): Promise<string> {
    const created = await admin.createSiteContent({ context, siteId, contentType })
    return created.content!.contentId
  }

  /** saveContent persists one complete locale draft through the application transaction boundary. */
  function saveContent(
    admin: SiteAdminApplicationService,
    siteId: string,
    context: { tenantId: string; operatorId: string; traceId: string },
    contentId: string,
    slug: string
  ) {
    return admin.updateSiteContentLocaleVersion({
      context,
      siteId,
      version: {
        contentId,
        locale: 'en-US',
        slug,
        title: `${contentId} title`,
        bodyHtml: '<p>Body</p>',
        seoTitle: `${contentId} SEO`,
        seoDescription: `${contentId} description`
      }
    })
  }

  /** saveCategory persists one shared Blog/News Content Category locale draft. */
  function saveCategory(
    admin: SiteAdminApplicationService,
    siteId: string,
    context: { tenantId: string; operatorId: string; traceId: string },
    categoryId: string,
    slug: string
  ) {
    return admin.updateContentCategoryLocaleVersion({
      context,
      siteId,
      version: {
        categoryId,
        locale: 'en-US',
        slug,
        displayName: `${categoryId} name`,
        seoTitle: `${categoryId} SEO`,
        seoDescription: `${categoryId} description`
      }
    })
  }

  /** sync publishes all current revisions through the real Site Sync transaction. */
  function sync(
    admin: SiteAdminApplicationService,
    siteId: string,
    context: { tenantId: string; operatorId: string; traceId: string }
  ) {
    return admin.syncAllPendingChanges({ context, siteId })
  }

  /** publicView reads the committed runtime projection for one dynamic resource. */
  function publicView(siteId: string, resourceType: string, resourceId: string) {
    return prisma.getExecutionClient().sitePublicView.findUnique({
      where: {
        siteId_resourceType_resourceId_locale: {
          siteId,
          resourceType,
          resourceId,
          locale: 'en-US'
        }
      }
    })
  }
})
