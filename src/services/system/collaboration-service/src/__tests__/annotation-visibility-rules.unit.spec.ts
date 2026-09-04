import { AnnotationEntity } from '../domain/entities/annotation.entity'
import { AnnotationVisibility } from '../domain/value-objects/annotation.enums'

const TENANT_ID = 'tenant-1'
const AUTHOR = 'account-author'
const OTHER = 'account-other'

describe('Annotation visibility rules', () => {
  it('allows object-visible notes to object readers and private notes only to authors', () => {
    const objectVisible = buildAnnotation({ visibility: AnnotationVisibility.OBJECT_VISIBLE })
    const privateNote = buildAnnotation({ visibility: AnnotationVisibility.PRIVATE })

    expect(objectVisible.canRead(AUTHOR)).toBe(true)
    expect(objectVisible.canRead(OTHER)).toBe(true)
    expect(privateNote.canRead(AUTHOR)).toBe(true)
    expect(privateNote.canRead(OTHER)).toBe(false)
  })

  it('treats soft-deleted notes as hidden from ordinary reads', () => {
    const deleted = buildAnnotation({ deletedAt: new Date('2026-06-18T10:00:00.000Z') })

    expect(deleted.isDeleted()).toBe(true)
    expect(deleted.canRead(AUTHOR)).toBe(false)
  })
})

/** buildAnnotation creates a valid AnnotationEntity fixture for visibility tests. */
function buildAnnotation(overrides: Partial<ConstructorParameters<typeof AnnotationEntity>[0]> = {}) {
  return new AnnotationEntity({
    id: 'annotation-1',
    tenantId: TENANT_ID,
    objectOwnerService: 'crm-service',
    objectType: 'CrmAccount',
    objectId: 'crm-account-1',
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
