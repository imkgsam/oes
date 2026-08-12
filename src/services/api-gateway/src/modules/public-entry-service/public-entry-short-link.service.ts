import {
  PublicRedirectResultType,
  ShortLinkRecord,
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
    const result = await this.adapter.createShortLink(
      {
        displayName: body.displayName,
        target: toGrpcTarget(body.target),
        entryPurpose: body.entryPurpose,
        sourcePlacement: body.sourcePlacement,
        campaignRef: body.campaignRef,
        expiresAt: body.expiresAt,
      },
      source
    )
    return { ...result, shortLink: normalizeShortLinkRecord(result.shortLink) }
  }

  async getShortLink(tenantId: string, shortLinkId: string, source: DownstreamRequestSource) {
    const result = await this.adapter.getShortLink({ shortLinkId }, source)
    return { ...result, shortLink: normalizeShortLinkRecord(result.shortLink) }
  }

  async listByTarget(
    tenantId: string,
    query: { targetType?: string; targetResourceId?: string; page?: string; pageSize?: string },
    source: DownstreamRequestSource
  ) {
    const result = await this.adapter.listShortLinksByTarget(
      {
        targetType: query.targetType ?? '',
        targetResourceId: query.targetResourceId ?? '',
        page: parsePositiveInt(query.page, 1),
        pageSize: parsePositiveInt(query.pageSize, 20)
      },
      source
    )
    return {
      ...result,
      items: (result.items ?? []).map((item) => normalizeShortLinkRecord(item))
    }
  }

  async listShortLinks(
    tenantId: string,
    query: { targetKind?: string; targetType?: string; page?: string; pageSize?: string },
    source: DownstreamRequestSource
  ) {
    const result = await this.adapter.listShortLinks(
      {
        targetKind: toGrpcOptionalTargetKind(query.targetKind),
        targetType: normalizeOptionalQuery(query.targetType),
        page: parsePositiveInt(query.page, 1),
        pageSize: parsePositiveInt(query.pageSize, 20)
      },
      source
    )
    return {
      ...result,
      items: (result.items ?? []).map((item) => normalizeShortLinkRecord(item))
    }
  }

  async updateTarget(
    tenantId: string,
    shortLinkId: string,
    body: UpdateShortLinkTargetDto,
    source: DownstreamRequestSource
  ) {
    return this.adapter.updateShortLinkTarget(
      {
        shortLinkId,
        target: toGrpcTarget(body.target),
        reason: body.reason
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
    const result = await this.adapter.updateShortLinkMetadata(
      {
        shortLinkId,
        displayName: body.displayName,
        entryPurpose: body.entryPurpose,
        sourcePlacement: body.sourcePlacement,
        campaignRef: body.campaignRef,
        expiresAt: body.expiresAt
      },
      source
    )
    return { ...result, shortLink: normalizeShortLinkRecord(result.shortLink) }
  }

  async changeStatus(
    tenantId: string,
    shortLinkId: string,
    body: ChangeShortLinkStatusDto,
    source: DownstreamRequestSource
  ) {
    return this.adapter.changeShortLinkStatus(
      {
        shortLinkId,
        targetStatus: toGrpcStatus(body.targetStatus),
        reason: body.reason
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
      { shortLinkId, from: query.from, to: query.to },
      source
    )
  }

  async generateQr(tenantId: string, shortLinkId: string, source: DownstreamRequestSource) {
    return this.adapter.generateShortLinkQr({ shortLinkId }, source)
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
        referrer: request.referrer
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

// toGrpcOptionalTargetKind maps omitted/ALL filters to the proto UNSPECIFIED value.
function toGrpcOptionalTargetKind(kind?: string): ShortLinkTargetKind | undefined {
  if (kind === 'INTERNAL_REF') return ShortLinkTargetKind.SHORT_LINK_TARGET_KIND_INTERNAL_REF
  if (kind === 'EXTERNAL_URL') return ShortLinkTargetKind.SHORT_LINK_TARGET_KIND_EXTERNAL_URL
  return undefined
}

// normalizeShortLinkRecord maps generated gRPC enums into the tenant-web BFF string contract.
function normalizeShortLinkRecord(record?: ShortLinkRecord) {
  if (!record) return record
  return {
    ...record,
    status: record.status === undefined ? undefined : fromGrpcStatus(record.status),
    targetKind: record.targetKind === undefined ? undefined : fromGrpcTargetKind(record.targetKind)
  }
}

// fromGrpcStatus maps generated enum values into stable web status strings.
function fromGrpcStatus(status?: ShortLinkStatus) {
  if (status === ShortLinkStatus.SHORT_LINK_STATUS_DISABLED) return 'DISABLED'
  if (status === ShortLinkStatus.SHORT_LINK_STATUS_ARCHIVED) return 'ARCHIVED'
  return 'ACTIVE'
}

// fromGrpcTargetKind maps generated enum values into stable web target kind strings.
function fromGrpcTargetKind(kind?: ShortLinkTargetKind) {
  return kind === ShortLinkTargetKind.SHORT_LINK_TARGET_KIND_EXTERNAL_URL
    ? 'EXTERNAL_URL'
    : 'INTERNAL_REF'
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

// normalizeOptionalQuery strips blank query filters before calling downstream contracts.
function normalizeOptionalQuery(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized || undefined
}
