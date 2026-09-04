import { randomUUID } from 'crypto'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'

describe('Permission Service Database Constraints Integration', () => {
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
    if (prisma) {
      await cleanupByPrefix(prisma, prefix)
    }
  })

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  it('RolePermission 唯一约束 / 当插入重复角色权限关系时 / 应失败', async () => {
    const permission = await prisma.permission.create({
      data: {
        id: randomUUID(),
        code: `${prefix}_permission_unique_rp`,
        module: 'PERMISSION_SERVICE'
      }
    })

    const role = await prisma.role.create({
      data: {
        id: randomUUID(),
        tenantId: null,
        scopeKey: '__SYSTEM__',
        code: `${prefix}_role_unique_rp`,
        name: 'Unique RP Role',
        kind: 'SYSTEM_TEMPLATE',
        templateRoleId: null,
        isEnabled: true
      }
    })

    await prisma.rolePermission.create({
      data: {
        id: randomUUID(),
        roleId: role.id,
        permissionId: permission.id
      }
    })

    await expect(
      prisma.rolePermission.create({
        data: {
          id: randomUUID(),
          roleId: role.id,
          permissionId: permission.id
        }
      })
    ).rejects.toBeTruthy()
  })

  it('Policy 关联约束 / 当 permissionCode 无效时 / 应拒绝保存', async () => {
    await expect(
      prisma.policy.create({
        data: {
          id: randomUUID(),
          name: `${prefix}_policy_invalid_permission`,
          tenantId: null,
          effect: 'ALLOW',
          subjectType: 'ANY',
          subjectId: null,
          permissionCode: `${prefix}_permission_missing`,
          resourceType: null,
          priority: 0,
          isEnabled: true
        }
      })
    ).rejects.toBeTruthy()
  })
})
