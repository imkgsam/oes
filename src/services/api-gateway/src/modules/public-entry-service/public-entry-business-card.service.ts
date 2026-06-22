import {
  BusinessCardStatus,
  ContactActionTargetRefType
} from '@oes/common/generated/public_entry_service'
import { Injectable } from '@nestjs/common'
import { DownstreamRequestSource } from '../../common/grpc/gateway-downstream-source.mapper'
import { IdentityContactAssetGrpcAdapter } from './adapters/identity-contact-asset-grpc.adapter'
import { PublicEntryBusinessCardGrpcAdapter } from './adapters/public-entry-business-card-grpc.adapter'
import {
  EnsurePrimaryBusinessCardDto,
  UpdateBusinessCardConfigDto,
  UpdateBusinessCardContactActionsDto
} from './interface/http/dtos/public-entry-business-card.dto'

// PublicEntryBusinessCardService builds BFF request models for BusinessCard admin, self-view, and public render APIs.
@Injectable()
export class PublicEntryBusinessCardService {
  constructor(
    private readonly adapter: PublicEntryBusinessCardGrpcAdapter,
    private readonly contactAssetAdapter: IdentityContactAssetGrpcAdapter
  ) {}

  ensurePrimaryCard(tenantId: string, body: EnsurePrimaryBusinessCardDto, source: DownstreamRequestSource) {
    return this.adapter.ensurePrimaryBusinessCard({
      tenantId,
      employeeId: body.employeeId,
      operatorContext: toOperatorContext(source)
    }, source).then(normalizeBusinessCardResponse)
  }

  listCards(tenantId: string, query: { page?: string; pageSize?: string }, source: DownstreamRequestSource) {
    return this.adapter.listBusinessCards({
      tenantId,
      page: parsePositiveInt(query.page, 1),
      pageSize: parsePositiveInt(query.pageSize, 20),
      operatorContext: toOperatorContext(source)
    }, source).then((result) => ({
      ...result,
      items: (result.items ?? []).map(normalizeBusinessCardRecord)
    }))
  }

  getCardDetail(tenantId: string, businessCardId: string, source: DownstreamRequestSource) {
    return this.adapter.getBusinessCardDetail({
      tenantId,
      businessCardId,
      operatorContext: toOperatorContext(source)
    }, source).then(normalizeBusinessCardResponse)
  }

  updateConfig(tenantId: string, businessCardId: string, body: UpdateBusinessCardConfigDto, source: DownstreamRequestSource) {
    return this.adapter.updateBusinessCardConfig({
      tenantId,
      businessCardId,
      templateKey: body.templateKey,
      visibilityConfig: body.visibilityConfig,
      operatorContext: toOperatorContext(source)
    }, source).then(normalizeBusinessCardResponse)
  }

  updateContactActions(tenantId: string, businessCardId: string, body: UpdateBusinessCardContactActionsDto, source: DownstreamRequestSource) {
    return this.adapter.updateBusinessCardContactActions({
      tenantId,
      businessCardId,
      contactActionConfigs: body.contactActionConfigs.map((config) => ({
        ...config,
        targetRefType: toGrpcTargetRefType(config.targetRefType)
      })),
      visibilityConfig: body.visibilityConfig,
      operatorContext: toOperatorContext(source)
    }, source).then(normalizeBusinessCardResponse)
  }

  enableCard(tenantId: string, businessCardId: string, source: DownstreamRequestSource) {
    return this.adapter.enableBusinessCard({
      tenantId,
      businessCardId,
      operatorContext: toOperatorContext(source)
    }, source)
  }

  disableCard(tenantId: string, businessCardId: string, source: DownstreamRequestSource) {
    return this.adapter.disableBusinessCard({
      tenantId,
      businessCardId,
      operatorContext: toOperatorContext(source)
    }, source)
  }

  bindPublicEntry(tenantId: string, businessCardId: string, source: DownstreamRequestSource) {
    return this.adapter.bindOrRefreshBusinessCardPublicEntry({
      tenantId,
      businessCardId,
      operatorContext: toOperatorContext(source)
    }, source)
  }

  getVisitSummary(tenantId: string, businessCardId: string, query: { from?: string; to?: string }, source: DownstreamRequestSource) {
    return this.adapter.getBusinessCardVisitSummary({
      tenantId,
      businessCardId,
      from: query.from,
      to: query.to,
      operatorContext: toOperatorContext(source)
    }, source)
  }

  getOwnPreview(tenantId: string, source: DownstreamRequestSource) {
    return this.adapter.getOwnBusinessCardPreview({
      tenantId,
      accountId: source.user?.holderId || source.user?.aid || source.user?.id || source.user?.sub || '',
      traceId: source.traceId
    }, source)
  }

  listContactAssetCandidates(
    tenantId: string,
    query: { employeeId?: string },
    source: DownstreamRequestSource
  ) {
    return this.contactAssetAdapter.listContactAssetCandidatesByEmployee(
      {
        tenantId,
        employeeId: query.employeeId?.trim() || '',
        traceId: source.traceId
      },
      source
    )
  }

  renderPublicCard(businessCardId: string, source: Pick<DownstreamRequestSource, 'requestId' | 'traceId'>) {
    return this.adapter.renderPublicBusinessCard({ businessCardId, traceId: source.traceId }, source)
  }

  generateVCard(businessCardId: string, source: Pick<DownstreamRequestSource, 'requestId' | 'traceId'>) {
    return this.adapter.generateBusinessCardVCard({ businessCardId, traceId: source.traceId }, source)
  }
}

// toOperatorContext derives downstream operator context from gateway-authenticated JWT claims.
function toOperatorContext(source: DownstreamRequestSource) {
  return {
    operatorAccountId:
      source.user?.holderId || source.user?.aid || source.user?.id || source.user?.sub || '',
    operatorOrgId: source.user?.orgId,
    traceId: source.traceId
  }
}

// toGrpcTargetRefType maps BFF target ref input to generated enum values.
function toGrpcTargetRefType(value: string): ContactActionTargetRefType {
  if (value === 'TENANT_PUBLIC_PROFILE') {
    return ContactActionTargetRefType.CONTACT_ACTION_TARGET_REF_TYPE_TENANT_PUBLIC_PROFILE
  }
  if (value === 'NONE') return ContactActionTargetRefType.CONTACT_ACTION_TARGET_REF_TYPE_NONE
  return ContactActionTargetRefType.CONTACT_ACTION_TARGET_REF_TYPE_CONTACT_ASSET
}

// normalizeBusinessCardResponse restores the HTTP BFF string contract after downstream gRPC enum responses.
function normalizeBusinessCardResponse<T extends { businessCard?: Record<string, any> }>(response: T): T {
  if (!response.businessCard) return response
  return {
    ...response,
    businessCard: normalizeBusinessCardRecord(response.businessCard)
  }
}

// normalizeBusinessCardRecord converts nested BusinessCard enum fields to the web-facing BFF strings.
function normalizeBusinessCardRecord<T extends Record<string, any>>(record: T): T {
  return {
    ...record,
    contactActionConfigs: (record.contactActionConfigs ?? []).map(normalizeContactActionConfig)
  }
}

// normalizeContactActionConfig keeps Contact Action references as strings for tenant-web editors.
function normalizeContactActionConfig<T extends Record<string, any>>(config: T): T {
  return {
    ...config,
    targetRefType: fromGrpcTargetRefType(config.targetRefType)
  }
}

// fromGrpcTargetRefType maps generated enum values or already-normalized strings onto the BFF contract.
function fromGrpcTargetRefType(value: unknown): 'CONTACT_ASSET' | 'NONE' | 'TENANT_PUBLIC_PROFILE' {
  if (value === 'TENANT_PUBLIC_PROFILE') return 'TENANT_PUBLIC_PROFILE'
  if (value === 'NONE') return 'NONE'
  if (value === ContactActionTargetRefType.CONTACT_ACTION_TARGET_REF_TYPE_TENANT_PUBLIC_PROFILE) {
    return 'TENANT_PUBLIC_PROFILE'
  }
  if (value === ContactActionTargetRefType.CONTACT_ACTION_TARGET_REF_TYPE_NONE) return 'NONE'
  return 'CONTACT_ASSET'
}

// parsePositiveInt normalizes pagination query values.
function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}
