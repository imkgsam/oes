import { fetchSiteRuntime } from '../../../utils/site-runtime'

// getPreviewView proxies preview reads through Site Runtime and keeps OES preview calls off the browser.
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  setHeader(event, 'X-Robots-Tag', 'noindex, nofollow')
  const resourceType = getRouterParam(event, 'resourceType')
  const resourceId = getRouterParam(event, 'resourceId')
  const query = getQuery(event)
  try {
    return await fetchSiteRuntime<Record<string, unknown>>(
      event,
      `/api/preview/${resourceType}/${resourceId}`,
      {
        locale: typeof query.locale === 'string' ? query.locale : undefined,
        token: typeof query.token === 'string' ? query.token : undefined
      }
    )
  } catch {
    setResponseStatus(event, 200)
    return {
      preview_view: {
        status: 'draft_preview',
        payload: {
          title: 'Preview unavailable',
          summary: 'The preview bridge is reachable, but no valid OES draft preview is available locally.'
        }
      },
      noindex: true,
      cache_policy: 'no-store',
      locale: typeof query.locale === 'string' ? query.locale : undefined,
      resource_type: resourceType,
      resource_id: resourceId
    }
  }
})
