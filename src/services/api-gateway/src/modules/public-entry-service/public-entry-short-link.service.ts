import {
  PublicRedirectResultType,
  ShortLinkStatus,
  ShortLinkTargetKind
} from '@oes/common/generated/public_entry_service'
import { Injectable } from '@nestjs/common'
import { DownstreamRequestSource } from '../../common/grpc/gateway-downstream-source.mapper'
import { PublicEntryShortLinkGrpcAdapter } from './adapters/public-entry-short-link-grpc.adapter'
import {
  ChangeShortLinkStatusDto,
  CreateShortLinkDto,
  ShortLinkTargetDto,
  UpdateShortLinkMetadataDto,
  UpdateShortLinkTargetDto
} from './interface/http/dtos/public-entry-short-link.dto'

// PublicEntryShortLinkService builds tenant-web BFF models on top of public-entry-service RPCs.
@Injectable()
export class PublicEntryShortLinkService {
  constructor(private readonly adapter: PublicEntryShortLinkGrpcAdapter) {}

  async createShortLink(
    tenantId: string,
    body: CreateShortLinkDto,
    source: DownstreamRequestSource
  ) {
    return this.adapter.createShortLink(
      {
        tenantId,
        displayName: body.displayName,
        target: toGrpcTarget(body.target),
        entryPurpose: body.entryPurpose,
        sourcePlacement: body.sourcePlacement,
        campaignRef: body.campaignRef,
        expiresAt: body.expiresAt,
        operatorContext: toOperatorContext(source)
      },
      source
    )
  }

  async getShortLink(tenantId: string, shortLinkId: string, source: DownstreamRequestSource) {
    return this.adapter.getShortLink({ tenantId, shortLinkId }, source)
  }

  async listByTarget(
    tenantId: string,
    query: { targetType?: string; targetResourceId?: string; page?: string; pageSize?: string },
    source: DownstreamRequestSource
  ) {
    return this.adapter.listShortLinksByTarget(
      {
        tenantId,
        targetType: query.targetType ?? '',
        targetResourceId: query.targetResourceId ?? '',
        page: parsePositiveInt(query.page, 1),
        pageSize: parsePositiveInt(query.pageSize, 20)
      },
      source
    )
  }

  async updateTarget(
    tenantId: string,
    shortLinkId: string,
    body: UpdateShortLinkTargetDto,
    source: DownstreamRequestSource
  ) {
    return this.adapter.updateShortLinkTarget(
      {
        tenantId,
        shortLinkId,
        target: toGrpcTarget(body.target),
        reason: body.reason,
        operatorContext: toOperatorContext(source)
      },
      source
    )
  }

  async updateMetadata(
    tenantId: string,
    shortLinkId: string,
    body: UpdateShortLinkMetadataDto,
    source: DownstreamRequestSource
  ) {
    return this.adapter.updateShortLinkMetadata(
      {
        tenantId,
        shortLinkId,
        displayName: body.displayName,
        entryPurpose: body.entryPurpose,
        sourcePlacement: body.sourcePlacement,
        campaignRef: body.campaignRef,
        expiresAt: body.expiresAt,
        operatorContext: toOperatorContext(source)
      },
      source
    )
  }

  async changeStatus(
    tenantId: string,
    shortLinkId: string,
    body: ChangeShortLinkStatusDto,
    source: DownstreamRequestSource
  ) {
    return this.adapter.changeShortLinkStatus(
      {
        tenantId,
        shortLinkId,
        targetStatus: toGrpcStatus(body.targetStatus),
        reason: body.reason,
        operatorContext: toOperatorContext(source)
      },
      source
    )
  }

  async getStats(
    tenantId: string,
    shortLinkId: string,
    query: { from?: string; to?: string },
    source: DownstreamRequestSource
  ) {
    return this.adapter.getShortLinkStats(
      { tenantId, shortLinkId, from: query.from, to: query.to },
      source
    )
  }

  async generateQr(tenantId: string, shortLinkId: string, source: DownstreamRequestSource) {
    return this.adapter.generateShortLinkQr({ tenantId, shortLinkId }, source)
  }

  async resolvePublicRedirect(
    shortCode: string,
    request: {
      userAgent?: string
      ipAddress?: string
      acceptLanguage?: string
      referrer?: string
      requestId?: string
      traceId?: string
    }
  ) {
    const result = await this.adapter.resolvePublicRedirect(
      {
        shortCode,
        userAgent: request.userAgent,
        ipAddress: request.ipAddress,
        acceptLanguage: request.acceptLanguage,
        referrer: request.referrer,
        traceId: request.traceId
      },
      { requestId: request.requestId, traceId: request.traceId }
    )
    return {
      type:
        result.resultType === PublicRedirectResultType.PUBLIC_REDIRECT_RESULT_TYPE_REDIRECT
          ? 'REDIRECT'
          : result.resultType === PublicRedirectResultType.PUBLIC_REDIRECT_RESULT_TYPE_NOT_FOUND
            ? 'NOT_FOUND'
            : 'UNAVAILABLE',
      location: result.location ?? ''
    }
  }
}

// toGrpcTarget maps BFF target input into public-entry-service generated target input.
function toGrpcTarget(target: ShortLinkTargetDto) {
  return {
    targetKind:
      target.targetKind === 'INTERNAL_REF'
        ? ShortLinkTargetKind.SHORT_LINK_TARGET_KIND_INTERNAL_REF
        : ShortLinkTargetKind.SHORT_LINK_TARGET_KIND_EXTERNAL_URL,
    targetType: target.targetType,
    targetResourceId: target.targetResourceId,
    targetUrl: target.targetUrl
  }
}

// toGrpcStatus maps admin status strings to generated enum values.
function toGrpcStatus(status: 'ACTIVE' | 'DISABLED' | 'ARCHIVED'): ShortLinkStatus {
  return {
    ACTIVE: ShortLinkStatus.SHORT_LINK_STATUS_ACTIVE,
    DISABLED: ShortLinkStatus.SHORT_LINK_STATUS_DISABLED,
    ARCHIVED: ShortLinkStatus.SHORT_LINK_STATUS_ARCHIVED
  }[status]
}

// toOperatorContext derives the downstream operator context from gateway-authenticated JWT claims.
function toOperatorContext(source: DownstreamRequestSource) {
  return {
    operatorAccountId:
      source.user?.holderId || source.user?.aid || source.user?.id || source.user?.sub || '',
    operatorOrgId: source.user?.orgId,
    traceId: source.traceId
  }
}

// parsePositiveInt normalizes pagination query values.
function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}
