import { Injectable } from '@nestjs/common'
import { Prisma } from '../../../prisma/generated/prisma'
import { PrismaService } from '../prisma/prisma.service'

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
  author: string | null
  tags: string[]
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

/** PrismaSiteRepository persists site-service P1 aggregates and read models behind repository methods. */
@Injectable()
export class PrismaSiteRepository {
  constructor(private readonly prisma: PrismaService) {}

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
        }
      }
    })
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
            author: input.author,
            tags: input.tags,
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
      const pendingContentCount = site.contentEntries.reduce((count, entry) => count + entry.versions.length, 0)
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
        activeLocales: site.locales.filter((locale) => locale.status === 'active').map((locale) => locale.locale),
        preparingLocales: site.locales.filter((locale) => locale.status === 'preparing').map((locale) => locale.locale),
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
  async disableSite(input: { siteId: string; disabledAt: Date; reason: string | null }): Promise<void> {
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

  /** checkLocaleCompleteness verifies active/pending resources have locale coverage before activation. */
  async checkLocaleCompleteness(input: { siteId: string; locale: string }): Promise<{ complete: boolean; issues: string[] }> {
    const client = this.prisma.getExecutionClient()
    const locale = await client.siteLocale.findUnique({
      where: { siteId_locale: { siteId: input.siteId, locale: input.locale } }
    })
    const issues: string[] = []
    if (!locale) {
      issues.push(`locale ${input.locale} is not configured`)
    }
    const [products, contentVersions] = await Promise.all([
      client.siteProductPublication.count({ where: { siteId: input.siteId, locale: input.locale, publishStatus: 'published' } }),
      client.siteContentLocaleVersion.count({
        where: { locale: input.locale, contentEntry: { siteId: input.siteId }, status: { not: 'unpublished' } }
      })
    ])
    if (products + contentVersions === 0) {
      issues.push(`locale ${input.locale} has no publishable resources`)
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
  }

  /** markLocaleResourcesPending marks all resources in a disabled locale for explicit status sync. */
  async markLocaleResourcesPending(input: { siteId: string; locale: string }): Promise<void> {
    const client = this.prisma.getExecutionClient()
    await Promise.all([
      client.siteProductPublication.updateMany({
        where: { siteId: input.siteId, locale: input.locale },
        data: { syncStatus: 'pending' }
      }),
      client.siteCategoryPublication.updateMany({
        where: { siteId: input.siteId, locale: input.locale },
        data: { syncStatus: 'pending' }
      }),
      client.siteContentLocaleVersion.updateMany({
        where: {
          locale: input.locale,
          contentEntry: { siteId: input.siteId }
        },
        data: { syncStatus: 'pending' }
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
      where: { siteId_categoryId_locale: { siteId: input.siteId, categoryId: input.categoryId, locale: input.locale } },
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
        syncStatus: input.syncStatus
      }
    })
    return mapCategoryPublication(category)
  }

  /** unpublishSiteCategory marks one category projection unpublished and pending sync. */
  async unpublishSiteCategory(input: { siteId: string; categoryId: string; locale: string }): Promise<void> {
    const client = this.prisma.getExecutionClient()
    await client.siteCategoryPublication.update({
      where: { siteId_categoryId_locale: { siteId: input.siteId, categoryId: input.categoryId, locale: input.locale } },
      data: { publishStatus: 'unpublished', syncStatus: 'pending' }
    })
  }

  /** searchProductMasterForAdd exposes a P1 anti-corruption placeholder until Product Master public-safe contract lands. */
  async searchProductMasterForAdd(input: { siteId: string; keyword?: string; page: number; pageSize: number }) {
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
        syncStatus: input.syncStatus
      }
    })
    return mapProductPublication(publication)
  }

  /** unpublishSiteProduct marks one product publication unpublished and pending sync. */
  async unpublishSiteProduct(input: { siteId: string; publicationId: string }): Promise<void> {
    const client = this.prisma.getExecutionClient()
    await client.siteProductPublication.update({
      where: { publicationId: input.publicationId },
      data: { publishStatus: 'unpublished', syncStatus: 'pending' }
    })
  }

  /** getLatestPublishState returns the latest site version and sync id for Site Runtime pull fallback. */
  async getLatestPublishState(siteId: string) {
    const client = this.prisma.getExecutionClient()
    const site = await client.site.findUnique({ where: { siteId }, select: { latestPublishVersion: true } })
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
      where: { siteId: input.siteId, ...(input.contentType ? { contentType: input.contentType } : {}) },
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
    author: string | null
    tags: string[]
    seoTitle: string
    seoDescription: string
    seoImage: string | null
    publishedAt: Date | null
    status: string
    syncStatus: string
  }) {
    const client = this.prisma.getExecutionClient()
    const version = await client.siteContentLocaleVersion.upsert({
      where: {
        contentId_locale: {
          contentId: input.contentId,
          locale: input.locale
        }
      },
      create: {
        contentVersionId: input.contentVersionId,
        contentId: input.contentId,
        locale: input.locale,
        slug: input.slug,
        title: input.title,
        summary: input.summary,
        coverImage: input.coverImage,
        author: input.author,
        tags: input.tags,
        bodyHtml: input.bodyHtml,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        seoImage: input.seoImage,
        publishedAt: input.publishedAt,
        status: input.status,
        syncStatus: input.syncStatus
      },
      update: {
        slug: input.slug,
        title: input.title,
        summary: input.summary,
        coverImage: input.coverImage,
        author: input.author,
        tags: input.tags,
        bodyHtml: input.bodyHtml,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        seoImage: input.seoImage,
        publishedAt: input.publishedAt,
        status: input.status,
        syncStatus: input.syncStatus
      }
    })

    return version
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
    const [products, categories, contentVersions, locales] = await Promise.all([
      client.siteProductPublication.findMany({
        where: { siteId, syncStatus: 'pending' },
        select: { productId: true, locale: true, updatedAt: true, publishStatus: true }
      }),
      client.siteCategoryPublication.findMany({
        where: { siteId, syncStatus: 'pending' },
        select: { categoryId: true, locale: true, updatedAt: true, publishStatus: true }
      }),
      client.siteContentLocaleVersion.findMany({
        where: {
          syncStatus: 'pending',
          contentEntry: { siteId }
        },
        include: { contentEntry: { select: { contentType: true } } }
      }),
      client.siteLocale.findMany({
        where: { siteId },
        select: { locale: true, status: true }
      })
    ])
    const localeStatusByCode = new Map(locales.map((locale) => [locale.locale, locale.status]))

    return [
      ...products.map((product) => ({
        resourceType: 'product' as const,
        resourceId: product.productId,
        locale: product.locale,
        changeType: localeStatusByCode.get(product.locale) === 'disabled'
          ? 'locale_disable' as const
          : product.publishStatus === 'unpublished' ? 'unpublish' as const : 'update' as const,
        markedAt: product.updatedAt
      })),
      ...categories.map((category) => ({
        resourceType: 'category' as const,
        resourceId: category.categoryId,
        locale: category.locale,
        changeType: localeStatusByCode.get(category.locale) === 'disabled'
          ? 'locale_disable' as const
          : category.publishStatus === 'unpublished' ? 'unpublish' as const : 'create' as const,
        markedAt: category.updatedAt
      })),
      ...contentVersions.map((version) => ({
        resourceType: version.contentEntry.contentType as 'blog' | 'news',
        resourceId: version.contentId,
        locale: version.locale,
        changeType: localeStatusByCode.get(version.locale) === 'disabled'
          ? 'locale_disable' as const
          : version.status === 'unpublished' ? 'unpublish' as const : 'create' as const,
        markedAt: version.updatedAt
      }))
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
  async getContentVersionForPublicView(input: { contentId: string; locale: string }) {
    const client = this.prisma.getExecutionClient()
    const version = await client.siteContentLocaleVersion.findUnique({
      where: {
        contentId_locale: {
          contentId: input.contentId,
          locale: input.locale
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
      author: version.author,
      tags: version.tags as string[],
      seoTitle: version.seoTitle,
      seoDescription: version.seoDescription,
      seoImage: version.seoImage,
      publishedAt: version.publishedAt
    }
  }

  /** getProductPublicationForPublicView returns display config needed to build a product public view. */
  async getProductPublicationForPublicView(input: { siteId: string; productId: string; locale: string }) {
    const client = this.prisma.getExecutionClient()
    const publication = await client.siteProductPublication.findUnique({
      where: {
        siteId_productId_locale: {
          siteId: input.siteId,
          productId: input.productId,
          locale: input.locale
        }
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
  async getCategoryPublicationForPublicView(input: { siteId: string; categoryId: string; locale: string }) {
    const client = this.prisma.getExecutionClient()
    const category = await client.siteCategoryPublication.findUnique({
      where: {
        siteId_categoryId_locale: {
          siteId: input.siteId,
          categoryId: input.categoryId,
          locale: input.locale
        }
      }
    })
    return category ? {
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
    } : null
  }

  /** markContentVersionSynced clears pending sync state after public-view generation succeeds. */
  async markContentVersionSynced(input: { contentId: string; locale: string }): Promise<void> {
    const client = this.prisma.getExecutionClient()
    await client.siteContentLocaleVersion.update({
      where: {
        contentId_locale: {
          contentId: input.contentId,
          locale: input.locale
        }
      },
      data: { syncStatus: 'synced' }
    })
  }

  /** markProductPublicationSynced clears pending sync state for one product publication. */
  async markProductPublicationSynced(input: { siteId: string; productId: string; locale: string }): Promise<void> {
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
  async markCategoryPublicationSynced(input: { siteId: string; categoryId: string; locale: string }): Promise<void> {
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

  /** unpublishSiteContent marks one content locale version unpublished and pending sync. */
  async unpublishSiteContent(input: { siteId: string; contentId: string; locale: string }): Promise<void> {
    const client = this.prisma.getExecutionClient()
    await client.siteContentLocaleVersion.update({
      where: { contentId_locale: { contentId: input.contentId, locale: input.locale } },
      data: { status: 'unpublished', syncStatus: 'pending' }
    })
  }

  /** listSyncHistory returns completed and attempted sync batches for one site. */
  async listSyncHistory(input: { siteId: string }) {
    const client = this.prisma.getExecutionClient()
    const batches = await client.siteSyncBatch.findMany({
      where: { siteId: input.siteId },
      include: { resources: { orderBy: [{ resourceType: 'asc' }, { resourceId: 'asc' }, { locale: 'asc' }] } },
      orderBy: { startedAt: 'desc' }
    })
    return batches.map(mapSyncBatch)
  }

  /** getSyncDetail returns one sync batch detail by id. */
  async getSyncDetail(input: { syncId: string }) {
    const client = this.prisma.getExecutionClient()
    const batch = await client.siteSyncBatch.findUnique({
      where: { syncId: input.syncId },
      include: { resources: { orderBy: [{ resourceType: 'asc' }, { resourceId: 'asc' }, { locale: 'asc' }] } }
    })
    return batch ? mapSyncBatch(batch) : null
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
  async getWebhookDispatchConfig(input: { siteId: string }): Promise<{ targetUrl: string | null; signingSecret: string | null } | null> {
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
      signingSecret: credential?.secretCiphertext ? unprotectSecret(credential.secretCiphertext) : null
    }
  }

  /** recordWebhookDelivery records one webhook delivery fact without creating or mutating public views. */
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
    const client = this.prisma.getExecutionClient()
    const batch = await client.siteSyncBatch.findUnique({ where: { syncId: input.syncId } })
    if (!batch) {
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
    const latestByResource = new Map<string, {
      resourceType: string
      resourceId: string
      locale: string
      changeType: string
      latestPublishVersion: number
    }>()

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
    resources: Array<{ resourceType?: string; resourceId?: string; locale?: string }>
  }) {
    const client = this.prisma.getExecutionClient()
    const site = await client.site.findUnique({
      where: { siteId: input.siteId },
      select: { latestPublishVersion: true }
    })
    const publicViews = []
    const missingResources = []

    for (const resource of input.resources) {
      if (!resource.resourceType || !resource.resourceId || !resource.locale) {
        missingResources.push(resource)
        continue
      }
      const view = await client.sitePublicView.findFirst({
        where: {
          siteId: input.siteId,
          resourceType: resource.resourceType,
          resourceId: resource.resourceId,
          locale: resource.locale
        }
      })
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
      serverPublishVersion: site?.latestPublishVersion ?? 0
    }
  }

  /** getSnapshotForRuntime returns one consistent publish-version slice for signed runtime snapshot pulls. */
  async getSnapshotForRuntime(input: {
    siteId: string
    resourceTypes?: string[]
    locales?: string[]
    pageToken?: string
    pageSize?: number
  }) {
    const client = this.prisma.getExecutionClient()
    const site = await client.site.findUnique({
      where: { siteId: input.siteId },
      select: { latestPublishVersion: true }
    })
    const pageSize = Math.min(Math.max(input.pageSize ?? 100, 1), 500)
    const offset = input.pageToken ? Number.parseInt(input.pageToken, 10) || 0 : 0
    const where = {
      siteId: input.siteId,
      publishVersion: { lte: site?.latestPublishVersion ?? 0 },
      ...(input.resourceTypes?.length ? { resourceType: { in: input.resourceTypes } } : {}),
      ...(input.locales?.length ? { locale: { in: input.locales } } : {})
    }
    const [total, views] = await Promise.all([
      client.sitePublicView.count({ where }),
      client.sitePublicView.findMany({
        where,
        orderBy: [{ resourceType: 'asc' }, { resourceId: 'asc' }, { locale: 'asc' }],
        skip: offset,
        take: pageSize
      })
    ])
    const nextOffset = offset + views.length

    return {
      snapshotPublishVersion: site?.latestPublishVersion ?? 0,
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
      isComplete: nextOffset >= total
    }
  }

  /** revokeSiteCredential marks one site credential revoked so signed requests fail closed. */
  async revokeSiteCredential(input: { siteId: string; credentialId: string; revokedAt: Date }): Promise<void> {
    const client = this.prisma.getExecutionClient()
    await client.siteCredential.update({
      where: { credentialId: input.credentialId },
      data: {
        status: 'revoked',
        revokedAt: input.revokedAt
      }
    })
  }
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
    author: string | null
    tags: Prisma.JsonValue
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
      author: version.author ?? '',
      tags: Array.isArray(version.tags) ? version.tags as string[] : [],
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

/** slugFromText creates deterministic mock Product Master candidate ids without exposing upstream internals. */
function slugFromText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/** unprotectSecret decodes the P1 protected credential secret used for HMAC verification. */
function unprotectSecret(secretCiphertext: string): string {
  const decoded = JSON.parse(Buffer.from(secretCiphertext, 'base64url').toString('utf8')) as { secret?: string }
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
