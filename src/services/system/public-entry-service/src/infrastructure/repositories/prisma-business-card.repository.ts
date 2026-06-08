import { Injectable } from '@nestjs/common'
import { Prisma } from '../../../prisma/generated/prisma'
import {
  BusinessCardListInput,
  BusinessCardRepository
} from '../../domain/repositories/business-card.repository'
import {
  BusinessCardAuditEventRecord,
  BusinessCardRecord,
  ContactActionConfig,
  DEFAULT_VISIBILITY_CONFIG,
  PublicEntryRef,
  VisibilityConfig
} from '../../domain/types/business-card.types'
import { PrismaService } from '../prisma/prisma.service'

// PrismaBusinessCardRepository persists BusinessCard-owned config and audit records in service-owned tables.
@Injectable()
export class PrismaBusinessCardRepository implements BusinessCardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPrimaryByEmployee(tenantId: string, employeeId: string): Promise<BusinessCardRecord | null> {
    const record = await (this.prisma as any).businessCard.findFirst({
      where: { tenantId, employeeId, status: { not: 'ARCHIVED' } }
    })
    return record ? toDomainBusinessCard(record) : null
  }

  async getById(tenantId: string, businessCardId: string): Promise<BusinessCardRecord | null> {
    const record = await (this.prisma as any).businessCard.findFirst({
      where: { tenantId, id: businessCardId }
    })
    return record ? toDomainBusinessCard(record) : null
  }

  async findById(businessCardId: string): Promise<BusinessCardRecord | null> {
    const record = await (this.prisma as any).businessCard.findUnique({
      where: { id: businessCardId }
    })
    return record ? toDomainBusinessCard(record) : null
  }

  async create(record: BusinessCardRecord): Promise<BusinessCardRecord> {
    const created = await (this.prisma as any).businessCard.create({
      data: toPrismaData(record)
    })
    return toDomainBusinessCard(created)
  }

  async update(record: BusinessCardRecord): Promise<BusinessCardRecord> {
    const updated = await (this.prisma as any).businessCard.update({
      where: { id: record.id },
      data: {
        status: record.status,
        templateKey: record.templateKey,
        publicEntryRefJson: toJson(record.publicEntryRef),
        contactActionsJson: toJson(record.contactActionConfigs),
        visibilityConfigJson: toJson(record.visibilityConfig),
        updatedBy: record.updatedBy,
        updatedAt: record.updatedAt
      }
    })
    return toDomainBusinessCard(updated)
  }

  async list(input: BusinessCardListInput): Promise<{ items: BusinessCardRecord[]; total: number }> {
    const where = {
      tenantId: input.tenantId,
      employeeId: input.employeeIds?.length ? { in: input.employeeIds } : undefined
    }
    const page = input.page ?? 1
    const pageSize = input.pageSize ?? 20
    const [items, total] = await this.prisma.$transaction([
      (this.prisma as any).businessCard.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      (this.prisma as any).businessCard.count({ where })
    ])
    return { items: items.map((item: unknown) => toDomainBusinessCard(item)), total }
  }

  async recordAudit(record: BusinessCardAuditEventRecord): Promise<void> {
    await (this.prisma as any).businessCardAuditLog.create({
      data: {
        id: record.id,
        tenantId: record.tenantId,
        businessCardId: record.businessCardId,
        action: record.action,
        before: toJson(record.before),
        after: toJson(record.after),
        operatorAccountId: record.operatorAccountId,
        operatorOrgId: record.operatorOrgId,
        traceId: record.traceId,
        createdAt: record.createdAt
      }
    })
  }
}

// toPrismaData maps BusinessCard records into persisted config/reference JSON fields only.
function toPrismaData(record: BusinessCardRecord) {
  return {
    id: record.id,
    tenantId: record.tenantId,
    employeeId: record.employeeId,
    status: record.status,
    templateKey: record.templateKey,
    publicEntryRefJson: toJson(record.publicEntryRef),
    contactActionsJson: toJson(record.contactActionConfigs),
    visibilityConfigJson: toJson(record.visibilityConfig),
    createdBy: record.createdBy,
    createdAt: record.createdAt,
    updatedBy: record.updatedBy,
    updatedAt: record.updatedAt
  }
}

// toDomainBusinessCard maps raw Prisma records into application records.
function toDomainBusinessCard(raw: any): BusinessCardRecord {
  return {
    id: raw.id,
    tenantId: raw.tenantId,
    employeeId: raw.employeeId,
    status: raw.status,
    templateKey: raw.templateKey,
    publicEntryRef: parsePublicEntryRef(raw.publicEntryRefJson),
    contactActionConfigs: parseContactActionConfigs(raw.contactActionsJson),
    visibilityConfig: parseVisibilityConfig(raw.visibilityConfigJson),
    createdBy: raw.createdBy,
    createdAt: raw.createdAt,
    updatedBy: raw.updatedBy,
    updatedAt: raw.updatedAt
  }
}

// parsePublicEntryRef restores ShortLink reference metadata without owning ShortLink truth.
function parsePublicEntryRef(value: unknown): PublicEntryRef | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  return {
    publicEntryId: String(raw.publicEntryId ?? ''),
    shortCode: String(raw.shortCode ?? ''),
    publicUrl: String(raw.publicUrl ?? ''),
    qrContent: String(raw.qrContent ?? ''),
    status:
      raw.status === 'DISABLED' || raw.status === 'ARCHIVED' || raw.status === 'ACTIVE'
        ? raw.status
        : 'ACTIVE',
    expiresAt: raw.expiresAt ? new Date(String(raw.expiresAt)) : null
  }
}

// parseContactActionConfigs restores Contact Action references without contact value bodies.
function parseContactActionConfigs(value: unknown): ContactActionConfig[] {
  return Array.isArray(value) ? (value as ContactActionConfig[]).map((item) => ({ ...item })) : []
}

// parseVisibilityConfig restores display toggles and falls back to the Phase 1 default.
function parseVisibilityConfig(value: unknown): VisibilityConfig {
  if (!value || typeof value !== 'object') return { ...DEFAULT_VISIBILITY_CONFIG }
  const raw = value as Partial<VisibilityConfig>
  return {
    showTitle: raw.showTitle ?? DEFAULT_VISIBILITY_CONFIG.showTitle,
    showDepartment: raw.showDepartment ?? DEFAULT_VISIBILITY_CONFIG.showDepartment,
    showCompany: raw.showCompany ?? DEFAULT_VISIBILITY_CONFIG.showCompany,
    showOfficialPhoto: raw.showOfficialPhoto ?? DEFAULT_VISIBILITY_CONFIG.showOfficialPhoto
  }
}

// toJson narrows arbitrary config/audit payloads to Prisma JSON input.
function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  return value === undefined ? undefined : (value as Prisma.InputJsonValue)
}
