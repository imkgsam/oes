import { AuditEventRecord, ShortLinkRecord, VisitEventRecord } from '../types/short-link.types'

export type ShortLinkListByTargetInput = {
  tenantId: string
  targetType: string
  targetResourceId: string
  page?: number
  pageSize?: number
}

export type ShortLinkListInput = {
  tenantId: string
  targetKind?: ShortLinkRecord['targetKind']
  targetType?: string
  page?: number
  pageSize?: number
}

export type ShortLinkVisitStatsInput = {
  tenantId: string
  shortLinkId: string
  from?: Date
  to?: Date
}

export type VisitStatsAggregate = {
  totalVisits: number
  byResultStatus: Record<string, number>
  byDetectedChannel: Record<string, number>
  byDeviceType: Record<string, number>
  byReferrer: Record<string, number>
  lastVisitedAt?: Date
}

// ShortLinkRepository persists ShortLink lifecycle, immutable VisitEvent records, and audit facts.
export interface ShortLinkRepository {
  findByShortCode(shortCode: string): Promise<ShortLinkRecord | null>
  getById(tenantId: string, shortLinkId: string): Promise<ShortLinkRecord | null>
  isShortCodeTaken(shortCode: string): Promise<boolean>
  create(record: ShortLinkRecord): Promise<ShortLinkRecord>
  update(record: ShortLinkRecord): Promise<ShortLinkRecord>
  list(input: ShortLinkListInput): Promise<{ items: ShortLinkRecord[]; total: number }>
  listByTarget(
    input: ShortLinkListByTargetInput
  ): Promise<{ items: ShortLinkRecord[]; total: number }>
  recordVisit(record: VisitEventRecord): Promise<void>
  aggregateVisits(input: ShortLinkVisitStatsInput): Promise<VisitStatsAggregate>
  recordAudit(record: AuditEventRecord): Promise<void>
}
