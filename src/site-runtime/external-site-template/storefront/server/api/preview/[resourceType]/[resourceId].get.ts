import { fetchSiteRuntime } from '../../../utils/site-runtime'

// getPreviewView proxies preview reads through Site Runtime and keeps OES preview calls off the browser.
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  setHeader(event, 'X-Robots-Tag', 'noindex, nofollow')
  const resourceType = getRouterParam(event, 'resourceType')
  const resourceId = getRouterParam(event, 'resourceId')
  const query = getQuery(event)
  return fetchSiteRuntime<Record<string, unknown>>(
    event,
    `/api/preview/${resourceType}/${resourceId}`,
    {
      locale: typeof query.locale === 'string' ? query.locale : undefined,
      token: typeof query.token === 'string' ? query.token : undefined
    }
  )
})
