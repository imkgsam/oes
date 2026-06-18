import type { PublicViewEnvelope, ResourceCollection } from '../types/public-view'

// usePublishedResource reads one local published resource through Nuxt's server boundary.
export async function usePublishedResource(
  collection: ResourceCollection,
  slug: string,
  locale?: string
) {
  const key = `published:${collection}:${locale ?? 'default'}:${slug}`
  return useAsyncData<PublicViewEnvelope>(key, () =>
    $fetch(`/api/public/${collection}/${slug}`, {
      query: { locale }
    })
  )
}

// usePublishedList reads a local published collection through Nuxt's server boundary.
export async function usePublishedList(collection: ResourceCollection, locale?: string) {
  const key = `published-list:${collection}:${locale ?? 'default'}`
  return useAsyncData<{ items: PublicViewEnvelope[]; nextCursor: string | null }>(key, () =>
    $fetch(`/api/public/${collection}`, {
      query: { locale, limit: 24 }
    })
  )
}
