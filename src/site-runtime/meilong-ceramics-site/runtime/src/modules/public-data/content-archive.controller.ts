import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common'

import {
  ContentArchiveService,
  type ArchiveContentType,
  type ContentArchivePageResult
} from './content-archive.service'
import {
  parseOptionalIntegerInRange,
  parseOptionalSingleQueryString
} from '../site-exposure/public-query-parameters'

const archiveContentTypes = new Set<string>(['blog', 'news'])

// ContentArchiveController exposes bounded complete-collection Blog and News page reads.
@Controller('/api/public/article-archives')
export class ContentArchiveController {
  constructor(private readonly contentArchive: ContentArchiveService) {}

  // getArchivePage validates public query strings before one application-layer publication read.
  @Get(':contentType')
  getArchivePage(
    @Param('contentType') contentType: string,
    @Query('locale') locale?: unknown,
    @Query('page') page?: unknown,
    @Query('pageSize') pageSize?: unknown,
    @Query('month') month?: unknown,
    @Query('year') year?: unknown
  ): Promise<ContentArchivePageResult> {
    return this.contentArchive.getArchivePage({
      contentType: requireArchiveContentType(contentType),
      locale: parseOptionalSingleQueryString(locale, 'locale'),
      page: parseOptionalIntegerInRange(page, 'page', 1, Number.MAX_SAFE_INTEGER),
      pageSize: parseOptionalIntegerInRange(pageSize, 'pageSize', 1, 48),
      month: parseOptionalIntegerInRange(month, 'month', 1, 12),
      year: parseOptionalIntegerInRange(year, 'year', 2000, 2100)
    })
  }
}

// requireArchiveContentType rejects unsupported local Runtime list namespaces.
function requireArchiveContentType(value: string): ArchiveContentType {
  if (!archiveContentTypes.has(value)) {
    throw new NotFoundException('Unsupported archive content type')
  }
  return value as ArchiveContentType
}
