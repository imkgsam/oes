import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common'
import type { PublicViewEnvelope } from '@oes/site-runtime-kit'

import {
  parseOptionalIntegerInRange,
  parseOptionalSingleQueryString
} from '../site-exposure/public-query-parameters'
import {
  PublicDataService,
  publicDetailDataCollections,
  publicListDataCollections,
  type PublicDetailDataCollection,
  type PublicListDataCollection
} from './public-data.service'

const publicListDataCollectionSet = new Set<string>(publicListDataCollections)
const publicDetailDataCollectionSet = new Set<string>(publicDetailDataCollections)

// PublicDataController validates HTTP parameters and delegates public resource operations.
@Controller('/api/public/resources')
export class PublicDataController {
  constructor(private readonly publicData: PublicDataService) {}

  // getFaqDirectory exposes only the Runtime Kit's local published FAQ directory with no request-time OES call.
  @Get('faqs')
  getFaqDirectory(@Query('locale') locale?: unknown): Promise<PublicViewEnvelope> {
    return this.publicData.getFaqDirectory(parseOptionalSingleQueryString(locale, 'locale'))
  }

  // listResources validates route/query values and maps the service result without changing its response shape.
  @Get(':collection')
  async listResources(
    @Param('collection') collection: string,
    @Query('locale') locale?: unknown,
    @Query('limit') limit?: unknown,
    @Query('cursor') cursor?: unknown
  ): Promise<{ items: PublicViewEnvelope[]; nextCursor: string | null }> {
    return this.publicData.listResources({
      collection: requirePublicListDataCollection(collection),
      locale: parseOptionalSingleQueryString(locale, 'locale'),
      limit: parseOptionalIntegerInRange(limit, 'limit', 1, 200) ?? 48,
      cursor: parseOptionalSingleQueryString(cursor, 'cursor')
    })
  }

  // getResourceBySlug validates the collection enum and delegates the exact slug lookup.
  @Get(':collection/:slug')
  async getResourceBySlug(
    @Param('collection') collection: string,
    @Param('slug') slug: string,
    @Query('locale') locale?: unknown
  ): Promise<PublicViewEnvelope> {
    return this.publicData.getResourceBySlug({
      collection: requirePublicDetailDataCollection(collection),
      slug,
      locale: parseOptionalSingleQueryString(locale, 'locale')
    })
  }
}

// requirePublicListDataCollection rejects collections without a retained public list operation.
function requirePublicListDataCollection(collection: string): PublicListDataCollection {
  if (!publicListDataCollectionSet.has(collection)) {
    throw new NotFoundException('Unsupported public collection')
  }
  return collection as PublicListDataCollection
}

// requirePublicDetailDataCollection keeps Product detail public without reviving removed Product Category detail.
function requirePublicDetailDataCollection(collection: string): PublicDetailDataCollection {
  if (!publicDetailDataCollectionSet.has(collection)) {
    throw new NotFoundException('Unsupported public collection')
  }
  return collection as PublicDetailDataCollection
}
