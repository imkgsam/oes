import type { PublicViewEnvelope } from '../../../../types/public-view'
import { readOptionalSingleQueryString } from '../../../utils/public-query'
import { fetchSiteRuntime } from '../../../utils/site-runtime'

// listVisibleCategories proxies computed Blog / News category directory data through the Nuxt server boundary.
export default defineEventHandler((event) => {
  const contentType = getRouterParam(event, 'contentType')
  const query = getQuery(event)
  return fetchSiteRuntime<{ items: PublicViewEnvelope[] }>(event, `/api/public/article-categories/${contentType}`, {
    pageKey: readOptionalSingleQueryString(query, 'pageKey'),
    locale: readOptionalSingleQueryString(query, 'locale')
  })
})
