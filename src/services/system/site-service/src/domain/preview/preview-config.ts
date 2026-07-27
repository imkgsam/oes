/** SITE_PREVIEW_TOKEN_SECRET identifies the shared explicit preview signing secret in Nest composition. */
export const SITE_PREVIEW_TOKEN_SECRET = Symbol('SITE_PREVIEW_TOKEN_SECRET')

/** requireSitePreviewTokenSecret fails composition without logging or returning missing secret material. */
export function requireSitePreviewTokenSecret(value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error('SITE_PREVIEW_TOKEN_SECRET is required')
  }
  return value
}
