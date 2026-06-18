import { Controller, Get } from '@nestjs/common'
import { OesSiteRuntimeService } from '@oes/site-runtime-kit'

import { SiteConfigService } from '../site-config/site-config.service'

type SeoCollection = 'products' | 'categories' | 'blog' | 'news'

interface SeoRouteIndexItem {
  resourceType: 'product' | 'category' | 'blog' | 'news'
  locale: string
  slug: string
  path: string
  canonicalUrl: string
  updatedAt: string
}

const seoCollections: Array<{
  collection: SeoCollection
  reader: 'products' | 'categories' | 'blogs' | 'news'
  resourceType: SeoRouteIndexItem['resourceType']
}> = [
  { collection: 'products', reader: 'products', resourceType: 'product' },
  { collection: 'categories', reader: 'categories', resourceType: 'category' },
  { collection: 'blog', reader: 'blogs', resourceType: 'blog' },
  { collection: 'news', reader: 'news', resourceType: 'news' }
]

// SeoController exposes local route index data for sitemap, hreflang, and canonical output.
@Controller('/api/public/seo')
export class SeoController {
  constructor(
    private readonly runtimeService: OesSiteRuntimeService,
    private readonly siteConfig: SiteConfigService
  ) {}

  // routeIndex lists only active-locale published routes from local public views.
  @Get('/route-index')
  async routeIndex(): Promise<{
    publicBaseUrl: string
    defaultLocale: string
    routes: SeoRouteIndexItem[]
  }> {
    const config = this.siteConfig.getPublicConfig()
    const routes: SeoRouteIndexItem[] = []
    for (const locale of config.activeLocales) {
      for (const collection of seoCollections) {
        const reader = this.runtimeService.getRuntime().publicViews[collection.reader]
        const result = await reader.list({ locale: locale.locale, limit: 1000 })
        for (const item of result.items) {
          const path = this.siteConfig.resolvePublicPath(
            item.locale,
            collection.collection,
            item.slug
          )
          routes.push({
            resourceType: collection.resourceType,
            locale: item.locale,
            slug: item.slug,
            path,
            canonicalUrl: `${config.publicBaseUrl}${path}`,
            updatedAt: item.updatedAt
          })
        }
      }
    }
    return {
      publicBaseUrl: config.publicBaseUrl,
      defaultLocale: config.defaultLocale,
      routes
    }
  }
}
