import { BadRequestException, Injectable } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'
import { AnnotationCommandGrpcAdapter } from '../adapters/annotation-command-grpc.adapter'
import { toProtoAnnotationVisibility } from '../adapters/annotation-grpc-mappers'
import { AnnotationQueryGrpcAdapter } from '../adapters/annotation-query-grpc.adapter'
import {
  CreateAnnotationDto,
  DeleteAnnotationDto,
  ListAnnotationsDto,
  SetAnnotationPinnedDto,
  UpdateAnnotationDto
} from '../interface/http/dtos/annotation.dto'

/** AnnotationBffService builds gateway Annotation P1 requests without owning note business rules. */
@Injectable()
export class AnnotationBffService {
  constructor(
    private readonly commandAdapter: AnnotationCommandGrpcAdapter,
    private readonly queryAdapter: AnnotationQueryGrpcAdapter
  ) {}

  async listAnnotationsForObject(
    ownerService: string,
    objectType: string,
    objectId: string,
    query: ListAnnotationsDto,
    source: DownstreamRequestSource
  ) {
    return this.queryAdapter.listAnnotationsForObject(
      {
        ...this.context(source),
        objectRef: this.objectRef(ownerService, objectType, objectId),
        includePrivate: query.includePrivate === undefined ? true : toBoolean(query.includePrivate),
        page: toPositiveInt(query.page, 1),
        pageSize: toPositiveInt(query.pageSize, 20)
      },
      source
    )
  }

  async createAnnotation(
    ownerService: string,
    objectType: string,
    objectId: string,
    body: CreateAnnotationDto,
    source: DownstreamRequestSource
  ) {
    return this.commandAdapter.call(
      'createAnnotation',
      {
        ...this.commandContext(source),
        objectRef: this.objectRef(ownerService, objectType, objectId),
        bodyText: body.bodyText,
        visibility: toProtoAnnotationVisibility(body.visibility)
      },
      source
    )
  }

  async updateAnnotation(annotationId: string, body: UpdateAnnotationDto, source: DownstreamRequestSource) {
    return this.commandAdapter.call(
      'updateAnnotation',
      {
        ...this.commandContext(source),
        annotationId,
        bodyText: body.bodyText,
        visibility: toProtoAnnotationVisibility(body.visibility)
      },
      source
    )
  }

  async deleteAnnotation(annotationId: string, body: DeleteAnnotationDto, source: DownstreamRequestSource) {
    return this.commandAdapter.call(
      'deleteAnnotation',
      {
        ...this.commandContext(source),
        annotationId,
        deleteReason: body.deleteReason
      },
      source
    )
  }

  async setAnnotationPinned(annotationId: string, body: SetAnnotationPinnedDto, source: DownstreamRequestSource) {
    return this.commandAdapter.call(
      'setAnnotationPinned',
      {
        ...this.commandContext(source),
        annotationId,
        pinned: Boolean(body.pinned)
      },
      source
    )
  }

  /** objectRef builds the explicit owner object reference accepted by Annotation P1. */
  private objectRef(ownerService: string, objectType: string, objectId: string) {
    return {
      objectOwnerService: ownerService,
      objectType,
      objectId
    }
  }

  /** context builds the explicit Annotation P1 query context from gateway auth state. */
  private context(source: DownstreamRequestSource) {
    const tenantId = source.user?.tenantId || source.user?.tid
    const operatorAccountId = source.user?.holderId || source.user?.aid || source.user?.id || source.user?.sub
    if (!tenantId) throw new BadRequestException('tenant context is required')
    if (!operatorAccountId) throw new BadRequestException('operator account context is required')
    return {
      tenantId,
      operatorContext: {
        accountId: operatorAccountId,
        userId: source.user?.userId || source.user?.sub,
        tenantId,
        displayName: normalizeText(source.user?.displayName)
      },
      traceContext: {
        traceId: source.traceId || source.requestId || `gateway-${Date.now()}`
      }
    }
  }

  /** commandContext extends query context with audit metadata for Annotation P1 command calls. */
  private commandContext(source: DownstreamRequestSource) {
    return {
      ...this.context(source),
      auditContext: {
        auditId: source.requestId,
        source: 'api-gateway'
      }
    }
  }
}

/** toBoolean normalizes bool query params from strings and booleans. */
function toBoolean(value: boolean | string | undefined): boolean {
  return value === true || value === 'true'
}

/** toPositiveInt normalizes positive integer query params with defaults. */
function toPositiveInt(value: number | string | undefined, fallback: number): number {
  const parsed = Number(value ?? fallback)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

/** normalizeText trims optional BFF text values before they enter downstream contracts. */
function normalizeText(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}
