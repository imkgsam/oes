import { PrismaServiceAccountRepository } from '../../src/infrastructure/repositories/prisma/prisma.service-account.repository'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import {
  MACHINE_PRINCIPAL_SCOPE_LEVELS,
  MACHINE_PRINCIPAL_STATUSES,
  MACHINE_PRINCIPAL_TYPES
} from '../../src/common/constants'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'

describe('PrismaServiceAccountRepository L2', () => {
  let prisma: PrismaService
  let repository: PrismaServiceAccountRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    repository = new PrismaServiceAccountRepository(prisma)
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

  async function seedTenant() {
    return prisma.tenant.create({
      data: {
        id: `${prefix}_tenant`,
        entityId: `${prefix}_tenant_entity`,
        name: `${prefix}_tenant_name`,
        code: `${prefix}_tenant_code`
      }
    })
  }

  it('ServiceAccount 浠撳偍 / 褰撳垱寤?tenant-scope service account 鏃? / 搴旇兘鍐欏叆骞舵寜 id 鏌ュ埌', async () => {
    const tenant = await seedTenant()

    const created = await repository.create({
      tenantId: tenant.id,
      scopeLevel: MACHINE_PRINCIPAL_SCOPE_LEVELS.TENANT,
      type: MACHINE_PRINCIPAL_TYPES.AI_AGENT,
      name: `${prefix}_assistant`,
      description: `${prefix}_assistant_desc`,
      createdBy: `${prefix}_operator`
    })

    const found = await repository.findById(created.id)

    expect(found).toMatchObject({
      id: created.id,
      tenantId: tenant.id,
      scopeLevel: MACHINE_PRINCIPAL_SCOPE_LEVELS.TENANT,
      type: MACHINE_PRINCIPAL_TYPES.AI_AGENT,
      name: `${prefix}_assistant`,
      description: `${prefix}_assistant_desc`,
      status: MACHINE_PRINCIPAL_STATUSES.ACTIVE,
      createdBy: `${prefix}_operator`
    })
  })

  it('ServiceAccount 浠撳偍 / 褰撳垱寤?system-scope service account 鏃? / 搴?tenantId 涓?null', async () => {
    const created = await repository.create({
      scopeLevel: MACHINE_PRINCIPAL_SCOPE_LEVELS.SYSTEM,
      type: MACHINE_PRINCIPAL_TYPES.INTERNAL_SERVICE,
      name: `${prefix}_system_agent`,
      description: `${prefix}_system_desc`,
      createdBy: `${prefix}_operator`
    })

    const found = await repository.findById(created.id)

    expect(found?.tenantId).toBeNull()
    expect(found?.scopeLevel).toBe(MACHINE_PRINCIPAL_SCOPE_LEVELS.SYSTEM)
    expect(found?.type).toBe(MACHINE_PRINCIPAL_TYPES.INTERNAL_SERVICE)
  })

  it('ServiceAccount 浠撳偍 / 褰撴寜 tenantId 鍜?status 鍒楀嚭鏃? / 搴斿彧杩斿洖鍖归厤璁板綍', async () => {
    const tenant = await seedTenant()
    const otherTenant = await prisma.tenant.create({
      data: {
        id: `${prefix}_tenant_other`,
        entityId: `${prefix}_tenant_entity_other`,
        name: `${prefix}_tenant_name_other`,
        code: `${prefix}_tenant_code_other`
      }
    })

    const target = await repository.create({
      tenantId: tenant.id,
      scopeLevel: MACHINE_PRINCIPAL_SCOPE_LEVELS.TENANT,
      type: MACHINE_PRINCIPAL_TYPES.AI_AGENT,
      name: `${prefix}_target`,
      createdBy: `${prefix}_operator`
    })

    const disabled = await repository.create({
      tenantId: tenant.id,
      scopeLevel: MACHINE_PRINCIPAL_SCOPE_LEVELS.TENANT,
      type: MACHINE_PRINCIPAL_TYPES.AUTOMATION_BOT,
      name: `${prefix}_disabled`,
      createdBy: `${prefix}_operator`
    })

    await repository.setStatus({
      serviceAccountId: disabled.id,
      status: MACHINE_PRINCIPAL_STATUSES.DISABLED,
      operatorId: `${prefix}_operator`
    })

    await repository.create({
      tenantId: otherTenant.id,
      scopeLevel: MACHINE_PRINCIPAL_SCOPE_LEVELS.TENANT,
      type: MACHINE_PRINCIPAL_TYPES.AI_AGENT,
      name: `${prefix}_other_tenant`,
      createdBy: `${prefix}_operator`
    })

    const listed = await repository.list({
      tenantId: tenant.id,
      status: MACHINE_PRINCIPAL_STATUSES.ACTIVE
    })

    expect(listed.map((item) => item.id)).toEqual([target.id])
  })

  it('ServiceAccount 浠撳偍 / 褰撶鐢?service account 鏃? / 搴旀洿鏂扮姸鎬佸拰 disabled metadata', async () => {
    const created = await repository.create({
      scopeLevel: MACHINE_PRINCIPAL_SCOPE_LEVELS.SYSTEM,
      type: MACHINE_PRINCIPAL_TYPES.INTERNAL_SERVICE,
      name: `${prefix}_system_agent`,
      createdBy: `${prefix}_creator`
    })

    const disabled = await repository.setStatus({
      serviceAccountId: created.id,
      status: MACHINE_PRINCIPAL_STATUSES.DISABLED,
      operatorId: `${prefix}_operator`
    })

    expect(disabled.status).toBe(MACHINE_PRINCIPAL_STATUSES.DISABLED)
    expect(disabled.disabledAt).not.toBeNull()
    expect(disabled.disabledBy).toBe(`${prefix}_operator`)
  })
})
