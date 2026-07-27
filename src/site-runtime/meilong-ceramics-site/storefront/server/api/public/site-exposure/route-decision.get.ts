import type { SiteRuntimeRouteDecision } from '../../../../types/site-route-policy'
import { readOptionalSingleQueryString } from '../../../utils/public-query'
import { fetchSiteRuntime } from '../../../utils/site-runtime'

// routeDecision proxies one public-safe page/locale/resource decision from the local Site Runtime reader.
export default defineEventHandler((event) => {
  const query = getQuery(event)
  const slug = readOptionalSingleQueryString(query, 'slug')
  const archivePage = readOptionalSingleQueryString(query, 'archivePage')
  const archivePageSize = readOptionalSingleQueryString(query, 'archivePageSize')
  assertArchiveThresholdSlug(slug, archivePage, archivePageSize)
  return fetchSiteRuntime<SiteRuntimeRouteDecision>(
    event,
    '/api/public/site-exposure/route-decision',
    {
      pageKey: readOptionalSingleQueryString(query, 'pageKey'),
      locale: readOptionalSingleQueryString(query, 'locale'),
      resourceCollection: readOptionalSingleQueryString(query, 'resourceCollection'),
      slug,
      archivePage,
      archivePageSize
    }
  )
})

// assertArchiveThresholdSlug rejects incomplete Category detail identity before the Storefront proxy can call Runtime.
function assertArchiveThresholdSlug(
  slug: string | undefined,
  archivePage: string | undefined,
  archivePageSize: string | undefined
): void {
  const hasThreshold = archivePage !== undefined || archivePageSize !== undefined
  if (hasThreshold && (!slug || slug.trim() !== slug || slug.normalize('NFC') !== slug)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Category archive threshold requires a canonical slug'
    })
  }
}
