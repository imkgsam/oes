import type { CategoryArchiveResponse } from '../../../../../types/public-view'
import { readOptionalSingleQueryString } from '../../../../utils/public-query'
import { fetchSiteRuntime } from '../../../../utils/site-runtime'

// getCategoryArchive proxies paginated Content Category archive reads through the Nuxt server boundary.
export default defineEventHandler(async (event) => {
  const contentType = getRouterParam(event, 'contentType')
  const slug = getRouterParam(event, 'slug')
  const query = getQuery(event)
  return fetchSiteRuntime<CategoryArchiveResponse>(
    event,
    `/api/public/article-category-archives/${contentType}/${slug}`,
    {
      locale: readOptionalSingleQueryString(query, 'locale'),
      page: readOptionalSingleQueryString(query, 'page'),
      pageSize: readOptionalSingleQueryString(query, 'pageSize'),
      month: readOptionalSingleQueryString(query, 'month'),
      year: readOptionalSingleQueryString(query, 'year')
    }
  )
})
