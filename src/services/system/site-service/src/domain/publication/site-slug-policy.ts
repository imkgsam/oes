export interface SiteSlugRecord {
  siteId: string
  resourceType: string
  locale: string
  slug: string
  resourceId: string
}

/** SiteSlugConflictError reports duplicate public slug conflicts inside one site/resource/locale scope. */
export class SiteSlugConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SiteSlugConflictError'
  }
}

/** assertSlugAvailable enforces site_id + resource_type + locale + slug uniqueness. */
export function assertSlugAvailable(existing: SiteSlugRecord[], candidate: SiteSlugRecord): void {
  const conflict = existing.find(
    (record) =>
      record.siteId === candidate.siteId &&
      record.resourceType === candidate.resourceType &&
      record.locale === candidate.locale &&
      record.slug === candidate.slug &&
      record.resourceId !== candidate.resourceId
  )

  if (conflict) {
    throw new SiteSlugConflictError(
      `slug ${candidate.slug} is already used by ${conflict.resourceType}:${conflict.resourceId}`
    )
  }
}
