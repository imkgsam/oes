import type { SeoRouteIndex } from '../../types/public-view'
import { fetchSiteRuntime } from '../utils/site-runtime'
import { buildSitemapEntries } from '../utils/sitemap-policy'

// sitemap renders XML from the local SEO route index supplied by Site Runtime.
export default defineEventHandler(async (event) => {
  const index = await fetchSiteRuntime<SeoRouteIndex>(event, '/api/public/seo/route-index')
  const routes = buildSitemapEntries(index)
  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'X-OES-Site-Exposure-Version', String(index.committedPublishVersion))
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...routes.map((route) =>
      [
        '  <url>',
        `    <loc>${escapeXml(route.canonicalUrl)}</loc>`,
        `    <lastmod>${escapeXml(route.updatedAt)}</lastmod>`,
        '  </url>'
      ].join('\n')
    ),
    '</urlset>'
  ].join('\n')
})

// escapeXml protects sitemap output from malformed route data.
function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}
