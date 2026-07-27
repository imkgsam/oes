import type { PublicViewEnvelope } from '../../../../types/public-view'
import { readOptionalSingleQueryString } from '../../../utils/public-query'
import { requireGenericPublicDetailCollection } from '../../../utils/public-resource-collection'
import { fetchSiteRuntime } from '../../../utils/site-runtime'

// getPublishedResource proxies one local published public view through the Nuxt server boundary.
export default defineEventHandler(async (event) => {
  const collection = requireGenericPublicDetailCollection(getRouterParam(event, 'collection'))
  const slug = getRouterParam(event, 'slug')
  const query = getQuery(event)
  return fetchSiteRuntime<PublicViewEnvelope>(
    event,
    `/api/public/resources/${collection}/${slug}`,
    {
      locale: readOptionalSingleQueryString(query, 'locale')
    }
  )
})
