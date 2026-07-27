import type { PublicViewEnvelope } from '../../../../types/public-view'
import { readOptionalSingleQueryString } from '../../../utils/public-query'
import { requireGenericPublicListCollection } from '../../../utils/public-resource-collection'
import { fetchSiteRuntime } from '../../../utils/site-runtime'

// listCollection proxies local published lists through the Nuxt server boundary.
export default defineEventHandler((event) => {
  const collection = requireGenericPublicListCollection(getRouterParam(event, 'collection'))
  const query = getQuery(event)
  return fetchSiteRuntime<{ items: PublicViewEnvelope[]; nextCursor: string | null }>(
    event,
    `/api/public/resources/${collection}`,
    {
      locale: readOptionalSingleQueryString(query, 'locale'),
      limit: readOptionalSingleQueryString(query, 'limit'),
      cursor: readOptionalSingleQueryString(query, 'cursor')
    }
  )
})
