import { readOptionalSingleQueryString } from '../../../../utils/public-query'
import { fetchSiteRuntime } from '../../../../utils/site-runtime'

// resolveContentRedirect proxies Blog / News historical slug lookup through the Nuxt server boundary.
export default defineEventHandler((event) => {
  const collection = getRouterParam(event, 'collection')
  const slug = getRouterParam(event, 'slug')
  const query = getQuery(event)
  return fetchSiteRuntime<{ redirectTo: string | null }>(
    event,
    `/api/public/redirects/${collection}/${slug}`,
    {
      locale: readOptionalSingleQueryString(query, 'locale')
    }
  )
})
