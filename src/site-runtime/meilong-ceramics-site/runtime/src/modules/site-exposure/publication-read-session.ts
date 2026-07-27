import { ServiceUnavailableException } from '@nestjs/common'
import {
  type HistoricalAliasNamespace,
  type ArticleCategoryReader,
  type PublicResourceReader,
  type PublicViewEnvelope,
  type PublicViewListResult,
  type PublicViewsReader,
  type SiteExposurePublication,
  type SitePagePolicy
} from '@oes/site-runtime-kit'

export type MeilongResourceCollection =
  | 'products'
  | 'blog'
  | 'news'
  | 'blog-category'
  | 'news-category'

const publicReaderKeyByCollection = {
  products: 'products',
  blog: 'blogs',
  news: 'news',
  'blog-category': 'articleCategories',
  'news-category': 'articleCategories'
} as const

const historicalAliasNamespaceByCollection: Partial<
  Record<MeilongResourceCollection, HistoricalAliasNamespace>
> = {
  blog: 'blog',
  news: 'news',
  'blog-category': 'article-category',
  'news-category': 'article-category'
}

// PublicationReadSession owns policy and full-resource caches for one bounded publication attempt.
export class PublicationReadSession {
  private readonly policyCache = new Map<string, Promise<SitePagePolicy>>()
  private readonly fullResourceCache = new Map<string, Promise<PublicViewEnvelope[]>>()

  constructor(
    readonly publication: SiteExposurePublication,
    private readonly publicViews: PublicViewsReader
  ) {}

  // getPagePolicy reads each page and locale policy at most once during this attempt.
  getPagePolicy(pageKey: string, locale: string): Promise<SitePagePolicy> {
    const key = `${pageKey}\u0000${locale}`
    const existing = this.policyCache.get(key)
    if (existing) {
      return existing
    }
    const pending = this.publicViews.exposure.getPagePolicy(pageKey, locale)
    this.policyCache.set(key, pending)
    return pending
  }

  // listAllPublishedResources drains and caches one collection and locale for this attempt only.
  listAllPublishedResources(
    collection: MeilongResourceCollection,
    locale: string
  ): Promise<PublicViewEnvelope[]> {
    const readerKey = publicReaderKeyByCollection[collection]
    const key = `${collection}\u0000${locale}`
    const existing = this.fullResourceCache.get(key)
    if (existing) {
      return existing
    }
    const pending = isCategoryCollection(collection)
      ? listArticleCategories(
          this.publicViews.articleCategories,
          locale,
          collection === 'blog-category' ? 'blog' : 'news'
        )
      : listAllPublishedResources(this.publicViews[readerKey], locale)
    this.fullResourceCache.set(key, pending)
    return pending
  }

  // listPublishedResourcesPage preserves caller cursor pagination without populating the full-resource cache.
  listPublishedResourcesPage(
    collection: MeilongResourceCollection,
    locale: string,
    limit: number,
    cursor?: string
  ): Promise<PublicViewListResult> {
    if (isCategoryCollection(collection)) {
      if (cursor) throw new ServiceUnavailableException('Article Category cursor pagination is unsupported')
      return this.publicViews.articleCategories.list({
        locale,
        contentTypes: [collection === 'blog-category' ? 'blog' : 'news']
      })
    }
    const readerKey = publicReaderKeyByCollection[collection]
    return this.publicViews[readerKey].list({ locale, limit, cursor })
  }

  // getPublishedResourceBySlug performs one exact-locale lookup without inventing fallback behavior.
  getPublishedResourceBySlug(
    collection: MeilongResourceCollection,
    slug: string,
    locale: string
  ): Promise<PublicViewEnvelope | null> {
    if (isCategoryCollection(collection)) {
      return this.publicViews.articleCategories.getBySlug(
        slug,
        locale,
        [collection === 'blog-category' ? 'blog' : 'news']
      )
    }
    const readerKey = publicReaderKeyByCollection[collection]
    return this.publicViews[readerKey].getBySlug(slug, locale)
  }

  // resolvePublishedHistoricalAlias follows the local alias index to the current published resource within this attempt.
  async resolvePublishedHistoricalAlias(
    collection: MeilongResourceCollection,
    slug: string,
    locale: string
  ): Promise<PublicViewEnvelope | null> {
    const namespace = historicalAliasNamespaceByCollection[collection]
    if (!namespace) {
      return null
    }
    const alias = await this.publicViews.historicalAliases.resolve({ namespace, locale, slug })
    if (!alias || alias.resourceType !== namespace || alias.locale !== locale) {
      return null
    }
    const current = isCategoryCollection(collection)
      ? await this.publicViews.articleCategories.getBySlug(
          alias.canonicalSlug,
          locale,
          [collection === 'blog-category' ? 'blog' : 'news']
        )
      : await this.publicViews[publicReaderKeyByCollection[collection]].getBySlug(
          alias.canonicalSlug,
          locale
        )
    if (
      !current ||
      current.status !== 'published' ||
      current.resourceType !== alias.resourceType ||
      current.resourceId !== alias.resourceId ||
      current.locale !== alias.locale ||
      current.slug !== alias.canonicalSlug
    ) {
      return null
    }
    return current
  }
}

/** listArticleCategories consumes Runtime Kit's membership-derived local Category reader without cursor emulation. */
async function listArticleCategories(
  reader: ArticleCategoryReader,
  locale: string,
  contentType: 'blog' | 'news'
): Promise<PublicViewEnvelope[]> {
  return (await reader.list({ locale, contentTypes: [contentType] })).items
}

/** isCategoryCollection distinguishes shared Article Category reads from ordinary paged resource readers. */
function isCategoryCollection(
  collection: MeilongResourceCollection
): collection is 'blog-category' | 'news-category' {
  return collection === 'blog-category' || collection === 'news-category'
}

// listAllPublishedResources drains only strictly advancing non-empty string cursors.
export async function listAllPublishedResources(
  reader: PublicResourceReader,
  locale: string
): Promise<PublicViewEnvelope[]> {
  const resources: PublicViewEnvelope[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined
  while (true) {
    const result = await reader.list({ locale, cursor, limit: 200 })
    resources.push(...result.items)
    const nextCursor: unknown = result.nextCursor
    if (nextCursor === null) {
      return resources
    }
    if (
      typeof nextCursor !== 'string' ||
      nextCursor.length === 0 ||
      seenCursors.has(nextCursor) ||
      (cursor !== undefined &&
        Buffer.compare(Buffer.from(nextCursor, 'utf8'), Buffer.from(cursor, 'utf8')) <= 0)
    ) {
      throw new ServiceUnavailableException('Published resource cursor did not advance')
    }
    seenCursors.add(nextCursor)
    cursor = nextCursor
  }
}
