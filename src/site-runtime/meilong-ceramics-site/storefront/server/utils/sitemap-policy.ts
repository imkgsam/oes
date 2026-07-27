import type { SeoRouteIndex } from '../../types/public-view'
import {
  INSPIRATION_CATEGORY_INVENTORY,
  inspirationCategoryPath
} from '../../data/inspiration-category-inventory'

export interface SitemapEntry {
  canonicalUrl: string
  updatedAt: string
}

const inspirationCategoryPaths = INSPIRATION_CATEGORY_INVENTORY.map(({ slug }) =>
  inspirationCategoryPath(slug)
)

const staticPathsByPageKey = new Map<string, readonly string[]>([
  ['HOME', ['/']],
  ['ABOUT', ['/about']],
  ['CONTACT', ['/contact']],
  ['FAQ', ['/faqs']],
  ['WARRANTY', ['/warranty']],
  ['PRIVACY_POLICY', ['/privacy-policy']],
  ['TERMS_CONDITIONS', ['/terms-conditions']],
  ['RETURNS_REFUNDS', ['/returns-refunds']],
  ['SHIPPING_DELIVERY', ['/shipping-delivery']],
  ['COLLECTION_LIST', ['/product/collections']],
  ['INSPIRATION', ['/inspirations']],
  ['INSPIRATION_CATEGORY', inspirationCategoryPaths],
  ['BLOG_LIST', ['/blogs']],
  ['NEWS_LIST', ['/news']],
  ['SERIES', ['/series']]
])

// buildSitemapEntries merges eligible Storefront routes only when every dynamic row belongs to the same committed publication.
export function buildSitemapEntries(index: SeoRouteIndex): SitemapEntry[] {
  if (
    index.routes.some((route) => route.committedPublishVersion !== index.committedPublishVersion)
  ) {
    throw new Error('Sitemap routes do not share one committed publication version')
  }
  const staticEntries = index.pages.flatMap((page) => {
    const paths = staticPathsByPageKey.get(page.pageKey)
    if (!paths || !page.indexEligible) {
      return []
    }
    return paths.map((path) => {
      const localizedPath =
        page.locale === index.defaultLocale ? path : `/${page.locale}${path === '/' ? '' : path}`
      return {
        canonicalUrl: `${trimTrailingSlash(index.publicBaseUrl)}${localizedPath}`,
        updatedAt: index.publishedAt
      }
    })
  })
  const dynamicEntries = index.routes.map((route) => ({
    canonicalUrl: route.canonicalUrl,
    updatedAt: route.updatedAt
  }))
  return uniqueEntries([...staticEntries, ...dynamicEntries])
}

// uniqueEntries preserves the first deterministic entry for each canonical URL.
function uniqueEntries(entries: SitemapEntry[]): SitemapEntry[] {
  const byUrl = new Map<string, SitemapEntry>()
  for (const entry of entries) {
    if (!byUrl.has(entry.canonicalUrl)) {
      byUrl.set(entry.canonicalUrl, entry)
    }
  }
  return [...byUrl.values()]
}

// trimTrailingSlash normalizes the public origin without changing the canonical home slash.
function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
}
