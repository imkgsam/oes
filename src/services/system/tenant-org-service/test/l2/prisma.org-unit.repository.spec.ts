import { PrismaOrgUnitRepository } from '../../src/infrastructure/repositories/prisma-org-unit.repository'
import { PrismaTenantRepository } from '../../src/infrastructure/repositories/prisma-tenant.repository'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { OrgUnitStatus, OrgUnitType } from '../../src/domain/value-objects'
import {
  cleanupByPrefix,
  createTestEmployeeCodePrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'

describe('PrismaOrgUnitRepository L2', () => {
  let prisma: PrismaService
  let tenantRepository: PrismaTenantRepository
  let orgUnitRepository: PrismaOrgUnitRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    tenantRepository = new PrismaTenantRepository(prisma)
    orgUnitRepository = new PrismaOrgUnitRepository(prisma)
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

  it('move / should reject cycles when moving an org below its descendant', async () => {
    const { tenant, rootOrgUnit } = await tenantRepository.createWithRootOrg({
      code: `${prefix}_cycle`,
      employeeCodePrefix: createTestEmployeeCodePrefix(),
      name: `${prefix}_Cycle`,
      rootOrgName: `${prefix}_Cycle`
    })
    const child = await orgUnitRepository.create({
      tenantId: tenant.id,
      parentOrgId: rootOrgUnit.id,
      name: `${prefix}_Child`,
      type: OrgUnitType.DEPARTMENT
    })

    await expect(
      orgUnitRepository.move({
        tenantId: tenant.id,
        orgUnitId: rootOrgUnit.id,
        newParentOrgId: child.id
      })
    ).rejects.toThrow(/descendant|root|cycle/i)
  })

  it('archive / should mark org archived without physically deleting it', async () => {
    const { tenant, rootOrgUnit } = await tenantRepository.createWithRootOrg({
      code: `${prefix}_archive`,
      employeeCodePrefix: createTestEmployeeCodePrefix(),
      name: `${prefix}_Archive`,
      rootOrgName: `${prefix}_Archive`
    })
    const child = await orgUnitRepository.create({
      tenantId: tenant.id,
      parentOrgId: rootOrgUnit.id,
      name: `${prefix}_ArchiveChild`,
      type: OrgUnitType.TEAM
    })

    const archived = await orgUnitRepository.archive({ tenantId: tenant.id, orgUnitId: child.id })
    const persisted = await prisma.orgUnit.findUnique({ where: { id: child.id } })

    expect(archived.status).toBe(OrgUnitStatus.ARCHIVED)
    expect(persisted?.status).toBe(OrgUnitStatus.ARCHIVED)
  })

  it('listDescendants / should respect tenant boundary even when ids are mixed', async () => {
    const tenantA = await tenantRepository.createWithRootOrg({
      code: `${prefix}_tenant_a`,
      employeeCodePrefix: createTestEmployeeCodePrefix(),
      name: `${prefix}_TenantA`,
      rootOrgName: `${prefix}_TenantA`
    })
    const tenantB = await tenantRepository.createWithRootOrg({
      code: `${prefix}_tenant_b`,
      employeeCodePrefix: createTestEmployeeCodePrefix(),
      name: `${prefix}_TenantB`,
      rootOrgName: `${prefix}_TenantB`
    })
    const childA = await orgUnitRepository.create({
      tenantId: tenantA.tenant.id,
      parentOrgId: tenantA.rootOrgUnit.id,
      name: `${prefix}_ChildA`,
      type: OrgUnitType.DEPARTMENT
    })
    await orgUnitRepository.create({
      tenantId: tenantB.tenant.id,
      parentOrgId: tenantB.rootOrgUnit.id,
      name: `${prefix}_ChildB`,
      type: OrgUnitType.DEPARTMENT
    })

    const descendants = await orgUnitRepository.listDescendants(
      tenantA.tenant.id,
      tenantA.rootOrgUnit.id
    )

    expect(descendants).toEqual([
      expect.objectContaining({ id: childA.id, tenantId: tenantA.tenant.id })
    ])
    expect(descendants.every((orgUnit) => orgUnit.tenantId === tenantA.tenant.id)).toBe(true)
  })
})
