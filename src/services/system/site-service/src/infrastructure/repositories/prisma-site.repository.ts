import { Injectable } from '@nestjs/common'
import { Prisma } from '../../../prisma/generated/prisma'
import { PrismaService } from '../prisma/prisma.service'
import {
  buildSiteExposurePublication,
  evaluateCapabilityRegistration,
  evaluateSitePagePreflight,
  SitePageCapabilityDeclaration
} from '../../domain/site-page/site-page-governance'
import { SiteCapabilityRegistrationError } from '../../domain/site-page/site-capability-registration'
import {
  DynamicSiteSlugNamespace,
  normalizeSiteSlug,
  siteSlugNamespaceForContentType,
  SiteSlugConflictError
} from '../../domain/publication/site-slug-policy'

export interface CreateSiteWithDefaultLocaleInput {
  siteId: string
  tenantId: string
  siteCode: string
  siteName: string
  siteType: string
  defaultLocale: string
  primaryDomain: string | null
  previewBaseUrl: string | null
  createdBy: string
}

export interface SaveCredentialMetadataInput {
  credentialId: string
  siteId: string
  clientId: string
  secretHash: string
  secretCiphertext?: string
  scopes: string[]
  status: string
  createdBy: string
}

export interface AddProductPublicationInput {
  publicationId: string
  siteId: string
  tenantId: string
  productId: string
  locale: string
  slug: string
  displayTitle: string
  displayDescription: string
  seoTitle: string
  seoDescription: string
  seoImage: string | null
  imageOverride: string | null
  categoryIds?: string[]
  publishStatus: string
  syncStatus: string
}

export interface UpsertSiteCategoryInput {
  categoryId: string
  siteId: string
  tenantId?: string
  parentCategoryId: string | null
  sourceCategoryId: string | null
  locale: string
  slug: string
  displayTitle: string
  description: string | null
  image: string | null
  sortOrder: number
  seoTitle: string
  seoDescription: string
  seoImage: string | null
  publishStatus: string
  syncStatus: string
}

export interface CreateContentWithLocaleVersionInput {
  contentId: string
  contentVersionId: string
  siteId: string
  tenantId: string
  contentType: string
  locale: string
  slug: string
  title: string
  bodyHtml: string
  summary: string | null
  coverImage: string | null
  coverImageAlt?: string | null
  author: string | null
  categoryIds: string[]
  seoTitle: string
  seoDescription: string
  seoImage: string | null
  publishedAt: Date | null
  status: string
  syncStatus: string
}

export interface UpsertPublicViewInput {
  siteId: string
  tenantId: string
  resourceType: string
  resourceId: string
  locale: string
  slug: string
  status: string
  publishVersion: number
  payload: Record<string, unknown>
  updatedAt: Date
}

export interface CreateSyncBatchInput {
  syncId: string
  siteId: string
  tenantId: string
  publishVersion: number
  status: string
  triggeredBy: string
  resources: Array<{
    resourceType: string
    resourceId: string
    locale: string
    changeType: string
  }>
}

export interface SaveAuditEnvelopeInput {
  eventId: string
  service: string
  module: string
  eventType: string
  occurredAt: Date
  result: string
  operatorId: string | null
  operatorType: string
  tenantId: string | null
  orgId: string | null
  traceId: string | null
  resourceType: string
  resourceId: string | null
  details: Record<string, unknown>
}

interface CapabilityRegistrationResult {
  accepted: boolean
  idempotentReplay: boolean
  manifestHash: string
  discoveredCount: number
  unavailablePageKeys: string[]
  driftPageKeys: string[]
  recoveredPageKeys: string[]
  registrationGeneration: string
}

/** isRetryablePublishTransactionError identifies lock, serialization, and uniqueness races safe to replay. */
function isRetryablePublishTransactionError(error: unknown): boolean {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code: unknown }).code) : ''
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  return (
    code === 'P2034' ||
    code === 'P2002' ||
    message.includes('lock timeout') ||
    message.includes('deadlock detected') ||
    message.includes('pending sync revision changed')
  )
}

/** isPrismaUniqueConstraintError recognizes the database's final duplicate-reservation decision. */
function isPrismaUniqueConstraintError(error: unknown): boolean {
  return Boolean(
    typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      String((error as { code: unknown }).code) === 'P2002'
  )
}

/** dynamicSlugConflict returns one stable failure without exposing the current owner's identity or content. */
function dynamicSlugConflict(): SiteSlugConflictError {
  return new SiteSlugConflictError('slug is already reserved for this site, namespace, and locale')
}

const UINT64_MAX_REGISTRATION_GENERATION = 18_446_744_073_709_551_615n

/** PrismaSiteRepository persists site-service P1 aggregates and read models behind repository methods. */
@Injectable()
export class PrismaSiteRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** runInTransaction executes one application unit of work inside the shared Prisma transaction. */
  runInTransaction<T>(callback: () => Promise<T>): Promise<T> {
    return this.prisma.runInTransaction(callback)
  }

  /** getDefaultSiteLocale resolves the only locale allowed for atomic Category creation. */
  async getDefaultSiteLocale(siteId: string): Promise<string> {
    const site = await this.prisma.getExecutionClient().site.findUnique({ where: { siteId }, select: { defaultLocale: true } })
    if (!site) throw new Error('site not found')
    return site.defaultLocale
  }

  /** reserveDynamicSlug atomically replaces only draft-only ownership and preserves every published claim. */
  private async reserveDynamicSlug(input: {
    siteId: string
    namespace: DynamicSiteSlugNamespace
    locale: string
    slug: string
    resourceId: string
  }): Promise<{ normalizedSlug: string; historicalSlugs: string[] }> {
    const client = this.prisma.getExecutionClient()
    const normalizedSlug = normalizeSiteSlug(input.slug)
    const desired = await client.siteSlugLedger.findUnique({
      where: {
        siteId_namespace_locale_normalizedSlug: {
          siteId: input.siteId,
          namespace: input.namespace,
          locale: input.locale,
          normalizedSlug
        }
      }
    })
    if (desired && desired.resourceId !== input.resourceId) {
      throw dynamicSlugConflict()
    }

    await client.siteSlugLedger.deleteMany({
      where: {
        siteId: input.siteId,
        namespace: input.namespace,
        locale: input.locale,
        resourceId: input.resourceId,
        draftReserved: true,
        publicationRole: null,
        normalizedSlug: { not: normalizedSlug }
      }
    })
    await client.siteSlugLedger.updateMany({
      where: {
        siteId: input.siteId,
        namespace: input.namespace,
        locale: input.locale,
        resourceId: input.resourceId,
        draftReserved: true,
        normalizedSlug: { not: normalizedSlug }
      },
      data: { draftReserved: false }
    })

    try {
      if (desired) {
        await client.siteSlugLedger.update({
          where: { id: desired.id },
          data: { draftReserved: true }
        })
      } else {
        await client.siteSlugLedger.create({
          data: {
            siteId: input.siteId,
            namespace: input.namespace,
            locale: input.locale,
            normalizedSlug,
            resourceId: input.resourceId,
            publicationRole: null,
            draftReserved: true
          }
        })
      }
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) {
        throw dynamicSlugConflict()
      }
      throw error
    }

    const historical = await client.siteSlugLedger.findMany({
      where: {
        siteId: input.siteId,
        namespace: input.namespace,
        locale: input.locale,
        resourceId: input.resourceId,
        publicationRole: 'historical'
      },
      select: { normalizedSlug: true },
      orderBy: [{ createdAt: 'asc' }, { normalizedSlug: 'asc' }]
    })
    return {
      normalizedSlug,
      historicalSlugs: historical.map((row) => row.normalizedSlug)
    }
  }

  /** readDynamicSlugPublication materializes canonical and history exclusively from the relational ledger. */
  private async readDynamicSlugPublication(input: {
    siteId: string
    namespace: DynamicSiteSlugNamespace
    locale: string
    resourceId: string
    fallbackSlug: string
  }): Promise<{ canonicalSlug: string; historicalSlugs: string[] }> {
    const client = this.prisma.getExecutionClient()
    const [canonical, historical] = await Promise.all([
      client.siteSlugLedger.findFirst({
        where: {
          siteId: input.siteId,
          namespace: input.namespace,
          locale: input.locale,
          resourceId: input.resourceId,
          publicationRole: 'canonical'
        },
        select: { normalizedSlug: true }
      }),
      client.siteSlugLedger.findMany({
        where: {
          siteId: input.siteId,
          namespace: input.namespace,
          locale: input.locale,
          resourceId: input.resourceId,
          publicationRole: 'historical'
        },
        select: { normalizedSlug: true },
        orderBy: [{ createdAt: 'asc' }, { normalizedSlug: 'asc' }]
      })
    ])
    return {
      canonicalSlug: canonical?.normalizedSlug ?? normalizeSiteSlug(input.fallbackSlug),
      historicalSlugs: historical.map((row) => row.normalizedSlug)
    }
  }

  /** prepareDynamicSlugForSync promotes one captured draft revision or reads its retained published ownership. */
  async prepareDynamicSlugForSync(input: {
    siteId: string
    resourceType: 'blog' | 'news' | 'article-category'
    resourceId: string
    locale: string
    expectedRevision: number
    promoteDraft: boolean
  }): Promise<{ canonicalSlug: string; historicalSlugs: string[] }> {
    const client = this.prisma.getExecutionClient()
    const namespace = input.resourceType
    const version =
      namespace === 'article-category'
        ? await client.siteContentCategoryLocaleVersion.findFirst({
            where: {
              siteId: input.siteId,
              categoryId: input.resourceId,
              locale: input.locale,
              syncRevision: input.expectedRevision
            },
            select: { slug: true }
          })
        : await client.siteContentLocaleVersion.findFirst({
            where: {
              contentId: input.resourceId,
              locale: input.locale,
              syncRevision: input.expectedRevision,
              contentEntry: { siteId: input.siteId, contentType: namespace }
            },
            select: { slug: true }
          })
    if (!version) {
      throw new Error('pending sync revision changed')
    }
    const draftSlug = normalizeSiteSlug(version.slug)

    if (input.promoteDraft) {
      const desired = await client.siteSlugLedger.findUnique({
        where: {
          siteId_namespace_locale_normalizedSlug: {
            siteId: input.siteId,
            namespace,
            locale: input.locale,
            normalizedSlug: draftSlug
          }
        }
      })
      if (!desired || desired.resourceId !== input.resourceId) {
        throw dynamicSlugConflict()
      }
      await client.siteSlugLedger.updateMany({
        where: {
          siteId: input.siteId,
          namespace,
          locale: input.locale,
          resourceId: input.resourceId,
          publicationRole: 'canonical',
          normalizedSlug: { not: draftSlug }
        },
        data: { publicationRole: 'historical', draftReserved: false }
      })
      await client.siteSlugLedger.update({
        where: { id: desired.id },
        data: { publicationRole: 'canonical', draftReserved: false }
      })
      await client.siteSlugLedger.updateMany({
        where: {
          siteId: input.siteId,
          namespace,
          locale: input.locale,
          resourceId: input.resourceId,
          draftReserved: true
        },
        data: { draftReserved: false }
      })
      await client.siteSlugLedger.deleteMany({
        where: {
          siteId: input.siteId,
          namespace,
          locale: input.locale,
          resourceId: input.resourceId,
          publicationRole: null,
          draftReserved: false
        }
      })
    }

    const [canonical, historical] = await Promise.all([
      client.siteSlugLedger.findFirst({
        where: {
          siteId: input.siteId,
          namespace,
          locale: input.locale,
          resourceId: input.resourceId,
          publicationRole: 'canonical'
        },
        select: { normalizedSlug: true }
      }),
      client.siteSlugLedger.findMany({
        where: {
          siteId: input.siteId,
          namespace,
          locale: input.locale,
          resourceId: input.resourceId,
          publicationRole: 'historical'
        },
        select: { normalizedSlug: true },
        orderBy: [{ createdAt: 'asc' }, { normalizedSlug: 'asc' }]
      })
    ])
    const canonicalSlug = canonical?.normalizedSlug ?? draftSlug
    const historicalSlugs = historical.map((row) => row.normalizedSlug)
    return { canonicalSlug, historicalSlugs }
  }

  /** runPublishTransaction serializes one site's publish work and retries transient database contention. */
  async runPublishTransaction<T>(siteId: string, callback: () => Promise<T>): Promise<T> {
    const maxAttempts = 3
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          async (transaction) => {
            await transaction.$executeRaw(Prisma.sql`SET LOCAL lock_timeout = '1500ms'`)
            await transaction.$queryRaw(Prisma.sql`SELECT "siteId" FROM "Site" WHERE "siteId" = ${siteId} FOR UPDATE`)
            return this.prisma.runWithTransactionClient(transaction, callback)
          },
          { maxWait: 2000, timeout: 30000 }
        )
      } catch (error) {
        if (attempt === maxAttempts || !isRetryablePublishTransactionError(error)) {
          throw error
        }
      }
    }
    throw new Error('publish transaction retries exhausted')
  }

  /** createSiteWithDefaultLocale stores a new site and its single active default locale. */
  async createSiteWithDefaultLocale(input: CreateSiteWithDefaultLocaleInput): Promise<void> {
    const client = this.prisma.getExecutionClient()
    await client.site.create({
      data: {
        siteId: input.siteId,
        tenantId: input.tenantId,
        siteCode: input.siteCode,
        siteName: input.siteName,
        siteType: input.siteType,
        status: 'draft',
        defaultLocale: input.defaultLocale,
        primaryDomain: input.primaryDomain,
        previewBaseUrl: input.previewBaseUrl,
        allowedOrigins: [],
        createdBy: input.createdBy,
        locales: {
          create: {
            locale: input.defaultLocale,
            status: 'active',
            isDefault: true
          }
        },
        runtimeStatus: {
          create: {
            status: 'unknown',
            localPublishVersion: 0,
            storeReady: false,
            syncInProgress: false,
            pendingSync: false
          }
        },
        exposureDraft: {
          create: { syncStatus: 'synced' }
        }
      }
    })
  }

  /** registerPageCapabilities atomically applies one complete manifest while preserving governance rows. */
  async registerPageCapabilities(input: {
    siteId: string
    clientId: string
    idempotencyKey: string
    expectedRegistrationGeneration: bigint
    manifestHash: string
    capabilities: SitePageCapabilityDeclaration[]
    discoveredAt: Date
  }): Promise<CapabilityRegistrationResult> {
    return this.prisma.runInTransaction(async () => {
      const client = this.prisma.getExecutionClient()
      await client.$executeRaw(
        Prisma.sql`
          INSERT INTO "SiteCapabilityRegistrationStream" (
            "siteId",
            "clientId",
            "currentGeneration",
            "createdAt",
            "updatedAt"
          )
          VALUES (${input.siteId}, ${input.clientId}, 0, ${input.discoveredAt}, ${input.discoveredAt})
          ON CONFLICT ("siteId", "clientId") DO NOTHING
        `
      )
      const streams = await client.$queryRaw<Array<{ currentGeneration: Prisma.Decimal }>>(
        Prisma.sql`
          SELECT "currentGeneration"
          FROM "SiteCapabilityRegistrationStream"
          WHERE "siteId" = ${input.siteId} AND "clientId" = ${input.clientId}
          FOR UPDATE
        `
      )
      const currentGeneration = BigInt(streams[0]?.currentGeneration.toString() ?? '0')
      const replay = await client.siteCapabilityRegistration.findUnique({
        where: {
          siteId_clientId_idempotencyKey: {
            siteId: input.siteId,
            clientId: input.clientId,
            idempotencyKey: input.idempotencyKey
          }
        }
      })
      if (replay) {
        if (
          replay.manifestHash !== input.manifestHash ||
          BigInt(replay.expectedRegistrationGeneration.toString()) !==
            input.expectedRegistrationGeneration
        ) {
          throw capabilityIdempotencyConflict()
        }
        const original = capabilityRegistrationResult(
          replay.resultPayload,
          replay.accepted,
          replay.manifestHash,
          replay.registrationGeneration
        )
        return {
          ...original,
          idempotentReplay: true,
          registrationGeneration: replay.registrationGeneration.toString()
        }
      }

      if (input.expectedRegistrationGeneration !== currentGeneration) {
        const rejected: CapabilityRegistrationResult = {
          accepted: false,
          idempotentReplay: false,
          manifestHash: input.manifestHash,
          discoveredCount: 0,
          unavailablePageKeys: [],
          driftPageKeys: [],
          recoveredPageKeys: [],
          registrationGeneration: currentGeneration.toString()
        }
        await client.siteCapabilityRegistration.create({
          data: {
            siteId: input.siteId,
            clientId: input.clientId,
            idempotencyKey: input.idempotencyKey,
            manifestHash: input.manifestHash,
            expectedRegistrationGeneration: input.expectedRegistrationGeneration.toString(),
            registrationGeneration: currentGeneration.toString(),
            accepted: false,
            resultPayload: rejected as unknown as Prisma.InputJsonValue
          }
        })
        return rejected
      }
      if (currentGeneration === UINT64_MAX_REGISTRATION_GENERATION) {
        throw new SiteCapabilityRegistrationError(
          'SITE_CAPABILITY_REGISTRATION_GENERATION_EXHAUSTED',
          'The capability registration generation has reached the uint64 limit'
        )
      }

      const existing = await this.listSitePages({ siteId: input.siteId })
      const evaluated = evaluateCapabilityRegistration({
        existing,
        declared: input.capabilities,
        discoveredAt: input.discoveredAt
      })
      const registrationGeneration = currentGeneration + 1n
      await client.siteCapabilityRegistrationStream.update({
        where: {
          siteId_clientId: { siteId: input.siteId, clientId: input.clientId }
        },
        data: { currentGeneration: registrationGeneration.toString() }
      })

      for (const page of evaluated.pages) {
        if (page.available) {
          await client.sitePageCapability.upsert({
            where: { siteId_pageKey: { siteId: input.siteId, pageKey: page.pageKey } },
            create: {
              siteId: input.siteId,
              pageKey: page.pageKey,
              supportedLocales: page.supportedLocales,
              available: true,
              firstDiscoveredAt: input.discoveredAt,
              lastDiscoveredAt: input.discoveredAt
            },
            update: {
              supportedLocales: page.supportedLocales,
              available: true,
              lastDiscoveredAt: input.discoveredAt
            }
          })
          await client.sitePageGovernance.upsert({
            where: { siteId_pageKey: { siteId: input.siteId, pageKey: page.pageKey } },
            create: {
              siteId: input.siteId,
              pageKey: page.pageKey,
              enabled: false,
              indexable: false,
              syncStatus: 'synced'
            },
            update: {}
          })
        } else {
          await client.sitePageCapability.update({
            where: { siteId_pageKey: { siteId: input.siteId, pageKey: page.pageKey } },
            data: { available: false }
          })
        }
      }

      const accepted: CapabilityRegistrationResult = {
        accepted: true,
        idempotentReplay: false,
        manifestHash: input.manifestHash,
        discoveredCount: input.capabilities.length,
        unavailablePageKeys: evaluated.disappearedPageKeys,
        driftPageKeys: evaluated.driftPageKeys,
        recoveredPageKeys: evaluated.recoveredPageKeys,
        registrationGeneration: registrationGeneration.toString()
      }
      await client.siteCapabilityRegistration.create({
        data: {
          siteId: input.siteId,
          clientId: input.clientId,
          idempotencyKey: input.idempotencyKey,
          manifestHash: input.manifestHash,
          expectedRegistrationGeneration: input.expectedRegistrationGeneration.toString(),
          registrationGeneration: registrationGeneration.toString(),
          accepted: true,
          resultPayload: accepted as unknown as Prisma.InputJsonValue
        }
      })

      return accepted
    })
  }

  /** listSitePages combines discovery facts with page-wide operator governance without merging their persistence. */
  async listSitePages(input: { siteId: string }) {
    const client = this.prisma.getExecutionClient()
    const [capabilities, governance] = await Promise.all([
      client.sitePageCapability.findMany({
        where: { siteId: input.siteId },
        orderBy: { pageKey: 'asc' }
      }),
      client.sitePageGovernance.findMany({ where: { siteId: input.siteId } })
    ])
    const governanceByKey = new Map(governance.map((page) => [page.pageKey, page]))
    return capabilities.map((capability) => {
      const page = governanceByKey.get(capability.pageKey)
      return {
        pageKey: capability.pageKey,
        supportedLocales: Array.isArray(capability.supportedLocales)
          ? (capability.supportedLocales as string[])
          : [],
        available: capability.available,
        enabled: page?.enabled ?? false,
        indexable: page?.indexable ?? false,
        drift: Boolean(page?.enabled && !capability.available),
        syncStatus: page?.syncStatus ?? 'synced',
        lastDiscoveredAt: capability.lastDiscoveredAt
      }
    })
  }

  /** updateSitePageGovernance changes only page-wide enabled/index intent and marks it pending. */
  async updateSitePageGovernance(input: {
    siteId: string
    pageKey: string
    enabled: boolean
    indexable: boolean
  }) {
    const client = this.prisma.getExecutionClient()
    const capability = await client.sitePageCapability.findUnique({
      where: { siteId_pageKey: { siteId: input.siteId, pageKey: input.pageKey } }
    })
    if (!capability) {
      const error = new Error('SITE_PAGE_NOT_DISCOVERED') as Error & { code: string }
      error.code = 'SITE_PAGE_NOT_DISCOVERED'
      throw error
    }
    await client.sitePageGovernance.update({
      where: { siteId_pageKey: { siteId: input.siteId, pageKey: input.pageKey } },
      data: { enabled: input.enabled, indexable: input.indexable, syncStatus: 'pending' }
    })
    return (await this.listSitePages({ siteId: input.siteId })).find(
      (page) => page.pageKey === input.pageKey
    )!
  }

  /** checkSitePagePreflight evaluates enabled page drift and active/activating locale coverage. */
  async checkSitePagePreflight(input: { siteId: string; activatingLocale?: string }) {
    return evaluateSitePagePreflight({
      activeLocales: await this.listActiveSiteLocales({ siteId: input.siteId }),
      activatingLocale: input.activatingLocale,
      pages: await this.listSitePages({ siteId: input.siteId })
    })
  }

  /** markSiteExposurePending records an unpublished page/locale governance change. */
  async markSiteExposurePending(input: { siteId: string }): Promise<void> {
    const client = this.prisma.getExecutionClient()
    await client.siteExposureDraft.upsert({
      where: { siteId: input.siteId },
      create: { siteId: input.siteId, syncStatus: 'pending' },
      update: { syncStatus: 'pending', syncRevision: { increment: 1 } }
    })
  }

  /** publishSiteExposure stores one immutable slug-free exposure publication for a publish version. */
  async publishSiteExposure(input: { siteId: string; publishVersion: number; publishedAt: Date }) {
    const client = this.prisma.getExecutionClient()
    const [site, activeLocales, pages] = await Promise.all([
      client.site.findUnique({ where: { siteId: input.siteId }, select: { defaultLocale: true } }),
      this.listActiveSiteLocales({ siteId: input.siteId }),
      this.listSitePages({ siteId: input.siteId })
    ])
    if (!site) {
      throw new Error('site not found')
    }
    const publication = buildSiteExposurePublication({
      siteId: input.siteId,
      publishVersion: input.publishVersion,
      defaultLocale: site.defaultLocale,
      activeLocales,
      pages,
      publishedAt: input.publishedAt
    })
    await client.siteExposurePublication.upsert({
      where: {
        siteId_publishVersion: { siteId: input.siteId, publishVersion: input.publishVersion }
      },
      create: {
        siteId: publication.siteId,
        publishVersion: publication.publishVersion,
        defaultLocale: publication.defaultLocale,
        activeLocales: publication.activeLocales,
        pages: publication.pages,
        publishedAt: input.publishedAt
      },
      update: {
        defaultLocale: publication.defaultLocale,
        activeLocales: publication.activeLocales,
        pages: publication.pages,
        publishedAt: input.publishedAt
      }
    })
    await client.site.update({
      where: { siteId: input.siteId },
      data: { latestPublishVersion: input.publishVersion }
    })
    return publication
  }

  /** markSiteExposureSynced clears pending governance state after the versioned publication is stored. */
  async markSiteExposureSynced(input: { siteId: string }): Promise<void> {
    const client = this.prisma.getExecutionClient()
    await Promise.all([
      client.siteExposureDraft.update({
        where: { siteId: input.siteId },
        data: { syncStatus: 'synced' }
      }),
      client.sitePageGovernance.updateMany({
        where: { siteId: input.siteId },
        data: { syncStatus: 'synced' }
      })
    ])
  }

  /** getLatestSiteExposurePublication returns the immutable exposure state at the latest published version. */
  async getLatestSiteExposurePublication(input: { siteId: string; publishVersion?: number }) {
    const client = this.prisma.getExecutionClient()
    const row = await client.siteExposurePublication.findFirst({
      where: {
        siteId: input.siteId,
        ...(input.publishVersion === undefined
          ? {}
          : { publishVersion: { lte: input.publishVersion } })
      },
      orderBy: { publishVersion: 'desc' }
    })
    return row ? mapExposurePublication(row) : undefined
  }

  /** saveCredentialMetadata stores credential metadata without exposing the one-time secret. */
  async saveCredentialMetadata(input: SaveCredentialMetadataInput): Promise<void> {
    const client = this.prisma.getExecutionClient()
    await client.siteCredential.create({
      data: {
        credentialId: input.credentialId,
        siteId: input.siteId,
        clientId: input.clientId,
        secretHash: input.secretHash,
        secretCiphertext: input.secretCiphertext,
        scopes: input.scopes,
        status: input.status,
        createdBy: input.createdBy
      }
    })
  }

  /** listSiteCredentials returns credential metadata without secret hash or ciphertext fields. */
  async listSiteCredentials(input: { siteId: string }) {
    const client = this.prisma.getExecutionClient()
    const credentials = await client.siteCredential.findMany({
      where: { siteId: input.siteId },
      orderBy: { createdAt: 'desc' },
      select: {
        credentialId: true,
        clientId: true,
        scopes: true,
        status: true,
        createdAt: true,
        lastUsedAt: true,
        revokedAt: true
      }
    })
    return credentials.map((credential) => ({
      credentialId: credential.credentialId,
      clientId: credential.clientId,
      scopes: credential.scopes as string[],
      status: credential.status,
      createdAt: credential.createdAt,
      lastUsedAt: credential.lastUsedAt,
      revokedAt: credential.revokedAt
    }))
  }

  /** findCredentialOwnership returns the minimal Site fact for one Admin credential target. */
  async findCredentialOwnership(credentialId: string): Promise<{ siteId: string } | null> {
    const client = this.prisma.getExecutionClient()
    return client.siteCredential.findUnique({
      where: { credentialId },
      select: { siteId: true }
    })
  }

  /** findPreviewResourceOwnership returns only Site/type/locale facts needed before issuing a preview token. */
  async findPreviewResourceOwnership(input: {
    siteId: string
    resourceType: 'product' | 'blog' | 'news'
    resourceId: string
    locale: string
  }): Promise<{ siteId: string; resourceType: string; localeMatched: boolean } | null> {
    const client = this.prisma.getExecutionClient()
    if (input.resourceType === 'product') {
      const exact = await client.siteProductPublication.findUnique({
        where: {
          siteId_productId_locale: {
            siteId: input.siteId,
            productId: input.resourceId,
            locale: input.locale
          }
        },
        select: { siteId: true }
      })
      if (exact) {
        return { siteId: exact.siteId, resourceType: 'product', localeMatched: true }
      }

      const owned = await client.siteProductPublication.findFirst({
        where: { siteId: input.siteId, productId: input.resourceId },
        select: { siteId: true }
      })
      if (owned) {
        return {
          siteId: owned.siteId,
          resourceType: 'product',
          localeMatched: false
        }
      }

      const foreign = await client.siteProductPublication.findFirst({
        where: { productId: input.resourceId },
        select: { siteId: true, locale: true }
      })
      return foreign
        ? {
            siteId: foreign.siteId,
            resourceType: 'product',
            localeMatched: foreign.locale === input.locale
          }
        : null
    }

    const content = await client.siteContentEntry.findUnique({
      where: { contentId: input.resourceId },
      select: {
        siteId: true,
        contentType: true,
        versions: {
          where: { locale: input.locale },
          select: { locale: true }
        }
      }
    })
    if (!content) {
      return null
    }
    return {
      siteId: content.siteId,
      resourceType: content.contentType,
      localeMatched: content.versions.length > 0
    }
  }

  /** addProductPublication stores site-owned product display configuration. */
  async addProductPublication(input: AddProductPublicationInput) {
    const client = this.prisma.getExecutionClient()
    const publication = await client.siteProductPublication.create({
      data: {
        ...input,
        categoryIds: input.categoryIds ?? []
      }
    })
    return mapProductPublication(publication)
  }

  /** createContentWithLocaleVersion stores one site-scoped content record and its locale draft. */
  async createContentWithLocaleVersion(input: CreateContentWithLocaleVersionInput): Promise<void> {
    const client = this.prisma.getExecutionClient()
    await client.siteContentEntry.create({
      data: {
        contentId: input.contentId,
        siteId: input.siteId,
        tenantId: input.tenantId,
        contentType: input.contentType,
        status: input.status,
        versions: {
          create: {
            contentVersionId: input.contentVersionId,
            locale: input.locale,
            slug: input.slug,
            title: input.title,
            summary: input.summary,
            coverImage: input.coverImage,
            coverImageAlt: input.coverImageAlt ?? null,
            author: input.author,
            tags: [],
            categoryIds: input.categoryIds,
            bodyHtml: input.bodyHtml,
            seoTitle: input.seoTitle,
            seoDescription: input.seoDescription,
            seoImage: input.seoImage,
            publishedAt: input.publishedAt,
            status: input.status,
            syncStatus: input.syncStatus
          }
        }
      }
    })
  }

  /** upsertPublicView stores the latest sync view for one site resource locale. */
  async upsertPublicView(input: UpsertPublicViewInput): Promise<void> {
    const client = this.prisma.getExecutionClient()
    await client.sitePublicViewRevision.upsert({
      where: { siteId_resourceType_resourceId_locale_publishVersion: { siteId: input.siteId, resourceType: input.resourceType, resourceId: input.resourceId, locale: input.locale, publishVersion: input.publishVersion } },
      create: { ...input, payload: input.payload as Prisma.InputJsonValue },
      update: { slug: input.slug, status: input.status, payload: input.payload as Prisma.InputJsonValue, updatedAt: input.updatedAt }
    })
    await client.sitePublicView.upsert({
      where: {
        siteId_resourceType_resourceId_locale: {
          siteId: input.siteId,
          resourceType: input.resourceType,
          resourceId: input.resourceId,
          locale: input.locale
        }
      },
      create: {
        ...input,
        payload: input.payload as Prisma.InputJsonValue
      },
      update: {
        slug: input.slug,
        status: input.status,
        publishVersion: input.publishVersion,
        payload: input.payload as Prisma.InputJsonValue,
        updatedAt: input.updatedAt
      }
    })
    await client.site.update({
      where: { siteId: input.siteId },
      data: { latestPublishVersion: input.publishVersion }
    })
  }

  /** getCommittedSyncTarget verifies one exact immutable site publish target before runtime reads. */
  async getCommittedSyncTarget(input: { siteId: string; targetPublishVersion: number }) {
    const client = this.prisma.getExecutionClient()
    const site = await client.site.findUnique({ where: { siteId: input.siteId }, select: { latestPublishVersion: true } })
    if (!site) return { latestPublishVersion: 0, committed: false }
    const batch = await client.siteSyncBatch.findFirst({ where: { siteId: input.siteId, publishVersion: input.targetPublishVersion, status: 'completed' }, select: { syncId: true } })
    return { latestPublishVersion: site.latestPublishVersion, committed: Boolean(batch) }
  }

  /** createSyncBatch stores one sync batch and its changed resource list. */
  async createSyncBatch(input: CreateSyncBatchInput): Promise<void> {
    const client = this.prisma.getExecutionClient()
    await client.siteSyncBatch.create({
      data: {
        syncId: input.syncId,
        siteId: input.siteId,
        tenantId: input.tenantId,
        publishVersion: input.publishVersion,
        status: input.status,
        triggeredBy: input.triggeredBy,
        completedAt: input.status === 'completed' ? new Date() : null,
        resources: {
          create: input.resources
        }
      }
    })
  }

  /** saveAuditEnvelope persists one site-service audit envelope as the local audit truth. */
  async saveAuditEnvelope(input: SaveAuditEnvelopeInput): Promise<void> {
    const client = this.prisma.getExecutionClient()
    await client.siteAuditEnvelope.create({
      data: {
        ...input,
        siteId: typeof input.details.siteId === 'string' ? input.details.siteId : null,
        details: input.details as Prisma.InputJsonValue
      }
    })
  }

  /** findSiteOverview returns a tenant-scoped management overview for one site. */
  async findSiteOverview(tenantId: string, siteId: string) {
    const client = this.prisma.getExecutionClient()
    const site = await client.site.findFirst({
      where: { tenantId, siteId },
      include: {
        locales: { orderBy: { locale: 'asc' } },
        credentials: { orderBy: { createdAt: 'asc' } },
        runtimeStatus: true
      }
    })

    if (!site) {
      return null
    }

    return {
      siteId: site.siteId,
      tenantId: site.tenantId,
      siteCode: site.siteCode,
      siteName: site.siteName,
      siteType: site.siteType,
      status: site.status,
      defaultLocale: site.defaultLocale,
      latestPublishVersion: site.latestPublishVersion,
      locales: site.locales.map((locale) => ({
        locale: locale.locale,
        status: locale.status,
        isDefault: locale.isDefault
      })),
      credentials: site.credentials.map((credential) => ({
        credentialId: credential.credentialId,
        clientId: credential.clientId,
        scopes: credential.scopes as string[],
        status: credential.status,
        createdAt: credential.createdAt,
        lastUsedAt: credential.lastUsedAt,
        revokedAt: credential.revokedAt
      })),
      runtimeStatus: site.runtimeStatus
    }
  }

  /** listPublicViews returns tenant-scoped public views for one site. */
  async listPublicViews(tenantId: string, siteId: string) {
    const client = this.prisma.getExecutionClient()
    return client.sitePublicView.findMany({
      where: { tenantId, siteId },
      orderBy: [{ resourceType: 'asc' }, { resourceId: 'asc' }, { locale: 'asc' }]
    })
  }

  /** getSyncBatch returns one tenant-scoped sync batch and its resources. */
  async getSyncBatch(tenantId: string, syncId: string) {
    const client = this.prisma.getExecutionClient()
    return client.siteSyncBatch.findFirst({
      where: { tenantId, syncId },
      include: { resources: { orderBy: { resourceType: 'asc' } } }
    })
  }

  /** listAuditEnvelopes returns site-scoped audit facts from the local audit truth. */
  async listAuditEnvelopes(tenantId: string, siteId: string) {
    const client = this.prisma.getExecutionClient()
    return client.siteAuditEnvelope.findMany({
      where: { tenantId, siteId },
      orderBy: { occurredAt: 'asc' }
    })
  }

  /** listSiteAuditLogs returns Admin-facing audit rows for one site and tenant. */
  async listSiteAuditLogs(input: { siteId: string; tenantId?: string }) {
    const client = this.prisma.getExecutionClient()
    const logs = await client.siteAuditEnvelope.findMany({
      where: {
        siteId: input.siteId,
        ...(input.tenantId ? { tenantId: input.tenantId } : {})
      },
      orderBy: { occurredAt: 'desc' }
    })
    return logs.map((log) => ({
      auditId: log.eventId,
      siteId: log.siteId ?? input.siteId,
      operation: log.eventType,
      resourceType: log.resourceType,
      resourceId: log.resourceId ?? '',
      operatorId: log.operatorId ?? '',
      result: log.result,
      reason: '',
      traceId: log.traceId ?? '',
      occurredAt: log.occurredAt
    }))
  }

  /** listSiteCards returns the Admin BFF card workspace read model for one tenant. */
  async listSiteCards(tenantId: string) {
    const client = this.prisma.getExecutionClient()
    const sites = await client.site.findMany({
      where: { tenantId },
      include: {
        locales: true,
        runtimeStatus: true,
        productPublications: { where: { syncStatus: 'pending' }, select: { publicationId: true } },
        contentEntries: {
          select: {
            versions: { where: { syncStatus: 'pending' }, select: { contentVersionId: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return sites.map((site) => {
      const pendingContentCount = site.contentEntries.reduce(
        (count, entry) => count + entry.versions.length,
        0
      )
      const runtimeStatus = site.runtimeStatus

      return {
        siteId: site.siteId,
        siteName: site.siteName,
        siteType: site.siteType,
        primaryDomain: site.primaryDomain ?? '',
        brandId: site.brandId ?? '',
        regionCode: site.regionCode ?? '',
        channelCode: site.channelCode ?? '',
        status: site.status,
        activeLocales: site.locales
          .filter((locale) => locale.status === 'active')
          .map((locale) => locale.locale),
        preparingLocales: site.locales
          .filter((locale) => locale.status === 'preparing')
          .map((locale) => locale.locale),
        runtimeStatus: runtimeStatus?.status ?? 'unknown',
        pendingSyncCount: site.productPublications.length + pendingContentCount,
        latestPublishVersion: site.latestPublishVersion,
        runtimePublishVersion: runtimeStatus?.localPublishVersion ?? 0,
        lastSyncAt: runtimeStatus?.lastSuccessfulSyncAt?.toISOString() ?? '',
        lastErrorSummary: runtimeStatus?.lastErrorMessage ?? ''
      }
    })
  }

  /** updateSiteSettings persists editable site runtime and webhook settings. */
  async updateSiteSettings(input: {
    siteId: string
    siteName: string | null
    primaryDomain: string | null
    previewBaseUrl: string | null
    webhookUrl: string | null
    runtimeStatusUrl: string | null
    allowedOrigins: string[]
  }): Promise<void> {
    const client = this.prisma.getExecutionClient()
    await client.site.update({
      where: { siteId: input.siteId },
      data: {
        ...(input.siteName ? { siteName: input.siteName } : {}),
        primaryDomain: input.primaryDomain,
        previewBaseUrl: input.previewBaseUrl,
        webhookUrl: input.webhookUrl,
        runtimeStatusUrl: input.runtimeStatusUrl,
        allowedOrigins: input.allowedOrigins
      }
    })
  }

  /** disableSite hides a site and all runtime access without deleting its data. */
  async disableSite(input: {
    siteId: string
    disabledAt: Date
    reason: string | null
  }): Promise<void> {
    const client = this.prisma.getExecutionClient()
    await client.site.update({
      where: { siteId: input.siteId },
      data: { status: 'disabled', disabledAt: input.disabledAt }
    })
  }

  /** addPreparingLocale adds a non-public locale for editorial preparation. */
  async addPreparingLocale(input: { siteId: string; locale: string }): Promise<void> {
    const client = this.prisma.getExecutionClient()
    await client.siteLocale.create({
      data: {
        siteId: input.siteId,
        locale: input.locale,
        status: 'preparing',
        isDefault: false
      }
    })
  }

  /** checkLocaleCompleteness verifies locale configuration; page capability coverage is checked separately. */
  async checkLocaleCompleteness(input: {
    siteId: string
    locale: string
  }): Promise<{ complete: boolean; issues: string[] }> {
    const client = this.prisma.getExecutionClient()
    const locale = await client.siteLocale.findUnique({
      where: { siteId_locale: { siteId: input.siteId, locale: input.locale } }
    })
    const issues: string[] = []
    if (!locale) {
      issues.push(`locale ${input.locale} is not configured`)
    }
    return { complete: issues.length === 0, issues }
  }

  /** activateLocale makes a prepared locale public after application-level completeness approval. */
  async activateLocale(input: { siteId: string; locale: string }): Promise<void> {
    const client = this.prisma.getExecutionClient()
    await client.siteLocale.update({
      where: { siteId_locale: { siteId: input.siteId, locale: input.locale } },
      data: { status: 'active' }
    })
    await this.markSiteExposurePending({ siteId: input.siteId })
  }

  /** disableLocale hides a non-default locale from runtime publication. */
  async disableLocale(input: { siteId: string; locale: string }): Promise<void> {
    const client = this.prisma.getExecutionClient()
    const locale = await client.siteLocale.findUnique({
      where: { siteId_locale: { siteId: input.siteId, locale: input.locale } }
    })
    if (locale?.isDefault) {
      throw new Error('default locale cannot be disabled')
    }
    await client.siteLocale.update({
      where: { siteId_locale: { siteId: input.siteId, locale: input.locale } },
      data: { status: 'disabled' }
    })
    await this.markSiteExposurePending({ siteId: input.siteId })
  }

  /** markLocaleResourcesPending marks all resources in a disabled locale for explicit status sync. */
  async markLocaleResourcesPending(input: { siteId: string; locale: string }): Promise<void> {
    const client = this.prisma.getExecutionClient()
    await Promise.all([
      client.siteProductPublication.updateMany({
        where: { siteId: input.siteId, locale: input.locale },
        data: { syncStatus: 'pending', syncRevision: { increment: 1 } }
      }),
      client.siteCategoryPublication.updateMany({
        where: { siteId: input.siteId, locale: input.locale },
        data: { syncStatus: 'pending', syncRevision: { increment: 1 } }
      }),
      client.siteContentLocaleVersion.updateMany({
        where: {
          locale: input.locale,
          contentEntry: { siteId: input.siteId }
        },
        data: { syncStatus: 'pending', syncRevision: { increment: 1 } }
      })
    ])
  }

  /** getLocaleStatus returns the current locale lifecycle status for public-view status mapping. */
  async getLocaleStatus(input: { siteId: string; locale: string }): Promise<string | null> {
    const client = this.prisma.getExecutionClient()
    const locale = await client.siteLocale.findUnique({
      where: { siteId_locale: { siteId: input.siteId, locale: input.locale } },
      select: { status: true }
    })
    return locale?.status ?? null
  }

  /** listSiteProducts returns site-owned product display records only, never Product Master internals. */
  async listSiteProducts(input: { siteId: string; locale?: string }) {
    const client = this.prisma.getExecutionClient()
    const publications = await client.siteProductPublication.findMany({
      where: { siteId: input.siteId, ...(input.locale ? { locale: input.locale } : {}) },
      orderBy: [{ locale: 'asc' }, { displayTitle: 'asc' }]
    })
    return publications.map(mapProductPublication)
  }

  /** listSiteCategories returns site-owned category projections for Admin management. */
  async listSiteCategories(input: { siteId: string; locale?: string }) {
    const client = this.prisma.getExecutionClient()
    const categories = await client.siteCategoryPublication.findMany({
      where: { siteId: input.siteId, ...(input.locale ? { locale: input.locale } : {}) },
      orderBy: [{ locale: 'asc' }, { sortOrder: 'asc' }, { displayTitle: 'asc' }]
    })
    return categories.map(mapCategoryPublication)
  }

  /** createSiteCategory stores one site-owned category projection and marks it pending sync. */
  async createSiteCategory(input: UpsertSiteCategoryInput) {
    const client = this.prisma.getExecutionClient()
    const category = await client.siteCategoryPublication.create({
      data: {
        categoryId: input.categoryId,
        siteId: input.siteId,
        tenantId: requiredRepositoryValue(input.tenantId, 'tenantId'),
        parentCategoryId: input.parentCategoryId,
        sourceCategoryId: input.sourceCategoryId,
        locale: input.locale,
        slug: input.slug,
        displayTitle: input.displayTitle,
        description: input.description,
        image: input.image,
        sortOrder: input.sortOrder,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        seoImage: input.seoImage,
        publishStatus: input.publishStatus,
        syncStatus: input.syncStatus
      }
    })
    return mapCategoryPublication(category)
  }

  /** updateSiteCategory updates one site-owned category projection and marks it pending sync. */
  async updateSiteCategory(input: UpsertSiteCategoryInput) {
    const client = this.prisma.getExecutionClient()
    const category = await client.siteCategoryPublication.update({
      where: {
        siteId_categoryId_locale: {
          siteId: input.siteId,
          categoryId: input.categoryId,
          locale: input.locale
        }
      },
      data: {
        parentCategoryId: input.parentCategoryId,
        sourceCategoryId: input.sourceCategoryId,
        slug: input.slug,
        displayTitle: input.displayTitle,
        description: input.description,
        image: input.image,
        sortOrder: input.sortOrder,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        seoImage: input.seoImage,
        publishStatus: input.publishStatus,
        syncStatus: input.syncStatus,
        syncRevision: { increment: 1 }
      }
    })
    return mapCategoryPublication(category)
  }

  /** unpublishSiteCategory marks one category projection unpublished and pending sync. */
  async unpublishSiteCategory(input: {
    siteId: string
    categoryId: string
    locale: string
  }): Promise<void> {
    const client = this.prisma.getExecutionClient()
    await client.siteCategoryPublication.update({
      where: {
        siteId_categoryId_locale: {
          siteId: input.siteId,
          categoryId: input.categoryId,
          locale: input.locale
        }
      },
      data: {
        publishStatus: 'unpublished',
        syncStatus: 'pending',
        syncRevision: { increment: 1 }
      }
    })
  }

  /** searchProductMasterForAdd exposes a P1 anti-corruption placeholder until Product Master public-safe contract lands. */
  async searchProductMasterForAdd(input: {
    siteId: string
    keyword?: string
    page: number
    pageSize: number
  }) {
    const keyword = input.keyword?.trim()
    if (!keyword) {
      return { candidates: [], total: 0 }
    }
    return {
      candidates: [
        {
          productId: `mock_${slugFromText(keyword)}`,
          displayName: keyword,
          model: '',
          brand: '',
          categoryIds: []
        }
      ],
      total: 1
    }
  }

  /** getSiteProductPublication returns one site-owned product display record. */
  async getSiteProductPublication(input: { siteId: string; publicationId: string }) {
    const client = this.prisma.getExecutionClient()
    const publication = await client.siteProductPublication.findFirst({
      where: { siteId: input.siteId, publicationId: input.publicationId }
    })
    return publication ? mapProductPublication(publication) : null
  }

  /** findCredentialForVerification returns the decrypted credential material required for HMAC verification. */
  async findCredentialForVerification(siteId: string, clientId: string, credentialId: string) {
    const client = this.prisma.getExecutionClient()
    const credential = await client.siteCredential.findFirst({
      where: { siteId, clientId, credentialId },
      include: { site: { select: { status: true } } }
    })

    if (!credential?.secretCiphertext) {
      return null
    }

    return {
      siteId: credential.siteId,
      clientId: credential.clientId,
      credentialId: credential.credentialId,
      clientSecret: unprotectSecret(credential.secretCiphertext),
      scopes: credential.scopes as string[],
      status: credential.status as 'active' | 'rotating' | 'revoked',
      siteStatus: credential.site.status as 'active' | 'draft' | 'disabled'
    }
  }

  /** findTenantIdForSite provides the Site ownership fact for Runtime audit and Admin authorization. */
  async findTenantIdForSite(siteId: string): Promise<string | null> {
    const client = this.prisma.getExecutionClient()
    const site = await client.site.findUnique({ where: { siteId }, select: { tenantId: true } })
    return site?.tenantId ?? null
  }

  /** rememberCredentialNonce records a nonce inside the replay window and rejects duplicates. */
  async rememberCredentialNonce(input: {
    siteId: string
    credentialId: string
    nonce: string
    now: Date
    ttlMilliseconds: number
  }): Promise<boolean> {
    const client = this.prisma.getExecutionClient()
    await client.siteCredentialNonce.deleteMany({ where: { expiresAt: { lt: input.now } } })

    try {
      await client.siteCredentialNonce.create({
        data: {
          credentialId: input.credentialId,
          nonce: input.nonce,
          expiresAt: new Date(input.now.getTime() + input.ttlMilliseconds)
        }
      })
      return true
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return false
      }
      throw error
    }
  }

  /** updateSiteProductPublication updates site-owned display config and marks the publication pending sync. */
  async updateSiteProductPublication(input: {
    publicationId: string
    siteId: string
    slug: string
    displayTitle: string
    displayDescription: string
    seoTitle: string
    seoDescription: string
    seoImage: string | null
    imageOverride: string | null
    categoryIds?: string[]
    publishStatus: string
    syncStatus: string
  }) {
    const client = this.prisma.getExecutionClient()
    const publication = await client.siteProductPublication.update({
      where: { publicationId: input.publicationId },
      data: {
        slug: input.slug,
        displayTitle: input.displayTitle,
        displayDescription: input.displayDescription,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        seoImage: input.seoImage,
        imageOverride: input.imageOverride,
        categoryIds: input.categoryIds ?? [],
        publishStatus: input.publishStatus,
        syncStatus: input.syncStatus,
        syncRevision: { increment: 1 }
      }
    })
    return mapProductPublication(publication)
  }

  /** unpublishSiteProduct marks one product publication unpublished and pending sync. */
  async unpublishSiteProduct(input: { siteId: string; publicationId: string }): Promise<void> {
    const client = this.prisma.getExecutionClient()
    await client.siteProductPublication.update({
      where: { publicationId: input.publicationId },
      data: {
        publishStatus: 'unpublished',
        syncStatus: 'pending',
        syncRevision: { increment: 1 }
      }
    })
  }

  /** getLatestPublishState returns the latest site version and sync id for Site Runtime pull fallback. */
  async getLatestPublishState(siteId: string) {
    const client = this.prisma.getExecutionClient()
    const site = await client.site.findUnique({
      where: { siteId },
      select: { latestPublishVersion: true }
    })
    const latestSync = await client.siteSyncBatch.findFirst({
      where: { siteId, status: 'completed' },
      orderBy: { completedAt: 'desc' },
      select: { syncId: true }
    })

    return {
      latestPublishVersion: site?.latestPublishVersion ?? 0,
      latestSyncId: latestSync?.syncId ?? ''
    }
  }

  /** updateRuntimeSyncResult stores Site Runtime sync feedback for management overview/status. */
  async updateRuntimeSyncResult(input: {
    siteId: string
    syncId?: string
    localPublishVersion: number
    status: string
    startedAt?: string
    completedAt?: string
    errorCode?: string
    errorMessage?: string
    reportedAt: Date
  }): Promise<void> {
    const client = this.prisma.getExecutionClient()
    await client.siteRuntimeStatus.upsert({
      where: { siteId: input.siteId },
      create: {
        siteId: input.siteId,
        status: runtimeHealthFromSyncStatus(input.status),
        localPublishVersion: input.localPublishVersion,
        lastSyncStatus: input.status,
        lastSuccessfulSyncAt: input.status === 'completed' ? input.reportedAt : null,
        lastErrorCode: input.errorCode,
        lastErrorMessage: input.errorMessage,
        storeReady: input.status !== 'failed',
        syncInProgress: false,
        pendingSync: false,
        reportedAt: input.reportedAt
      },
      update: {
        status: runtimeHealthFromSyncStatus(input.status),
        localPublishVersion: input.localPublishVersion,
        lastSyncStatus: input.status,
        lastSuccessfulSyncAt: input.status === 'completed' ? input.reportedAt : undefined,
        lastErrorCode: input.errorCode,
        lastErrorMessage: input.errorMessage,
        storeReady: input.status !== 'failed',
        syncInProgress: false,
        pendingSync: false,
        reportedAt: input.reportedAt
      }
    })
  }

  /** createContentEntry stores a site-scoped Blog/News container without locale content. */
  async createContentEntry(input: {
    contentId: string
    siteId: string
    tenantId: string
    contentType: string
    status: string
  }) {
    const client = this.prisma.getExecutionClient()
    return client.siteContentEntry.create({ data: input, include: { versions: true } })
  }

  /** listSiteContents returns site-scoped Blog/News records with locale versions. */
  async listSiteContents(input: { siteId: string; contentType?: string }) {
    const client = this.prisma.getExecutionClient()
    const contents = await client.siteContentEntry.findMany({
      where: {
        siteId: input.siteId,
        ...(input.contentType ? { contentType: input.contentType } : {})
      },
      include: { versions: { orderBy: { locale: 'asc' } } },
      orderBy: { updatedAt: 'desc' }
    })
    return contents.map(mapContentEntry)
  }

  /** getSiteContent returns one site-scoped Blog/News record with locale versions. */
  async getSiteContent(input: { siteId: string; contentId: string }) {
    const client = this.prisma.getExecutionClient()
    const content = await client.siteContentEntry.findFirst({
      where: { siteId: input.siteId, contentId: input.contentId },
      include: { versions: { orderBy: { locale: 'asc' } } }
    })
    return content ? mapContentEntry(content) : null
  }

  /** findContentOwnership returns only the Site and type needed to authorize one Content parent. */
  async findContentOwnership(
    contentId: string
  ): Promise<{ siteId: string; contentType: string } | null> {
    const client = this.prisma.getExecutionClient()
    return client.siteContentEntry.findUnique({
      where: { contentId },
      select: { siteId: true, contentType: true }
    })
  }

  /** updateContentLocaleVersion upserts one locale draft and marks it pending for explicit sync. */
  async updateContentLocaleVersion(input: {
    contentVersionId: string
    contentId: string
    siteId: string
    tenantId: string
    locale: string
    slug: string
    title: string
    bodyHtml: string
    summary: string | null
    coverImage: string | null
    coverImageAlt?: string | null
    author: string | null
    categoryIds: string[]
    seoTitle: string
    seoDescription: string
    seoImage: string | null
    publishedAt: Date | null
    status: string
    syncStatus: string
  }): Promise<{
    version: unknown
    slugChanged: boolean
    previousSlug: string | null
  } | null> {
    const client = this.prisma.getExecutionClient()
    /** Serializes slug reservation and locale CAS for one stable Content identity. */
    const ownedParents = await client.$queryRaw<Array<{ contentId: string; contentType: string }>>(
      Prisma.sql`
        SELECT "contentId", "contentType"
        FROM "SiteContentEntry"
        WHERE "siteId" = ${input.siteId} AND "contentId" = ${input.contentId}
        FOR UPDATE
      `
    )
    const ownedParent = ownedParents[0]
    if (!ownedParent) {
      return null
    }
    const reservation = await this.reserveDynamicSlug({
      siteId: input.siteId,
      namespace: siteSlugNamespaceForContentType(ownedParent.contentType),
      locale: input.locale,
      slug: input.slug,
      resourceId: input.contentId
    })
    /** findScopedVersion reads history only from the authorized Site/content/locale composite. */
    const findScopedVersion = () =>
      client.siteContentLocaleVersion.findFirst({
        where: {
          contentId: input.contentId,
          locale: input.locale,
          contentEntry: { siteId: input.siteId }
        }
      })
    /** updateData builds one complete locale mutation while preserving calculated slug history. */
    const updateData = () => ({
      slug: reservation.normalizedSlug,
      title: input.title,
      summary: input.summary,
      coverImage: input.coverImage,
      coverImageAlt: input.coverImageAlt ?? null,
      author: input.author,
      tags: [],
      categoryIds: input.categoryIds,
      historicalSlugs: reservation.historicalSlugs,
      bodyHtml: input.bodyHtml,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      seoImage: input.seoImage,
      publishedAt: input.publishedAt,
      status: input.status,
      syncStatus: input.syncStatus,
      syncRevision: { increment: 1 }
    })
    /** updateExisting uses a scoped compare-and-swap loop so committed intermediate slugs remain historical. */
    const updateExisting = async (initial: {
      slug: string
      historicalSlugs: Prisma.JsonValue
      syncRevision: number
    }) => {
      let existing = initial
      for (;;) {
        const slugChanged = existing.slug !== reservation.normalizedSlug
        const result = await client.siteContentLocaleVersion.updateMany({
          where: {
            contentId: input.contentId,
            locale: input.locale,
            slug: existing.slug,
            syncRevision: existing.syncRevision,
            contentEntry: { siteId: input.siteId }
          },
          data: updateData()
        })
        if (result.count === 1) {
          const version = await findScopedVersion()
          return version
            ? {
                version,
                slugChanged,
                previousSlug: slugChanged ? existing.slug : null
              }
            : null
        }
        const latest = await findScopedVersion()
        if (!latest) {
          return null
        }
        existing = latest
      }
    }

    const existing = await findScopedVersion()
    if (existing) {
      return updateExisting(existing)
    }

    const created = await client.siteContentLocaleVersion.createMany({
      data: {
        contentVersionId: input.contentVersionId,
        contentId: input.contentId,
        locale: input.locale,
        slug: reservation.normalizedSlug,
        title: input.title,
        summary: input.summary,
        coverImage: input.coverImage,
        coverImageAlt: input.coverImageAlt ?? null,
        author: input.author,
        tags: [],
        categoryIds: input.categoryIds,
        historicalSlugs: reservation.historicalSlugs,
        bodyHtml: input.bodyHtml,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        seoImage: input.seoImage,
        publishedAt: input.publishedAt,
        status: input.status,
        syncStatus: input.syncStatus
      },
      skipDuplicates: true
    })
    if (created.count === 1) {
      const version = await findScopedVersion()
      return version ? { version, slugChanged: false, previousSlug: null } : null
    }
    const concurrent = await findScopedVersion()
    return concurrent ? updateExisting(concurrent) : null
  }

  /** listActiveSiteLocales returns active locale codes used for publish completeness checks. */
  async listActiveSiteLocales(input: { siteId: string }): Promise<string[]> {
    const client = this.prisma.getExecutionClient()
    const locales = await client.siteLocale.findMany({
      where: { siteId: input.siteId, status: 'active' },
      select: { locale: true },
      orderBy: { locale: 'asc' }
    })
    return locales.map((locale) => locale.locale)
  }

  /** createContentCategory stores one site-scoped Blog/News Category as a publishable archive taxonomy record. */
  async createContentCategory(input: {
    categoryId: string
    siteId: string
    tenantId: string
    sortOrder: number
    syncStatus: string
  }) {
    const client = this.prisma.getExecutionClient()
    const category = await client.siteContentCategory.create({
      data: {
        categoryId: input.categoryId,
        siteId: input.siteId,
        tenantId: input.tenantId,
        sortOrder: input.sortOrder,
        syncStatus: input.syncStatus
      },
      include: { versions: true }
    })
    return mapContentCategory(category)
  }

  /** updateContentCategoryLocaleVersion upserts one Category locale version and preserves historical slugs on slug changes. */
  async updateContentCategoryLocaleVersion(input: {
    categoryVersionId: string
    categoryId: string
    siteId: string
    locale: string
    slug: string
    displayName: string
    archiveIntro: string | null
    archiveLabel: string | null
    seoTitle: string
    seoDescription: string
    seoImage: string | null
    syncStatus: string
  }) {
    const client = this.prisma.getExecutionClient()
    const ownedCategory = await client.siteContentCategory.findFirst({
      where: { siteId: input.siteId, categoryId: input.categoryId },
      select: { categoryId: true }
    })
    if (!ownedCategory) {
      throw new Error('content category not found')
    }
    const reservation = await this.reserveDynamicSlug({
      siteId: input.siteId,
      namespace: 'article-category',
      locale: input.locale,
      slug: input.slug,
      resourceId: input.categoryId
    })
    const version = await client.siteContentCategoryLocaleVersion.upsert({
      where: { categoryId_locale: { categoryId: input.categoryId, locale: input.locale } },
      create: {
        categoryVersionId: input.categoryVersionId,
        categoryId: input.categoryId,
        siteId: input.siteId,
        locale: input.locale,
        slug: reservation.normalizedSlug,
        displayName: input.displayName,
        archiveIntro: input.archiveIntro,
        archiveLabel: input.archiveLabel,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        seoImage: input.seoImage,
        historicalSlugs: reservation.historicalSlugs,
        syncStatus: input.syncStatus
      },
      update: {
        siteId: input.siteId,
        slug: reservation.normalizedSlug,
        displayName: input.displayName,
        archiveIntro: input.archiveIntro,
        archiveLabel: input.archiveLabel,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        seoImage: input.seoImage,
        historicalSlugs: reservation.historicalSlugs,
        syncStatus: input.syncStatus,
        syncRevision: { increment: 1 }
      }
    })
    await client.siteContentCategory.update({
      where: { categoryId: input.categoryId },
      data: { syncStatus: 'pending' }
    })
    return mapContentCategoryLocaleVersion(version)
  }

  /** deleteContentCategory removes only unreferenced Categories and preserves published identities as tombstones. */
  async deleteContentCategory(input: { siteId: string; categoryId: string }): Promise<{ tombstoned: boolean }> {
    const client = this.prisma.getExecutionClient()
    const usage = await this.getContentCategoryUsage(input)
    if (usage.blogCount + usage.newsCount + usage.draftReferenceCount > 0) throw new Error(`category ${input.categoryId} is still referenced by Article drafts or published revisions`)
    const category = await client.siteContentCategory.findFirst({ where: { ...input, deletedAt: null }, select: { categoryId: true, publishedVersions: { select: { categoryId: true } } } })
    if (!category) throw new Error('content category not found')
    if (category.publishedVersions.length === 0) {
      await client.siteSlugLedger.deleteMany({ where: { siteId: input.siteId, namespace: 'article-category', resourceId: input.categoryId, publicationRole: null } })
      await client.siteContentCategory.delete({ where: { categoryId: input.categoryId } })
      return { tombstoned: false }
    }
    await client.siteContentCategory.update({ where: { categoryId: input.categoryId }, data: { deletedAt: new Date(), syncStatus: 'pending' } })
    const versions = await client.siteContentCategoryLocaleVersion.findMany({ where: { categoryId: input.categoryId }, select: { locale: true, syncRevision: true } })
    await Promise.all(versions.map((version) => client.siteContentCategoryLocaleVersion.update({ where: { categoryId_locale: { categoryId: input.categoryId, locale: version.locale } }, data: { syncStatus: 'pending', syncRevision: { increment: 1 }, publicationRequestedRevision: version.syncRevision + 1 } })))
    return { tombstoned: true }
  }

  /** listContentCategories returns site-scoped Category read models for Admin management. */
  async listContentCategories(input: { siteId: string; locale?: string }) {
    const client = this.prisma.getExecutionClient()
    const categories = await client.siteContentCategory.findMany({
      where: {
        siteId: input.siteId,
        deletedAt: null
      },
      include: {
        versions: {
          where: input.locale ? { locale: input.locale } : undefined,
          orderBy: { locale: 'asc' }
        },
        publishedVersions: { where: input.locale ? { locale: input.locale } : undefined, orderBy: { locale: 'asc' } }
      },
      orderBy: [{ sortOrder: 'asc' }, { categoryId: 'asc' }]
    })
    return categories.map(mapContentCategory)
  }

  /** reorderContentCategories applies a complete deterministic global rank without per-type ordering. */
  async reorderContentCategories(input: { siteId: string; orderedCategoryIds: string[] }) {
    const client = this.prisma.getExecutionClient()
    const current = await client.siteContentCategory.findMany({ where: { siteId: input.siteId, deletedAt: null }, select: { categoryId: true } })
    if (current.length !== input.orderedCategoryIds.length || new Set(input.orderedCategoryIds).size !== current.length || current.some((category) => !input.orderedCategoryIds.includes(category.categoryId))) throw new Error('orderedCategoryIds must contain every non-deleted Category exactly once')
    await Promise.all(input.orderedCategoryIds.map((categoryId, index) => client.siteContentCategory.update({ where: { categoryId }, data: { sortOrder: index, syncStatus: 'pending' } })))
    return this.listContentCategories({ siteId: input.siteId })
  }

  /** saveFaqDirectoryPending marks one locale directory dirty without publishing on editorial save. */
  private async saveFaqDirectoryPending(siteId: string, locale: string): Promise<void> {
    const client = this.prisma.getExecutionClient()
    await client.siteFaqDirectoryDraft.upsert({
      where: { siteId_locale: { siteId, locale } },
      create: { siteId, locale, syncStatus: 'pending' },
      update: { syncStatus: 'pending', syncRevision: { increment: 1 } }
    })
  }

  /** createFaqCategory persists a site-owned, single-level FAQ Category. */
  async createFaqCategory(input: { categoryId: string; siteId: string; tenantId: string }) {
    const client = this.prisma.getExecutionClient()
    return client.siteFaqCategory.create({ data: { ...input, status: 'draft', syncStatus: 'pending' }, include: { versions: true } })
  }

  /** listFaqCategories returns only Categories owned by the requested site with deterministic locale ordering. */
  async listFaqCategories(input: { siteId: string; locale?: string }) {
    const client = this.prisma.getExecutionClient()
    return client.siteFaqCategory.findMany({ where: { siteId: input.siteId }, include: { versions: { where: input.locale ? { locale: input.locale } : undefined, orderBy: [{ sortOrder: 'asc' }, { categoryId: 'asc' }] } }, orderBy: { createdAt: 'asc' } })
  }

  /** getFaqCategory reads a Category only through its owning site boundary. */
  async getFaqCategory(input: { siteId: string; categoryId: string }) {
    const client = this.prisma.getExecutionClient()
    return client.siteFaqCategory.findFirst({ where: input, include: { versions: { orderBy: [{ sortOrder: 'asc' }, { locale: 'asc' }] } } })
  }

  /** listFaqEntries returns Entries of exactly one owned FAQ Category in deterministic order. */
  async listFaqEntries(input: { siteId: string; categoryId?: string; locale?: string }) {
    const client = this.prisma.getExecutionClient()
    return client.siteFaqEntry.findMany({ where: { siteId: input.siteId, ...(input.categoryId ? { categoryId: input.categoryId } : {}) }, include: { versions: { where: input.locale ? { locale: input.locale } : undefined, orderBy: [{ sortOrder: 'asc' }, { entryId: 'asc' }] } }, orderBy: { createdAt: 'asc' } })
  }

  /** getFaqEntry reads one Entry through its owning site boundary. */
  async getFaqEntry(input: { siteId: string; entryId: string }) {
    const client = this.prisma.getExecutionClient()
    return client.siteFaqEntry.findFirst({ where: input, include: { versions: { orderBy: [{ sortOrder: 'asc' }, { locale: 'asc' }] } } })
  }

  /** disableFaqCategory rejects lifecycle changes while any published Entry remains in the Category. */
  async disableFaqCategory(input: { siteId: string; categoryId: string }) {
    const client = this.prisma.getExecutionClient()
    const activeEntries = await client.siteFaqEntry.count({ where: { siteId: input.siteId, categoryId: input.categoryId, status: 'active' } })
    if (activeEntries > 0) throw new Error('faq category still contains published entries')
    const versions = await client.siteFaqCategoryLocaleVersion.findMany({ where: { categoryId: input.categoryId, siteId: input.siteId }, select: { locale: true } })
    await client.siteFaqCategory.updateMany({ where: input, data: { status: 'disabled', syncStatus: 'pending' } })
    await Promise.all(versions.map((version) => this.saveFaqDirectoryPending(input.siteId, version.locale)))
  }

  /** unpublishFaqEntry withdraws only the requested locale and marks its directory pending. */
  async unpublishFaqEntry(input: { siteId: string; entryId: string; locale: string }) {
    const client = this.prisma.getExecutionClient()
    const entry = await client.siteFaqEntry.findFirst({ where: { siteId: input.siteId, entryId: input.entryId } })
    if (!entry) return false
    const updated = await client.siteFaqEntryLocaleVersion.updateMany({ where: { entryId: input.entryId, locale: input.locale }, data: { status: 'unpublished', syncStatus: 'pending', syncRevision: { increment: 1 } } })
    if (updated.count === 1) {
      const remainingPublished = await client.siteFaqEntryLocaleVersion.count({ where: { entryId: input.entryId, status: 'active' } })
      if (remainingPublished === 0) await client.siteFaqEntry.update({ where: { entryId: input.entryId }, data: { status: 'unpublished', syncStatus: 'pending' } })
      await this.saveFaqDirectoryPending(input.siteId, input.locale)
    }
    return updated.count === 1
  }

  /** updateFaqCategoryLocaleVersion saves locale content and reserves its site+locale anchor key. */
  async updateFaqCategoryLocaleVersion(input: { categoryVersionId: string; categoryId: string; siteId: string; locale: string; title: string; anchorKey: string; sortOrder: number }) {
    const client = this.prisma.getExecutionClient()
    const owned = await client.siteFaqCategory.findFirst({ where: { categoryId: input.categoryId, siteId: input.siteId } })
    if (!owned) throw new Error('faq category not found')
    const version = await client.siteFaqCategoryLocaleVersion.upsert({
      where: { categoryId_locale: { categoryId: input.categoryId, locale: input.locale } },
      create: { categoryVersionId: input.categoryVersionId, categoryId: input.categoryId, siteId: input.siteId, locale: input.locale, title: input.title, anchorKey: input.anchorKey, sortOrder: input.sortOrder, syncStatus: 'pending' },
      update: { title: input.title, anchorKey: input.anchorKey, sortOrder: input.sortOrder, syncStatus: 'pending', syncRevision: { increment: 1 } }
    })
    await client.siteFaqCategory.update({ where: { categoryId: input.categoryId }, data: { status: 'active', syncStatus: 'pending' } })
    await this.saveFaqDirectoryPending(input.siteId, input.locale)
    return version
  }

  /** createFaqEntry persists an entry bound to exactly one site-owned FAQ Category. */
  async createFaqEntry(input: { entryId: string; siteId: string; tenantId: string; categoryId: string }) {
    const client = this.prisma.getExecutionClient()
    const category = await client.siteFaqCategory.findFirst({ where: { categoryId: input.categoryId, siteId: input.siteId } })
    if (!category) throw new Error('faq category not found')
    return client.siteFaqEntry.create({ data: { ...input, status: 'draft', syncStatus: 'pending' }, include: { versions: true } })
  }

  /** updateFaqEntryLocaleVersion saves an FAQ answer draft and dirties only its locale directory. */
  async updateFaqEntryLocaleVersion(input: { entryVersionId: string; entryId: string; siteId: string; locale: string; question: string; answerHtml: string; sortOrder: number }) {
    const client = this.prisma.getExecutionClient()
    const owned = await client.siteFaqEntry.findFirst({ where: { entryId: input.entryId, siteId: input.siteId } })
    if (!owned) throw new Error('faq entry not found')
    const version = await client.siteFaqEntryLocaleVersion.upsert({
      where: { entryId_locale: { entryId: input.entryId, locale: input.locale } },
      create: { entryVersionId: input.entryVersionId, entryId: input.entryId, locale: input.locale, question: input.question, answerHtml: input.answerHtml, sortOrder: input.sortOrder, status: 'active', syncStatus: 'pending' },
      update: { question: input.question, answerHtml: input.answerHtml, sortOrder: input.sortOrder, status: 'active', syncStatus: 'pending', syncRevision: { increment: 1 } }
    })
    await client.siteFaqEntry.update({ where: { entryId: input.entryId }, data: { status: 'active', syncStatus: 'pending' } })
    await this.saveFaqDirectoryPending(input.siteId, input.locale)
    return version
  }

  /** getFaqDirectoryForPublicView assembles one locale's published directory source with no cross-locale fallback. */
  async getFaqDirectoryForPublicView(input: { siteId: string; locale: string; expectedRevision?: number }) {
    const client = this.prisma.getExecutionClient()
    const draft = await client.siteFaqDirectoryDraft.findUnique({ where: { siteId_locale: { siteId: input.siteId, locale: input.locale } } })
    if (!draft || (input.expectedRevision !== undefined && draft.syncRevision !== input.expectedRevision)) return null
    const categories = await client.siteFaqCategoryLocaleVersion.findMany({
      where: { siteId: input.siteId, locale: input.locale, category: { status: 'active' } },
      include: { category: { include: { entries: { where: { siteId: input.siteId, status: 'active' }, include: { versions: { where: { locale: input.locale, status: 'active' } } } } } } }
    })
    return categories.map(category => ({ categoryId: category.categoryId, title: category.title, anchorKey: category.anchorKey, sortOrder: category.sortOrder, entries: category.category.entries.flatMap(entry => entry.versions.map(version => ({ entryId: entry.entryId, question: version.question, answerHtml: version.answerHtml, sortOrder: version.sortOrder }))) }))
  }

  /** getContentCategory returns one site-scoped Category read model with locale versions. */
  async getContentCategory(input: { siteId: string; categoryId: string }) {
    const client = this.prisma.getExecutionClient()
    const category = await client.siteContentCategory.findFirst({
      where: { siteId: input.siteId, categoryId: input.categoryId, deletedAt: null },
      include: { versions: { orderBy: { locale: 'asc' } }, publishedVersions: { orderBy: { locale: 'asc' } } }
    })
    return category ? mapContentCategory(category) : null
  }

  /** getContentCategoryUsage projects Article references for admin delete blockers and published-usage indicators. */
  async getContentCategoryUsage(input: { siteId: string; categoryId: string }) {
    const client = this.prisma.getExecutionClient()
    const [blogCount, newsCount, drafts] = await Promise.all([
      client.sitePublicView.count({ where: { siteId: input.siteId, resourceType: 'blog', status: 'published', payload: { path: ['category_ids'], array_contains: [input.categoryId] } } }),
      client.sitePublicView.count({ where: { siteId: input.siteId, resourceType: 'news', status: 'published', payload: { path: ['category_ids'], array_contains: [input.categoryId] } } }),
      client.siteContentLocaleVersion.findMany({ where: { syncStatus: 'pending', contentEntry: { siteId: input.siteId } }, select: { categoryIds: true } })
    ])
    return {
      blogCount,
      newsCount,
      draftReferenceCount: drafts.filter((version) => Array.isArray(version.categoryIds) && version.categoryIds.includes(input.categoryId)).length
    }
  }

  /** publishContentCategoryLocaleVersion snapshots the current draft as the only public revision for its locale. */
  async publishContentCategoryLocaleVersion(input: { siteId: string; categoryId: string; locale: string; expectedRevision?: number; publishedAt?: Date }) {
    const client = this.prisma.getExecutionClient()
    const draft = await client.siteContentCategoryLocaleVersion.findFirst({
      where: { categoryId: input.categoryId, siteId: input.siteId, locale: input.locale, ...(input.expectedRevision === undefined ? {} : { syncRevision: input.expectedRevision }) },
      include: { category: { select: { deletedAt: true } } }
    })
    if (!draft || draft.category.deletedAt) return null
    const published = await client.siteContentCategoryPublishedLocaleVersion.upsert({
      where: { categoryId_locale: { categoryId: input.categoryId, locale: input.locale } },
      create: { categoryId: draft.categoryId, siteId: draft.siteId, locale: draft.locale, slug: draft.slug, displayName: draft.displayName, archiveIntro: draft.archiveIntro, archiveLabel: draft.archiveLabel, seoTitle: draft.seoTitle, seoDescription: draft.seoDescription, seoImage: draft.seoImage, historicalSlugs: draft.historicalSlugs, publishedRevision: 1, publishedAt: input.publishedAt ?? new Date() },
      update: { slug: draft.slug, displayName: draft.displayName, archiveIntro: draft.archiveIntro, archiveLabel: draft.archiveLabel, seoTitle: draft.seoTitle, seoDescription: draft.seoDescription, seoImage: draft.seoImage, historicalSlugs: draft.historicalSlugs, publishedRevision: { increment: 1 }, publishedAt: input.publishedAt ?? new Date() }
    })
    return published
  }

  /** requestContentCategoryLocalePublication snapshots an approved draft and queues only that revision for Site Sync. */
  async requestContentCategoryLocalePublication(input: { siteId: string; categoryId: string; locale: string }) {
    const client = this.prisma.getExecutionClient()
    const draft = await client.siteContentCategoryLocaleVersion.findFirst({ where: { siteId: input.siteId, categoryId: input.categoryId, locale: input.locale, category: { deletedAt: null } } })
    if (!draft) throw new Error('content category locale not found')
    await this.publishContentCategoryLocaleVersion({ ...input, expectedRevision: draft.syncRevision })
    await client.siteContentCategoryLocaleVersion.update({ where: { categoryId_locale: { categoryId: input.categoryId, locale: input.locale } }, data: { publicationRequestedRevision: draft.syncRevision, syncStatus: 'pending' } })
    return mapContentCategoryLocaleVersion(draft)
  }

  /** getContentCategoryLocaleVersionForPublicView returns one Category locale version for public-view generation. */
  async getContentCategoryLocaleVersionForPublicView(input: {
    siteId: string
    categoryId: string
    locale: string
    expectedRevision?: number
  }) {
    const client = this.prisma.getExecutionClient()
    const version = await client.siteContentCategoryLocaleVersion.findFirst({
      where: {
        categoryId: input.categoryId,
        locale: input.locale,
        ...(input.expectedRevision === undefined
          ? {}
          : { syncRevision: input.expectedRevision })
      },
      include: { category: { include: { publishedVersions: { where: { locale: input.locale } } } } }
    })
    if (!version || version.siteId !== input.siteId) {
      return null
    }
    const published = version.category.publishedVersions[0]
    if (!published) return null
    const slugPublication = await this.readDynamicSlugPublication({
      siteId: input.siteId,
      namespace: 'article-category',
      locale: version.locale,
      resourceId: version.categoryId,
      fallbackSlug: version.slug
    })
    return {
      categoryId: version.categoryId,
      locale: version.locale,
      slug: slugPublication.canonicalSlug,
      displayName: published.displayName,
      archiveIntro: published.archiveIntro,
      archiveLabel: published.archiveLabel,
      sortOrder: version.category.sortOrder,
      historicalSlugs: slugPublication.historicalSlugs,
      seoTitle: published.seoTitle,
      seoDescription: published.seoDescription,
      seoImage: published.seoImage
    }
  }

  /** getSitePublishStateForSync returns tenant and current version before a sync transaction. */
  async getSitePublishStateForSync(siteId: string) {
    const client = this.prisma.getExecutionClient()
    const site = await client.site.findUnique({
      where: { siteId },
      select: { tenantId: true, latestPublishVersion: true }
    })

    if (!site) {
      throw new Error('site not found')
    }

    return { tenantId: site.tenantId, currentPublishVersion: site.latestPublishVersion }
  }

  /** listPendingSyncResources returns content and product resources waiting for explicit sync. */
  async listPendingSyncResources(siteId: string) {
    const client = this.prisma.getExecutionClient()
    const [
      products,
      productCategories,
      contentVersions,
      contentCategories,
      locales,
      exposureDraft,
      faqDirectories
    ] = await Promise.all([
      client.siteProductPublication.findMany({
        where: { siteId, syncStatus: 'pending' },
        select: {
          productId: true,
          locale: true,
          updatedAt: true,
          syncRevision: true,
          publishStatus: true
        }
      }),
      client.siteCategoryPublication.findMany({
        where: { siteId, syncStatus: 'pending' },
        select: {
          categoryId: true,
          locale: true,
          updatedAt: true,
          syncRevision: true,
          publishStatus: true
        }
      }),
      client.siteContentLocaleVersion.findMany({
        where: {
          syncStatus: 'pending',
          contentEntry: { siteId }
        },
        include: { contentEntry: { select: { contentType: true } } }
      }),
      client.siteContentCategoryLocaleVersion.findMany({
        where: {
          publicationRequestedRevision: { not: null },
          category: { siteId }
        },
        include: { category: { select: { deletedAt: true } } }
      }),
      client.siteLocale.findMany({
        where: { siteId },
        select: { locale: true, status: true }
      }),
      client.siteExposureDraft.findUnique({
        where: { siteId },
        select: { syncStatus: true, syncRevision: true, updatedAt: true }
      }),
      client.siteFaqDirectoryDraft.findMany({
        where: { siteId, syncStatus: 'pending' },
        select: { locale: true, syncRevision: true, updatedAt: true }
      })
    ])
    const localeStatusByCode = new Map(locales.map((locale) => [locale.locale, locale.status]))

    return [
      ...products.map((product) =>
        pendingSyncResource(
          {
            resourceType: 'product' as const,
            resourceId: product.productId,
            locale: product.locale,
            changeType:
              localeStatusByCode.get(product.locale) === 'disabled'
                ? ('locale_disable' as const)
                : product.publishStatus === 'unpublished'
                  ? ('unpublish' as const)
                  : ('update' as const),
            markedAt: product.updatedAt
          },
          product.syncRevision
        )
      ),
      ...productCategories.map((category) =>
        pendingSyncResource(
          {
            resourceType: 'category' as const,
            resourceId: category.categoryId,
            locale: category.locale,
            changeType:
              localeStatusByCode.get(category.locale) === 'disabled'
                ? ('locale_disable' as const)
                : category.publishStatus === 'unpublished'
                  ? ('unpublish' as const)
                  : ('create' as const),
            markedAt: category.updatedAt
          },
          category.syncRevision
        )
      ),
      ...contentVersions.map((version) =>
        pendingSyncResource(
          {
            resourceType: version.contentEntry.contentType as 'blog' | 'news',
            resourceId: version.contentId,
            locale: version.locale,
            changeType:
              localeStatusByCode.get(version.locale) === 'disabled'
                ? ('locale_disable' as const)
                : version.status === 'unpublished'
                  ? ('unpublish' as const)
                  : ('create' as const),
            markedAt: version.updatedAt
          },
          version.syncRevision
        )
      ),
      ...contentCategories.map((version) =>
        pendingSyncResource(
          {
            resourceType: 'article-category' as const,
            resourceId: version.categoryId,
            locale: version.locale,
            changeType:
              localeStatusByCode.get(version.locale) === 'disabled'
                ? ('locale_disable' as const)
                : version.category.deletedAt
                  ? ('unpublish' as const)
                  : ('update' as const),
            markedAt: version.updatedAt
          },
          version.publicationRequestedRevision!
        )
      ),
      ...faqDirectories.map((directory) =>
        pendingSyncResource(
          {
            resourceType: 'faq' as const,
            resourceId: `${siteId}:faq-directory`,
            locale: directory.locale,
            changeType: 'update' as const,
            markedAt: directory.updatedAt
          },
          directory.syncRevision
        )
      ),
      ...(exposureDraft?.syncStatus === 'pending'
        ? [
            pendingSyncResource(
              {
                resourceType: 'site-exposure' as const,
                resourceId: siteId,
                locale: '',
                changeType: 'update' as const,
                markedAt: exposureDraft.updatedAt
              },
              exposureDraft.syncRevision
            )
          ]
        : [])
    ]
  }

  /** getPendingSyncSummary returns the Admin sync count and resource-type summary. */
  async getPendingSyncSummary(input: { siteId: string }) {
    const resources = await this.listPendingSyncResources(input.siteId)
    return {
      pendingCount: resources.length,
      resourceTypes: Array.from(new Set(resources.map((resource) => resource.resourceType))).sort()
    }
  }

  /** getContentVersionForPublicView returns one draft content version for public-view generation. */
  async getContentVersionForPublicView(input: {
    siteId: string
    contentId: string
    locale: string
    expectedRevision?: number
  }) {
    const client = this.prisma.getExecutionClient()
    const version = await client.siteContentLocaleVersion.findFirst({
      where: {
        contentId: input.contentId,
        locale: input.locale,
        ...(input.expectedRevision === undefined
          ? {}
          : { syncRevision: input.expectedRevision }),
        contentEntry: { siteId: input.siteId }
      },
      include: { contentEntry: { select: { contentType: true } } }
    })

    if (!version) {
      return null
    }
    const namespace = siteSlugNamespaceForContentType(version.contentEntry.contentType)
    const slugPublication = await this.readDynamicSlugPublication({
      siteId: input.siteId,
      namespace,
      locale: version.locale,
      resourceId: version.contentId,
      fallbackSlug: version.slug
    })

    return {
      contentId: version.contentId,
      contentType: version.contentEntry.contentType,
      locale: version.locale,
      slug: slugPublication.canonicalSlug,
      title: version.title,
      bodyHtml: version.bodyHtml,
      summary: version.summary,
      coverImage: version.coverImage,
      coverImageAlt: version.coverImageAlt,
      author: version.author,
      categoryIds: Array.isArray(version.categoryIds) ? (version.categoryIds as string[]) : [],
      historicalSlugs: slugPublication.historicalSlugs,
      seoTitle: version.seoTitle,
      seoDescription: version.seoDescription,
      seoImage: version.seoImage,
      publishedAt: version.publishedAt
    }
  }

  /** getPreviewContentVersionForPublicView returns one draft locale only inside the verified Site and content type. */
  async getPreviewContentVersionForPublicView(input: {
    siteId: string
    resourceType: 'blog' | 'news'
    contentId: string
    locale: string
  }) {
    const client = this.prisma.getExecutionClient()
    const version = await client.siteContentLocaleVersion.findFirst({
      where: {
        contentId: input.contentId,
        locale: input.locale,
        contentEntry: {
          siteId: input.siteId,
          contentType: input.resourceType
        }
      },
      include: { contentEntry: { select: { contentType: true } } }
    })

    if (!version) {
      return null
    }

    return {
      contentId: version.contentId,
      contentType: version.contentEntry.contentType,
      locale: version.locale,
      slug: version.slug,
      title: version.title,
      bodyHtml: version.bodyHtml,
      summary: version.summary,
      coverImage: version.coverImage,
      coverImageAlt: version.coverImageAlt,
      author: version.author,
      tags: Array.isArray(version.tags) ? (version.tags as string[]) : [],
      seoTitle: version.seoTitle,
      seoDescription: version.seoDescription,
      seoImage: version.seoImage,
      publishedAt: version.publishedAt
    }
  }

  /** getProductPublicationForPublicView returns display config needed to build a product public view. */
  async getProductPublicationForPublicView(input: {
    siteId: string
    productId: string
    locale: string
    expectedRevision?: number
  }) {
    const client = this.prisma.getExecutionClient()
    const publication = await client.siteProductPublication.findFirst({
      where: {
        siteId: input.siteId,
        productId: input.productId,
        locale: input.locale,
        ...(input.expectedRevision === undefined
          ? {}
          : { syncRevision: input.expectedRevision })
      }
    })
    if (!publication) {
      return null
    }
    return {
      productId: publication.productId,
      locale: publication.locale,
      slug: publication.slug,
      displayTitle: publication.displayTitle,
      displayDescription: publication.displayDescription,
      seoTitle: publication.seoTitle,
      seoDescription: publication.seoDescription,
      seoImage: publication.seoImage,
      imageOverride: publication.imageOverride,
      categoryIds: publication.categoryIds as string[],
      publishStatus: publication.publishStatus
    }
  }

  /** getCategoryPublicationForPublicView returns display config needed to build a category public view. */
  async getCategoryPublicationForPublicView(input: {
    siteId: string
    categoryId: string
    locale: string
    expectedRevision?: number
  }) {
    const client = this.prisma.getExecutionClient()
    const category = await client.siteCategoryPublication.findFirst({
      where: {
        siteId: input.siteId,
        categoryId: input.categoryId,
        locale: input.locale,
        ...(input.expectedRevision === undefined
          ? {}
          : { syncRevision: input.expectedRevision })
      }
    })
    return category
      ? {
          categoryId: category.categoryId,
          parentCategoryId: category.parentCategoryId,
          locale: category.locale,
          slug: category.slug,
          displayTitle: category.displayTitle,
          description: category.description,
          image: category.image,
          sortOrder: category.sortOrder,
          seoTitle: category.seoTitle,
          seoDescription: category.seoDescription,
          seoImage: category.seoImage,
          publishStatus: category.publishStatus
        }
      : null
  }

  /** markContentVersionSynced clears pending sync state after public-view generation succeeds. */
  async markContentVersionSynced(input: {
    siteId: string
    contentId: string
    locale: string
  }): Promise<boolean> {
    const client = this.prisma.getExecutionClient()
    const result = await client.siteContentLocaleVersion.updateMany({
      where: {
        contentId: input.contentId,
        locale: input.locale,
        contentEntry: { siteId: input.siteId }
      },
      data: { syncStatus: 'synced' }
    })
    return result.count === 1
  }

  /** markProductPublicationSynced clears pending sync state for one product publication. */
  async markProductPublicationSynced(input: {
    siteId: string
    productId: string
    locale: string
  }): Promise<void> {
    const client = this.prisma.getExecutionClient()
    await client.siteProductPublication.update({
      where: {
        siteId_productId_locale: {
          siteId: input.siteId,
          productId: input.productId,
          locale: input.locale
        }
      },
      data: { syncStatus: 'synced' }
    })
  }

  /** markCategoryPublicationSynced clears pending sync state for one category projection. */
  async markCategoryPublicationSynced(input: {
    siteId: string
    categoryId: string
    locale: string
  }): Promise<void> {
    const client = this.prisma.getExecutionClient()
    await client.siteCategoryPublication.update({
      where: {
        siteId_categoryId_locale: {
          siteId: input.siteId,
          categoryId: input.categoryId,
          locale: input.locale
        }
      },
      data: { syncStatus: 'synced' }
    })
  }

  /** markContentCategoryVersionSynced clears pending sync state for one Category locale version. */
  async markContentCategoryVersionSynced(input: {
    categoryId: string
    locale: string
  }): Promise<void> {
    const client = this.prisma.getExecutionClient()
    await client.siteContentCategoryLocaleVersion.update({
      where: { categoryId_locale: { categoryId: input.categoryId, locale: input.locale } },
      data: { syncStatus: 'synced' }
    })
    const pendingVersions = await client.siteContentCategoryLocaleVersion.count({
      where: { categoryId: input.categoryId, syncStatus: 'pending' }
    })
    if (pendingVersions === 0) {
      await client.siteContentCategory.update({
        where: { categoryId: input.categoryId },
        data: { syncStatus: 'synced' }
      })
    }
  }

  /** markPendingResourceSynced clears only the revision captured by one Sync batch using CAS predicates. */
  async markPendingResourceSynced(input: {
    siteId: string
    resourceType: 'product' | 'category' | 'content' | 'blog' | 'news' | 'article-category' | 'faq' | 'site-exposure'
    resourceId: string
    locale: string
    expectedRevision: number
  }): Promise<{ cleared: boolean }> {
    const client = this.prisma.getExecutionClient()
    if (input.resourceType === 'site-exposure') {
      const draft = await client.siteExposureDraft.updateMany({
        where: {
          siteId: input.siteId,
          syncStatus: 'pending',
          syncRevision: input.expectedRevision
        },
        data: { syncStatus: 'synced' }
      })
      if (draft.count === 1) {
        await client.sitePageGovernance.updateMany({
          where: { siteId: input.siteId, syncStatus: 'pending' },
          data: { syncStatus: 'synced' }
        })
      }
      return { cleared: draft.count === 1 }
    }
    if (input.resourceType === 'product') {
      const result = await client.siteProductPublication.updateMany({
        where: {
          siteId: input.siteId,
          productId: input.resourceId,
          locale: input.locale,
          syncStatus: 'pending',
          syncRevision: input.expectedRevision
        },
        data: { syncStatus: 'synced' }
      })
      return { cleared: result.count === 1 }
    }
    if (input.resourceType === 'category') {
      const result = await client.siteCategoryPublication.updateMany({
        where: {
          siteId: input.siteId,
          categoryId: input.resourceId,
          locale: input.locale,
          syncStatus: 'pending',
          syncRevision: input.expectedRevision
        },
        data: { syncStatus: 'synced' }
      })
      return { cleared: result.count === 1 }
    }
    if (input.resourceType === 'article-category') {
      const result = await client.siteContentCategoryLocaleVersion.updateMany({
        where: {
          categoryId: input.resourceId,
          locale: input.locale,
          publicationRequestedRevision: input.expectedRevision
        },
        data: { publicationRequestedRevision: null }
      })
      if (result.count === 1) {
        const pending = await client.siteContentCategoryLocaleVersion.count({
          where: { categoryId: input.resourceId, syncStatus: 'pending' }
        })
        if (pending === 0) {
          await client.siteContentCategory.update({
            where: { categoryId: input.resourceId },
            data: { syncStatus: 'synced' }
          })
        }
      }
      return { cleared: result.count === 1 }
    }
    if (input.resourceType === 'faq') {
      const result = await client.siteFaqDirectoryDraft.updateMany({
        where: { siteId: input.siteId, locale: input.locale, syncStatus: 'pending', syncRevision: input.expectedRevision },
        data: { syncStatus: 'synced' }
      })
      if (result.count === 1) {
        await Promise.all([
          client.siteFaqCategoryLocaleVersion.updateMany({
            where: { siteId: input.siteId, locale: input.locale, syncStatus: 'pending' },
            data: { syncStatus: 'synced' }
          }),
          client.siteFaqEntryLocaleVersion.updateMany({
            where: { locale: input.locale, syncStatus: 'pending', entry: { siteId: input.siteId } },
            data: { syncStatus: 'synced' }
          })
        ])
      }
      return { cleared: result.count === 1 }
    }
    const result = await client.siteContentLocaleVersion.updateMany({
      where: {
        contentId: input.resourceId,
        locale: input.locale,
        syncStatus: 'pending',
        syncRevision: input.expectedRevision,
        contentEntry: { siteId: input.siteId }
      },
      data: { syncStatus: 'synced' }
    })
    return { cleared: result.count === 1 }
  }


  /** unpublishSiteContent marks one content locale version unpublished and pending sync. */
  async unpublishSiteContent(input: {
    siteId: string
    contentId: string
    locale: string
  }): Promise<boolean> {
    const client = this.prisma.getExecutionClient()
    const result = await client.siteContentLocaleVersion.updateMany({
      where: {
        contentId: input.contentId,
        locale: input.locale,
        contentEntry: { siteId: input.siteId }
      },
      data: {
        status: 'unpublished',
        syncStatus: 'pending',
        syncRevision: { increment: 1 }
      }
    })
    return result.count === 1
  }

  /** listSyncHistory returns completed and attempted sync batches for one site. */
  async listSyncHistory(input: { siteId: string }) {
    const client = this.prisma.getExecutionClient()
    const batches = await client.siteSyncBatch.findMany({
      where: { siteId: input.siteId },
      include: {
        resources: { orderBy: [{ resourceType: 'asc' }, { resourceId: 'asc' }, { locale: 'asc' }] }
      },
      orderBy: { startedAt: 'desc' }
    })
    return batches.map(mapSyncBatch)
  }

  /** getSyncDetail returns one sync batch detail only when both Site and sync identifiers match. */
  async getSyncDetail(input: { siteId: string; syncId: string }) {
    const client = this.prisma.getExecutionClient()
    const batch = await client.siteSyncBatch.findFirst({
      where: { siteId: input.siteId, syncId: input.syncId },
      include: {
        resources: { orderBy: [{ resourceType: 'asc' }, { resourceId: 'asc' }, { locale: 'asc' }] }
      }
    })
    return batch ? mapSyncBatch(batch) : null
  }

  /** findSyncOwnership returns one sync's Site and authoritative Site tenant without loading detail. */
  async findSyncOwnership(
    syncId: string
  ): Promise<{ syncId: string; siteId: string; tenantId: string } | null> {
    const client = this.prisma.getExecutionClient()
    const batch = await client.siteSyncBatch.findUnique({
      where: { syncId },
      select: {
        syncId: true,
        siteId: true,
        site: { select: { tenantId: true } }
      }
    })
    return batch
      ? { syncId: batch.syncId, siteId: batch.siteId, tenantId: batch.site.tenantId }
      : null
  }

  /** getLastSyncBatch returns the latest completed sync batch for retry/resend operations. */
  async getLastSyncBatch(input: { siteId: string }) {
    const client = this.prisma.getExecutionClient()
    const batch = await client.siteSyncBatch.findFirst({
      where: { siteId: input.siteId, status: 'completed' },
      orderBy: { publishVersion: 'desc' },
      select: { syncId: true, publishVersion: true }
    })
    return batch
  }

  /** hasInitialWebhookDelivery detects the one initial webhook allowed for a sync batch. */
  async hasInitialWebhookDelivery(input: { syncId: string; eventType: string }): Promise<boolean> {
    const client = this.prisma.getExecutionClient()
    const count = await client.siteWebhookDelivery.count({
      where: { syncId: input.syncId, eventType: input.eventType, resent: false }
    })
    return count > 0
  }

  /** getWebhookDispatchConfig returns the runtime webhook target and active credential signing secret. */
  async getWebhookDispatchConfig(input: {
    siteId: string
  }): Promise<{ targetUrl: string | null; signingSecret: string | null } | null> {
    const client = this.prisma.getExecutionClient()
    const site = await client.site.findUnique({
      where: { siteId: input.siteId },
      select: { webhookUrl: true }
    })
    if (!site) {
      return null
    }
    const credential = await client.siteCredential.findFirst({
      where: { siteId: input.siteId, status: 'active' },
      orderBy: { createdAt: 'desc' },
      select: { secretCiphertext: true }
    })

    return {
      targetUrl: site.webhookUrl,
      signingSecret: credential?.secretCiphertext
        ? unprotectSecret(credential.secretCiphertext)
        : null
    }
  }

  /** recordWebhookDelivery atomically revalidates ownership and stores one delivery with its system audit. */
  async recordWebhookDelivery(input: {
    deliveryId: string
    syncId: string
    siteId: string
    tenantId: string
    eventId: string
    eventType: string
    publishVersion: number
    targetUrl?: string | null
    status?: string
    payload: Record<string, unknown>
    headers: Record<string, unknown>
    resent: boolean
    deliveredAt: Date
    failureReason?: string | null
  }): Promise<void> {
    await this.prisma.runInTransaction(async () => {
      const client = this.prisma.getExecutionClient()
      const batches = await client.$queryRaw<Array<{ syncId: string }>>(
        Prisma.sql`
          SELECT "syncId"
          FROM "SiteSyncBatch"
          WHERE "syncId" = ${input.syncId}
            AND "siteId" = ${input.siteId}
            AND "tenantId" = ${input.tenantId}
          FOR UPDATE
        `
      )
      if (!batches[0]) {
        throw new Error('sync batch not found')
      }
      await client.siteWebhookDelivery.create({
        data: {
          deliveryId: input.deliveryId,
          syncId: input.syncId,
          siteId: input.siteId,
          tenantId: input.tenantId,
          eventId: input.eventId,
          eventType: input.eventType,
          publishVersion: input.publishVersion,
          targetUrl: input.targetUrl ?? null,
          status: input.status ?? 'dispatched',
          attempt: 1,
          resent: input.resent,
          payload: input.payload as Prisma.InputJsonValue,
          headers: input.headers as Prisma.InputJsonValue,
          dispatchedAt: input.status === 'failed' ? null : input.deliveredAt,
          failedAt: input.status === 'failed' ? input.deliveredAt : null,
          failureReason: input.failureReason ?? null
        }
      })
      await client.siteAuditEnvelope.create({
        data: {
          eventId: `audit_${input.eventId}`,
          service: 'site-service',
          module: 'site-sync',
          eventType: input.resent ? 'site_webhook.resent' : 'site_webhook.dispatched',
          occurredAt: input.deliveredAt,
          result: input.status === 'failed' ? 'FAILED' : 'SUCCEEDED',
          operatorId: null,
          operatorType: 'SYSTEM',
          tenantId: input.tenantId,
          orgId: null,
          traceId: null,
          resourceType: 'site_sync_batch',
          resourceId: input.syncId,
          siteId: input.siteId,
          details: {
            siteId: input.siteId,
            syncId: input.syncId,
            eventId: input.eventId,
            eventType: input.eventType,
            publishVersion: input.publishVersion,
            targetUrl: input.targetUrl ?? null,
            status: input.status ?? 'dispatched',
            resent: input.resent,
            failureReason: input.failureReason ?? null
          }
        }
      })
    })
  }

  /** listChangedResourcesForRuntime aggregates final changed resources across publish versions for one signed site. */
  async listChangedResourcesForRuntime(input: {
    siteId: string
    fromPublishVersion: number
    toPublishVersion?: number
    resourceTypes?: string[]
  }) {
    const client = this.prisma.getExecutionClient()
    const batches = await client.siteSyncBatch.findMany({
      where: {
        siteId: input.siteId,
        status: 'completed',
        publishVersion: {
          gt: input.fromPublishVersion,
          ...(input.toPublishVersion ? { lte: input.toPublishVersion } : {})
        }
      },
      include: { resources: true },
      orderBy: { publishVersion: 'asc' }
    })
    const latestByResource = new Map<
      string,
      {
        resourceType: string
        resourceId: string
        locale: string
        changeType: string
        latestPublishVersion: number
      }
    >()

    for (const batch of batches) {
      for (const resource of batch.resources) {
        if (input.resourceTypes?.length && !input.resourceTypes.includes(resource.resourceType)) {
          continue
        }
        latestByResource.set(`${resource.resourceType}:${resource.resourceId}:${resource.locale}`, {
          resourceType: resource.resourceType,
          resourceId: resource.resourceId,
          locale: resource.locale,
          changeType: resource.changeType,
          latestPublishVersion: batch.publishVersion
        })
      }
    }

    return Array.from(latestByResource.values())
  }

  /** batchGetPublicViewsForRuntime returns latest public views for resource refs authorized to one signed site. */
  async batchGetPublicViewsForRuntime(input: {
    siteId: string
    targetPublishVersion: number
    resources: Array<{ resourceType?: string; resourceId?: string; locale?: string }>
  }) {
    const client = this.prisma.getExecutionClient()
    const site = await client.site.findUnique({ where: { siteId: input.siteId }, select: { latestPublishVersion: true } })
    const publicViews = []
    const missingResources = []

    for (const resource of input.resources) {
      if (!resource.resourceType || !resource.resourceId || !resource.locale) {
        missingResources.push(resource)
        continue
      }
      const view = await client.sitePublicViewRevision.findFirst({ where: { siteId: input.siteId, resourceType: resource.resourceType, resourceId: resource.resourceId, locale: resource.locale, publishVersion: { lte: input.targetPublishVersion } }, orderBy: { publishVersion: 'desc' } })
      if (!view) {
        missingResources.push(resource)
        continue
      }
      publicViews.push({
        siteId: view.siteId,
        resourceType: view.resourceType,
        resourceId: view.resourceId,
        locale: view.locale,
        slug: view.slug,
        status: view.status,
        publishVersion: view.publishVersion,
        updatedAt: view.updatedAt,
        payload: view.payload as Record<string, unknown>
      })
    }

    return {
      publicViews,
      missingResources,
      serverPublishVersion: input.targetPublishVersion,
      exposurePublication: await this.getLatestSiteExposurePublication({
        siteId: input.siteId,
        publishVersion: input.targetPublishVersion
      })
    }
  }

  /** getSnapshotForRuntime returns one consistent publish-version slice for signed runtime snapshot pulls. */
  async getSnapshotForRuntime(input: {
    siteId: string
    targetPublishVersion: number
    resourceTypes?: string[]
    locales?: string[]
    pageToken?: string
    pageSize?: number
  }) {
    const client = this.prisma.getExecutionClient()
    const pageSize = Math.min(Math.max(input.pageSize ?? 100, 1), 500)
    const offset = input.pageToken ? Number.parseInt(input.pageToken, 10) || 0 : 0
    const where = {
      siteId: input.siteId,
      publishVersion: { lte: input.targetPublishVersion },
      ...(input.resourceTypes?.length ? { resourceType: { in: input.resourceTypes } } : {}),
      ...(input.locales?.length ? { locale: { in: input.locales } } : {})
    }
    const revisions = await client.sitePublicViewRevision.findMany({
      where,
      orderBy: [{ resourceType: 'asc' }, { resourceId: 'asc' }, { locale: 'asc' }, { publishVersion: 'desc' }]
    })
    const latest = new Map<string, typeof revisions[number]>()
    for (const revision of revisions) latest.set(`${revision.resourceType}:${revision.resourceId}:${revision.locale}`, latest.get(`${revision.resourceType}:${revision.resourceId}:${revision.locale}`) ?? revision)
    const allViews = Array.from(latest.values()).sort((a, b) => `${a.resourceType}:${a.resourceId}:${a.locale}`.localeCompare(`${b.resourceType}:${b.resourceId}:${b.locale}`))
    const total = allViews.length
    const views = allViews.slice(offset, offset + pageSize)
    const nextOffset = offset + views.length

    return {
      snapshotPublishVersion: input.targetPublishVersion,
      publicViews: views.map((view) => ({
        siteId: view.siteId,
        resourceType: view.resourceType,
        resourceId: view.resourceId,
        locale: view.locale,
        slug: view.slug,
        status: view.status,
        publishVersion: view.publishVersion,
        updatedAt: view.updatedAt,
        payload: view.payload as Record<string, unknown>
      })),
      nextPageToken: nextOffset < total ? String(nextOffset) : '',
      isComplete: nextOffset >= total,
      exposurePublication: await this.getLatestSiteExposurePublication({
        siteId: input.siteId,
        publishVersion: input.targetPublishVersion
      })
    }
  }

  /** revokeSiteCredential revokes only the credential that matches both the authorized Site and id. */
  async revokeSiteCredential(input: {
    siteId: string
    credentialId: string
    revokedAt: Date
  }): Promise<boolean> {
    const client = this.prisma.getExecutionClient()
    const result = await client.siteCredential.updateMany({
      where: { siteId: input.siteId, credentialId: input.credentialId },
      data: {
        status: 'revoked',
        revokedAt: input.revokedAt
      }
    })
    return result.count === 1
  }
}

/** pendingSyncResource attaches the database revision without exposing it through existing Admin response shapes. */
function pendingSyncResource<T extends object>(resource: T, syncRevision: number) {
  const pending = resource as T & { syncRevision: number }
  Object.defineProperty(pending, 'syncRevision', {
    value: syncRevision,
    enumerable: false,
    writable: false
  })
  return pending
}

/** mapProductPublication converts Prisma product publication rows into generated gRPC DTO shape. */
function mapProductPublication(publication: {
  publicationId: string
  siteId: string
  productId: string
  locale: string
  slug: string
  displayTitle: string
  displayDescription: string
  seoTitle: string
  seoDescription: string
  seoImage: string | null
  imageOverride: string | null
  categoryIds?: unknown
  publishStatus: string
  syncStatus: string
}) {
  return {
    publicationId: publication.publicationId,
    siteId: publication.siteId,
    productId: publication.productId,
    locale: publication.locale,
    slug: publication.slug,
    displayTitle: publication.displayTitle,
    displayDescription: publication.displayDescription,
    seoTitle: publication.seoTitle,
    seoDescription: publication.seoDescription,
    seoImage: publication.seoImage ?? '',
    imageOverride: publication.imageOverride ?? '',
    categoryIds: Array.isArray(publication.categoryIds) ? publication.categoryIds : [],
    publishStatus: publication.publishStatus,
    syncStatus: publication.syncStatus
  }
}

/** mapExposurePublication converts the persisted slug-free governance payload into a runtime-safe read model. */
function mapExposurePublication(publication: {
  siteId: string
  publishVersion: number
  defaultLocale: string
  activeLocales: unknown
  pages: unknown
  publishedAt: Date
}) {
  return {
    siteId: publication.siteId,
    publishVersion: publication.publishVersion,
    defaultLocale: publication.defaultLocale,
    activeLocales: Array.isArray(publication.activeLocales)
      ? (publication.activeLocales as string[])
      : [],
    pages: Array.isArray(publication.pages)
      ? (publication.pages as Array<{
          pageKey: string
          enabled: boolean
          indexable: boolean
          supportedLocales: string[]
        }>)
      : [],
    publishedAt: publication.publishedAt.toISOString()
  }
}

/** mapCategoryPublication converts Prisma category projection rows into generated Admin read models. */
function mapCategoryPublication(category: {
  categoryId: string
  siteId: string
  parentCategoryId: string | null
  sourceCategoryId: string | null
  locale: string
  slug: string
  displayTitle: string
  description: string | null
  image: string | null
  sortOrder: number
  seoTitle: string
  seoDescription: string
  seoImage: string | null
  publishStatus: string
  syncStatus: string
}) {
  return {
    categoryId: category.categoryId,
    siteId: category.siteId,
    parentCategoryId: category.parentCategoryId ?? '',
    sourceCategoryId: category.sourceCategoryId ?? '',
    locale: category.locale,
    slug: category.slug,
    displayTitle: category.displayTitle,
    description: category.description ?? '',
    image: category.image ?? '',
    sortOrder: category.sortOrder,
    seoTitle: category.seoTitle,
    seoDescription: category.seoDescription,
    seoImage: category.seoImage ?? '',
    publishStatus: category.publishStatus,
    syncStatus: category.syncStatus
  }
}

/** requiredRepositoryValue rejects missing repository inputs before Prisma writes invalid records. */
function requiredRepositoryValue(value: string | undefined, field: string): string {
  if (!value?.trim()) {
    throw new Error(`${field} is required`)
  }
  return value.trim()
}

/** mapContentEntry converts Prisma content records into generated Admin read models. */
function mapContentEntry(content: {
  contentId: string
  siteId: string
  contentType: string
  status: string
  versions: Array<{
    contentVersionId: string
    contentId: string
    locale: string
    slug: string
    title: string
    summary: string | null
    coverImage: string | null
    coverImageAlt: string | null
    author: string | null
    tags: Prisma.JsonValue
    categoryIds: Prisma.JsonValue
    historicalSlugs: Prisma.JsonValue
    bodyHtml: string
    seoTitle: string
    seoDescription: string
    seoImage: string | null
    publishedAt: Date | null
    status: string
    syncStatus: string
  }>
}) {
  return {
    contentId: content.contentId,
    siteId: content.siteId,
    contentType: content.contentType,
    status: content.status,
    versions: content.versions.map((version) => ({
      contentVersionId: version.contentVersionId,
      contentId: version.contentId,
      locale: version.locale,
      slug: version.slug,
      title: version.title,
      summary: version.summary ?? '',
      coverImage: version.coverImage ?? '',
      coverImageAlt: version.coverImageAlt ?? '',
      author: version.author ?? '',
      tags: Array.isArray(version.tags) ? (version.tags as string[]) : [],
      categoryIds: Array.isArray(version.categoryIds) ? (version.categoryIds as string[]) : [],
      historicalSlugs: Array.isArray(version.historicalSlugs)
        ? (version.historicalSlugs as string[])
        : [],
      bodyHtml: version.bodyHtml,
      seoTitle: version.seoTitle,
      seoDescription: version.seoDescription,
      seoImage: version.seoImage ?? '',
      publishedAt: version.publishedAt?.toISOString() ?? '',
      status: version.status,
      syncStatus: version.syncStatus
    }))
  }
}

/** mapContentCategory converts Prisma Category records into Admin-facing Category read models. */
function mapContentCategory(category: {
  categoryId: string
  siteId: string
  sortOrder: number
  syncStatus: string
  deletedAt?: Date | null
  versions: Array<{
    categoryVersionId: string
    categoryId: string
    locale: string
    slug: string
    displayName: string
    archiveIntro: string | null
    archiveLabel: string | null
    seoTitle: string
    seoDescription: string
    seoImage: string | null
    historicalSlugs: Prisma.JsonValue
    syncStatus: string
    syncRevision?: number
  }>
  publishedVersions?: Array<{ locale: string; publishedRevision: number; publishedAt: Date }>
}) {
  const publishedByLocale = new Map((category.publishedVersions ?? []).map((version) => [version.locale, version]))
  return {
    categoryId: category.categoryId,
    siteId: category.siteId,
    sortOrder: category.sortOrder,
    syncStatus: category.syncStatus,
    deleted: Boolean(category.deletedAt),
    localeVersions: category.versions.map((version) => mapContentCategoryLocaleVersion(version, publishedByLocale.get(version.locale)))
  }
}

/** mapContentCategoryLocaleVersion converts one Category locale row into generated DTO casing. */
function mapContentCategoryLocaleVersion(version: {
  categoryVersionId: string
  categoryId: string
  locale: string
  slug: string
  displayName: string
  archiveIntro: string | null
  archiveLabel: string | null
  seoTitle: string
  seoDescription: string
  seoImage: string | null
  historicalSlugs: Prisma.JsonValue
  syncStatus: string
  syncRevision?: number
}, published?: { publishedRevision: number; publishedAt: Date }) {
  return {
    categoryVersionId: version.categoryVersionId,
    categoryId: version.categoryId,
    locale: version.locale,
    slug: version.slug,
    displayName: version.displayName,
    archiveIntro: version.archiveIntro ?? '',
    archiveLabel: version.archiveLabel ?? '',
    seoTitle: version.seoTitle ?? '',
    seoDescription: version.seoDescription ?? '',
    seoImage: version.seoImage ?? '',
    historicalSlugs: Array.isArray(version.historicalSlugs)
      ? (version.historicalSlugs as string[])
      : [],
    syncStatus: version.syncStatus,
    draftRevision: version.syncRevision ?? 1,
    lastPublishedRevision: published?.publishedRevision ?? 0,
    lastPublishedAt: published?.publishedAt.toISOString() ?? ''
  }
}

/** mapSyncBatch converts Prisma sync batches into generated Admin sync history records. */
function mapSyncBatch(batch: {
  syncId: string
  siteId: string
  publishVersion: number
  status: string
  triggeredBy: string
  startedAt: Date
  completedAt: Date | null
  resources: Array<{
    resourceType: string
    resourceId: string
    locale: string
    changeType: string
  }>
}) {
  return {
    syncId: batch.syncId,
    siteId: batch.siteId,
    publishVersion: batch.publishVersion,
    status: batch.status,
    triggeredBy: batch.triggeredBy,
    startedAt: batch.startedAt.toISOString(),
    completedAt: batch.completedAt?.toISOString() ?? '',
    resources: batch.resources.map((resource) => ({
      resourceType: resource.resourceType,
      resourceId: resource.resourceId,
      locale: resource.locale,
      changeType: resource.changeType,
      latestPublishVersion: batch.publishVersion
    }))
  }
}

/** capabilityRegistrationResult restores the original persisted response for transport-level idempotent replay. */
function capabilityRegistrationResult(
  payload: Prisma.JsonValue,
  accepted: boolean,
  manifestHash: string,
  registrationGeneration: { toString(): string }
): CapabilityRegistrationResult {
  const record =
    payload && typeof payload === 'object' && !Array.isArray(payload)
      ? (payload as Record<string, Prisma.JsonValue>)
      : {}
  return {
    accepted,
    idempotentReplay: false,
    manifestHash,
    discoveredCount: typeof record.discoveredCount === 'number' ? record.discoveredCount : 0,
    unavailablePageKeys: jsonStringArray(record.unavailablePageKeys),
    driftPageKeys: jsonStringArray(record.driftPageKeys),
    recoveredPageKeys: jsonStringArray(record.recoveredPageKeys),
    registrationGeneration: registrationGeneration.toString()
  }
}

/** jsonStringArray reads persisted response arrays without trusting malformed JSON values. */
function jsonStringArray(value: Prisma.JsonValue | undefined): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

/** capabilityIdempotencyConflict creates the typed conflict preserved across application and gRPC boundaries. */
function capabilityIdempotencyConflict(): SiteCapabilityRegistrationError {
  return new SiteCapabilityRegistrationError(
    'SITE_CAPABILITY_IDEMPOTENCY_CONFLICT',
    'The idempotency key is already bound to a different capability registration claim'
  )
}

/** slugFromText creates deterministic mock Product Master candidate ids without exposing upstream internals. */
function slugFromText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** unprotectSecret decodes the P1 protected credential secret used for HMAC verification. */
function unprotectSecret(secretCiphertext: string): string {
  const decoded = JSON.parse(Buffer.from(secretCiphertext, 'base64url').toString('utf8')) as {
    secret?: string
  }
  if (!decoded.secret) {
    throw new Error('credential secret material is unavailable')
  }
  return decoded.secret
}

/** isUniqueConstraintError detects Prisma duplicate nonce writes. */
function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

/** runtimeHealthFromSyncStatus maps runtime sync reports into management health badges. */
function runtimeHealthFromSyncStatus(status: string): string {
  if (status === 'completed') {
    return 'healthy'
  }
  if (status === 'blocked') {
    return 'blocked'
  }
  if (status === 'degraded') {
    return 'degraded'
  }
  return 'failed'
}
