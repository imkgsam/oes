import { randomUUID } from 'crypto'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'

describe('Identity Service Database Constraints L2', () => {
  let prisma: PrismaService
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
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

  it('UserAccountOrgMembership 唯一约束 / 当插入重复账户组织归属时 / 应失败', async () => {
    const { account, orgA } = await seedOrgContext()

    await prisma.userAccountOrgMembership.create({
      data: {
        id: randomUUID(),
        accountId: account.id,
        orgId: orgA.id,
        relationType: 'SECONDARY',
        isPrimary: false
      }
    })

    await expect(
      prisma.userAccountOrgMembership.create({
        data: {
          id: randomUUID(),
          accountId: account.id,
          orgId: orgA.id,
          relationType: 'SECONDARY',
          isPrimary: false
        }
      })
    ).rejects.toBeTruthy()
  })

  it('UserAccountOrgMembership 主组织部分唯一约束 / 当同一账户插入两个主组织时 / 应失败', async () => {
    const { account, orgA, orgB } = await seedOrgContext()

    await prisma.userAccountOrgMembership.create({
      data: {
        id: randomUUID(),
        accountId: account.id,
        orgId: orgA.id,
        relationType: 'PRIMARY',
        isPrimary: true
      }
    })

    await expect(
      prisma.userAccountOrgMembership.create({
        data: {
          id: randomUUID(),
          accountId: account.id,
          orgId: orgB.id,
          relationType: 'PRIMARY',
          isPrimary: true
        }
      })
    ).rejects.toBeTruthy()
  })
})
