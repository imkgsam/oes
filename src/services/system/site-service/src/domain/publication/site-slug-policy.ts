export interface SiteSlugRecord {
  siteId: string
  resourceType: string
  locale: string
  slug: string
  resourceId: string
}

export type DynamicSiteSlugNamespace = 'blog' | 'news' | 'article-category'

/** SiteSlugConflictError reports duplicate public slug conflicts inside one site/resource/locale scope. */
export class SiteSlugConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SiteSlugConflictError'
  }
}

/** normalizeSiteSlug produces the single comparison and persistence form used by dynamic slug writes and reads. */
export function normalizeSiteSlug(slug: string): string {
  const normalized = slug.trim().normalize('NFKC').toLowerCase()
  if (!normalized) {
    throw new Error('slug is required')
  }
  return normalized
}

/** siteSlugNamespaceForContentType keeps Article storage sharing separate from Blog and News URL ownership. */
export function siteSlugNamespaceForContentType(
  contentType: string
): Extract<DynamicSiteSlugNamespace, 'blog' | 'news'> {
  if (contentType !== 'blog' && contentType !== 'news') {
    throw new Error('contentType must be blog or news')
  }
  return contentType
}

/** assertSlugAvailable enforces site_id + resource_type + locale + slug uniqueness. */
export function assertSlugAvailable(existing: SiteSlugRecord[], candidate: SiteSlugRecord): void {
  const conflict = existing.find(
    (record) =>
      record.siteId === candidate.siteId &&
      record.resourceType === candidate.resourceType &&
      record.locale === candidate.locale &&
      normalizeSiteSlug(record.slug) === normalizeSiteSlug(candidate.slug) &&
      record.resourceId !== candidate.resourceId
  )

  if (conflict) {
    throw new SiteSlugConflictError(
      `slug ${candidate.slug} is already used by ${conflict.resourceType}:${conflict.resourceId}`
    )
  }
}
