import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  NodeSqlitePublishedStore,
  PublicViewsReader,
  type PublicResourceReader,
  type PublicViewListOptions,
  type PublicViewEnvelope,
  type ResourceType,
  type SiteExposurePublication,
  type StoredPublishedResource
} from '@oes/site-runtime-kit'
import { NotFoundException, ServiceUnavailableException } from '@nestjs/common'

import { ContentCategoryArchiveService } from '../runtime/src/modules/public-data/content-category-archive.service'
import { PublicDataController } from '../runtime/src/modules/public-data/public-data.controller'
import { PublicDataService } from '../runtime/src/modules/public-data/public-data.service'
import { SeoController } from '../runtime/src/modules/seo/seo.controller'
import { SeoRouteIndexService } from '../runtime/src/modules/seo/seo-route-index.service'
import { SiteConfigService } from '../runtime/src/modules/site-config/site-config.service'
import { SiteExposureService } from '../runtime/src/modules/site-exposure/site-exposure.service'
import { SiteExposureController } from '../runtime/src/modules/site-exposure/site-exposure.controller'

const siteId = 'meilong-public-surface-test'
const publishedAt = '2026-07-20T09:00:00.000Z'

describe('Meilong Runtime public surface governance', () => {
  let directory: string
  let store: NodeSqlitePublishedStore
  let runtimeService: { getRuntime(): { publicViews: PublicViewsReader } }
  let exposure: SiteExposureService

  beforeEach(async () => {
    directory = mkdtempSync(join(tmpdir(), 'meilong-public-surface-'))
    store = new NodeSqlitePublishedStore({ path: join(directory, 'runtime.sqlite') })
    await store.init()
    await store.commitPublication({
      mode: 'snapshot',
      siteId,
      expectedLocalPublishVersion: 0,
      publishVersion: 23,
      latestSyncId: 'sync-23',
      lastKnownRemotePublishVersion: 23,
      exposure: exposurePublication(),
      resources: [
        resource('news', 'news-shared', 'shared-update', 'en-US'),
        resource('news', 'news-shared', 'mise-a-jour', 'fr-FR'),
        resource('news', 'news-en-only', 'english-only', 'en-US'),
        resource('news', 'news-private', 'private-update', 'en-US', {
          seo: { noindex: true }
        }),
        resource('product', 'product-1', 'tile-one', 'en-US')
      ],
      missingResources: []
    })
    runtimeService = {
      getRuntime: () => ({ publicViews: new PublicViewsReader(store, siteId) })
    }
    exposure = new SiteExposureService(runtimeService as never)
  })

  afterEach(async () => {
    await store.close()
    rmSync(directory, { force: true, recursive: true })
  })

  it('takes public locale configuration only from the committed publication', async () => {
    const configService = new SiteConfigService()
    const getPublicConfig = configService.getPublicConfig as unknown as (
      publication: SiteExposurePublication
    ) => Promise<{
      defaultLocale: string
      committedPublishVersion: number
      activeLocales: Array<{ locale: string; isDefault: boolean; routePrefix: string }>
    }>

    await expect(getPublicConfig.call(configService, exposurePublication())).resolves.toMatchObject(
      {
        defaultLocale: 'en-US',
        committedPublishVersion: 23,
        activeLocales: [
          { locale: 'en-US', isDefault: true, routePrefix: '' },
          { locale: 'fr-FR', isDefault: false, routePrefix: '/fr-FR' }
        ]
      }
    )
  })

  it('keeps Product detail operation-specific while removed list and Product Category exposures stay 404', async () => {
    const controller = new PublicDataController(new PublicDataService(exposure))

    await expect(controller.listResources('products', 'en-US')).rejects.toBeInstanceOf(
      NotFoundException
    )
    await expect(controller.listResources('categories', 'en-US')).rejects.toBeInstanceOf(
      NotFoundException
    )
    await expect(
      controller.listResources('article-categories', 'en-US')
    ).rejects.toBeInstanceOf(NotFoundException)
    await expect(
      controller.getResourceBySlug('categories', 'porcelain-tiles', 'en-US')
    ).rejects.toBeInstanceOf(NotFoundException)
    await expect(
      controller.getResourceBySlug('article-categories', 'bathroom-sink', 'en-US')
    ).rejects.toBeInstanceOf(NotFoundException)
    await expect(
      controller.getResourceBySlug('products', 'tile-one', 'en-US')
    ).resolves.toMatchObject({ slug: 'tile-one', resourceType: 'product' })
  })

  it('applies page-wide gates before reads and never falls back across locales', async () => {
    const controller = new PublicDataController(new PublicDataService(exposure))

    await expect(
      controller.getResourceBySlug('news', 'english-only', 'fr-FR')
    ).rejects.toBeInstanceOf(NotFoundException)

    const french = await controller.listResources('news', 'fr-FR')
    expect(french.items.map((item) => item.slug)).toEqual(['mise-a-jour'])
  })

  it('forwards public list cursors so callers can consume later pages', async () => {
    const controller = new PublicDataController(new PublicDataService(exposure))
    const listResources = controller.listResources as unknown as (
      collection: 'news',
      locale: string,
      limit: string,
      cursor: string
    ) => Promise<{ items: PublicViewEnvelope[]; nextCursor: string | null }>

    const page = await listResources.call(controller, 'news', 'en-US', '2', 'english-only')

    expect(page.items.map((item) => item.slug)).toEqual(['private-update', 'shared-update'])
  })

  it('retries the complete public list boundary when page governance switches mid-read', async () => {
    const enabledPublication: SiteExposurePublication = {
      siteId,
      publishVersion: 41,
      defaultLocale: 'en-US',
      activeLocales: ['en-US'],
      pages: [
        {
          pageKey: 'NEWS_LIST',
          enabled: true,
          indexable: false,
          supportedLocales: ['en-US']
        }
      ],
      publishedAt
    }
    const disabledPublication: SiteExposurePublication = {
      ...enabledPublication,
      publishVersion: 42,
      pages: enabledPublication.pages.map((page) => ({ ...page, enabled: false }))
    }
    let currentPublication = enabledPublication
    let switched = false
    const versionedNews = {
      siteId,
      resourceType: 'news' as const,
      resourceId: 'versioned-news',
      slug: 'versioned-news',
      locale: 'en-US',
      status: 'published' as const,
      publishVersion: 42,
      updatedAt: publishedAt,
      payload: {}
    }
    const versionedRuntimeService = {
      getRuntime: () => ({
        publicViews: {
          news: {
            list: async () => {
              if (!switched) {
                currentPublication = disabledPublication
                switched = true
              }
              return { items: [versionedNews], nextCursor: null }
            },
            getBySlug: async () => versionedNews
          },
          exposure: {
            getPublication: async () => currentPublication,
            getPagePolicy: async (pageKey: string, locale: string) => {
              const page = currentPublication.pages.find(
                (candidate) => candidate.pageKey === pageKey
              )
              const enabled = page?.enabled ?? false
              return {
                pageKey,
                locale,
                enabled,
                indexable: page?.indexable ?? false,
                localeActive: true,
                localeSupported: Boolean(page),
                accessible: enabled && Boolean(page),
                indexEligible: enabled && (page?.indexable ?? false),
                supportedLocales: page?.supportedLocales ?? [],
                committedPublishVersion: currentPublication.publishVersion
              }
            }
          }
        }
      })
    }
    const versionedExposure = new SiteExposureService(versionedRuntimeService as never)
    const controller = new PublicDataController(new PublicDataService(versionedExposure))

    await expect(controller.listResources('news', 'en-US', '2')).rejects.toBeInstanceOf(
      NotFoundException
    )
  })

  it('exposes the committed route decision through the Runtime public-safe controller', async () => {
    const controller = new SiteExposureController(exposure, new SiteConfigService())

    await expect(
      controller.getRouteDecision('NEWS_DETAIL', 'fr-FR', 'news', 'mise-a-jour')
    ).resolves.toMatchObject({
      pageKey: 'NEWS_DETAIL',
      locale: 'fr-FR',
      resourceAvailable: true,
      committedPublishVersion: 23
    })
  })

  it('builds sitemap input from page policy, resource noindex, and one committed version', async () => {
    const configService = new SiteConfigService()
    const categoryArchive = {
      listCategoryRouteIndexInSession: async (): Promise<PublicViewEnvelope[]> => []
    }
    const controller = new SeoController(
      new SeoRouteIndexService(configService, categoryArchive as never, exposure)
    )

    const index = (await controller.routeIndex()) as unknown as {
      committedPublishVersion: number
      pages: Array<{ pageKey: string; locale: string; indexEligible: boolean }>
      routes: Array<{ slug: string; pageKey: string; locale: string }>
    }

    expect(index.committedPublishVersion).toBe(23)
    expect(index.pages).toContainEqual({
      pageKey: 'HOME',
      locale: 'en-US',
      indexEligible: true
    })
    expect(index.pages).toContainEqual({
      pageKey: 'ABOUT',
      locale: 'en-US',
      indexEligible: false
    })
    expect(index.routes.map((route) => route.slug)).toEqual([
      'english-only',
      'shared-update',
      'mise-a-jour'
    ])
    expect(index.routes.every((route) => route.pageKey === 'NEWS_DETAIL')).toBe(true)
  })

  it('includes sitemap resources beyond the Runtime reader page cap', async () => {
    const publishVersion = 24
    const bulkNews = Array.from({ length: 205 }, (_, index) =>
      resource(
        'news',
        `bulk-news-${index}`,
        `bulk-news-${String(index).padStart(3, '0')}`,
        'en-US',
        {},
        publishVersion
      )
    )
    await store.commitPublication({
      mode: 'delta',
      siteId,
      expectedLocalPublishVersion: 23,
      publishVersion,
      latestSyncId: 'sync-24',
      lastKnownRemotePublishVersion: publishVersion,
      exposure: { ...exposurePublication(), publishVersion },
      resources: [
        ...bulkNews,
        resource('news', 'late-news', 'zz-late-news', 'en-US', {}, publishVersion)
      ],
      missingResources: []
    })
    const categoryArchive = {
      listCategoryRouteIndexInSession: async (): Promise<PublicViewEnvelope[]> => []
    }
    const controller = new SeoController(
      new SeoRouteIndexService(new SiteConfigService(), categoryArchive as never, exposure)
    )

    const index = (await controller.routeIndex()) as unknown as {
      routes: Array<{ slug: string }>
    }

    expect(index.routes).toContainEqual(expect.objectContaining({ slug: 'zz-late-news' }))
  })

  it('excludes terminal Blog and News detail slugs from the Runtime SEO route index', async () => {
    const publishVersion = 25
    const terminalSlugs = [
      'category',
      'topic',
      'categories',
      'CATEGORY',
      '%63ategory',
      'ordinary%2Fchild'
    ]
    await store.commitPublication({
      mode: 'snapshot',
      siteId,
      expectedLocalPublishVersion: 23,
      publishVersion,
      latestSyncId: 'sync-25-terminal-content-slugs',
      lastKnownRemotePublishVersion: publishVersion,
      exposure: {
        siteId,
        publishVersion,
        defaultLocale: 'en-US',
        activeLocales: ['en-US'],
        pages: ['BLOG_DETAIL', 'NEWS_DETAIL'].map((pageKey) => ({
          pageKey,
          enabled: true,
          indexable: true,
          supportedLocales: ['en-US']
        })),
        publishedAt
      },
      resources: [
        ...terminalSlugs.flatMap((slug) => [
          resource('blog', `blog-${slug}`, slug, 'en-US', {}, publishVersion),
          resource('news', `news-${slug}`, slug, 'en-US', {}, publishVersion)
        ]),
        resource('blog', 'blog-valid', 'valid-blog-detail', 'en-US', {}, publishVersion),
        resource('news', 'news-valid', 'valid-news-detail', 'en-US', {}, publishVersion)
      ],
      missingResources: []
    })
    const categoryArchive = {
      listCategoryRouteIndexInSession: async (): Promise<PublicViewEnvelope[]> => []
    }
    const controller = new SeoController(
      new SeoRouteIndexService(new SiteConfigService(), categoryArchive as never, exposure)
    )

    const index = await controller.routeIndex()

    expect(index.routes.map((route) => route.path).sort()).toEqual([
      '/blogs/valid-blog-detail',
      '/news/valid-news-detail'
    ])
  })

  it('loads each full SEO collection at most once per locale and publication attempt', async () => {
    const publishVersion = 30
    const locales = ['en-US', 'es-ES', 'fr-FR']
    const resourcesPerCollection = 201
    const resources = locales.flatMap((locale) => {
      const categoryId = `seo-category-${locale}`
      const contentPayload = { category_ids: [categoryId] }
      return [
        resource(
          'article-category',
          categoryId,
          categoryId,
          locale,
          {
            content_category_id: categoryId,
            applies_to: 'both',
            is_visible_in_blog_archive: true,
            is_visible_in_news_archive: true
          },
          publishVersion
        ),
        ...(['product', 'category', 'blog', 'news'] as const).flatMap((resourceType) =>
          Array.from({ length: resourcesPerCollection }, (_, index) =>
            resource(
              resourceType,
              `${resourceType}-${index}`,
              `seo-${resourceType}-${locale}-${String(index).padStart(3, '0')}`,
              locale,
              resourceType === 'blog' || resourceType === 'news' ? contentPayload : {},
              publishVersion
            )
          )
        )
      ]
    })
    await store.commitPublication({
      mode: 'snapshot',
      siteId,
      expectedLocalPublishVersion: 23,
      publishVersion,
      latestSyncId: 'sync-30-performance',
      lastKnownRemotePublishVersion: publishVersion,
      exposure: performanceSeoPublication(publishVersion, locales),
      resources,
      missingResources: []
    })
    const instrumented = createInstrumentedPublicViews(store)
    const performanceRuntimeService = {
      getRuntime: () => ({ publicViews: instrumented.publicViews })
    }
    const performanceExposure = new SiteExposureService(performanceRuntimeService as never)
    const categoryArchive = new ContentCategoryArchiveService(
      new SiteConfigService(),
      performanceExposure
    )
    const routeIndex = new SeoController(
      new SeoRouteIndexService(
        new SiteConfigService(),
        categoryArchive,
        performanceExposure
      )
    )

    const index = await routeIndex.routeIndex()

    expect(index.pages).toHaveLength(21)
    expect(index.routes).toHaveLength(locales.length * (resourcesPerCollection * 3 + 2))
    expect(index.routes.some((route) => String(route.resourceType) === 'category')).toBe(false)
    for (const locale of locales) {
      for (const page of performanceSeoPublication(publishVersion, locales).pages) {
        expect(instrumented.getPolicyReadCount(page.pageKey, locale)).toBeLessThanOrEqual(1)
      }
      for (const collection of [
        'products',
        'blog',
        'news',
        'article-categories'
      ]) {
        expect(instrumented.getFullLoadCount(collection, locale)).toBeLessThanOrEqual(1)
      }
      expect(instrumented.getFullLoadCount('categories', locale)).toBe(0)
    }
    expect(instrumented.getMaxConcurrentListReads()).toBeLessThanOrEqual(1)
  })

  it('retries the complete real-store SEO index and returns only v2 routes and policies', async () => {
    await commitSeoPublication(store, 23, 81, 'v1', false)
    const transition = createRealSeoTransitionController(store, [
      { expectedVersion: 81, publishVersion: 82, suffix: 'v2' }
    ])

    const index = await transition.controller.routeIndex()

    expect(index.committedPublishVersion).toBe(82)
    expect(index.pages).toEqual([
      { pageKey: 'BLOG_CATEGORY', locale: 'en-US', indexEligible: true },
      { pageKey: 'NEWS_DETAIL', locale: 'en-US', indexEligible: true }
    ])
    expect(index.routes).toEqual([
      {
        resourceType: 'news',
        locale: 'en-US',
        slug: 'seo-news-v2',
        path: '/news/seo-news-v2',
        canonicalUrl: 'https://meilong-ceramics.com/news/seo-news-v2',
        updatedAt: publishedAt,
        pageKey: 'NEWS_DETAIL',
        committedPublishVersion: 82
      },
      {
        resourceType: 'blog_category',
        locale: 'en-US',
        slug: 'seo-category-v2',
        path: '/blogs/categories/seo-category-v2',
        canonicalUrl: 'https://meilong-ceramics.com/blogs/categories/seo-category-v2',
        updatedAt: publishedAt,
        pageKey: 'BLOG_CATEGORY',
        committedPublishVersion: 82
      }
    ])
    const policyReads = transition.getPolicyReads()
    const firstV2PolicyRead = policyReads.findIndex(
      (policy) => policy.committedPublishVersion === 82
    )
    expect(firstV2PolicyRead).toBeGreaterThanOrEqual(0)
    expect(
      policyReads
        .slice(firstV2PolicyRead)
        .every((policy) => policy.committedPublishVersion === 82)
    ).toBe(true)
    for (const page of index.pages) {
      expect(policyReads).toContainEqual({ ...page, committedPublishVersion: 82 })
    }
    expect(index.routes.every((route) => route.committedPublishVersion === 82)).toBe(true)
    expect(transition.getNewsListCalls()).toBeGreaterThan(0)
    expect(transition.getNewsListCalls()).toBeLessThanOrEqual(2)
  })

  it('fails the complete real-store SEO index when both attempts change publication', async () => {
    await commitSeoPublication(store, 23, 83, 'v1')
    const transition = createRealSeoTransitionController(store, [
      { expectedVersion: 83, publishVersion: 84, suffix: 'v2' },
      { expectedVersion: 84, publishVersion: 85, suffix: 'v3' }
    ])

    await expect(transition.controller.routeIndex()).rejects.toBeInstanceOf(
      ServiceUnavailableException
    )
    expect(transition.getNewsListCalls()).toBeGreaterThan(0)
    expect(transition.getNewsListCalls()).toBeLessThanOrEqual(2)
    await expect(new PublicViewsReader(store, siteId).exposure.getPublication()).resolves.toMatchObject(
      { publishVersion: 85 }
    )
  })
})

// exposurePublication represents the single Runtime-local governance version used by all public surfaces.
function exposurePublication(): SiteExposurePublication {
  return {
    siteId,
    publishVersion: 23,
    defaultLocale: 'en-US',
    activeLocales: ['en-US', 'fr-FR'],
    pages: [
      { pageKey: 'ABOUT', enabled: true, indexable: false, supportedLocales: ['en-US'] },
      { pageKey: 'HOME', enabled: true, indexable: true, supportedLocales: ['en-US'] },
      {
        pageKey: 'NEWS_DETAIL',
        enabled: true,
        indexable: true,
        supportedLocales: ['en-US', 'fr-FR']
      },
      {
        pageKey: 'NEWS_LIST',
        enabled: true,
        indexable: true,
        supportedLocales: ['en-US', 'fr-FR']
      },
      {
        pageKey: 'PRODUCT_DETAIL',
        enabled: true,
        indexable: false,
        supportedLocales: ['en-US']
      }
    ],
    publishedAt
  }
}

// seoPublication provides real News and Category surfaces for deterministic SEO publication retries.
function seoPublication(
  nextPublishVersion: number,
  categoryIndexable = true
): SiteExposurePublication {
  return {
    siteId,
    publishVersion: nextPublishVersion,
    defaultLocale: 'en-US',
    activeLocales: ['en-US'],
    pages: [
      {
        pageKey: 'NEWS_DETAIL',
        enabled: true,
        indexable: true,
        supportedLocales: ['en-US']
      },
      {
        pageKey: 'BLOG_CATEGORY',
        enabled: true,
        indexable: categoryIndexable,
        supportedLocales: ['en-US']
      }
    ],
    publishedAt
  }
}

// performanceSeoPublication exposes only the retained SEO list, detail, and Content Category surfaces in three locales.
function performanceSeoPublication(
  nextPublishVersion: number,
  locales: string[]
): SiteExposurePublication {
  return {
    siteId,
    publishVersion: nextPublishVersion,
    defaultLocale: locales[0] ?? 'en-US',
    activeLocales: locales,
    pages: [
      'PRODUCT_DETAIL',
      'BLOG_LIST',
      'BLOG_DETAIL',
      'NEWS_LIST',
      'NEWS_DETAIL',
      'BLOG_CATEGORY',
      'NEWS_CATEGORY'
    ].map((pageKey) => ({
      pageKey,
      enabled: true,
      indexable: true,
      supportedLocales: locales
    })),
    publishedAt
  }
}

// resource creates one exact-locale published row for public-controller integration assertions.
function resource(
  resourceType: ResourceType,
  resourceId: string,
  slug: string,
  locale: string,
  payload: Record<string, unknown> = {},
  publishVersion = 23
): StoredPublishedResource {
  return {
    siteId,
    resourceType,
    resourceId,
    slug,
    locale,
    status: 'published',
    publishVersion,
    payloadJson: JSON.stringify(payload),
    updatedAt: publishedAt
  }
}

interface SeoPublicationTransition {
  expectedVersion: number
  publishVersion: number
  suffix: string
}

interface RecordedPagePolicy {
  pageKey: string
  locale: string
  indexEligible: boolean
  committedPublishVersion: number
}

// commitSeoPublication atomically installs one complete real-store News and Category SEO surface.
async function commitSeoPublication(
  store: NodeSqlitePublishedStore,
  expectedVersion: number,
  nextPublishVersion: number,
  suffix: string,
  categoryIndexable = true
): Promise<void> {
  await store.commitPublication({
    mode: 'snapshot',
    siteId,
    expectedLocalPublishVersion: expectedVersion,
    publishVersion: nextPublishVersion,
    latestSyncId: `sync-${nextPublishVersion}`,
    lastKnownRemotePublishVersion: nextPublishVersion,
    exposure: seoPublication(nextPublishVersion, categoryIndexable),
    resources: [
      resource('news', `seo-news-${suffix}`, `seo-news-${suffix}`, 'en-US', {}, nextPublishVersion),
      resource(
        'article-category',
        `seo-category-${suffix}`,
        `seo-category-${suffix}`,
        'en-US',
        {
          content_category_id: `seo-category-${suffix}`,
          applies_to: 'blog',
          is_visible_in_blog_archive: true
        },
        nextPublishVersion
      ),
      resource(
        'blog',
        `seo-blog-${suffix}`,
        `seo-blog-${suffix}`,
        'en-US',
        { category_ids: [`seo-category-${suffix}`] },
        nextPublishVersion
      )
    ],
    missingResources: []
  })
}

// createRealSeoTransitionController delegates all business reads to SQLite and only controls commit timing.
function createRealSeoTransitionController(
  store: NodeSqlitePublishedStore,
  transitions: SeoPublicationTransition[]
): {
  controller: SeoController
  getNewsListCalls: () => number
  getPolicyReads: () => RecordedPagePolicy[]
} {
  const realPublicViews = new PublicViewsReader(store, siteId)
  const policyReads: RecordedPagePolicy[] = []
  let newsListCalls = 0
  const runtimeService = {
    getRuntime: () => ({
      publicViews: {
        products: realPublicViews.products,
        categories: realPublicViews.categories,
        contents: realPublicViews.contents,
        blogs: realPublicViews.blogs,
        news: {
          getBySlug: realPublicViews.news.getBySlug,
          list: async (options?: PublicViewListOptions) => {
            const result = await realPublicViews.news.list(options)
            const transition = transitions[newsListCalls]
            newsListCalls += 1
            if (transition) {
              await commitSeoPublication(
                store,
                transition.expectedVersion,
                transition.publishVersion,
                transition.suffix
              )
            }
            return result
          }
        },
        articleCategories: realPublicViews.articleCategories,
        exposure: {
          getPublication: realPublicViews.exposure.getPublication.bind(realPublicViews.exposure),
          getPagePolicy: async (pageKey: string, locale: string) => {
            const policy = await realPublicViews.exposure.getPagePolicy(pageKey, locale)
            policyReads.push({
              pageKey: policy.pageKey,
              locale: policy.locale,
              indexEligible: policy.indexEligible,
              committedPublishVersion: policy.committedPublishVersion
            })
            return policy
          }
        }
      }
    })
  }
  const siteExposure = new SiteExposureService(runtimeService as never)
  const categoryArchive = new ContentCategoryArchiveService(
    new SiteConfigService(),
    siteExposure
  )
  return {
    controller: new SeoController(
      new SeoRouteIndexService(new SiteConfigService(), categoryArchive, siteExposure)
    ),
    getNewsListCalls: () => newsListCalls,
    getPolicyReads: () => [...policyReads]
  }
}

// createInstrumentedPublicViews counts real SQLite full-load starts without replacing reader data.
function createInstrumentedPublicViews(store: NodeSqlitePublishedStore): {
  publicViews: {
    products: PublicResourceReader
    categories: PublicResourceReader
    contents: PublicResourceReader
    blogs: PublicResourceReader
    news: PublicResourceReader
    articleCategories: PublicResourceReader
    exposure: {
      getPublication: PublicViewsReader['exposure']['getPublication']
      getPagePolicy: PublicViewsReader['exposure']['getPagePolicy']
    }
  }
  getFullLoadCount: (collection: string, locale: string) => number
  getPolicyReadCount: (pageKey: string, locale: string) => number
  getMaxConcurrentListReads: () => number
} {
  const realPublicViews = new PublicViewsReader(store, siteId)
  const fullLoadCounts = new Map<string, number>()
  const policyReadCounts = new Map<string, number>()
  let concurrentListReads = 0
  let maxConcurrentListReads = 0
  // instrumentReader delegates every page to the real reader while measuring full-load boundaries.
  const instrumentReader = (
    collection: string,
    reader: PublicResourceReader
  ): PublicResourceReader => ({
    getBySlug: reader.getBySlug,
    list: async (options = {}) => {
      if (options.cursor === undefined) {
        const key = `${collection}\u0000${options.locale ?? ''}`
        fullLoadCounts.set(key, (fullLoadCounts.get(key) ?? 0) + 1)
      }
      concurrentListReads += 1
      maxConcurrentListReads = Math.max(maxConcurrentListReads, concurrentListReads)
      try {
        return await reader.list(options)
      } finally {
        concurrentListReads -= 1
      }
    }
  })
  return {
    publicViews: {
      products: instrumentReader('products', realPublicViews.products),
      categories: instrumentReader('categories', realPublicViews.categories),
      contents: instrumentReader('contents', realPublicViews.contents),
      blogs: instrumentReader('blog', realPublicViews.blogs),
      news: instrumentReader('news', realPublicViews.news),
      articleCategories: instrumentReader(
        'article-categories',
        realPublicViews.articleCategories
      ),
      exposure: {
        getPublication: realPublicViews.exposure.getPublication.bind(realPublicViews.exposure),
        getPagePolicy: async (pageKey, locale) => {
          const key = `${pageKey}\u0000${locale}`
          policyReadCounts.set(key, (policyReadCounts.get(key) ?? 0) + 1)
          return realPublicViews.exposure.getPagePolicy(pageKey, locale)
        }
      }
    },
    getFullLoadCount: (collection, locale) =>
      fullLoadCounts.get(`${collection}\u0000${locale}`) ?? 0,
    getPolicyReadCount: (pageKey, locale) =>
      policyReadCounts.get(`${pageKey}\u0000${locale}`) ?? 0,
    getMaxConcurrentListReads: () => maxConcurrentListReads
  }
}
