import { PrismaApiKeyRepository } from '../../src/infrastructure/repositories/prisma/prisma.api-key.repository'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { API_KEY_STATUSES, MACHINE_PRINCIPAL_SCOPE_LEVELS, MACHINE_PRINCIPAL_TYPES } from '../../src/common/constants'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'
import { seedMachineServiceAccount } from '../helpers/machine-fixtures'

describe('PrismaApiKeyRepository Integration', () => {
  let prisma: PrismaService
  let repository: PrismaApiKeyRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    repository = new PrismaApiKeyRepository(prisma)
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

  it('APIKey 仓储 / 当创建 APIKey 时 / 应能按 id 查到并列出', async () => {
    const serviceAccount = await seedMachineServiceAccount(prisma, prefix)

    const created = await repository.create({
      serviceAccountId: serviceAccount.id,
      keyCode: `${prefix}_key_code`,
      hashedValue: `${prefix}_hash`,
      createdBy: `${prefix}_operator`
    })

    const found = await repository.findById(created.id)
    const foundByHash = await repository.findByHashedValue(`${prefix}_hash`)
    const listed = await repository.listByServiceAccountId(serviceAccount.id)

    expect(found).toMatchObject({
      id: created.id,
      serviceAccountId: serviceAccount.id,
      keyCode: `${prefix}_key_code`,
      status: API_KEY_STATUSES.ACTIVE
    })
    expect(foundByHash?.id).toBe(created.id)
    expect(listed.map((item) => item.id)).toEqual([created.id])
  })

  it('APIKey 仓储 / 当撤销 APIKey 时 / 应更新状态与 revoked metadata', async () => {
    const serviceAccount = await seedMachineServiceAccount(prisma, prefix)
    const created = await repository.create({
      serviceAccountId: serviceAccount.id,
      keyCode: `${prefix}_key_code_revoke`,
      hashedValue: `${prefix}_hash_revoke`,
      createdBy: `${prefix}_creator`
    })

    const revoked = await repository.revoke({
      apiKeyId: created.id,
      revokedBy: `${prefix}_operator`
    })

    expect(revoked.status).toBe(API_KEY_STATUSES.REVOKED)
    expect(revoked.revokedAt).not.toBeNull()
    expect(revoked.revokedBy).toBe(`${prefix}_operator`)
  })

  it('APIKey 仓储 / 当刷新 lastUsedAt 时 / 应更新最后使用时间', async () => {
    const serviceAccount = await seedMachineServiceAccount(prisma, prefix)
    const created = await repository.create({
      serviceAccountId: serviceAccount.id,
      keyCode: `${prefix}_key_code_touch`,
      hashedValue: `${prefix}_hash_touch`,
      createdBy: `${prefix}_creator`
    })

    const touched = await repository.touchLastUsed({
      apiKeyId: created.id,
      usedAt: new Date('2026-03-28T06:00:00.000Z')
    })

    expect(touched.lastUsedAt).toEqual(new Date('2026-03-28T06:00:00.000Z'))
  })

  it('APIKey 仓储 / 当附加 tenant scope 与 service account 所属租户不匹配时 / 应返回空结果', async () => {
    const tenant = { id: `${prefix}_tenant` }
    const otherTenant = { id: `${prefix}_tenant_other` }
    const serviceAccount = await prisma.serviceAccount.create({
      data: {
        id: `${prefix}_service_account_tenant`,
        tenantId: tenant.id,
        scopeLevel: MACHINE_PRINCIPAL_SCOPE_LEVELS.TENANT,
        type: MACHINE_PRINCIPAL_TYPES.AI_AGENT,
        name: `${prefix}_tenant_scoped_account`
      }
    })

    await repository.create({
      serviceAccountId: serviceAccount.id,
      keyCode: `${prefix}_scoped_key_code`,
      hashedValue: `${prefix}_scoped_hash`,
      createdBy: `${prefix}_operator`
    })

    const listed = await repository.listByServiceAccountId(serviceAccount.id, {
      tenantId: otherTenant.id
    })

    expect(listed).toEqual([])
  })
})
