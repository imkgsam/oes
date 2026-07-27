import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { BadRequestException, NotFoundException, ServiceUnavailableException } from '@nestjs/common'
import {
  NodeSqlitePublishedStore,
  PublicViewsReader,
  type PublicResourceReader,
  type PublicViewListOptions,
  type SiteExposurePublication,
  type StoredPublishedResource
} from '@oes/site-runtime-kit'

import { ContentCategoryArchiveService } from '../runtime/src/modules/public-data/content-category-archive.service'
import { SeoRouteIndexService } from '../runtime/src/modules/seo/seo-route-index.service'
import { SiteConfigService } from '../runtime/src/modules/site-config/site-config.service'
import { SiteExposureService } from '../runtime/src/modules/site-exposure/site-exposure.service'
import { isRoutableContentDetailSlug } from '../runtime/src/modules/site-exposure/content-detail-slug-policy'

const siteId = 'meilong-content-archive-test'
const publishedAt = '2026-07-20T10:00:00.000Z'

interface ContentArchivePageResult {
  items: Array<{ slug: string; locale: string; publishVersion: number }>
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number }
  availableYears: number[]
  committedPublishVersion: number
}

interface ContentArchiveServiceLike {
  getArchivePage(input: {
    contentType: 'blog' | 'news'
    locale?: string
    page?: number
    pageSize?: number
    month?: number
    year?: number
  }): Promise<ContentArchivePageResult>
}

describe('ContentArchiveService', () => {
  let directory: string
  let store: NodeSqlitePublishedStore

  beforeEach(async () => {
    directory = mkdtempSync(join(tmpdir(), 'meilong-content-archive-'))
    store = new NodeSqlitePublishedStore({ path: join(directory, 'runtime.sqlite') })
    await store.init()
  })

  afterEach(async () => {
    await store.close()
    rmSync(directory, { force: true, recursive: true })
  })

  it.each([
    ['category', false],
    ['%74opic', false],
    ['CATEGORIES', false],
    ['unsafe%2Fchild', false],
    ['malformed%', false],
    ['topic-guide', true],
    ['caf%C3%A9', true]
  ])('normalizes content detail slug %s to routable=%s', (slug, expected) => {
    expect(isRoutableContentDetailSlug(slug)).toBe(expected)
  })

  it.each([
    ['page', '2e3'],
    ['month', '0xC'],
    ['month', '+12'],
    ['month', '12.0'],
    ['year', ' 2000 ']
  ])('rejects string %s=%s at the content archive service boundary', async (field, value) => {
    const getArchivePage = createContentArchiveService(
      createInstrumentedExposure(store).exposure
    ).getArchivePage as unknown as (input: Record<string, unknown>) => Promise<unknown>

    await expect(
      Promise.resolve().then(() =>
        getArchivePage({ contentType: 'news', locale: 'en-US', [field]: value })
      )
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('returns a bounded later Blog page from all 205 safe rows in one publication attempt', async () => {
    const resources = [
      ...archiveResources('blog', 205, 'en-US', 31),
      archiveResource('blog', 'reserved-category', 'category', 'en-US', 31, publishedAt),
      archiveResource('blog', 'reserved-encoded', '%74opic', 'en-US', 31, publishedAt),
      archiveResource('blog', 'reserved-encoded-category', '%63ategory', 'en-US', 31, publishedAt),
      archiveResource('blog', 'reserved-uppercase', 'CATEGORIES', 'en-US', 31, publishedAt),
      archiveResource('blog', 'unsafe-slash', 'unsafe%2Fchild', 'en-US', 31, publishedAt)
    ]
    await commitArchiveSnapshot(store, 0, 31, resources)
    const instrumented = createInstrumentedExposure(store)
    const service = createContentArchiveService(instrumented.exposure)

    const page = await service.getArchivePage({
      contentType: 'blog',
      locale: 'en-US',
      page: 23,
      pageSize: 9
    })

    expect(page).toMatchObject({
      pagination: { page: 23, pageSize: 9, totalItems: 205, totalPages: 23 },
      committedPublishVersion: 31
    })
    expect(page.items.map((item) => item.slug)).toEqual([
      'blog-198',
      'blog-199',
      'blog-200',
      'blog-201',
      'blog-202',
      'blog-203',
      'blog-204'
    ])
    expect(instrumented.getPublicationReads()).toBe(2)
    expect(instrumented.getListReads('blog')).toBe(2)
    await expect(
      service.getArchivePage({ contentType: 'blog', locale: 'en-US', page: 24, pageSize: 9 })
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('filters the complete localized News set before pagination and derives all available years', async () => {
    const english = Array.from({ length: 60 }, (_, index) =>
      archiveResource(
        'news',
        `news-en-${index}`,
        `news-en-${String(index).padStart(2, '0')}`,
        'en-US',
        41,
        index < 30
          ? `2025-01-${String((index % 28) + 1).padStart(2, '0')}T00:00:00.000Z`
          : `2024-02-${String((index % 28) + 1).padStart(2, '0')}T00:00:00.000Z`
      )
    )
    const french = archiveResources('news', 12, 'fr-FR', 41)
    await commitArchiveSnapshot(store, 0, 41, [...english, ...french])
    const service = createContentArchiveService(createInstrumentedExposure(store).exposure)

    const page = await service.getArchivePage({
      contentType: 'news',
      locale: 'en-US',
      year: 2024,
      month: 2,
      page: 2,
      pageSize: 8
    })

    expect(page.availableYears).toEqual([2025, 2024])
    expect(page.pagination).toEqual({ page: 2, pageSize: 8, totalItems: 30, totalPages: 4 })
    expect(page.items).toHaveLength(8)
    expect(page.items.every((item) => item.locale === 'en-US')).toBe(true)
  })

  it('retries the whole archive against v2 and fails closed when a v3 switch exhausts attempts', async () => {
    await commitArchiveSnapshot(store, 0, 51, archiveResources('blog', 49, 'en-US', 51, 'v1'))
    const retrying = createTransitionExposure(store, [
      { expectedVersion: 51, publishVersion: 52, suffix: 'v2' }
    ])
    const retryingService = createContentArchiveService(retrying.exposure)

    const retriedPage = await retryingService.getArchivePage({
      contentType: 'blog',
      locale: 'en-US',
      page: 1,
      pageSize: 9
    })
    expect(retriedPage.committedPublishVersion).toBe(52)
    expect(retriedPage.items[0]).toMatchObject({ slug: 'blog-v2-00', publishVersion: 52 })

    await store.close()
    rmSync(directory, { force: true, recursive: true })
    directory = mkdtempSync(join(tmpdir(), 'meilong-content-archive-v3-'))
    store = new NodeSqlitePublishedStore({ path: join(directory, 'runtime.sqlite') })
    await store.init()
    await commitArchiveSnapshot(store, 0, 61, archiveResources('blog', 49, 'en-US', 61, 'v1'))
    const changing = createTransitionExposure(store, [
      { expectedVersion: 61, publishVersion: 62, suffix: 'v2' },
      { expectedVersion: 62, publishVersion: 63, suffix: 'v3' }
    ])

    await expect(
      createContentArchiveService(changing.exposure).getArchivePage({
        contentType: 'blog',
        locale: 'en-US',
        page: 1,
        pageSize: 9
      })
    ).rejects.toBeInstanceOf(ServiceUnavailableException)
  })

  it('keeps the complete safe News archive set aligned with sitemap detail routes', async () => {
    const resources = [
      ...archiveResources('news', 205, 'en-US', 71),
      archiveResource('news', 'reserved-news', 'CATEGORIES', 'en-US', 71, publishedAt)
    ]
    await commitArchiveSnapshot(store, 0, 71, resources)
    const exposure = createInstrumentedExposure(store).exposure
    const archive = createContentArchiveService(exposure)
    const categoryArchive = new ContentCategoryArchiveService(
      new SiteConfigService(),
      exposure
    )
    const seo = new SeoRouteIndexService(new SiteConfigService(), categoryArchive, exposure)
    const archiveSlugs: string[] = []
    for (let page = 1; page <= 5; page += 1) {
      const result = await archive.getArchivePage({
        contentType: 'news',
        locale: 'en-US',
        page,
        pageSize: 48
      })
      archiveSlugs.push(...result.items.map((item) => item.slug))
    }
    const routeIndex = await seo.getRouteIndex()
    const sitemapSlugs = routeIndex.routes
      .filter((route) => route.resourceType === 'news')
      .map((route) => route.slug)
      .sort()

    expect(archiveSlugs.sort()).toEqual(sitemapSlugs)
    expect(archiveSlugs).toHaveLength(205)
  })
})

// createContentArchiveService loads the expected Meilong application service without weakening its public test shape.
function createContentArchiveService(exposure: SiteExposureService): ContentArchiveServiceLike {
  const module = require('../runtime/src/modules/public-data/content-archive.service.ts') as {
    ContentArchiveService: new (siteExposure: SiteExposureService) => ContentArchiveServiceLike
  }
  return new module.ContentArchiveService(exposure)
}

// createInstrumentedExposure counts real reader boundaries while preserving SQLite behavior.
function createInstrumentedExposure(store: NodeSqlitePublishedStore): {
  exposure: SiteExposureService
  getPublicationReads: () => number
  getListReads: (contentType: 'blog' | 'news') => number
} {
  const publicViews = new PublicViewsReader(store, siteId)
  let publicationReads = 0
  const listReads = { blog: 0, news: 0 }
  const instrumentReader = (
    contentType: 'blog' | 'news',
    reader: PublicResourceReader
  ): PublicResourceReader => ({
    getBySlug: reader.getBySlug,
    list: async (options?: PublicViewListOptions) => {
      listReads[contentType] += 1
      return reader.list(options)
    }
  })
  const runtimeService = {
    getRuntime: () => ({
      publicViews: {
        ...publicViews,
        blogs: instrumentReader('blog', publicViews.blogs),
        news: instrumentReader('news', publicViews.news),
        exposure: {
          getPublication: async () => {
            publicationReads += 1
            return publicViews.exposure.getPublication()
          },
          getPagePolicy: publicViews.exposure.getPagePolicy.bind(publicViews.exposure)
        }
      }
    })
  }
  return {
    exposure: new SiteExposureService(runtimeService as never),
    getPublicationReads: () => publicationReads,
    getListReads: (contentType) => listReads[contentType]
  }
}

interface ArchiveTransition {
  expectedVersion: number
  publishVersion: number
  suffix: string
}

// createTransitionExposure switches real SQLite snapshots only after a complete reader page returns.
function createTransitionExposure(
  store: NodeSqlitePublishedStore,
  transitions: ArchiveTransition[]
): { exposure: SiteExposureService } {
  const publicViews = new PublicViewsReader(store, siteId)
  let listCalls = 0
  const runtimeService = {
    getRuntime: () => ({
      publicViews: {
        ...publicViews,
        blogs: {
          getBySlug: publicViews.blogs.getBySlug,
          list: async (options?: PublicViewListOptions) => {
            const result = await publicViews.blogs.list(options)
            const transition = transitions[listCalls]
            listCalls += 1
            if (transition) {
              await commitArchiveSnapshot(
                store,
                transition.expectedVersion,
                transition.publishVersion,
                archiveResources(
                  'blog',
                  49,
                  'en-US',
                  transition.publishVersion,
                  transition.suffix
                )
              )
            }
            return result
          }
        }
      }
    })
  }
  return { exposure: new SiteExposureService(runtimeService as never) }
}

// commitArchiveSnapshot installs one complete list/detail publication for archive integration tests.
async function commitArchiveSnapshot(
  store: NodeSqlitePublishedStore,
  expectedVersion: number,
  publishVersion: number,
  resources: StoredPublishedResource[]
): Promise<void> {
  await store.commitPublication({
    mode: 'snapshot',
    siteId,
    expectedLocalPublishVersion: expectedVersion,
    publishVersion,
    latestSyncId: `sync-${publishVersion}`,
    lastKnownRemotePublishVersion: publishVersion,
    exposure: archivePublication(publishVersion),
    resources,
    missingResources: []
  })
}

// archivePublication enables list and detail SEO gates for both content collections.
function archivePublication(publishVersion: number): SiteExposurePublication {
  return {
    siteId,
    publishVersion,
    defaultLocale: 'en-US',
    activeLocales: ['en-US', 'fr-FR'],
    pages: ['BLOG_LIST', 'BLOG_DETAIL', 'NEWS_LIST', 'NEWS_DETAIL'].map((pageKey) => ({
      pageKey,
      enabled: true,
      indexable: true,
      supportedLocales: ['en-US', 'fr-FR']
    })),
    publishedAt
  }
}

// archiveResources creates deterministically sorted published rows for one locale and version.
function archiveResources(
  contentType: 'blog' | 'news',
  count: number,
  locale: string,
  publishVersion: number,
  suffix = ''
): StoredPublishedResource[] {
  const infix = suffix ? `${suffix}-` : ''
  return Array.from({ length: count }, (_, index) =>
    archiveResource(
      contentType,
      `${contentType}-${infix}${index}`,
      `${contentType}-${infix}${String(index).padStart(suffix ? 2 : 3, '0')}`,
      locale,
      publishVersion,
      new Date(Date.UTC(2026, 0, 1) - index * 86_400_000).toISOString()
    )
  )
}

// archiveResource creates one exact-locale published content row with a stable publication timestamp.
function archiveResource(
  contentType: 'blog' | 'news',
  resourceId: string,
  slug: string,
  locale: string,
  publishVersion: number,
  entryPublishedAt: string
): StoredPublishedResource {
  return {
    siteId,
    resourceType: contentType,
    resourceId,
    slug,
    locale,
    status: 'published',
    publishVersion,
    payloadJson: JSON.stringify({ published_at: entryPublishedAt }),
    updatedAt: entryPublishedAt
  }
}
