import type { ContentArchivePageResponse } from '../../../../types/public-view'
import { readOptionalSingleQueryString } from '../../../utils/public-query'
import { fetchSiteRuntime } from '../../../utils/site-runtime'

// getContentArchivePage proxies one bounded Blog or News page without coercing public query strings.
export default defineEventHandler((event) => {
  const contentType = getRouterParam(event, 'contentType')
  const query = getQuery(event)
  return fetchSiteRuntime<ContentArchivePageResponse>(
    event,
    `/api/public/article-archives/${contentType}`,
    {
      locale: readOptionalSingleQueryString(query, 'locale'),
      page: readOptionalSingleQueryString(query, 'page'),
      pageSize: readOptionalSingleQueryString(query, 'pageSize'),
      month: readOptionalSingleQueryString(query, 'month'),
      year: readOptionalSingleQueryString(query, 'year')
    }
  )
})
