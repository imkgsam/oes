import type { PublicViewEnvelope } from '../../../../types/public-view'
import { fetchSiteRuntime } from '../../../utils/site-runtime'

// listCollection proxies local published lists through the Nuxt server boundary.
export default defineEventHandler((event) => {
  const collection = getRouterParam(event, 'collection')
  const query = getQuery(event)
  return fetchSiteRuntime<{ items: PublicViewEnvelope[]; nextCursor: string | null }>(
    event,
    `/api/public/resources/${collection}`,
    {
      locale: typeof query.locale === 'string' ? query.locale : undefined,
      limit: typeof query.limit === 'string' ? Number(query.limit) : undefined
    }
  )
})
