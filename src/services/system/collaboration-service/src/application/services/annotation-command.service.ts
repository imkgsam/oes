import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { COLLABORATION_ANNOTATION_PERMISSION_CODES } from '@oes/common/authorization'
import {
  AnnotationFailedPreconditionError,
  AnnotationInvalidArgumentError,
  AnnotationNotFoundError,
  AnnotationPermissionDeniedError
} from '../../common/errors/annotation.errors'
import { AnnotationEntity } from '../../domain/entities/annotation.entity'
import { ANNOTATION_REPOSITORY, AnnotationRepository } from '../../domain/repositories/annotation.repository'
import { AnnotationVisibility } from '../../domain/value-objects/annotation.enums'
import {
  CreateAnnotationInput,
  DeleteAnnotationInput,
  SetAnnotationPinnedInput,
  UpdateAnnotationInput
} from '../dtos/annotation.dto'
import { ANNOTATION_AUDIT_PORT, AnnotationAuditAction, AnnotationAuditPort } from '../ports/annotation-audit.port'
import {
  ANNOTATION_PERMISSION_PORT,
  AnnotationPermissionPort
} from '../ports/annotation-permission.port'
import {
  OBJECT_REFERENCE_PORT,
  ObjectReferenceCapability,
  ObjectReferencePort,
  ObjectReferenceValidation
} from '../ports/object-reference.port'

const SUPPORTED_OWNER_SERVICE = 'crm-service'
const SUPPORTED_OBJECT_TYPE = 'CrmAccount'

/** AnnotationCommandService orchestrates Annotation P1 writes, object validation, permissions, and audit. */
@Injectable()
export class AnnotationCommandService {
  constructor(
    @Inject(ANNOTATION_REPOSITORY) private readonly repository: AnnotationRepository,
    @Inject(OBJECT_REFERENCE_PORT) private readonly objectReference: ObjectReferencePort,
    @Inject(ANNOTATION_PERMISSION_PORT) private readonly permissions: AnnotationPermissionPort,
    @Inject(ANNOTATION_AUDIT_PORT) private readonly audit: AnnotationAuditPort
  ) {}

  /** createAnnotation creates a pure-text note after owner-object and create permission checks. */
  async createAnnotation(input: CreateAnnotationInput): Promise<AnnotationEntity> {
    const tenantId = requireText(input.tenantId, 'tenantId')
    const operatorAccountId = requireText(input.operatorAccountId, 'operatorAccountId')
    const bodyText = requireText(input.bodyText, 'bodyText')
    const objectRef = normalizeSupportedObjectRef(input.objectRef)
    const allowed = await this.permissions.canCreateAnnotation({ tenantId, operatorAccountId })
    if (!allowed) {
      throw new AnnotationPermissionDeniedError(
        `missing permission ${COLLABORATION_ANNOTATION_PERMISSION_CODES.CREATE}`
      )
    }

    const validation = await this.validateObject(input, objectRef, ObjectReferenceCapability.CREATE_ANNOTATION)
    assertCapabilityAllowed(validation)
    const now = input.now ?? new Date()
    const annotation = new AnnotationEntity({
      id: randomUUID(),
      tenantId,
      objectOwnerService: objectRef.objectOwnerService,
      objectType: objectRef.objectType,
      objectId: objectRef.objectId,
      objectDisplayTitle: validation.displaySnapshot.title ?? null,
      objectDisplaySubtitle: validation.displaySnapshot.subtitle ?? null,
      objectDisplayStatus: validation.displaySnapshot.status ?? null,
      authorAccountId: operatorAccountId,
      authorDisplayNameSnapshot: normalizeAuthorDisplayName(input.operatorDisplayName, operatorAccountId),
      bodyText,
      visibility: input.visibility ?? AnnotationVisibility.OBJECT_VISIBLE,
      pinned: false,
      edited: false,
      deletedAt: null,
      deletedByAccountId: null,
      deleteReason: null,
      createdAt: now,
      updatedAt: now
    })
    const saved = await this.repository.create(annotation)
    await this.recordAudit('ANNOTATION_CREATED', saved, input)
    return saved
  }

  /** updateAnnotation edits an author's note body or visibility on mutable owner objects. */
  async updateAnnotation(input: UpdateAnnotationInput): Promise<AnnotationEntity> {
    const annotation = await this.loadAnnotation(input.tenantId, input.annotationId)
    const validation = await this.validateExistingAnnotation(input, annotation, ObjectReferenceCapability.MUTATE_ANNOTATION)
    assertCapabilityAllowed(validation)
    annotation.assertMutableTarget(validation.lifecycle)
    annotation.refreshObjectSnapshot(validation.displaySnapshot)
    annotation.updateContent(input.operatorAccountId, input, input.now ?? new Date())
    const saved = await this.repository.save(annotation)
    await this.recordAudit('ANNOTATION_UPDATED', saved, input)
    return saved
  }

  /** deleteAnnotation soft-deletes notes by author rule or manage permission, including governance deletion on archived objects. */
  async deleteAnnotation(input: DeleteAnnotationInput): Promise<AnnotationEntity> {
    const annotation = await this.loadAnnotation(input.tenantId, input.annotationId)
    const operatorAccountId = requireText(input.operatorAccountId, 'operatorAccountId')
    const isAuthor = annotation.authorAccountId === operatorAccountId
    const canManage = await this.permissions.canManageAnnotation({
      tenantId: annotation.tenantId,
      operatorAccountId
    })
    if (!isAuthor && !canManage) {
      throw new AnnotationPermissionDeniedError(
        `missing permission ${COLLABORATION_ANNOTATION_PERMISSION_CODES.MANAGE}`
      )
    }
    const validation = await this.validateExistingAnnotation(input, annotation, ObjectReferenceCapability.MUTATE_ANNOTATION)
    assertDeleteCapabilityAllowed(validation, canManage)
    annotation.refreshObjectSnapshot(validation.displaySnapshot)
    annotation.softDelete(operatorAccountId, canManage, input.deleteReason ?? null, input.now ?? new Date())
    const saved = await this.repository.save(annotation)
    await this.recordAudit('ANNOTATION_DELETED', saved, input, input.deleteReason)
    return saved
  }

  /** setAnnotationPinned changes object-level pin state through manager permission on mutable owner objects. */
  async setAnnotationPinned(input: SetAnnotationPinnedInput): Promise<AnnotationEntity> {
    const annotation = await this.loadAnnotation(input.tenantId, input.annotationId)
    const allowed = await this.permissions.canManageAnnotation({
      tenantId: annotation.tenantId,
      operatorAccountId: requireText(input.operatorAccountId, 'operatorAccountId')
    })
    if (!allowed) {
      throw new AnnotationPermissionDeniedError(
        `missing permission ${COLLABORATION_ANNOTATION_PERMISSION_CODES.MANAGE}`
      )
    }
    const validation = await this.validateExistingAnnotation(input, annotation, ObjectReferenceCapability.MUTATE_ANNOTATION)
    assertCapabilityAllowed(validation)
    annotation.assertMutableTarget(validation.lifecycle)
    annotation.refreshObjectSnapshot(validation.displaySnapshot)
    annotation.setPinned(Boolean(input.pinned), input.now ?? new Date())
    const saved = await this.repository.save(annotation)
    await this.recordAudit('ANNOTATION_PINNED_CHANGED', saved, input)
    return saved
  }

  /** loadAnnotation fetches a tenant-scoped annotation and maps absence to the stable domain error. */
  private async loadAnnotation(tenantId: string, annotationId: string): Promise<AnnotationEntity> {
    const annotation = await this.repository.findById(
      requireText(tenantId, 'tenantId'),
      requireText(annotationId, 'annotationId')
    )
    if (!annotation) throw new AnnotationNotFoundError()
    return annotation
  }

  /** validateExistingAnnotation checks the current owner object state for note mutations. */
  private validateExistingAnnotation(
    input: { tenantId: string; operatorAccountId: string; traceId: string },
    annotation: AnnotationEntity,
    capability: ObjectReferenceCapability
  ): Promise<ObjectReferenceValidation> {
    return this.validateObject(
      input,
      {
        objectOwnerService: annotation.objectOwnerService,
        objectType: annotation.objectType,
        objectId: annotation.objectId
      },
      capability
    )
  }

  /** validateObject routes only whitelisted Annotation P1 object references to the owner service adapter. */
  private validateObject(
    input: { tenantId: string; operatorAccountId: string; traceId: string },
    objectRef: { objectOwnerService: string; objectType: string; objectId: string },
    capability: ObjectReferenceCapability
  ): Promise<ObjectReferenceValidation> {
    return this.objectReference.validate({
      tenantId: requireText(input.tenantId, 'tenantId'),
      operatorAccountId: requireText(input.operatorAccountId, 'operatorAccountId'),
      traceId: requireText(input.traceId, 'traceId'),
      objectRef: normalizeSupportedObjectRef(objectRef),
      capability
    })
  }

  /** recordAudit writes the required local command audit envelope after successful persistence. */
  private async recordAudit(
    action: AnnotationAuditAction,
    annotation: AnnotationEntity,
    input: { operatorAccountId: string; traceId?: string; auditId?: string },
    reasonSnapshot?: string | null
  ): Promise<void> {
    await this.audit.record({
      tenantId: annotation.tenantId,
      annotationId: annotation.id,
      action,
      result: 'SUCCEEDED',
      operatorAccountId: input.operatorAccountId,
      authorAccountId: annotation.authorAccountId,
      objectOwnerService: annotation.objectOwnerService,
      objectType: annotation.objectType,
      objectId: annotation.objectId,
      traceId: input.traceId,
      auditId: input.auditId,
      reasonSnapshot: normalizeText(reasonSnapshot) ?? undefined,
      payload: {
        visibility: annotation.visibility,
        pinned: annotation.pinned,
        deleted: annotation.isDeleted()
      }
    })
  }
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
  if (objectOwnerService !== SUPPORTED_OWNER_SERVICE || objectType !== SUPPORTED_OBJECT_TYPE) {
    throw new AnnotationInvalidArgumentError('objectRef is not supported by Annotation P1')
  }
  return { objectOwnerService, objectType, objectId }
}

/** assertCapabilityAllowed maps owner-service reference denial to stable Annotation errors. */
function assertCapabilityAllowed(validation: ObjectReferenceValidation): void {
  if (!validation.exists) throw new AnnotationNotFoundError('owner object not found')
  if (!validation.readable) throw new AnnotationPermissionDeniedError(validation.denyReason ?? 'owner object is not readable')
  if (!validation.capabilityAllowed) {
    throw new AnnotationFailedPreconditionError(validation.denyReason ?? 'owner object does not allow annotation mutation')
  }
}

/** assertDeleteCapabilityAllowed keeps archived-object governance deletion while blocking ordinary mutation. */
function assertDeleteCapabilityAllowed(validation: ObjectReferenceValidation, canManage: boolean): void {
  if (!validation.exists) throw new AnnotationNotFoundError('owner object not found')
  if (!validation.readable) throw new AnnotationPermissionDeniedError(validation.denyReason ?? 'owner object is not readable')
  if (!validation.capabilityAllowed && (!canManage || validation.lifecycle !== 'ARCHIVED')) {
    throw new AnnotationFailedPreconditionError(validation.denyReason ?? 'owner object does not allow annotation deletion')
  }
}

/** requireText trims required command text inputs and rejects blanks. */
function requireText(value: string | undefined | null, fieldName: string): string {
  const normalized = normalizeText(value)
  if (!normalized) throw new AnnotationInvalidArgumentError(`${fieldName} is required`)
  return normalized
}

/** normalizeText trims optional command text and returns undefined for blanks. */
function normalizeText(value: string | undefined | null): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

/** normalizeAuthorDisplayName chooses the persisted author label while preserving a required fallback. */
function normalizeAuthorDisplayName(displayName: string | undefined, fallbackAccountId: string): string {
  return normalizeText(displayName) ?? fallbackAccountId
}
