export type ResourceCollection = 'products' | 'categories' | 'blog' | 'news'
export type ContentCollection = 'blog' | 'news'

export interface PublicViewEnvelope<TPayload = Record<string, unknown>> {
  siteId: string
  resourceType: 'product' | 'category' | 'blog' | 'news' | 'article-category' | 'content'
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
  committedPublishVersion: number
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
  activeLocales: string[]
  committedPublishVersion: number
  publishedAt: string
  pages: Array<{
    pageKey: string
    locale: string
    indexEligible: boolean
  }>
  routes: Array<{
    resourceType: 'product' | 'blog' | 'news' | 'blog_category' | 'news_category'
    locale: string
    slug: string
    path: string
    canonicalUrl: string
    updatedAt: string
    pageKey: string
    committedPublishVersion: number
  }>
}

export interface CategoryArchiveResponse {
  category: PublicViewEnvelope
  items: PublicViewEnvelope[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
  canonicalPath: string
  canonicalUrl: string
  exists: true
  indexEligible: boolean
  availableYears: number[]
  committedPublishVersion: number
  redirectTo?: string
}

export interface ContentArchivePageResponse {
  items: PublicViewEnvelope[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
  availableYears: number[]
  committedPublishVersion: number
}
