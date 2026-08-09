import { PrismaService } from '../prisma/prisma.service'

export type AssetOutboxClaim = Readonly<{ eventId: string; eventType: string; payload: unknown; attempts: number }>

/** PrismaAssetSiteMediaOutboxStore claims immutable events and records broker outcomes without rebuilding payloads. */
export class PrismaAssetSiteMediaOutboxStore {
  constructor(private readonly prisma: PrismaService) {}
  async claim(now: Date, limit: number): Promise<readonly AssetOutboxClaim[]> {
    const rows = await this.prisma.assetEventOutbox.findMany({ where: { status: 'PENDING', nextAttemptAt: { lte: now } }, take: limit, orderBy: { createdAt: 'asc' } })
    return rows.map((row) => ({ eventId: row.eventId, eventType: row.eventType, payload: row.payload, attempts: row.attempts }))
  }
  async acknowledge(eventId: string, now: Date): Promise<void> { await this.prisma.assetEventOutbox.update({ where: { eventId }, data: { status: 'PUBLISHED', publishedAt: now } }) }
  async retry(eventId: string, attempts: number, nextAttemptAt: Date): Promise<void> { await this.prisma.assetEventOutbox.update({ where: { eventId }, data: { attempts, nextAttemptAt } }) }
}
