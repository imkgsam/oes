import { PrismaTenantRepository } from '../../src/infrastructure/repositories/prisma-tenant.repository'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { OrgUnitType, TenantStatus } from '../../src/domain/value-objects'
import {
  cleanupByPrefix,
  createTestEmployeeCodePrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'

describe('PrismaTenantRepository L2', () => {
  let prisma: PrismaService
  let tenantRepository: PrismaTenantRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    tenantRepository = new PrismaTenantRepository(prisma)
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

  it('createWithRootOrg / should create tenant and root org in one transaction', async () => {
    const result = await tenantRepository.createWithRootOrg({
      code: `${prefix}_acme`,
      employeeCodePrefix: createTestEmployeeCodePrefix(),
      name: `${prefix}_Acme`,
      rootOrgName: `${prefix}_Acme Root`
    })

    const persistedTenant = await prisma.tenant.findUnique({ where: { id: result.tenant.id } })
    const persistedRoot = await prisma.orgUnit.findUnique({ where: { id: result.rootOrgUnit.id } })

    expect(result.tenant.status).toBe(TenantStatus.ACTIVE)
    expect(result.tenant.rootOrgId).toBe(result.rootOrgUnit.id)
    expect(result.rootOrgUnit.type).toBe(OrgUnitType.ROOT)
    expect(persistedTenant?.rootOrgId).toBe(result.rootOrgUnit.id)
    expect(persistedRoot?.tenantId).toBe(result.tenant.id)
  })

  it('createWithRootOrg / should reject duplicate tenant code', async () => {
    await tenantRepository.createWithRootOrg({
      code: `${prefix}_duplicate`,
      employeeCodePrefix: createTestEmployeeCodePrefix(),
      name: `${prefix}_One`,
      rootOrgName: `${prefix}_One`
    })

    await expect(
      tenantRepository.createWithRootOrg({
        code: `${prefix}_duplicate`,
        employeeCodePrefix: createTestEmployeeCodePrefix(),
        name: `${prefix}_Two`,
        rootOrgName: `${prefix}_Two`
      })
    ).rejects.toThrow()
  })
})
