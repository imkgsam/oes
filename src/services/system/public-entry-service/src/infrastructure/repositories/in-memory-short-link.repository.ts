import { randomUUID } from 'crypto'
import {
  AuditEventRecord,
  ShortLinkRecord,
  VisitEventRecord
} from '../../domain/types/short-link.types'
import {
  ShortLinkListByTargetInput,
  ShortLinkRepository,
  ShortLinkVisitStatsInput,
  VisitStatsAggregate
} from '../../domain/repositories/short-link.repository'

// InMemoryShortLinkRepository supports fast application tests without crossing a database boundary.
export class InMemoryShortLinkRepository implements ShortLinkRepository {
  readonly shortLinks: ShortLinkRecord[] = []
  readonly visitEvents: VisitEventRecord[] = []
  readonly auditEvents: AuditEventRecord[] = []
  readonly qrAssets: unknown[] = []
  failVisitWrites = false

  findByShortCode(shortCode: string): Promise<ShortLinkRecord | null> {
    return Promise.resolve(this.shortLinks.find((link) => link.shortCode === shortCode) ?? null)
  }

  getById(tenantId: string, shortLinkId: string): Promise<ShortLinkRecord | null> {
    return Promise.resolve(
      this.shortLinks.find((link) => link.tenantId === tenantId && link.id === shortLinkId) ?? null
    )
  }

  isShortCodeTaken(shortCode: string): Promise<boolean> {
    return Promise.resolve(this.shortLinks.some((link) => link.shortCode === shortCode))
  }

  create(record: ShortLinkRecord): Promise<ShortLinkRecord> {
    this.shortLinks.push({ ...record })
    return Promise.resolve(record)
  }

  update(record: ShortLinkRecord): Promise<ShortLinkRecord> {
    const index = this.shortLinks.findIndex(
      (link) => link.tenantId === record.tenantId && link.id === record.id
    )
    if (index < 0) return Promise.reject(new Error('ShortLink not found'))
    this.shortLinks[index] = { ...record }
    return Promise.resolve(record)
  }

  listByTarget(
    input: ShortLinkListByTargetInput
  ): Promise<{ items: ShortLinkRecord[]; total: number }> {
    const matches = this.shortLinks.filter(
      (link) =>
        link.tenantId === input.tenantId &&
        link.targetType === input.targetType &&
        link.targetResourceId === input.targetResourceId
    )
    const page = input.page ?? 1
    const pageSize = input.pageSize ?? 20
    return Promise.resolve({
      items: matches.slice((page - 1) * pageSize, page * pageSize),
      total: matches.length
    })
  }

  recordVisit(record: VisitEventRecord): Promise<void> {
    if (this.failVisitWrites) return Promise.reject(new Error('VisitEvent write failed'))
    this.visitEvents.push({ ...record })
    return Promise.resolve()
  }

  aggregateVisits(input: ShortLinkVisitStatsInput): Promise<VisitStatsAggregate> {
    const visits = this.visitEvents.filter((visit) => {
      if (visit.tenantId !== input.tenantId || visit.shortLinkId !== input.shortLinkId) return false
      if (input.from && visit.visitedAt < input.from) return false
      if (input.to && visit.visitedAt > input.to) return false
      return true
    })

    return Promise.resolve({
      totalVisits: visits.length,
      byResultStatus: countBy(visits, (visit) => visit.resultStatus),
      byDetectedChannel: countBy(visits, (visit) => visit.detectedChannel),
      byDeviceType: countBy(visits, (visit) => visit.deviceType),
      byReferrer: countBy(visits, (visit) => visit.referrer || '(direct)'),
      lastVisitedAt: visits.reduce<Date | undefined>(
        (latest, visit) => (!latest || visit.visitedAt > latest ? visit.visitedAt : latest),
        undefined
      )
    })
  }

  recordAudit(record: AuditEventRecord): Promise<void> {
    this.auditEvents.push({ id: record.id || randomUUID(), ...record })
    return Promise.resolve()
  }
}

// countBy reduces records into a simple string-keyed aggregate map.
function countBy<T>(items: T[], key: (item: T) => string): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    const value = key(item)
    acc[value] = (acc[value] ?? 0) + 1
    return acc
  }, {})
}
