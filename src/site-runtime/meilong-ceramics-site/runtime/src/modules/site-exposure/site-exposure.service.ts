import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException
} from '@nestjs/common'
import {
  OesSiteRuntimeService,
  type PublicViewEnvelope,
  type PublicViewListResult,
  type SiteExposurePublication
} from '@oes/site-runtime-kit'

import {
  PublicationReadSession,
  listAllPublishedResources,
  type MeilongResourceCollection
} from './publication-read-session'

export { listAllPublishedResources, PublicationReadSession }
export type { MeilongResourceCollection }

export interface SiteRouteDecision {
  pageKey: string
  locale: string
  defaultLocale: string
  activeLocales: string[]
  accessible: boolean
  indexable: boolean
  indexEligible: boolean
  resourceAvailable: boolean
  canonicalResourceSlug?: string
  committedPublishVersion: number
  alternates: Array<{ locale: string; slug?: string }>
}

export interface CategoryArchiveRouteRead {
  kind: 'category-archive'
  page: number
  pageSize: number
}

export interface SiteRouteDecisionInput {
  pageKey: string
  locale?: string
  resource?: { collection: MeilongResourceCollection; slug?: string }
  categoryArchive?: CategoryArchiveRouteRead
}

const stablePublicationReadAttempts = 2
const categoryCollectionByPageKey = new Map<string, MeilongResourceCollection>([
  ['BLOG_CATEGORY', 'blog-category'],
  ['NEWS_CATEGORY', 'news-category']
])

// assertSiteRouteDecisionInput keeps Category archive thresholds coupled to one canonical detail resource before any Runtime read.
export function assertSiteRouteDecisionInput(input: SiteRouteDecisionInput): void {
  if (!input.categoryArchive) {
    return
  }
  const expectedCollection = categoryCollectionByPageKey.get(input.pageKey)
  const slug = input.resource?.slug
  const canonicalSlug =
    typeof slug === 'string' &&
    slug.length > 0 &&
    slug.trim() === slug &&
    slug.normalize('NFC') === slug
  if (
    input.categoryArchive.kind !== 'category-archive' ||
    !expectedCollection ||
    input.resource?.collection !== expectedCollection ||
    !canonicalSlug
  ) {
    throw new BadRequestException('Category archive threshold requires a matching Category detail route')
  }
  const { page, pageSize } = input.categoryArchive
  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 24
  ) {
    throw new BadRequestException('Category archive threshold is outside the supported range')
  }
}

// SiteExposureService derives all Meilong page, locale, resource, and index decisions from one committed Runtime reader.
@Injectable()
export class SiteExposureService {
  constructor(private readonly runtimeService: OesSiteRuntimeService) {}

  // getCommittedPublication returns the current atomic exposure version or distinguishes local Runtime unavailability as 503.
  async getCommittedPublication(): Promise<SiteExposurePublication> {
    const publication = await this.runtimeService.getRuntime().publicViews.exposure.getPublication()
    if (!publication) {
      throw new ServiceUnavailableException('Committed site exposure publication is unavailable')
    }
    return publication
  }

  // resolvePublicLocale defaults to the committed locale and rejects unknown, preparing, or disabled locale values.
  async resolvePublicLocale(locale?: string): Promise<string> {
    const publication = await this.getCommittedPublication()
    return this.resolvePublicLocaleForPublication(locale, publication)
  }

  // resolvePublicLocaleForPublication resolves one optional locale against the publication already owned by an outer read fence.
  resolvePublicLocaleForPublication(
    locale: string | undefined,
    publication: SiteExposurePublication
  ): string {
    const requested = locale ?? publication.defaultLocale
    if (!publication.activeLocales.includes(requested)) {
      throw new NotFoundException('Locale is not active')
    }
    return requested
  }

  // withStablePublication retries one mid-read atomic version switch and otherwise fails closed instead of returning mixed state.
  async withStablePublication<T>(
    operation: (session: PublicationReadSession) => Promise<T>
  ): Promise<T> {
    for (let attempt = 0; attempt < stablePublicationReadAttempts; attempt += 1) {
      const initialPublication = await this.getCommittedPublication()
      const session = new PublicationReadSession(
        initialPublication,
        this.runtimeService.getRuntime().publicViews
      )
      let outcome: { ok: true; value: T } | { ok: false; failure: unknown }
      try {
        outcome = { ok: true, value: await operation(session) }
      } catch (failure) {
        outcome = { ok: false, failure }
      }
      const finalPublication = await this.getCommittedPublication()
      if (finalPublication.publishVersion !== initialPublication.publishVersion) {
        continue
      }
      if (outcome.ok) {
        return outcome.value
      }
      throw outcome.failure
    }
    throw new ServiceUnavailableException('Committed site exposure publication changed during read')
  }

  // getRouteDecision combines page-wide policy with exact-locale resource availability and localized alternates.
  async getRouteDecision(input: SiteRouteDecisionInput): Promise<SiteRouteDecision> {
    assertSiteRouteDecisionInput(input)
    return this.withStablePublication((session) =>
      this.getRouteDecisionInSession(session, input)
    )
  }

  // getRouteDecisionInSession derives one decision inside its caller's existing publication attempt.
  async getRouteDecisionInSession(
    session: PublicationReadSession,
    input: SiteRouteDecisionInput,
    options: { includeAlternates?: boolean } = {}
  ): Promise<SiteRouteDecision> {
    assertSiteRouteDecisionInput(input)
    const publication = session.publication
    const locale = input.locale ?? publication.defaultLocale
    const pagePolicy = await session.getPagePolicy(input.pageKey, locale)
    const baseDecision = {
      pageKey: input.pageKey,
      locale,
      defaultLocale: publication.defaultLocale,
      activeLocales: [...publication.activeLocales],
      accessible: pagePolicy.accessible,
      indexable: pagePolicy.indexable,
      committedPublishVersion: publication.publishVersion
    }
    if (!pagePolicy.accessible) {
      return {
        ...baseDecision,
        indexEligible: false,
        resourceAvailable: false,
        alternates: []
      }
    }
    if (!input.resource) {
      const alternates =
        pagePolicy.indexEligible && options.includeAlternates !== false
          ? await this.listPageAlternates(input.pageKey, session)
          : []
      return {
        ...baseDecision,
        indexEligible: pagePolicy.indexEligible,
        resourceAvailable: true,
        alternates
      }
    }

    if (!input.resource.slug) {
      const resources = await session.listAllPublishedResources(input.resource.collection, locale)
      const hasIndexableContent = resources.some(isPublishedResourceIndexable)
      const alternates =
        pagePolicy.indexEligible && options.includeAlternates !== false
          ? await this.listCollectionAlternates(input.pageKey, input.resource.collection, session)
          : []
      return {
        ...baseDecision,
        indexEligible: pagePolicy.indexEligible && hasIndexableContent,
        resourceAvailable: true,
        alternates
      }
    }

    const currentResource = await this.getPublishedResourceBySlug(
      session,
      input.resource.collection,
      input.resource.slug,
      locale
    )
    const minimumArchiveItems = categoryArchiveMinimumItems(input)
    const resourceAvailable = Boolean(
      currentResource &&
      (await this.isArchiveResourceVisible(
        session,
        input.resource.collection,
        currentResource,
        locale,
        minimumArchiveItems
      ))
    )
    if (!currentResource || !resourceAvailable) {
      return {
        ...baseDecision,
        indexEligible: false,
        resourceAvailable: false,
        alternates: []
      }
    }
    const resourceIndexable = isPublishedResourceIndexable(currentResource)
    const indexEligible = pagePolicy.indexEligible && resourceIndexable
    const categoryResource = isCategoryCollection(input.resource.collection)
    const alternates =
      (indexEligible || categoryResource) && options.includeAlternates !== false
        ? await this.listResourceAlternates(
            session,
            input.pageKey,
            input.resource.collection,
            currentResource.resourceId,
            minimumArchiveItems
          )
        : []
    return {
      ...baseDecision,
      indexEligible,
      resourceAvailable: true,
      canonicalResourceSlug: currentResource.slug,
      alternates
    }
  }

  // listCollectionAlternates keeps list hreflang candidates to locales with at least one indexable published item.
  private async listCollectionAlternates(
    pageKey: string,
    collection: MeilongResourceCollection,
    session: PublicationReadSession
  ): Promise<Array<{ locale: string }>> {
    const variants: Array<{ locale: string }> = []
    for (const locale of session.publication.activeLocales) {
      const policy = await session.getPagePolicy(pageKey, locale)
      if (!policy.indexEligible) {
        continue
      }
      const resources = await session.listAllPublishedResources(collection, locale)
      if (resources.some(isPublishedResourceIndexable)) {
        variants.push({ locale })
      }
    }
    return variants
  }

  // listPublishedResources returns only published rows for the requested active locale without fallback.
  async listPublishedResources(
    collection: MeilongResourceCollection,
    locale: string,
    limit = 200,
    cursor?: string
  ): Promise<PublicViewListResult> {
    return this.withStablePublication((session) =>
      this.listPublishedResourcesInSession(session, collection, locale, limit, cursor)
    )
  }

  // listPublishedResourcesInSession reads one caller-owned cursor page without creating a nested fence.
  async listPublishedResourcesInSession(
    session: PublicationReadSession,
    collection: MeilongResourceCollection,
    locale: string,
    limit = 200,
    cursor?: string
  ): Promise<PublicViewListResult> {
    if (!session.publication.activeLocales.includes(locale)) {
      throw new NotFoundException('Locale is not active')
    }
    return session.listPublishedResourcesPage(collection, locale, limit, cursor)
  }

  // listPageAlternates returns only active, supported, enabled, and indexable locale variants of one page.
  private async listPageAlternates(
    pageKey: string,
    session: PublicationReadSession
  ): Promise<Array<{ locale: string }>> {
    const alternates: Array<{ locale: string }> = []
    for (const locale of session.publication.activeLocales) {
      const policy = await session.getPagePolicy(pageKey, locale)
      if (policy.indexEligible) {
        alternates.push({ locale })
      }
    }
    return alternates
  }

  // listResourceAlternates intersects page policy with published versions of the same resource identity.
  private async listResourceAlternates(
    session: PublicationReadSession,
    pageKey: string,
    collection: MeilongResourceCollection,
    resourceId: string,
    minimumArchiveItems: number
  ): Promise<Array<{ locale: string; slug: string }>> {
    const variants: Array<{ locale: string; slug: string }> = []
    const categoryResource = isCategoryCollection(collection)
    for (const locale of session.publication.activeLocales) {
      const policy = await session.getPagePolicy(pageKey, locale)
      if (categoryResource ? !policy.accessible : !policy.indexEligible) {
        continue
      }
      const resources = await session.listAllPublishedResources(collection, locale)
      const resource = resources.find((candidate) => candidate.resourceId === resourceId)
      if (
        !resource ||
        (!categoryResource && !isPublishedResourceIndexable(resource)) ||
        !(await this.isArchiveResourceVisible(
          session,
          collection,
          resource,
          locale,
          minimumArchiveItems
        ))
      ) {
        continue
      }
      variants.push({ locale, slug: resource.slug })
    }
    return variants
  }

  // getPublishedResourceBySlug performs one exact-locale lookup through Runtime Kit public readers.
  private async getPublishedResourceBySlug(
    session: PublicationReadSession,
    collection: MeilongResourceCollection,
    slug: string,
    locale: string
  ): Promise<PublicViewEnvelope | null> {
    const current = await session.getPublishedResourceBySlug(collection, slug, locale)
    if (current) {
      return current
    }
    const historical = await session.resolvePublishedHistoricalAlias(collection, slug, locale)
    return historical
  }

  // isArchiveResourceVisible rejects Content Category variants without published localized archive members.
  private async isArchiveResourceVisible(
    session: PublicationReadSession,
    collection: MeilongResourceCollection,
    resource: PublicViewEnvelope,
    locale: string,
    minimumItems = 1
  ): Promise<boolean> {
    if (collection !== 'blog-category' && collection !== 'news-category') {
      return true
    }
    const contentType = collection === 'blog-category' ? 'blog' : 'news'
    const entries = await session.listAllPublishedResources(contentType, locale)
    let matchingItems = 0
    for (const entry of entries) {
      if (categoryIds(entry).includes(resource.resourceId)) {
        matchingItems += 1
        if (matchingItems >= minimumItems) {
          return true
        }
      }
    }
    return false
  }
}

// categoryArchiveMinimumItems validates site-local Category pagination and returns the first item position required by that page.
function categoryArchiveMinimumItems(input: SiteRouteDecisionInput): number {
  if (!input.categoryArchive) {
    return 1
  }
  const { page, pageSize } = input.categoryArchive
  const minimumItems = (page - 1) * pageSize + 1
  return Number.isSafeInteger(minimumItems) ? minimumItems : Number.POSITIVE_INFINITY
}

// isCategoryCollection identifies the two Content Category route resources with page-aware availability.
function isCategoryCollection(
  collection: MeilongResourceCollection
): collection is 'blog-category' | 'news-category' {
  return collection === 'blog-category' || collection === 'news-category'
}

// isPublishedResourceIndexable applies resource-level noindex signals as a stricter veto over page policy.
export function isPublishedResourceIndexable(resource: PublicViewEnvelope): boolean {
  const payload = asRecord(resource.payload)
  const seo = asRecord(payload.seo)
  return !(
    payload.noindex === true ||
    payload.indexable === false ||
    seo.noindex === true ||
    seo.indexable === false
  )
}

// categoryIds reads localized content membership without inventing a fallback taxonomy.
function categoryIds(resource: PublicViewEnvelope): string[] {
  const value = asRecord(resource.payload).category_ids
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

// asRecord narrows public payload fragments before noindex and category checks.
function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}
