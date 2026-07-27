import { Injectable, NotFoundException } from '@nestjs/common'
import type { PublicViewEnvelope } from '@oes/site-runtime-kit'
import { OesSiteRuntimeService } from '@oes/site-runtime-kit'

import {
  SiteExposureService,
  type MeilongResourceCollection
} from '../site-exposure/site-exposure.service'

export const publicListDataCollections = ['blog', 'news'] as const
export const publicDetailDataCollections = [
  'products',
  'blog',
  'news'
] as const

export type PublicListDataCollection = (typeof publicListDataCollections)[number]
export type PublicDetailDataCollection = (typeof publicDetailDataCollections)[number]

const listPageKeyByCollection = {
  blog: 'BLOG_LIST',
  news: 'NEWS_LIST'
} as const

const detailPageKeyByCollection = {
  products: 'PRODUCT_DETAIL',
  blog: 'BLOG_DETAIL',
  news: 'NEWS_DETAIL'
} as const

const exposureCollectionByCollection = {
  products: 'products',
  blog: 'blog',
  news: 'news'
} as const satisfies Record<PublicDetailDataCollection, MeilongResourceCollection>

// PublicDataService owns page gates and published-resource reads inside one publication fence.
@Injectable()
export class PublicDataService {
  constructor(private readonly siteExposure: SiteExposureService, private readonly runtimeService: OesSiteRuntimeService) {}

  // getFaqDirectory reads only the locally committed Runtime Kit FAQ directory after the FAQ page gate passes.
  async getFaqDirectory(locale?: string): Promise<PublicViewEnvelope> {
    return this.siteExposure.withStablePublication(async (session) => {
      const resolvedLocale = this.siteExposure.resolvePublicLocaleForPublication(locale, session.publication)
      const policy = await session.getPagePolicy('FAQ', resolvedLocale)
      if (!policy.accessible) throw new NotFoundException('FAQ page is not available')
      const view = await this.runtimeService.getRuntime().publicViews.faq.get(resolvedLocale)
      if (!view || view.status !== 'published' || view.locale !== resolvedLocale) throw new NotFoundException('FAQ directory is not available')
      return view
    })
  }

  // listResources returns one caller-owned cursor page after checking the list page gate.
  async listResources(input: {
    collection: PublicListDataCollection
    locale?: string
    limit: number
    cursor?: string
  }): Promise<{ items: PublicViewEnvelope[]; nextCursor: string | null }> {
    return this.siteExposure.withStablePublication(async (session) => {
      const locale = this.siteExposure.resolvePublicLocaleForPublication(
        input.locale,
        session.publication
      )
      const policy = await session.getPagePolicy(listPageKeyByCollection[input.collection], locale)
      if (!policy.accessible) {
        throw new NotFoundException('Page is not available')
      }
      return this.siteExposure.listPublishedResourcesInSession(
        session,
        exposureCollectionByCollection[input.collection],
        locale,
        input.limit,
        input.cursor
      )
    })
  }

  // getResourceBySlug returns one exact published slug after evaluating its detail route gate.
  async getResourceBySlug(input: {
    collection: PublicDetailDataCollection
    slug: string
    locale?: string
  }): Promise<PublicViewEnvelope> {
    return this.siteExposure.withStablePublication(async (session) => {
      const locale = this.siteExposure.resolvePublicLocaleForPublication(
        input.locale,
        session.publication
      )
      const exposureCollection = exposureCollectionByCollection[input.collection]
      const decision = await this.siteExposure.getRouteDecisionInSession(
        session,
        {
          pageKey: detailPageKeyByCollection[input.collection],
          locale,
          resource: { collection: exposureCollection, slug: input.slug }
        },
        { includeAlternates: false }
      )
      if (!decision.accessible || !decision.resourceAvailable) {
        throw new NotFoundException('Published resource not found')
      }
      const item = await session.getPublishedResourceBySlug(
        exposureCollection,
        input.slug,
        locale
      )
      if (!item) {
        throw new NotFoundException('Published resource not found')
      }
      return item
    })
  }
}
