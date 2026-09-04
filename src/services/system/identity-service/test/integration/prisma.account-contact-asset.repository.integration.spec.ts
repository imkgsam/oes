import { randomUUID } from 'crypto'
import { PrismaAccountContactAssetRepository } from '../../src/infrastructure/repositories/prisma/prisma.account-contact-asset.repository'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'

describe('PrismaAccountContactAssetRepository Integration', () => {
  let prisma: PrismaService
  let repository: PrismaAccountContactAssetRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    repository = new PrismaAccountContactAssetRepository(prisma)
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

  async function seedAccountContext() {
    const tenant = { id: `${prefix}_tenant` }

    const user = await prisma.user.create({
      data: {
        id: `${prefix}_user`,
        username: `${prefix}_username`,
        email: `${prefix}@personal.local`
      }
    })

    const account = await prisma.userAccount.create({
      data: {
        id: `${prefix}_account`,
        tenantId: tenant.id,
        userId: user.id,
        contextKey: tenant.id,
        displayName: `${prefix}_display`
      }
    })

    return { tenant, user, account }
  }

  it('AccountContactAsset 仓储 / 当分配主工作邮箱后再次分配主工作邮箱时 / 应切换主邮箱标记', async () => {
    const { tenant, account } = await seedAccountContext()

    const first = await repository.assign({
      tenantId: tenant.id,
      accountId: account.id,
      type: 'WORK_EMAIL',
      value: `${prefix}@corp.local`,
      isPrimary: true,
      assignedBy: account.id
    })

    const second = await repository.assign({
      tenantId: tenant.id,
      accountId: account.id,
      type: 'WORK_EMAIL',
      value: `${prefix}_second@corp.local`,
      isPrimary: true,
      assignedBy: account.id
    })

    const listed = await repository.listByAccountIdAndType(account.id, 'WORK_EMAIL')

    expect(second.isPrimary).toBe(true)
    expect(listed.find((asset) => asset.id === first.id)?.isPrimary).toBe(false)
    expect(listed.find((asset) => asset.id === second.id)?.isPrimary).toBe(true)
  })

  it('AccountContactAsset 仓储 / 当存在当前有效资产时 / 应按租户和值查到最新资产', async () => {
    const { tenant, account } = await seedAccountContext()

    await repository.assign({
      tenantId: tenant.id,
      accountId: account.id,
      type: 'WORK_PHONE',
      value: `${prefix}-phone-1`,
      isPrimary: false,
      assignedBy: account.id
    })

    const latest = await repository.assign({
      tenantId: tenant.id,
      accountId: account.id,
      type: 'WORK_PHONE',
      value: `${prefix}-phone-2`,
      isPrimary: false,
      assignedBy: account.id
    })

    const current = await repository.findCurrentByTenantAndTypeAndValue(
      tenant.id,
      'WORK_PHONE',
      `${prefix}-phone-2`
    )

    expect(current?.id).toBe(latest.id)
    expect(current?.status).toBe('ACTIVE')
  })

  it('AccountContactAsset 仓储 / 当回收资产后 / 应更新状态并记录回收时间', async () => {
    const { tenant, account } = await seedAccountContext()

    const asset = await repository.assign({
      tenantId: tenant.id,
      accountId: account.id,
      type: 'WORK_EMAIL',
      value: `${prefix}_revoke@corp.local`,
      isPrimary: true,
      assignedBy: account.id
    })

    const revoked = await repository.revoke(asset.id, `${prefix}_operator`)

    expect(revoked.status).toBe('REVOKED')
    expect(revoked.isPrimary).toBe(false)
    expect(revoked.revokedAt).not.toBeNull()
  })

  it('AccountContactAsset 仓储 / 当设置主联系方式时 / 应清理同类型旧主标记', async () => {
    const { tenant, account } = await seedAccountContext()

    const first = await repository.assign({
      tenantId: tenant.id,
      accountId: account.id,
      type: 'WORK_PHONE',
      value: `${prefix}-primary-1`,
      isPrimary: true,
      assignedBy: account.id
    })

    const second = await repository.assign({
      tenantId: tenant.id,
      accountId: account.id,
      type: 'WORK_PHONE',
      value: `${prefix}-primary-2`,
      isPrimary: false,
      assignedBy: account.id
    })

    await repository.setPrimary(second.id)
    const listed = await repository.listByAccountIdAndType(account.id, 'WORK_PHONE')

    expect(listed.find((asset) => asset.id === first.id)?.isPrimary).toBe(false)
    expect(listed.find((asset) => asset.id === second.id)?.isPrimary).toBe(true)
  })

  it('AccountContactAsset 仓储 / 当附加 tenant scope 与账户所属租户不匹配时 / 应返回空结果', async () => {
    const { tenant, account } = await seedAccountContext()
    const otherTenant = { id: `${prefix}_tenant_other` }

    await repository.assign({
      tenantId: tenant.id,
      accountId: account.id,
      type: 'WORK_EMAIL',
      value: `${prefix}_scoped@corp.local`,
      isPrimary: true,
      assignedBy: account.id
    })

    const listed = await repository.listByAccountIdAndType(account.id, 'WORK_EMAIL', {
      tenantId: otherTenant.id
    })

    expect(listed).toEqual([])
  })
})
