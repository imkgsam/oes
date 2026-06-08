import { randomUUID } from 'crypto'
import { ShortLinkRepository } from '../../domain/repositories/short-link.repository'
import { ShortCodeGenerator } from '../../domain/services/short-code-generator'
import {
  AuditEventRecord,
  OperatorContext,
  ShortLinkRecord,
  ShortLinkStatus,
  ShortLinkTarget
} from '../../domain/types/short-link.types'
import { QrCodeService } from './qr-code.service'
import { ShortLinkTargetResolverRegistry } from './short-link-target-resolver.registry'

type CreateShortLinkInput = {
  tenantId: string
  displayName: string
  target: ShortLinkTarget
  entryPurpose: string
  sourcePlacement: string
  campaignRef?: string | null
  expiresAt?: string | null
  operatorContext: OperatorContext
}

type UpdateTargetInput = {
  tenantId: string
  shortLinkId: string
  target: ShortLinkTarget
  reason?: string
  operatorContext: OperatorContext
}

type UpdateMetadataInput = {
  tenantId: string
  shortLinkId: string
  displayName?: string
  entryPurpose?: string
  sourcePlacement?: string
  campaignRef?: string | null
  expiresAt?: string | null
  operatorContext: OperatorContext
}

type ChangeStatusInput = {
  tenantId: string
  shortLinkId: string
  targetStatus: ShortLinkStatus
  reason?: string
  operatorContext: OperatorContext
}

const MAX_SHORT_CODE_ATTEMPTS = 32

// ShortLinkApplicationService coordinates tenant-scoped ShortLink commands and queries.
export class ShortLinkApplicationService {
  constructor(
    private readonly repository: ShortLinkRepository,
    private readonly shortCodeGenerator: ShortCodeGenerator,
    private readonly resolverRegistry: ShortLinkTargetResolverRegistry,
    private readonly qrCodeService: QrCodeService
  ) {}

  async createShortLink(input: CreateShortLinkInput): Promise<{ shortLink: ShortLinkRecord }> {
    const target = this.validateTarget(input.target)
    const now = new Date()
    const shortCode = await this.generateUniqueShortCode()
    const record: ShortLinkRecord = {
      id: randomUUID(),
      tenantId: requireNonBlank(input.tenantId, 'tenantId'),
      displayName: requireNonBlank(input.displayName, 'displayName'),
      shortCode,
      publicUrl: this.toPublicUrl(shortCode),
      ...targetToRecord(target),
      entryPurpose: requireNonBlank(input.entryPurpose, 'entryPurpose'),
      sourcePlacement: requireNonBlank(input.sourcePlacement, 'sourcePlacement'),
      campaignRef: normalizeNullable(input.campaignRef),
      status: 'ACTIVE',
      expiresAt: parseNullableDate(input.expiresAt),
      createdBy: requireNonBlank(input.operatorContext.operatorAccountId, 'operatorAccountId'),
      createdAt: now,
      updatedBy: requireNonBlank(input.operatorContext.operatorAccountId, 'operatorAccountId'),
      updatedAt: now
    }

    const created = await this.repository.create(record)
    await this.audit({
      tenantId: created.tenantId,
      shortLinkId: created.id,
      action: 'CREATE',
      after: this.targetSnapshot(created),
      operatorContext: input.operatorContext
    })
    return { shortLink: serializeShortLink(created) }
  }

  async getShortLink(input: {
    tenantId: string
    shortLinkId: string
  }): Promise<{ shortLink: ShortLinkRecord }> {
    const record = await this.requireShortLink(input.tenantId, input.shortLinkId)
    return { shortLink: serializeShortLink(record) }
  }

  async listByTarget(input: {
    tenantId: string
    targetType: string
    targetResourceId: string
    page?: number
    pageSize?: number
  }) {
    const result = await this.repository.listByTarget({
      tenantId: input.tenantId,
      targetType: requireNonBlank(input.targetType, 'targetType'),
      targetResourceId: requireNonBlank(input.targetResourceId, 'targetResourceId'),
      page: input.page,
      pageSize: input.pageSize
    })
    return {
      items: result.items.map((item) => serializeShortLink(item)),
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 20,
      total: result.total
    }
  }

  async updateTarget(input: UpdateTargetInput) {
    const current = await this.requireShortLink(input.tenantId, input.shortLinkId)
    const previousTarget = this.targetSnapshot(current)
    const target = this.validateTarget(input.target)
    const updated = await this.repository.update({
      ...current,
      ...targetToRecord(target),
      updatedBy: input.operatorContext.operatorAccountId,
      updatedAt: new Date()
    })

    await this.audit({
      tenantId: updated.tenantId,
      shortLinkId: updated.id,
      action: 'UPDATE_TARGET',
      before: previousTarget,
      after: this.targetSnapshot(updated),
      reason: input.reason,
      operatorContext: input.operatorContext
    })

    return {
      shortLinkId: updated.id,
      publicUrl: updated.publicUrl,
      previousTarget,
      target: this.targetSnapshot(updated),
      updatedAt: updated.updatedAt.toISOString()
    }
  }

  async updateMetadata(input: UpdateMetadataInput): Promise<{ shortLink: ShortLinkRecord }> {
    const current = await this.requireShortLink(input.tenantId, input.shortLinkId)
    const before = {
      displayName: current.displayName,
      entryPurpose: current.entryPurpose,
      sourcePlacement: current.sourcePlacement,
      campaignRef: current.campaignRef ?? null,
      expiresAt: current.expiresAt?.toISOString() ?? null
    }
    const updated = await this.repository.update({
      ...current,
      displayName:
        input.displayName === undefined
          ? current.displayName
          : requireNonBlank(input.displayName, 'displayName'),
      entryPurpose:
        input.entryPurpose === undefined
          ? current.entryPurpose
          : requireNonBlank(input.entryPurpose, 'entryPurpose'),
      sourcePlacement:
        input.sourcePlacement === undefined
          ? current.sourcePlacement
          : requireNonBlank(input.sourcePlacement, 'sourcePlacement'),
      campaignRef:
        input.campaignRef === undefined
          ? current.campaignRef
          : normalizeNullable(input.campaignRef),
      expiresAt:
        input.expiresAt === undefined ? current.expiresAt : parseNullableDate(input.expiresAt),
      updatedBy: input.operatorContext.operatorAccountId,
      updatedAt: new Date()
    })

    await this.audit({
      tenantId: updated.tenantId,
      shortLinkId: updated.id,
      action: 'UPDATE_METADATA',
      before,
      after: {
        displayName: updated.displayName,
        entryPurpose: updated.entryPurpose,
        sourcePlacement: updated.sourcePlacement,
        campaignRef: updated.campaignRef ?? null,
        expiresAt: updated.expiresAt?.toISOString() ?? null
      },
      operatorContext: input.operatorContext
    })

    return { shortLink: serializeShortLink(updated) }
  }

  async changeStatus(input: ChangeStatusInput) {
    const current = await this.requireShortLink(input.tenantId, input.shortLinkId)
    if (current.status === 'ARCHIVED' && input.targetStatus === 'ACTIVE') {
      throw new Error('ARCHIVED ShortLinks cannot be enabled in Phase 1')
    }
    const updated = await this.repository.update({
      ...current,
      status: input.targetStatus,
      updatedBy: input.operatorContext.operatorAccountId,
      updatedAt: new Date()
    })
    const action =
      input.targetStatus === 'ARCHIVED'
        ? 'ARCHIVE'
        : input.targetStatus === 'DISABLED'
          ? 'DISABLE'
          : 'ENABLE'
    await this.audit({
      tenantId: updated.tenantId,
      shortLinkId: updated.id,
      action,
      before: { status: current.status },
      after: { status: updated.status },
      reason: input.reason,
      operatorContext: input.operatorContext
    })
    return {
      shortLinkId: updated.id,
      previousStatus: current.status,
      status: updated.status,
      changedAt: updated.updatedAt.toISOString()
    }
  }

  async getStats(input: { tenantId: string; shortLinkId: string; from?: string; to?: string }) {
    await this.requireShortLink(input.tenantId, input.shortLinkId)
    const stats = await this.repository.aggregateVisits({
      tenantId: input.tenantId,
      shortLinkId: input.shortLinkId,
      from: parseNullableDate(input.from) ?? undefined,
      to: parseNullableDate(input.to) ?? undefined
    })
    return {
      shortLinkId: input.shortLinkId,
      totalVisits: stats.totalVisits,
      byResultStatus: stats.byResultStatus,
      byDetectedChannel: stats.byDetectedChannel,
      byDeviceType: stats.byDeviceType,
      byReferrer: stats.byReferrer,
      lastVisitedAt: stats.lastVisitedAt?.toISOString() ?? null
    }
  }

  async generateQr(input: { tenantId: string; shortLinkId: string }) {
    const record = await this.requireShortLink(input.tenantId, input.shortLinkId)
    return {
      shortLinkId: record.id,
      content: record.publicUrl,
      format: 'PNG' as const,
      imageBase64: await this.qrCodeService.generatePngBase64(record.publicUrl)
    }
  }

  private async generateUniqueShortCode(): Promise<string> {
    for (let attempt = 0; attempt < MAX_SHORT_CODE_ATTEMPTS; attempt += 1) {
      const candidate = this.shortCodeGenerator.generate()
      if (!(await this.repository.isShortCodeTaken(candidate))) {
        return candidate
      }
    }
    throw new Error('Unable to generate unique shortCode')
  }

  private validateTarget(target: ShortLinkTarget): ShortLinkTarget {
    if (target.targetKind === 'INTERNAL_REF') {
      if (!target.targetType?.trim() || !target.targetResourceId?.trim()) {
        throw new Error('INTERNAL_REF requires targetType and targetResourceId')
      }
      if ('targetUrl' in target && target.targetUrl) {
        throw new Error('INTERNAL_REF cannot include targetUrl')
      }
      return {
        targetKind: 'INTERNAL_REF',
        targetType: target.targetType.trim(),
        targetResourceId: target.targetResourceId.trim()
      }
    }

    if (target.targetKind === 'EXTERNAL_URL') {
      if ('targetType' in target || 'targetResourceId' in target) {
        throw new Error('EXTERNAL_URL cannot include internal target fields')
      }
      return { targetKind: 'EXTERNAL_URL', targetUrl: validateHttpsUrl(target.targetUrl) }
    }

    throw new Error('Unsupported targetKind')
  }

  private async requireShortLink(tenantId: string, shortLinkId: string): Promise<ShortLinkRecord> {
    const record = await this.repository.getById(
      requireNonBlank(tenantId, 'tenantId'),
      requireNonBlank(shortLinkId, 'shortLinkId')
    )
    if (!record) throw new Error('ShortLink not found')
    return record
  }

  private toPublicUrl(shortCode: string): string {
    const baseUrl = process.env.PUBLIC_ENTRY_PUBLIC_BASE_URL?.replace(/\/$/, '')
    return baseUrl ? `${baseUrl}/c/${shortCode}` : `/c/${shortCode}`
  }

  private targetSnapshot(record: ShortLinkRecord): ShortLinkTarget {
    if (record.targetKind === 'INTERNAL_REF') {
      return {
        targetKind: 'INTERNAL_REF',
        targetType: record.targetType ?? '',
        targetResourceId: record.targetResourceId ?? ''
      }
    }
    return { targetKind: 'EXTERNAL_URL', targetUrl: record.targetUrl ?? '' }
  }

  private async audit(input: {
    tenantId: string
    shortLinkId: string
    action: string
    before?: unknown
    after?: unknown
    reason?: string
    operatorContext: OperatorContext
  }): Promise<void> {
    const record: AuditEventRecord = {
      id: randomUUID(),
      tenantId: input.tenantId,
      shortLinkId: input.shortLinkId,
      action: input.action,
      before: input.before,
      after: input.after,
      reason: input.reason,
      operatorAccountId: input.operatorContext.operatorAccountId,
      operatorOrgId: input.operatorContext.operatorOrgId,
      traceId: input.operatorContext.traceId,
      createdAt: new Date()
    }
    await this.repository.recordAudit(record)
  }
}

// targetToRecord maps a validated target contract into ShortLink persistence fields.
function targetToRecord(target: ShortLinkTarget) {
  if (target.targetKind === 'INTERNAL_REF') {
    return {
      targetKind: target.targetKind,
      targetType: target.targetType,
      targetResourceId: target.targetResourceId,
      targetUrl: null
    }
  }
  return {
    targetKind: target.targetKind,
    targetType: null,
    targetResourceId: null,
    targetUrl: target.targetUrl
  }
}

// validateHttpsUrl enforces Phase 1 external redirect safety rules.
export function validateHttpsUrl(value: string): string {
  try {
    const url = new URL(requireNonBlank(value, 'targetUrl'))
    if (url.protocol !== 'https:') {
      throw new Error('EXTERNAL_URL must use https')
    }
    return url.toString()
  } catch (error) {
    if ((error as Error).message === 'EXTERNAL_URL must use https') throw error
    throw new Error('EXTERNAL_URL must use https')
  }
}

// requireNonBlank normalizes required string inputs at application boundaries.
export function requireNonBlank(value: string | undefined | null, fieldName: string): string {
  const normalized = value?.trim()
  if (!normalized) throw new Error(`${fieldName} is required`)
  return normalized
}

// parseNullableDate converts optional ISO inputs into nullable Date values.
function parseNullableDate(value: string | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error('Invalid date')
  return date
}

// normalizeNullable stores blank metadata as null to avoid ambiguous empty strings.
function normalizeNullable(value: string | null | undefined): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

// serializeShortLink returns detached records so callers cannot mutate repository state.
function serializeShortLink(record: ShortLinkRecord): ShortLinkRecord {
  return { ...record }
}
