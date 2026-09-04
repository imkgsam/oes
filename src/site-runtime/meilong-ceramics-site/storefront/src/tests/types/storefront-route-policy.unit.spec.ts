import {
  buildMeilongRoutePresentation,
  resolveCategoryArchiveRouteRead,
  resolveMeilongPublicRoute,
  type ResolvedMeilongPublicRoute,
  type SiteRuntimeRouteDecision
} from '../../../types/site-route-policy'
import {
  BLOG_CATEGORY_PAGE_SIZE,
  NEWS_CATEGORY_PAGE_SIZE
} from '../../../utils/content-category-pagination-policy'

const committedDecision: SiteRuntimeRouteDecision = {
  pageKey: 'NEWS_DETAIL',
  locale: 'en-US',
  defaultLocale: 'en-US',
  activeLocales: ['en-US'],
  accessible: true,
  indexable: true,
  indexEligible: true,
  resourceAvailable: true,
  committedPublishVersion: 42,
  publicBaseUrl: 'https://meilong-ceramics.com',
  alternates: [{ locale: 'en-US', slug: 'factory-update' }]
}

describe('Meilong Storefront route policy', () => {
  it.each([
    [
      '/blogs/categories/sinks',
      { page: '2' },
      { kind: 'category-archive', page: 2, pageSize: BLOG_CATEGORY_PAGE_SIZE }
    ],
    [
      '/news/categories/company',
      { page: '3' },
      { kind: 'category-archive', page: 3, pageSize: NEWS_CATEGORY_PAGE_SIZE }
    ]
  ] as const)('derives the fixed Category archive threshold for %s', (path, query, expected) => {
    expect(resolveCategoryArchiveRouteRead(resolveGovernedRoute(path), query)).toEqual(expected)
  })

  it('does not attach a Category archive threshold to ordinary detail routes', () => {
    expect(
      resolveCategoryArchiveRouteRead(resolveGovernedRoute('/news/factory-update'), {
        page: '2'
      })
    ).toBeUndefined()
  })

  it('uses page one as the Category availability threshold for a leading-zero page query', () => {
    expect(
      resolveCategoryArchiveRouteRead(resolveGovernedRoute('/news/categories/company'), {
        page: '02'
      })
    ).toEqual({
      kind: 'category-archive',
      page: 1,
      pageSize: NEWS_CATEGORY_PAGE_SIZE
    })
  })

  it('recognizes default-locale prefixed dynamic routes without treating the locale as content', () => {
    expect(resolveMeilongPublicRoute('/en-US/news/factory-update')).toEqual({
      kind: 'governed',
      pageKey: 'NEWS_DETAIL',
      requestedLocale: 'en-US',
      explicitLocalePrefix: 'en-US',
      pathWithoutLocale: '/news/factory-update',
      resource: { collection: 'news', slug: 'factory-update' }
    })
  })

  it.each([
    '/blog',
    '/en-US/blog',
    '/blog/factory-update',
    '/en-US/blog/factory-update',
    '/blogs/category',
    '/blogs/category/sink-buying-guide',
    '/news/category',
    '/news/category/project-news',
    '/blogs/topic',
    '/blogs/topic/bathroom-sink',
    '/news/topic',
    '/news/topic/project-news',
    '/blogs/categories',
    '/news/categories',
    '/categories',
    '/categories/porcelain-tiles',
    '/en-US/categories/porcelain-tiles',
    '/products',
    '/en-US/products',
    '/collections',
    '/en-US/collections'
  ])('marks retired public route %s as terminal before detail resolution', (path) => {
    const locale = path.startsWith('/en-US/') || path === '/en-US/blog' ? 'en-US' : undefined
    const pathWithoutLocale = locale ? path.slice('/en-US'.length) : path

    expect(resolveMeilongPublicRoute(path)).toMatchObject({
      kind: 'terminal-not-found',
      pathWithoutLocale,
      requestedLocale: locale,
      explicitLocalePrefix: locale
    })
  })

  it('keeps an existing noindex Category page in localized page-two hreflang', () => {
    const route = resolveGovernedRoute('/news/categories/roca-group')
    const presentation = buildMeilongRoutePresentation({
      route,
      decision: {
        ...committedDecision,
        pageKey: 'NEWS_CATEGORY',
        indexable: false,
        indexEligible: false,
        activeLocales: ['en-US', 'fr-FR'],
        canonicalResourceSlug: 'roca-group',
        alternates: [
          { locale: 'en-US', slug: 'roca-group' },
          { locale: 'fr-FR', slug: 'groupe-roca' }
        ]
      },
      publicBaseUrl: 'https://meilong-ceramics.com',
      query: { page: '2' }
    })

    expect(presentation).toMatchObject({
      action: 'render',
      robots: 'noindex,follow',
      hreflang: [
        {
          locale: 'en-US',
          href: 'https://meilong-ceramics.com/news/categories/roca-group?page=2'
        },
        {
          locale: 'fr-FR',
          href: 'https://meilong-ceramics.com/fr-FR/news/categories/groupe-roca?page=2'
        },
        {
          locale: 'x-default',
          href: 'https://meilong-ceramics.com/news/categories/roca-group?page=2'
        }
      ]
    })
  })

  it('leaves an unknown unmanaged path as null instead of converting it to a terminal namespace', () => {
    expect(resolveMeilongPublicRoute('/unmanaged-extension-path')).toBeNull()
  })

  it.each([
    '/blogs/%63ategory',
    '/en-US/blogs/%74opic',
    '/news/CATEGORY',
    '/blogs/%E0%A4%A',
    '/news/ordinary%2Fchild',
    '/blogs/ordinary%5Cchild',
    '/blogs/%2E%2E'
  ])('fails unsafe or semantically retired path %s closed as terminal 404', (path) => {
    expect(resolveMeilongPublicRoute(path)).toMatchObject({ kind: 'terminal-not-found' })
  })

  it('keeps a safely encoded unknown path unmanaged after normalization', () => {
    expect(resolveMeilongPublicRoute('/extension/%66eature')).toBeNull()
  })

  it('canonicalizes the locale passed to Runtime while preserving redirect evidence', () => {
    expect(resolveMeilongPublicRoute('/EN-us/news/factory-update')).toMatchObject({
      kind: 'governed',
      requestedLocale: 'en-US',
      explicitLocalePrefix: 'EN-us',
      pathWithoutLocale: '/news/factory-update',
      canonicalPathNormalizationRequired: true
    })
  })

  it.each([
    [
      '/blogs/categories/bathroom-sink',
      'BLOG_CATEGORY',
      { collection: 'blog-category', slug: 'bathroom-sink' }
    ],
    [
      '/news/categories/roca-group',
      'NEWS_CATEGORY',
      { collection: 'news-category', slug: 'roca-group' }
    ],
    ['/product/collections', 'COLLECTION_LIST', undefined],
    ['/collections/bathroom-sinks-pedestal', 'COLLECTION_DETAIL', undefined],
    [
      '/products/calacatta-royal-sintered-slab',
      'PRODUCT_DETAIL',
      { collection: 'products', slug: 'calacatta-royal-sintered-slab' }
    ]
  ] as const)('maps canonical route %s to %s', (path, pageKey, resource) => {
    expect(resolveMeilongPublicRoute(path)).toMatchObject({
      kind: 'governed',
      pageKey,
      pathWithoutLocale: path,
      ...(resource ? { resource } : {})
    })
  })

  it('redirects the default-locale Collection root prefix to the new unprefixed canonical', () => {
    const route = resolveGovernedRoute('/en-US/product/collections')

    expect(
      buildMeilongRoutePresentation({
        route,
        decision: {
          ...committedDecision,
          pageKey: 'COLLECTION_LIST',
          alternates: [{ locale: 'en-US' }]
        },
        publicBaseUrl: 'https://meilong-ceramics.com'
      })
    ).toMatchObject({ action: 'redirect', statusCode: 301, redirectTo: '/product/collections' })
  })

  it('redirects a valid default-locale prefix to the unprefixed canonical with 301', () => {
    const route = resolveGovernedRoute('/en-US/news/factory-update')

    expect(
      buildMeilongRoutePresentation({
        route,
        decision: committedDecision,
        publicBaseUrl: 'https://meilong-ceramics.com'
      })
    ).toMatchObject({
      action: 'redirect',
      statusCode: 301,
      redirectTo: '/news/factory-update',
      committedPublishVersion: 42
    })
  })

  it('redirects a non-canonical default-locale prefix to the unprefixed canonical', () => {
    const route = resolveGovernedRoute('/EN-us/news/factory-update')

    expect(
      buildMeilongRoutePresentation({
        route,
        decision: committedDecision,
        publicBaseUrl: 'https://meilong-ceramics.com'
      })
    ).toMatchObject({ action: 'redirect', statusCode: 301, redirectTo: '/news/factory-update' })
  })

  it('redirects a non-canonical non-default locale prefix to its canonical casing', () => {
    const route = resolveGovernedRoute('/FR-fr/news/mise-a-jour')

    expect(
      buildMeilongRoutePresentation({
        route,
        decision: {
          ...committedDecision,
          locale: 'fr-FR',
          activeLocales: ['en-US', 'fr-FR'],
          alternates: [{ locale: 'fr-FR', slug: 'mise-a-jour' }]
        },
        publicBaseUrl: 'https://meilong-ceramics.com'
      })
    ).toMatchObject({
      action: 'redirect',
      statusCode: 301,
      redirectTo: '/fr-FR/news/mise-a-jour'
    })
  })

  it('redirects a safely encoded ordinary slug to one canonical path encoding', () => {
    const route = resolveGovernedRoute('/blogs/factory%2Dupdate')

    expect(route).toMatchObject({
      pathWithoutLocale: '/blogs/factory-update',
      resource: { collection: 'blog', slug: 'factory-update' },
      canonicalPathNormalizationRequired: true
    })
    expect(
      buildMeilongRoutePresentation({
        route,
        decision: {
          ...committedDecision,
          pageKey: 'BLOG_DETAIL',
          canonicalResourceSlug: 'factory-update',
          alternates: [{ locale: 'en-US', slug: 'factory-update' }]
        },
        publicBaseUrl: 'https://meilong-ceramics.com'
      })
    ).toMatchObject({ action: 'redirect', statusCode: 301, redirectTo: '/blogs/factory-update' })
  })

  it('renders an already canonical encoded Unicode slug without a duplicate redirect', () => {
    const route = resolveGovernedRoute('/blogs/caf%C3%A9')

    expect(
      buildMeilongRoutePresentation({
        route,
        decision: {
          ...committedDecision,
          pageKey: 'BLOG_DETAIL',
          canonicalResourceSlug: 'café',
          alternates: [{ locale: 'en-US', slug: 'café' }]
        },
        publicBaseUrl: 'https://meilong-ceramics.com'
      })
    ).toMatchObject({
      action: 'render',
      canonicalUrl: 'https://meilong-ceramics.com/blogs/caf%C3%A9'
    })
  })

  it.each([
    [
      '/news/categories/project-news',
      'NEWS_CATEGORY',
      'en-US',
      'roca-group',
      '/news/categories/roca-group'
    ],
    [
      '/blogs/categories/sink-buying-guide',
      'BLOG_CATEGORY',
      'en-US',
      'bathroom-sink',
      '/blogs/categories/bathroom-sink'
    ],
    [
      '/fr-FR/news/categories/anciennes-actualites',
      'NEWS_CATEGORY',
      'fr-FR',
      'groupe-roca',
      '/fr-FR/news/categories/groupe-roca'
    ],
    [
      '/fr-FR/blogs/categories/anciens-conseils',
      'BLOG_CATEGORY',
      'fr-FR',
      'conseils-salle-de-bains',
      '/fr-FR/blogs/categories/conseils-salle-de-bains'
    ]
  ] as const)(
    'redirects historical category route %s to its same-locale canonical identity',
    (path, pageKey, locale, canonicalResourceSlug, redirectTo) => {
      const route = resolveGovernedRoute(path)
      const historicalDecision = {
        ...committedDecision,
        pageKey: pageKey as SiteRuntimeRouteDecision['pageKey'],
        locale,
        activeLocales: ['en-US', 'fr-FR'],
        indexEligible: false,
        canonicalResourceSlug,
        alternates: []
      }

      expect(
        buildMeilongRoutePresentation({
          route,
          decision: historicalDecision,
          publicBaseUrl: 'https://meilong-ceramics.com'
        })
      ).toEqual({
        action: 'redirect',
        statusCode: 301,
        redirectTo,
        committedPublishVersion: 42
      })
    }
  )

  it.each([
    ['disabled locale', { accessible: false }],
    ['disabled page', { accessible: false, indexable: false }],
    ['missing localized resource', { resourceAvailable: false }]
  ])('returns deterministic 404 for %s', (_label, override) => {
    const route = resolveGovernedRoute('/news/factory-update')
    const decision = { ...committedDecision, ...override }

    expect(
      buildMeilongRoutePresentation({
        route,
        decision,
        publicBaseUrl: 'https://meilong-ceramics.com'
      })
    ).toEqual({ action: 'not-found', statusCode: 404 })
  })

  it('emits canonical, html lang, hreflang, and index policy from one committed version', () => {
    const route = resolveGovernedRoute('/news/factory-update')
    const presentation = buildMeilongRoutePresentation({
      route,
      decision: committedDecision,
      publicBaseUrl: 'https://meilong-ceramics.com'
    })

    expect(presentation).toEqual({
      action: 'render',
      canonicalUrl: 'https://meilong-ceramics.com/news/factory-update',
      locale: 'en-US',
      robots: 'index,follow',
      hreflang: [
        {
          locale: 'en-US',
          href: 'https://meilong-ceramics.com/news/factory-update'
        },
        {
          locale: 'x-default',
          href: 'https://meilong-ceramics.com/news/factory-update'
        }
      ],
      committedPublishVersion: 42
    })
  })

  it('keeps an accessible noindex page out of hreflang without blocking rendering', () => {
    const route = resolveGovernedRoute('/news/factory-update')
    const presentation = buildMeilongRoutePresentation({
      route,
      decision: { ...committedDecision, indexable: false, indexEligible: false },
      publicBaseUrl: 'https://meilong-ceramics.com'
    })

    expect(presentation).toMatchObject({
      action: 'render',
      robots: 'noindex,follow',
      hreflang: [],
      committedPublishVersion: 42
    })
  })

  it('keeps a valid non-default locale prefix in canonical and hreflang paths', () => {
    const route = resolveGovernedRoute('/fr-FR/news/mise-a-jour')
    const presentation = buildMeilongRoutePresentation({
      route,
      decision: {
        ...committedDecision,
        locale: 'fr-FR',
        activeLocales: ['en-US', 'fr-FR'],
        alternates: [
          { locale: 'en-US', slug: 'factory-update' },
          { locale: 'fr-FR', slug: 'mise-a-jour' }
        ]
      },
      publicBaseUrl: 'https://meilong-ceramics.com'
    })

    expect(presentation).toMatchObject({
      action: 'render',
      canonicalUrl: 'https://meilong-ceramics.com/fr-FR/news/mise-a-jour',
      locale: 'fr-FR'
    })
  })

  it('uses the same trailing-slash home canonical as sitemap policy', () => {
    const route = resolveGovernedRoute('/')
    const presentation = buildMeilongRoutePresentation({
      route,
      decision: {
        ...committedDecision,
        pageKey: 'HOME',
        alternates: [{ locale: 'en-US' }]
      },
      publicBaseUrl: 'https://meilong-ceramics.com'
    })

    expect(presentation).toMatchObject({
      action: 'render',
      canonicalUrl: 'https://meilong-ceramics.com/'
    })
  })

  it('gives a valid paginated Blog archive its own canonical and matching hreflang URLs', () => {
    const route = resolveGovernedRoute('/blogs')
    const presentation = buildMeilongRoutePresentation({
      route,
      decision: {
        ...committedDecision,
        pageKey: 'BLOG_LIST',
        activeLocales: ['en-US', 'fr-FR'],
        alternates: [{ locale: 'en-US' }, { locale: 'fr-FR' }]
      },
      publicBaseUrl: 'https://meilong-ceramics.com',
      query: { page: '2' }
    })

    expect(presentation).toMatchObject({
      action: 'render',
      canonicalUrl: 'https://meilong-ceramics.com/blogs?page=2',
      robots: 'index,follow',
      hreflang: [
        { locale: 'en-US', href: 'https://meilong-ceramics.com/blogs?page=2' },
        { locale: 'fr-FR', href: 'https://meilong-ceramics.com/fr-FR/blogs?page=2' },
        { locale: 'x-default', href: 'https://meilong-ceramics.com/blogs?page=2' }
      ]
    })
  })

  it.each([
    ['/news/categories/roca-group', 'en-US'],
    ['/fr-FR/news/categories/groupe-roca', 'fr-FR']
  ] as const)('gives News category page two a localized self-canonical at %s', (path, locale) => {
    const route = resolveGovernedRoute(path)
    const presentation = buildMeilongRoutePresentation({
      route,
      decision: {
        ...committedDecision,
        pageKey: 'NEWS_CATEGORY',
        locale,
        activeLocales: ['en-US', 'fr-FR'],
        canonicalResourceSlug: locale === 'en-US' ? 'roca-group' : 'groupe-roca',
        alternates: [
          { locale: 'en-US', slug: 'roca-group' },
          { locale: 'fr-FR', slug: 'groupe-roca' }
        ]
      },
      publicBaseUrl: 'https://meilong-ceramics.com',
      query: { page: '2' }
    })

    expect(presentation).toMatchObject({
      action: 'render',
      canonicalUrl: `https://meilong-ceramics.com${locale === 'en-US' ? '' : '/fr-FR'}/news/categories/${
        locale === 'en-US' ? 'roca-group' : 'groupe-roca'
      }?page=2`,
      robots: 'index,follow',
      hreflang: [
        {
          locale: 'en-US',
          href: 'https://meilong-ceramics.com/news/categories/roca-group?page=2'
        },
        {
          locale: 'fr-FR',
          href: 'https://meilong-ceramics.com/fr-FR/news/categories/groupe-roca?page=2'
        },
        {
          locale: 'x-default',
          href: 'https://meilong-ceramics.com/news/categories/roca-group?page=2'
        }
      ]
    })
  })

  it('keeps leading-zero Category pagination on page-one canonical semantics', () => {
    const route = resolveGovernedRoute('/news/categories/roca-group')
    const presentation = buildMeilongRoutePresentation({
      route,
      decision: {
        ...committedDecision,
        pageKey: 'NEWS_CATEGORY',
        canonicalResourceSlug: 'roca-group',
        alternates: [{ locale: 'en-US', slug: 'roca-group' }]
      },
      publicBaseUrl: 'https://meilong-ceramics.com',
      query: { page: '02' }
    })

    expect(presentation).toMatchObject({
      action: 'render',
      canonicalUrl: 'https://meilong-ceramics.com/news/categories/roca-group',
      robots: 'noindex,follow',
      hreflang: []
    })
  })

  it('normalizes page one to the base archive canonical', () => {
    const route = resolveGovernedRoute('/blogs')
    const presentation = buildMeilongRoutePresentation({
      route,
      decision: {
        ...committedDecision,
        pageKey: 'BLOG_LIST',
        alternates: [{ locale: 'en-US' }]
      },
      publicBaseUrl: 'https://meilong-ceramics.com',
      query: { page: '1' }
    })

    expect(presentation).toMatchObject({
      action: 'render',
      canonicalUrl: 'https://meilong-ceramics.com/blogs',
      robots: 'index,follow',
      hreflang: [
        { locale: 'en-US', href: 'https://meilong-ceramics.com/blogs' },
        { locale: 'x-default', href: 'https://meilong-ceramics.com/blogs' }
      ]
    })
  })

  it.each([
    ['zero', '0'],
    ['negative', '-2'],
    ['leading-zero', '02'],
    ['decimal', '2.5'],
    ['unsafe integer', '9007199254740992'],
    ['repeated', ['2', '3']]
  ])('fails safe for a %s page value without exposing it in canonical output', (_label, page) => {
    const route = resolveGovernedRoute('/blogs')
    const presentation = buildMeilongRoutePresentation({
      route,
      decision: {
        ...committedDecision,
        pageKey: 'BLOG_LIST',
        alternates: [{ locale: 'en-US' }]
      },
      publicBaseUrl: 'https://meilong-ceramics.com',
      query: { page }
    })

    expect(presentation).toMatchObject({
      action: 'render',
      canonicalUrl: 'https://meilong-ceramics.com/blogs',
      robots: 'noindex,follow',
      hreflang: []
    })
  })

  it.each(['year', 'q', 'sort'])('%s query noise stays noindex and out of canonical', (key) => {
    const route = resolveGovernedRoute('/news')
    expect(route.resource).toEqual({ collection: 'news' })
    const presentation = buildMeilongRoutePresentation({
      route,
      decision: { ...committedDecision, pageKey: 'NEWS_LIST' },
      publicBaseUrl: 'https://meilong-ceramics.com',
      query: { [key]: 'newest' }
    })

    expect(presentation).toMatchObject({
      action: 'render',
      canonicalUrl: 'https://meilong-ceramics.com/news',
      robots: 'noindex,follow',
      hreflang: []
    })
  })

  it('keeps a valid page canonical while excluding concurrent filter noise from indexing', () => {
    const route = resolveGovernedRoute('/blogs')
    const presentation = buildMeilongRoutePresentation({
      route,
      decision: {
        ...committedDecision,
        pageKey: 'BLOG_LIST',
        alternates: [{ locale: 'en-US' }]
      },
      publicBaseUrl: 'https://meilong-ceramics.com',
      query: { page: '2', q: 'sink', sort: 'newest' }
    })

    expect(presentation).toMatchObject({
      action: 'render',
      canonicalUrl: 'https://meilong-ceramics.com/blogs?page=2',
      robots: 'noindex,follow',
      hreflang: []
    })
  })
})

// resolveGovernedRoute keeps presentation tests explicit about terminal and unmanaged route exclusion.
function resolveGovernedRoute(path: string): ResolvedMeilongPublicRoute {
  const route = resolveMeilongPublicRoute(path)
  if (!route || route.kind !== 'governed') {
    throw new Error(`Expected governed Meilong route: ${path}`)
  }
  return route
}
