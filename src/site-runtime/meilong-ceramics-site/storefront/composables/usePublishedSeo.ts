import type { PublicSiteConfig, PublicViewEnvelope, ResourceCollection, SeoPayload } from '../types/public-view'

// usePublishedSeo owns canonical, meta, social tags, and structured data for public pages.
export function usePublishedSeo(
  collection: ResourceCollection,
  resource: Ref<PublicViewEnvelope | null | undefined>,
  siteConfig: Ref<PublicSiteConfig | null | undefined>
) {
  const route = useRoute()
  const payload = computed(() => resource.value?.payload ?? {})
  const seo = computed(() => (payload.value.seo ?? {}) as SeoPayload)
  const title = computed(() => seo.value.title ?? displayTitle(payload.value) ?? siteConfig.value?.siteName)
  const description = computed(() => seo.value.description ?? summary(payload.value))
  const image = computed(() => seo.value.image ?? primaryImage(payload.value))
  const canonical = computed(
    () =>
      seo.value.canonical_url ??
      `${siteConfig.value?.publicBaseUrl ?? useRuntimeConfig().public.sitePublicBaseUrl}${route.path}`
  )

  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogImage: image,
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: image
  })

  useHead({
    link: [{ rel: 'canonical', href: canonical }],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: computed(() =>
          JSON.stringify(buildStructuredData(collection, resource.value, canonical.value, image.value))
        )
      }
    ]
  })
}

// displayTitle normalizes public view payload title fields without assuming a site design.
function displayTitle(payload: Record<string, unknown>): string | undefined {
  return stringField(payload.display_title) ?? stringField(payload.title)
}

// summary normalizes public view summary fields for meta descriptions.
function summary(payload: Record<string, unknown>): string | undefined {
  return stringField(payload.summary) ?? stringField(payload.display_description)
}

// primaryImage extracts the first product image or content cover image for social metadata.
function primaryImage(payload: Record<string, unknown>): string | undefined {
  const images = payload.images
  if (Array.isArray(images) && images.length > 0 && typeof images[0]?.url === 'string') {
    return images[0].url
  }
  return stringField(payload.cover_image) ?? stringField(payload.image)
}

// stringField safely narrows payload fields into strings.
function stringField(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

// buildStructuredData maps P1 public view types to lightweight schema.org shapes.
function buildStructuredData(
  collection: ResourceCollection,
  resource: PublicViewEnvelope | null | undefined,
  canonical: string,
  image?: string
): Record<string, unknown> {
  const payload = resource?.payload ?? {}
  if (collection === 'products') {
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: displayTitle(payload),
      description: summary(payload),
      image,
      url: canonical
    }
  }
  if (collection === 'categories') {
    return {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: displayTitle(payload),
      description: summary(payload),
      url: canonical
    }
  }
  return {
    '@context': 'https://schema.org',
    '@type': collection === 'blog' ? 'BlogPosting' : 'NewsArticle',
    headline: displayTitle(payload),
    description: summary(payload),
    image,
    datePublished: stringField(payload.published_at),
    url: canonical
  }
}
