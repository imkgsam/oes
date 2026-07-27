import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

import { normalizePublicReadFailure } from '../storefront/types/public-read-error'
import { buildSitemapEntries } from '../storefront/server/utils/sitemap-policy'
import { resolveMeilongPublicRoute } from '../storefront/types/site-route-policy'
import type { SeoRouteIndex } from '../storefront/types/public-view'

const root = resolve(__dirname, '..', 'storefront')

describe('Meilong Storefront Runtime boundary', () => {
  it.each([
    [{ statusCode: 400 }, 400],
    [{ response: { status: 400 } }, 400],
    [{ statusCode: 404 }, 404],
    [{ response: { status: 404 } }, 404],
    [{ statusCode: 500 }, 503],
    [new Error('connect ECONNREFUSED'), 503]
  ])('normalizes public read failure %p to %s', (failure, expectedStatus) => {
    expect(normalizePublicReadFailure(failure).statusCode).toBe(expectedStatus)
  })

  it('excludes noindex pages and keeps sitemap entries on one committed version', () => {
    const index: SeoRouteIndex = {
      publicBaseUrl: 'https://meilong-ceramics.com',
      defaultLocale: 'en-US',
      activeLocales: ['en-US'],
      committedPublishVersion: 31,
      publishedAt: '2026-07-20T10:00:00.000Z',
      pages: [
        { pageKey: 'HOME', locale: 'en-US', indexEligible: true },
        { pageKey: 'ABOUT', locale: 'en-US', indexEligible: false },
        { pageKey: 'NEWS_LIST', locale: 'en-US', indexEligible: true },
        { pageKey: 'COLLECTION_LIST', locale: 'en-US', indexEligible: true },
        { pageKey: 'PRODUCT_LIST', locale: 'en-US', indexEligible: true },
        { pageKey: 'CATEGORY_LIST', locale: 'en-US', indexEligible: true }
      ],
      routes: [
        {
          resourceType: 'news',
          pageKey: 'NEWS_DETAIL',
          locale: 'en-US',
          slug: 'factory-update',
          path: '/news/factory-update',
          canonicalUrl: 'https://meilong-ceramics.com/news/factory-update',
          updatedAt: '2026-07-20T09:00:00.000Z',
          committedPublishVersion: 31
        }
      ]
    }

    expect(buildSitemapEntries(index)).toEqual([
      {
        canonicalUrl: 'https://meilong-ceramics.com/',
        updatedAt: '2026-07-20T10:00:00.000Z'
      },
      {
        canonicalUrl: 'https://meilong-ceramics.com/news',
        updatedAt: '2026-07-20T10:00:00.000Z'
      },
      {
        canonicalUrl: 'https://meilong-ceramics.com/product/collections',
        updatedAt: '2026-07-20T10:00:00.000Z'
      },
      {
        canonicalUrl: 'https://meilong-ceramics.com/news/factory-update',
        updatedAt: '2026-07-20T09:00:00.000Z'
      }
    ])
  })

  it('fails sitemap generation when a dynamic route is from a different publication version', () => {
    const index = {
      publicBaseUrl: 'https://meilong-ceramics.com',
      defaultLocale: 'en-US',
      activeLocales: ['en-US'],
      committedPublishVersion: 31,
      publishedAt: '2026-07-20T10:00:00.000Z',
      pages: [],
      routes: [
        {
          resourceType: 'news',
          pageKey: 'NEWS_DETAIL',
          locale: 'en-US',
          slug: 'stale',
          path: '/news/stale',
          canonicalUrl: 'https://meilong-ceramics.com/news/stale',
          updatedAt: '2026-07-20T09:00:00.000Z',
          committedPublishVersion: 30
        }
      ]
    } as SeoRouteIndex

    expect(() => buildSitemapEntries(index)).toThrow(/committed publication version/i)
  })

  it('emits only committed indexable Inspiration Category canonicals without exposing Collection detail', () => {
    const inventoryPath = resolve(root, 'data', 'inspiration-category-inventory.ts')
    expect(existsSync(inventoryPath)).toBe(true)
    const inventory = require(inventoryPath) as {
      INSPIRATION_CATEGORY_INVENTORY: ReadonlyArray<{ slug: string }>
      inspirationCategoryPath: (slug: string) => string
    }
    const index: SeoRouteIndex = {
      publicBaseUrl: 'https://meilong-ceramics.com',
      defaultLocale: 'en-US',
      activeLocales: ['en-US', 'fr-FR'],
      committedPublishVersion: 31,
      publishedAt: '2026-07-20T10:00:00.000Z',
      pages: [
        { pageKey: 'INSPIRATION_CATEGORY', locale: 'en-US', indexEligible: true },
        { pageKey: 'INSPIRATION_CATEGORY', locale: 'fr-FR', indexEligible: false },
        { pageKey: 'COLLECTION_DETAIL', locale: 'en-US', indexEligible: true }
      ],
      routes: []
    }

    const paths = inventory.INSPIRATION_CATEGORY_INVENTORY.map(({ slug }) =>
      inventory.inspirationCategoryPath(slug)
    )
    expect(buildSitemapEntries(index)).toEqual(
      paths.map((path) => ({
        canonicalUrl: `https://meilong-ceramics.com${path}`,
        updatedAt: '2026-07-20T10:00:00.000Z'
      }))
    )
    for (const path of paths) {
      expect(resolveMeilongPublicRoute(path)).toMatchObject({
        kind: 'governed',
        pageKey: 'INSPIRATION_CATEGORY',
        pathWithoutLocale: path
      })
    }

    const sitemapPolicy = readFileSync(
      resolve(root, 'server', 'utils', 'sitemap-policy.ts'),
      'utf8'
    )
    const fixture = readFileSync(
      resolve(root, 'data', 'westelm-kids-reference.ts'),
      'utf8'
    )
    const categoryPage = readFileSync(
      resolve(root, 'pages', 'inspirations', 'category', '[slug].vue'),
      'utf8'
    )
    const archive = readFileSync(resolve(root, 'components', 'InspirationArchivePage.vue'), 'utf8')
    const header = readFileSync(
      resolve(root, 'components', 'home', 'HomeReplicaHeader.vue'),
      'utf8'
    )
    expect(sitemapPolicy).toContain("from '../../data/inspiration-category-inventory'")
    expect(sitemapPolicy).toContain('INSPIRATION_CATEGORY_INVENTORY.map')
    expect(sitemapPolicy).not.toMatch(/\/inspirations\/category\/(?:pets|kids|tetro)/)
    expect(fixture).toContain("from './inspiration-category-inventory'")
    expect(fixture).not.toContain('export const inspirationCategorySlugs')
    expect(fixture).not.toContain('export const inspirationCategories')
    expect(categoryPage).toContain("from '~/data/inspiration-category-inventory'")
    expect(categoryPage).toContain('isInspirationCategorySlug(rawCategorySlug)')
    expect(archive).toContain("from '~/data/inspiration-category-inventory'")
    expect(archive).toContain('inspirationCategoryPath(selectedFilter.value)')
    expect(archive).toContain('const activeCategoryLabel = computed(')
    expect(archive).toMatch(
      /INSPIRATION_FILTER_INVENTORY\.find\([\s\S]*?selectedFilter\.value[\s\S]*?\.label/
    )
    const categoryDetails = archive.slice(
      archive.indexOf('const categoryDetails:'),
      archive.indexOf('\n\nconst runtimeConfig')
    )
    expect(categoryDetails).not.toMatch(/\blabel:/)
    expect(header).toContain("from '~/data/inspiration-category-inventory'")
  })

  it('keeps request-time SSR behind the local Site Runtime public-safe API', () => {
    const runtimeProxy = readFileSync(resolve(root, 'server', 'utils', 'site-runtime.ts'), 'utf8')
    const routeProxy = readFileSync(
      resolve(root, 'server', 'api', 'public', 'site-exposure', 'route-decision.get.ts'),
      'utf8'
    )
    const middleware = readFileSync(resolve(root, 'middleware', 'site-exposure.global.ts'), 'utf8')

    expect(routeProxy).toContain("'/api/public/site-exposure/route-decision'")
    expect(routeProxy).toContain('fetchSiteRuntime')
    expect(middleware).toContain('/api/public/site-exposure/route-decision')
    expect(middleware).toContain('decision.publicBaseUrl')
    expect(middleware).not.toContain('useRuntimeConfig')
    expect(`${runtimeProxy}\n${routeProxy}\n${middleware}`).not.toMatch(
      /OES_SITE_CREDENTIAL|oesBaseUrl|site-service|sqlite|published_resources/i
    )
  })

  // Keeps Phase A acceptance on one explicit runner and removes the obsolete live-sync truth source.
  it('recognizes only the Phase A locale-governance acceptance entry point', () => {
    const siteRoot = resolve(root, '..')
    const oldRunner = resolve(siteRoot, 'scripts', 'verify-live-sync-display.ts')
    const phaseARunner = resolve(
      siteRoot,
      'scripts',
      'verify-locale-governance-acceptance.ts'
    )
    const packageJson = JSON.parse(
      readFileSync(resolve(siteRoot, 'package.json'), 'utf8')
    ) as { scripts?: Record<string, string> }

    expect(existsSync(oldRunner)).toBe(false)
    expect(existsSync(phaseARunner)).toBe(true)
    expect(packageJson.scripts?.['test:live-sync']).toBeUndefined()
    expect(packageJson.scripts?.['test:acceptance:locale-governance']).toContain(
      'verify-locale-governance-acceptance.ts'
    )

    const phaseASource = readFileSync(phaseARunner, 'utf8')
    expect(phaseASource).not.toContain('/api/public/topics/')
    expect(phaseASource).toContain("status: 'phase-a-completed'")
    expect(phaseASource).toContain('unifiedAcceptanceClosed: false')
  })

  it('throws terminal namespace 404 before creating a Runtime route-decision fetch', () => {
    const middleware = readFileSync(resolve(root, 'middleware', 'site-exposure.global.ts'), 'utf8')
    const terminalCheck = middleware.indexOf('isMeilongTerminalNotFoundRoute(route)')
    const requestFetch = middleware.indexOf('useRequestFetch()')

    expect(terminalCheck).toBeGreaterThanOrEqual(0)
    expect(requestFetch).toBeGreaterThan(terminalCheck)
    expect(middleware.slice(terminalCheck, requestFetch)).toMatch(
      /throw createError\(\{ statusCode: 404, statusMessage: 'Page not found' \}\)/
    )
    expect(middleware.slice(terminalCheck, requestFetch)).not.toContain(
      'commitSiteRouteExposure'
    )
  })

  // Keeps historical Content Category routing exclusively in the Runtime alias-index boundary.
  it('matches Category pages only by canonical slug without payload history scans', () => {
    const categoryPages = [
      resolve(root, 'pages', 'blogs', 'categories', '[slug].vue'),
      resolve(root, 'pages', 'news', 'categories', '[slug].vue'),
      resolve(root, 'pages', '[locale]', 'blogs', 'categories', '[slug].vue'),
      resolve(root, 'pages', '[locale]', 'news', 'categories', '[slug].vue')
    ].map((path) => readFileSync(path, 'utf8'))

    for (const source of categoryPages) {
      expect(source).toContain(
        'categoryItems.value.find((category) => category.slug === categorySlug)'
      )
      expect(source).not.toContain('resolveArticleCategory')
      expect(source).not.toContain('historical_slugs')
    }

    const publishedResource = readFileSync(
      resolve(root, 'composables', 'usePublishedResource.ts'),
      'utf8'
    )
    expect(publishedResource).not.toContain('resolveArticleCategory')
    expect(publishedResource).not.toContain('categoryHistoricalSlugs')
    expect(publishedResource).not.toContain('payload.historical_slugs')
  })

  it('keeps Runtime SEO filtering aligned with the Storefront terminal content-detail slugs', () => {
    const routePolicy = readFileSync(resolve(root, 'types', 'site-route-policy.ts'), 'utf8')
    const runtimeSeo = readFileSync(
      resolve(root, '..', 'runtime', 'src', 'modules', 'seo', 'seo-route-index.service.ts'),
      'utf8'
    )
    const runtimeArchive = readFileSync(
      resolve(root, '..', 'runtime', 'src', 'modules', 'public-data', 'content-archive.service.ts'),
      'utf8'
    )
    const runtimePolicyPath = resolve(
      root,
      '..',
      'runtime',
      'src',
      'modules',
      'site-exposure',
      'content-detail-slug-policy.ts'
    )
    expect(existsSync(runtimePolicyPath)).toBe(true)
    if (!existsSync(runtimePolicyPath)) {
      return
    }
    const runtimePolicy = readFileSync(runtimePolicyPath, 'utf8')
    const storefrontSlugs = terminalContentDetailSlugs(routePolicy)
    const runtimeSlugs = terminalContentDetailSlugs(runtimePolicy)

    expect(storefrontSlugs).toEqual(['category', 'topic', 'categories'])
    expect(runtimeSlugs).toEqual(storefrontSlugs)
    expect(runtimeSeo).toContain('isRoutableContentDetailSlug')
    expect(runtimeArchive).toContain('isRoutableContentDetailSlug')
  })

  it('keeps canonical query normalization in route policy while preserving redirect queries', () => {
    const middleware = readFileSync(resolve(root, 'middleware', 'site-exposure.global.ts'), 'utf8')

    expect(middleware).toContain('query: to.query')
    expect(middleware).toContain('requestSuffix(to.fullPath, to.path)')
    expect(middleware).not.toContain('hasNonCanonicalQuery')
  })

  // Keeps the reactive route head entry owned by the root app rather than a route-scoped middleware lifecycle.
  it('installs the committed exposure head owner only from the root app', () => {
    const app = readFileSync(resolve(root, 'app.vue'), 'utf8')
    const middleware = readFileSync(resolve(root, 'middleware', 'site-exposure.global.ts'), 'utf8')

    expect(app).toContain('useSiteRouteHead()')
    expect(middleware).not.toContain('useSiteRouteHead()')
  })

  // Keeps route governance on Nuxt's Unhead integration instead of owning a second DOM client lifecycle.
  it('does not directly depend on the Unhead client package for route governance', () => {
    const composable = readFileSync(
      resolve(root, 'composables', 'useSiteRouteExposure.ts'),
      'utf8'
    )
    const storefrontPackage = JSON.parse(
      readFileSync(resolve(root, 'package.json'), 'utf8')
    ) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }

    expect(composable).not.toContain("from '@unhead/vue/client'")
    expect(storefrontPackage.dependencies?.['@unhead/vue']).toBeUndefined()
    expect(storefrontPackage.devDependencies?.['@unhead/vue']).toBeUndefined()
  })

  // Requires the Storefront to provide the Vite host used by its direct Tailwind Vite plugin.
  it('declares the Nuxt-compatible Vite host used by the Tailwind plugin', () => {
    const storefrontPackage = JSON.parse(
      readFileSync(resolve(root, 'package.json'), 'utf8')
    ) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }

    expect(storefrontPackage.dependencies?.['@tailwindcss/vite']).toBe('^4.3.1')
    expect(storefrontPackage.devDependencies?.vite).toBe('^7.3.5')
  })

  // Keeps the direct Vite host and Tailwind plugin peer on the Nuxt builder's Vite 7 type graph.
  it('binds the Tailwind plugin lock peer to the Storefront Vite 7 host', () => {
    const lockfile = readFileSync(resolve(root, '..', '..', '..', '..', 'pnpm-lock.yaml'), 'utf8')
    const importer = readLockImporter(
      lockfile,
      'src/site-runtime/meilong-ceramics-site/storefront'
    )
    const devDependencies = importer.match(/\n    devDependencies:\n([\s\S]*)$/)?.[1]
    const directVite = devDependencies?.match(
      /(?:^|\n)      vite:\n        specifier: ([^\n]+)\n        version: ([^(\n]+)/
    )
    const tailwindVite = importer.match(
      /'@tailwindcss\/vite':\n        specifier: \^4\.3\.1\n        version: 4\.3\.1\(vite@([^(\n]+)/
    )

    expect({
      directSpecifier: directVite?.[1],
      directVersion: directVite?.[2],
      tailwindPeerVersion: tailwindVite?.[1]
    }).toEqual({
      directSpecifier: '^7.3.5',
      directVersion: '7.3.5',
      tailwindPeerVersion: '7.3.5'
    })
  })

  // Keeps one reactive root head owner behind Nuxt's initial hydration barrier and navigation lifecycle.
  it('delegates committed route head rendering to the Nuxt-owned lifecycle', () => {
    const app = readFileSync(resolve(root, 'app.vue'), 'utf8')
    const composable = readFileSync(
      resolve(root, 'composables', 'useSiteRouteExposure.ts'),
      'utf8'
    )
    const middleware = readFileSync(resolve(root, 'middleware', 'site-exposure.global.ts'), 'utf8')

    expect(app).toContain('useSiteRouteHead()')
    expect(composable).toContain('useHead(() => buildSiteRouteHead(exposure.value))')
    expect(composable).not.toContain('renderDOMHead')
    expect(composable).not.toContain('entry.patch(')
    expect(composable).not.toContain('commitInProgress')
    expect(composable).not.toContain('dom:beforeRender')
    expect(composable).not.toContain('context.shouldRender = true')
    expect(composable).not.toContain('Promise<void>')
    expect(composable).toContain('const routeHeadOwners = new WeakMap')
    expect(composable).toContain('clientReady')
    expect(composable).toContain('pendingPresentation')
    expect(composable).toContain('latestExposureSequence')
    expect(composable).toContain('onNuxtReady(() => {')
    expect(composable).not.toContain('app:suspense:resolve')
    expect(composable).toContain('ownerState.pendingPresentation = presentation')
    expect(composable).toContain('ownerState.pendingPresentation = undefined')
    expect(composable).toContain('exposure.value = pendingPresentation')
    expect(middleware).not.toContain('commitSiteRouteExposure(null')
    expect(middleware.match(/commitSiteRouteExposure\(/g)).toHaveLength(1)
    expect(middleware).toContain('const exposureSequence = beginSiteRouteExposure()')
    expect(middleware).toContain('commitSiteRouteExposure(presentation, exposureSequence)')
    expect(middleware).not.toContain('waitForOwner')
    expect(middleware).not.toContain('app:suspense:resolve')
    expect(middleware).not.toContain('waitForInitialHydration')
    expect(middleware).not.toMatch(/await\s+commitSiteRouteExposure/)
    expect(middleware).not.toContain('nextTick')
    expect(middleware.indexOf('buildMeilongRoutePresentation({')).toBeLessThan(
      middleware.indexOf('commitSiteRouteExposure(presentation, exposureSequence)')
    )
  })

  it('does not swallow Runtime failures as null in public data composables', () => {
    const composable = readFileSync(resolve(root, 'composables', 'usePublishedResource.ts'), 'utf8')
    expect(composable).not.toContain('.catch(() => null)')
    expect(composable).toContain('normalizePublicReadFailure')
  })

  it('uses bounded application archive pages instead of truncating Blog and News in Storefront', () => {
    const blogPage = readFileSync(resolve(root, 'pages', 'blogs', 'index.vue'), 'utf8')
    const blogCategoryPage = readFileSync(
      resolve(root, 'pages', 'blogs', 'categories', '[slug].vue'),
      'utf8'
    )
    const localizedBlogCategoryPage = readFileSync(
      resolve(root, 'pages', '[locale]', 'blogs', 'categories', '[slug].vue'),
      'utf8'
    )
    const newsPage = readFileSync(resolve(root, 'pages', 'news', 'index.vue'), 'utf8')
    const localizedNewsPage = readFileSync(
      resolve(root, 'pages', '[locale]', 'news', 'index.vue'),
      'utf8'
    )
    const newsArchive = readFileSync(resolve(root, 'components', 'NewsArchive.vue'), 'utf8')
    const newsCategoryPage = readFileSync(
      resolve(root, 'pages', 'news', 'categories', '[slug].vue'),
      'utf8'
    )
    const localizedNewsCategoryPage = readFileSync(
      resolve(root, 'pages', '[locale]', 'news', 'categories', '[slug].vue'),
      'utf8'
    )

    expect(blogPage).toContain("useContentArchivePage('blog'")
    expect(blogPage).not.toContain("usePublishedList('blog')")
    for (const source of [blogPage, blogCategoryPage, localizedBlogCategoryPage]) {
      expect(source).toContain('buildArchiveRouteKey(route.path, route.query')
      expect(source).not.toContain('route.fullPath')
    }
    expect(newsPage).toContain("useContentArchivePage('news'")
    expect(localizedNewsPage).toContain("useContentArchivePage('news'")
    expect(newsCategoryPage).toContain('fetchArticleCategoryArchivePage(')
    expect(localizedNewsCategoryPage).toContain('fetchArticleCategoryArchivePage(')
    expect(newsCategoryPage).not.toContain('matchesNewsDateFilter')
    expect(localizedNewsCategoryPage).not.toContain('matchesNewsDateFilter')
    for (const source of [newsPage, localizedNewsPage]) {
      expect(source).toContain('parseNewsRootArchiveRouteState(route.query)')
      expect(source).toContain(
        'buildNewsRootArchiveRouteKey(route.path, newsArchiveRouteState.value)'
      )
      expect(source).not.toContain('parseNewsCategoryArchiveRouteState')
      expect(source).not.toContain('buildNewsCategoryArchiveRouteKey')
      expect(source).toContain("useContentArchivePage('news', 1,")
      expect(source).toContain(':session-key="newsArchiveSessionKey"')
      expect(source).not.toContain('route.fullPath')
    }
    for (const source of [newsCategoryPage, localizedNewsCategoryPage]) {
      expect(source).toContain('parseNewsCategoryArchiveRouteState(route.query)')
      expect(source).toContain(
        'buildNewsCategoryArchiveRouteKey(route.path, newsArchiveRouteState.value)'
      )
      expect(source).not.toContain('parseNewsRootArchiveRouteState')
      expect(source).not.toContain('buildNewsRootArchiveRouteKey')
      expect(source).toContain('const page = newsArchiveRouteState.value.page')
      expect(source).toContain(':session-key="newsArchiveSessionKey"')
      expect(source).not.toContain('route.fullPath')
    }
    expect(newsArchive).toContain('loadPage?:')
    expect(newsArchive).toContain('committedPublishVersion')
    expect(newsArchive).toContain('await props.loadPage(')
    expect(newsArchive).toMatch(/committedPublishVersion[\s\S]*!==[\s\S]*committedPublishVersion/)
  })

  it('derives archive content keys from the route policy canonical page parser', () => {
    const source = readFileSync(resolve(root, 'utils', 'archive-route-key.ts'), 'utf8')

    expect(source).toContain("import { canonicalPageNumber }")
    expect(source).toContain('canonicalPageNumber(value) ?? 1')
    expect(source).not.toMatch(/function normalizeArchivePage[\s\S]*?\^\\d\+\$/)
  })

  it('uses one Storefront Category pagination policy for thresholds and actual requests', () => {
    const policyPath = resolve(root, 'utils', 'content-category-pagination-policy.ts')
    expect(existsSync(policyPath)).toBe(true)
    const policy = require(policyPath) as {
      BLOG_CATEGORY_PAGE_SIZE: number
      NEWS_CATEGORY_PAGE_SIZE: number
    }
    expect(policy).toMatchObject({
      BLOG_CATEGORY_PAGE_SIZE: 9,
      NEWS_CATEGORY_PAGE_SIZE: 8
    })

    const routePolicy = readFileSync(resolve(root, 'types', 'site-route-policy.ts'), 'utf8')
    expect(routePolicy).toContain("from '../utils/content-category-pagination-policy'")
    expect(routePolicy).not.toMatch(/\['BLOG_CATEGORY',\s*9\]/)
    expect(routePolicy).not.toMatch(/\['NEWS_CATEGORY',\s*8\]/)

    const blogCategoryPages = [
      resolve(root, 'pages', 'blogs', 'categories', '[slug].vue'),
      resolve(root, 'pages', '[locale]', 'blogs', 'categories', '[slug].vue')
    ].map((path) => readFileSync(path, 'utf8'))
    for (const source of blogCategoryPages) {
      expect(source).toContain('BLOG_CATEGORY_PAGE_SIZE')
      expect(source).not.toMatch(/pageSize:\s*9/)
    }

    const newsCategoryPages = [
      resolve(root, 'pages', 'news', 'categories', '[slug].vue'),
      resolve(root, 'pages', '[locale]', 'news', 'categories', '[slug].vue')
    ].map((path) => readFileSync(path, 'utf8'))
    for (const source of newsCategoryPages) {
      expect(source).toContain('NEWS_CATEGORY_PAGE_SIZE')
      expect(source).not.toContain('NEWS_ARCHIVE_PAGE_SIZE')
    }

    const newsArchivePagination = readFileSync(
      resolve(root, 'utils', 'news-archive-pagination.ts'),
      'utf8'
    )
    expect(newsArchivePagination).toContain(
      'NEWS_CATEGORY_PAGE_SIZE as NEWS_ARCHIVE_PAGE_SIZE'
    )
    expect(newsArchivePagination).not.toMatch(/NEWS_ARCHIVE_PAGE_SIZE\s*=\s*8/)
  })

  it('renders existing later Category pages instead of treating index policy as existence', () => {
    const categoryPages = [
      resolve(root, 'pages', 'blogs', 'categories', '[slug].vue'),
      resolve(root, 'pages', '[locale]', 'blogs', 'categories', '[slug].vue'),
      resolve(root, 'pages', 'news', 'categories', '[slug].vue'),
      resolve(root, 'pages', '[locale]', 'news', 'categories', '[slug].vue')
    ].map((path) => readFileSync(path, 'utf8'))

    for (const source of categoryPages) {
      expect(source).not.toContain('categoryArchive.value.indexable')
      expect(source).toContain('categoryArchive.value.pagination.pageSize')
    }
  })

  it('builds public share actions from the committed route canonical', () => {
    const blogDetail = readFileSync(resolve(root, 'components', 'BlogDetailReplica.vue'), 'utf8')
    const publishedResource = readFileSync(
      resolve(root, 'components', 'PublishedResourcePage.vue'),
      'utf8'
    )

    expect(blogDetail).toContain('const shareUrl = useSiteRouteCanonical()')
    expect(blogDetail).not.toContain('`https://meilong-ceramics.com/blogs/${slug.value}`')
    expect(publishedResource).toContain('const committedCanonical = useSiteRouteCanonical()')
    expect(publishedResource).toMatch(/const shareUrl = computed\([\s\S]*committedCanonical\.value/)
    expect(publishedResource).toContain('&url=${encodeURIComponent(shareUrl)}')
    expect(publishedResource).toContain('&body=${encodeURIComponent(shareUrl)}')
  })

  it('returns 404 for an unknown static Collection instead of rendering another Collection', () => {
    const page = readFileSync(resolve(root, 'pages', 'collections', '[collection].vue'), 'utf8')
    expect(page).not.toContain('defaultCollection')
    expect(page).toMatch(/if \(!resolvedCollection\)[\s\S]*statusCode:\s*404/)
  })

  it('uses Runtime canonical redirect paths without adding a locale prefix twice', () => {
    const localizedDetailPages = ['blogs', 'news'].map((collection) =>
      readFileSync(resolve(root, 'pages', '[locale]', collection, '[slug].vue'), 'utf8')
    )

    for (const page of localizedDetailPages) {
      expect(page).toContain('navigateTo(redirectTo, { redirectCode: 301 })')
      expect(page).not.toContain('`/${locale}${redirectTo}`')
    }
  })

  it('detects statically provable canonical head declarations across authored syntaxes', () => {
    const canonicalDeclarations = [
      "<Link rel={'canonical'} />",
      '<Link rel={`canonical`} />',
      "<Link :rel=\"'canonical'\" />",
      '<Link :rel="`canonical`" />',
      "<Link v-bind:rel=\"'canonical'\" />",
      '<Link v-bind:rel="`canonical`" />',
      '{ rel: `canonical`, href: canonicalUrl }',
      '<link rel="canonical" href="/example">',
      "{ rel: 'canonical', href: canonicalUrl }",
      '{ rel : "canonical", href: canonicalUrl }',
      "{ 'rel': 'canonical', href: canonicalUrl }",
      "<Link rel = 'canonical' href={canonicalUrl} />",
      '<link REL = "Canonical" href="/example">'
    ]
    for (const declaration of canonicalDeclarations) {
      expect(hasCanonicalHeadDeclaration(declaration)).toBe(true)
    }
  })

  it('ignores comments, ordinary strings, JSON-LD, and dynamic canonical consumers', () => {
    const canonicalConsumers = [
      '// Never add rel="canonical" here',
      '/* Never add rel="canonical" here */',
      '<!-- Never add rel="canonical" here -->',
      "const warning = 'Never add rel=\"canonical\" here'",
      'const template = `<link rel="canonical">`',
      "const serializedHead = '{\"rel\":\"canonical\"}'",
      '<Link rel={canonicalUrl} />',
      '<Link :rel="canonicalUrl" />',
      '<Link v-bind:rel="computedRel" />',
      '<Link data-rel="canonical" />',
      'const canonicalUrl = routeCanonical.value',
      'const routeCanonical = useSiteRouteCanonical()',
      "{ type: 'application/ld+json', url: canonicalUrl }"
    ]

    for (const consumer of canonicalConsumers) {
      expect(hasCanonicalHeadDeclaration(consumer)).toBe(false)
    }
  })

  it('keeps canonical, html lang, and public robots output in the single global route policy', () => {
    const canonicalOwner = resolve(root, 'composables', 'useSiteRouteExposure.ts')
    const canonicalEligibleFiles = listAuthoredStorefrontSources(root)
    const canonicalWriters = canonicalEligibleFiles.filter((file) =>
      hasCanonicalHeadDeclaration(readFileSync(file, 'utf8'))
    )
    const publishedSeo = readFileSync(resolve(root, 'composables', 'usePublishedSeo.ts'), 'utf8')
    const nuxtConfig = readFileSync(resolve(root, 'nuxt.config.ts'), 'utf8')
    const inspirationArchive = readFileSync(
      resolve(root, 'components', 'InspirationArchivePage.vue'),
      'utf8'
    )

    expect(canonicalWriters).toEqual([canonicalOwner])
    expect(inspirationArchive).toContain('const routeCanonical = useSiteRouteCanonical()')
    expect(inspirationArchive).toMatch(/url:\s*structuredDataUrl\.value/u)
    expect(publishedSeo).not.toMatch(/rel:\s*['"]canonical/)
    expect(nuxtConfig).not.toMatch(/htmlAttrs:\s*\{\s*lang:/)
    expect(nuxtConfig).not.toMatch(/\bswr\s*:/)
  })
})

// listFiles recursively collects Storefront source files without traversing generated output.
function listFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = resolve(directory, entry)
    return statSync(path).isDirectory() ? listFiles(path) : [path]
  })
}

// listAuthoredStorefrontSources walks every authored source surface while excluding dependencies, generated output, assets, and tests.
function listAuthoredStorefrontSources(directory: string): string[] {
  const excludedDirectories = new Set([
    'node_modules',
    '.nuxt',
    '.output',
    '.cache',
    '.nitro',
    '.vite',
    'dist',
    'build',
    'coverage',
    'public',
    'tests',
    'test-results',
    'generated',
    '--host'
  ])
  const pendingDirectories = [directory]
  const authoredSources: string[] = []
  while (pendingDirectories.length > 0) {
    const currentDirectory = pendingDirectories.pop()!
    for (const entry of readdirSync(currentDirectory)) {
      const path = resolve(currentDirectory, entry)
      if (statSync(path).isDirectory()) {
        if (!excludedDirectories.has(entry)) {
          pendingDirectories.push(path)
        }
        continue
      }
      if (
        /\.(?:vue|tsx?|jsx?|mjs|cjs)$/u.test(entry) &&
        !/\.(?:spec|test)\.(?:vue|tsx?|jsx?|mjs|cjs)$/u.test(entry) &&
        !/\.d\.ts$/u.test(entry) &&
        !/\.generated\./u.test(entry)
      ) {
        authoredSources.push(path)
      }
    }
  }
  return authoredSources
}

type LexicalValue = {
  end: number
  staticValue?: string
}

type MarkupTagScan = {
  end: number
  hasCanonicalDeclaration: boolean
}

// hasCanonicalHeadDeclaration scans code and markup tokens while keeping comments and unrelated literals opaque.
function hasCanonicalHeadDeclaration(source: string): boolean {
  let index = 0
  let previousToken: string | undefined
  while (index < source.length) {
    const tokenStart = skipLexicalTrivia(source, index)
    if (tokenStart !== index) {
      index = tokenStart
      continue
    }
    const character = source[index]!
    if (character === '<') {
      const tag = scanMarkupTag(source, index)
      if (tag) {
        if (tag.hasCanonicalDeclaration) {
          return true
        }
        index = tag.end
        previousToken = '>'
        continue
      }
    }
    if (isQuote(character)) {
      const literal = readLexicalLiteral(source, index)
      if (
        (previousToken === '{' || previousToken === ',') &&
        literal.staticValue?.toLowerCase() === 'rel'
      ) {
        const separator = skipLexicalTrivia(source, literal.end)
        if (source[separator] === ':') {
          const value = readLexicalLiteral(source, skipLexicalTrivia(source, separator + 1))
          if (isCanonicalStaticValue(value.staticValue)) {
            return true
          }
        }
      }
      index = literal.end
      previousToken = 'literal'
      continue
    }
    if (isIdentifierStart(character)) {
      let identifierEnd = index + 1
      while (identifierEnd < source.length && isIdentifierPart(source[identifierEnd]!)) {
        identifierEnd += 1
      }
      if (
        source.slice(index, identifierEnd).toLowerCase() === 'rel' &&
        (previousToken === '{' || previousToken === ',')
      ) {
        const separator = skipLexicalTrivia(source, identifierEnd)
        if (source[separator] === ':') {
          const value = readLexicalLiteral(source, skipLexicalTrivia(source, separator + 1))
          if (isCanonicalStaticValue(value.staticValue)) {
            return true
          }
        }
      }
      index = identifierEnd
      previousToken = 'identifier'
      continue
    }
    previousToken = character
    index += 1
  }
  return false
}

// scanMarkupTag reads one real tag boundary and resolves only static rel, :rel, or v-bind:rel attribute values.
function scanMarkupTag(source: string, start: number): MarkupTagScan | undefined {
  let index = start + 1
  if (!/[A-Za-z]/u.test(source[index] ?? '')) {
    return undefined
  }
  while (index < source.length && /[\w:.-]/u.test(source[index]!)) {
    index += 1
  }
  while (index < source.length) {
    index = skipLexicalTrivia(source, index)
    if (source[index] === '>') {
      return { end: index + 1, hasCanonicalDeclaration: false }
    }
    if (source[index] === '/' && source[index + 1] === '>') {
      return { end: index + 2, hasCanonicalDeclaration: false }
    }
    if (source[index] === '{') {
      index = readBracedExpression(source, index).end
      continue
    }
    const attributeStart = index
    while (
      index < source.length &&
      !/[\s=/>]/u.test(source[index]!)
    ) {
      index += 1
    }
    if (index === attributeStart) {
      index += 1
      continue
    }
    const attributeName = source.slice(attributeStart, index).toLowerCase()
    index = skipLexicalTrivia(source, index)
    if (source[index] !== '=') {
      continue
    }
    index = skipLexicalTrivia(source, index + 1)
    let attributeValue: LexicalValue
    if (isQuote(source[index])) {
      attributeValue = readLexicalLiteral(source, index)
    } else if (source[index] === '{') {
      attributeValue = readBracedExpression(source, index)
    } else {
      const valueStart = index
      while (index < source.length && !/[\s>]/u.test(source[index]!)) {
        index += 1
      }
      attributeValue = { end: index, staticValue: source.slice(valueStart, index) }
    }
    const isBoundAttribute = attributeName === ':rel' || attributeName === 'v-bind:rel'
    const isRelAttribute = attributeName === 'rel' || isBoundAttribute
    const staticValue = isBoundAttribute
      ? readStandaloneStaticValue(attributeValue.staticValue)
      : attributeValue.staticValue
    if (isRelAttribute && isCanonicalStaticValue(staticValue)) {
      return { end: attributeValue.end, hasCanonicalDeclaration: true }
    }
    index = attributeValue.end
  }
  return { end: source.length, hasCanonicalDeclaration: false }
}

// readBracedExpression skips one balanced JSX expression and exposes its value only when it is a single static literal.
function readBracedExpression(source: string, start: number): LexicalValue {
  const literalStart = skipLexicalTrivia(source, start + 1)
  if (isQuote(source[literalStart])) {
    const literal = readLexicalLiteral(source, literalStart)
    const expressionEnd = skipLexicalTrivia(source, literal.end)
    if (source[expressionEnd] === '}') {
      return { end: expressionEnd + 1, staticValue: literal.staticValue }
    }
  }
  let depth = 1
  let index = start + 1
  while (index < source.length && depth > 0) {
    const tokenStart = skipLexicalTrivia(source, index)
    if (tokenStart !== index) {
      index = tokenStart
      continue
    }
    if (isQuote(source[index])) {
      index = readLexicalLiteral(source, index).end
      continue
    }
    if (source[index] === '{') {
      depth += 1
    } else if (source[index] === '}') {
      depth -= 1
    }
    index += 1
  }
  return { end: index }
}

// readLexicalLiteral keeps quoted content available only when it has no escape or template interpolation.
function readLexicalLiteral(source: string, start: number): LexicalValue {
  const delimiter = source[start]
  if (!isQuote(delimiter)) {
    return { end: start }
  }
  let index = start + 1
  const staticCharacters: string[] = []
  let isStatic = true
  while (index < source.length) {
    const character = source[index]!
    if (character === delimiter) {
      return {
        end: index + 1,
        ...(isStatic ? { staticValue: staticCharacters.join('') } : {})
      }
    }
    if (character === '\\') {
      isStatic = false
      index += Math.min(2, source.length - index)
      continue
    }
    if (delimiter === '`' && character === '$' && source[index + 1] === '{') {
      isStatic = false
      index = readBracedExpression(source, index + 1).end
      continue
    }
    if ((delimiter === "'" || delimiter === '"') && (character === '\n' || character === '\r')) {
      return { end: index + 1 }
    }
    if (isStatic) {
      staticCharacters.push(character)
    }
    index += 1
  }
  return { end: source.length }
}

// readStandaloneStaticValue evaluates only an isolated quoted or template literal from a bound Vue attribute.
function readStandaloneStaticValue(expression: string | undefined): string | undefined {
  if (expression === undefined) {
    return undefined
  }
  const start = skipLexicalTrivia(expression, 0)
  if (!isQuote(expression[start])) {
    return undefined
  }
  const literal = readLexicalLiteral(expression, start)
  return skipLexicalTrivia(expression, literal.end) === expression.length
    ? literal.staticValue
    : undefined
}

// skipLexicalTrivia advances across whitespace and JS or Vue comments without exposing their contents as code.
function skipLexicalTrivia(source: string, start: number): number {
  let index = start
  while (index < source.length) {
    if (/\s/u.test(source[index]!)) {
      index += 1
      continue
    }
    if (source.startsWith('//', index)) {
      const newline = source.indexOf('\n', index + 2)
      index = newline === -1 ? source.length : newline + 1
      continue
    }
    if (source.startsWith('/*', index)) {
      const end = source.indexOf('*/', index + 2)
      index = end === -1 ? source.length : end + 2
      continue
    }
    if (source.startsWith('<!--', index)) {
      const end = source.indexOf('-->', index + 4)
      index = end === -1 ? source.length : end + 3
      continue
    }
    break
  }
  return index
}

// isCanonicalStaticValue accepts the case-insensitive canonical token only after a syntax-aware literal read.
function isCanonicalStaticValue(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === 'canonical'
}

// isQuote identifies the three JavaScript and template literal delimiters used by static rel values.
function isQuote(value: string | undefined): value is "'" | '"' | '`' {
  return value === "'" || value === '"' || value === '`'
}

// isIdentifierStart recognizes the ASCII identifier prefix needed to locate an unquoted rel property.
function isIdentifierStart(value: string): boolean {
  return /[A-Za-z_$]/u.test(value)
}

// isIdentifierPart recognizes the remaining ASCII identifier characters without consuming property punctuation.
function isIdentifierPart(value: string): boolean {
  return /[A-Za-z0-9_$]/u.test(value)
}

// readLockImporter isolates one workspace importer so peer assertions cannot match another package.
function readLockImporter(lockfile: string, importer: string): string {
  const marker = `  ${importer}:\n`
  const start = lockfile.indexOf(marker)
  if (start === -1) {
    throw new Error(`Missing pnpm lock importer: ${importer}`)
  }

  const remainder = lockfile.slice(start + marker.length)
  const nextImporter = remainder.search(/\n  \S[^\n]*:\n/)
  return marker + (nextImporter === -1 ? remainder : remainder.slice(0, nextImporter))
}

// terminalContentDetailSlugs extracts the exported site-specific reserved slug declaration for parity checks.
function terminalContentDetailSlugs(
  source: string,
  declaration = 'MEILONG_TERMINAL_CONTENT_DETAIL_SLUGS'
): string[] {
  const body = source.match(
    new RegExp(`export const ${declaration} = \\[([\\s\\S]*?)\\] as const`, 'u')
  )?.[1]
  return body ? [...body.matchAll(/'([^']+)'/gu)].map((match) => match[1]!) : []
}
