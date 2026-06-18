import type { SeoRouteIndex } from '../../types/public-view'
import { fetchSiteRuntime } from '../utils/site-runtime'

// sitemap renders XML from the local SEO route index supplied by Site Runtime.
export default defineEventHandler(async (event) => {
  const index = await fetchSiteRuntime<SeoRouteIndex>(event, '/api/public/seo/route-index')
  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...index.routes.map((route) =>
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
