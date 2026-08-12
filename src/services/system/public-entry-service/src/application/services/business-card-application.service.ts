import { randomUUID } from 'crypto'
import {
  BusinessCardListInput,
  BusinessCardRepository
} from '../../domain/repositories/business-card.repository'
import {
  BusinessCardAuditEventRecord,
  BusinessCardRecord,
  BusinessCardSummary,
  BusinessCardStatus,
  ContactActionConfig,
  DEFAULT_VISIBILITY_CONFIG,
  OperatorContext,
  PublicBusinessCardView,
  PublicContactAction,
  PublicEntryRef,
  PublicRenderResult,
  ReadinessReason,
  SerializedPublicEntryRef,
  TENANT_STANDARD_TEMPLATE_KEY,
  VisibilityConfig
} from '../../domain/types/business-card.types'
import { TargetResolverRequest } from '../../domain/types/short-link.types'
import { ShortLinkApplicationService } from './short-link-application.service'
import {
  BusinessCardAuthorizationPort,
  BusinessCardCompanyDisplaySummary,
  BusinessCardContactAssetPort,
  BusinessCardEmployeePort,
  BusinessCardEmployeeSummary,
  BusinessCardTenantProfilePort,
  ContactActionPublicSafeValue
} from '../ports/business-card.ports'

export const BUSINESS_CARD_PERMISSION_CODES = {
  READ: 'public-entry.business-card.read',
  MANAGE: 'public-entry.business-card.manage',
  ENABLE: 'public-entry.business-card.enable',
  DISABLE: 'public-entry.business-card.disable',
  PUBLIC_ENTRY_MANAGE: 'public-entry.business-card.public-entry.manage',
  STATS_READ: 'public-entry.business-card.stats.read'
} as const

type EnsurePrimaryCardInput = {
  tenantId: string
  employeeId: string
  operatorContext: OperatorContext
}

type BusinessCardIdInput = {
  tenantId: string
  businessCardId: string
  operatorContext: OperatorContext
}

type UpdateContactActionsInput = BusinessCardIdInput & {
  contactActionConfigs: ContactActionConfig[]
  visibilityConfig?: VisibilityConfig
}

type PublicCardInput = {
  tenantId: string
  businessCardId: string
  traceId?: string
}

// BusinessCardApplicationService coordinates card config, upstream facts, ShortLink consumption, authorization, and audit.
export class BusinessCardApplicationService {
  constructor(
    private readonly repository: BusinessCardRepository,
    private readonly shortLinkService: ShortLinkApplicationService,
    private readonly employeePort: BusinessCardEmployeePort,
    private readonly contactAssetPort: BusinessCardContactAssetPort,
    private readonly tenantProfilePort: BusinessCardTenantProfilePort,
    private readonly authorizationPort: BusinessCardAuthorizationPort
  ) {}

  async ensurePrimaryCard(input: EnsurePrimaryCardInput): Promise<{ businessCard: BusinessCardSummary }> {
    await this.requirePermission(input.tenantId, BUSINESS_CARD_PERMISSION_CODES.MANAGE, input.operatorContext)
    const tenantId = requireNonBlank(input.tenantId, 'tenantId')
    const employeeId = requireNonBlank(input.employeeId, 'employeeId')
    const existing = await this.repository.findPrimaryByEmployee(tenantId, employeeId)
    if (existing) return { businessCard: serializeBusinessCard(existing) }

    const now = new Date()
    const created = await this.repository.create({
      id: randomUUID(),
      tenantId,
      employeeId,
      status: 'DRAFT',
      templateKey: TENANT_STANDARD_TEMPLATE_KEY,
      publicEntryRef: null,
      contactActionConfigs: [],
      visibilityConfig: { ...DEFAULT_VISIBILITY_CONFIG },
      createdBy: requireNonBlank(input.operatorContext.operatorAccountId, 'operatorAccountId'),
      createdAt: now,
      updatedBy: input.operatorContext.operatorAccountId,
      updatedAt: now
    })
    await this.audit(created, 'CREATE', undefined, serializeBusinessCard(created), input.operatorContext)
    return { businessCard: serializeBusinessCard(created) }
  }

  async listCards(input: {
    tenantId: string
    page?: number
    pageSize?: number
    operatorContext: OperatorContext
  }) {
    const scope = await this.authorizationPort.buildQueryScope({
      tenantId: input.tenantId,
      permissionCode: BUSINESS_CARD_PERMISSION_CODES.READ,
      operatorContext: input.operatorContext
    })
    const listInput: BusinessCardListInput = {
      tenantId: scope.tenantId,
      employeeIds: scope.employeeIds,
      page: input.page,
      pageSize: input.pageSize
    }
    const result = await this.repository.list(listInput)
    const items = await Promise.all(result.items.map((card) => this.withLivePublicEntryRef(card)))
    return {
      items: items.map((card) => serializeBusinessCard(card)),
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 20,
      total: result.total
    }
  }

  async getCardDetail(input: BusinessCardIdInput) {
    const card = await this.requireCardWithResourcePermission(
      input,
      BUSINESS_CARD_PERMISSION_CODES.READ
    )
    const liveCard = await this.withLivePublicEntryRef(card)
    const readiness = await this.runReadinessCheck({
      tenantId: input.tenantId,
      businessCardId: input.businessCardId,
      operatorContext: input.operatorContext
    })
    return { businessCard: serializeBusinessCard(liveCard), readiness }
  }

  async updateCardConfig(input: BusinessCardIdInput & { templateKey?: string; visibilityConfig?: VisibilityConfig }) {
    const current = await this.requireCardWithResourcePermission(
      input,
      BUSINESS_CARD_PERMISSION_CODES.MANAGE
    )
    const updated = await this.repository.update({
      ...current,
      templateKey: input.templateKey?.trim() || current.templateKey,
      visibilityConfig: input.visibilityConfig ? normalizeVisibility(input.visibilityConfig) : current.visibilityConfig,
      updatedBy: input.operatorContext.operatorAccountId,
      updatedAt: new Date()
    })
    await this.audit(current, 'UPDATE_CONFIG', serializeBusinessCard(current), serializeBusinessCard(updated), input.operatorContext)
    return { businessCard: serializeBusinessCard(updated) }
  }

  async updateContactActions(input: UpdateContactActionsInput) {
    const current = await this.requireCardWithResourcePermission(
      input,
      BUSINESS_CARD_PERMISSION_CODES.MANAGE
    )
    const normalized = normalizeContactActionConfigs(input.contactActionConfigs)
    const updated = await this.repository.update({
      ...current,
      contactActionConfigs: normalized,
      visibilityConfig: input.visibilityConfig
        ? normalizeVisibility(input.visibilityConfig)
        : current.visibilityConfig,
      updatedBy: input.operatorContext.operatorAccountId,
      updatedAt: new Date()
    })
    await this.audit(current, 'UPDATE_CONTACT_ACTIONS', serializeBusinessCard(current), serializeBusinessCard(updated), input.operatorContext)
    return { businessCard: serializeBusinessCard(updated) }
  }

  async bindOrRefreshMainPublicEntry(input: BusinessCardIdInput) {
    const current = await this.requireCardWithResourcePermission(
      input,
      BUSINESS_CARD_PERMISSION_CODES.PUBLIC_ENTRY_MANAGE
    )
    const existing = current.publicEntryRef
      ? await this.shortLinkService.getShortLink({
          tenantId: input.tenantId,
          shortLinkId: current.publicEntryRef.publicEntryId
        }).catch(() => null)
      : null
    const shortLink = existing?.shortLink ?? (await this.shortLinkService.createShortLink({
      tenantId: current.tenantId,
      displayName: `Business card ${current.employeeId}`,
      target: {
        targetKind: 'INTERNAL_REF',
        targetType: 'BUSINESS_CARD',
        targetResourceId: current.id
      },
      entryPurpose: 'BUSINESS_CARD',
      sourcePlacement: 'EMPLOYEE_MAIN_CARD',
      operatorContext: input.operatorContext
    })).shortLink
    const publicEntryRef: PublicEntryRef = {
      publicEntryId: shortLink.id,
      shortCode: shortLink.shortCode,
      publicUrl: shortLink.publicUrl,
      qrContent: shortLink.publicUrl,
      status: shortLink.status,
      expiresAt: shortLink.expiresAt ?? null
    }
    const updated = await this.repository.update({
      ...current,
      publicEntryRef,
      updatedBy: input.operatorContext.operatorAccountId,
      updatedAt: new Date()
    })
    await this.audit(current, 'BIND_PUBLIC_ENTRY', serializeBusinessCard(current), serializeBusinessCard(updated), input.operatorContext)
    return { publicEntryRef: serializePublicEntryRef(publicEntryRef) }
  }

  async enableCard(input: BusinessCardIdInput) {
    const current = await this.requireCardWithResourcePermission(
      input,
      BUSINESS_CARD_PERMISSION_CODES.ENABLE
    )
    const readiness = await this.evaluateReadiness(current, input.operatorContext.traceId, {
      ignoreCurrentStatus: true
    })
    if (!readiness.ready) {
      throw new Error(`BusinessCard is not ready: ${readiness.reasons.join(',')}`)
    }
    const updated = await this.repository.update({
      ...current,
      status: 'ACTIVE',
      updatedBy: input.operatorContext.operatorAccountId,
      updatedAt: new Date()
    })
    await this.audit(current, 'ENABLE', { status: current.status }, { status: updated.status }, input.operatorContext)
    return { businessCardId: updated.id, previousStatus: current.status, status: updated.status }
  }

  async disableCard(input: BusinessCardIdInput) {
    const current = await this.requireCardWithResourcePermission(
      input,
      BUSINESS_CARD_PERMISSION_CODES.DISABLE
    )
    const updated = await this.repository.update({
      ...current,
      status: 'DISABLED',
      updatedBy: input.operatorContext.operatorAccountId,
      updatedAt: new Date()
    })
    await this.audit(current, 'DISABLE', { status: current.status }, { status: updated.status }, input.operatorContext)
    return { businessCardId: updated.id, previousStatus: current.status, status: updated.status }
  }

  async runReadinessCheck(input: BusinessCardIdInput) {
    const card = await this.requireCardWithResourcePermission(
      input,
      BUSINESS_CARD_PERMISSION_CODES.READ
    )
    return this.evaluateReadiness(card, input.operatorContext.traceId)
  }

  async getMainPublicEntrySummary(input: BusinessCardIdInput) {
    const card = await this.requireCardWithResourcePermission(
      input,
      BUSINESS_CARD_PERMISSION_CODES.READ
    )
    const liveCard = await this.withLivePublicEntryRef(card)
    return { publicEntryRef: liveCard.publicEntryRef ? serializePublicEntryRef(liveCard.publicEntryRef) : null }
  }

  async getVisitSummary(input: BusinessCardIdInput & { from?: string; to?: string }) {
    const card = await this.requireCardWithResourcePermission(
      input,
      BUSINESS_CARD_PERMISSION_CODES.STATS_READ
    )
    if (!card.publicEntryRef) throw new Error('Public entry missing')
    return this.shortLinkService.getStats({
      tenantId: input.tenantId,
      shortLinkId: card.publicEntryRef.publicEntryId,
      from: input.from,
      to: input.to
    })
  }

  async getOwnCardPreview(input: { tenantId: string; accountId: string; traceId?: string }) {
    const employee = await this.employeePort.getEmployeeByAccount({
      tenantId: input.tenantId,
      accountId: requireNonBlank(input.accountId, 'accountId'),
      traceId: input.traceId
    })
    if (!employee) throw new Error('Employee binding not found')
    const card = await this.withLivePublicEntryRef(
      await this.repository.findPrimaryByEmployee(input.tenantId, employee.employeeId)
    )
    if (!card) throw new Error('BusinessCard not found')
    const rendered = await this.renderPublicCard({
      tenantId: input.tenantId,
      businessCardId: card.id,
      traceId: input.traceId
    })
    return {
      businessCardId: card.id,
      employeeId: employee.employeeId,
      status: card.status,
      publicEntryRef: card.publicEntryRef ? serializePublicEntryRef(card.publicEntryRef) : null,
      enabledActions:
        rendered.state === 'AVAILABLE'
          ? rendered.view.contactActions.map((action) => action.contactActionType)
          : [],
      preview: rendered
    }
  }

  async renderPublicCard(input: PublicCardInput): Promise<PublicRenderResult> {
    const card = await this.repository.getById(input.tenantId, input.businessCardId)
    return this.renderPublicCardFromRecord(card, input.traceId)
  }

  async renderPublicCardById(input: { businessCardId: string; traceId?: string }): Promise<PublicRenderResult> {
    const card = await this.repository.findById(input.businessCardId)
    return this.renderPublicCardFromRecord(card, input.traceId)
  }

  private async renderPublicCardFromRecord(
    card: BusinessCardRecord | null,
    traceId?: string
  ): Promise<PublicRenderResult> {
    if (!card) return { state: 'PUBLIC_CARD_NOT_FOUND', view: null }
    const liveCard = await this.withLivePublicEntryRef(card)
    const readiness = await this.evaluateReadiness(liveCard, traceId)
    if (!readiness.ready) return { state: 'PUBLIC_CARD_UNAVAILABLE', view: null }
    const employee = await this.requireEmployee(liveCard, traceId)
    const company = await this.requireCompany(liveCard.tenantId, traceId)
    const contactActions = await this.resolvePublicContactActions(liveCard, company, traceId)
    return {
      state: 'AVAILABLE',
      view: {
        businessCardId: liveCard.id,
        publicUrl: liveCard.publicEntryRef?.publicUrl ?? null,
        templateKey: liveCard.templateKey,
        person: {
          displayName: employee.displayName ?? '',
          englishName: employee.englishName ?? null,
          title: liveCard.visibilityConfig.showTitle ? employee.title ?? null : null,
          department: liveCard.visibilityConfig.showDepartment ? employee.department ?? null : null,
          officialPhotoUrl: liveCard.visibilityConfig.showOfficialPhoto
            ? employee.officialPhotoUrl ?? null
            : null
        },
        company: {
          companyDisplayName: liveCard.visibilityConfig.showCompany
            ? company.companyDisplayName ?? ''
            : '',
          websiteUrl: company.websiteUrl ?? null,
          logoUrl: company.logoUrl ?? null
        },
        contactActions
      }
    }
  }

  async generateVCard(input: PublicCardInput | { businessCardId: string; traceId?: string }) {
    const rendered = 'tenantId' in input
      ? await this.renderPublicCard(input)
      : await this.renderPublicCardById({
          businessCardId: input.businessCardId,
          traceId: input.traceId
        })
    if (rendered.state !== 'AVAILABLE') {
      return { contentType: 'text/vcard', body: '' }
    }
    return {
      contentType: 'text/vcard',
      body: toVCard(rendered.view)
    }
  }

  async resolveTarget(request: TargetResolverRequest) {
    if (request.targetType !== 'BUSINESS_CARD') {
      return { result: 'UNAVAILABLE' as const, resultTarget: 'business-card:unsupported-target' }
    }
    const card = await this.withLivePublicEntryRef(
      await this.repository.getById(request.tenantId, request.targetResourceId)
    )
    if (!card) return { result: 'NOT_FOUND' as const, resultTarget: 'business-card:not-found' }
    const readiness = await this.evaluateReadiness(card, request.requestContext.traceId)
    if (!readiness.ready) {
      return { result: 'UNAVAILABLE' as const, resultTarget: 'business-card:unavailable' }
    }
    return {
      result: 'REDIRECT' as const,
      redirectUrl: this.toPublicBusinessCardUrl(card.id),
      resultTarget: 'business-card:web'
    }
  }

  async resolve(request: TargetResolverRequest) {
    return this.resolveTarget(request)
  }

  // withLivePublicEntryRef overlays the current ShortLink lifecycle onto BusinessCard's stored entry reference.
  private async withLivePublicEntryRef<T extends BusinessCardRecord | null>(card: T): Promise<T> {
    if (!card?.publicEntryRef) return card
    const result = await this.shortLinkService.getShortLink({
      tenantId: card.tenantId,
      shortLinkId: card.publicEntryRef.publicEntryId
    }).catch(() => null)
    const shortLink = result?.shortLink
    if (!shortLink) {
      return { ...card, publicEntryRef: null } as T
    }
    return {
      ...card,
      publicEntryRef: {
        publicEntryId: shortLink.id,
        shortCode: shortLink.shortCode,
        publicUrl: shortLink.publicUrl,
        qrContent: shortLink.publicUrl,
        status: shortLink.status,
        expiresAt: shortLink.expiresAt ?? null
      }
    } as T
  }

  private async requireCardWithResourcePermission(
    input: BusinessCardIdInput,
    permissionCode: string
  ): Promise<BusinessCardRecord> {
    const card = await this.requireCard(input.tenantId, input.businessCardId)
    const allowed = await this.authorizationPort.checkResource({
      tenantId: input.tenantId,
      permissionCode,
      resource: {
        tenantId: card.tenantId,
        businessCardId: card.id,
        employeeId: card.employeeId,
        status: card.status
      },
      operatorContext: input.operatorContext
    })
    if (!allowed) throw new Error('Permission denied')
    return card
  }

  private async requirePermission(
    tenantId: string,
    permissionCode: string,
    operatorContext: OperatorContext
  ): Promise<void> {
    const allowed = await this.authorizationPort.checkPermission({
      tenantId,
      permissionCode,
      operatorContext
    })
    if (!allowed) throw new Error('Permission denied')
  }

  private async requireCard(tenantId: string, businessCardId: string): Promise<BusinessCardRecord> {
    const card = await this.repository.getById(
      requireNonBlank(tenantId, 'tenantId'),
      requireNonBlank(businessCardId, 'businessCardId')
    )
    if (!card) throw new Error('BusinessCard not found')
    if (card.tenantId !== tenantId) throw new Error('BusinessCard not found')
    return card
  }

  private async evaluateReadiness(
    card: BusinessCardRecord,
    traceId?: string,
    options?: { ignoreCurrentStatus?: boolean }
  ) {
    const liveCard = await this.withLivePublicEntryRef(card)
    const reasons: ReadinessReason[] = []
    if (!options?.ignoreCurrentStatus && liveCard.status !== 'ACTIVE') reasons.push('CARD_DISABLED')
    if (liveCard.templateKey !== TENANT_STANDARD_TEMPLATE_KEY) reasons.push('TEMPLATE_UNAVAILABLE')
    if (!liveCard.publicEntryRef) {
      reasons.push('PUBLIC_ENTRY_MISSING')
    } else if (liveCard.publicEntryRef.status !== 'ACTIVE') {
      reasons.push('PUBLIC_ENTRY_DISABLED')
    }
    const employee = await this.employeePort.getEmployeeSummary({
      tenantId: liveCard.tenantId,
      employeeId: liveCard.employeeId,
      traceId
    })
    if (!employee) {
      reasons.push('EMPLOYEE_NOT_FOUND')
    } else {
      if (employee.status !== 'ACTIVE') reasons.push('EMPLOYEE_NOT_ACTIVE')
      if (!employee.displayName?.trim()) reasons.push('DISPLAY_NAME_MISSING')
    }
    const company = await this.tenantProfilePort.getCompanyDisplaySummary({
      tenantId: liveCard.tenantId,
      traceId
    })
    if (!company?.companyDisplayName?.trim()) reasons.push('COMPANY_DISPLAY_MISSING')
    return {
      ready: reasons.length === 0,
      reasons: reasons.length === 0 ? (['READY'] as ReadinessReason[]) : reasons
    }
  }

  private async requireEmployee(card: BusinessCardRecord, traceId?: string) {
    const employee = await this.employeePort.getEmployeeSummary({
      tenantId: card.tenantId,
      employeeId: card.employeeId,
      traceId
    })
    if (!employee) throw new Error('Employee not found')
    return employee
  }

  private async requireCompany(tenantId: string, traceId?: string) {
    const company = await this.tenantProfilePort.getCompanyDisplaySummary({ tenantId, traceId })
    if (!company?.companyDisplayName) throw new Error('Company display missing')
    return company
  }

  private async resolvePublicContactActions(
    card: BusinessCardRecord,
    company: BusinessCardCompanyDisplaySummary,
    traceId?: string
  ) {
    const enabledConfigs = card.contactActionConfigs
      .filter((config) => config.enabled && config.visibility === 'PUBLIC')
      .sort((a, b) => a.displayOrder - b.displayOrder)
    const refs = enabledConfigs.filter((config) => config.targetRefType === 'CONTACT_ASSET')
    const resolvedValues = await this.contactAssetPort.resolvePublicSafeValues({
      tenantId: card.tenantId,
      employeeId: card.employeeId,
      actionRefs: refs.map((config) => ({
        contactActionType: config.contactActionType,
        targetRefType: config.targetRefType,
        targetRefId: config.targetRefId
      })),
      traceId
    })
    return enabledConfigs.flatMap<PublicContactAction>((config) => {
      if (config.contactActionType === 'SAVE_VCARD') {
        return [
          {
            contactActionType: config.contactActionType,
            displayOrder: config.displayOrder,
            actionUrl: this.toPublicBusinessCardVCardUrl(card.id)
          }
        ]
      }
      if (config.contactActionType === 'OPEN_COMPANY_WEBSITE') {
        if (!company.websiteUrl?.trim()) return []
        return [
          {
            contactActionType: config.contactActionType,
            displayOrder: config.displayOrder,
            displayValue: formatPublicUrlDisplayValue(company.websiteUrl),
            actionUrl: company.websiteUrl
          }
        ]
      }
      const value = findResolvedValue(config, resolvedValues)
      if (!value?.available) return []
      return [
        {
          contactActionType: config.contactActionType,
          displayOrder: config.displayOrder,
          displayValue: value.displayValue ?? null,
          actionUrl: value.actionUrl ?? null
        }
      ]
    })
  }

  private toPublicBusinessCardUrl(businessCardId: string): string {
    const baseUrl = process.env.PUBLIC_ENTRY_PUBLIC_RENDER_BASE_URL?.replace(/\/$/, '')
    const path = `/public/business-cards/${encodeURIComponent(businessCardId)}`
    return baseUrl ? `${baseUrl}${path}` : `https://public.oes.local${path}`
  }

  private toPublicBusinessCardVCardUrl(businessCardId: string): string {
    return `${this.toPublicBusinessCardUrl(businessCardId)}.vcf`
  }

  private async audit(
    card: BusinessCardRecord,
    action: string,
    before: unknown,
    after: unknown,
    operatorContext: OperatorContext
  ) {
    const event: BusinessCardAuditEventRecord = {
      id: randomUUID(),
      tenantId: card.tenantId,
      businessCardId: card.id,
      action,
      before,
      after,
      operatorAccountId: operatorContext.operatorAccountId,
      operatorOrgId: operatorContext.operatorOrgId,
      traceId: operatorContext.traceId,
      createdAt: new Date()
    }
    await this.repository.recordAudit(event)
  }
}

// requireNonBlank normalizes required string inputs at the application boundary.
function requireNonBlank(value: string | undefined | null, fieldName: string): string {
  const normalized = value?.trim()
  if (!normalized) throw new Error(`${fieldName} is required`)
  return normalized
}

// serializeBusinessCard returns a contract-friendly detached BusinessCard summary.
function serializeBusinessCard(record: BusinessCardRecord) {
  return {
    businessCardId: record.id,
    tenantId: record.tenantId,
    employeeId: record.employeeId,
    status: record.status,
    templateKey: record.templateKey,
    publicEntryRef: record.publicEntryRef ? serializePublicEntryRef(record.publicEntryRef) : null,
    contactActionConfigs: record.contactActionConfigs.map((config) => ({ ...config })),
    visibilityConfig: { ...record.visibilityConfig },
    updatedAt: record.updatedAt.toISOString()
  }
}

// serializePublicEntryRef detaches ShortLink reference metadata and renders dates as strings.
function serializePublicEntryRef(ref: PublicEntryRef): SerializedPublicEntryRef {
  return {
    ...ref,
    expiresAt: ref.expiresAt?.toISOString() ?? null
  }
}

// normalizeVisibility copies only supported visibility switches.
function normalizeVisibility(input: VisibilityConfig): VisibilityConfig {
  return {
    showTitle: Boolean(input.showTitle),
    showDepartment: Boolean(input.showDepartment),
    showCompany: Boolean(input.showCompany),
    showOfficialPhoto: Boolean(input.showOfficialPhoto)
  }
}

// normalizeContactActionConfigs validates Phase 1 action target compatibility and stable ordering.
function normalizeContactActionConfigs(configs: ContactActionConfig[]): ContactActionConfig[] {
  const orders = new Set<number>()
  return configs.map((config) => {
    if (orders.has(config.displayOrder)) throw new Error('displayOrder must be unique')
    orders.add(config.displayOrder)
    if (
      ['CALL_PHONE', 'SEND_EMAIL', 'ADD_WECHAT', 'OPEN_WHATSAPP'].includes(
        config.contactActionType
      ) &&
      (config.targetRefType !== 'CONTACT_ASSET' || !config.targetRefId?.trim())
    ) {
      throw new Error(`${config.contactActionType} requires CONTACT_ASSET target`)
    }
    if (config.contactActionType === 'SAVE_VCARD' && config.targetRefType !== 'NONE') {
      throw new Error('SAVE_VCARD requires NONE target')
    }
    return {
      ...config,
      targetRefId: config.targetRefId?.trim() || null
    }
  })
}

// findResolvedValue matches a configured Contact Action to its public-safe upstream value.
function findResolvedValue(
  config: ContactActionConfig,
  values: ContactActionPublicSafeValue[]
): ContactActionPublicSafeValue | undefined {
  return values.find(
    (value) =>
      value.targetRefType === config.targetRefType && value.targetRefId === config.targetRefId
  )
}

// formatPublicUrlDisplayValue renders public URL targets with a compact, reusable display format.
function formatPublicUrlDisplayValue(value: string): string {
  const normalized = value.trim()
  try {
    const parsed = new URL(normalized)
    const path = `${parsed.pathname}${parsed.search}`.replace(/\/$/, '')
    return `${parsed.host}${path}`
  } catch {
    return normalized.replace(/^https?:\/\//i, '').replace(/\/$/, '')
  }
}

// toVCard renders the public view into a conservative vCard 3.0 payload.
function toVCard(view: PublicBusinessCardView): string {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${escapeVCard(view.person.displayName)}`]
  if (view.person.title) lines.push(`TITLE:${escapeVCard(view.person.title)}`)
  if (view.person.department) lines.push(`ORG:${escapeVCard(view.company.companyDisplayName)};${escapeVCard(view.person.department)}`)
  else if (view.company.companyDisplayName) lines.push(`ORG:${escapeVCard(view.company.companyDisplayName)}`)
  for (const action of view.contactActions) {
    if (action.contactActionType === 'CALL_PHONE' && action.displayValue) {
      lines.push(`TEL;TYPE=WORK:${escapeVCard(action.displayValue)}`)
    }
    if (action.contactActionType === 'SEND_EMAIL' && action.displayValue) {
      lines.push(`EMAIL;TYPE=WORK:${escapeVCard(action.displayValue)}`)
    }
  }
  lines.push('END:VCARD')
  return `${lines.join('\r\n')}\r\n`
}

// escapeVCard prevents separators and line breaks from corrupting the vCard payload.
function escapeVCard(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}
