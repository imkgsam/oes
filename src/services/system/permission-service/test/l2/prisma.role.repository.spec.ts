import { randomUUID } from 'crypto'
import { PrismaRoleRepository } from '../../src/infrastructure/repositories/prisma/prisma.role.repository'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { Role } from '../../src/domain/aggregates/role.aggregate'
import { PermissionModule } from '../../src/domain/enums/permission-module.enum'
import { RoleKind } from '../../src/domain/enums/role-kind.enum'
import { AccountType } from '../../src/domain/enums/account-type.enum'
import { ScopeLevel } from '../../src/domain/enums/scope-level.enum'
import { RolePermission } from '../../src/domain/vo/role-permission.value-object'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'

describe('PrismaRoleRepository L2', () => {
  let prisma: PrismaService
  let repository: PrismaRoleRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    repository = new PrismaRoleRepository(prisma)
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

  async function createPermission(code: string) {
    return prisma.permission.create({
      data: {
        id: randomUUID(),
        code,
        module: 'PERMISSION_SERVICE'
      }
    })
  }

  it('Role 仓储 / 当保存带权限的角色时 / 应正确持久化并回读权限', async () => {
    const permission = await createPermission(`${prefix}_permission_role_save`)
    const role = new Role(
      randomUUID(),
      'Integration Admin',
      `${prefix}_role_save`,
      null,
      RoleKind.SYSTEM_TEMPLATE,
      true,
      'role save integration',
      null,
      [new RolePermission('temp-role-id', permission.id, permission.code)]
    )

    ;(role as any)._permissions = [new RolePermission(role.id, permission.id, permission.code)]

    const saved = await repository.save(role)
    const found = await repository.findById(saved.id)

    expect(found?.code).toBe(`${prefix}_role_save`)
    expect(found?.permissions).toHaveLength(1)
    expect(found?.permissions[0]?.permissionCode).toBe(permission.code)
  })

  it('角色模板查询 / 当按 keyword 查询时 / 应只返回系统模板角色', async () => {
    await prisma.role.createMany({
      data: [
        {
          id: randomUUID(),
          tenantId: null,
          scopeKey: '__SYSTEM__',
          code: `${prefix}_role_template_target`,
          name: 'Target Template',
          kind: 'SYSTEM_TEMPLATE',
          templateRoleId: null,
          isEnabled: true
        },
        {
          id: randomUUID(),
          tenantId: 'tenant-1',
          scopeKey: 'tenant-1',
          code: `${prefix}_role_instance_target`,
          name: 'Target Instance',
          kind: 'TENANT_INSTANCE',
          templateRoleId: null,
          isEnabled: true
        }
      ]
    })

    const result = await repository.findRoleTemplates({
      page: 1,
      pageSize: 10,
      keyword: 'target'
    })

    expect(result.total).toBe(1)
    expect(result.roles[0]?.kind).toBe(RoleKind.SYSTEM_TEMPLATE)
  })

  it('角色实例查询 / 当按 tenantId 查询时 / 应只返回对应租户角色', async () => {
    await prisma.role.createMany({
      data: [
        {
          id: randomUUID(),
          tenantId: 'tenant-1',
          scopeKey: 'tenant-1',
          code: `${prefix}_role_instance_t1`,
          name: 'Tenant One Role',
          kind: 'TENANT_INSTANCE',
          templateRoleId: null,
          isEnabled: true
        },
        {
          id: randomUUID(),
          tenantId: 'tenant-2',
          scopeKey: 'tenant-2',
          code: `${prefix}_role_instance_t2`,
          name: 'Tenant Two Role',
          kind: 'TENANT_INSTANCE',
          templateRoleId: null,
          isEnabled: true
        }
      ]
    })

    const result = await repository.findRoleInstances({
      page: 1,
      pageSize: 10,
      tenantId: 'tenant-1'
    })

    expect(result.total).toBe(1)
    expect(result.roles[0]?.tenantId).toBe('tenant-1')
  })

  it('账号角色查询 / 当账号绑定启用角色时 / 应返回该角色', async () => {
    const role = await prisma.role.create({
      data: {
        id: randomUUID(),
        tenantId: 'tenant-1',
        scopeKey: 'tenant-1',
        code: `${prefix}_role_account_bound`,
        name: 'Bound Role',
        kind: 'TENANT_INSTANCE',
        templateRoleId: null,
        isEnabled: true
      }
    })

    await repository.assignAccountRole(
      `${prefix}_account_1`,
      role.id,
      'tenant-1',
      ScopeLevel.TENANT,
      AccountType.USER
    )

    const roles = await repository.findRolesForAccountId(`${prefix}_account_1`)

    expect(roles).toHaveLength(1)
    expect(roles[0]?.id).toBe(role.id)
  })

  it('账号角色替换 / 当替换角色集合时 / 应同步新增和移除并返回最新角色', async () => {
    const roleA = await prisma.role.create({
      data: {
        id: randomUUID(),
        tenantId: 'tenant-1',
        scopeKey: 'tenant-1',
        code: `${prefix}_role_replace_a`,
        name: 'Replace A',
        kind: 'TENANT_INSTANCE',
        templateRoleId: null,
        isEnabled: true
      }
    })
    const roleB = await prisma.role.create({
      data: {
        id: randomUUID(),
        tenantId: 'tenant-1',
        scopeKey: 'tenant-1',
        code: `${prefix}_role_replace_b`,
        name: 'Replace B',
        kind: 'TENANT_INSTANCE',
        templateRoleId: null,
        isEnabled: true
      }
    })

    await repository.assignAccountRole(
      `${prefix}_account_2`,
      roleA.id,
      'tenant-1',
      ScopeLevel.TENANT,
      AccountType.USER
    )

    const roles = await repository.replaceAccountRoles(
      `${prefix}_account_2`,
      'tenant-1',
      ScopeLevel.TENANT,
      AccountType.USER,
      [roleB.id]
    )

    expect(roles).toHaveLength(1)
    expect(roles[0]?.id).toBe(roleB.id)
  })
})
