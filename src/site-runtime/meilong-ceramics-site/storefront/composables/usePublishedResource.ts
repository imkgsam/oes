import type {
  ContentCollection,
  PublicViewEnvelope,
  ResourceCollection,
  CategoryArchiveResponse,
  ContentArchivePageResponse
} from '../types/public-view'
import { normalizePublicReadFailure } from '../types/public-read-error'

export type ArticleCategoryConsumerPageKey =
  | 'BLOG_LIST'
  | 'BLOG_DETAIL'
  | 'BLOG_CATEGORY'
  | 'NEWS_LIST'
  | 'NEWS_DETAIL'
  | 'NEWS_CATEGORY'

// usePublishedResource reads one local published resource through Nuxt's server boundary.
export async function usePublishedResource(
  collection: ResourceCollection,
  slug: string,
  locale?: string
) {
  const key = `published:${collection}:${locale ?? 'default'}:${slug}`
  const result = await useAsyncData<PublicViewEnvelope>(key, () =>
    $fetch<PublicViewEnvelope>(`/api/public/${collection}/${slug}`, {
      query: { locale }
    })
  )
  throwPublicReadFailure(result.error.value, true)
  return result
}

// usePublishedList reads a local published collection through Nuxt's server boundary.
export async function usePublishedList(collection: ResourceCollection, locale?: string) {
  const key = `published-list:${collection}:${locale ?? 'default'}`
  const result = await useAsyncData<{ items: PublicViewEnvelope[]; nextCursor: string | null }>(
    key,
    () =>
      $fetch<{ items: PublicViewEnvelope[]; nextCursor: string | null }>(
        `/api/public/${collection}`,
        {
          query: { locale, limit: 48 }
        }
      )
  )
  throwPublicReadFailure(result.error.value)
  return result
}

interface ContentArchivePageOptions {
  locale?: string
  pageSize: number
  month?: number
  year?: number
}

interface CategoryArchivePageOptions {
  locale?: string
  pageSize?: number
  month?: number
  year?: number
}

// fetchContentArchivePage requests one bounded Runtime page for SSR or client-side News continuation.
export function fetchContentArchivePage(
  collection: ContentCollection,
  page: number,
  options: ContentArchivePageOptions
): Promise<ContentArchivePageResponse> {
  return $fetch<ContentArchivePageResponse>(`/api/public/article-archives/${collection}`, {
    query: { page, ...options }
  })
}

// useContentArchivePage owns the keyed SSR read for one Blog or News archive page.
export async function useContentArchivePage(
  collection: ContentCollection,
  page: number,
  options: ContentArchivePageOptions
) {
  const key = [
    'content-archive',
    collection,
    options.locale ?? 'default',
    page,
    options.pageSize,
    options.year ?? 'all-years',
    options.month ?? 'all-months'
  ].join(':')
  const result = await useAsyncData<ContentArchivePageResponse>(key, () =>
    fetchContentArchivePage(collection, page, options)
  )
  throwPublicReadFailure(result.error.value)
  return result
}

// useArticleCategories reads a localized category directory under the consuming page's own capability gate.
export async function useArticleCategories(
  collection: ContentCollection,
  pageKey: ArticleCategoryConsumerPageKey,
  locale?: string
) {
  const key = `article-categories:${collection}:${pageKey}:${locale ?? 'default'}`
  const result = await useAsyncData<{ items: PublicViewEnvelope[] }>(key, () =>
    $fetch<{ items: PublicViewEnvelope[] }>(`/api/public/article-categories/${collection}`, {
      query: { pageKey, locale }
    })
  )
  throwPublicReadFailure(result.error.value)
  return result
}

// fetchArticleCategoryArchivePage requests one already-filtered category page for SSR or News continuation.
export function fetchArticleCategoryArchivePage(
  collection: ContentCollection,
  slug: string,
  page: number,
  options: CategoryArchivePageOptions = {}
): Promise<CategoryArchiveResponse> {
  return $fetch<CategoryArchiveResponse>(`/api/public/article-category-archives/${collection}/${slug}`, {
    query: {
      locale: options.locale,
      page,
      pageSize: options.pageSize,
      month: options.month,
      year: options.year
    }
  })
}

// useArticleCategoryArchive reads one paginated Content Category archive from the local Runtime.
export async function useArticleCategoryArchive(
  collection: ContentCollection,
  slug: string,
  page: number,
  options: CategoryArchivePageOptions = {}
) {
  const locale = options.locale
  const pageSize = options.pageSize ?? 2
  const key = [
    'article-category-archive',
    collection,
    locale ?? 'default',
    slug,
    page,
    pageSize,
    options.year ?? 'all-years',
    options.month ?? 'all-months'
  ].join(':')
  const result = await useAsyncData<CategoryArchiveResponse>(key, () =>
    fetchArticleCategoryArchivePage(collection, slug, page, {
      locale,
      pageSize,
      month: options.month,
      year: options.year
    })
  )
  throwPublicReadFailure(result.error.value)
  return result
}

// resolvePublishedRedirect finds current canonical paths for Blog or News historical slugs.
export async function resolvePublishedRedirect(
  collection: ContentCollection,
  slug: string,
  locale?: string
): Promise<string | null> {
  const result = await $fetch<{ redirectTo: string | null }>(
    `/api/public/redirects/${collection}/${slug}`,
    {
      query: { locale }
    }
  )
  return result.redirectTo
}

// throwPublicReadFailure lets detail 404s reach local redirect handling while surfacing all other public-read failures.
function throwPublicReadFailure(failure: unknown, allowNotFound = false): void {
  if (!failure) {
    return
  }
  const normalized = normalizePublicReadFailure(failure)
  if (allowNotFound && normalized.statusCode === 404) {
    return
  }
  throw createError(normalized)
}
