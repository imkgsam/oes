import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common'
import { OesSiteRuntimeService, type PublicViewEnvelope } from '@oes/site-runtime-kit'

import { SiteConfigService } from '../site-config/site-config.service'

type CollectionName = 'products' | 'categories' | 'blog' | 'news'

const readerByCollection = {
  products: 'products',
  categories: 'categories',
  blog: 'blogs',
  news: 'news'
} as const

// PublicDataController adapts runtime.publicViews into Storefront-facing local published data APIs.
@Controller('/api/public/resources')
export class PublicDataController {
  constructor(
    private readonly runtimeService: OesSiteRuntimeService,
    private readonly siteConfig: SiteConfigService
  ) {}

  // listResources returns local published resources for one public collection and active locale.
  @Get(':collection')
  async listResources(
    @Param('collection') collection: CollectionName,
    @Query('locale') locale?: string,
    @Query('limit') limit?: string
  ): Promise<{ items: PublicViewEnvelope[]; nextCursor: string | null }> {
    const normalizedLocale = this.resolveLocale(locale)
    const reader = this.getReader(collection)
    return reader.list({
      locale: normalizedLocale,
      limit: limit ? Number(limit) : 48
    })
  }

  // getResourceBySlug returns one local published resource by site slug and active locale.
  @Get(':collection/:slug')
  async getResourceBySlug(
    @Param('collection') collection: CollectionName,
    @Param('slug') slug: string,
    @Query('locale') locale?: string
  ): Promise<PublicViewEnvelope> {
    const normalizedLocale = this.resolveLocale(locale)
    const item = await this.getReader(collection).getBySlug(slug, normalizedLocale)
    if (!item) {
      throw new NotFoundException('Published resource not found')
    }
    return item
  }

  // resolveLocale keeps preparing or disabled locales out of public reads.
  private resolveLocale(locale: string | undefined): string {
    const configured = this.siteConfig.getPublicConfig()
    const requested = locale ?? configured.defaultLocale
    if (!this.siteConfig.isActiveLocale(requested)) {
      throw new NotFoundException('Locale is not active')
    }
    return requested
  }

  // getReader maps route collection names to runtime-kit public view readers.
  private getReader(collection: CollectionName) {
    const readerKey = readerByCollection[collection]
    if (!readerKey) {
      throw new NotFoundException('Unsupported public collection')
    }
    return this.runtimeService.getRuntime().publicViews[readerKey]
  }
}
