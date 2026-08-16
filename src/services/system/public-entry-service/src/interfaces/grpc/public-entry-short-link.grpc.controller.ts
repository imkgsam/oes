import {
  ChangeShortLinkStatusRequest,
  ChangeShortLinkStatusResponse,
  CreateShortLinkRequest,
  CreateShortLinkResponse,
  GenerateShortLinkQrRequest,
  GenerateShortLinkQrResponse,
  GetShortLinkRequest,
  GetShortLinkResponse,
  GetShortLinkStatsRequest,
  GetShortLinkStatsResponse,
  ListShortLinksRequest,
  ListShortLinksResponse,
  ListShortLinksByTargetRequest,
  ListShortLinksByTargetResponse,
  PublicEntryShortLinkServiceController,
  PublicEntryShortLinkServiceControllerMethods,
  PublicRedirectResultType,
  ResolvePublicRedirectRequest,
  ResolvePublicRedirectResponse,
  ShortLinkRecord as GrpcShortLinkRecord,
  ShortLinkStatus as GrpcShortLinkStatus,
  ShortLinkTargetInput,
  ShortLinkTargetKind as GrpcShortLinkTargetKind,
  UpdateShortLinkMetadataRequest,
  UpdateShortLinkMetadataResponse,
  UpdateShortLinkTargetRequest,
  UpdateShortLinkTargetResponse
} from '@oes/common/generated/public_entry_service'
import { Controller, UseGuards } from '@nestjs/common'
import {
  AuthorizeBusinessRpc,
  getAuthenticatedGrpcRequestContext,
  TrustedExecutionGuard
} from '@oes/common/authorization'
import { ShortLinkApplicationService } from '../../application/services/short-link-application.service'
import { PublicRedirectService } from '../../application/services/public-redirect.service'
import {
  OperatorContext,
  ShortLinkRecord,
  ShortLinkStatus,
  ShortLinkTarget
} from '../../domain/types/short-link.types'

// PublicEntryShortLinkGrpcController maps public-entry gRPC contract calls to ShortLink application services.
@Controller()
@UseGuards(TrustedExecutionGuard)
@PublicEntryShortLinkServiceControllerMethods()
export class PublicEntryShortLinkGrpcController implements PublicEntryShortLinkServiceController {
  constructor(
    private readonly shortLinkService: ShortLinkApplicationService,
    private readonly redirectService: PublicRedirectService
  ) {}

  async createShortLink(request: CreateShortLinkRequest): Promise<CreateShortLinkResponse> {
    const result = await this.shortLinkService.createShortLink({
      tenantId: tenantFrom(request),
      displayName: request.displayName ?? '',
      target: fromGrpcTarget(request.target),
      entryPurpose: request.entryPurpose ?? '',
      sourcePlacement: request.sourcePlacement ?? '',
      campaignRef: request.campaignRef,
      expiresAt: request.expiresAt,
      operatorContext: operatorFrom(request)
    })
    return { shortLink: toGrpcShortLink(result.shortLink) }
  }

  async getShortLink(request: GetShortLinkRequest): Promise<GetShortLinkResponse> {
    const result = await this.shortLinkService.getShortLink({
      tenantId: tenantFrom(request),
      shortLinkId: request.shortLinkId ?? ''
    })
    return { shortLink: toGrpcShortLink(result.shortLink) }
  }

  async listShortLinks(request: ListShortLinksRequest): Promise<ListShortLinksResponse> {
    const result = await this.shortLinkService.listShortLinks({
      tenantId: tenantFrom(request),
      targetKind: fromGrpcOptionalTargetKind(request.targetKind),
      targetType: request.targetType,
      page: request.page,
      pageSize: request.pageSize
    })
    return {
      items: result.items.map((item) => toGrpcShortLink(item)),
      page: result.page,
      pageSize: result.pageSize,
      total: result.total
    }
  }

  async listShortLinksByTarget(
    request: ListShortLinksByTargetRequest
  ): Promise<ListShortLinksByTargetResponse> {
    const result = await this.shortLinkService.listByTarget({
      tenantId: tenantFrom(request),
      targetType: request.targetType ?? '',
      targetResourceId: request.targetResourceId ?? '',
      page: request.page,
      pageSize: request.pageSize
    })
    return {
      items: result.items.map((item) => toGrpcShortLink(item)),
      page: result.page,
      pageSize: result.pageSize,
      total: result.total
    }
  }

  async updateShortLinkTarget(
    request: UpdateShortLinkTargetRequest
  ): Promise<UpdateShortLinkTargetResponse> {
    const result = await this.shortLinkService.updateTarget({
      tenantId: tenantFrom(request),
      shortLinkId: request.shortLinkId ?? '',
      target: fromGrpcTarget(request.target),
      reason: request.reason,
      operatorContext: operatorFrom(request)
    })
    return {
      shortLinkId: result.shortLinkId,
      publicUrl: result.publicUrl,
      previousTarget: toGrpcTarget(result.previousTarget),
      target: toGrpcTarget(result.target),
      updatedAt: result.updatedAt
    }
  }

  async updateShortLinkMetadata(
    request: UpdateShortLinkMetadataRequest
  ): Promise<UpdateShortLinkMetadataResponse> {
    const result = await this.shortLinkService.updateMetadata({
      tenantId: tenantFrom(request),
      shortLinkId: request.shortLinkId ?? '',
      displayName: request.displayName,
      entryPurpose: request.entryPurpose,
      sourcePlacement: request.sourcePlacement,
      campaignRef: request.campaignRef,
      expiresAt: request.expiresAt,
      operatorContext: operatorFrom(request)
    })
    return { shortLink: toGrpcShortLink(result.shortLink) }
  }

  async changeShortLinkStatus(
    request: ChangeShortLinkStatusRequest
  ): Promise<ChangeShortLinkStatusResponse> {
    if (
      request.targetStatus !== GrpcShortLinkStatus.SHORT_LINK_STATUS_ACTIVE &&
      request.targetStatus !== GrpcShortLinkStatus.SHORT_LINK_STATUS_DISABLED &&
      request.targetStatus !== GrpcShortLinkStatus.SHORT_LINK_STATUS_ARCHIVED
    ) {
      throw new Error('ShortLink target status is invalid')
    }
    assertStatusPermission(request, request.targetStatus)
    const result = await this.shortLinkService.changeStatus({
      tenantId: tenantFrom(request),
      shortLinkId: request.shortLinkId ?? '',
      targetStatus: fromGrpcShortLinkStatus(request.targetStatus),
      reason: request.reason,
      operatorContext: operatorFrom(request)
    })
    return {
      shortLinkId: result.shortLinkId,
      previousStatus: toGrpcShortLinkStatus(result.previousStatus),
      status: toGrpcShortLinkStatus(result.status),
      changedAt: result.changedAt
    }
  }

  async getShortLinkStats(request: GetShortLinkStatsRequest): Promise<GetShortLinkStatsResponse> {
    const result = await this.shortLinkService.getStats({
      tenantId: tenantFrom(request),
      shortLinkId: request.shortLinkId ?? '',
      from: request.from,
      to: request.to
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

  async generateShortLinkQr(
    request: GenerateShortLinkQrRequest
  ): Promise<GenerateShortLinkQrResponse> {
    return this.shortLinkService.generateQr({
      tenantId: tenantFrom(request),
      shortLinkId: request.shortLinkId ?? ''
    })
  }

  async resolvePublicRedirect(
    request: ResolvePublicRedirectRequest
  ): Promise<ResolvePublicRedirectResponse> {
    const result = await this.redirectService.resolveVisit({
      shortCode: request.shortCode ?? '',
      requestContext: {
        userAgent: request.userAgent,
        ipAddress: request.ipAddress,
        acceptLanguage: request.acceptLanguage,
        referrer: request.referrer,
        traceId: traceFrom(request)
      }
    })
    if (result.type === 'REDIRECT') {
      return {
        resultType: PublicRedirectResultType.PUBLIC_REDIRECT_RESULT_TYPE_REDIRECT,
        location: result.location
      }
    }
    return {
      resultType:
        result.type === 'NOT_FOUND'
          ? PublicRedirectResultType.PUBLIC_REDIRECT_RESULT_TYPE_NOT_FOUND
          : PublicRedirectResultType.PUBLIC_REDIRECT_RESULT_TYPE_UNAVAILABLE,
      location: ''
    }
  }
}

function tenantFrom(request: object): string {
  const tenantId = getAuthenticatedGrpcRequestContext(request)?.verifiedExecutionToken?.tenantId
  if (!tenantId) throw new Error('Trusted tenant context is required')
  return tenantId
}

function operatorFrom(request: object): OperatorContext {
  const context = getAuthenticatedGrpcRequestContext(request) as
    | (ReturnType<typeof getAuthenticatedGrpcRequestContext> & { traceId?: string })
    | undefined
  const token = context?.verifiedExecutionToken
  if (!token?.subject) throw new Error('Trusted operator context is required')
  return { operatorAccountId: token.subject, operatorOrgId: token.orgId, traceId: context?.traceId }
}

function traceFrom(request: object): string | undefined {
  return (
    getAuthenticatedGrpcRequestContext(request) as
      | (ReturnType<typeof getAuthenticatedGrpcRequestContext> & { traceId?: string })
      | undefined
  )?.traceId
}

/** Installs the frozen one-mode Public Entry declarations without exposing legacy request authority. */
const shortLinkBusinessDeclarations: Readonly<Record<string, string>> = Object.freeze({
  createShortLink: 'public-entry.short-link.create',
  getShortLink: 'public-entry.short-link.read',
  listShortLinks: 'public-entry.short-link.read',
  listShortLinksByTarget: 'public-entry.short-link.read',
  updateShortLinkTarget: 'public-entry.short-link.update',
  updateShortLinkMetadata: 'public-entry.short-link.update',
  getShortLinkStats: 'public-entry.short-link.stats.read',
  generateShortLinkQr: 'public-entry.short-link.read'
})
for (const [method, code] of Object.entries(shortLinkBusinessDeclarations)) {
  AuthorizeBusinessRpc({ all: [code] }, { principalType: 'HUMAN', sessionTerminals: ['WEB'] })(
    PublicEntryShortLinkGrpcController.prototype,
    method,
    Object.getOwnPropertyDescriptor(PublicEntryShortLinkGrpcController.prototype, method)!
  )
}
AuthorizeBusinessRpc(
  {
    any: [
      'public-entry.short-link.update',
      'public-entry.short-link.disable',
      'public-entry.short-link.archive'
    ]
  },
  { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
)(
  PublicEntryShortLinkGrpcController.prototype,
  'changeShortLinkStatus',
  Object.getOwnPropertyDescriptor(
    PublicEntryShortLinkGrpcController.prototype,
    'changeShortLinkStatus'
  )!
)

/** Enforces the second-stage target-status-to-Code binding after Guard admission. */
export function assertStatusPermission(request: object, status: GrpcShortLinkStatus): void {
  const expected = {
    [GrpcShortLinkStatus.SHORT_LINK_STATUS_ACTIVE]: 'public-entry.short-link.update',
    [GrpcShortLinkStatus.SHORT_LINK_STATUS_DISABLED]: 'public-entry.short-link.disable',
    [GrpcShortLinkStatus.SHORT_LINK_STATUS_ARCHIVED]: 'public-entry.short-link.archive'
  }[status]
  const codes =
    getAuthenticatedGrpcRequestContext(request)?.verifiedExecutionToken?.permissionCodes ?? []
  if (!expected || codes.length !== 1 || codes[0] !== expected) {
    throw new Error('ShortLink status permission mismatch')
  }
}
AuthorizeBusinessRpc({ all: ['public-entry.short-link.read'] }, { principalType: 'MACHINE' })(
  PublicEntryShortLinkGrpcController.prototype,
  'resolvePublicRedirect',
  Object.getOwnPropertyDescriptor(
    PublicEntryShortLinkGrpcController.prototype,
    'resolvePublicRedirect'
  )!
)

// toGrpcShortLinkStatus converts domain status strings to generated enum values.
export function toGrpcShortLinkStatus(status: ShortLinkStatus): GrpcShortLinkStatus {
  return {
    ACTIVE: GrpcShortLinkStatus.SHORT_LINK_STATUS_ACTIVE,
    DISABLED: GrpcShortLinkStatus.SHORT_LINK_STATUS_DISABLED,
    ARCHIVED: GrpcShortLinkStatus.SHORT_LINK_STATUS_ARCHIVED
  }[status]
}

// fromGrpcShortLinkStatus converts generated enum values to domain status strings.
export function fromGrpcShortLinkStatus(status?: GrpcShortLinkStatus): ShortLinkStatus {
  if (status === GrpcShortLinkStatus.SHORT_LINK_STATUS_DISABLED) return 'DISABLED'
  if (status === GrpcShortLinkStatus.SHORT_LINK_STATUS_ARCHIVED) return 'ARCHIVED'
  return 'ACTIVE'
}

// toGrpcShortLinkTargetKind converts domain target kinds to generated enum values.
export function toGrpcShortLinkTargetKind(
  kind: ShortLinkTarget['targetKind']
): GrpcShortLinkTargetKind {
  return kind === 'INTERNAL_REF'
    ? GrpcShortLinkTargetKind.SHORT_LINK_TARGET_KIND_INTERNAL_REF
    : GrpcShortLinkTargetKind.SHORT_LINK_TARGET_KIND_EXTERNAL_URL
}

// fromGrpcOptionalTargetKind treats UNSPECIFIED as an omitted list filter.
function fromGrpcOptionalTargetKind(
  kind?: GrpcShortLinkTargetKind
): ShortLinkTarget['targetKind'] | undefined {
  if (kind === GrpcShortLinkTargetKind.SHORT_LINK_TARGET_KIND_INTERNAL_REF) return 'INTERNAL_REF'
  if (kind === GrpcShortLinkTargetKind.SHORT_LINK_TARGET_KIND_EXTERNAL_URL) return 'EXTERNAL_URL'
  return undefined
}

// fromGrpcTarget converts generated target input into the domain target union.
export function fromGrpcTarget(target?: ShortLinkTargetInput): ShortLinkTarget {
  if (target?.targetKind === GrpcShortLinkTargetKind.SHORT_LINK_TARGET_KIND_INTERNAL_REF) {
    return {
      targetKind: 'INTERNAL_REF',
      targetType: target.targetType ?? '',
      targetResourceId: target.targetResourceId ?? ''
    }
  }
  return {
    targetKind: 'EXTERNAL_URL',
    targetUrl: target?.targetUrl ?? ''
  }
}

// toGrpcTarget converts a domain target union into generated target input.
export function toGrpcTarget(target: ShortLinkTarget): ShortLinkTargetInput {
  if (target.targetKind === 'INTERNAL_REF') {
    return {
      targetKind: toGrpcShortLinkTargetKind(target.targetKind),
      targetType: target.targetType,
      targetResourceId: target.targetResourceId,
      targetUrl: ''
    }
  }
  return {
    targetKind: toGrpcShortLinkTargetKind(target.targetKind),
    targetUrl: target.targetUrl,
    targetType: '',
    targetResourceId: ''
  }
}

// toGrpcShortLink maps a domain ShortLink record into the generated gRPC record shape.
function toGrpcShortLink(record: ShortLinkRecord): GrpcShortLinkRecord {
  return {
    id: record.id,
    tenantId: record.tenantId,
    displayName: record.displayName,
    shortCode: record.shortCode,
    publicUrl: record.publicUrl,
    targetKind: toGrpcShortLinkTargetKind(record.targetKind),
    targetType: record.targetType ?? '',
    targetResourceId: record.targetResourceId ?? '',
    targetUrl: record.targetUrl ?? '',
    entryPurpose: record.entryPurpose,
    sourcePlacement: record.sourcePlacement,
    campaignRef: record.campaignRef ?? '',
    status: toGrpcShortLinkStatus(record.status),
    expiresAt: record.expiresAt?.toISOString() ?? '',
    createdBy: record.createdBy,
    createdAt: record.createdAt.toISOString(),
    updatedBy: record.updatedBy,
    updatedAt: record.updatedAt.toISOString()
  }
}

// fromGrpcOperatorContext maps generated operator context metadata into the application contract.
function fromGrpcOperatorContext(context: unknown): OperatorContext {
  const candidate = (context ?? {}) as {
    operatorAccountId?: string
    operatorOrgId?: string
    traceId?: string
  }
  return {
    operatorAccountId: candidate.operatorAccountId ?? '',
    operatorOrgId: candidate.operatorOrgId,
    traceId: candidate.traceId
  }
}

// toBuckets converts object aggregates into stable gRPC repeated key/count buckets.
function toBuckets(record: Record<string, number>) {
  return Object.entries(record).map(([key, count]) => ({ key, count }))
}
