import { Injectable } from '@nestjs/common'
import { Prisma, ShortLink as PrismaShortLink } from '../../../prisma/generated/prisma'
import {
  ShortLinkListByTargetInput,
  ShortLinkRepository,
  ShortLinkVisitStatsInput,
  VisitStatsAggregate
} from '../../domain/repositories/short-link.repository'
import {
  AuditEventRecord,
  ShortLinkRecord,
  VisitEventRecord,
  VisitResultStatus
} from '../../domain/types/short-link.types'
import { PrismaService } from '../prisma/prisma.service'

// PrismaShortLinkRepository persists ShortLink lifecycle, VisitEvent, and audit records in service-owned tables.
@Injectable()
export class PrismaShortLinkRepository implements ShortLinkRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByShortCode(shortCode: string): Promise<ShortLinkRecord | null> {
    const record = await this.prisma.shortLink.findUnique({ where: { shortCode } })
    return record ? toDomainShortLink(record) : null
  }

  async getById(tenantId: string, shortLinkId: string): Promise<ShortLinkRecord | null> {
    const record = await this.prisma.shortLink.findFirst({ where: { tenantId, id: shortLinkId } })
    return record ? toDomainShortLink(record) : null
  }

  async isShortCodeTaken(shortCode: string): Promise<boolean> {
    const count = await this.prisma.shortLink.count({ where: { shortCode } })
    return count > 0
  }

  async create(record: ShortLinkRecord): Promise<ShortLinkRecord> {
    const created = await this.prisma.shortLink.create({
      data: {
        id: record.id,
        tenantId: record.tenantId,
        displayName: record.displayName,
        shortCode: record.shortCode,
        targetKind: record.targetKind,
        targetType: record.targetType ?? null,
        targetResourceId: record.targetResourceId ?? null,
        targetUrl: record.targetUrl ?? null,
        entryPurpose: record.entryPurpose,
        sourcePlacement: record.sourcePlacement,
        campaignRef: record.campaignRef ?? null,
        status: record.status,
        expiresAt: record.expiresAt ?? null,
        createdBy: record.createdBy,
        createdAt: record.createdAt,
        updatedBy: record.updatedBy,
        updatedAt: record.updatedAt
      }
    })
    return toDomainShortLink(created)
  }

  async update(record: ShortLinkRecord): Promise<ShortLinkRecord> {
    const updated = await this.prisma.shortLink.update({
      where: { id: record.id },
      data: {
        displayName: record.displayName,
        targetKind: record.targetKind,
        targetType: record.targetType ?? null,
        targetResourceId: record.targetResourceId ?? null,
        targetUrl: record.targetUrl ?? null,
        entryPurpose: record.entryPurpose,
        sourcePlacement: record.sourcePlacement,
        campaignRef: record.campaignRef ?? null,
        status: record.status,
        expiresAt: record.expiresAt ?? null,
        updatedBy: record.updatedBy,
        updatedAt: record.updatedAt
      }
    })
    return toDomainShortLink(updated)
  }

  async listByTarget(
    input: ShortLinkListByTargetInput
  ): Promise<{ items: ShortLinkRecord[]; total: number }> {
    const where = {
      tenantId: input.tenantId,
      targetType: input.targetType,
      targetResourceId: input.targetResourceId
    }
    const page = input.page ?? 1
    const pageSize = input.pageSize ?? 20
    const [items, total] = await this.prisma.$transaction([
      this.prisma.shortLink.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      this.prisma.shortLink.count({ where })
    ])
    return { items: items.map((item) => toDomainShortLink(item)), total }
  }

  async recordVisit(record: VisitEventRecord): Promise<void> {
    await this.prisma.visitEvent.create({
      data: {
        id: record.id,
        tenantId: record.tenantId,
        shortLinkId: record.shortLinkId,
        visitedAt: record.visitedAt,
        userAgent: record.userAgent,
        ipAddress: record.ipAddress,
        detectedChannel: record.detectedChannel,
        deviceType: record.deviceType,
        locale: record.locale,
        referrer: record.referrer,
        resultStatus: record.resultStatus
      }
    })
  }

  async aggregateVisits(input: ShortLinkVisitStatsInput): Promise<VisitStatsAggregate> {
    const where: Prisma.VisitEventWhereInput = {
      tenantId: input.tenantId,
      shortLinkId: input.shortLinkId,
      visitedAt: {
        gte: input.from,
        lte: input.to
      }
    }
    const [totalVisits, byResultStatus, byDetectedChannel, byDeviceType, byReferrer, latest] =
      await this.prisma.$transaction([
        this.prisma.visitEvent.count({ where }),
        (this.prisma.visitEvent.groupBy as any)({
          by: ['resultStatus'],
          where,
          _count: { _all: true }
        }),
        (this.prisma.visitEvent.groupBy as any)({
          by: ['detectedChannel'],
          where,
          _count: { _all: true }
        }),
        (this.prisma.visitEvent.groupBy as any)({
          by: ['deviceType'],
          where,
          _count: { _all: true }
        }),
        (this.prisma.visitEvent.groupBy as any)({
          by: ['referrer'],
          where,
          _count: { _all: true }
        }),
        this.prisma.visitEvent.findFirst({ where, orderBy: { visitedAt: 'desc' } })
      ])
    return {
      totalVisits,
      byResultStatus: mapGroupBy(byResultStatus, 'resultStatus'),
      byDetectedChannel: mapGroupBy(byDetectedChannel, 'detectedChannel'),
      byDeviceType: mapGroupBy(byDeviceType, 'deviceType'),
      byReferrer: mapGroupBy(byReferrer, 'referrer', '(direct)'),
      lastVisitedAt: latest?.visitedAt
    }
  }

  async recordAudit(record: AuditEventRecord): Promise<void> {
    await this.prisma.shortLinkAuditLog.create({
      data: {
        id: record.id,
        tenantId: record.tenantId,
        shortLinkId: record.shortLinkId,
        action: record.action,
        before: toJson(record.before),
        after: toJson(record.after),
        reason: record.reason,
        operatorAccountId: record.operatorAccountId,
        operatorOrgId: record.operatorOrgId,
        traceId: record.traceId,
        createdAt: record.createdAt
      }
    })
  }
}

// toDomainShortLink maps Prisma records into the application ShortLink record.
function toDomainShortLink(record: PrismaShortLink): ShortLinkRecord {
  return {
    id: record.id,
    tenantId: record.tenantId,
    displayName: record.displayName,
    shortCode: record.shortCode,
    publicUrl: toPublicUrl(record.shortCode),
    targetKind: record.targetKind,
    targetType: record.targetType,
    targetResourceId: record.targetResourceId,
    targetUrl: record.targetUrl,
    entryPurpose: record.entryPurpose,
    sourcePlacement: record.sourcePlacement,
    campaignRef: record.campaignRef,
    status: record.status,
    expiresAt: record.expiresAt,
    createdBy: record.createdBy,
    createdAt: record.createdAt,
    updatedBy: record.updatedBy,
    updatedAt: record.updatedAt
  }
}

// toPublicUrl reconstructs the public URL from shortCode and optional deployment base URL.
function toPublicUrl(shortCode: string): string {
  const baseUrl = process.env.PUBLIC_ENTRY_PUBLIC_BASE_URL?.replace(/\/$/, '')
  return baseUrl ? `${baseUrl}/c/${shortCode}` : `/c/${shortCode}`
}

// mapGroupBy converts Prisma groupBy results into string-keyed aggregate maps.
function mapGroupBy<T extends Record<string, unknown>>(
  rows: Array<T & { _count: { _all: number } }>,
  key: keyof T,
  emptyLabel?: string
): Record<string, number> {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const rawKey = row[key]
    const normalizedKey = String(rawKey || emptyLabel || '')
    acc[normalizedKey] = row._count._all
    return acc
  }, {})
}

// toJson narrows arbitrary audit payloads to Prisma JSON input.
function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  return value === undefined ? undefined : (value as Prisma.InputJsonValue)
}
