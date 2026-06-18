import type { SeoRouteIndex } from '../../../../types/public-view'
import { fetchSiteRuntime } from '../../../utils/site-runtime'

// routeIndex proxies local SEO route data from Site Runtime for sitemap generation.
export default defineEventHandler((event) => {
  return fetchSiteRuntime<SeoRouteIndex>(event, '/api/public/seo/route-index')
})
