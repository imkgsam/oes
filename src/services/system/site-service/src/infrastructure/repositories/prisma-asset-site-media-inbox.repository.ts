import { createHash } from 'node:crypto'
import { Prisma } from '../../../prisma/generated/prisma'
import { PrismaService } from '../prisma/prisma.service'

/** PrismaAssetSiteMediaInboxRepository atomically deduplicates and applies monotonic Asset availability facts. */
export class PrismaAssetSiteMediaInboxRepository {
  constructor(private readonly prisma: PrismaService) {}
  async receive(event: { id: string; oestenantid: string; data: { assetId: string; availabilityVersion: number; lifecycleStatus: string; deliveryStatus: string } }): Promise<'APPLIED' | 'DUPLICATE' | 'STALE_IGNORED'> {
    const digest = createHash('sha256').update(JSON.stringify(event)).digest('hex'); const consumerName = 'site-service__asset-site-media__v1'
    return this.prisma.$transaction(async (tx) => {
      const inbox = await tx.siteEventInbox.findUnique({ where: { consumerName_eventId: { consumerName, eventId: event.id } } })
      if (inbox) { if (inbox.bodyDigest !== digest) throw new Error('EVENT_ID_CONFLICT'); return 'DUPLICATE' }
      const current = await tx.assetSiteMediaAvailabilityProjection.findUnique({ where: { tenantId_assetId: { tenantId: event.oestenantid, assetId: event.data.assetId } } })
      const stale = !!current && current.availabilityVersion >= BigInt(event.data.availabilityVersion)
      await tx.siteEventInbox.create({ data: { consumerName, eventId: event.id, bodyDigest: digest, status: stale ? 'STALE_IGNORED' : 'APPLIED' } })
      if (!stale) await tx.assetSiteMediaAvailabilityProjection.upsert({ where: { tenantId_assetId: { tenantId: event.oestenantid, assetId: event.data.assetId } }, create: { tenantId: event.oestenantid, assetId: event.data.assetId, availabilityVersion: BigInt(event.data.availabilityVersion), lifecycleStatus: event.data.lifecycleStatus, deliveryStatus: event.data.deliveryStatus }, update: { availabilityVersion: BigInt(event.data.availabilityVersion), lifecycleStatus: event.data.lifecycleStatus, deliveryStatus: event.data.deliveryStatus } })
      return stale ? 'STALE_IGNORED' : 'APPLIED'
    })
  }

  /** recordTerminalFailure durably captures one immutable delivery before the worker acknowledges its terminal attempt. */
  async recordTerminalFailure(input: { eventId: string; bodyDigest: string; retryCount: number; safeError: string; envelope: unknown }): Promise<void> {
    const consumerName = 'site-service__asset-site-media__v1'
    await this.prisma.$transaction((tx) => tx.siteAssetSiteMediaDlq.upsert({
      where: { consumerName_eventId_bodyDigest: { consumerName, eventId: input.eventId, bodyDigest: input.bodyDigest } },
      create: { consumerName, eventId: input.eventId, bodyDigest: input.bodyDigest, retryCount: input.retryCount, lastSafeError: input.safeError, envelope: immutableJson(input.envelope) },
      update: { retryCount: input.retryCount, lastSafeError: input.safeError }
    }))
  }
}

/** immutableJson stores an envelope snapshot without retaining a mutable caller reference. */
function immutableJson(value: unknown): Prisma.InputJsonValue { return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue }
