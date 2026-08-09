import { randomUUID } from 'node:crypto'
import { Prisma, SiteMediaAsset as PrismaSiteMediaAsset } from '../../../../prisma/generated/prisma'
import { PrismaService } from '../../prisma/prisma.service'
import { createAssetSiteMediaAvailabilityEvent } from '@oes/common/contracts'
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
    width: number
    height: number
    durationMs: string
    codec: string
    idempotencyKey: string
    requestHash: string
  }): Promise<SiteMediaRecord> {
    try {
      const row = await this.prisma.siteMediaAsset.create({ data: { assetId: randomUUID(), ...input, durationMs: BigInt(input.durationMs) } })
      return this.toRecord(row)
    } catch (error) {
      if (!isPrismaUniqueViolation(error)) throw error
      const existing = await this.findSiteMediaByUploadIdentity({ tenantId: input.tenantId, siteId: input.siteId, idempotencyKey: input.idempotencyKey })
      if (!existing) throw error
      if (existing.requestHash !== input.requestHash) throw new Error('ASSET_IDEMPOTENCY_CONFLICT')
      return existing
    }
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

  /** confirmRemoteActivationWithEvent atomically activates a site delivery binding and appends one immutable event per affected asset. */
  async confirmRemoteActivationWithEvent(input: { tenantId: string; siteId: string; operationId: string }): Promise<{ deliveryBindingStatus: string; migrationOperationId: string }> {
    return this.withLifecycleTransaction(async (tx) => {
      const operation = await tx.siteMediaLifecycleOperation.findUnique({ where: { operationId: input.operationId } })
      if (!operation || operation.tenantId !== input.tenantId || operation.assetId !== input.siteId) throw new Error('ASSET_OPERATION_NOT_FOUND')
      const binding = await tx.siteMediaDeliveryBinding.findUnique({ where: { tenantId_siteId: { tenantId: input.tenantId, siteId: input.siteId } } })
      if (!binding) throw new Error('ASSET_REMOTE_DELIVERY_NOT_READY')
      if (binding.status === 'REMOTE_ACTIVE' && operation.status === 'CONFIRMED') return { deliveryBindingStatus: binding.status, migrationOperationId: operation.operationId }
      if (binding.status !== 'MIGRATING' && binding.status !== 'REMOTE_ACTIVE') throw new Error('ASSET_REMOTE_DELIVERY_NOT_READY')
      const now = new Date()
      await tx.siteMediaDeliveryBinding.update({ where: { tenantId_siteId: { tenantId: input.tenantId, siteId: input.siteId } }, data: { status: 'REMOTE_ACTIVE' } })
      const assets = await tx.siteMediaAsset.findMany({ where: { tenantId: input.tenantId, siteId: input.siteId, lifecycleStatus: { not: 'DELETED' } } })
      for (const asset of assets) {
        const updated = await tx.siteMediaAsset.update({ where: { assetId: asset.assetId }, data: { deliveryStatus: 'REMOTE_ACTIVE', availabilityVersion: { increment: BigInt(1) } } })
        await this.appendAvailabilityEvent(tx, updated, operation.operationId, 'REMOTE_ACTIVATED', now)
      }
      await tx.siteMediaLifecycleOperation.update({ where: { operationId: operation.operationId }, data: { status: 'CONFIRMED', confirmedAt: now } })
      return { deliveryBindingStatus: 'REMOTE_ACTIVE', migrationOperationId: operation.operationId }
    })
  }

  /** archiveWithEvent persists the archive transition, version increment, and immutable outbox envelope as one transaction. */
  async archiveWithEvent(input: { tenantId: string; assetId: string; ownerSubject: string; operationId: string }): Promise<SiteMediaRecord> {
    return this.withLifecycleTransaction(async (tx) => {
      const { asset, operation } = await this.loadLifecycleAsset(tx, input)
      if (asset.lifecycleStatus === 'ARCHIVED') return this.toRecord(asset)
      if (asset.protectedReferenceCount > 0) throw new Error('ASSET_MEDIA_PROTECTED')
      const now = new Date()
      const updated = await tx.siteMediaAsset.update({ where: { assetId: asset.assetId }, data: { lifecycleStatus: 'ARCHIVED', availabilityVersion: { increment: BigInt(1) } } })
      await tx.siteMediaLifecycleOperation.update({ where: { operationId: operation.operationId }, data: { status: 'CONFIRMED', confirmedAt: now } })
      await this.appendAvailabilityEvent(tx, updated, operation.operationId, 'ARCHIVED', now)
      return this.toRecord(updated)
    })
  }

  async getImmutableDeliveryUrl(input: { tenantId: string; assetId: string }): Promise<string | null> {
    const row = await this.prisma.siteMediaAsset.findFirst({ where: { tenantId: input.tenantId, assetId: input.assetId }, select: { immutablePublicUrl: true } })
    return row?.immutablePublicUrl ?? null
  }

  async getSiteMediaDeliveryStatus(input: { tenantId: string; assetId: string }): Promise<SiteMediaDeliveryStatus | null> {
    const row = await this.prisma.siteMediaAsset.findFirst({ where: { tenantId: input.tenantId, assetId: input.assetId }, select: { assetId: true, siteId: true, lifecycleStatus: true, deliveryStatus: true, availabilityVersion: true } })
    if (!row) return null
    const operation = await this.prisma.siteMediaLifecycleOperation.findFirst({ where: { tenantId: input.tenantId, assetId: input.assetId }, orderBy: { createdAt: 'desc' }, select: { operationId: true } })
    return { assetId: row.assetId, siteId: row.siteId, lifecycleStatus: row.lifecycleStatus, deliveryStatus: row.deliveryStatus, availabilityVersion: row.availabilityVersion.toString(), lastOperationId: operation?.operationId ?? '' }
  }

  /** deleteWithEvent atomically records the terminal deletion fact after protection checks have succeeded. */
  async deleteWithEvent(input: { tenantId: string; assetId: string; ownerSubject: string; operationId: string }): Promise<{ operationId: string; deletionStatus: string }> {
    return this.withLifecycleTransaction(async (tx) => {
      const { asset, operation } = await this.loadLifecycleAsset(tx, input)
      if (asset.lifecycleStatus === 'DELETED') return { operationId: operation.operationId, deletionStatus: 'DELETED' }
      if (asset.protectedReferenceCount > 0) throw new Error('ASSET_MEDIA_PROTECTED')
      const now = new Date()
      const updated = await tx.siteMediaAsset.update({ where: { assetId: asset.assetId }, data: { lifecycleStatus: 'DELETED', deliveryStatus: 'UNAVAILABLE', availabilityVersion: { increment: BigInt(1) } } })
      await tx.siteMediaLifecycleOperation.update({ where: { operationId: operation.operationId }, data: { status: 'CONFIRMED', confirmedAt: now } })
      await this.appendAvailabilityEvent(tx, updated, operation.operationId, 'DELETED', now)
      return { operationId: operation.operationId, deletionStatus: 'DELETED' }
    })
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
    try {
      await this.prisma.siteMediaLifecycleOperation.create({ data: { operationId: operation.operationId, tenantId: operation.tenantId, assetId: operation.assetId, idempotencyKey: operation.idempotencyKey, requestHash: operation.requestHash, status: operation.status, kind: operation.kind, immutableTargetUrl: operation.immutableTargetUrl, attempts: operation.attempts, nextAttemptAt: operation.nextAttemptAt, providerRequestId: operation.providerRequestId, lastSafeError: operation.lastSafeError, confirmedAt: operation.confirmedAt } })
    } catch (error) {
      if (!isPrismaUniqueViolation(error)) throw error
      const existing = await this.findOperation({ tenantId: operation.tenantId, assetId: operation.assetId, idempotencyKey: operation.idempotencyKey })
      if (!existing || existing.requestHash !== operation.requestHash) throw new Error('ASSET_IDEMPOTENCY_CONFLICT')
    }
  }

  async claimDuePurgeOperations(now: Date, limit: number) { const rows = await this.prisma.siteMediaLifecycleOperation.findMany({ where: { kind: 'TAKEDOWN_PURGE', status: { in: ['PENDING', 'RETRY'] }, nextAttemptAt: { lte: now } }, orderBy: { createdAt: 'asc' }, take: limit }); return rows.map((row) => new SiteMediaLifecycleOperation(row.operationId, row.tenantId, row.assetId, row.idempotencyKey, row.requestHash, row.kind as SiteMediaOperationKind, row.status as SiteMediaOperationStatus, row.immutableTargetUrl, row.attempts, row.nextAttemptAt, row.providerRequestId, row.lastSafeError, row.confirmedAt)) }
  /** confirmTakedownWithEvent records UNAVAILABLE only after the precise purge provider acknowledged the immutable target. */
  async confirmTakedownWithEvent(operationId: string, providerRequestId: string, confirmedAt: Date): Promise<void> {
    await this.withLifecycleTransaction(async (tx) => {
      const operation = await tx.siteMediaLifecycleOperation.findUnique({ where: { operationId } })
      if (!operation) throw new Error('ASSET_OPERATION_NOT_FOUND')
      if (operation.status === 'CONFIRMED') return
      if (operation.kind !== 'TAKEDOWN_PURGE') throw new Error('ASSET_OPERATION_KIND_INVALID')
      const asset = await tx.siteMediaAsset.findFirst({ where: { tenantId: operation.tenantId, assetId: operation.assetId } })
      if (!asset) throw new Error('ASSET_SCOPE_FORBIDDEN')
      const updated = await tx.siteMediaAsset.update({ where: { assetId: asset.assetId }, data: { deliveryStatus: 'UNAVAILABLE', availabilityVersion: { increment: BigInt(1) } } })
      await tx.siteMediaLifecycleOperation.update({ where: { operationId }, data: { status: 'CONFIRMED', providerRequestId, confirmedAt } })
      await this.appendAvailabilityEvent(tx, updated, operation.operationId, 'TAKEDOWN_CONFIRMED', confirmedAt)
    })
  }
  async schedulePurgeRetry(operationId: string, attempts: number, nextAttemptAt: Date, safeError: string) { await this.prisma.siteMediaLifecycleOperation.update({ where: { operationId }, data: { status: 'RETRY', attempts, nextAttemptAt, lastSafeError: safeError } }) }

  /** withLifecycleTransaction keeps lifecycle state, monotonically-versioned availability, and outbox persistence inseparable. */
  private async withLifecycleTransaction<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction((tx) => callback(tx))
  }

  /** loadLifecycleAsset validates the stored operation and ownership before a terminal lifecycle transition. */
  private async loadLifecycleAsset(tx: Prisma.TransactionClient, input: { tenantId: string; assetId: string; ownerSubject: string; operationId: string }): Promise<{ asset: PrismaSiteMediaAsset; operation: { operationId: string; tenantId: string; assetId: string } }> {
    const [asset, operation] = await Promise.all([
      tx.siteMediaAsset.findFirst({ where: { tenantId: input.tenantId, assetId: input.assetId, ownerSubject: input.ownerSubject } }),
      tx.siteMediaLifecycleOperation.findUnique({ where: { operationId: input.operationId }, select: { operationId: true, tenantId: true, assetId: true } })
    ])
    if (!asset || !operation || operation.tenantId !== input.tenantId || operation.assetId !== input.assetId) throw new Error('ASSET_SCOPE_FORBIDDEN')
    return { asset, operation }
  }

  /** appendAvailabilityEvent persists the canonical pre-built envelope; the relay only transports this exact payload. */
  private async appendAvailabilityEvent(tx: Prisma.TransactionClient, asset: PrismaSiteMediaAsset, operationId: string, reason: string, occurredAt: Date): Promise<void> {
    const availabilityVersion = Number(asset.availabilityVersion)
    if (!Number.isSafeInteger(availabilityVersion)) throw new Error('ASSET_AVAILABILITY_VERSION_UNSAFE')
    const event = createAssetSiteMediaAvailabilityEvent({
      id: randomUUID(),
      time: occurredAt.toISOString(),
      oestenantid: asset.tenantId,
      traceId: operationId,
      data: { assetId: asset.assetId, mediaKind: asset.mediaKind, lifecycleStatus: asset.lifecycleStatus, deliveryStatus: asset.deliveryStatus, availabilityVersion, changeReasonCode: reason, operationId }
    })
    await tx.assetEventOutbox.create({ data: { eventId: event.id, eventType: event.type, payload: immutableJson(event), status: 'PENDING' } })
  }

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
      width: row.width,
      height: row.height,
      durationMs: row.durationMs.toString(),
      codec: row.codec,
      availabilityVersion: row.availabilityVersion.toString(),
      protectedReferenceCount: row.protectedReferenceCount,
      createdAt: row.createdAt
    }
  }
}

/** isPrismaUniqueViolation identifies only the recoverable idempotency race from Prisma. */
function isPrismaUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === 'P2002'
}

/** immutableJson converts a frozen CloudEvent into Prisma's JSON value without weakening its runtime contents. */
function immutableJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}
