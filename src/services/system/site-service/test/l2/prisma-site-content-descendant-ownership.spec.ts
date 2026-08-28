import { SiteAdminApplicationService } from '../../src/application/services/site-admin-application.service'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { PrismaSiteRepository } from '../../src/infrastructure/repositories/prisma-site.repository'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'

// Verifies Content persistence carries the authorized Site through parent, locale, and sync predicates.
describe('Prisma Site Content descendant ownership L2', () => {
  let prisma: PrismaService
  let repository: PrismaSiteRepository
  let prefix: string
  let tenantA: string
  let tenantForeign: string
  let siteA: string
  let siteB: string
  let siteForeign: string
  let contentA: string
  let contentB: string
  let contentForeign: string
  let parentOnly: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    repository = new PrismaSiteRepository(prisma)
  })

  beforeEach(async () => {
    prefix = createTestPrefix()
    tenantA = `${prefix}_tenant_a`
    tenantForeign = `${prefix}_tenant_foreign`
    siteA = `${prefix}_site_a`
    siteB = `${prefix}_site_b`
    siteForeign = `${prefix}_site_foreign`
    contentA = `${prefix}_content_a`
    contentB = `${prefix}_content_b`
    contentForeign = `${prefix}_content_foreign`
    parentOnly = `${prefix}_parent_only`

    await cleanupByPrefix(prisma, prefix)
    await createSite(siteA, tenantA, 'a')
    await createSite(siteB, tenantA, 'b')
    await createSite(siteForeign, tenantForeign, 'foreign')
    await createContent(siteA, tenantA, contentA, 'owned-a')
    await createContent(siteB, tenantA, contentB, 'owned-b')
    await createContent(siteForeign, tenantForeign, contentForeign, 'foreign')
    await repository.createContentEntry({
      contentId: parentOnly,
      siteId: siteA,
      tenantId: tenantA,
      contentType: 'blog',
      status: 'draft'
    })
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    await cleanupByPrefix(prisma, prefix)
  })

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  /** createSite seeds one tenant-owned Site with an active writable locale. */
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

  /** createContent seeds one locale child whose protected fields reveal cross-Site mutations. */
  async function createContent(
    siteId: string,
    tenantId: string,
    contentId: string,
    marker: string
  ): Promise<void> {
    await repository.createContentWithLocaleVersion({
      contentId,
      contentVersionId: `${contentId}_en`,
      siteId,
      tenantId,
      contentType: 'blog',
      locale: 'en-US',
      slug: `${marker}-slug`,
      title: `${marker} title`,
      bodyHtml: `<p>${marker} body</p>`,
      summary: `${marker} summary`,
      coverImage: null,
      coverImageAlt: `${marker} alt`,
      author: `${marker} author`,
      categoryIds: [],
      seoTitle: `${marker} seo title`,
      seoDescription: `${marker} seo description`,
      seoImage: null,
      publishedAt: null,
      status: 'draft',
      syncStatus: 'pending'
    })
  }

  /** updateInput builds one locale mutation with an explicit authorized Site predicate. */
  function updateInput(input: { siteId: string; contentId: string; marker: string }) {
    return {
      contentVersionId: `${input.contentId}_new_en`,
      contentId: input.contentId,
      siteId: input.siteId,
      tenantId: tenantA,
      locale: 'en-US',
      slug: `${input.marker}-slug`,
      title: `${input.marker} title`,
      bodyHtml: `<p>${input.marker} body</p>`,
      summary: `${input.marker} summary`,
      coverImage: null,
      coverImageAlt: `${input.marker} alt`,
      author: `${input.marker} author`,
      categoryIds: [],
      seoTitle: `${input.marker} seo title`,
      seoDescription: `${input.marker} seo description`,
      seoImage: null,
      publishedAt: null,
      status: 'draft',
      syncStatus: 'pending'
    }
  }

  it('returns minimal parent ownership facts for owned, same-tenant, foreign-tenant, and missing Content', async () => {
    const ownershipRepository = repository as unknown as {
      findContentOwnership(
        contentId: string
      ): Promise<{ siteId: string; contentType: string } | null>
    }

    await expect(ownershipRepository.findContentOwnership(contentA)).resolves.toEqual({
      siteId: siteA,
      contentType: 'blog'
    })
    await expect(ownershipRepository.findContentOwnership(contentB)).resolves.toEqual({
      siteId: siteB,
      contentType: 'blog'
    })
    await expect(ownershipRepository.findContentOwnership(contentForeign)).resolves.toEqual({
      siteId: siteForeign,
      contentType: 'blog'
    })
    await expect(ownershipRepository.findContentOwnership(`${prefix}_missing`)).resolves.toBeNull()
  })

  it.each([
    { ownerCase: 'same-tenant other Site', target: () => contentB },
    { ownerCase: 'foreign-tenant Site', target: () => contentForeign }
  ])(
    'does not read or rewrite $ownerCase body, history, slug, or SEO through Site A',
    async ({ target }) => {
      const contentId = target()
      const original = await repository.getSiteContent({
        siteId: contentId === contentB ? siteB : siteForeign,
        contentId
      })

      await expect(
        repository.updateContentLocaleVersion(
          updateInput({ siteId: siteA, contentId, marker: 'attacker' })
        )
      ).resolves.toBeNull()
      await expect(
        repository.getContentVersionForPublicView({
          siteId: siteA,
          contentId,
          locale: 'en-US'
        } as never)
      ).resolves.toBeNull()

      const after = await repository.getSiteContent({
        siteId: contentId === contentB ? siteB : siteForeign,
        contentId
      })
      expect(after).toEqual(original)
    }
  )

  it('creates a missing owned locale child and releases the unpublished draft slug on later updates', async () => {
    await expect(
      repository.updateContentLocaleVersion(
        updateInput({ siteId: siteA, contentId: parentOnly, marker: 'first' })
      )
    ).resolves.toEqual(
      expect.objectContaining({
        slugChanged: false,
        previousSlug: null,
        version: expect.objectContaining({
          contentId: parentOnly,
          locale: 'en-US',
          slug: 'first-slug'
        })
      })
    )
    await expect(
      repository.updateContentLocaleVersion(
        updateInput({ siteId: siteA, contentId: parentOnly, marker: 'second' })
      )
    ).resolves.toEqual(
      expect.objectContaining({
        slugChanged: true,
        previousSlug: 'first-slug',
        version: expect.objectContaining({
          contentId: parentOnly,
          locale: 'en-US',
          slug: 'second-slug',
          historicalSlugs: []
        })
      })
    )
  })

  it('rolls back a newly created locale child when success audit persistence fails', async () => {
    const auditFailure = new Error('audit persistence unavailable')
    jest.spyOn(repository, 'saveAuditEnvelope').mockRejectedValue(auditFailure)
    const application = new SiteAdminApplicationService(repository, {
      previewTokenSecret: 'site-service-local-preview-secret',
      randomId: (kind) => `${prefix}_${kind}`,
      now: () => new Date('2026-07-22T08:00:00.000Z')
    })

    await expect(
      application.updateSiteContentLocaleVersion({
        context: { tenantId: tenantA, operatorId: `${prefix}_operator` },
        siteId: siteA,
        version: {
          contentId: parentOnly,
          locale: 'en-US',
          slug: 'rolled-back-slug',
          title: 'Rolled back title',
          bodyHtml: '<p>rolled back body</p>',
          categoryIds: [],
          seoTitle: 'Rolled back SEO',
          seoDescription: 'Rolled back SEO description'
        }
      })
    ).rejects.toBe(auditFailure)

    await expect(
      prisma.siteContentLocaleVersion.findUnique({
        where: { contentId_locale: { contentId: parentOnly, locale: 'en-US' } }
      })
    ).resolves.toBeNull()
  })

  it('rolls back an existing slug update and both audit rows when slug-change audit fails', async () => {
    const before = await prisma.siteContentLocaleVersion.findUnique({
      where: { contentId_locale: { contentId: contentA, locale: 'en-US' } },
      select: {
        slug: true,
        historicalSlugs: true,
        bodyHtml: true,
        seoTitle: true,
        syncStatus: true
      }
    })
    const auditFailure = new Error('slug audit persistence unavailable')
    const persistedAudit = repository.saveAuditEnvelope.bind(repository)
    jest.spyOn(repository, 'saveAuditEnvelope').mockImplementation(async (input) => {
      if (input.eventType === 'content.slug_changed') {
        throw auditFailure
      }
      return persistedAudit(input)
    })
    let generatedId = 0
    const application = new SiteAdminApplicationService(repository, {
      previewTokenSecret: 'site-service-local-preview-secret',
      randomId: (kind) => `${prefix}_${kind}_${++generatedId}`,
      now: () => new Date('2026-07-22T08:00:00.000Z')
    })

    await expect(
      application.updateSiteContentLocaleVersion({
        context: { tenantId: tenantA, operatorId: `${prefix}_operator` },
        siteId: siteA,
        version: {
          contentId: contentA,
          locale: 'en-US',
          slug: 'rolled-back-new-slug',
          title: 'Rolled back title',
          bodyHtml: '<p>rolled back changed body</p>',
          categoryIds: [],
          seoTitle: 'Rolled back changed SEO',
          seoDescription: 'Rolled back changed SEO description'
        }
      })
    ).rejects.toBe(auditFailure)

    await expect(
      prisma.siteContentLocaleVersion.findUnique({
        where: { contentId_locale: { contentId: contentA, locale: 'en-US' } },
        select: {
          slug: true,
          historicalSlugs: true,
          bodyHtml: true,
          seoTitle: true,
          syncStatus: true
        }
      })
    ).resolves.toEqual(before)
    await expect(
      prisma.siteAuditEnvelope.count({
        where: {
          tenantId: tenantA,
          resourceId: contentA,
          eventType: { in: ['content.updated', 'content.slug_changed'] }
        }
      })
    ).resolves.toBe(0)
  })

  it('converges concurrent owned locale creates to one scoped row without an unknown Prisma error', async () => {
    const application = new SiteAdminApplicationService(repository, {
      previewTokenSecret: 'site-service-local-preview-secret'
    })
    const request = (marker: string) => ({
      context: { tenantId: tenantA, operatorId: `${prefix}_operator` },
      siteId: siteA,
      version: {
        contentId: parentOnly,
        locale: 'en-US',
        slug: `${marker}-slug`,
        title: `${marker} title`,
        bodyHtml: `<p>${marker} body</p>`,
        categoryIds: [],
        seoTitle: `${marker} SEO`,
        seoDescription: `${marker} SEO description`
      }
    })

    await expect(
      Promise.all([
        application.updateSiteContentLocaleVersion(request('race-a')),
        application.updateSiteContentLocaleVersion(request('race-b'))
      ])
    ).resolves.toHaveLength(2)

    const rows = await prisma.siteContentLocaleVersion.findMany({
      where: { contentId: parentOnly, locale: 'en-US' }
    })
    expect(rows).toHaveLength(1)
    expect(['race-a-slug', 'race-b-slug']).toContain(rows[0].slug)
    expect(rows[0].historicalSlugs).toEqual([])
  })

  it('preserves the committed intermediate slug across concurrent updates of one existing locale', async () => {
    const application = new SiteAdminApplicationService(repository, {
      previewTokenSecret: 'site-service-local-preview-secret'
    })
    const request = (marker: string) => ({
      context: { tenantId: tenantA, operatorId: `${prefix}_operator` },
      siteId: siteA,
      version: {
        contentId: contentA,
        locale: 'en-US',
        slug: `${marker}-slug`,
        title: `${marker} title`,
        bodyHtml: `<p>${marker} body</p>`,
        categoryIds: [],
        seoTitle: `${marker} SEO`,
        seoDescription: `${marker} SEO description`
      }
    })

    await expect(
      Promise.all([
        application.updateSiteContentLocaleVersion(request('existing-a')),
        application.updateSiteContentLocaleVersion(request('existing-b'))
      ])
    ).resolves.toHaveLength(2)

    const row = await prisma.siteContentLocaleVersion.findUnique({
      where: { contentId_locale: { contentId: contentA, locale: 'en-US' } },
      select: { slug: true, historicalSlugs: true }
    })
    expect(['existing-a-slug', 'existing-b-slug']).toContain(row?.slug)
    expect(row?.historicalSlugs).toEqual([])
  })

  it('rolls back Content unpublish status, sync pending, and audit when unpublish audit fails', async () => {
    await expect(
      repository.markContentVersionSynced({
        siteId: siteA,
        contentId: contentA,
        locale: 'en-US'
      })
    ).resolves.toBe(true)
    const auditFailure = new Error('unpublish audit persistence unavailable')
    const persistedAudit = repository.saveAuditEnvelope.bind(repository)
    jest.spyOn(repository, 'saveAuditEnvelope').mockImplementation(async (input) => {
      if (input.eventType === 'content.unpublished') {
        throw auditFailure
      }
      return persistedAudit(input)
    })
    const application = new SiteAdminApplicationService(repository, {
      previewTokenSecret: 'site-service-local-preview-secret',
      randomId: (kind) => `${prefix}_${kind}`,
      now: () => new Date('2026-07-22T08:00:00.000Z')
    })

    await expect(
      application.unpublishSiteContent({
        context: { tenantId: tenantA, operatorId: `${prefix}_operator` },
        siteId: siteA,
        contentId: contentA,
        locale: 'en-US'
      })
    ).rejects.toBe(auditFailure)

    await expect(
      prisma.siteContentLocaleVersion.findUnique({
        where: { contentId_locale: { contentId: contentA, locale: 'en-US' } },
        select: { status: true, syncStatus: true }
      })
    ).resolves.toEqual({ status: 'draft', syncStatus: 'synced' })
    await expect(repository.listPendingSyncResources(siteA)).resolves.not.toEqual(
      expect.arrayContaining([expect.objectContaining({ resourceId: contentA, locale: 'en-US' })])
    )
    await expect(
      prisma.siteAuditEnvelope.count({
        where: { tenantId: tenantA, eventType: 'content.unpublished' }
      })
    ).resolves.toBe(0)
  })

  it('uses affected counts so wrong-Site and missing locale unpublish remain stable and side-effect free', async () => {
    await expect(
      repository.unpublishSiteContent({ siteId: siteA, contentId: contentB, locale: 'en-US' })
    ).resolves.toBe(false)
    await expect(
      repository.unpublishSiteContent({ siteId: siteA, contentId: parentOnly, locale: 'en-US' })
    ).resolves.toBe(false)
    await expect(
      repository.unpublishSiteContent({ siteId: siteA, contentId: contentA, locale: 'en-US' })
    ).resolves.toBe(true)

    await expect(
      prisma.siteContentLocaleVersion.findUnique({
        where: { contentId_locale: { contentId: contentB, locale: 'en-US' } },
        select: { status: true, syncStatus: true }
      })
    ).resolves.toEqual({ status: 'draft', syncStatus: 'pending' })
    await expect(
      prisma.siteContentLocaleVersion.findUnique({
        where: { contentId_locale: { contentId: contentA, locale: 'en-US' } },
        select: { status: true, syncStatus: true }
      })
    ).resolves.toEqual({ status: 'unpublished', syncStatus: 'pending' })
  })

  it('does not clear pending sync through a wrong Site and clears the owned composite exactly once', async () => {
    await expect(
      repository.markContentVersionSynced({
        siteId: siteA,
        contentId: contentB,
        locale: 'en-US'
      } as never)
    ).resolves.toBe(false)
    await expect(
      prisma.siteContentLocaleVersion.findUnique({
        where: { contentId_locale: { contentId: contentB, locale: 'en-US' } },
        select: { syncStatus: true }
      })
    ).resolves.toEqual({ syncStatus: 'pending' })

    await expect(
      repository.markContentVersionSynced({
        siteId: siteA,
        contentId: contentA,
        locale: 'en-US'
      } as never)
    ).resolves.toBe(true)
    await expect(
      prisma.siteContentLocaleVersion.findUnique({
        where: { contentId_locale: { contentId: contentA, locale: 'en-US' } },
        select: { syncStatus: true }
      })
    ).resolves.toEqual({ syncStatus: 'synced' })
  })
})
