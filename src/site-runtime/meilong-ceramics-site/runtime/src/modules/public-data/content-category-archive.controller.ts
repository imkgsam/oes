import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common'
import type { PublicViewEnvelope } from '@oes/site-runtime-kit'

import {
  ContentCategoryArchiveService,
  type ContentType,
  type CategoryArchiveResult
} from './content-category-archive.service'
import {
  parseOptionalIntegerInRange,
  parseOptionalSingleQueryString
} from '../site-exposure/public-query-parameters'

const contentTypes = new Set<string>(['blog', 'news'])

// ContentCategoryArchiveController exposes Blog / News Content Category archive and historical redirect APIs.
@Controller('/api/public')
export class ContentCategoryArchiveController {
  constructor(private readonly categoryArchive: ContentCategoryArchiveService) {}

  // listVisibleCategories returns archive categories proven visible by published Blog or News references.
  @Get('/article-categories/:contentType')
  async listVisibleCategories(
    @Param('contentType') contentType: string,
    @Query('pageKey') pageKey?: unknown,
    @Query('locale') locale?: unknown
  ): Promise<{ items: PublicViewEnvelope[] }> {
    return {
      items: await this.categoryArchive.listVisibleCategories(
        requireContentType(contentType),
        parseOptionalSingleQueryString(pageKey, 'pageKey'),
        parseOptionalSingleQueryString(locale, 'locale')
      )
    }
  }

  // getCategoryArchive returns paginated Content Category archive content or a historical-slug redirect target.
  @Get('/article-category-archives/:contentType/:slug')
  async getCategoryArchive(
    @Param('contentType') contentType: string,
    @Param('slug') slug: string,
    @Query('locale') locale?: unknown,
    @Query('page') page?: unknown,
    @Query('pageSize') pageSize?: unknown,
    @Query('month') month?: unknown,
    @Query('year') year?: unknown
  ): Promise<CategoryArchiveResult> {
    return this.categoryArchive.getArchive({
      contentType: requireContentType(contentType),
      slug,
      locale: parseOptionalSingleQueryString(locale, 'locale'),
      page: parseOptionalIntegerInRange(page, 'page', 1, Number.MAX_SAFE_INTEGER),
      pageSize: parseOptionalIntegerInRange(pageSize, 'pageSize', 1, 24),
      month: parseOptionalIntegerInRange(month, 'month', 1, 12),
      year: parseOptionalIntegerInRange(year, 'year', 2000, 2100)
    })
  }

  // resolveContentRedirect maps Blog and News historical slugs to current canonical paths.
  @Get('/redirects/:collection/:slug')
  async resolveContentRedirect(
    @Param('collection') collection: string,
    @Param('slug') slug: string,
    @Query('locale') locale?: unknown
  ): Promise<{ redirectTo: string | null }> {
    return {
      redirectTo: await this.categoryArchive.resolveContentRedirect(
        requireContentType(collection),
        slug,
        parseOptionalSingleQueryString(locale, 'locale')
      )
    }
  }
}

// requireContentType rejects unsupported Blog/News path enums before service dispatch.
function requireContentType(value: string): ContentType {
  if (!contentTypes.has(value)) {
    throw new NotFoundException('Unsupported content type')
  }
  return value as ContentType
}
