import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  NodeSqlitePublishedStore,
  PublicViewsReader,
  type PublicResourceReader,
  type ResourceType,
  type SiteExposurePublication,
  type StoredPublishedResource
} from '@oes/site-runtime-kit'

import {
  listAllPublishedResources,
  SiteExposureService
} from '../runtime/src/modules/site-exposure/site-exposure.service'

const siteId = 'meilong-governance-test'
const publishedAt = '2026-07-20T08:00:00.000Z'
const composedCategorySlug = 'café-guides'
const invalidCanonicalCategorySlugs = [
  ['padded', ` ${composedCategorySlug} `],
  ['decomposed-NFC', composedCategorySlug.normalize('NFD')]
] as const

describe('SiteExposureService', () => {
  let directory: string
  let store: NodeSqlitePublishedStore
  let service: SiteExposureService

  beforeEach(async () => {
    directory = mkdtempSync(join(tmpdir(), 'meilong-exposure-'))
    store = new NodeSqlitePublishedStore({ path: join(directory, 'runtime.sqlite') })
    await store.init()
    await store.commitPublication({
      mode: 'snapshot',
      siteId,
      expectedLocalPublishVersion: 0,
      publishVersion: 17,
      latestSyncId: 'sync-17',
      lastKnownRemotePublishVersion: 17,
      exposure: exposurePublication(),
      resources: [
        resource('news', 'news-1', 'factory-update', 'en-US'),
        resource('news', 'news-2', 'shared-update', 'en-US', {
          historical_slugs: ['old-shared-update']
        }),
        resource('news', 'news-2', 'mise-a-jour', 'fr-FR'),
        resource('news', 'news-3', 'private-update', 'en-US', { seo: { noindex: true } })
      ],
      missingResources: []
    })
    const publicViews = new PublicViewsReader(store, siteId)
    service = new SiteExposureService({
      getRuntime: () => ({ publicViews })
    } as never)
  })

  afterEach(async () => {
    await store.close()
    rmSync(directory, { force: true, recursive: true })
  })

  it.each([
    ['missing', undefined],
    ['empty', '']
  ])(
    'rejects a %s Category slug before opening a publication fence',
    async (_label, slug) => {
      const getRuntime = jest.fn(() => {
        throw new Error('publication reader must not be called')
      })
      const isolatedService = new SiteExposureService({ getRuntime } as never)

      await expect(
        isolatedService.getRouteDecision({
          pageKey: 'NEWS_CATEGORY',
          locale: 'en-US',
          resource: { collection: 'news-category', slug },
          categoryArchive: {
            kind: 'category-archive',
            page: 2,
            pageSize: 8
          }
        } as never)
      ).rejects.toMatchObject({ status: 400 })
      expect(getRuntime).not.toHaveBeenCalled()
    }
  )

  it.each(invalidCanonicalCategorySlugs)(
    'rejects a %s Category slug before opening a publication fence',
    async (_label, slug) => {
      const getRuntime = jest.fn(() => {
        throw new Error('publication reader must not be called')
      })
      const isolatedService = new SiteExposureService({ getRuntime } as never)

      await expect(
        isolatedService.getRouteDecision({
          pageKey: 'NEWS_CATEGORY',
          locale: 'en-US',
          resource: { collection: 'news-category', slug },
          categoryArchive: {
            kind: 'category-archive',
            page: 2,
            pageSize: 8
          }
        })
      ).rejects.toMatchObject({ status: 400 })
      expect(getRuntime).not.toHaveBeenCalled()
    }
  )

  it.each([
    ['missing', undefined] as const,
    ...invalidCanonicalCategorySlugs
  ])(
    'rejects a %s Category slug before an in-session policy or resource read',
    async (_label, slug) => {
      const getPagePolicy = jest.fn()
      const getPublishedResourceBySlug = jest.fn()
      const listAllPublishedResources = jest.fn()
      const isolatedService = new SiteExposureService({} as never)

      await expect(
        isolatedService.getRouteDecisionInSession(
          {
            publication: exposurePublication(),
            getPagePolicy,
            getPublishedResourceBySlug,
            listAllPublishedResources
          } as never,
          {
            pageKey: 'NEWS_CATEGORY',
            locale: 'en-US',
            resource: { collection: 'news-category', slug },
            categoryArchive: {
              kind: 'category-archive',
              page: 2,
              pageSize: 8
            }
          }
        )
      ).rejects.toMatchObject({ status: 400 })
      expect(getPagePolicy).not.toHaveBeenCalled()
      expect(getPublishedResourceBySlug).not.toHaveBeenCalled()
      expect(listAllPublishedResources).not.toHaveBeenCalled()
    }
  )

  it('accepts a composed Unicode Category slug and proceeds through policy and resource reads', async () => {
    const getPagePolicy = jest.fn().mockResolvedValue({
      accessible: true,
      indexable: true,
      indexEligible: true
    })
    const getPublishedResourceBySlug = jest.fn().mockResolvedValue(null)
    const resolvePublishedHistoricalAlias = jest.fn().mockResolvedValue(null)
    const listAllPublishedResources = jest.fn().mockResolvedValue([])
    const isolatedService = new SiteExposureService({} as never)

    await expect(
      isolatedService.getRouteDecisionInSession(
        {
          publication: exposurePublication(),
          getPagePolicy,
          getPublishedResourceBySlug,
          resolvePublishedHistoricalAlias,
          listAllPublishedResources
        } as never,
        {
          pageKey: 'NEWS_CATEGORY',
          locale: 'en-US',
          resource: { collection: 'news-category', slug: composedCategorySlug },
          categoryArchive: {
            kind: 'category-archive',
            page: 2,
            pageSize: 8
          }
        }
      )
    ).resolves.toMatchObject({ resourceAvailable: false })
    expect(getPagePolicy).toHaveBeenCalledWith('NEWS_CATEGORY', 'en-US')
    expect(getPublishedResourceBySlug).toHaveBeenCalledWith(
      'news-category',
      composedCategorySlug,
      'en-US'
    )
    expect(resolvePublishedHistoricalAlias).toHaveBeenCalledWith(
      'news-category',
      composedCategorySlug,
      'en-US'
    )
    expect(listAllPublishedResources).not.toHaveBeenCalled()
  })

  it('fails closed for an inactive locale and a page-wide disabled capability', async () => {
    await expect(
      service.getRouteDecision({ pageKey: 'NEWS_DETAIL', locale: 'de-DE' })
    ).resolves.toMatchObject({ accessible: false, resourceAvailable: false })

    await expect(
      service.getRouteDecision({ pageKey: 'ABOUT', locale: 'en-US' })
    ).resolves.toMatchObject({ accessible: false, indexEligible: false })
  })

  it('does not fall back when a requested resource locale is missing', async () => {
    await expect(
      service.getRouteDecision({
        pageKey: 'NEWS_DETAIL',
        locale: 'fr-FR',
        resource: { collection: 'news', slug: 'factory-update' }
      })
    ).resolves.toMatchObject({
      locale: 'fr-FR',
      accessible: true,
      resourceAvailable: false,
      indexEligible: false,
      alternates: []
    })
  })

  it('derives localized detail alternates only from published versions of the same resource', async () => {
    await expect(
      service.getRouteDecision({
        pageKey: 'NEWS_DETAIL',
        locale: 'fr-FR',
        resource: { collection: 'news', slug: 'mise-a-jour' }
      })
    ).resolves.toEqual({
      pageKey: 'NEWS_DETAIL',
      locale: 'fr-FR',
      defaultLocale: 'en-US',
      activeLocales: ['en-US', 'es-ES', 'fr-FR'],
      accessible: true,
      indexable: true,
      indexEligible: true,
      resourceAvailable: true,
      canonicalResourceSlug: 'mise-a-jour',
      committedPublishVersion: 17,
      alternates: [
        { locale: 'en-US', slug: 'shared-update' },
        { locale: 'fr-FR', slug: 'mise-a-jour' }
      ]
    })
  })

  it('resolves a published historical slug without scanning the News collection', async () => {
    const fullCollectionRead = jest
      .spyOn(store, 'listPublishedResources')
      .mockRejectedValue(new Error('Historical route resolution must not scan public views'))

    await expect(
      service.withStablePublication((session) =>
        service.getRouteDecisionInSession(
          session,
          {
            pageKey: 'NEWS_DETAIL',
            locale: 'en-US',
            resource: { collection: 'news', slug: 'old-shared-update' }
          },
          { includeAlternates: false }
        )
      )
    ).resolves.toMatchObject({
      resourceAvailable: true,
      indexEligible: true,
      canonicalResourceSlug: 'shared-update',
      alternates: []
    })
    expect(fullCollectionRead).not.toHaveBeenCalled()
  })

  it('resolves Blog and News category history only within the requested locale and category namespace', async () => {
    const publishVersion = 18
    await store.commitPublication({
      mode: 'delta',
      siteId,
      expectedLocalPublishVersion: 17,
      publishVersion,
      latestSyncId: 'sync-18-categories',
      lastKnownRemotePublishVersion: publishVersion,
      exposure: {
        ...exposurePublication(),
        publishVersion,
        pages: [
          ...exposurePublication().pages,
          {
            pageKey: 'BLOG_CATEGORY',
            enabled: true,
            indexable: true,
            supportedLocales: ['en-US', 'fr-FR']
          },
          {
            pageKey: 'NEWS_CATEGORY',
            enabled: true,
            indexable: true,
            supportedLocales: ['en-US', 'fr-FR']
          }
        ]
      },
      resources: [
        resource('article-category', 'shared-category', 'surface-guides', 'en-US', {
          applies_to: 'both',
          is_visible_in_blog_archive: true,
          is_visible_in_news_archive: true,
          historical_slugs: ['shared-archive']
        }, publishVersion),
        resource('article-category', 'shared-category', 'guides-surface', 'fr-FR', {
          applies_to: 'both',
          is_visible_in_blog_archive: true,
          is_visible_in_news_archive: true,
          historical_slugs: ['archives-partagees']
        }, publishVersion),
        resource('article-category', 'blog-only-category', 'blog-guides', 'en-US', {
          applies_to: 'blog',
          is_visible_in_blog_archive: true,
          is_visible_in_news_archive: false,
          historical_slugs: ['blog-archive']
        }, publishVersion),
        resource('article-category', 'blog-only-category', 'guides-blog', 'fr-FR', {
          applies_to: 'blog',
          is_visible_in_blog_archive: true,
          is_visible_in_news_archive: false,
          historical_slugs: ['archives-blog']
        }, publishVersion),
        resource('article-category', 'news-only-category', 'company-news', 'en-US', {
          applies_to: 'news',
          is_visible_in_blog_archive: false,
          is_visible_in_news_archive: true,
          historical_slugs: ['company-archive']
        }, publishVersion),
        resource('article-category', 'unpublished-category', 'private-category', 'en-US', {
          applies_to: 'news',
          is_visible_in_news_archive: true,
          historical_slugs: ['private-category-old']
        }, publishVersion, 'unpublished'),
        resource('blog', 'blog-entry-en', 'zellige-story', 'en-US', {
          category_ids: ['shared-category', 'blog-only-category']
        }, publishVersion),
        resource('blog', 'blog-entry-fr', 'histoire-carrelage', 'fr-FR', {
          category_ids: ['shared-category', 'blog-only-category']
        }, publishVersion),
        resource('news', 'news-entry-en', 'company-update', 'en-US', {
          category_ids: ['shared-category', 'news-only-category']
        }, publishVersion),
        resource('news', 'news-entry-fr', 'actualite-groupe', 'fr-FR', {
          category_ids: ['shared-category']
        }, publishVersion)
      ],
      missingResources: []
    })

    const cases = [
      ['BLOG_CATEGORY', 'en-US', 'blog-category', 'shared-archive', 'surface-guides'],
      ['NEWS_CATEGORY', 'en-US', 'news-category', 'shared-archive', 'surface-guides'],
      ['BLOG_CATEGORY', 'fr-FR', 'blog-category', 'archives-partagees', 'guides-surface'],
      ['NEWS_CATEGORY', 'fr-FR', 'news-category', 'archives-partagees', 'guides-surface']
    ] as const

    for (const [pageKey, locale, collection, historicalSlug, canonicalSlug] of cases) {
      await expect(
        service.getRouteDecision({
          pageKey,
          locale,
          resource: { collection, slug: historicalSlug }
        })
      ).resolves.toMatchObject({
        resourceAvailable: true,
        canonicalResourceSlug: canonicalSlug,
        alternates: expect.arrayContaining([{ locale, slug: canonicalSlug }])
      })
    }

    await expect(
      service.getRouteDecision({
        pageKey: 'NEWS_CATEGORY',
        locale: 'fr-FR',
        resource: { collection: 'news-category', slug: 'archives-blog' }
      })
    ).resolves.toMatchObject({ resourceAvailable: false, alternates: [] })
    await expect(
      service.getRouteDecision({
        pageKey: 'NEWS_CATEGORY',
        locale: 'en-US',
        resource: { collection: 'news-category', slug: 'private-category-old' }
      })
    ).resolves.toMatchObject({ resourceAvailable: false, alternates: [] })
    await expect(
      service.getRouteDecision({
        pageKey: 'BLOG_CATEGORY',
        locale: 'en-US',
        resource: { collection: 'blog-category', slug: 'unknown-category' }
      })
    ).resolves.toMatchObject({ resourceAvailable: false, alternates: [] })
  })

  it('keeps Category alternates on the requested page while retaining an accessible noindex locale', async () => {
    await commitNewsCategoryPaginationPublication(store, 17, 18, 8, false)
    const categoryRoute = {
      pageKey: 'NEWS_CATEGORY',
      locale: 'en-US',
      resource: { collection: 'news-category', slug: 'company-news' },
      categoryArchive: { kind: 'category-archive', page: 2, pageSize: 8 }
    } as Parameters<SiteExposureService['getRouteDecision']>[0]

    await expect(
      service.getRouteDecision({
        ...categoryRoute,
        categoryArchive: { kind: 'category-archive', page: 1, pageSize: 8 }
      } as Parameters<SiteExposureService['getRouteDecision']>[0])
    ).resolves.toMatchObject({
      resourceAvailable: true,
      alternates: [
        { locale: 'en-US', slug: 'company-news' },
        { locale: 'fr-FR', slug: 'nouvelles-groupe' }
      ]
    })
    await expect(service.getRouteDecision(categoryRoute)).resolves.toMatchObject({
      resourceAvailable: true,
      alternates: [{ locale: 'en-US', slug: 'company-news' }]
    })
    await expect(
      service.getRouteDecision({
        ...categoryRoute,
        locale: 'fr-FR',
        resource: { collection: 'news-category', slug: 'nouvelles-groupe' }
      } as Parameters<SiteExposureService['getRouteDecision']>[0])
    ).resolves.toMatchObject({
      resourceAvailable: false,
      alternates: []
    })
    await expect(
      service.getRouteDecision({
        ...categoryRoute,
        categoryArchive: {
          kind: 'category-archive',
          page: Number.MAX_SAFE_INTEGER,
          pageSize: 8
        }
      } as Parameters<SiteExposureService['getRouteDecision']>[0])
    ).resolves.toMatchObject({
      resourceAvailable: false,
      alternates: []
    })

    await commitNewsCategoryPaginationPublication(store, 18, 19, 9, true)
    await expect(service.getRouteDecision(categoryRoute)).resolves.toMatchObject({
      resourceAvailable: true,
      alternates: [
        { locale: 'en-US', slug: 'company-news' },
        { locale: 'fr-FR', slug: 'nouvelles-groupe' }
      ]
    })
  })

  it('paginates historical-slug and alternate scans beyond the Runtime reader cap', async () => {
    const publishVersion = 18
    const fillers = Array.from({ length: 205 }, (_, index) =>
      resource(
        'news',
        `bulk-news-${index}`,
        `bulk-update-${String(index).padStart(3, '0')}`,
        'en-US',
        {},
        publishVersion
      )
    )
    await store.commitPublication({
      mode: 'delta',
      siteId,
      expectedLocalPublishVersion: 17,
      publishVersion,
      latestSyncId: 'sync-18',
      lastKnownRemotePublishVersion: publishVersion,
      exposure: { ...exposurePublication(), publishVersion },
      resources: [
        ...fillers,
        resource(
          'news',
          'late-news',
          'zz-late-update',
          'en-US',
          { historical_slugs: ['old-late-update'] },
          publishVersion
        ),
        resource('news', 'late-news', 'mise-a-jour-tardive', 'fr-FR', {}, publishVersion)
      ],
      missingResources: []
    })

    await expect(
      service.getRouteDecision({
        pageKey: 'NEWS_DETAIL',
        locale: 'en-US',
        resource: { collection: 'news', slug: 'old-late-update' }
      })
    ).resolves.toMatchObject({ resourceAvailable: true })
    await expect(
      service.getRouteDecision({
        pageKey: 'NEWS_DETAIL',
        locale: 'fr-FR',
        resource: { collection: 'news', slug: 'mise-a-jour-tardive' }
      })
    ).resolves.toMatchObject({
      alternates: [
        { locale: 'en-US', slug: 'zz-late-update' },
        { locale: 'fr-FR', slug: 'mise-a-jour-tardive' }
      ]
    })
  })

  it('drains Unicode cursors in the same UTF-8 BINARY order as the SQLite store', async () => {
    const nextPublishVersion = 18
    const sqliteEarlier = `unicode-\uE000`
    const sqliteLater = `unicode-\u{10000}`
    const asciiFillers = Array.from({ length: 199 }, (_, index) =>
      resource(
        'news',
        `ascii-news-${index}`,
        `ascii-${String(index).padStart(3, '0')}`,
        'en-US',
        {},
        nextPublishVersion
      )
    )
    const binaryBetween = Array.from({ length: 199 }, (_, index) =>
      resource(
        'news',
        `binary-news-${index}`,
        `unicode-${String.fromCodePoint(0xe001 + index)}`,
        'en-US',
        {},
        nextPublishVersion
      )
    )
    await store.commitPublication({
      mode: 'snapshot',
      siteId,
      expectedLocalPublishVersion: 17,
      publishVersion: nextPublishVersion,
      latestSyncId: 'sync-18-unicode-cursors',
      lastKnownRemotePublishVersion: nextPublishVersion,
      exposure: { ...exposurePublication(), publishVersion: nextPublishVersion },
      resources: [
        ...asciiFillers,
        resource('news', 'sqlite-earlier', sqliteEarlier, 'en-US', {}, nextPublishVersion),
        ...binaryBetween,
        resource('news', 'sqlite-later', sqliteLater, 'en-US', {}, nextPublishVersion),
        resource(
          'news',
          'sqlite-final',
          `unicode-\u{10001}`,
          'en-US',
          {},
          nextPublishVersion
        )
      ],
      missingResources: []
    })

    const resources = await listAllPublishedResources(
      new PublicViewsReader(store, siteId).news,
      'en-US'
    )

    expect(resources).toHaveLength(401)
    expect(resources[199]?.slug).toBe(sqliteEarlier)
    expect(resources[399]?.slug).toBe(sqliteLater)
  })

  it.each([
    ['non-string', [42]],
    ['empty', ['']],
    ['repeated', ['cursor-a', 'cursor-b', 'cursor-a']],
    ['equal', ['cursor-b', 'cursor-b']],
    ['backward', ['cursor-b', 'cursor-a']]
  ] as Array<[string, unknown[]]>)(
    'fails closed with 503 for a %s Runtime cursor',
    async (_label, cursors) => {
      let readIndex = 0
      const list = jest.fn(async () => ({
        items: [],
        nextCursor: readIndex < cursors.length ? cursors[readIndex++] : null
      }))
      const reader: PublicResourceReader = {
        list: list as PublicResourceReader['list'],
        getBySlug: async () => null
      }

      await expect(listAllPublishedResources(reader, 'en-US')).rejects.toMatchObject({
        status: 503
      })
    }
  )

  it('keeps an empty localized list accessible but noindex and omits it from alternates', async () => {
    await expect(
      service.getRouteDecision({
        pageKey: 'NEWS_LIST',
        locale: 'es-ES',
        resource: { collection: 'news' }
      })
    ).resolves.toMatchObject({
      locale: 'es-ES',
      accessible: true,
      resourceAvailable: true,
      indexEligible: false,
      alternates: [{ locale: 'en-US' }, { locale: 'fr-FR' }]
    })
  })

  it('keeps a published noindex resource accessible while excluding it from index eligibility', async () => {
    await expect(
      service.getRouteDecision({
        pageKey: 'NEWS_DETAIL',
        locale: 'en-US',
        resource: { collection: 'news', slug: 'private-update' }
      })
    ).resolves.toMatchObject({
      accessible: true,
      resourceAvailable: true,
      indexable: true,
      indexEligible: false,
      alternates: []
    })
  })

  it('keeps locale lists isolated to actually published localized resources', async () => {
    const french = await service.listPublishedResources('news', 'fr-FR')
    expect(french.items.map((item) => item.slug)).toEqual(['mise-a-jour'])
    expect(french.items.every((item) => item.locale === 'fr-FR')).toBe(true)
  })

  it('continues reading the previous complete publication after a failed replacement', async () => {
    await expect(
      store.commitPublication({
        mode: 'delta',
        siteId,
        expectedLocalPublishVersion: 999,
        publishVersion: 1000,
        latestSyncId: 'invalid-sync',
        lastKnownRemotePublishVersion: 1000,
        exposure: { ...exposurePublication(), publishVersion: 1000 },
        resources: [],
        missingResources: []
      })
    ).rejects.toThrow(/PUBLISH_VERSION_CONFLICT/)

    await expect(service.getCommittedPublication()).resolves.toMatchObject({
      publishVersion: 17,
      defaultLocale: 'en-US'
    })
  })

  it('retries a route decision against the real store and returns only publication v2', async () => {
    const versioned = createRealStoreTransitionService(store, new Map([
      [1, () => commitNewsPublication(store, 17, 18, 'shared-update-v2', 'mise-a-jour-v2')]
    ]))

    await expect(
      versioned.service.getRouteDecision({
        pageKey: 'NEWS_DETAIL',
        locale: 'en-US',
        resource: { collection: 'news', slug: 'old-shared-update' }
      })
    ).resolves.toMatchObject({
      canonicalResourceSlug: 'shared-update-v2',
      committedPublishVersion: 18,
      alternates: [
        { locale: 'en-US', slug: 'shared-update-v2' },
        { locale: 'fr-FR', slug: 'mise-a-jour-v2' }
      ]
    })
    await expect(store.getSiteExposurePublication(siteId)).resolves.toMatchObject({
      publishVersion: 18
    })
    await expect(
      new PublicViewsReader(store, siteId).news.getBySlug('shared-update-v2', 'en-US')
    ).resolves.toMatchObject({ publishVersion: 18 })
  })

  it('fails a real-store route decision when both bounded attempts change publication', async () => {
    const versioned = createRealStoreTransitionService(store, new Map([
      [1, () => commitNewsPublication(store, 17, 18, 'shared-update-v2', 'mise-a-jour-v2')],
      [3, () => commitNewsPublication(store, 18, 19, 'shared-update-v3', 'mise-a-jour-v3')]
    ]))

    await expect(
      versioned.service.getRouteDecision({
        pageKey: 'NEWS_DETAIL',
        locale: 'en-US',
        resource: { collection: 'news', slug: 'old-shared-update' }
      })
    ).rejects.toMatchObject({ status: 503 })
    await expect(store.getSiteExposurePublication(siteId)).resolves.toMatchObject({
      publishVersion: 19
    })
    await expect(
      new PublicViewsReader(store, siteId).news.getBySlug('shared-update-v3', 'en-US')
    ).resolves.toMatchObject({ publishVersion: 19 })
  })

  it('retries a route decision when publication changes during the read', async () => {
    const firstPublication = { ...exposurePublication(), publishVersion: 1 }
    const secondPublication = { ...exposurePublication(), publishVersion: 2 }
    const getPublication = jest
      .fn()
      .mockResolvedValueOnce(firstPublication)
      .mockResolvedValue(secondPublication)
    const versionedService = new SiteExposureService({
      getRuntime: () => ({
        publicViews: {
          exposure: {
            getPublication,
            getPagePolicy: async (pageKey: string, locale: string) => ({
              pageKey,
              locale,
              enabled: true,
              indexable: true,
              localeActive: true,
              localeSupported: true,
              accessible: true,
              indexEligible: true,
              supportedLocales: secondPublication.activeLocales,
              committedPublishVersion: 2
            })
          }
        }
      })
    } as never)

    await expect(
      versionedService.getRouteDecision({ pageKey: 'NEWS_LIST', locale: 'en-US' })
    ).resolves.toMatchObject({ committedPublishVersion: 2 })
  })

  it('fails closed when publication changes during both bounded read attempts', async () => {
    const publications = [1, 2, 2, 3].map((publishVersion) => ({
      ...exposurePublication(),
      publishVersion
    }))
    const getPublication = jest
      .fn()
      .mockResolvedValueOnce(publications[0])
      .mockResolvedValueOnce(publications[1])
      .mockResolvedValueOnce(publications[2])
      .mockResolvedValue(publications[3])
    const versionedService = new SiteExposureService({
      getRuntime: () => ({
        publicViews: {
          exposure: {
            getPublication,
            getPagePolicy: async (pageKey: string, locale: string) => ({
              pageKey,
              locale,
              enabled: true,
              indexable: true,
              localeActive: true,
              localeSupported: true,
              accessible: true,
              indexEligible: true,
              supportedLocales: ['en-US'],
              committedPublishVersion: 3
            })
          }
        }
      })
    } as never)

    await expect(
      versionedService.getRouteDecision({ pageKey: 'NEWS_LIST', locale: 'en-US' })
    ).rejects.toThrow('Committed site exposure publication changed during read')
  })
})

// exposurePublication provides one complete committed governance version for site integration tests.
function exposurePublication(): SiteExposurePublication {
  return {
    siteId,
    publishVersion: 17,
    defaultLocale: 'en-US',
    activeLocales: ['en-US', 'es-ES', 'fr-FR'],
    pages: [
      {
        pageKey: 'ABOUT',
        enabled: false,
        indexable: false,
        supportedLocales: ['en-US']
      },
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
        supportedLocales: ['en-US', 'es-ES', 'fr-FR']
      }
    ],
    publishedAt
  }
}

// resource creates a complete published row without introducing any cross-locale fallback data.
function resource(
  resourceType: ResourceType,
  resourceId: string,
  slug: string,
  locale: string,
  payload: Record<string, unknown> = {},
  publishVersion = 17,
  status: StoredPublishedResource['status'] = 'published'
): StoredPublishedResource {
  return {
    siteId,
    resourceType,
    resourceId,
    slug,
    locale,
    status,
    publishVersion,
    payloadJson: JSON.stringify(payload),
    updatedAt: publishedAt
  }
}

// commitNewsCategoryPaginationPublication installs localized category memberships around one page-two threshold.
async function commitNewsCategoryPaginationPublication(
  store: NodeSqlitePublishedStore,
  expectedPublishVersion: number,
  publishVersion: number,
  frenchItemCount: number,
  frenchCategoryNoindex: boolean
): Promise<void> {
  const categoryPayload = (locale: 'en-US' | 'fr-FR') => ({
    applies_to: 'news',
    is_visible_in_blog_archive: false,
    is_visible_in_news_archive: true,
    ...(locale === 'fr-FR' && frenchCategoryNoindex ? { seo: { noindex: true } } : {})
  })
  const newsEntries = (locale: 'en-US' | 'fr-FR', count: number) =>
    Array.from({ length: count }, (_, index) =>
      resource(
        'news',
        `pagination-news-${locale}-${index}`,
        `pagination-news-${locale.toLowerCase()}-${index}`,
        locale,
        { category_ids: ['news-pagination-category'] },
        publishVersion
      )
    )
  await store.commitPublication({
    mode: 'delta',
    siteId,
    expectedLocalPublishVersion: expectedPublishVersion,
    publishVersion,
    latestSyncId: `sync-${publishVersion}-category-pagination`,
    lastKnownRemotePublishVersion: publishVersion,
    exposure: {
      ...exposurePublication(),
      publishVersion,
      pages: [
        ...exposurePublication().pages,
        {
          pageKey: 'NEWS_CATEGORY',
          enabled: true,
          indexable: true,
          supportedLocales: ['en-US', 'fr-FR']
        }
      ]
    },
    resources: [
      resource(
        'article-category',
        'news-pagination-category',
        'company-news',
        'en-US',
        categoryPayload('en-US'),
        publishVersion
      ),
      resource(
        'article-category',
        'news-pagination-category',
        'nouvelles-groupe',
        'fr-FR',
        categoryPayload('fr-FR'),
        publishVersion
      ),
      ...newsEntries('en-US', 9),
      ...newsEntries('fr-FR', frenchItemCount)
    ],
    missingResources: []
  })
}

// createRealStoreTransitionService wraps only publication-read timing while all policy and resource values come from SQLite.
function createRealStoreTransitionService(
  store: NodeSqlitePublishedStore,
  transitions: Map<number, () => Promise<void>>
): { service: SiteExposureService } {
  const realPublicViews = new PublicViewsReader(store, siteId)
  let publicationReadCount = 0
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
            publicationReadCount += 1
            await transitions.get(publicationReadCount)?.()
            return publication
          },
          getPagePolicy: realPublicViews.exposure.getPagePolicy.bind(realPublicViews.exposure)
        }
      }
    })
  }
  return {
    service: new SiteExposureService(runtimeService as never)
  }
}

// commitNewsPublication atomically installs one complete real-store version for bounded route-decision attempts.
async function commitNewsPublication(
  store: NodeSqlitePublishedStore,
  expectedPublishVersion: number,
  nextPublishVersion: number,
  englishSlug: string,
  frenchSlug: string
): Promise<void> {
  await store.commitPublication({
    mode: 'snapshot',
    siteId,
    expectedLocalPublishVersion: expectedPublishVersion,
    publishVersion: nextPublishVersion,
    latestSyncId: `sync-${nextPublishVersion}`,
    lastKnownRemotePublishVersion: nextPublishVersion,
    exposure: { ...exposurePublication(), publishVersion: nextPublishVersion },
    resources: [
      resource(
        'news',
        'news-2',
        englishSlug,
        'en-US',
        { historical_slugs: ['old-shared-update'] },
        nextPublishVersion
      ),
      resource('news', 'news-2', frenchSlug, 'fr-FR', {}, nextPublishVersion)
    ],
    missingResources: []
  })
}
