import { Controller } from '@nestjs/common'
import {
  BusinessCardPublicEntryRefRecord,
  BusinessCardRecord as GrpcBusinessCardRecord,
  BusinessCardStatus as GrpcBusinessCardStatus,
  EnableBusinessCardRequest,
  EnableBusinessCardResponse,
  DisableBusinessCardRequest,
  DisableBusinessCardResponse,
  ContactActionConfigRecord,
  ContactActionTargetRefType,
  EnsurePrimaryBusinessCardRequest,
  GenerateBusinessCardVCardResponse,
  GetBusinessCardDetailRequest,
  GetBusinessCardVisitSummaryRequest,
  GetOwnBusinessCardPreviewRequest,
  RunBusinessCardReadinessCheckRequest,
  BindOrRefreshBusinessCardPublicEntryRequest,
  ListBusinessCardsRequest,
  ListBusinessCardsResponse,
  OperatorContext as GrpcOperatorContext,
  GetOwnBusinessCardPreviewResponse,
  PublicEntryBusinessCardServiceController,
  PublicEntryBusinessCardServiceControllerMethods,
  RenderPublicBusinessCardRequest,
  RenderPublicBusinessCardResponse,
  GenerateBusinessCardVCardRequest,
  ShortLinkStatus as GrpcShortLinkStatus,
  BusinessCardVisibilityConfigRecord as GrpcBusinessCardVisibilityConfigRecord,
  UpdateBusinessCardConfigRequest,
  UpdateBusinessCardContactActionsRequest
} from '@oes/common/generated/public_entry_service'
import { BusinessCardApplicationService } from '../../application/services/business-card-application.service'
import {
  BusinessCardSummary,
  BusinessCardStatus,
  ContactActionConfig,
  ContactActionTargetRefType as DomainContactActionTargetRefType,
  OperatorContext,
  PublicEntryRef,
  PublicRenderResult,
  SerializedPublicEntryRef,
  VisibilityConfig
} from '../../domain/types/business-card.types'

// PublicEntryBusinessCardGrpcController maps BusinessCard gRPC calls onto application services.
@Controller()
@PublicEntryBusinessCardServiceControllerMethods()
export class PublicEntryBusinessCardGrpcController
  implements PublicEntryBusinessCardServiceController
{
  constructor(private readonly service: BusinessCardApplicationService) {}

  async ensurePrimaryBusinessCard(request: EnsurePrimaryBusinessCardRequest) {
    const result = await this.service.ensurePrimaryCard({
      tenantId: request.tenantId ?? '',
      employeeId: request.employeeId ?? '',
      operatorContext: fromGrpcOperatorContext(request.operatorContext)
    })
    return { businessCard: toGrpcBusinessCard(result.businessCard) }
  }

  async listBusinessCards(request: ListBusinessCardsRequest): Promise<ListBusinessCardsResponse> {
    const result = await this.service.listCards({
      tenantId: request.tenantId ?? '',
      page: request.page,
      pageSize: request.pageSize,
      operatorContext: fromGrpcOperatorContext(request.operatorContext)
    })
    return {
      items: result.items.map((item) => toGrpcBusinessCard(item)),
      page: result.page,
      pageSize: result.pageSize,
      total: result.total
    }
  }

  async getBusinessCardDetail(request: GetBusinessCardDetailRequest) {
    const result = await this.service.getCardDetail({
      tenantId: request.tenantId ?? '',
      businessCardId: request.businessCardId ?? '',
      operatorContext: fromGrpcOperatorContext(request.operatorContext)
    })
    return {
      businessCard: toGrpcBusinessCard(result.businessCard),
      readiness: result.readiness
    }
  }

  async updateBusinessCardConfig(request: UpdateBusinessCardConfigRequest) {
    const result = await this.service.updateCardConfig({
      tenantId: request.tenantId ?? '',
      businessCardId: request.businessCardId ?? '',
      templateKey: request.templateKey,
      visibilityConfig: request.visibilityConfig
        ? fromGrpcVisibilityConfig(request.visibilityConfig)
        : undefined,
      operatorContext: fromGrpcOperatorContext(request.operatorContext)
    })
    return { businessCard: toGrpcBusinessCard(result.businessCard) }
  }

  async updateBusinessCardContactActions(request: UpdateBusinessCardContactActionsRequest) {
    const result = await this.service.updateContactActions({
      tenantId: request.tenantId ?? '',
      businessCardId: request.businessCardId ?? '',
      contactActionConfigs: (request.contactActionConfigs ?? []).map(fromGrpcContactActionConfig),
      visibilityConfig: request.visibilityConfig
        ? fromGrpcVisibilityConfig(request.visibilityConfig)
        : undefined,
      operatorContext: fromGrpcOperatorContext(request.operatorContext)
    })
    return { businessCard: toGrpcBusinessCard(result.businessCard) }
  }

  async enableBusinessCard(
    request: EnableBusinessCardRequest
  ): Promise<EnableBusinessCardResponse> {
    const result = await this.service.enableCard({
      tenantId: request.tenantId ?? '',
      businessCardId: request.businessCardId ?? '',
      operatorContext: fromGrpcOperatorContext(request.operatorContext)
    })
    return toGrpcChangeStatusResponse(result)
  }

  async disableBusinessCard(
    request: DisableBusinessCardRequest
  ): Promise<DisableBusinessCardResponse> {
    const result = await this.service.disableCard({
      tenantId: request.tenantId ?? '',
      businessCardId: request.businessCardId ?? '',
      operatorContext: fromGrpcOperatorContext(request.operatorContext)
    })
    return toGrpcChangeStatusResponse(result)
  }

  async runBusinessCardReadinessCheck(request: RunBusinessCardReadinessCheckRequest) {
    return this.service.runReadinessCheck({
      tenantId: request.tenantId ?? '',
      businessCardId: request.businessCardId ?? '',
      operatorContext: fromGrpcOperatorContext(request.operatorContext)
    })
  }

  async bindOrRefreshBusinessCardPublicEntry(request: BindOrRefreshBusinessCardPublicEntryRequest) {
    const result = await this.service.bindOrRefreshMainPublicEntry({
      tenantId: request.tenantId ?? '',
      businessCardId: request.businessCardId ?? '',
      operatorContext: fromGrpcOperatorContext(request.operatorContext)
    })
    return { publicEntryRef: toGrpcPublicEntryRef(result.publicEntryRef) }
  }

  async getBusinessCardVisitSummary(request: GetBusinessCardVisitSummaryRequest) {
    const result = await this.service.getVisitSummary({
      tenantId: request.tenantId ?? '',
      businessCardId: request.businessCardId ?? '',
      from: request.from,
      to: request.to,
      operatorContext: fromGrpcOperatorContext(request.operatorContext)
    })
    return {
      shortLinkId: result.shortLinkId,
      totalVisits: result.totalVisits,
      byResultStatus: toBuckets(result.byResultStatus),
      byDetectedChannel: toBuckets(result.byDetectedChannel),
      byDeviceType: toBuckets(result.byDeviceType),
      byReferrer: toBuckets(result.byReferrer),
      lastVisitedAt: result.lastVisitedAt ?? ''
    }
  }

  async getOwnBusinessCardPreview(
    request: GetOwnBusinessCardPreviewRequest
  ): Promise<GetOwnBusinessCardPreviewResponse> {
    const result = await this.service.getOwnCardPreview({
      tenantId: request.tenantId ?? '',
      accountId: request.accountId ?? '',
      traceId: request.traceId
    })
    return {
      businessCardId: result.businessCardId,
      employeeId: result.employeeId,
      status: toGrpcBusinessCardStatus(result.status),
      publicEntryRef: result.publicEntryRef
        ? toGrpcPublicEntryRef(result.publicEntryRef)
        : undefined,
      enabledActions: result.enabledActions,
      preview: toGrpcPublicRenderResult(result.preview)
    }
  }

  async renderPublicBusinessCard(
    request: RenderPublicBusinessCardRequest
  ): Promise<RenderPublicBusinessCardResponse> {
    const result = request.tenantId
      ? await this.service.renderPublicCard({
          tenantId: request.tenantId,
          businessCardId: request.businessCardId ?? '',
          traceId: request.traceId
        })
      : await this.service.renderPublicCardById({
          businessCardId: request.businessCardId ?? '',
          traceId: request.traceId
        })
    return toGrpcPublicRenderResult(result)
  }

  async generateBusinessCardVCard(
    request: GenerateBusinessCardVCardRequest
  ): Promise<GenerateBusinessCardVCardResponse> {
    return this.service.generateVCard({
      tenantId: request.tenantId ?? '',
      businessCardId: request.businessCardId ?? '',
      traceId: request.traceId
    })
  }
}

// toGrpcBusinessCardStatus converts domain BusinessCard status into generated enum values.
export function toGrpcBusinessCardStatus(status: BusinessCardStatus): GrpcBusinessCardStatus {
  return {
    DRAFT: GrpcBusinessCardStatus.BUSINESS_CARD_STATUS_DRAFT,
    ACTIVE: GrpcBusinessCardStatus.BUSINESS_CARD_STATUS_ACTIVE,
    DISABLED: GrpcBusinessCardStatus.BUSINESS_CARD_STATUS_DISABLED,
    ARCHIVED: GrpcBusinessCardStatus.BUSINESS_CARD_STATUS_ARCHIVED
  }[status]
}

// fromGrpcOperatorContext maps generated operator context into the application shape.
function fromGrpcOperatorContext(context?: GrpcOperatorContext): OperatorContext {
  return {
    operatorAccountId: context?.operatorAccountId ?? '',
    operatorOrgId: context?.operatorOrgId || undefined,
    traceId: context?.traceId || undefined
  }
}

// toGrpcBusinessCard maps application BusinessCard summaries into generated records.
function toGrpcBusinessCard(record: BusinessCardSummary): GrpcBusinessCardRecord {
  return {
    businessCardId: record.businessCardId,
    tenantId: record.tenantId,
    employeeId: record.employeeId,
    status: toGrpcBusinessCardStatus(record.status),
    templateKey: record.templateKey,
    publicEntryRef: record.publicEntryRef
      ? toGrpcPublicEntryRef(record.publicEntryRef)
      : undefined,
    contactActionConfigs: record.contactActionConfigs.map(toGrpcContactActionConfig),
    visibilityConfig: record.visibilityConfig,
    updatedAt: record.updatedAt
  }
}

// toGrpcContactActionConfig maps domain action configuration into generated records.
function toGrpcContactActionConfig(config: ContactActionConfig): ContactActionConfigRecord {
  return {
    contactActionType: config.contactActionType,
    targetRefType: toGrpcTargetRefType(config.targetRefType),
    targetRefId: config.targetRefId ?? '',
    visibility: config.visibility,
    displayOrder: config.displayOrder,
    enabled: config.enabled,
    includeInVCard: config.includeInVCard
  }
}

// fromGrpcContactActionConfig maps generated action configuration into domain records.
function fromGrpcContactActionConfig(config: ContactActionConfigRecord): ContactActionConfig {
  return {
    contactActionType: config.contactActionType as ContactActionConfig['contactActionType'],
    targetRefType: fromGrpcTargetRefType(config.targetRefType),
    targetRefId: config.targetRefId || null,
    visibility: config.visibility === 'HIDDEN' ? 'HIDDEN' : 'PUBLIC',
    displayOrder: config.displayOrder ?? 0,
    enabled: Boolean(config.enabled),
    includeInVCard: Boolean(config.includeInVCard)
  }
}

// toGrpcTargetRefType converts target ref type strings into generated enum values.
function toGrpcTargetRefType(type: DomainContactActionTargetRefType): ContactActionTargetRefType {
  return {
    CONTACT_ASSET: ContactActionTargetRefType.CONTACT_ACTION_TARGET_REF_TYPE_CONTACT_ASSET,
    TENANT_PUBLIC_PROFILE:
      ContactActionTargetRefType.CONTACT_ACTION_TARGET_REF_TYPE_TENANT_PUBLIC_PROFILE,
    NONE: ContactActionTargetRefType.CONTACT_ACTION_TARGET_REF_TYPE_NONE
  }[type]
}

// fromGrpcTargetRefType converts generated target ref enum values into domain strings.
function fromGrpcTargetRefType(type?: ContactActionTargetRefType): DomainContactActionTargetRefType {
  if (type === ContactActionTargetRefType.CONTACT_ACTION_TARGET_REF_TYPE_TENANT_PUBLIC_PROFILE) {
    return 'TENANT_PUBLIC_PROFILE'
  }
  if (type === ContactActionTargetRefType.CONTACT_ACTION_TARGET_REF_TYPE_NONE) return 'NONE'
  return 'CONTACT_ASSET'
}

// fromGrpcVisibilityConfig maps generated visibility switches into domain records.
function fromGrpcVisibilityConfig(config: GrpcBusinessCardVisibilityConfigRecord): VisibilityConfig {
  return {
    showTitle: Boolean(config.showTitle),
    showDepartment: Boolean(config.showDepartment),
    showCompany: Boolean(config.showCompany),
    showOfficialPhoto: Boolean(config.showOfficialPhoto)
  }
}

// toGrpcPublicEntryRef maps a ShortLink reference into generated records.
function toGrpcPublicEntryRef(
  ref: PublicEntryRef | SerializedPublicEntryRef
): BusinessCardPublicEntryRefRecord {
  const expiresAt =
    typeof ref.expiresAt === 'string' ? ref.expiresAt : ref.expiresAt?.toISOString() ?? ''
  return {
    publicEntryId: ref.publicEntryId,
    shortCode: ref.shortCode,
    publicUrl: ref.publicUrl,
    qrContent: ref.qrContent,
    status:
      ref.status === 'DISABLED'
        ? GrpcShortLinkStatus.SHORT_LINK_STATUS_DISABLED
        : ref.status === 'ARCHIVED'
          ? GrpcShortLinkStatus.SHORT_LINK_STATUS_ARCHIVED
          : GrpcShortLinkStatus.SHORT_LINK_STATUS_ACTIVE,
    expiresAt
  }
}

// toBuckets converts service aggregate maps into generated CountBucket records.
function toBuckets(values: Record<string, number>) {
  return Object.entries(values).map(([key, count]) => ({ key, count }))
}

// toGrpcPublicRenderResult maps public card rendering into generated records.
function toGrpcPublicRenderResult(result: PublicRenderResult): RenderPublicBusinessCardResponse {
  if (result.state !== 'AVAILABLE') return { state: result.state }
  return {
    state: result.state,
    view: {
      businessCardId: result.view.businessCardId,
      publicUrl: result.view.publicUrl ?? '',
      templateKey: result.view.templateKey,
      person: {
        displayName: result.view.person.displayName,
        englishName: result.view.person.englishName ?? '',
        title: result.view.person.title ?? '',
        department: result.view.person.department ?? '',
        officialPhotoUrl: result.view.person.officialPhotoUrl ?? ''
      },
      company: {
        companyDisplayName: result.view.company.companyDisplayName,
        websiteUrl: result.view.company.websiteUrl ?? '',
        logoUrl: result.view.company.logoUrl ?? ''
      },
      contactActions: result.view.contactActions.map((action) => ({
        contactActionType: action.contactActionType,
        displayOrder: action.displayOrder,
        displayValue: action.displayValue ?? '',
        actionUrl: action.actionUrl ?? ''
      }))
    }
  }
}

// toGrpcChangeStatusResponse maps status transition output into generated records.
function toGrpcChangeStatusResponse(result: {
  businessCardId: string
  previousStatus: BusinessCardStatus
  status: BusinessCardStatus
}): EnableBusinessCardResponse | DisableBusinessCardResponse {
  return {
    businessCardId: result.businessCardId,
    previousStatus: toGrpcBusinessCardStatus(result.previousStatus),
    status: toGrpcBusinessCardStatus(result.status)
  }
}
