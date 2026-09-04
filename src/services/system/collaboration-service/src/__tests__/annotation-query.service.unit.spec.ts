import { AnnotationNotFoundError, AnnotationPermissionDeniedError } from '../common/errors/annotation.errors'
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
import { AnnotationQueryService } from '../application/services/annotation-query.service'

const TENANT_ID = 'tenant-1'
const AUTHOR = 'account-author'
const OTHER = 'account-other'
const OBJECT_REF = {
  objectOwnerService: 'crm-service',
  objectType: 'CrmAccount',
  objectId: 'crm-account-1'
}

describe('AnnotationQueryService', () => {
  let repository: CapturingAnnotationRepository
  let objectReference: jest.Mocked<ObjectReferencePort>
  let service: AnnotationQueryService

  beforeEach(() => {
    repository = new CapturingAnnotationRepository()
    objectReference = {
      validate: jest.fn().mockResolvedValue(activeReadableObject())
    }
    service = new AnnotationQueryService(repository, objectReference)
  })

  it('lists object-visible and own private notes after CRM read validation', async () => {
    repository.items = [
      buildAnnotation({ id: 'object-visible' }),
      buildAnnotation({ id: 'private-own', visibility: AnnotationVisibility.PRIVATE }),
      buildAnnotation({
        id: 'private-other',
        visibility: AnnotationVisibility.PRIVATE,
        authorAccountId: OTHER
      })
    ]

    const result = await service.listAnnotationsForObject({
      tenantId: TENANT_ID,
      operatorAccountId: AUTHOR,
      traceId: 'trace-1',
      objectRef: OBJECT_REF
    })

    expect(objectReference.validate).toHaveBeenCalledWith(
      expect.objectContaining({ capability: ObjectReferenceCapability.READ })
    )
    expect(repository.lastFilter).toEqual(
      expect.objectContaining({
        tenantId: TENANT_ID,
        objectOwnerService: 'crm-service',
        objectType: 'CrmAccount',
        objectId: 'crm-account-1',
        includePrivateForAccountId: AUTHOR,
        page: 1,
        pageSize: 20
      })
    )
    expect(result.items.map((item) => item.id)).toEqual(['object-visible', 'private-own'])
  })

  it('sorts pinned notes first and createdAt descending within each group', async () => {
    repository.items = [
      buildAnnotation({ id: 'older-normal', createdAt: new Date('2026-06-18T08:00:00.000Z') }),
      buildAnnotation({ id: 'newer-normal', createdAt: new Date('2026-06-18T09:00:00.000Z') }),
      buildAnnotation({ id: 'older-pinned', pinned: true, createdAt: new Date('2026-06-18T07:00:00.000Z') }),
      buildAnnotation({ id: 'newer-pinned', pinned: true, createdAt: new Date('2026-06-18T10:00:00.000Z') })
    ]

    const result = await service.listAnnotationsForObject({
      tenantId: TENANT_ID,
      operatorAccountId: AUTHOR,
      traceId: 'trace-1',
      objectRef: OBJECT_REF
    })

    expect(result.items.map((item) => item.id)).toEqual([
      'newer-pinned',
      'older-pinned',
      'newer-normal',
      'older-normal'
    ])
  })

  it('hides deleted notes from list and get', async () => {
    repository.items = [
      buildAnnotation({ id: 'visible' }),
      buildAnnotation({ id: 'deleted', deletedAt: new Date('2026-06-18T10:00:00.000Z') })
    ]

    const list = await service.listAnnotationsForObject({
      tenantId: TENANT_ID,
      operatorAccountId: AUTHOR,
      traceId: 'trace-1',
      objectRef: OBJECT_REF
    })
    expect(list.items.map((item) => item.id)).toEqual(['visible'])

    await expect(
      service.getAnnotation({
        tenantId: TENANT_ID,
        operatorAccountId: AUTHOR,
        traceId: 'trace-1',
        annotationId: 'deleted'
      })
    ).rejects.toThrow(AnnotationNotFoundError)
  })

  it('requires private note authorship and object read access for detail', async () => {
    repository.items = [buildAnnotation({ id: 'private-note', visibility: AnnotationVisibility.PRIVATE })]

    await expect(
      service.getAnnotation({
        tenantId: TENANT_ID,
        operatorAccountId: OTHER,
        traceId: 'trace-1',
        annotationId: 'private-note'
      })
    ).rejects.toThrow(AnnotationPermissionDeniedError)

    objectReference.validate.mockResolvedValue({ ...activeReadableObject(), readable: false, capabilityAllowed: false })
    await expect(
      service.getAnnotation({
        tenantId: TENANT_ID,
        operatorAccountId: AUTHOR,
        traceId: 'trace-1',
        annotationId: 'private-note'
      })
    ).rejects.toThrow(AnnotationPermissionDeniedError)
  })

  it('allows archived but readable CRM accounts to list notes', async () => {
    objectReference.validate.mockResolvedValue({
      ...activeReadableObject(),
      lifecycle: 'ARCHIVED',
      displaySnapshot: { title: 'Archived Account', subtitle: 'CRM-1999', status: 'ARCHIVED' }
    })
    repository.items = [buildAnnotation()]

    const result = await service.listAnnotationsForObject({
      tenantId: TENANT_ID,
      operatorAccountId: AUTHOR,
      traceId: 'trace-1',
      objectRef: OBJECT_REF
    })

    expect(result.items).toHaveLength(1)
  })
})

class CapturingAnnotationRepository implements AnnotationRepository {
  items: AnnotationEntity[] = []
  lastFilter?: AnnotationListFilter

  async create(): Promise<never> {
    throw new Error('not needed in query tests')
  }

  async save(): Promise<never> {
    throw new Error('not needed in query tests')
  }

  async findById(tenantId: string, annotationId: string): Promise<AnnotationEntity | null> {
    return this.items.find((item) => item.tenantId === tenantId && item.id === annotationId) ?? null
  }

  async list(filter: AnnotationListFilter) {
    this.lastFilter = filter
    const visible = this.items.filter(
      (item) =>
        item.tenantId === filter.tenantId &&
        item.objectOwnerService === filter.objectOwnerService &&
        item.objectType === filter.objectType &&
        item.objectId === filter.objectId &&
        !item.deletedAt &&
        (item.visibility === AnnotationVisibility.OBJECT_VISIBLE ||
          item.authorAccountId === filter.includePrivateForAccountId)
    )
    return {
      items: visible,
      page: filter.page,
      pageSize: filter.pageSize,
      total: visible.length
    }
  }
}

/** buildAnnotation creates a valid AnnotationEntity fixture for query service tests. */
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

/** activeReadableObject returns a readable CRM object reference validation result. */
function activeReadableObject(): ObjectReferenceValidation {
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
