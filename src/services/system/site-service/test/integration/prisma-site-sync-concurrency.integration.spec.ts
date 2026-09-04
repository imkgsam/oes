import { SiteAdminApplicationService } from '../../src/application/services/site-admin-application.service'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { PrismaSiteRepository } from '../../src/infrastructure/repositories/prisma-site.repository'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'

/** This suite verifies Site publish serialization, revision CAS, and rollback against PostgreSQL. */
describe('Prisma Site Sync concurrency Integration', () => {
  let prisma: PrismaService
  let repository: PrismaSiteRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    repository = new PrismaSiteRepository(prisma)
  })

  beforeEach(() => {
    prefix = createTestPrefix()
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    await cleanupByPrefix(prisma, prefix)
  })
  afterAll(async () => prisma?.$disconnect())

  /** createHarness creates one pending Blog revision and its real application service. */
  async function createHarness() {
    const siteId = `${prefix}_site`
    const tenantId = `${prefix}_tenant`
    const contentId = `${prefix}_content`
    const operatorId = `${prefix}_operator`
    await repository.createSiteWithDefaultLocale({
      siteId,
      tenantId,
      siteCode: `${prefix}_code`,
      siteName: 'Sync concurrency site',
      siteType: 'brand',
      defaultLocale: 'en-US',
      primaryDomain: null,
      previewBaseUrl: null,
      createdBy: operatorId
    })
    await repository.createContentEntry({
      contentId,
      siteId,
      tenantId,
      contentType: 'blog',
      status: 'draft'
    })
    await repository.updateContentLocaleVersion({
      contentVersionId: `${prefix}_version`,
      contentId,
      siteId,
      tenantId,
      locale: 'en-US',
      slug: 'sync-concurrency',
      title: 'Revision one',
      bodyHtml: '<p>Revision one</p>',
      summary: null,
      coverImage: null,
      coverImageAlt: null,
      author: null,
      categoryIds: [],
      seoTitle: 'Revision one',
      seoDescription: 'Revision one',
      seoImage: null,
      publishedAt: null,
      status: 'draft',
      syncStatus: 'pending'
    })
    const admin = new SiteAdminApplicationService(repository, {
      previewTokenSecret: 'site-sync-concurrency-test-secret',
      randomId: (kind) => `${prefix}_${kind}`
    })
    const request = { context: { tenantId, operatorId }, siteId }
    return { admin, contentId, operatorId, request, siteId, tenantId }
  }

  it('serializes two same-Site Sync requests into one publish version and one batch', async () => {
    const { admin, request, siteId } = await createHarness()

    const results = await Promise.all([
      admin.syncAllPendingChanges(request),
      admin.syncAllPendingChanges(request)
    ])

    expect(results.map((result) => result.syncId).sort()).toEqual(['', `${prefix}_sync`])
    expect(results.every((result) => result.publishVersion === 1)).toBe(true)
    await expect(prisma.siteSyncBatch.count({ where: { siteId } })).resolves.toBe(1)
    await expect(
      prisma.site.findUnique({ where: { siteId }, select: { latestPublishVersion: true } })
    ).resolves.toEqual({ latestPublishVersion: 1 })
  })

  it('keeps a newer Content revision pending when two saves share the same timestamp', async () => {
    const { admin, contentId, request, siteId } = await createHarness()
    const initial = await prisma.siteContentLocaleVersion.findUnique({
      where: { contentId_locale: { contentId, locale: 'en-US' } },
      select: { updatedAt: true, syncRevision: true }
    })
    if (!initial) {
      throw new Error('initial Content revision was not created')
    }
    const originalUpsert = repository.upsertPublicView.bind(repository)
    const editor = await createPrismaForIntegration()
    jest.spyOn(repository, 'upsertPublicView').mockImplementationOnce(async (input) => {
      await originalUpsert(input)
      await editor.siteContentLocaleVersion.update({
        where: { contentId_locale: { contentId, locale: 'en-US' } },
        data: {
          title: 'Revision two',
          bodyHtml: '<p>Revision two</p>',
          seoTitle: 'Revision two',
          seoDescription: 'Revision two',
          syncStatus: 'pending',
          syncRevision: { increment: 1 },
          updatedAt: initial.updatedAt
        }
      })
    })

    try {
      await expect(admin.syncAllPendingChanges(request)).resolves.toEqual(
        expect.objectContaining({ publishVersion: 1 })
      )
    } finally {
      await editor.$disconnect()
    }

    await expect(
      prisma.siteContentLocaleVersion.findUnique({
        where: { contentId_locale: { contentId, locale: 'en-US' } },
        select: { title: true, syncStatus: true, syncRevision: true, updatedAt: true }
      })
    ).resolves.toEqual({
      title: 'Revision two',
      syncStatus: 'pending',
      syncRevision: initial.syncRevision + 1,
      updatedAt: initial.updatedAt
    })
    await expect(
      repository.getContentVersionForPublicView({
        siteId,
        contentId,
        locale: 'en-US',
        expectedRevision: initial.syncRevision
      })
    ).resolves.toBeNull()
    await expect(
      prisma.sitePublicView.findUnique({
        where: {
          siteId_resourceType_resourceId_locale: {
            siteId,
            resourceType: 'blog',
            resourceId: contentId,
            locale: 'en-US'
          }
        },
        select: { payload: true }
      })
    ).resolves.toEqual({ payload: expect.objectContaining({ title: 'Revision one' }) })
  })

  it('increments the database revision for every P1 pending resource write', async () => {
    const { contentId, siteId, tenantId } = await createHarness()
    const productId = `${prefix}_product`
    const categoryId = `${prefix}_category`
    const contentCategoryId = `${prefix}_content_category`
    await repository.addProductPublication({
      publicationId: `${prefix}_publication`,
      siteId,
      tenantId,
      productId,
      locale: 'en-US',
      slug: 'revision-product',
      displayTitle: 'Revision product',
      displayDescription: '',
      seoTitle: 'Revision product',
      seoDescription: '',
      seoImage: null,
      imageOverride: null,
      publishStatus: 'published',
      syncStatus: 'pending'
    })
    await repository.createSiteCategory({
      categoryId,
      siteId,
      tenantId,
      parentCategoryId: null,
      sourceCategoryId: null,
      locale: 'en-US',
      slug: 'revision-category',
      displayTitle: 'Revision category',
      description: null,
      image: null,
      sortOrder: 0,
      seoTitle: 'Revision category',
      seoDescription: '',
      seoImage: null,
      publishStatus: 'published',
      syncStatus: 'pending'
    })
    await repository.createContentCategory({
      categoryId: contentCategoryId,
      siteId,
      tenantId,
      appliesTo: 'blog',
      status: 'active',
      isVisibleInBlogArchive: true,
      isVisibleInNewsArchive: false,
      sortOrder: 0,
      syncStatus: 'pending'
    })
    await repository.updateContentCategoryLocaleVersion({
      categoryVersionId: `${prefix}_content_category_version`,
      categoryId: contentCategoryId,
      siteId,
      locale: 'en-US',
      slug: 'revision-guides',
      displayName: 'Revision guides',
      archiveIntro: null,
      archiveLabel: null,
      seoTitle: 'Revision guides',
      seoDescription: '',
      seoImage: null,
      syncStatus: 'pending'
    })
    await repository.markSiteExposurePending({ siteId })

    const before = await Promise.all([
      prisma.siteProductPublication.findUnique({
        where: { siteId_productId_locale: { siteId, productId, locale: 'en-US' } },
        select: { syncRevision: true }
      }),
      prisma.siteCategoryPublication.findUnique({
        where: { siteId_categoryId_locale: { siteId, categoryId, locale: 'en-US' } },
        select: { syncRevision: true }
      }),
      prisma.siteContentLocaleVersion.findUnique({
        where: { contentId_locale: { contentId, locale: 'en-US' } },
        select: { syncRevision: true }
      }),
      prisma.siteContentCategoryLocaleVersion.findUnique({
        where: { categoryId_locale: { categoryId: contentCategoryId, locale: 'en-US' } },
        select: { syncRevision: true }
      }),
      prisma.siteExposureDraft.findUnique({
        where: { siteId },
        select: { syncRevision: true }
      })
    ])

    await repository.updateSiteProductPublication({
      publicationId: `${prefix}_publication`,
      siteId,
      slug: 'revision-product',
      displayTitle: 'Revision product two',
      displayDescription: '',
      seoTitle: 'Revision product two',
      seoDescription: '',
      seoImage: null,
      imageOverride: null,
      publishStatus: 'published',
      syncStatus: 'pending'
    })
    await repository.unpublishSiteCategory({ siteId, categoryId, locale: 'en-US' })
    await repository.unpublishSiteContent({ siteId, contentId, locale: 'en-US' })
    await repository.updateContentCategoryLocaleVersion({
      categoryVersionId: `${prefix}_ignored_version`,
      categoryId: contentCategoryId,
      siteId,
      locale: 'en-US',
      slug: 'revision-guides',
      displayName: 'Revision guides two',
      archiveIntro: null,
      archiveLabel: null,
      seoTitle: 'Revision guides two',
      seoDescription: '',
      seoImage: null,
      syncStatus: 'pending'
    })
    await repository.markSiteExposurePending({ siteId })

    const after = await Promise.all([
      prisma.siteProductPublication.findUnique({
        where: { siteId_productId_locale: { siteId, productId, locale: 'en-US' } },
        select: { syncRevision: true }
      }),
      prisma.siteCategoryPublication.findUnique({
        where: { siteId_categoryId_locale: { siteId, categoryId, locale: 'en-US' } },
        select: { syncRevision: true }
      }),
      prisma.siteContentLocaleVersion.findUnique({
        where: { contentId_locale: { contentId, locale: 'en-US' } },
        select: { syncRevision: true }
      }),
      prisma.siteContentCategoryLocaleVersion.findUnique({
        where: { categoryId_locale: { categoryId: contentCategoryId, locale: 'en-US' } },
        select: { syncRevision: true }
      }),
      prisma.siteExposureDraft.findUnique({
        where: { siteId },
        select: { syncRevision: true }
      })
    ])

    expect(after.map((row) => row!.syncRevision)).toEqual(
      before.map((row) => row!.syncRevision + 1)
    )
  })

  it('rolls back the public view, version, batch, and pending CAS when the transaction fails', async () => {
    const { admin, contentId, request, siteId } = await createHarness()
    jest.spyOn(repository, 'createSyncBatch').mockRejectedValueOnce(new Error('injected failure'))

    await expect(admin.syncAllPendingChanges(request)).rejects.toThrow('injected failure')

    await expect(prisma.sitePublicView.count({ where: { siteId } })).resolves.toBe(0)
    await expect(prisma.siteSyncBatch.count({ where: { siteId } })).resolves.toBe(0)
    await expect(
      prisma.site.findUnique({ where: { siteId }, select: { latestPublishVersion: true } })
    ).resolves.toEqual({ latestPublishVersion: 0 })
    await expect(
      prisma.siteContentLocaleVersion.findUnique({
        where: { contentId_locale: { contentId, locale: 'en-US' } },
        select: { syncStatus: true }
      })
    ).resolves.toEqual({ syncStatus: 'pending' })
  })
})
