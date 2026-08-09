import { randomUUID } from 'node:crypto'
import { SiteMediaAsset as PrismaSiteMediaAsset } from '../../../../prisma/generated/prisma'
import { PrismaService } from '../../prisma/prisma.service'
import { SiteMediaBindingStatus, SiteMediaDeliveryBinding } from '../../../domain/entities/site-media-delivery-binding.entity'
import { SiteMediaLifecycleOperation, SiteMediaOperationKind, SiteMediaOperationStatus } from '../../../domain/entities/site-media-lifecycle-operation.entity'
import {
  SiteMediaDeliveryStatus,
  SiteMediaListResult,
  SiteMediaRecord,
  SiteMediaRepository
} from '../../../domain/repositories/site-media.repository'

/** PrismaSiteMediaRepository persists typed Site Media assets, references, bindings, and operations. */
export class PrismaSiteMediaRepository implements SiteMediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSiteMediaByUploadIdentity(input: { tenantId: string; siteId: string; idempotencyKey: string }): Promise<SiteMediaRecord | null> {
    const row = await this.prisma.siteMediaAsset.findUnique({ where: { tenantId_siteId_idempotencyKey: input } })
    return row ? this.toRecord(row) : null
  }

  async createSiteMediaAsset(input: {
    tenantId: string
    siteId: string
    ownerSubject: string
    mediaKind: string
    storageKey: string
    checksum: string
    size: number
    contentType: string
    idempotencyKey: string
    requestHash: string
  }): Promise<SiteMediaRecord> {
    const row = await this.prisma.siteMediaAsset.create({
      data: { assetId: randomUUID(), ...input }
    })
    return this.toRecord(row)
  }

  async listAuthorizedMedia(input: { tenantId: string; siteId: string; ownerSubject: string; query?: string; mediaKindFilter?: string; includeArchived?: boolean; pageSize?: number; pageToken?: string }): Promise<SiteMediaListResult> {
    const rows = await this.prisma.siteMediaAsset.findMany({
      where: {
        tenantId: input.tenantId,
        siteId: input.siteId,
        ownerSubject: input.ownerSubject,
        ...(input.includeArchived ? {} : { lifecycleStatus: { not: 'ARCHIVED' } }),
        ...(input.mediaKindFilter ? { mediaKind: input.mediaKindFilter } : {}),
        ...(input.query ? { OR: [{ assetId: { contains: input.query } }, { mediaKind: { contains: input.query } }] } : {})
      },
      orderBy: { createdAt: 'asc' },
      take: Math.min(Math.max(input.pageSize ?? 50, 1), 100),
      ...(input.pageToken ? { skip: 1, cursor: { assetId: input.pageToken } } : {})
    })
    return { assets: rows.map((row) => this.toRecord(row)), nextPageToken: rows.length === (input.pageSize ?? 50) ? rows.at(-1)?.assetId ?? '' : '' }
  }

  async resolveSiteMedia(input: { tenantId: string; siteId: string; assetId: string }): Promise<SiteMediaRecord | null> {
    const row = await this.prisma.siteMediaAsset.findFirst({ where: { tenantId: input.tenantId, siteId: input.siteId, assetId: input.assetId } })
    return row ? this.toRecord(row) : null
  }

  async protectPublicationReferences(input: { tenantId: string; siteId: string; publishVersion: string; assetIds: readonly string[]; operationId: string }): Promise<readonly string[]> {
    if (!input.assetIds.length) return []
    return this.prisma.$transaction(async (tx) => {
      const assets = await tx.siteMediaAsset.findMany({ where: { tenantId: input.tenantId, siteId: input.siteId, assetId: { in: [...input.assetIds] }, lifecycleStatus: { not: 'DELETED' } }, select: { assetId: true } })
      if (assets.length !== input.assetIds.length) throw new Error('ASSET_SCOPE_FORBIDDEN')
      const existing = await tx.siteMediaPublicationReference.findMany({ where: { tenantId: input.tenantId, siteId: input.siteId, publishVersion: input.publishVersion, assetId: { in: [...input.assetIds] } }, select: { assetId: true } })
      const existingIds = new Set(existing.map((row) => row.assetId))
      const fresh = input.assetIds.filter((assetId) => !existingIds.has(assetId))
      if (fresh.length) {
        await tx.siteMediaPublicationReference.createMany({ data: fresh.map((assetId) => ({ tenantId: input.tenantId, siteId: input.siteId, publishVersion: input.publishVersion, assetId })), skipDuplicates: true })
        await Promise.all(fresh.map((assetId) => tx.siteMediaAsset.update({ where: { assetId }, data: { protectedReferenceCount: { increment: 1 } } })))
      }
      return [...input.assetIds]
    })
  }

  async releasePublicationReferences(input: { tenantId: string; siteId: string; publishVersion: string; operationId: string }): Promise<readonly string[]> {
    return this.prisma.$transaction(async (tx) => {
      const refs = await tx.siteMediaPublicationReference.findMany({ where: { tenantId: input.tenantId, siteId: input.siteId, publishVersion: input.publishVersion }, select: { assetId: true } })
      if (!refs.length) return []
      await tx.siteMediaPublicationReference.deleteMany({ where: { tenantId: input.tenantId, siteId: input.siteId, publishVersion: input.publishVersion } })
      await Promise.all(refs.map((ref) => tx.siteMediaAsset.updateMany({ where: { assetId: ref.assetId, protectedReferenceCount: { gt: 0 } }, data: { protectedReferenceCount: { decrement: 1 } } })))
      return refs.map((ref) => ref.assetId)
    })
  }

  async archiveSiteMedia(input: { tenantId: string; assetId: string; ownerSubject: string; operationId: string }): Promise<SiteMediaRecord> {
    const current = await this.prisma.siteMediaAsset.findFirst({ where: { tenantId: input.tenantId, assetId: input.assetId, ownerSubject: input.ownerSubject } })
    if (!current) throw new Error('ASSET_SCOPE_FORBIDDEN')
    if (current.protectedReferenceCount > 0) throw new Error('ASSET_MEDIA_PROTECTED')
    const row = await this.prisma.siteMediaAsset.update({ where: { assetId: input.assetId }, data: { lifecycleStatus: 'ARCHIVED', availabilityVersion: { increment: BigInt(1) } } })
    return this.toRecord(row)
  }

  async getImmutableDeliveryUrl(input: { tenantId: string; assetId: string }): Promise<string | null> {
    const row = await this.prisma.siteMediaAsset.findFirst({ where: { tenantId: input.tenantId, assetId: input.assetId }, select: { immutablePublicUrl: true } })
    return row?.immutablePublicUrl ?? null
  }

  async getSiteMediaDeliveryStatus(input: { tenantId: string; assetId: string }): Promise<SiteMediaDeliveryStatus | null> {
    const row = await this.prisma.siteMediaAsset.findFirst({ where: { tenantId: input.tenantId, assetId: input.assetId }, select: { assetId: true, lifecycleStatus: true, deliveryStatus: true, availabilityVersion: true } })
    if (!row) return null
    const operation = await this.prisma.siteMediaLifecycleOperation.findFirst({ where: { tenantId: input.tenantId, assetId: input.assetId }, orderBy: { createdAt: 'desc' }, select: { operationId: true } })
    return { assetId: row.assetId, lifecycleStatus: row.lifecycleStatus, deliveryStatus: row.deliveryStatus, availabilityVersion: row.availabilityVersion.toString(), lastOperationId: operation?.operationId ?? '' }
  }

  async deleteSiteMedia(input: { tenantId: string; assetId: string; ownerSubject: string; operationId: string }): Promise<{ operationId: string; deletionStatus: string }> {
    const current = await this.prisma.siteMediaAsset.findFirst({ where: { tenantId: input.tenantId, assetId: input.assetId, ownerSubject: input.ownerSubject } })
    if (!current) throw new Error('ASSET_SCOPE_FORBIDDEN')
    if (current.protectedReferenceCount > 0) throw new Error('ASSET_MEDIA_PROTECTED')
    await this.prisma.siteMediaAsset.update({ where: { assetId: input.assetId }, data: { lifecycleStatus: 'DELETED', deliveryStatus: 'UNAVAILABLE', availabilityVersion: { increment: BigInt(1) } } })
    return { operationId: input.operationId, deletionStatus: 'DELETED' }
  }

  async findBinding(input: { tenantId: string; siteId: string }) {
    const row = await this.prisma.siteMediaDeliveryBinding.findUnique({ where: { tenantId_siteId: input } })
    return row ? new SiteMediaDeliveryBinding(row.tenantId, row.siteId, row.status as SiteMediaBindingStatus) : null
  }

  async saveBinding(binding: SiteMediaDeliveryBinding): Promise<void> {
    await this.prisma.siteMediaDeliveryBinding.upsert({ where: { tenantId_siteId: { tenantId: binding.tenantId, siteId: binding.siteId } }, create: { tenantId: binding.tenantId, siteId: binding.siteId, status: binding.deliveryStatus }, update: { status: binding.deliveryStatus } })
  }

  async findOperation(input: { tenantId: string; assetId: string; idempotencyKey: string }) {
    const row = await this.prisma.siteMediaLifecycleOperation.findUnique({ where: { tenantId_assetId_idempotencyKey: input } })
    return row ? new SiteMediaLifecycleOperation(row.operationId, row.tenantId, row.assetId, row.idempotencyKey, row.requestHash, row.kind as SiteMediaOperationKind, row.status as SiteMediaOperationStatus, row.immutableTargetUrl, row.attempts, row.nextAttemptAt, row.providerRequestId, row.lastSafeError, row.confirmedAt) : null
  }

  async saveOperation(operation: SiteMediaLifecycleOperation): Promise<void> {
    await this.prisma.siteMediaLifecycleOperation.create({ data: { operationId: operation.operationId, tenantId: operation.tenantId, assetId: operation.assetId, idempotencyKey: operation.idempotencyKey, requestHash: operation.requestHash, status: operation.status, kind: operation.kind, immutableTargetUrl: operation.immutableTargetUrl, attempts: operation.attempts, nextAttemptAt: operation.nextAttemptAt, providerRequestId: operation.providerRequestId, lastSafeError: operation.lastSafeError, confirmedAt: operation.confirmedAt } })
  }

  async claimDuePurgeOperations(now: Date, limit: number) { const rows = await this.prisma.siteMediaLifecycleOperation.findMany({ where: { kind: 'TAKEDOWN_PURGE', status: { in: ['PENDING', 'RETRY'] }, nextAttemptAt: { lte: now } }, orderBy: { createdAt: 'asc' }, take: limit }); return rows.map((row) => new SiteMediaLifecycleOperation(row.operationId, row.tenantId, row.assetId, row.idempotencyKey, row.requestHash, row.kind as SiteMediaOperationKind, row.status as SiteMediaOperationStatus, row.immutableTargetUrl, row.attempts, row.nextAttemptAt, row.providerRequestId, row.lastSafeError, row.confirmedAt)) }
  async acknowledgePurge(operationId: string, providerRequestId: string, confirmedAt: Date) { await this.prisma.siteMediaLifecycleOperation.update({ where: { operationId }, data: { status: 'CONFIRMED', providerRequestId, confirmedAt } }) }
  async schedulePurgeRetry(operationId: string, attempts: number, nextAttemptAt: Date, safeError: string) { await this.prisma.siteMediaLifecycleOperation.update({ where: { operationId }, data: { status: 'RETRY', attempts, nextAttemptAt, lastSafeError: safeError } }) }

  /** toRecord converts Prisma scalar types into the application-owned Site Media projection. */
  private toRecord(row: PrismaSiteMediaAsset): SiteMediaRecord {
    return {
      assetId: row.assetId,
      tenantId: row.tenantId,
      siteId: row.siteId,
      ownerSubject: row.ownerSubject,
      mediaKind: row.mediaKind,
      lifecycleStatus: row.lifecycleStatus,
      deliveryStatus: row.deliveryStatus,
      storageKey: row.storageKey,
      immutablePublicUrl: row.immutablePublicUrl,
      checksum: row.checksum,
      requestHash: row.requestHash,
      size: row.size,
      contentType: row.contentType,
      availabilityVersion: row.availabilityVersion.toString(),
      protectedReferenceCount: row.protectedReferenceCount,
      createdAt: row.createdAt
    }
  }
}
