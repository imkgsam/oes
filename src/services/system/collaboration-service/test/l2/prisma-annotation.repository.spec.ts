import { AnnotationEntity } from '../../src/domain/entities/annotation.entity'
import { AnnotationVisibility } from '../../src/domain/value-objects/annotation.enums'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { PrismaAnnotationRepository } from '../../src/infrastructure/repositories/prisma-annotation.repository'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'

let prefix: string

describe('PrismaAnnotationRepository L2', () => {
  let prisma: PrismaService
  let repository: PrismaAnnotationRepository

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    repository = new PrismaAnnotationRepository(prisma)
  })

  beforeEach(async () => {
    prefix = createTestPrefix()
    await cleanupByPrefix(prisma, prefix)
  })

  afterEach(async () => {
    await cleanupByPrefix(prisma, prefix)
  })

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  it('creates object-visible and private notes while preserving tenant and object boundaries', async () => {
    const visible = await repository.create(buildAnnotation({ id: '30000000-0000-4000-8000-000000000001' }))
    await repository.create(
      buildAnnotation({
        id: '30000000-0000-4000-8000-000000000002',
        authorAccountId: `${prefix}_author`,
        bodyText: `${prefix}_private`,
        visibility: AnnotationVisibility.PRIVATE
      })
    )
    await repository.create(
      buildAnnotation({
        id: '30000000-0000-4000-8000-000000000003',
        authorAccountId: `${prefix}_other`,
        bodyText: `${prefix}_other_private`,
        visibility: AnnotationVisibility.PRIVATE
      })
    )

    const result = await repository.list({
      tenantId: `${prefix}_tenant`,
      objectOwnerService: 'crm-service',
      objectType: 'CrmAccount',
      objectId: `${prefix}_crm_account`,
      includePrivateForAccountId: `${prefix}_author`,
      page: 1,
      pageSize: 20
    })

    expect(result.total).toBe(2)
    expect(result.items.map((annotation) => annotation.id)).toContain(visible.id)
    expect(result.items.some((annotation) => annotation.bodyText === `${prefix}_other_private`)).toBe(false)
  })

  it('sorts pinned notes first and hides soft-deleted notes from ordinary list queries', async () => {
    await repository.create(
      buildAnnotation({
        id: '30000000-0000-4000-8000-000000000011',
        bodyText: `${prefix}_older`,
        createdAt: new Date('2026-06-18T08:00:00.000Z'),
        updatedAt: new Date('2026-06-18T08:00:00.000Z')
      })
    )
    await repository.create(
      buildAnnotation({
        id: '30000000-0000-4000-8000-000000000012',
        bodyText: `${prefix}_newer`,
        createdAt: new Date('2026-06-18T09:00:00.000Z'),
        updatedAt: new Date('2026-06-18T09:00:00.000Z')
      })
    )
    await repository.create(
      buildAnnotation({
        id: '30000000-0000-4000-8000-000000000013',
        bodyText: `${prefix}_pinned`,
        pinned: true,
        createdAt: new Date('2026-06-18T07:00:00.000Z'),
        updatedAt: new Date('2026-06-18T07:00:00.000Z')
      })
    )
    await repository.create(
      buildAnnotation({
        id: '30000000-0000-4000-8000-000000000014',
        bodyText: `${prefix}_deleted`,
        deletedAt: new Date('2026-06-18T10:00:00.000Z'),
        deletedByAccountId: `${prefix}_author`
      })
    )

    const result = await repository.list({
      tenantId: `${prefix}_tenant`,
      objectOwnerService: 'crm-service',
      objectType: 'CrmAccount',
      objectId: `${prefix}_crm_account`,
      includePrivateForAccountId: `${prefix}_author`,
      page: 1,
      pageSize: 20
    })

    expect(result.items.map((annotation) => annotation.bodyText)).toEqual([
      `${prefix}_pinned`,
      `${prefix}_newer`,
      `${prefix}_older`
    ])
  })
})

/** buildAnnotation creates one valid Annotation aggregate for Prisma repository integration tests. */
function buildAnnotation(overrides: Partial<ConstructorParameters<typeof AnnotationEntity>[0]> = {}) {
  return new AnnotationEntity({
    id: '30000000-0000-4000-8000-000000000000',
    tenantId: `${prefix}_tenant`,
    objectOwnerService: 'crm-service',
    objectType: 'CrmAccount',
    objectId: `${prefix}_crm_account`,
    objectDisplayTitle: `${prefix}_account`,
    objectDisplaySubtitle: `${prefix}_code`,
    objectDisplayStatus: 'ACTIVE',
    authorAccountId: `${prefix}_author`,
    authorDisplayNameSnapshot: `${prefix}_author`,
    bodyText: `${prefix}_note`,
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
