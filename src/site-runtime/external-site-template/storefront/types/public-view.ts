export type ResourceCollection = 'products' | 'categories' | 'blog' | 'news'

export interface PublicViewEnvelope<TPayload = Record<string, unknown>> {
  siteId: string
  resourceType: 'product' | 'category' | 'blog' | 'news' | 'content'
  resourceId: string
  locale: string
  slug: string
  status: 'published' | 'unpublished' | 'deleted' | 'disabled' | 'draft_preview'
  publishVersion: number
  updatedAt: string
  payload: TPayload
}

export interface SeoPayload {
  title?: string
  description?: string
  image?: string
  canonical_url?: string
}

export interface PublicSiteConfig {
  siteName: string
  publicBaseUrl: string
  defaultLocale: string
  activeLocales: Array<{
    locale: string
    isDefault: boolean
    routePrefix: string
  }>
  preview: {
    indexing: 'noindex'
    cachePolicy: 'no-store'
  }
}

export interface SeoRouteIndex {
  publicBaseUrl: string
  defaultLocale: string
  routes: Array<{
    resourceType: 'product' | 'category' | 'blog' | 'news'
    locale: string
    slug: string
    path: string
    canonicalUrl: string
    updatedAt: string
  }>
}
