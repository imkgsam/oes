import type {
  PublicSiteConfig,
  PublicViewEnvelope,
  ResourceCollection,
  SeoPayload
} from '../types/public-view'

// usePublishedSeo consumes the global canonical and owns resource meta, social tags, and structured data.
export function usePublishedSeo(
  collection: ResourceCollection,
  resource: Ref<PublicViewEnvelope | null | undefined>,
  siteConfig: Ref<PublicSiteConfig | null | undefined>
) {
  const route = useRoute()
  const payload = computed(() => resource.value?.payload ?? {})
  const seo = computed(() => (payload.value.seo ?? {}) as SeoPayload)
  const title = computed(
    () => seo.value.title ?? displayTitle(payload.value) ?? resource.value?.slug
  )
  const description = computed(() => seo.value.description ?? summary(payload.value))
  const image = computed(() => seo.value.image ?? primaryImage(payload.value))
  const routeCanonical = useSiteRouteCanonical()
  const canonical = computed(
    () => routeCanonical.value ?? `${publicBaseUrl(siteConfig.value)}${route.path}`
  )
  const socialImage = computed(() => absoluteUrl(image.value, canonical.value))

  useSeoMeta({
    title: () => title.value,
    description: () => description.value,
    ogType: collection === 'blog' || collection === 'news' ? 'article' : 'website',
    ogTitle: () => title.value,
    ogDescription: () => description.value,
    ogImage: () => socialImage.value,
    twitterCard: 'summary_large_image',
    twitterTitle: () => title.value,
    twitterDescription: () => description.value,
    twitterImage: () => socialImage.value
  })

  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: computed(() =>
          JSON.stringify(
            buildStructuredData(
              collection,
              resource.value,
              canonical.value,
              socialImage.value,
              siteConfig.value?.siteName
            )
          )
        )
      }
    ]
  })
}

// publicBaseUrl normalizes the configured public origin before canonical route paths are appended.
function publicBaseUrl(siteConfig: PublicSiteConfig | null | undefined): string {
  return (siteConfig?.publicBaseUrl ?? useRuntimeConfig().public.sitePublicBaseUrl).replace(
    /\/$/,
    ''
  )
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

// absoluteUrl converts relative media values into crawlable public URLs for metadata and structured data.
function absoluteUrl(value: string | undefined, canonical: string): string | undefined {
  if (!value) {
    return undefined
  }
  try {
    return new URL(value, canonical).toString()
  } catch {
    return undefined
  }
}

// buildStructuredData maps P1 public view types to lightweight schema.org shapes.
function buildStructuredData(
  collection: ResourceCollection,
  resource: PublicViewEnvelope | null | undefined,
  canonical: string,
  image?: string,
  siteName?: string
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
    dateModified: resource?.updatedAt,
    wordCount: wordCount(payload.body_html),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonical
    },
    author: {
      '@type': 'Person',
      name: stringField(payload.author_display_name) ?? 'Editorial Team'
    },
    publisher: {
      '@type': 'Organization',
      name: siteName ?? 'Meilong Ceramics'
    },
    url: canonical
  }
}

// wordCount derives structured-data length metadata from already-published HTML without exposing or duplicating the article body.
function wordCount(value: unknown): number | undefined {
  const html = stringField(value)
  if (!html) {
    return undefined
  }

  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(nbsp|#160);/gi, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .trim()

  const count = text.length > 0 ? text.split(/\s+/).length : 0
  return count > 0 ? count : undefined
}
