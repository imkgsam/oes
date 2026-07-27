import { normalizePublicReadFailure } from '../types/public-read-error'
import {
  buildMeilongRoutePresentation,
  isMeilongTerminalNotFoundRoute,
  resolveCategoryArchiveRouteRead,
  resolveMeilongPublicRoute,
  type SiteRuntimeRouteDecision
} from '../types/site-route-policy'

// siteExposureMiddleware enforces the one committed locale, page, resource, canonical, hreflang, and robots policy before rendering.
export default defineNuxtRouteMiddleware(async (to) => {
  const route = resolveMeilongPublicRoute(to.path)
  if (isMeilongTerminalNotFoundRoute(route)) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  }
  const exposureSequence = beginSiteRouteExposure()
  let presentation = null
  if (route) {
    const requestFetch = useRequestFetch()
    const categoryArchive = resolveCategoryArchiveRouteRead(route, to.query)
    let decision: SiteRuntimeRouteDecision
    try {
      decision = await requestFetch<SiteRuntimeRouteDecision>(
        '/api/public/site-exposure/route-decision',
        {
          query: {
            pageKey: route.pageKey,
            locale: route.requestedLocale,
            resourceCollection: route.resource?.collection,
            slug: route.resource?.slug,
            archivePage: categoryArchive?.page,
            archivePageSize: categoryArchive?.pageSize
          }
        }
      )
    } catch (failure) {
      throw createError(normalizePublicReadFailure(failure))
    }
    presentation = buildMeilongRoutePresentation({
      route,
      decision,
      publicBaseUrl: decision.publicBaseUrl,
      query: to.query
    })
    if (presentation.action === 'not-found') {
      throw createError({ statusCode: 404, statusMessage: 'Page not found' })
    }
    if (presentation.action === 'redirect') {
      return navigateTo(`${presentation.redirectTo}${requestSuffix(to.fullPath, to.path)}`, {
        redirectCode: 301
      })
    }
  }
  commitSiteRouteExposure(presentation, exposureSequence)
})

// requestSuffix preserves query and hash data when removing a default-locale prefix.
function requestSuffix(fullPath: string, path: string): string {
  return fullPath.startsWith(path) ? fullPath.slice(path.length) : ''
}
