import { Injectable } from '@nestjs/common'
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
