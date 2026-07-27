import type { PublicViewEnvelope } from '../types/public-view'

// categoryArchiveSeoTitle distinguishes paginated category archives in search and social previews.
export function categoryArchiveSeoTitle(categoryTitle: string, page: number): string {
  const archiveTitle = `${categoryTitle} Guides | The Material Edit | MAIDSTONE | DXV`
  return page === 1 ? archiveTitle : `${archiveTitle} - Page ${page}`
}

// categoryArchiveDescription prioritizes editorial SEO copy while retaining a useful indexable fallback.
export function categoryArchiveDescription(categoryTitle: string, payload: Record<string, unknown>): string {
  const seo = payload.seo
  const seoDescription = seo && typeof seo === 'object'
    ? textField((seo as Record<string, unknown>).description)
    : undefined
  return seoDescription ?? textField(payload.archive_intro) ?? `Published guides and ideas about ${categoryTitle}.`
}

// buildCategoryArchiveStructuredData serializes only the visible category articles into an indexable CollectionPage.
export function buildCategoryArchiveStructuredData(
  items: PublicViewEnvelope[],
  canonicalUrl: string,
  categoryTitle: string,
  description: string,
  page: number,
  pageSize: number,
  articlePath: (slug: string) => string
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: categoryArchiveSeoTitle(categoryTitle, page),
    description,
    url: canonicalUrl,
    mainEntity: {
      '@type': 'ItemList',
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: (page - 1) * pageSize + index + 1,
        item: {
          '@type': 'BlogPosting',
          headline: textField(item.payload.title) ?? item.slug,
          description: textField(item.payload.summary),
          datePublished: textField(item.payload.published_at),
          image: absoluteUrl(textField(item.payload.cover_image), canonicalUrl),
          url: new URL(articlePath(item.slug), canonicalUrl).toString()
        }
      }))
    }
  }
}

// absoluteUrl converts a published media path into a valid absolute URL for structured data.
function absoluteUrl(value: string | undefined, baseUrl: string): string | undefined {
  if (!value) {
    return undefined
  }

  try {
    return new URL(value, baseUrl).toString()
  } catch {
    return undefined
  }
}

// textField narrows unknown public-view payload values before they are emitted to JSON-LD.
function textField(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}
