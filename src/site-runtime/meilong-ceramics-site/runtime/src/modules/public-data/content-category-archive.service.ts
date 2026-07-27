import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import type { PublicViewEnvelope } from '@oes/site-runtime-kit'

import { SiteConfigService } from '../site-config/site-config.service'
import {
  isPublishedResourceIndexable,
  PublicationReadSession,
  SiteExposureService
} from '../site-exposure/site-exposure.service'

export type ContentType = 'blog' | 'news'
export type ContentCollection = ContentType
export type CategoryDirectoryPageKey =
  | 'BLOG_LIST'
  | 'BLOG_DETAIL'
  | 'BLOG_CATEGORY'
  | 'NEWS_LIST'
  | 'NEWS_DETAIL'
  | 'NEWS_CATEGORY'

const categoryDirectoryPageKeysByContentType = {
  blog: new Set<string>(['BLOG_LIST', 'BLOG_DETAIL', 'BLOG_CATEGORY']),
  news: new Set<string>(['NEWS_LIST', 'NEWS_DETAIL', 'NEWS_CATEGORY'])
} as const

export interface CategoryArchiveResult {
  category: PublicViewEnvelope
  items: PublicViewEnvelope[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
  canonicalPath: string
  canonicalUrl: string
  exists: true
  indexEligible: boolean
  availableYears: number[]
  committedPublishVersion: number
  redirectTo?: string
}

export interface CategoryRouteIndexItem {
  resourceType: 'blog_category' | 'news_category'
  locale: string
  slug: string
  path: string
  canonicalUrl: string
  updatedAt: string
  pageKey: 'BLOG_CATEGORY' | 'NEWS_CATEGORY'
  committedPublishVersion: number
}

// ContentCategoryArchiveService centralizes category visibility, archive pagination, and slug redirect rules.
@Injectable()
export class ContentCategoryArchiveService {
  constructor(
    private readonly siteConfig: SiteConfigService,
    private readonly siteExposure: SiteExposureService
  ) {}

  // listVisibleCategories returns only published categories referenced by published content for the content type.
  async listVisibleCategories(
    contentType: ContentType,
    pageKey: string | undefined,
    locale?: string
  ): Promise<PublicViewEnvelope[]> {
    const consumerPageKey = requireCategoryDirectoryPageKey(contentType, pageKey)
    return this.siteExposure.withStablePublication(async (session) => {
      const resolvedLocale = this.siteExposure.resolvePublicLocaleForPublication(
        locale,
        session.publication
      )
      await this.assertPageAccessible(session, consumerPageKey, resolvedLocale)
      return this.listVisibleCategoriesInSession(session, contentType, resolvedLocale)
    })
  }

  // listVisibleCategoriesInSession computes localized archive candidates using caller-owned attempt caches.
  async listVisibleCategoriesInSession(
    session: PublicationReadSession,
    contentType: ContentType,
    locale: string
  ): Promise<PublicViewEnvelope[]> {
    const visibleCategories = await this.listVisibleCategoriesByMembership(
      session,
      contentType,
      locale
    )
    return [...visibleCategories].sort(compareCategories)
  }

  // listVisibleCategoriesByMembership filters reader-order rows in linear time without display sorting.
  private async listVisibleCategoriesByMembership(
    session: PublicationReadSession,
    contentType: ContentType,
    locale: string
  ): Promise<PublicViewEnvelope[]> {
    const categories = await this.listCategories(session, contentType, locale)
    const entries = await this.listEntriesInReaderOrder(session, contentType, locale)
    const referencedCategoryIds = new Set(entries.flatMap((entry) => categoryIdsFromContent(entry)))
    return categories
      .filter((category) => {
        const categoryId = categoryIdFromCategory(category)
        return (
          Boolean(categoryId) &&
          referencedCategoryIds.has(categoryId)
        )
      })
  }

  // getArchive resolves a category archive, returns a redirect for historical slugs, and 404s empty archives.
  async getArchive(input: {
    contentType: ContentType
    slug: string
    locale?: string
    page?: number
    pageSize?: number
    month?: number
    year?: number
  }): Promise<CategoryArchiveResult> {
    const page = requireCategoryArchiveInteger(
      input.page ?? 1,
      'page',
      1,
      Number.MAX_SAFE_INTEGER
    )
    const pageSize = requireCategoryArchiveInteger(input.pageSize ?? 12, 'pageSize', 1, 24)
    const month = requireOptionalCategoryArchiveInteger(input.month, 'month', 1, 12)
    const year = requireOptionalCategoryArchiveInteger(input.year, 'year', 2000, 2100)
    return this.siteExposure.withStablePublication(async (session) => {
      const publication = session.publication
      const locale = this.siteExposure.resolvePublicLocaleForPublication(
        input.locale,
        publication
      )
      const pageKey = input.contentType === 'blog' ? 'BLOG_CATEGORY' : 'NEWS_CATEGORY'
      const pagePolicy = await this.assertPageAccessible(session, pageKey, locale)
      const config = await this.siteConfig.getPublicConfig(publication)
      const categories = await this.listCategories(session, input.contentType, locale)
      const entries = await this.listEntries(session, input.contentType, locale)
      const referencedCategoryIds = new Set(
        entries.flatMap((entry) => categoryIdsFromContent(entry))
      )
      const visibleCategories = categories.filter((category) => {
        const categoryId = categoryIdFromCategory(category)
        return (
          Boolean(categoryId) &&
          referencedCategoryIds.has(categoryId)
        )
      })
      const currentCategory = visibleCategories.find((category) => category.slug === input.slug)
      const historicalCandidate = currentCategory
        ? null
        : await session.resolvePublishedHistoricalAlias(
            input.contentType === 'blog' ? 'blog-category' : 'news-category',
            input.slug,
            locale
          )
      const historicalCategory = historicalCandidate
        ? visibleCategories.find(
            (category) =>
              category.resourceId === historicalCandidate.resourceId &&
              category.locale === historicalCandidate.locale &&
              category.slug === historicalCandidate.slug
          )
        : undefined
      const category = currentCategory ?? historicalCategory
      if (!category) {
        throw new NotFoundException('Category archive not found')
      }

      const canonicalPath = this.siteConfig.resolveContentCategoryArchivePath(
        publication,
        locale,
        input.contentType,
        category.slug
      )
      if (historicalCategory) {
        return {
          category,
          items: [],
          pagination: { page, pageSize, totalItems: 0, totalPages: 0 },
          canonicalPath,
          canonicalUrl: `${config.publicBaseUrl}${canonicalPath}`,
          exists: true,
          indexEligible: false,
          availableYears: [],
          committedPublishVersion: publication.publishVersion,
          redirectTo: canonicalPath
        }
      }

      const categoryId = categoryIdFromCategory(category)
      const archiveItems = entries.filter(
        (entry) => categoryId && categoryIdsFromContent(entry).includes(categoryId)
      )
      if (archiveItems.length === 0) {
        throw new NotFoundException('Category archive is empty')
      }
      const availableYears = categoryPublicationYears(archiveItems)
      const filteredItems = archiveItems.filter((entry) =>
        matchesCategoryArchiveDate(entry, month, year)
      )
      const totalPages = Math.ceil(filteredItems.length / pageSize)
      if (page > Math.max(totalPages, 1)) {
        throw new NotFoundException('Category archive page not found')
      }
      const pageItems = filteredItems.slice((page - 1) * pageSize, page * pageSize)
      const pagePath = page > 1 ? `${canonicalPath}?page=${page}` : canonicalPath
      return {
        category,
        items: pageItems,
        pagination: {
          page,
          pageSize,
          totalItems: filteredItems.length,
          totalPages
        },
        canonicalPath: pagePath,
        canonicalUrl: `${config.publicBaseUrl}${pagePath}`,
        exists: true,
        indexEligible: pagePolicy.indexEligible && isCategoryIndexable(category),
        availableYears,
        committedPublishVersion: publication.publishVersion
      }
    })
  }

  // resolveContentRedirect finds the current canonical path for a published Blog or News historical slug.
  async resolveContentRedirect(
    collection: ContentCollection,
    slug: string,
    locale?: string
  ): Promise<string | null> {
    return this.siteExposure.withStablePublication(async (session) => {
      const publication = session.publication
      const resolvedLocale = this.siteExposure.resolvePublicLocaleForPublication(
        locale,
        publication
      )
      await this.assertPageAccessible(
        session,
        collection === 'blog' ? 'BLOG_DETAIL' : 'NEWS_DETAIL',
        resolvedLocale
      )
      const match = await session.resolvePublishedHistoricalAlias(
        collection,
        slug,
        resolvedLocale
      )
      return match
        ? this.siteConfig.resolvePublicPath(publication, resolvedLocale, collection, match.slug)
        : null
    })
  }

  // listCategoryRouteIndex returns first-page indexable category archive routes for sitemap generation.
  async listCategoryRouteIndex(locale: string): Promise<CategoryRouteIndexItem[]> {
    return this.siteExposure.withStablePublication((session) =>
      this.listCategoryRouteIndexInSession(session, locale)
    )
  }

  // listCategoryRouteIndexInSession reuses the caller's policy and full-resource caches without nesting a fence.
  async listCategoryRouteIndexInSession(
    session: PublicationReadSession,
    locale: string
  ): Promise<CategoryRouteIndexItem[]> {
    const publication = session.publication
    const config = await this.siteConfig.getPublicConfig(publication)
    const routes: CategoryRouteIndexItem[] = []
    for (const contentType of ['blog', 'news'] as const) {
      const pageKey = contentType === 'blog' ? 'BLOG_CATEGORY' : 'NEWS_CATEGORY'
      const policy = await session.getPagePolicy(pageKey, locale)
      if (!policy.indexEligible) {
        continue
      }
      const categories = await this.listVisibleCategoriesByMembership(
        session,
        contentType,
        locale
      )
      for (const category of categories) {
        if (!isCategoryIndexable(category)) {
          continue
        }
        const path = this.siteConfig.resolveContentCategoryArchivePath(
          publication,
          locale,
          contentType,
          category.slug
        )
        routes.push({
          resourceType: contentType === 'blog' ? 'blog_category' : 'news_category',
          locale,
          slug: category.slug,
          path,
          canonicalUrl: `${config.publicBaseUrl}${path}`,
          updatedAt: category.updatedAt,
          pageKey,
          committedPublishVersion: publication.publishVersion
        })
      }
    }
    return routes
  }

  // listEntries reads the published Blog or News collection from runtime.publicViews.
  private async listEntries(
    session: PublicationReadSession,
    contentType: ContentType,
    locale: string
  ): Promise<PublicViewEnvelope[]> {
    const resources = await session.listAllPublishedResources(contentType, locale)
    return [...resources].sort(comparePublishedContent)
  }

  // listEntriesInReaderOrder returns the attempt-cached collection without display-order comparison.
  private listEntriesInReaderOrder(
    session: PublicationReadSession,
    contentType: ContentType,
    locale: string
  ): Promise<PublicViewEnvelope[]> {
    return session.listAllPublishedResources(contentType, locale)
  }

  // listCategories reads local ArticleCategory views filtered for the consuming Blog or News archive.
  private async listCategories(
    session: PublicationReadSession,
    contentType: ContentType,
    locale: string
  ): Promise<PublicViewEnvelope[]> {
    return session.listAllPublishedResources(
      contentType === 'blog' ? 'blog-category' : 'news-category',
      locale
    )
  }

  // assertPageAccessible reads the page gate inside its caller's whole-operation publication fence.
  private async assertPageAccessible(
    session: PublicationReadSession,
    pageKey: string,
    locale: string
  ): Promise<{ indexEligible: boolean }> {
    const policy = await session.getPagePolicy(pageKey, locale)
    if (!policy.accessible) {
      throw new NotFoundException('Page is not available')
    }
    return policy
  }
}

// requireCategoryArchiveInteger protects the application use case from unsafe or out-of-range numeric inputs.
function requireCategoryArchiveInteger(
  value: number,
  name: string,
  minimum: number,
  maximum: number
): number {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new BadRequestException(`${name} is outside the supported range`)
  }
  return value
}

// requireOptionalCategoryArchiveInteger applies the same application invariant to optional date filters.
function requireOptionalCategoryArchiveInteger(
  value: number | undefined,
  name: string,
  minimum: number,
  maximum: number
): number | undefined {
  return value === undefined
    ? undefined
    : requireCategoryArchiveInteger(value, name, minimum, maximum)
}

// requireCategoryDirectoryPageKey prevents one content surface from borrowing another page capability.
function requireCategoryDirectoryPageKey(
  contentType: ContentType,
  pageKey: string | undefined
): CategoryDirectoryPageKey {
  if (!pageKey || !categoryDirectoryPageKeysByContentType[contentType].has(pageKey)) {
    throw new BadRequestException('pageKey is not valid for this category directory')
  }
  return pageKey as CategoryDirectoryPageKey
}

// isCategoryIndexable applies localized resource noindex signals before sitemap inclusion.
function isCategoryIndexable(category: PublicViewEnvelope): boolean {
  return isPublishedResourceIndexable(category)
}

// categoryIdsFromContent extracts ordered ArticleCategoryPublicView references from Blog and News payloads.
function categoryIdsFromContent(content: PublicViewEnvelope): string[] {
  const categoryIds = payloadRecord(content).category_ids
  if (!Array.isArray(categoryIds)) {
    return []
  }
  return categoryIds
    .map((categoryId) => (typeof categoryId === 'string' ? categoryId : ''))
    .filter(Boolean)
}

// categoryIdFromCategory reads the stable category id from an ArticleCategoryPublicView payload.
function categoryIdFromCategory(category: PublicViewEnvelope): string {
  const categoryId = payloadRecord(category).content_category_id
  return typeof categoryId === 'string' ? categoryId : category.resourceId
}

// compareCategories gives archive filters a stable public order.
function compareCategories(left: PublicViewEnvelope, right: PublicViewEnvelope): number {
  const leftSortOrder = payloadRecord(left).sort_order
  const rightSortOrder = payloadRecord(right).sort_order
  const leftOrder = typeof leftSortOrder === 'number' ? leftSortOrder : 0
  const rightOrder = typeof rightSortOrder === 'number' ? rightSortOrder : 0
  return leftOrder - rightOrder || left.slug.localeCompare(right.slug)
}

// comparePublishedContent orders archives newest first while preserving slug stability for ties.
function comparePublishedContent(left: PublicViewEnvelope, right: PublicViewEnvelope): number {
  const leftPublishedAt = payloadRecord(left).published_at
  const rightPublishedAt = payloadRecord(right).published_at
  const leftPublished = typeof leftPublishedAt === 'string' ? leftPublishedAt : left.updatedAt
  const rightPublished = typeof rightPublishedAt === 'string' ? rightPublishedAt : right.updatedAt
  return rightPublished.localeCompare(leftPublished) || left.slug.localeCompare(right.slug)
}

// matchesCategoryArchiveDate filters the full category membership before any page slice.
function matchesCategoryArchiveDate(
  resource: PublicViewEnvelope,
  month: number | undefined,
  year: number | undefined
): boolean {
  if (!month && !year) {
    return true
  }
  const publishedAt = payloadRecord(resource).published_at
  if (typeof publishedAt !== 'string' || Number.isNaN(Date.parse(publishedAt))) {
    return false
  }
  const date = new Date(publishedAt)
  return (!month || date.getUTCMonth() + 1 === month) && (!year || date.getUTCFullYear() === year)
}

// categoryPublicationYears derives descending filter options from the complete category membership.
function categoryPublicationYears(resources: PublicViewEnvelope[]): number[] {
  const years = new Set<number>()
  for (const resource of resources) {
    const publishedAt = payloadRecord(resource).published_at
    if (typeof publishedAt === 'string' && !Number.isNaN(Date.parse(publishedAt))) {
      years.add(new Date(publishedAt).getUTCFullYear())
    }
  }
  return [...years].sort((left, right) => right - left)
}

// payloadRecord narrows unknown public view payloads to object records for contract-field reads.
function payloadRecord(resource: PublicViewEnvelope): Record<string, unknown> {
  return resource.payload && typeof resource.payload === 'object'
    ? (resource.payload as Record<string, unknown>)
    : {}
}
