import { Inject, Injectable } from '@nestjs/common'
import {
  AnnotationInvalidArgumentError,
  AnnotationNotFoundError,
  AnnotationPermissionDeniedError
} from '../../common/errors/annotation.errors'
import { AnnotationEntity } from '../../domain/entities/annotation.entity'
import { ANNOTATION_REPOSITORY, AnnotationRepository } from '../../domain/repositories/annotation.repository'
import { GetAnnotationInput, ListAnnotationsForObjectInput, AnnotationListResultDto } from '../dtos/annotation.dto'
import {
  OBJECT_REFERENCE_PORT,
  ObjectReferenceCapability,
  ObjectReferencePort,
  ObjectReferenceValidation
} from '../ports/object-reference.port'

const MAX_PAGE_SIZE = 100

/** AnnotationQueryService applies object read validation, P1 visibility, deletion hiding, and stable ordering. */
@Injectable()
export class AnnotationQueryService {
  constructor(
    @Inject(ANNOTATION_REPOSITORY) private readonly repository: AnnotationRepository,
    @Inject(OBJECT_REFERENCE_PORT) private readonly objectReference: ObjectReferencePort
  ) {}

  /** listAnnotationsForObject returns visible notes for one supported owner object. */
  async listAnnotationsForObject(input: ListAnnotationsForObjectInput): Promise<AnnotationListResultDto> {
    const objectRef = normalizeSupportedObjectRef(input.objectRef)
    await this.validateObject(input, objectRef)
    const page = normalizePage(input.page)
    const pageSize = normalizePageSize(input.pageSize)
    const result = await this.repository.list({
      tenantId: requireText(input.tenantId, 'tenantId'),
      objectOwnerService: objectRef.objectOwnerService,
      objectType: objectRef.objectType,
      objectId: objectRef.objectId,
      includePrivateForAccountId: input.includePrivate === false ? undefined : requireText(input.operatorAccountId, 'operatorAccountId'),
      page,
      pageSize
    })
    const items = result.items
      .filter((annotation) => annotation.canRead(input.operatorAccountId))
      .sort(compareAnnotations)
    return {
      items,
      page: result.page,
      pageSize: result.pageSize,
      total: items.length
    }
  }

  /** getAnnotation returns one ordinary-query-visible note after owner object read validation. */
  async getAnnotation(input: GetAnnotationInput): Promise<AnnotationEntity> {
    const annotation = await this.repository.findById(
      requireText(input.tenantId, 'tenantId'),
      requireText(input.annotationId, 'annotationId')
    )
    if (!annotation || annotation.isDeleted()) {
      throw new AnnotationNotFoundError()
    }
    await this.validateObject(input, {
      objectOwnerService: annotation.objectOwnerService,
      objectType: annotation.objectType,
      objectId: annotation.objectId
    })
    if (!annotation.canRead(requireText(input.operatorAccountId, 'operatorAccountId'))) {
      throw new AnnotationPermissionDeniedError('annotation is not visible to operator')
    }
    return annotation
  }

  /** validateObject checks read access through the owner service without reading owner databases. */
  private async validateObject(
    input: { tenantId: string; operatorAccountId: string; traceId: string },
    objectRef: { objectOwnerService: string; objectType: string; objectId: string }
  ): Promise<ObjectReferenceValidation> {
    const validation = await this.objectReference.validate({
      tenantId: requireText(input.tenantId, 'tenantId'),
      operatorAccountId: requireText(input.operatorAccountId, 'operatorAccountId'),
      traceId: requireText(input.traceId, 'traceId'),
      objectRef: normalizeSupportedObjectRef(objectRef),
      capability: ObjectReferenceCapability.READ
    })
    if (!validation.exists) throw new AnnotationNotFoundError('owner object not found')
    if (!validation.readable || !validation.capabilityAllowed) {
      throw new AnnotationPermissionDeniedError(validation.denyReason ?? 'owner object is not readable')
    }
    return validation
  }
}

/** compareAnnotations implements pinned-first then createdAt-desc sorting for visible notes. */
function compareAnnotations(left: AnnotationEntity, right: AnnotationEntity): number {
  if (left.pinned !== right.pinned) return left.pinned ? -1 : 1
  return right.createdAt.getTime() - left.createdAt.getTime()
}

/** normalizeSupportedObjectRef trims and whitelists Annotation P1 owner object references. */
function normalizeSupportedObjectRef(input: {
  objectOwnerService?: string
  objectType?: string
  objectId?: string
}) {
  const objectOwnerService = requireText(input.objectOwnerService, 'objectOwnerService')
  const objectType = requireText(input.objectType, 'objectType')
  const objectId = requireText(input.objectId, 'objectId')
  if (objectOwnerService !== 'crm-service' || objectType !== 'CrmAccount') {
    throw new AnnotationInvalidArgumentError('objectRef is not supported by Annotation P1')
  }
  return { objectOwnerService, objectType, objectId }
}

/** requireText trims required query text inputs and rejects blanks. */
function requireText(value: string | undefined | null, fieldName: string): string {
  const normalized = value?.trim()
  if (!normalized) throw new AnnotationInvalidArgumentError(`${fieldName} is required`)
  return normalized
}

/** normalizePage validates and defaults one-based page numbers. */
function normalizePage(value?: number): number {
  const page = value ?? 1
  if (!Number.isInteger(page) || page < 1) throw new AnnotationInvalidArgumentError('page is invalid')
  return page
}

/** normalizePageSize validates and clamps list page sizes to the P1 maximum. */
function normalizePageSize(value?: number): number {
  const pageSize = value ?? 20
  if (!Number.isInteger(pageSize) || pageSize < 1) throw new AnnotationInvalidArgumentError('pageSize is invalid')
  return Math.min(pageSize, MAX_PAGE_SIZE)
}
