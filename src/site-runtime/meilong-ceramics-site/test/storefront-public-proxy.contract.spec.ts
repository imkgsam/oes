import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const storefrontRoot = resolve(__dirname, '..', 'storefront')
const requireFromNuxt = createRequire(
  require.resolve('nuxt/package.json', { paths: [storefrontRoot] })
)
const h3 = requireFromNuxt('h3') as {
  createError: (input: { statusCode: number; statusMessage: string }) => Error
  defineEventHandler: <T>(handler: T) => T
  getQuery: (event: ProxyEvent) => Record<string, unknown>
  getRouterParam: (event: ProxyEvent, name: string) => string | undefined
}

const mockFetchSiteRuntime = jest.fn()
const composedCategorySlug = 'café-guides'
const invalidCanonicalCategorySlugs = [
  ['padded', ` ${composedCategorySlug} `],
  ['decomposed-NFC', composedCategorySlug.normalize('NFD')]
] as const

jest.mock('../storefront/server/utils/site-runtime', () => ({
  fetchSiteRuntime: mockFetchSiteRuntime
}))

interface ProxyEvent {
  path: string
  context: { params: Record<string, string> }
}

type ProxyHandler = (event: ProxyEvent) => unknown

describe('Meilong Storefront public H3 proxies', () => {
  beforeAll(() => {
    Object.assign(globalThis, {
      createError: h3.createError,
      defineEventHandler: h3.defineEventHandler,
      getQuery: h3.getQuery,
      getRouterParam: h3.getRouterParam
    })
  })

  beforeEach(() => {
    mockFetchSiteRuntime.mockReset()
    mockFetchSiteRuntime.mockResolvedValue({})
  })

  it.each([
    {
      label: 'resource list',
      modulePath: '../storefront/server/api/public/[collection]/index.get.ts',
      path: '/api/public/blog?locale=en-US&locale=fr-FR',
      params: { collection: 'blog' }
    },
    {
      label: 'resource detail',
      modulePath: '../storefront/server/api/public/[collection]/[slug].get.ts',
      path: '/api/public/blog/example?locale=en-US&locale=fr-FR',
      params: { collection: 'blog', slug: 'example' }
    },
    {
      label: 'category directory',
      modulePath: '../storefront/server/api/public/article-categories/[contentType].get.ts',
      path: '/api/public/article-categories/blog?locale=en-US&locale=fr-FR',
      params: { contentType: 'blog' }
    },
    {
      label: 'category archive',
      modulePath:
        '../storefront/server/api/public/article-category-archives/[contentType]/[slug].get.ts',
      path: '/api/public/article-category-archives/blog/sinks?page=1&page=2',
      params: { contentType: 'blog', slug: 'sinks' }
    },
    {
      label: 'content archive page',
      modulePath: '../storefront/server/api/public/article-archives/[contentType].get.ts',
      path: '/api/public/article-archives/news?page=1&page=2',
      params: { contentType: 'news' }
    },
    {
      label: 'historical redirect',
      modulePath: '../storefront/server/api/public/redirects/[collection]/[slug].get.ts',
      path: '/api/public/redirects/blog/old?locale=en-US&locale=fr-FR',
      params: { collection: 'blog', slug: 'old' }
    },
    {
      label: 'route decision',
      modulePath: '../storefront/server/api/public/site-exposure/route-decision.get.ts',
      path: '/api/public/site-exposure/route-decision?pageKey=BLOG_LIST&pageKey=NEWS_LIST',
      params: {}
    }
  ])('rejects repeated query input before the $label Runtime call', async (fixture) => {
    const handler = loadProxyHandler(fixture.modulePath)

    const statusCode = await rejectionStatus(() =>
      handler(proxyEvent(fixture.path, fixture.params as Record<string, string>))
    )

    expect(statusCode).toBe(400)
    expect(mockFetchSiteRuntime).not.toHaveBeenCalled()
  })

  it('passes numeric-looking resource query values to Runtime as the original strings', async () => {
    const handler = loadProxyHandler(
      '../storefront/server/api/public/[collection]/index.get.ts'
    )

    await handler(
      proxyEvent('/api/public/blog?locale=en-US&limit=not-a-number&cursor=next', {
        collection: 'blog'
      })
    )

    expect(mockFetchSiteRuntime).toHaveBeenCalledWith(
      expect.anything(),
      '/api/public/resources/blog',
      { locale: 'en-US', limit: 'not-a-number', cursor: 'next' }
    )
  })

  it.each([
    ['generic list', '../storefront/server/api/public/[collection]/index.get.ts', { collection: 'article-categories' }],
    ['generic detail', '../storefront/server/api/public/[collection]/[slug].get.ts', { collection: 'article-categories', slug: 'bathroom-sink' }]
  ])('rejects retired article-categories through the $label proxy without a Runtime request', async (_label, modulePath, params) => {
    const handler = loadProxyHandler(modulePath)

    await expect(
      Promise.resolve().then(() => handler(proxyEvent('/api/public/article-categories', params)))
    ).rejects.toMatchObject({ statusCode: 404 })
    expect(mockFetchSiteRuntime).not.toHaveBeenCalled()
  })

  it('passes archive pagination strings through without NaN coercion', async () => {
    const handler = loadProxyHandler(
      '../storefront/server/api/public/article-category-archives/[contentType]/[slug].get.ts'
    )

    await handler(
      proxyEvent('/api/public/article-category-archives/blog/sinks?page=2x&pageSize=large', {
        contentType: 'blog',
        slug: 'sinks'
      })
    )

    expect(mockFetchSiteRuntime).toHaveBeenCalledWith(
      expect.anything(),
      '/api/public/article-category-archives/blog/sinks',
      { locale: undefined, page: '2x', pageSize: 'large' }
    )
  })

  it('passes the Category archive threshold through the real route-decision H3 proxy', async () => {
    const handler = loadProxyHandler(
      '../storefront/server/api/public/site-exposure/route-decision.get.ts'
    )

    await handler(
      proxyEvent(
        '/api/public/site-exposure/route-decision?pageKey=NEWS_CATEGORY&locale=fr-FR&resourceCollection=news-category&slug=nouvelles-groupe&archivePage=2&archivePageSize=8',
        {}
      )
    )

    expect(mockFetchSiteRuntime).toHaveBeenCalledWith(
      expect.anything(),
      '/api/public/site-exposure/route-decision',
      {
        pageKey: 'NEWS_CATEGORY',
        locale: 'fr-FR',
        resourceCollection: 'news-category',
        slug: 'nouvelles-groupe',
        archivePage: '2',
        archivePageSize: '8'
      }
    )
  })

  it.each([
    [
      'missing',
      '/api/public/site-exposure/route-decision?pageKey=NEWS_CATEGORY&resourceCollection=news-category&archivePage=2&archivePageSize=8'
    ],
    [
      'empty',
      '/api/public/site-exposure/route-decision?pageKey=NEWS_CATEGORY&resourceCollection=news-category&slug=&archivePage=2&archivePageSize=8'
    ]
  ])(
    'rejects a %s Category slug before the route-decision Runtime call',
    async (_label, path) => {
      const handler = loadProxyHandler(
        '../storefront/server/api/public/site-exposure/route-decision.get.ts'
      )

      await expect(
        Promise.resolve().then(() => handler(proxyEvent(path, {})))
      ).rejects.toMatchObject({ statusCode: 400 })
      expect(mockFetchSiteRuntime).not.toHaveBeenCalled()
    }
  )

  it.each(invalidCanonicalCategorySlugs)(
    'rejects a %s Category slug before the route-decision Runtime fetch',
    async (_label, slug) => {
      const handler = loadProxyHandler(
        '../storefront/server/api/public/site-exposure/route-decision.get.ts'
      )
      const path = `/api/public/site-exposure/route-decision?pageKey=NEWS_CATEGORY&resourceCollection=news-category&slug=${encodeURIComponent(slug)}&archivePage=2&archivePageSize=8`

      await expect(
        Promise.resolve().then(() => handler(proxyEvent(path, {})))
      ).rejects.toMatchObject({ statusCode: 400 })
      expect(mockFetchSiteRuntime).not.toHaveBeenCalled()
    }
  )

  it('passes a composed Unicode Category slug unchanged through the route-decision Runtime fetch', async () => {
    const handler = loadProxyHandler(
      '../storefront/server/api/public/site-exposure/route-decision.get.ts'
    )
    const path = `/api/public/site-exposure/route-decision?pageKey=NEWS_CATEGORY&locale=en-US&resourceCollection=news-category&slug=${encodeURIComponent(composedCategorySlug)}&archivePage=2&archivePageSize=8`

    await handler(proxyEvent(path, {}))

    expect(mockFetchSiteRuntime).toHaveBeenCalledWith(
      expect.anything(),
      '/api/public/site-exposure/route-decision',
      {
        pageKey: 'NEWS_CATEGORY',
        locale: 'en-US',
        resourceCollection: 'news-category',
        slug: composedCategorySlug,
        archivePage: '2',
        archivePageSize: '8'
      }
    )
  })

  it.each(['archivePage', 'archivePageSize'])(
    'rejects repeated %s before the route-decision Runtime call',
    async (field) => {
      const handler = loadProxyHandler(
        '../storefront/server/api/public/site-exposure/route-decision.get.ts'
      )

      await expect(
        Promise.resolve().then(() =>
          handler(
            proxyEvent(
              `/api/public/site-exposure/route-decision?pageKey=NEWS_CATEGORY&${field}=1&${field}=2`,
              {}
            )
          )
        )
      ).rejects.toMatchObject({ statusCode: 400 })
      expect(mockFetchSiteRuntime).not.toHaveBeenCalled()
    }
  )

  it.each([
    ['content archive', '../storefront/server/api/public/article-archives/[contentType].get.ts', '/api/public/article-archives/news?year=1999', { contentType: 'news' }],
    ['category archive', '../storefront/server/api/public/article-category-archives/[contentType]/[slug].get.ts', '/api/public/article-category-archives/blog/sinks?page=9007199254740992', { contentType: 'blog', slug: 'sinks' }]
  ])('preserves Runtime 400 for an invalid $label numeric query', async (_label, modulePath, path, params) => {
    mockFetchSiteRuntime.mockRejectedValueOnce(h3.createError({
      statusCode: 400,
      statusMessage: 'Invalid archive query'
    }))
    const handler = loadProxyHandler(modulePath)

    await expect(
      handler(proxyEvent(path, params))
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it.each(['2e3', '0xC', '+12', '12.0', ' 12 '])(
    'passes non-decimal archive value %s unchanged and preserves Runtime 400',
    async (value) => {
      mockFetchSiteRuntime.mockRejectedValueOnce(h3.createError({
        statusCode: 400,
        statusMessage: 'Invalid archive query'
      }))
      const handler = loadProxyHandler(
        '../storefront/server/api/public/article-archives/[contentType].get.ts'
      )
      const encodedValue = encodeURIComponent(value)

      await expect(
        Promise.resolve().then(() =>
          handler(proxyEvent(`/api/public/article-archives/news?page=${encodedValue}`, {
            contentType: 'news'
          }))
        )
      ).rejects.toMatchObject({ statusCode: 400 })
      expect(mockFetchSiteRuntime).toHaveBeenCalledWith(
        expect.anything(),
        '/api/public/article-archives/news',
        expect.objectContaining({ page: value })
      )
    }
  )

  it('rejects object-shaped query input in the shared parser', () => {
    const query = require('../storefront/server/utils/public-query.ts') as {
      readOptionalSingleQueryString: (
        input: Record<string, unknown>,
        key: string
      ) => string | undefined
    }

    expect(() =>
      query.readOptionalSingleQueryString({ locale: { value: 'en-US' } }, 'locale')
    ).toThrow(expect.objectContaining({ statusCode: 400 }))
  })

  it.each([
    ['content archive', '../storefront/server/api/public/article-archives/[contentType].get.ts', { contentType: 'news' }],
    ['category archive', '../storefront/server/api/public/article-category-archives/[contentType]/[slug].get.ts', { contentType: 'blog', slug: 'sinks' }]
  ])('rejects an object-shaped query through the real $label H3 handler', async (_label, modulePath, params) => {
    const originalGetQuery = globalThis.getQuery
    globalThis.getQuery = (() => ({ page: { value: '1' } })) as unknown as typeof globalThis.getQuery
    try {
      const handler = loadProxyHandler(modulePath)
      await expect(
        Promise.resolve().then(() => handler(proxyEvent('/api/public/archive', params)))
      ).rejects.toMatchObject({ statusCode: 400 })
      expect(mockFetchSiteRuntime).not.toHaveBeenCalled()
    } finally {
      globalThis.getQuery = originalGetQuery
    }
  })
})

// loadProxyHandler evaluates the real Nitro handler after installing Nuxt's H3 auto-import equivalents.
function loadProxyHandler(modulePath: string): ProxyHandler {
  try {
    return (require(modulePath) as { default: ProxyHandler }).default
  } catch (failure) {
    const detail = failure instanceof Error ? failure.stack ?? failure.message : String(failure)
    throw new Error(`Failed to load ${modulePath}: ${detail}`)
  }
}

// proxyEvent supplies real H3 query/router readers with the minimum equivalent event state.
function proxyEvent(path: string, params: Record<string, string>): ProxyEvent {
  return { path, context: { params } }
}

// rejectionStatus exposes H3 status codes without relying on its intentionally blank public error message.
async function rejectionStatus(run: () => unknown): Promise<number | undefined> {
  try {
    await run()
    return undefined
  } catch (failure) {
    return failure && typeof failure === 'object'
      ? (failure as { statusCode?: number }).statusCode
      : undefined
  }
}
