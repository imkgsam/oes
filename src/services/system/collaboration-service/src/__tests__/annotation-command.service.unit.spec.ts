import {
  AnnotationFailedPreconditionError,
  AnnotationInvalidArgumentError,
  AnnotationPermissionDeniedError
} from '../common/errors/annotation.errors'
import { AnnotationEntity } from '../domain/entities/annotation.entity'
import {
  AnnotationListFilter,
  AnnotationRepository
} from '../domain/repositories/annotation.repository'
import { AnnotationVisibility } from '../domain/value-objects/annotation.enums'
import {
  ObjectReferenceCapability,
  ObjectReferencePort,
  ObjectReferenceValidation
} from '../application/ports/object-reference.port'
import { AnnotationAuditPort } from '../application/ports/annotation-audit.port'
import { AnnotationPermissionPort } from '../application/ports/annotation-permission.port'
import { AnnotationCommandService } from '../application/services/annotation-command.service'

const TENANT_ID = 'tenant-1'
const AUTHOR = 'account-author'
const MANAGER = 'account-manager'
const OTHER = 'account-other'
const TRACE_ID = 'trace-1'
const AUDIT_ID = 'audit-1'
const OBJECT_REF = {
  objectOwnerService: 'crm-service',
  objectType: 'CrmAccount',
  objectId: 'crm-account-1'
}

describe('AnnotationCommandService', () => {
  let repository: InMemoryAnnotationRepository
  let objectReference: jest.Mocked<ObjectReferencePort>
  let permissions: jest.Mocked<AnnotationPermissionPort>
  let audit: jest.Mocked<AnnotationAuditPort>
  let service: AnnotationCommandService

  beforeEach(() => {
    repository = new InMemoryAnnotationRepository()
    objectReference = {
      validate: jest.fn().mockResolvedValue(activeObject())
    }
    permissions = {
      canCreateAnnotation: jest.fn().mockResolvedValue(true),
      canManageAnnotation: jest.fn().mockResolvedValue(false)
    }
    audit = {
      record: jest.fn().mockResolvedValue(undefined)
    }
    service = new AnnotationCommandService(repository, objectReference, permissions, audit)
  })

  it('creates object-visible and private notes after object validation and create permission', async () => {
    const objectVisible = await service.createAnnotation({
      tenantId: TENANT_ID,
      operatorAccountId: AUTHOR,
      traceId: TRACE_ID,
      auditId: AUDIT_ID,
      objectRef: OBJECT_REF,
      bodyText: 'Customer prefers consolidated shipment windows.',
      now: new Date('2026-06-18T08:00:00.000Z')
    })

    const privateNote = await service.createAnnotation({
      tenantId: TENANT_ID,
      operatorAccountId: AUTHOR,
      traceId: TRACE_ID,
      auditId: AUDIT_ID,
      objectRef: OBJECT_REF,
      bodyText: 'Prepare negotiation note.',
      visibility: AnnotationVisibility.PRIVATE,
      now: new Date('2026-06-18T08:01:00.000Z')
    })

    expect(objectVisible.visibility).toBe(AnnotationVisibility.OBJECT_VISIBLE)
    expect(privateNote.visibility).toBe(AnnotationVisibility.PRIVATE)
    expect(objectVisible.authorDisplayNameSnapshot).toBe(AUTHOR)
    expect(objectReference.validate).toHaveBeenCalledWith(
      expect.objectContaining({ capability: ObjectReferenceCapability.CREATE_ANNOTATION })
    )
    expect(permissions.canCreateAnnotation).toHaveBeenCalledWith({
      tenantId: TENANT_ID,
      operatorAccountId: AUTHOR
    })
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'ANNOTATION_CREATED', result: 'SUCCEEDED' }))
  })

  it('stores the operator display name snapshot when creating a note', async () => {
    const note = await service.createAnnotation({
      tenantId: TENANT_ID,
      operatorAccountId: AUTHOR,
      operatorDisplayName: '陈双鹏',
      traceId: TRACE_ID,
      auditId: AUDIT_ID,
      objectRef: OBJECT_REF,
      bodyText: 'Use a readable creator label.'
    })

    expect(note.authorAccountId).toBe(AUTHOR)
    expect(note.authorDisplayNameSnapshot).toBe('陈双鹏')
  })

  it('rejects unsupported targets, blank body, missing create permission, and archived creates', async () => {
    await expect(
      service.createAnnotation({
        tenantId: TENANT_ID,
        operatorAccountId: AUTHOR,
        traceId: TRACE_ID,
        auditId: AUDIT_ID,
        objectRef: { ...OBJECT_REF, objectType: 'SalesOrder' },
        bodyText: 'not allowed'
      })
    ).rejects.toThrow(AnnotationInvalidArgumentError)

    await expect(
      service.createAnnotation({
        tenantId: TENANT_ID,
        operatorAccountId: AUTHOR,
        traceId: TRACE_ID,
        auditId: AUDIT_ID,
        objectRef: OBJECT_REF,
        bodyText: '   '
      })
    ).rejects.toThrow(AnnotationInvalidArgumentError)

    permissions.canCreateAnnotation.mockResolvedValue(false)
    await expect(
      service.createAnnotation({
        tenantId: TENANT_ID,
        operatorAccountId: AUTHOR,
        traceId: TRACE_ID,
        auditId: AUDIT_ID,
        objectRef: OBJECT_REF,
        bodyText: 'Denied by permission.'
      })
    ).rejects.toThrow(AnnotationPermissionDeniedError)

    permissions.canCreateAnnotation.mockResolvedValue(true)
    objectReference.validate.mockResolvedValue(archivedObject())
    await expect(
      service.createAnnotation({
        tenantId: TENANT_ID,
        operatorAccountId: AUTHOR,
        traceId: TRACE_ID,
        auditId: AUDIT_ID,
        objectRef: OBJECT_REF,
        bodyText: 'Archived account note.'
      })
    ).rejects.toThrow(AnnotationFailedPreconditionError)
  })

  it('allows only authors to update note body or visibility', async () => {
    const note = await repository.create(buildAnnotation())

    const updated = await service.updateAnnotation({
      tenantId: TENANT_ID,
      operatorAccountId: AUTHOR,
      traceId: TRACE_ID,
      auditId: AUDIT_ID,
      annotationId: note.id,
      bodyText: 'Updated account note.',
      visibility: AnnotationVisibility.PRIVATE,
      now: new Date('2026-06-18T09:00:00.000Z')
    })

    expect(updated.bodyText).toBe('Updated account note.')
    expect(updated.visibility).toBe(AnnotationVisibility.PRIVATE)
    expect(updated.edited).toBe(true)

    permissions.canManageAnnotation.mockResolvedValue(true)
    await expect(
      service.updateAnnotation({
        tenantId: TENANT_ID,
        operatorAccountId: MANAGER,
        traceId: TRACE_ID,
        auditId: AUDIT_ID,
        annotationId: note.id,
        bodyText: 'Manager must not rewrite history.'
      })
    ).rejects.toThrow(AnnotationPermissionDeniedError)
  })

  it('allows author delete, manage delete any, and manage pin on active objects', async () => {
    const authorNote = await repository.create(buildAnnotation({ id: 'annotation-own' }))
    const otherNote = await repository.create(buildAnnotation({ id: 'annotation-other', authorAccountId: OTHER }))

    const deletedOwn = await service.deleteAnnotation({
      tenantId: TENANT_ID,
      operatorAccountId: AUTHOR,
      traceId: TRACE_ID,
      auditId: AUDIT_ID,
      annotationId: authorNote.id,
      now: new Date('2026-06-18T09:10:00.000Z')
    })
    expect(deletedOwn.deletedAt).toBeInstanceOf(Date)

    permissions.canManageAnnotation.mockResolvedValue(true)
    const deletedOther = await service.deleteAnnotation({
      tenantId: TENANT_ID,
      operatorAccountId: MANAGER,
      traceId: TRACE_ID,
      auditId: AUDIT_ID,
      annotationId: otherNote.id,
      deleteReason: 'governance cleanup',
      now: new Date('2026-06-18T09:11:00.000Z')
    })
    expect(deletedOther.deletedByAccountId).toBe(MANAGER)

    const pinTarget = await repository.create(buildAnnotation({ id: 'annotation-pin' }))
    const pinned = await service.setAnnotationPinned({
      tenantId: TENANT_ID,
      operatorAccountId: MANAGER,
      traceId: TRACE_ID,
      auditId: AUDIT_ID,
      annotationId: pinTarget.id,
      pinned: true,
      now: new Date('2026-06-18T09:12:00.000Z')
    })
    expect(pinned.pinned).toBe(true)
  })

  it('rejects pin and normal edit when the CRM object is archived', async () => {
    permissions.canManageAnnotation.mockResolvedValue(true)
    objectReference.validate.mockResolvedValue(archivedObject())
    const note = await repository.create(buildAnnotation())

    await expect(
      service.setAnnotationPinned({
        tenantId: TENANT_ID,
        operatorAccountId: MANAGER,
        traceId: TRACE_ID,
        auditId: AUDIT_ID,
        annotationId: note.id,
        pinned: true
      })
    ).rejects.toThrow(AnnotationFailedPreconditionError)

    await expect(
      service.updateAnnotation({
        tenantId: TENANT_ID,
        operatorAccountId: AUTHOR,
        traceId: TRACE_ID,
        auditId: AUDIT_ID,
        annotationId: note.id,
        bodyText: 'Archived targets are readonly.'
      })
    ).rejects.toThrow(AnnotationFailedPreconditionError)
  })

  it('rejects ordinary author delete on archived objects but allows manage governance delete', async () => {
    objectReference.validate.mockResolvedValue(archivedObject())
    const authorNote = await repository.create(buildAnnotation({ id: 'annotation-archived-own' }))

    await expect(
      service.deleteAnnotation({
        tenantId: TENANT_ID,
        operatorAccountId: AUTHOR,
        traceId: TRACE_ID,
        auditId: AUDIT_ID,
        annotationId: authorNote.id
      })
    ).rejects.toThrow(AnnotationFailedPreconditionError)

    permissions.canManageAnnotation.mockResolvedValue(true)
    const managerNote = await repository.create(buildAnnotation({ id: 'annotation-archived-managed', authorAccountId: OTHER }))
    const deleted = await service.deleteAnnotation({
      tenantId: TENANT_ID,
      operatorAccountId: MANAGER,
      traceId: TRACE_ID,
      auditId: AUDIT_ID,
      annotationId: managerNote.id,
      deleteReason: 'governance cleanup'
    })

    expect(deleted.deletedByAccountId).toBe(MANAGER)
  })
})

class InMemoryAnnotationRepository implements AnnotationRepository {
  private readonly annotations = new Map<string, AnnotationEntity>()

  async create(annotation: AnnotationEntity): Promise<AnnotationEntity> {
    this.annotations.set(annotation.id, new AnnotationEntity(annotation.snapshot()))
    return new AnnotationEntity(annotation.snapshot())
  }

  async save(annotation: AnnotationEntity): Promise<AnnotationEntity> {
    this.annotations.set(annotation.id, new AnnotationEntity(annotation.snapshot()))
    return new AnnotationEntity(annotation.snapshot())
  }

  async findById(tenantId: string, annotationId: string): Promise<AnnotationEntity | null> {
    const annotation = this.annotations.get(annotationId)
    return annotation?.tenantId === tenantId ? new AnnotationEntity(annotation.snapshot()) : null
  }

  async list(filter: AnnotationListFilter): Promise<never> {
    void filter
    throw new Error('not needed in command tests')
  }
}

/** buildAnnotation creates a valid AnnotationEntity fixture for command service tests. */
function buildAnnotation(overrides: Partial<ConstructorParameters<typeof AnnotationEntity>[0]> = {}) {
  return new AnnotationEntity({
    id: 'annotation-1',
    tenantId: TENANT_ID,
    objectOwnerService: OBJECT_REF.objectOwnerService,
    objectType: OBJECT_REF.objectType,
    objectId: OBJECT_REF.objectId,
    objectDisplayTitle: 'Northwind Traders',
    objectDisplaySubtitle: 'CRM-1001',
    objectDisplayStatus: 'ACTIVE',
    authorAccountId: AUTHOR,
    authorDisplayNameSnapshot: AUTHOR,
    bodyText: 'Initial note.',
    visibility: AnnotationVisibility.OBJECT_VISIBLE,
    pinned: false,
    edited: false,
    deletedAt: null,
    deletedByAccountId: null,
    deleteReason: null,
    createdAt: new Date('2026-06-18T08:00:00.000Z'),
    updatedAt: new Date('2026-06-18T08:00:00.000Z'),
    ...overrides
  })
}

/** activeObject returns an allowed CRM object reference validation result. */
function activeObject(): ObjectReferenceValidation {
  return {
    objectRef: OBJECT_REF,
    exists: true,
    readable: true,
    capabilityAllowed: true,
    lifecycle: 'ACTIVE',
    displaySnapshot: {
      title: 'Northwind Traders',
      subtitle: 'CRM-1001',
      status: 'ACTIVE'
    }
  }
}

/** archivedObject returns a readable but mutation-denied CRM object reference validation result. */
function archivedObject(): ObjectReferenceValidation {
  return {
    ...activeObject(),
    capabilityAllowed: false,
    lifecycle: 'ARCHIVED',
    denyReason: 'crm account is archived'
  }
}
