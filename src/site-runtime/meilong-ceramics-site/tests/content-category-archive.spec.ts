import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException
} from '@nestjs/common'
import {
  NodeSqlitePublishedStore,
  PublicViewsReader,
  type PublicViewEnvelope,
  type ArticleCategoryListOptions,
  type PublicViewListOptions,
  type ResourceType,
  type SiteExposurePublication,
  type StoredPublishedResource
} from '@oes/site-runtime-kit'

import { ContentCategoryArchiveController } from '../runtime/src/modules/public-data/content-category-archive.controller'
import { ContentCategoryArchiveService } from '../runtime/src/modules/public-data/content-category-archive.service'
import { SeoRouteIndexService } from '../runtime/src/modules/seo/seo-route-index.service'
import { SiteConfigService } from '../runtime/src/modules/site-config/site-config.service'
import {
  SiteExposureService,
  type PublicationReadSession
} from '../runtime/src/modules/site-exposure/site-exposure.service'

const siteId = 'meilong-category-archive-test'
const publishVersion = 31
const publishedAt = '2026-07-20T10:00:00.000Z'

describe('ContentCategoryArchiveService', () => {
  let directory: string
  let store: NodeSqlitePublishedStore
  let exposure: SiteExposureService
  let service: ContentCategoryArchiveService

  beforeEach(async () => {
    directory = mkdtempSync(join(tmpdir(), 'meilong-category-archive-'))
    store = new NodeSqlitePublishedStore({ path: join(directory, 'runtime.sqlite') })
    await store.init()
    const runtimeService = {
      getRuntime: () => ({ publicViews: new PublicViewsReader(store, siteId) })
    }
    exposure = new SiteExposureService(runtimeService as never)
    service = new ContentCategoryArchiveService(
      new SiteConfigService(),
      exposure
    )
  })

  afterEach(async () => {
    await store.close()
    rmSync(directory, { force: true, recursive: true })
  })

  it('gates Blog and News category directories by the consuming page capability', async () => {
    await commitResourcesWithPages(
      store,
      [
        { pageKey: 'BLOG_LIST', enabled: false },
        { pageKey: 'BLOG_DETAIL', enabled: true },
        { pageKey: 'BLOG_CATEGORY', enabled: true },
        { pageKey: 'NEWS_LIST', enabled: true },
        { pageKey: 'NEWS_DETAIL', enabled: false },
        { pageKey: 'NEWS_CATEGORY', enabled: true }
      ],
      [
        resource('article-category', 'shared-category', 'shared-category', {
          content_category_id: 'shared-category',
          applies_to: 'both',
          is_visible_in_blog_archive: true,
          is_visible_in_news_archive: true
        }),
        resource('blog', 'gated-blog', 'gated-blog', {
          category_ids: ['shared-category']
        }),
        resource('news', 'gated-news', 'gated-news', {
          category_ids: ['shared-category']
        })
      ]
    )
    const listVisibleCategories = service.listVisibleCategories as unknown as (
      contentType: 'blog' | 'news',
      pageKey: string | undefined,
      locale?: string
    ) => Promise<PublicViewEnvelope[]>

    await expect(
      listVisibleCategories.call(service, 'blog', 'BLOG_DETAIL', 'en-US')
    ).resolves.toEqual([expect.objectContaining({ slug: 'shared-category' })])
    await expect(
      listVisibleCategories.call(service, 'blog', 'BLOG_CATEGORY', 'en-US')
    ).resolves.toEqual([expect.objectContaining({ slug: 'shared-category' })])
    await expect(
      listVisibleCategories.call(service, 'blog', 'BLOG_LIST', 'en-US')
    ).rejects.toBeInstanceOf(NotFoundException)

    await expect(
      listVisibleCategories.call(service, 'news', 'NEWS_LIST', 'en-US')
    ).resolves.toEqual([expect.objectContaining({ slug: 'shared-category' })])
    await expect(
      listVisibleCategories.call(service, 'news', 'NEWS_CATEGORY', 'en-US')
    ).resolves.toEqual([expect.objectContaining({ slug: 'shared-category' })])
    await expect(
      listVisibleCategories.call(service, 'news', 'NEWS_DETAIL', 'en-US')
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it.each([
    ['missing', 'blog', undefined],
    ['cross-content', 'blog', 'NEWS_DETAIL'],
    ['unknown', 'news', 'UNKNOWN_PAGE']
  ])('rejects a %s category directory pageKey with 400', async (_label, contentType, pageKey) => {
    await commitResources(store, [])
    const listVisibleCategories = service.listVisibleCategories as unknown as (
      contentType: 'blog' | 'news',
      pageKey: string | undefined,
      locale?: string
    ) => Promise<PublicViewEnvelope[]>

    await expect(
      listVisibleCategories.call(service, contentType as 'blog' | 'news', pageKey, 'en-US')
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('derives a neutral Category archive from same-locale published Article membership', async () => {
    await commitResources(store, [
      resource('article-category', 'neutral-category', 'neutral-guides', {
        content_category_id: 'neutral-category'
      }),
      resource('blog', 'neutral-blog', 'neutral-story', {
        category_ids: ['neutral-category']
      })
    ])

    await expect(
      service.getArchive({ contentType: 'blog', slug: 'neutral-guides', locale: 'en-US' })
    ).resolves.toMatchObject({
      category: { resourceId: 'neutral-category' },
      items: [{ resourceId: 'neutral-blog' }]
    })
  })

  it('404s a neutral Category outside its Article collection or published locale', async () => {
    const publication = exposurePublication()
    await store.commitPublication({
      mode: 'snapshot',
      siteId,
      expectedLocalPublishVersion: 0,
      publishVersion,
      latestSyncId: 'sync-neutral-category-locality',
      lastKnownRemotePublishVersion: publishVersion,
      exposure: {
        ...publication,
        activeLocales: ['en-US', 'fr-FR'],
        pages: publication.pages.map((page) => ({
          ...page,
          supportedLocales: ['en-US', 'fr-FR']
        }))
      },
      resources: [
        resource('article-category', 'blog-only-category', 'blog-only-guides', {
          content_category_id: 'blog-only-category'
        }),
        resource('blog', 'blog-only-entry', 'blog-only-story', {
          category_ids: ['blog-only-category']
        })
      ],
      missingResources: []
    })

    await expect(
      service.getArchive({ contentType: 'blog', slug: 'blog-only-guides', locale: 'en-US' })
    ).resolves.toMatchObject({ category: { resourceId: 'blog-only-category' } })
    await expect(
      service.getArchive({ contentType: 'news', slug: 'blog-only-guides', locale: 'en-US' })
    ).rejects.toThrow('Category archive not found')
    await expect(
      service.getArchive({ contentType: 'blog', slug: 'blog-only-guides', locale: 'fr-FR' })
    ).rejects.toThrow('Category archive not found')
  })

  it('filters the complete News category set before pagination and exposes all archive years', async () => {
    const categoryId = 'dated-news-category'
    const news = Array.from({ length: 60 }, (_, index) =>
      resource('news', `dated-news-${index}`, `dated-news-${String(index).padStart(2, '0')}`, {
        category_ids: [categoryId],
        published_at:
          index < 30
            ? `2025-01-${String((index % 28) + 1).padStart(2, '0')}T00:00:00.000Z`
            : `2024-02-${String((index % 28) + 1).padStart(2, '0')}T00:00:00.000Z`
      })
    )
    await commitResources(store, [
      resource('article-category', categoryId, categoryId, {
        content_category_id: categoryId,
        applies_to: 'news',
        is_visible_in_news_archive: true
      }),
      ...news
    ])
    const getArchive = service.getArchive as unknown as (input: {
      contentType: 'news'
      slug: string
      locale: string
      page: number
      pageSize: number
      month: number
      year: number
    }) => Promise<{
      items: PublicViewEnvelope[]
      pagination: { page: number; pageSize: number; totalItems: number; totalPages: number }
      availableYears: number[]
      committedPublishVersion: number
    }>

    const archive = await getArchive.call(service, {
      contentType: 'news',
      slug: categoryId,
      locale: 'en-US',
      page: 2,
      pageSize: 8,
      month: 2,
      year: 2024
    })

    expect(archive.availableYears).toEqual([2025, 2024])
    expect(archive.pagination).toEqual({ page: 2, pageSize: 8, totalItems: 30, totalPages: 4 })
    expect(archive.items).toHaveLength(8)
    expect(archive.committedPublishVersion).toBe(publishVersion)
  })

  it.each([
    ['zero page', { page: 0 }],
    ['negative page', { page: -1 }],
    ['unsafe page', { page: Number.MAX_SAFE_INTEGER + 1 }],
    ['zero pageSize', { pageSize: 0 }],
    ['oversized pageSize', { pageSize: 25 }],
    ['zero month', { month: 0 }],
    ['month above range', { month: 13 }],
    ['year below range', { year: 1999 }],
    ['year above range', { year: 2101 }]
  ])('rejects %s at the category archive application boundary', async (_label, invalid) => {
    await commitResources(store, [])

    await expect(
      service.getArchive({
        contentType: 'blog',
        slug: 'guides',
        locale: 'en-US',
        ...invalid
      })
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it.each([
    ['page', '2e3'],
    ['month', '0xC'],
    ['month', '+12'],
    ['month', '12.0'],
    ['year', ' 2000 ']
  ])('rejects string %s=%s at the category archive service boundary', async (field, value) => {
    await commitResources(store, [])
    const getArchive = service.getArchive as unknown as (
      input: Record<string, unknown>
    ) => Promise<unknown>

    await expect(
      getArchive({
        contentType: 'news',
        slug: 'company',
        locale: 'en-US',
        [field]: value
      })
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('accepts the legal category archive date and page boundaries', async () => {
    await commitResources(store, [
      resource('article-category', 'boundary-category', 'boundary-category', {
        content_category_id: 'boundary-category',
        applies_to: 'blog',
        is_visible_in_blog_archive: true
      }),
      resource('blog', 'boundary-blog', 'boundary-blog', {
        category_ids: ['boundary-category'],
        published_at: '2000-01-01T00:00:00.000Z'
      })
    ])

    await expect(
      service.getArchive({
        contentType: 'blog',
        slug: 'boundary-category',
        locale: 'en-US',
        page: 1,
        pageSize: 24,
        month: 1,
        year: 2000
      })
    ).resolves.toMatchObject({
      items: [{ slug: 'boundary-blog' }],
      pagination: { page: 1, pageSize: 24, totalItems: 1, totalPages: 1 }
    })
  })

  it.each(['blog', 'news'] as const)(
    'keeps an existing %s category page two accessible and separates index eligibility',
    async (contentType) => {
      const categoryId = `${contentType}-later-page-category`
      await commitResources(store, [
        resource('article-category', categoryId, categoryId, {
          content_category_id: categoryId,
          applies_to: contentType,
          is_visible_in_blog_archive: contentType === 'blog',
          is_visible_in_news_archive: contentType === 'news'
        }),
        ...Array.from({ length: 13 }, (_, index) =>
          resource(contentType, `${contentType}-later-${index}`, `${contentType}-later-${index}`, {
            category_ids: [categoryId],
            published_at: `2026-01-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`
          })
        )
      ])

      await expect(
        service.getArchive({ contentType, slug: categoryId, locale: 'en-US', page: 2, pageSize: 8 })
      ).resolves.toMatchObject({
        exists: true,
        indexEligible: true,
        canonicalPath: `/${contentType === 'blog' ? 'blogs' : 'news'}/categories/${categoryId}?page=2`,
        pagination: { page: 2, pageSize: 8, totalItems: 13, totalPages: 2 },
        items: expect.any(Array)
      })
      await expect(
        service.getArchive({ contentType, slug: categoryId, locale: 'en-US', page: 3, pageSize: 8 })
      ).rejects.toBeInstanceOf(NotFoundException)
    }
  )

  it('derives Category visibility from matching Article membership, not legacy archive flags', async () => {
    await commitResources(store, [
      resource('article-category', 'hidden-category', 'hidden-category', {
        content_category_id: 'hidden-category',
        applies_to: 'blog',
        is_visible_in_blog_archive: false
      }),
      resource('blog', 'referencing-blog', 'referencing-blog', {
        category_ids: ['hidden-category']
      })
    ])

    await expect(
      exposure.getRouteDecision({
        pageKey: 'BLOG_CATEGORY',
        locale: 'en-US',
        resource: { collection: 'blog-category', slug: 'hidden-category' }
      })
    ).resolves.toMatchObject({ resourceAvailable: true })
    await expect(
      service.getArchive({ contentType: 'blog', slug: 'hidden-category', locale: 'en-US' })
    ).resolves.toMatchObject({
      category: { resourceId: 'hidden-category' },
      items: [{ resourceId: 'referencing-blog' }]
    })
  })

  it.each([
    ['missing', undefined],
    ['null', null],
    ['string', 'true'],
    ['number', 1]
  ])('does not interpret legacy %s Blog and News archive visibility payloads', async (_label, flagValue) => {
    const invalidBlogPayload: Record<string, unknown> = {
      content_category_id: 'invalid-blog-category',
      applies_to: 'blog'
    }
    const invalidNewsPayload: Record<string, unknown> = {
      content_category_id: 'invalid-news-category',
      applies_to: 'news'
    }
    if (flagValue !== undefined) {
      invalidBlogPayload.is_visible_in_blog_archive = flagValue
      invalidNewsPayload.is_visible_in_news_archive = flagValue
    }
    await commitResources(store, [
      resource('article-category', 'valid-blog-category', 'valid-blog-category', {
        content_category_id: 'valid-blog-category',
        applies_to: 'blog',
        is_visible_in_blog_archive: true
      }),
      resource(
        'article-category',
        'invalid-blog-category',
        'invalid-blog-category',
        invalidBlogPayload
      ),
      resource('article-category', 'valid-news-category', 'valid-news-category', {
        content_category_id: 'valid-news-category',
        applies_to: 'news',
        is_visible_in_news_archive: true
      }),
      resource(
        'article-category',
        'invalid-news-category',
        'invalid-news-category',
        invalidNewsPayload
      ),
      resource('blog', 'visibility-blog', 'visibility-blog', {
        category_ids: ['valid-blog-category', 'invalid-blog-category']
      }),
      resource('news', 'visibility-news', 'visibility-news', {
        category_ids: ['valid-news-category', 'invalid-news-category']
      })
    ])

    await expect(service.listVisibleCategories('blog', 'BLOG_LIST', 'en-US')).resolves.toMatchObject([
      { slug: 'invalid-blog-category' },
      { slug: 'valid-blog-category' }
    ])
    await expect(service.listVisibleCategories('news', 'NEWS_LIST', 'en-US')).resolves.toMatchObject([
      { slug: 'invalid-news-category' },
      { slug: 'valid-news-category' }
    ])
    await expect(
      exposure.getRouteDecision({
        pageKey: 'BLOG_CATEGORY',
        locale: 'en-US',
        resource: { collection: 'blog-category', slug: 'invalid-blog-category' }
      })
    ).resolves.toMatchObject({ resourceAvailable: true })
    await expect(
      exposure.getRouteDecision({
        pageKey: 'NEWS_CATEGORY',
        locale: 'en-US',
        resource: { collection: 'news-category', slug: 'invalid-news-category' }
      })
    ).resolves.toMatchObject({ resourceAvailable: true })
    await expect(
      service.getArchive({
        contentType: 'blog',
        slug: 'invalid-blog-category',
        locale: 'en-US'
      })
    ).resolves.toMatchObject({
      category: { resourceId: 'invalid-blog-category' },
      items: [{ resourceId: 'visibility-blog' }]
    })
    await expect(
      service.getArchive({
        contentType: 'news',
        slug: 'invalid-news-category',
        locale: 'en-US'
      })
    ).resolves.toMatchObject({
      category: { resourceId: 'invalid-news-category' },
      items: [{ resourceId: 'visibility-news' }]
    })

    const categoryRoutes = await service.listCategoryRouteIndex('en-US')
    expect(categoryRoutes.map((route) => route.slug)).toEqual([
      'invalid-blog-category',
      'valid-blog-category',
      'invalid-news-category',
      'valid-news-category'
    ])
    const seoIndex = await new SeoRouteIndexService(
      new SiteConfigService(),
      service,
      exposure
    ).getRouteIndex()
    expect(
      seoIndex.routes
        .filter((route) => route.resourceType.endsWith('_category'))
        .map((route) => route.slug)
    ).toEqual([
      'invalid-blog-category',
      'valid-blog-category',
      'invalid-news-category',
      'valid-news-category'
    ])
  })

  it('resolves one shared Content Category alias into each valid route family through the local index', async () => {
    await commitResources(store, [
      resource('article-category', 'shared-category', 'surface-guides', {
        content_category_id: 'shared-category',
        applies_to: 'both',
        is_visible_in_blog_archive: true,
        is_visible_in_news_archive: true,
        historical_slugs: ['shared-archive']
      }),
      resource('blog', 'blog-entry', 'zellige-story', { category_ids: ['shared-category'] }),
      resource('news', 'news-entry', 'company-update', { category_ids: ['shared-category'] })
    ])
    const aliasLookup = jest.spyOn(store, 'resolveHistoricalAlias')

    await expect(
      service.getArchive({ contentType: 'blog', slug: 'shared-archive', locale: 'en-US' })
    ).resolves.toMatchObject({
      category: { slug: 'surface-guides' },
      redirectTo: '/blogs/categories/surface-guides',
      exists: true,
      indexEligible: false
    })
    await expect(
      service.getArchive({ contentType: 'news', slug: 'shared-archive', locale: 'en-US' })
    ).resolves.toMatchObject({
      category: { slug: 'surface-guides' },
      redirectTo: '/news/categories/surface-guides',
      exists: true,
      indexEligible: false
    })
    expect(aliasLookup).toHaveBeenNthCalledWith(1, {
      siteId,
      namespace: 'article-category',
      locale: 'en-US',
      slug: 'shared-archive'
    })
    expect(aliasLookup).toHaveBeenNthCalledWith(2, {
      siteId,
      namespace: 'article-category',
      locale: 'en-US',
      slug: 'shared-archive'
    })
  })

  it('resolves a Blog historical slug without listing the Blog collection', async () => {
    await commitResourcesWithPages(
      store,
      [{ pageKey: 'BLOG_DETAIL', enabled: true }],
      [
        resource('blog', 'indexed-blog', 'current-story', {
          historical_slugs: ['old-story']
        })
      ]
    )
    const fullCollectionRead = jest
      .spyOn(store, 'listPublishedResources')
      .mockRejectedValue(new Error('Historical redirect resolution must not scan public views'))

    await expect(service.resolveContentRedirect('blog', 'old-story', 'en-US')).resolves.toBe(
      '/blogs/current-story'
    )
    expect(fullCollectionRead).not.toHaveBeenCalled()
  })

  it('finds a visible category and its only member beyond the Runtime reader cap', async () => {
    const categoryFillers = Array.from({ length: 205 }, (_, index) =>
      resource(
        'article-category',
        `filler-category-${index}`,
        `filler-category-${String(index).padStart(3, '0')}`,
        {
          content_category_id: `filler-category-${index}`,
          applies_to: 'blog',
          is_visible_in_blog_archive: true
        }
      )
    )
    const blogFillers = Array.from({ length: 205 }, (_, index) =>
      resource('blog', `filler-blog-${index}`, `filler-blog-${String(index).padStart(3, '0')}`, {
        category_ids: []
      })
    )
    await commitResources(store, [
      ...categoryFillers,
      resource('article-category', 'late-category', 'zz-late-category', {
        content_category_id: 'late-category',
        applies_to: 'blog',
        is_visible_in_blog_archive: true
      }),
      ...blogFillers,
      resource('blog', 'late-blog', 'zz-late-blog', { category_ids: ['late-category'] })
    ])

    await expect(service.listVisibleCategories('blog', 'BLOG_LIST', 'en-US')).resolves.toMatchObject([
      { resourceId: 'late-category', slug: 'zz-late-category' }
    ])
    await expect(
      service.getArchive({ contentType: 'blog', slug: 'zz-late-category', locale: 'en-US' })
    ).resolves.toMatchObject({
      items: [{ resourceId: 'late-blog', slug: 'zz-late-blog' }],
      pagination: { totalItems: 1, totalPages: 1 }
    })
  })

  it('lists every real-store category route beyond the Runtime reader page cap', async () => {
    const categoryCount = 206
    const categoryIds = Array.from({ length: categoryCount }, (_, index) =>
      `route-category-${String(index).padStart(3, '0')}`
    )
    await commitResources(store, [
      ...categoryIds.map((categoryId) =>
        resource('article-category', categoryId, categoryId, {
          content_category_id: categoryId,
          applies_to: 'blog',
          is_visible_in_blog_archive: true
        })
      ),
      resource('blog', 'route-index-blog', 'route-index-blog', { category_ids: categoryIds })
    ])

    const routes = await service.listCategoryRouteIndex('en-US')

    expect(routes).toHaveLength(categoryCount)
    expect(routes.at(-1)).toEqual({
      resourceType: 'blog_category',
      locale: 'en-US',
      slug: 'route-category-205',
      path: '/blogs/categories/route-category-205',
      canonicalUrl: 'https://meilong-ceramics.com/blogs/categories/route-category-205',
      updatedAt: publishedAt,
      pageKey: 'BLOG_CATEGORY',
      committedPublishVersion: publishVersion
    })
    expect(new Set(routes.map((route) => route.slug)).size).toBe(categoryCount)
  })

  it('builds category route indexes without sorting full content or category collections', async () => {
    const categoryCount = 206
    const categories: PublicViewEnvelope[] = []
    const entries: PublicViewEnvelope[] = []
    for (let index = categoryCount - 1; index >= 0; index -= 1) {
      const suffix = String(index).padStart(3, '0')
      const categoryId = `linear-category-${suffix}`
      const categoryPayload: Record<string, unknown> = {
        content_category_id: categoryId,
        applies_to: 'blog',
        is_visible_in_blog_archive: true
      }
      Object.defineProperty(categoryPayload, 'sort_order', {
        enumerable: true,
        get: () => {
          throw new Error('Category route index must not compare category sort fields')
        }
      })
      const entryPayload: Record<string, unknown> = { category_ids: [categoryId] }
      Object.defineProperty(entryPayload, 'published_at', {
        enumerable: true,
        get: () => {
          throw new Error('Category route index must not compare content sort fields')
        }
      })
      categories.push(
        publicResource('article-category', categoryId, categoryId, categoryPayload)
      )
      entries.push(
        publicResource('blog', `linear-blog-${suffix}`, `linear-blog-${suffix}`, entryPayload)
      )
    }
    const session = {
      publication: categoryPublication(publishVersion),
      getPagePolicy: async (pageKey: string) => ({
        indexEligible: pageKey === 'BLOG_CATEGORY'
      }),
      listAllPublishedResources: async (collection: string) => {
        if (collection === 'blog-category') {
          return categories
        }
        if (collection === 'blog') {
          return entries
        }
        return []
      }
    } as unknown as PublicationReadSession

    const routes = await service.listCategoryRouteIndexInSession(session, 'en-US')

    expect(routes).toHaveLength(categoryCount)
    expect(routes[0]).toMatchObject({
      slug: 'linear-category-205',
      path: '/blogs/categories/linear-category-205',
      canonicalUrl: 'https://meilong-ceramics.com/blogs/categories/linear-category-205',
      committedPublishVersion: publishVersion
    })
    expect(routes.at(-1)?.slug).toBe('linear-category-000')
  })

  it('retries the complete real-store category route index and returns only v2 routes', async () => {
    await commitCategorySnapshot(store, 0, 71, 'v1')
    const transition = createRealCategoryTransitionService(store, [
      { expectedVersion: 71, publishVersion: 72, suffix: 'v2' }
    ])

    await expect(transition.service.listCategoryRouteIndex('en-US')).resolves.toEqual([
      {
        resourceType: 'blog_category',
        locale: 'en-US',
        slug: 'category-v2',
        path: '/blogs/categories/category-v2',
        canonicalUrl: 'https://meilong-ceramics.com/blogs/categories/category-v2',
        updatedAt: publishedAt,
        pageKey: 'BLOG_CATEGORY',
        committedPublishVersion: 72
      }
    ])
    expect(transition.getCategoryListCalls()).toBeGreaterThan(0)
    expect(transition.getCategoryListCalls()).toBeLessThanOrEqual(2)
  })

  it('fails the complete real-store category route index when both attempts change publication', async () => {
    await commitCategorySnapshot(store, 0, 73, 'v1')
    const transition = createRealCategoryTransitionService(store, [
      { expectedVersion: 73, publishVersion: 74, suffix: 'v2' },
      { expectedVersion: 74, publishVersion: 75, suffix: 'v3' }
    ])

    await expect(transition.service.listCategoryRouteIndex('en-US')).rejects.toBeInstanceOf(
      ServiceUnavailableException
    )
    expect(transition.getCategoryListCalls()).toBeGreaterThan(0)
    expect(transition.getCategoryListCalls()).toBeLessThanOrEqual(2)
  })

  it('fails a complete real-store category archive when both attempts change publication', async () => {
    await commitCategorySnapshot(store, 0, 76, 'v1')
    const transition = createRealCategoryTransitionService(store, [
      { expectedVersion: 76, publishVersion: 77, suffix: 'v2' },
      { expectedVersion: 77, publishVersion: 78, suffix: 'v3' }
    ])

    await expect(
      transition.service.getArchive({
        contentType: 'blog',
        slug: 'category-v1',
        locale: 'en-US'
      })
    ).rejects.toBeInstanceOf(ServiceUnavailableException)
    expect(transition.getCategoryListCalls()).toBeGreaterThan(0)
    expect(transition.getCategoryListCalls()).toBeLessThanOrEqual(2)
  })

  it('retries default locale resolution with the complete category directory operation', async () => {
    const controller = await createLocaleSwitchingController(store)

    await expect(controller.listVisibleCategories('blog', 'BLOG_LIST')).resolves.toEqual({
      items: [expect.objectContaining({ slug: 'guides-fr', locale: 'fr-FR', publishVersion: 62 })]
    })
  })

  it('retries default locale resolution with the complete category archive operation', async () => {
    const controller = await createLocaleSwitchingController(store)

    await expect(controller.getCategoryArchive('blog', 'guides-fr')).resolves.toMatchObject({
      category: { slug: 'guides-fr', locale: 'fr-FR', publishVersion: 62 },
      items: [{ slug: 'histoire', locale: 'fr-FR', publishVersion: 62 }],
      canonicalPath: '/blogs/categories/guides-fr'
    })
  })

  it('retries default locale resolution with the complete content redirect operation', async () => {
    const controller = await createLocaleSwitchingController(store)

    await expect(controller.resolveContentRedirect('blog', 'ancienne-histoire')).resolves.toEqual({
      redirectTo: '/blogs/histoire'
    })
  })

  it('retries the complete category directory when page governance switches mid-read', async () => {
    const enabledPublication = exposurePublication()
    const disabledPublication = {
      ...enabledPublication,
      publishVersion: publishVersion + 1,
      pages: enabledPublication.pages.map((page) =>
        page.pageKey === 'BLOG_LIST' ? { ...page, enabled: false } : page
      )
    }
    let currentPublication = enabledPublication
    let switched = false
    const category = publicResource(
      'article-category',
      'versioned-category',
      'versioned-category',
      {
        content_category_id: 'versioned-category',
        applies_to: 'blog',
        is_visible_in_blog_archive: true
      }
    )
    const entry = publicResource('blog', 'versioned-blog', 'versioned-blog', {
      category_ids: ['versioned-category']
    })
    const emptyReader = {
      list: async () => ({ items: [], nextCursor: null }),
      getBySlug: async () => null
    }
    const runtimeService = {
      getRuntime: () => ({
        publicViews: {
          products: emptyReader,
          categories: emptyReader,
          contents: emptyReader,
          blogs: {
            ...emptyReader,
            list: async () => {
              if (!switched) {
                currentPublication = disabledPublication
                switched = true
              }
              return { items: [entry], nextCursor: null }
            }
          },
          news: emptyReader,
          articleCategories: {
            ...emptyReader,
            list: async () => ({ items: [category], nextCursor: null })
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
    const versionedExposure = new SiteExposureService(runtimeService as never)
    const versionedService = new ContentCategoryArchiveService(
      new SiteConfigService(),
      versionedExposure
    )

    await expect(
      versionedService.listVisibleCategories('blog', 'BLOG_LIST', 'en-US')
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('retries a complete category archive and returns only the stable publication', async () => {
    const firstPublication: SiteExposurePublication = {
      ...exposurePublication(),
      publishVersion: 51,
      pages: exposurePublication().pages.map((page) =>
        page.pageKey === 'BLOG_CATEGORY' ? { ...page, indexable: false } : page
      )
    }
    const secondPublication: SiteExposurePublication = {
      ...firstPublication,
      publishVersion: 52
    }
    const firstCategory = publicResource(
      'article-category',
      'versioned-category',
      'versioned-category',
      {
        content_category_id: 'versioned-category',
        applies_to: 'blog',
        is_visible_in_blog_archive: true
      },
      51
    )
    const secondCategory = { ...firstCategory, publishVersion: 52 }
    const firstEntry = publicResource(
      'blog',
      'versioned-blog',
      'versioned-blog-v1',
      { category_ids: ['versioned-category'] },
      51
    )
    const secondEntry = {
      ...firstEntry,
      slug: 'versioned-blog-v2',
      publishVersion: 52
    }
    let currentPublication = firstPublication
    let blogListCalls = 0
    // currentCategory returns the category row belonging to the simulated committed version.
    const currentCategory = () =>
      currentPublication.publishVersion === 51 ? firstCategory : secondCategory
    // currentEntry returns the archive member belonging to the simulated committed version.
    const currentEntry = () => (currentPublication.publishVersion === 51 ? firstEntry : secondEntry)
    const emptyReader = {
      list: async () => ({ items: [], nextCursor: null }),
      getBySlug: async () => null
    }
    const runtimeService = {
      getRuntime: () => ({
        publicViews: {
          products: emptyReader,
          categories: emptyReader,
          contents: emptyReader,
          blogs: {
            ...emptyReader,
            list: async () => {
              blogListCalls += 1
              if (blogListCalls === 1) {
                currentPublication = secondPublication
              }
              return { items: [currentEntry()], nextCursor: null }
            }
          },
          news: emptyReader,
          articleCategories: {
            list: async () => ({ items: [currentCategory()], nextCursor: null }),
            getBySlug: async () => currentCategory()
          },
          exposure: {
            getPublication: async () => currentPublication,
            getPagePolicy: async (pageKey: string, locale: string) => {
              const page = currentPublication.pages.find(
                (candidate) => candidate.pageKey === pageKey
              )
              const enabled = page?.enabled ?? false
              const indexable = page?.indexable ?? false
              return {
                pageKey,
                locale,
                enabled,
                indexable,
                localeActive: true,
                localeSupported: Boolean(page),
                accessible: enabled && Boolean(page),
                indexEligible: enabled && indexable,
                supportedLocales: page?.supportedLocales ?? [],
                committedPublishVersion: currentPublication.publishVersion
              }
            }
          }
        }
      })
    }
    const versionedExposure = new SiteExposureService(runtimeService as never)
    const versionedService = new ContentCategoryArchiveService(
      new SiteConfigService(),
      versionedExposure
    )

    await expect(
      versionedService.getArchive({
        contentType: 'blog',
        slug: 'versioned-category',
        locale: 'en-US'
      })
    ).resolves.toMatchObject({
      category: { publishVersion: 52 },
      items: [{ slug: 'versioned-blog-v2', publishVersion: 52 }]
    })
    expect(blogListCalls).toBeGreaterThan(0)
    expect(blogListCalls).toBeLessThanOrEqual(2)
  })
})

// commitResourcesWithPages installs an operation-specific page matrix over one real SQLite snapshot.
async function commitResourcesWithPages(
  store: NodeSqlitePublishedStore,
  pages: Array<{ pageKey: string; enabled: boolean }>,
  resources: StoredPublishedResource[]
): Promise<void> {
  await store.commitPublication({
    mode: 'snapshot',
    siteId,
    expectedLocalPublishVersion: 0,
    publishVersion,
    latestSyncId: 'sync-operation-page-matrix',
    lastKnownRemotePublishVersion: publishVersion,
    exposure: {
      ...exposurePublication(),
      pages: pages.map((page) => ({
        ...page,
        indexable: true,
        supportedLocales: ['en-US']
      }))
    },
    resources,
    missingResources: []
  })
}

// commitResources installs one atomic publication for category archive integration tests.
async function commitResources(
  store: NodeSqlitePublishedStore,
  resources: StoredPublishedResource[]
): Promise<void> {
  await store.commitPublication({
    mode: 'snapshot',
    siteId,
    expectedLocalPublishVersion: 0,
    publishVersion,
    latestSyncId: 'sync-31',
    lastKnownRemotePublishVersion: publishVersion,
    exposure: exposurePublication(),
    resources,
    missingResources: []
  })
}

// exposurePublication enables the Blog list and category capabilities for one active locale.
function exposurePublication(): SiteExposurePublication {
  return {
    siteId,
    publishVersion,
    defaultLocale: 'en-US',
    activeLocales: ['en-US'],
    pages: [
      {
        pageKey: 'BLOG_CATEGORY',
        enabled: true,
        indexable: true,
        supportedLocales: ['en-US']
      },
      {
        pageKey: 'BLOG_LIST',
        enabled: true,
        indexable: true,
        supportedLocales: ['en-US']
      },
      {
        pageKey: 'NEWS_CATEGORY',
        enabled: true,
        indexable: true,
        supportedLocales: ['en-US']
      },
      {
        pageKey: 'NEWS_LIST',
        enabled: true,
        indexable: true,
        supportedLocales: ['en-US']
      }
    ],
    publishedAt
  }
}

// resource creates one exact-locale public view row for archive visibility tests.
function resource(
  resourceType: ResourceType,
  resourceId: string,
  slug: string,
  payload: Record<string, unknown>,
  locale = 'en-US',
  resourcePublishVersion = publishVersion
): StoredPublishedResource {
  return {
    siteId,
    resourceType,
    resourceId,
    slug,
    locale,
    status: 'published',
    publishVersion: resourcePublishVersion,
    payloadJson: JSON.stringify(payload),
    updatedAt: publishedAt
  }
}

// createLocaleSwitchingController commits v2 after the real store returns v1 so default-locale reads must retry as one operation.
async function createLocaleSwitchingController(
  store: NodeSqlitePublishedStore
): Promise<ContentCategoryArchiveController> {
  const firstPublication = localePublication(61, 'en-US')
  const secondPublication = localePublication(62, 'fr-FR')
  const secondResources = [
    resource(
      'article-category',
      'guides-fr',
      'guides-fr',
      {
        content_category_id: 'guides-fr',
        applies_to: 'blog',
        is_visible_in_blog_archive: true
      },
      'fr-FR',
      62
    ),
    resource(
      'blog',
      'story-fr',
      'histoire',
      {
        category_ids: ['guides-fr'],
        historical_slugs: ['ancienne-histoire']
      },
      'fr-FR',
      62
    )
  ]
  await store.commitPublication({
    mode: 'snapshot',
    siteId,
    expectedLocalPublishVersion: 0,
    publishVersion: 61,
    latestSyncId: 'sync-61',
    lastKnownRemotePublishVersion: 61,
    exposure: firstPublication,
    resources: [],
    missingResources: []
  })
  const realPublicViews = new PublicViewsReader(store, siteId)
  let switched = false
  const runtimeService = {
    getRuntime: () => ({
      publicViews: {
        products: realPublicViews.products,
        categories: realPublicViews.categories,
        contents: realPublicViews.contents,
        blogs: realPublicViews.blogs,
        news: realPublicViews.news,
        articleCategories: realPublicViews.articleCategories,
        historicalAliases: realPublicViews.historicalAliases,
        exposure: {
          getPublication: async () => {
            const publication = await realPublicViews.exposure.getPublication()
            if (!switched) {
              switched = true
              await store.commitPublication({
                mode: 'snapshot',
                siteId,
                expectedLocalPublishVersion: 61,
                publishVersion: 62,
                latestSyncId: 'sync-62',
                lastKnownRemotePublishVersion: 62,
                exposure: secondPublication,
                resources: secondResources,
                missingResources: []
              })
            }
            return publication
          },
          getPagePolicy: realPublicViews.exposure.getPagePolicy.bind(realPublicViews.exposure)
        }
      }
    })
  }
  const siteExposure = new SiteExposureService(runtimeService as never)
  const archive = new ContentCategoryArchiveService(
    new SiteConfigService(),
    siteExposure
  )
  return new ContentCategoryArchiveController(archive)
}

// localePublication provides one complete category surface whose only active locale changes atomically.
function localePublication(
  nextPublishVersion: number,
  locale: string
): SiteExposurePublication {
  return {
    siteId,
    publishVersion: nextPublishVersion,
    defaultLocale: locale,
    activeLocales: [locale],
    pages: ['BLOG_CATEGORY', 'BLOG_LIST', 'BLOG_DETAIL'].map((pageKey) => ({
      pageKey,
      enabled: true,
      indexable: true,
      supportedLocales: [locale]
    })),
    publishedAt
  }
}

// publicResource creates a mapped reader envelope for deterministic mid-read publication switches.
function publicResource(
  resourceType: ResourceType,
  resourceId: string,
  slug: string,
  payload: Record<string, unknown>,
  resourcePublishVersion = publishVersion
) {
  return {
    siteId,
    resourceType,
    resourceId,
    slug,
    locale: 'en-US',
    status: 'published' as const,
    publishVersion: resourcePublishVersion,
    updatedAt: publishedAt,
    payload
  }
}

interface CategoryPublicationTransition {
  expectedVersion: number
  publishVersion: number
  suffix: string
}

// commitCategorySnapshot atomically installs one complete real-store category publication.
async function commitCategorySnapshot(
  store: NodeSqlitePublishedStore,
  expectedVersion: number,
  nextPublishVersion: number,
  suffix: string
): Promise<void> {
  await store.commitPublication({
    mode: 'snapshot',
    siteId,
    expectedLocalPublishVersion: expectedVersion,
    publishVersion: nextPublishVersion,
    latestSyncId: `sync-${nextPublishVersion}`,
    lastKnownRemotePublishVersion: nextPublishVersion,
    exposure: categoryPublication(nextPublishVersion),
    resources: [
      resource(
        'article-category',
        `category-${suffix}`,
        `category-${suffix}`,
        {
          content_category_id: `category-${suffix}`,
          applies_to: 'blog',
          is_visible_in_blog_archive: true
        },
        'en-US',
        nextPublishVersion
      ),
      resource(
        'blog',
        `entry-${suffix}`,
        `entry-${suffix}`,
        { category_ids: [`category-${suffix}`] },
        'en-US',
        nextPublishVersion
      )
    ],
    missingResources: []
  })
}

// categoryPublication enables only the real Blog category surface needed by transition tests.
function categoryPublication(nextPublishVersion: number): SiteExposurePublication {
  return {
    siteId,
    publishVersion: nextPublishVersion,
    defaultLocale: 'en-US',
    activeLocales: ['en-US'],
    pages: [
      {
        pageKey: 'BLOG_CATEGORY',
        enabled: true,
        indexable: true,
        supportedLocales: ['en-US']
      }
    ],
    publishedAt
  }
}

// createRealCategoryTransitionService delegates every read to SQLite and only controls atomic commit timing.
function createRealCategoryTransitionService(
  store: NodeSqlitePublishedStore,
  transitions: CategoryPublicationTransition[]
): {
  service: ContentCategoryArchiveService
  getCategoryListCalls: () => number
} {
  const realPublicViews = new PublicViewsReader(store, siteId)
  let categoryListCalls = 0
  const runtimeService = {
    getRuntime: () => ({
      publicViews: {
        products: realPublicViews.products,
        categories: realPublicViews.categories,
        contents: realPublicViews.contents,
        blogs: realPublicViews.blogs,
        news: realPublicViews.news,
        articleCategories: {
          getBySlug: realPublicViews.articleCategories.getBySlug,
          list: async (options: ArticleCategoryListOptions) => {
            const result = await realPublicViews.articleCategories.list(options)
            const transition = transitions[categoryListCalls]
            categoryListCalls += 1
            if (transition) {
              await commitCategorySnapshot(
                store,
                transition.expectedVersion,
                transition.publishVersion,
                transition.suffix
              )
            }
            return result
          }
        },
        historicalAliases: realPublicViews.historicalAliases,
        exposure: realPublicViews.exposure
      }
    })
  }
  const siteExposure = new SiteExposureService(runtimeService as never)
  return {
    service: new ContentCategoryArchiveService(
      new SiteConfigService(),
      siteExposure
    ),
    getCategoryListCalls: () => categoryListCalls
  }
}
