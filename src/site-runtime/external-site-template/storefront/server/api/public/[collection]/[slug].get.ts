import type { PublicViewEnvelope } from '../../../../types/public-view'
import { fetchSiteRuntime } from '../../../utils/site-runtime'

// getPublishedResource proxies one local published public view through the Nuxt server boundary.
export default defineEventHandler((event) => {
  const collection = getRouterParam(event, 'collection')
  const slug = getRouterParam(event, 'slug')
  const query = getQuery(event)
  return fetchSiteRuntime<PublicViewEnvelope>(event, `/api/public/resources/${collection}/${slug}`, {
    locale: typeof query.locale === 'string' ? query.locale : undefined
  })
})
