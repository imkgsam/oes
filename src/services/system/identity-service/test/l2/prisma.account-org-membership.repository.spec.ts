import { PrismaAccountOrgMembershipRepository } from '../../src/infrastructure/repositories/prisma/prisma.account-org-membership.repository'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'

describe('PrismaAccountOrgMembershipRepository L2', () => {
  let prisma: PrismaService
  let repository: PrismaAccountOrgMembershipRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    repository = new PrismaAccountOrgMembershipRepository(prisma)
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

  async function seedOrgContext() {
    const tenant = await prisma.tenant.create({
      data: {
        id: `${prefix}_tenant`,
        name: `${prefix}_tenant_name`,
        code: `${prefix}_tenant_code`
      }
    })

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

    const orgA = await prisma.org.create({
      data: {
        id: `${prefix}_org_a`,
        tenantId: tenant.id,
        name: `${prefix}_org_a`,
        code: `${prefix}_org_a`,
        type: 'DEPARTMENT',
        createdBy: account.id
      }
    })

    const orgB = await prisma.org.create({
      data: {
        id: `${prefix}_org_b`,
        tenantId: tenant.id,
        name: `${prefix}_org_b`,
        code: `${prefix}_org_b`,
        type: 'TEAM',
        createdBy: account.id
      }
    })

    return { tenant, user, account, orgA, orgB }
  }

  it('AccountOrgMembership 仓储 / 当新增附属组织归属时 / 应能按账户列出并带组织信息', async () => {
    const { account, orgA } = await seedOrgContext()

    const membership = await repository.addSecondaryMembership(account.id, orgA.id)
    const listed = await repository.listByAccountId(account.id)

    expect(membership.relationType).toBe('SECONDARY')
    expect(listed).toHaveLength(1)
    expect(listed[0]).toMatchObject({
      id: membership.id,
      orgId: orgA.id,
      orgName: orgA.name,
      orgType: 'DEPARTMENT'
    })
  })

  it('AccountOrgMembership 仓储 / 当切换主组织时 / 应清理旧主组织并保留新主组织', async () => {
    const { account, orgA, orgB } = await seedOrgContext()

    const first = await repository.setPrimaryOrg(account.id, orgA.id)
    const second = await repository.setPrimaryOrg(account.id, orgB.id)
    const listed = await repository.listByAccountId(account.id)

    expect(first.isPrimary).toBe(true)
    expect(second.isPrimary).toBe(true)
    expect(listed.find((membership) => membership.orgId === orgA.id)?.isPrimary).toBe(false)
    expect(listed.find((membership) => membership.orgId === orgB.id)?.isPrimary).toBe(true)
    expect(listed.find((membership) => membership.orgId === orgB.id)?.relationType).toBe('PRIMARY')
  })

  it('AccountOrgMembership 仓储 / 当清空主组织时 / 应移除主标记并改回 SECONDARY', async () => {
    const { account, orgA } = await seedOrgContext()

    await repository.setPrimaryOrg(account.id, orgA.id)
    await repository.clearPrimaryByAccountId(account.id)
    const listed = await repository.listByAccountId(account.id)

    expect(listed[0]).toMatchObject({
      orgId: orgA.id,
      isPrimary: false,
      relationType: 'SECONDARY'
    })
  })

  it('AccountOrgMembership 仓储 / 当删除归属关系时 / 应返回被删除记录', async () => {
    const { account, orgA } = await seedOrgContext()

    const added = await repository.addSecondaryMembership(account.id, orgA.id)
    const removed = await repository.removeMembership(account.id, orgA.id)
    const after = await repository.findByAccountAndOrg(account.id, orgA.id)

    expect(removed?.id).toBe(added.id)
    expect(after).toBeNull()
  })

  it('AccountOrgMembership 仓储 / 当附加 tenant scope 与账户所属租户不匹配时 / 应返回空结果', async () => {
    const { account, orgA } = await seedOrgContext()
    const otherTenant = await prisma.tenant.create({
      data: {
        id: `${prefix}_tenant_other`,
        name: `${prefix}_tenant_name_other`,
        code: `${prefix}_tenant_code_other`
      }
    })

    await repository.addSecondaryMembership(account.id, orgA.id)

    const listed = await repository.listByAccountId(account.id, {
      tenantId: otherTenant.id
    })

    expect(listed).toEqual([])
  })
})
