import type { PublicSiteConfig } from '../../../types/public-view'
import { fetchSiteRuntime } from '../../utils/site-runtime'

// siteConfig proxies public-safe site config from Site Runtime to Storefront SSR.
export default defineEventHandler((event) => {
  return fetchSiteRuntime<PublicSiteConfig>(event, '/api/public/site-config')
})
