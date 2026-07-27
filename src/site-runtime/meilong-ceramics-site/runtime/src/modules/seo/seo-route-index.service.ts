import { Injectable } from '@nestjs/common'

import { ContentCategoryArchiveService } from '../public-data/content-category-archive.service'
import { SiteConfigService } from '../site-config/site-config.service'
import { isRoutableContentDetailSlug } from '../site-exposure/content-detail-slug-policy'
import {
  isPublishedResourceIndexable,
  SiteExposureService,
  type MeilongResourceCollection,
  type PublicationReadSession
} from '../site-exposure/site-exposure.service'

type SeoCollection = 'products' | 'blog' | 'news'

export interface SeoRouteIndexItem {
  resourceType: 'product' | 'blog' | 'news' | 'blog_category' | 'news_category'
  locale: string
  slug: string
  path: string
  canonicalUrl: string
  updatedAt: string
  pageKey: string
  committedPublishVersion: number
}

export interface SeoRouteIndexResult {
  publicBaseUrl: string
  defaultLocale: string
  activeLocales: string[]
  committedPublishVersion: number
  publishedAt: string
  pages: Array<{ pageKey: string; locale: string; indexEligible: boolean }>
  routes: SeoRouteIndexItem[]
}

const seoCollections: Array<{
  collection: SeoCollection
  resourceType: SeoRouteIndexItem['resourceType']
  pageKey: 'PRODUCT_DETAIL' | 'BLOG_DETAIL' | 'NEWS_DETAIL'
}> = [
  { collection: 'products', resourceType: 'product', pageKey: 'PRODUCT_DETAIL' },
  { collection: 'blog', resourceType: 'blog', pageKey: 'BLOG_DETAIL' },
  { collection: 'news', resourceType: 'news', pageKey: 'NEWS_DETAIL' }
]

const listCollectionByPageKey = {
  BLOG_LIST: 'blog',
  NEWS_LIST: 'news'
} as const satisfies Record<string, MeilongResourceCollection>

// SeoRouteIndexService builds one publication-consistent route index with attempt-local read reuse.
@Injectable()
export class SeoRouteIndexService {
  constructor(
    private readonly siteConfig: SiteConfigService,
    private readonly categoryArchive: ContentCategoryArchiveService,
    private readonly siteExposure: SiteExposureService
  ) {}

  // getRouteIndex owns the route-index operation's single bounded publication fence.
  getRouteIndex(): Promise<SeoRouteIndexResult> {
    return this.siteExposure.withStablePublication((session) => this.buildRouteIndex(session))
  }

  // buildRouteIndex reuses policy and collection reads across page eligibility and dynamic routes.
  private async buildRouteIndex(session: PublicationReadSession): Promise<SeoRouteIndexResult> {
    const publication = session.publication
    const config = await this.siteConfig.getPublicConfig(publication)
    const pages: SeoRouteIndexResult['pages'] = []
    const routes: SeoRouteIndexItem[] = []

    for (const page of publication.pages) {
      for (const locale of publication.activeLocales) {
        const policy = await session.getPagePolicy(page.pageKey, locale)
        let indexEligible = policy.indexEligible
        const listCollection =
          listCollectionByPageKey[page.pageKey as keyof typeof listCollectionByPageKey]
        if (indexEligible && listCollection) {
          const resources = await session.listAllPublishedResources(listCollection, locale)
          indexEligible = resources.some(isPublishedResourceIndexable)
        }
        pages.push({ pageKey: page.pageKey, locale, indexEligible })
      }
    }
    pages.sort(
      (left, right) =>
        left.locale.localeCompare(right.locale) || left.pageKey.localeCompare(right.pageKey)
    )

    for (const locale of config.activeLocales) {
      for (const collection of seoCollections) {
        const policy = await session.getPagePolicy(collection.pageKey, locale.locale)
        if (!policy.indexEligible) {
          continue
        }
        const resources = await session.listAllPublishedResources(
          collection.collection,
          locale.locale
        )
        for (const item of resources.filter(isPublishedResourceIndexable)) {
          if (isTerminalContentDetailSlug(collection.collection, item.slug)) {
            continue
          }
          const path = this.siteConfig.resolvePublicPath(
            publication,
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
            updatedAt: item.updatedAt,
            pageKey: collection.pageKey,
            committedPublishVersion: publication.publishVersion
          })
        }
      }
      routes.push(
        ...(await this.categoryArchive.listCategoryRouteIndexInSession(
          session,
          locale.locale
        ))
      )
    }

    return {
      publicBaseUrl: config.publicBaseUrl,
      defaultLocale: config.defaultLocale,
      activeLocales: [...publication.activeLocales],
      committedPublishVersion: publication.publishVersion,
      publishedAt: publication.publishedAt,
      pages,
      routes
    }
  }
}

// isTerminalContentDetailSlug prevents Runtime SEO from publishing routes the Storefront always terminates.
function isTerminalContentDetailSlug(collection: SeoCollection, slug: string): boolean {
  if (collection !== 'blog' && collection !== 'news') {
    return false
  }
  return !isRoutableContentDetailSlug(slug)
}
