import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import type { PublicViewEnvelope } from '@oes/site-runtime-kit'

import { isRoutableContentDetailSlug } from '../site-exposure/content-detail-slug-policy'
import { SiteExposureService } from '../site-exposure/site-exposure.service'

export type ArchiveContentType = 'blog' | 'news'

export interface ContentArchivePageResult {
  items: PublicViewEnvelope[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
  availableYears: number[]
  committedPublishVersion: number
}

// ContentArchiveService builds bounded Blog and News pages from one attempt-local complete collection read.
@Injectable()
export class ContentArchiveService {
  constructor(private readonly siteExposure: SiteExposureService) {}

  // getArchivePage gates, filters, sorts, and paginates one locale inside a single publication fence.
  getArchivePage(input: {
    contentType: ArchiveContentType
    locale?: string
    page?: number
    pageSize?: number
    month?: number
    year?: number
  }): Promise<ContentArchivePageResult> {
    const page = requireBoundedPositiveInteger(input.page ?? 1, 'page')
    const pageSize = requireBoundedPositiveInteger(input.pageSize ?? 12, 'pageSize', 48)
    const month = requireOptionalRange(input.month, 'month', 1, 12)
    const year = requireOptionalRange(input.year, 'year', 2000, 2100)
    return this.siteExposure.withStablePublication(async (session) => {
      const locale = this.siteExposure.resolvePublicLocaleForPublication(
        input.locale,
        session.publication
      )
      const pageKey = input.contentType === 'blog' ? 'BLOG_LIST' : 'NEWS_LIST'
      const policy = await session.getPagePolicy(pageKey, locale)
      if (!policy.accessible) {
        throw new NotFoundException('Page is not available')
      }
      const resources = await session.listAllPublishedResources(input.contentType, locale)
      const safeResources = resources
        .filter((resource) => isAvailableArchiveResource(resource, locale))
        .sort(compareArchiveContent)
      const availableYears = publicationYears(safeResources)
      const filteredResources = safeResources.filter((resource) =>
        matchesArchiveDate(resource, month, year)
      )
      const totalPages = Math.ceil(filteredResources.length / pageSize)
      if (page > Math.max(totalPages, 1)) {
        throw new NotFoundException('Archive page not found')
      }
      const start = (page - 1) * pageSize
      return {
        items: filteredResources.slice(start, start + pageSize),
        pagination: {
          page,
          pageSize,
          totalItems: filteredResources.length,
          totalPages
        },
        availableYears,
        committedPublishVersion: session.publication.publishVersion
      }
    })
  }
}

// isAvailableArchiveResource keeps lists aligned with safe routable exact-locale published detail resources.
function isAvailableArchiveResource(resource: PublicViewEnvelope, locale: string): boolean {
  return (
    resource.status === 'published' &&
    resource.locale === locale &&
    isRoutableContentDetailSlug(resource.slug)
  )
}

// compareArchiveContent orders newest publication timestamps first with deterministic slug and id ties.
function compareArchiveContent(left: PublicViewEnvelope, right: PublicViewEnvelope): number {
  return (
    archiveTimestamp(right).localeCompare(archiveTimestamp(left)) ||
    left.slug.localeCompare(right.slug) ||
    left.resourceId.localeCompare(right.resourceId)
  )
}

// archiveTimestamp reads the public publishing timestamp with updatedAt as a stable fallback.
function archiveTimestamp(resource: PublicViewEnvelope): string {
  const value = payloadRecord(resource).published_at
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
    ? value
    : resource.updatedAt
}

// matchesArchiveDate filters the complete collection before page slicing while retaining unfiltered requests.
function matchesArchiveDate(
  resource: PublicViewEnvelope,
  month: number | undefined,
  year: number | undefined
): boolean {
  if (!month && !year) {
    return true
  }
  const timestamp = archiveTimestamp(resource)
  if (Number.isNaN(Date.parse(timestamp))) {
    return false
  }
  const date = new Date(timestamp)
  return (!month || date.getUTCMonth() + 1 === month) && (!year || date.getUTCFullYear() === year)
}

// publicationYears derives stable descending filter options from the complete safe locale collection.
function publicationYears(resources: PublicViewEnvelope[]): number[] {
  const years = new Set<number>()
  for (const resource of resources) {
    const timestamp = archiveTimestamp(resource)
    if (!Number.isNaN(Date.parse(timestamp))) {
      years.add(new Date(timestamp).getUTCFullYear())
    }
  }
  return [...years].sort((left, right) => right - left)
}

// requireBoundedPositiveInteger protects the application service from unbounded page responses.
function requireBoundedPositiveInteger(value: number, name: string, maximum?: number): number {
  if (
    !Number.isSafeInteger(value) ||
    value <= 0 ||
    (maximum !== undefined && value > maximum)
  ) {
    throw new BadRequestException(`${name} must be a bounded positive integer`)
  }
  return value
}

// requireOptionalRange validates optional date filter numbers at the application boundary.
function requireOptionalRange(
  value: number | undefined,
  name: string,
  minimum: number,
  maximum: number
): number | undefined {
  if (value === undefined) {
    return undefined
  }
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new BadRequestException(`${name} is outside the supported range`)
  }
  return value
}

// payloadRecord narrows public payloads before archive timestamp reads.
function payloadRecord(resource: PublicViewEnvelope): Record<string, unknown> {
  return resource.payload && typeof resource.payload === 'object'
    ? (resource.payload as Record<string, unknown>)
    : {}
}
