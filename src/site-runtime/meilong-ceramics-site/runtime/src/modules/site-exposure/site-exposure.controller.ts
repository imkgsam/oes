import { BadRequestException, Controller, Get, Query } from '@nestjs/common'

import {
  assertSiteRouteDecisionInput,
  SiteExposureService,
  type CategoryArchiveRouteRead,
  type MeilongResourceCollection,
  type SiteRouteDecisionInput,
  type SiteRouteDecision
} from './site-exposure.service'
import { SiteConfigService } from '../site-config/site-config.service'
import { MEILONG_SITE_CAPABILITY_MANIFEST } from '../../site-capability-manifest'
import {
  parseOptionalIntegerInRange,
  parseOptionalSingleQueryString,
  requireSingleQueryString
} from './public-query-parameters'

const resourceCollections = new Set<MeilongResourceCollection>([
  'products',
  'blog',
  'news',
  'blog-category',
  'news-category'
])

const pageKeys = new Set<string>(
  MEILONG_SITE_CAPABILITY_MANIFEST.pages.map((page) => page.pageKey)
)

// SiteExposureController exposes committed public-safe route decisions to Storefront SSR without exposing Runtime internals.
@Controller('/api/public/site-exposure')
export class SiteExposureController {
  constructor(
    private readonly siteExposure: SiteExposureService,
    private readonly siteConfig: SiteConfigService
  ) {}

  // getRouteDecision returns one exact page/locale/resource policy from the Runtime-local committed publication.
  @Get('/route-decision')
  async getRouteDecision(
    @Query('pageKey') pageKey: unknown,
    @Query('locale') locale?: unknown,
    @Query('resourceCollection') resourceCollection?: unknown,
    @Query('slug') slug?: unknown,
    @Query('archivePage') archivePage?: unknown,
    @Query('archivePageSize') archivePageSize?: unknown
  ): Promise<SiteRouteDecision & { publicBaseUrl: string }> {
    const parsedPageKey = requireSingleQueryString(pageKey, 'pageKey')
    const parsedLocale = parseOptionalSingleQueryString(locale, 'locale')
    const parsedCollection = parseOptionalSingleQueryString(
      resourceCollection,
      'resourceCollection'
    )
    const parsedSlug = parseOptionalSingleQueryString(slug, 'slug')
    if (!parsedPageKey.trim() || !pageKeys.has(parsedPageKey)) {
      throw new BadRequestException('Unsupported pageKey')
    }
    if (parsedSlug && !parsedCollection) {
      throw new BadRequestException('resourceCollection is required with slug')
    }
    if (
      parsedCollection &&
      !resourceCollections.has(parsedCollection as MeilongResourceCollection)
    ) {
      throw new BadRequestException('Unsupported resource collection')
    }
    const categoryArchive = parseCategoryArchiveRouteRead(
      archivePage,
      archivePageSize
    )
    const input: SiteRouteDecisionInput = {
      pageKey: parsedPageKey,
      locale: parsedLocale,
      resource: parsedCollection
        ? { collection: parsedCollection as MeilongResourceCollection, slug: parsedSlug }
        : undefined,
      categoryArchive
    }
    assertSiteRouteDecisionInput(input)
    const decision = await this.siteExposure.getRouteDecision(input)
    return { ...decision, publicBaseUrl: this.siteConfig.getPublicBaseUrl() }
  }
}

// parseCategoryArchiveRouteRead validates the paired page threshold used only by matching Blog and News Category decisions.
function parseCategoryArchiveRouteRead(
  archivePage: unknown,
  archivePageSize: unknown
): CategoryArchiveRouteRead | undefined {
  const page = parseOptionalIntegerInRange(
    archivePage,
    'archivePage',
    1,
    Number.MAX_SAFE_INTEGER
  )
  const pageSize = parseOptionalIntegerInRange(archivePageSize, 'archivePageSize', 1, 24)
  if (page === undefined && pageSize === undefined) {
    return undefined
  }
  if (page === undefined || pageSize === undefined) {
    throw new BadRequestException('Category archive threshold requires both page values')
  }
  return { kind: 'category-archive', page, pageSize }
}
