import {
  BLOG_CATEGORY_PAGE_SIZE,
  NEWS_CATEGORY_PAGE_SIZE
} from '../utils/content-category-pagination-policy'

export type MeilongPageKey =
  | 'ABOUT'
  | 'BLOG_CATEGORY'
  | 'BLOG_DETAIL'
  | 'BLOG_LIST'
  | 'COLLECTION_DETAIL'
  | 'COLLECTION_LIST'
  | 'CONTACT'
  | 'FAQ'
  | 'HOME'
  | 'INSPIRATION'
  | 'INSPIRATION_CATEGORY'
  | 'NEWS_CATEGORY'
  | 'NEWS_DETAIL'
  | 'NEWS_LIST'
  | 'PRIVACY_POLICY'
  | 'PRODUCT_DETAIL'
  | 'RETURNS_REFUNDS'
  | 'SEARCH'
  | 'SERIES'
  | 'SHIPPING_DELIVERY'
  | 'TERMS_CONDITIONS'
  | 'WARRANTY'

export type RouteResourceCollection =
  | 'products'
  | 'blog'
  | 'news'
  | 'blog-category'
  | 'news-category'

export const MEILONG_TERMINAL_CONTENT_DETAIL_SLUGS = [
  'category',
  'topic',
  'categories'
] as const

const terminalContentDetailSlugSet = new Set<string>(
  MEILONG_TERMINAL_CONTENT_DETAIL_SLUGS
)

export interface ResolvedMeilongPublicRoute {
  kind: 'governed'
  pageKey: MeilongPageKey
  requestedLocale?: string
  explicitLocalePrefix?: string
  pathWithoutLocale: string
  canonicalPathNormalizationRequired?: true
  resource?: {
    collection: RouteResourceCollection
    slug?: string
  }
}

export interface MeilongTerminalNotFoundRoute {
  kind: 'terminal-not-found'
  requestedLocale?: string
  explicitLocalePrefix?: string
  pathWithoutLocale: string
}

export type MeilongPublicRouteResolution =
  | ResolvedMeilongPublicRoute
  | MeilongTerminalNotFoundRoute
  | null

export interface SiteRuntimeRouteDecision {
  pageKey: MeilongPageKey
  locale: string
  defaultLocale: string
  activeLocales: string[]
  accessible: boolean
  indexable: boolean
  indexEligible: boolean
  resourceAvailable: boolean
  canonicalResourceSlug?: string
  committedPublishVersion: number
  publicBaseUrl: string
  alternates: Array<{ locale: string; slug?: string }>
}

export interface CategoryArchiveRouteRead {
  kind: 'category-archive'
  page: number
  pageSize: number
}

export type MeilongRoutePresentation =
  | { action: 'not-found'; statusCode: 404 }
  | {
      action: 'redirect'
      statusCode: 301
      redirectTo: string
      committedPublishVersion: number
    }
  | {
      action: 'render'
      canonicalUrl: string
      locale: string
      robots: 'index,follow' | 'noindex,follow'
      hreflang: Array<{ locale: string; href: string }>
      committedPublishVersion: number
    }

export const MEILONG_PUBLIC_PAGE_KEYS = [
  'ABOUT',
  'BLOG_CATEGORY',
  'BLOG_DETAIL',
  'BLOG_LIST',
  'COLLECTION_DETAIL',
  'COLLECTION_LIST',
  'CONTACT',
  'FAQ',
  'HOME',
  'INSPIRATION',
  'INSPIRATION_CATEGORY',
  'NEWS_CATEGORY',
  'NEWS_DETAIL',
  'NEWS_LIST',
  'PRIVACY_POLICY',
  'PRODUCT_DETAIL',
  'RETURNS_REFUNDS',
  'SEARCH',
  'SERIES',
  'SHIPPING_DELIVERY',
  'TERMS_CONDITIONS',
  'WARRANTY'
] as const satisfies readonly MeilongPageKey[]

const exactPageByPath = new Map<string, MeilongPageKey>([
  ['/', 'HOME'],
  ['/about', 'ABOUT'],
  ['/blogs', 'BLOG_LIST'],
  ['/contact', 'CONTACT'],
  ['/faqs', 'FAQ'],
  ['/inspirations', 'INSPIRATION'],
  ['/news', 'NEWS_LIST'],
  ['/privacy-policy', 'PRIVACY_POLICY'],
  ['/product/collections', 'COLLECTION_LIST'],
  ['/returns-refunds', 'RETURNS_REFUNDS'],
  ['/search', 'SEARCH'],
  ['/series', 'SERIES'],
  ['/shipping-delivery', 'SHIPPING_DELIVERY'],
  ['/terms-conditions', 'TERMS_CONDITIONS'],
  ['/warranty', 'WARRANTY']
])

const listCollectionByPageKey = new Map<MeilongPageKey, RouteResourceCollection>([
  ['BLOG_LIST', 'blog'],
  ['NEWS_LIST', 'news']
])

const paginatedPageKeys = new Set<MeilongPageKey>([
  'BLOG_LIST',
  'BLOG_CATEGORY',
  'NEWS_CATEGORY'
])

const categoryArchivePageSizeByPageKey = new Map<MeilongPageKey, number>([
  ['BLOG_CATEGORY', BLOG_CATEGORY_PAGE_SIZE],
  ['NEWS_CATEGORY', NEWS_CATEGORY_PAGE_SIZE]
])

interface MeilongCanonicalQueryPolicy {
  canonicalSearch: string
  forceNoindex: boolean
}

const dynamicRoutes: Array<{
  pattern: RegExp
  pageKey: MeilongPageKey
  collection?: RouteResourceCollection
}> = [
  {
    pattern: /^\/blogs\/categories\/([^/]+)$/u,
    pageKey: 'BLOG_CATEGORY',
    collection: 'blog-category'
  },
  { pattern: /^\/blogs\/([^/]+)$/u, pageKey: 'BLOG_DETAIL', collection: 'blog' },
  { pattern: /^\/collections\/([^/]+)$/u, pageKey: 'COLLECTION_DETAIL' },
  { pattern: /^\/inspirations\/category\/([^/]+)$/u, pageKey: 'INSPIRATION_CATEGORY' },
  {
    pattern: /^\/news\/categories\/([^/]+)$/u,
    pageKey: 'NEWS_CATEGORY',
    collection: 'news-category'
  },
  { pattern: /^\/news\/([^/]+)$/u, pageKey: 'NEWS_DETAIL', collection: 'news' },
  { pattern: /^\/products\/([^/]+)$/u, pageKey: 'PRODUCT_DETAIL', collection: 'products' }
]

// resolveMeilongPublicRoute maps a public URL to its stable page identity without leaking routes into the capability manifest.
export function resolveMeilongPublicRoute(path: string): MeilongPublicRouteResolution {
  const normalizedPath = normalizePublicPath(path)
  if (!normalizedPath) {
    return {
      kind: 'terminal-not-found',
      pathWithoutLocale: requestPathname(path)
    }
  }
  const segments = normalizedPath.segments
  const firstSegment = segments[0]
  const requestedLocale = firstSegment ? canonicalLocale(firstSegment) : undefined
  const explicitLocalePrefix = requestedLocale ? firstSegment : undefined
  const pathSegments = requestedLocale ? segments.slice(1) : segments
  const pathWithoutLocale = encodePublicPath(pathSegments)
  const canonicalRequestPath = requestedLocale
    ? `/${requestedLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`
    : pathWithoutLocale
  const canonicalPathNormalizationRequired =
    normalizedPath.rawPathname !== canonicalRequestPath ? true : undefined
  if (isRetiredPublicPath(pathWithoutLocale)) {
    return {
      kind: 'terminal-not-found',
      requestedLocale,
      explicitLocalePrefix,
      pathWithoutLocale
    }
  }
  const pageKey = exactPageByPath.get(pathWithoutLocale)
  if (pageKey) {
    const collection = listCollectionByPageKey.get(pageKey)
    return {
      kind: 'governed',
      pageKey,
      requestedLocale,
      explicitLocalePrefix,
      pathWithoutLocale,
      canonicalPathNormalizationRequired,
      resource: collection ? { collection } : undefined
    }
  }
  for (const route of dynamicRoutes) {
    const match = pathWithoutLocale.match(route.pattern)
    if (!match) {
      continue
    }
    return {
      kind: 'governed',
      pageKey: route.pageKey,
      requestedLocale,
      explicitLocalePrefix,
      pathWithoutLocale,
      canonicalPathNormalizationRequired,
      resource: route.collection
        ? { collection: route.collection, slug: decodeURIComponent(match[1]!) }
        : undefined
    }
  }
  return null
}

// isMeilongTerminalNotFoundRoute narrows retired namespaces before middleware can perform Runtime resource resolution.
export function isMeilongTerminalNotFoundRoute(
  route: MeilongPublicRouteResolution
): route is MeilongTerminalNotFoundRoute {
  return route?.kind === 'terminal-not-found'
}

// resolveCategoryArchiveRouteRead derives the fixed Category page threshold from the same canonical query semantics used by route presentation.
export function resolveCategoryArchiveRouteRead(
  route: ResolvedMeilongPublicRoute,
  query: Record<string, unknown>
): CategoryArchiveRouteRead | undefined {
  const pageSize = categoryArchivePageSizeByPageKey.get(route.pageKey)
  return pageSize === undefined
    ? undefined
    : {
        kind: 'category-archive',
        page: canonicalPageNumber(query.page) ?? 1,
        pageSize
      }
}

// buildMeilongRoutePresentation converts one Runtime-local exposure decision into redirect, 404, or committed SEO output.
export function buildMeilongRoutePresentation(input: {
  route: ResolvedMeilongPublicRoute
  decision: SiteRuntimeRouteDecision
  publicBaseUrl: string
  query?: Record<string, unknown>
}): MeilongRoutePresentation {
  const { decision, route } = input
  if (decision.pageKey !== route.pageKey || !decision.accessible || !decision.resourceAvailable) {
    return { action: 'not-found', statusCode: 404 }
  }
  const currentAlternate = decision.alternates.find(
    (alternate) => alternate.locale === decision.locale
  )
  const canonicalResourceSlug = decision.canonicalResourceSlug ?? currentAlternate?.slug
  const canonicalPath = localizedPath(
    route,
    decision.locale,
    decision.defaultLocale,
    canonicalResourceSlug
  )
  const historicalResourceSlug = Boolean(
    route.resource?.slug &&
      canonicalResourceSlug &&
      route.resource.slug !== canonicalResourceSlug
  )
  const defaultLocalePrefix =
    route.explicitLocalePrefix !== undefined && decision.locale === decision.defaultLocale
  const nonCanonicalLocalePrefix =
    route.explicitLocalePrefix !== undefined && route.explicitLocalePrefix !== decision.locale
  if (
    defaultLocalePrefix ||
    nonCanonicalLocalePrefix ||
    route.canonicalPathNormalizationRequired ||
    historicalResourceSlug
  ) {
    return {
      action: 'redirect',
      statusCode: 301,
      redirectTo: canonicalPath,
      committedPublishVersion: decision.committedPublishVersion
    }
  }
  const queryPolicy = resolveMeilongCanonicalQueryPolicy(route, input.query ?? {})
  const publicBaseUrl = input.publicBaseUrl.replace(/\/$/u, '')
  const canonicalUrl = `${publicBaseUrl}${canonicalPath}${queryPolicy.canonicalSearch}`
  const indexEligible = decision.indexEligible && !queryPolicy.forceNoindex
  const hreflangEligible =
    !queryPolicy.forceNoindex &&
    (decision.indexEligible || categoryArchivePageSizeByPageKey.has(route.pageKey))
  const hreflang = hreflangEligible
    ? decision.alternates.map((alternate) => ({
        locale: alternate.locale,
        href: `${publicBaseUrl}${localizedPath(
          route,
          alternate.locale,
          decision.defaultLocale,
          alternate.slug
        )}${queryPolicy.canonicalSearch}`
      }))
    : []
  const defaultAlternate = hreflang.find((alternate) => alternate.locale === decision.defaultLocale)
  if (defaultAlternate) {
    hreflang.push({ locale: 'x-default', href: defaultAlternate.href })
  }
  return {
    action: 'render',
    canonicalUrl,
    locale: decision.locale,
    robots: indexEligible ? 'index,follow' : 'noindex,follow',
    hreflang,
    committedPublishVersion: decision.committedPublishVersion
  }
}

// resolveMeilongCanonicalQueryPolicy admits only canonical Blog pagination while failing all query noise safe for indexing.
function resolveMeilongCanonicalQueryPolicy(
  route: ResolvedMeilongPublicRoute,
  query: Record<string, unknown>
): MeilongCanonicalQueryPolicy {
  const entries = Object.entries(query).filter(([, value]) => value !== undefined)
  const pageEntry = entries.find(([key]) => key === 'page')
  if (!pageEntry) {
    return { canonicalSearch: '', forceNoindex: entries.length > 0 }
  }
  const page = canonicalPageNumber(pageEntry[1])
  if (!paginatedPageKeys.has(route.pageKey) || page === undefined) {
    return { canonicalSearch: '', forceNoindex: true }
  }
  return {
    canonicalSearch: page > 1 ? `?page=${page}` : '',
    forceNoindex: entries.some(([key]) => key !== 'page')
  }
}

// canonicalPageNumber accepts only the normalized positive decimal form that can safely identify one archive page.
export function canonicalPageNumber(value: unknown): number | undefined {
  if (typeof value !== 'string' || !/^[1-9]\d*$/u.test(value)) {
    return undefined
  }
  const page = Number(value)
  return Number.isSafeInteger(page) ? page : undefined
}

// localizedPath applies the default-locale no-prefix convention and swaps only a proven localized resource slug.
function localizedPath(
  route: ResolvedMeilongPublicRoute,
  locale: string,
  defaultLocale: string,
  localizedSlug?: string
): string {
  let path = route.pathWithoutLocale
  if (route.resource?.slug && localizedSlug && localizedSlug !== route.resource.slug) {
    const segments = path.split('/')
    segments[segments.length - 1] = encodeURIComponent(localizedSlug)
    path = segments.join('/')
  }
  return locale === defaultLocale ? path : `/${locale}${path}`
}

// isRetiredPublicPath prevents generic Blog and News detail matchers from reviving removed roots and aliases.
function isRetiredPublicPath(path: string): boolean {
  if (
    /^\/blog(?:\/|$)/iu.test(path) ||
    /^\/categories(?:\/|$)/iu.test(path) ||
    /^\/products$/iu.test(path) ||
    /^\/collections$/iu.test(path)
  ) {
    return true
  }
  const contentMatch = path.match(/^\/(?:blogs|news)\/([^/]+)(\/.*)?$/iu)
  const semanticSlug = contentMatch
    ? normalizeTerminalContentDetailSlug(contentMatch[1]!)
    : undefined
  if (!semanticSlug || !terminalContentDetailSlugSet.has(semanticSlug)) {
    return false
  }
  return semanticSlug !== 'categories' || contentMatch?.[2] === undefined
}

interface NormalizedPublicPath {
  rawPathname: string
  segments: string[]
}

// normalizePublicPath safely decodes and NFC-normalizes every segment while rejecting hierarchy-changing input.
function normalizePublicPath(path: string): NormalizedPublicPath | null {
  const rawPathname = requestPathname(path)
  const rawSegments = rawPathname.split('/').filter(Boolean)
  const segments: string[] = []
  for (const rawSegment of rawSegments) {
    let decodedSegment: string
    try {
      decodedSegment = decodeURIComponent(rawSegment).normalize('NFC')
    } catch {
      return null
    }
    if (
      decodedSegment.includes('/') ||
      decodedSegment.includes('\\') ||
      decodedSegment === '.' ||
      decodedSegment === '..'
    ) {
      return null
    }
    segments.push(decodedSegment)
  }
  return { rawPathname, segments }
}

// requestPathname removes query/hash noise and supplies the one leading slash used for canonical comparison.
function requestPathname(path: string): string {
  const pathname = path.split(/[?#]/u, 1)[0] || '/'
  return pathname.startsWith('/') ? pathname : `/${pathname}`
}

// encodePublicPath applies one deterministic percent-encoding to normalized decoded segments.
function encodePublicPath(segments: string[]): string {
  return segments.length > 0 ? `/${segments.map(encodeURIComponent).join('/')}` : '/'
}

// canonicalLocale returns Intl's unique BCP 47 spelling without treating ordinary page names as locales.
function canonicalLocale(value: string): string | undefined {
  if (!/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/u.test(value)) {
    return undefined
  }
  try {
    return Intl.getCanonicalLocales(value)[0]
  } catch {
    return undefined
  }
}

// normalizeTerminalContentDetailSlug gives reserved Blog/News detail slugs one case- and encoding-stable semantic identity.
function normalizeTerminalContentDetailSlug(slug: string): string | undefined {
  try {
    const decodedSlug = decodeURIComponent(slug).normalize('NFC')
    return decodedSlug.toLowerCase()
  } catch {
    return undefined
  }
}
