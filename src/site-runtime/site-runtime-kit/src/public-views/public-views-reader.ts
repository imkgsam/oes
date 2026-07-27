import type {
  HistoricalAliasNamespace,
  HistoricalAliasResolution,
  LocalPublishedStore,
  PublishedResourceIdentity,
  PublicViewEnvelope,
  ResourceType,
  SiteExposurePublication,
  StoredPublishedResource
} from '../types'

export interface PublicViewListOptions {
  locale?: string
  cursor?: string
  limit?: number
}

export interface PublicViewListResult {
  items: PublicViewEnvelope[]
  nextCursor: string | null
}

export interface PublicResourceReader {
  list(options?: PublicViewListOptions): Promise<PublicViewListResult>
  getBySlug(slug: string, locale: string): Promise<PublicViewEnvelope | null>
}

export interface FaqDirectoryReader {
  get(locale: string): Promise<PublicViewEnvelope | null>
}

export type ArticleContentType = 'blog' | 'news'

export interface ArticleCategoryListOptions {
  locale: string
  contentTypes?: readonly ArticleContentType[]
}

export interface ArticleCategoryView extends PublicViewEnvelope {
  articleCount: number
  blogCount: number
  newsCount: number
}

export interface ArticleCategoryReader {
  list(options: ArticleCategoryListOptions): Promise<{ items: ArticleCategoryView[]; nextCursor: null }>
  getBySlug(slug: string, locale: string, contentTypes?: readonly ArticleContentType[]): Promise<ArticleCategoryView | null>
}

export interface HistoricalAliasLookup {
  namespace: HistoricalAliasNamespace
  locale: string
  slug: string
}

// HistoricalAliasesReader exposes only stable identity and current canonical metadata for server-side redirects.
export class HistoricalAliasesReader {
  constructor(private readonly store: LocalPublishedStore, private readonly siteId: string) {}

  // resolve performs one indexed local lookup and never returns draft or public-view payload data.
  resolve(input: HistoricalAliasLookup): Promise<HistoricalAliasResolution | null> {
    return this.store.resolveHistoricalAlias({ siteId: this.siteId, ...input })
  }
}

export interface SitePagePolicy {
  pageKey: string
  locale: string
  enabled: boolean
  indexable: boolean
  localeActive: boolean
  localeSupported: boolean
  accessible: boolean
  indexEligible: boolean
  supportedLocales: string[]
  committedPublishVersion: number
}

// SiteExposureReader exposes only committed public-safe locale, page, routing, and SEO governance.
export class SiteExposureReader {
  constructor(private readonly store: LocalPublishedStore, private readonly siteId: string) {}

  // getPublication returns the single exposure payload committed with the current local publish version.
  getPublication(): Promise<SiteExposurePublication | null> {
    return this.store.getSiteExposurePublication(this.siteId)
  }

  // getPagePolicy derives fail-closed page accessibility and base index eligibility for one locale.
  async getPagePolicy(pageKey: string, locale: string): Promise<SitePagePolicy> {
    const publication = await this.getPublication()
    const page = publication?.pages.find((candidate) => candidate.pageKey === pageKey)
    const localeActive = publication?.activeLocales.includes(locale) ?? false
    const localeSupported = page?.supportedLocales.includes(locale) ?? false
    const enabled = page?.enabled ?? false
    const accessible = enabled && localeActive && localeSupported
    return {
      pageKey,
      locale,
      enabled,
      indexable: page?.indexable ?? false,
      localeActive,
      localeSupported,
      accessible,
      indexEligible: accessible && (page?.indexable ?? false),
      supportedLocales: page ? [...page.supportedLocales] : [],
      committedPublishVersion: publication?.publishVersion ?? 0
    }
  }

  // isResourceLocaleAvailable checks active-locale and published-resource state without cross-locale fallback.
  async isResourceLocaleAvailable(input: PublishedResourceIdentity): Promise<boolean> {
    const publication = await this.getPublication()
    if (!publication?.activeLocales.includes(input.locale)) {
      return false
    }
    const resource = await this.store.getPublishedResource({ siteId: this.siteId, ...input })
    return Boolean(resource && resource.status === 'published')
  }
}

// PublicViewsReader exposes stable local public view readers for storefront SSR and backend APIs.
export class PublicViewsReader {
  readonly products: PublicResourceReader
  readonly categories: PublicResourceReader
  readonly contents: PublicResourceReader
  readonly blogs: PublicResourceReader
  readonly news: PublicResourceReader
  readonly articleCategories: ArticleCategoryReader
  readonly faq: FaqDirectoryReader
  readonly historicalAliases: HistoricalAliasesReader
  readonly exposure: SiteExposureReader

  constructor(private readonly store: LocalPublishedStore, private readonly siteId: string) {
    this.products = this.createResourceReader('product')
    this.categories = this.createResourceReader('category')
    this.contents = this.createResourceReader('content')
    this.blogs = this.createResourceReader('blog')
    this.news = this.createResourceReader('news')
    this.articleCategories = new LocalArticleCategoryReader(store, siteId)
    this.faq = {
      get: async (locale) => {
        const item = await this.store.getPublishedResource({ siteId, resourceType: 'faq', resourceId: `${siteId}:faq-directory`, locale })
        return item?.status === 'published' ? mapStoredResource(item) : null
      }
    }
    this.historicalAliases = new HistoricalAliasesReader(store, siteId)
    this.exposure = new SiteExposureReader(store, siteId)
  }

  // createResourceReader binds list and slug lookups to one P1 resource type.
  private createResourceReader(resourceType: ResourceType): PublicResourceReader {
    return {
      list: async (options = {}) => {
        const result = await this.store.listPublishedResources({
          siteId: this.siteId,
          resourceType,
          locale: options.locale,
          status: 'published',
          cursor: options.cursor,
          limit: options.limit
        })
        return {
          items: result.items.map(mapStoredResource),
          nextCursor: result.nextCursor
        }
      },
      getBySlug: async (slug, locale) => {
        const item = await this.store.getPublishedResourceBySlug({
          siteId: this.siteId,
          resourceType,
          slug,
          locale,
          status: 'published'
        })
        return item ? mapStoredResource(item) : null
      }
    }
  }
}

// LocalArticleCategoryReader derives archive candidates exclusively from the currently committed local Article and Category views.
class LocalArticleCategoryReader implements ArticleCategoryReader {
  constructor(private readonly store: LocalPublishedStore, private readonly siteId: string) {}

  async list(options: ArticleCategoryListOptions): Promise<{ items: ArticleCategoryView[]; nextCursor: null }> {
    const categories = await this.listLocal('article-category', options.locale)
    const counts = await this.countPublishedArticles(options.locale, options.contentTypes)
    const items = categories
      .map((category) => this.toEligibleCategory(category, counts))
      .filter((category): category is ArticleCategoryView => category !== null)
      .sort((left, right) => categoryRank(left) - categoryRank(right) || left.resourceId.localeCompare(right.resourceId))
    return { items, nextCursor: null }
  }

  async getBySlug(slug: string, locale: string, contentTypes?: readonly ArticleContentType[]): Promise<ArticleCategoryView | null> {
    const category = await this.store.getPublishedResourceBySlug({ siteId: this.siteId, resourceType: 'article-category', slug, locale, status: 'published' })
    if (!category) return null
    return this.toEligibleCategory(category, await this.countPublishedArticles(locale, contentTypes))
  }

  private async countPublishedArticles(locale: string, contentTypes?: readonly ArticleContentType[]) {
    const selected = contentTypes?.length ? [...new Set(contentTypes)] : ['blog', 'news'] as ArticleContentType[]
    const counts = new Map<string, { articleCount: number; blogCount: number; newsCount: number }>()
    for (const resourceType of selected) {
      for (const article of await this.listLocal(resourceType, locale)) {
        const categoryIds = readCategoryIds(article)
        for (const categoryId of categoryIds) {
          const current = counts.get(categoryId) ?? { articleCount: 0, blogCount: 0, newsCount: 0 }
          current.articleCount += 1
          if (resourceType === 'blog') current.blogCount += 1
          else current.newsCount += 1
          counts.set(categoryId, current)
        }
      }
    }
    return counts
  }

  private async listLocal(resourceType: ResourceType, locale: string): Promise<StoredPublishedResource[]> {
    const items: StoredPublishedResource[] = []
    let cursor: string | undefined
    do {
      const page = await this.store.listPublishedResources({ siteId: this.siteId, resourceType, locale, status: 'published', cursor, limit: 500 })
      items.push(...page.items)
      cursor = page.nextCursor ?? undefined
    } while (cursor)
    return items
  }

  private toEligibleCategory(category: StoredPublishedResource, counts: Map<string, { articleCount: number; blogCount: number; newsCount: number }>): ArticleCategoryView | null {
    const count = counts.get(category.resourceId)
    if (!count || count.articleCount === 0) return null
    return { ...mapStoredResource(category), ...count }
  }
}

/** readCategoryIds tolerates malformed local payloads by treating them as non-membership rather than exposing a Category. */
function readCategoryIds(resource: StoredPublishedResource): string[] {
  try {
    const categoryIds = (JSON.parse(resource.payloadJson) as { category_ids?: unknown }).category_ids
    return Array.isArray(categoryIds) ? categoryIds.filter((value): value is string => typeof value === 'string') : []
  } catch {
    return []
  }
}

/** categoryRank extracts the one global Category rank while preserving a deterministic default for legacy payloads. */
function categoryRank(category: ArticleCategoryView): number {
  const value = (category.payload as { sort_order?: unknown }).sort_order
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

// mapStoredResource converts a local SQLite resource row into the package public view envelope.
export function mapStoredResource(resource: StoredPublishedResource): PublicViewEnvelope {
  return {
    siteId: resource.siteId,
    resourceType: resource.resourceType,
    resourceId: resource.resourceId,
    slug: resource.slug,
    locale: resource.locale,
    status: resource.status,
    publishVersion: resource.publishVersion,
    updatedAt: resource.updatedAt,
    payload: JSON.parse(resource.payloadJson)
  }
}
