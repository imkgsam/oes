import type { PublicSiteConfig } from '../../types/public-view'
import { fetchSiteRuntime } from '../utils/site-runtime'

// robots renders deployment-shaped crawler policy while blocking preview and API paths.
export default defineEventHandler(async (event) => {
  const config = await fetchSiteRuntime<PublicSiteConfig>(event, '/api/public/site-config')
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return [
    'User-agent: *',
    'Disallow: /preview/',
    'Disallow: /api/',
    'Disallow: /api/oes/',
    'Disallow: /admin/',
    'Disallow: /debug/',
    `Sitemap: ${config.publicBaseUrl}/sitemap.xml`,
    ''
  ].join('\n')
})
