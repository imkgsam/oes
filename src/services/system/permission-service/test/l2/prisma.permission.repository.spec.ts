import { randomUUID } from 'crypto'
import { PrismaPermissionRepository } from '../../src/infrastructure/repositories/prisma/prisma.permission.repository'
import { Permission } from '../../src/domain/aggregates/permission.aggregate'
import { PermissionModule } from '../../src/domain/enums/permission-module.enum'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'

describe('PrismaPermissionRepository L2', () => {
  let prisma: PrismaService
  let repository: PrismaPermissionRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    repository = new PrismaPermissionRepository(prisma)
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

  it('Permission 仓储 / 当保存新权限时 / 应正确落库并可按 id 与 code 查询', async () => {
    const permission = new Permission(
      randomUUID(),
      `${prefix}_permission_read`,
      PermissionModule.PERMISSION_SERVICE,
      'integration save permission'
    )

    const saved = await repository.save(permission)
    const byId = await repository.findById(saved.id)
    const byCode = await repository.findByCode(saved.code)

    expect(saved.code).toBe(permission.code)
    expect(byId?.id).toBe(saved.id)
    expect(byCode?.code).toBe(saved.code)
  })

  it('Permission 仓储 / 当插入重复 code 时 / 应触发唯一约束失败', async () => {
    const code = `${prefix}_permission_duplicate`

    await repository.save(
      new Permission(randomUUID(), code, PermissionModule.PERMISSION_SERVICE, 'first permission')
    )

    await expect(
      repository.save(
        new Permission(randomUUID(), code, PermissionModule.PERMISSION_SERVICE, 'second permission')
      )
    ).rejects.toBeTruthy()
  })

  it('权限分页查询 / 当按 module 过滤时 / 应返回正确结果', async () => {
    await repository.createMany([
      new Permission(
        randomUUID(),
        `${prefix}_permission_module_auth`,
        PermissionModule.AUTH_SERVICE,
        'auth module permission'
      ),
      new Permission(
        randomUUID(),
        `${prefix}_permission_module_perm`,
        PermissionModule.PERMISSION_SERVICE,
        'permission module permission'
      )
    ])

    const result = await repository.findPaged({
      page: 1,
      pageSize: 20,
      module: PermissionModule.PERMISSION_SERVICE
    })

    expect(result.permissions.every((permission) => permission.module === PermissionModule.PERMISSION_SERVICE)).toBe(true)
    expect(result.permissions.some((permission) => permission.code === `${prefix}_permission_module_perm`)).toBe(true)
    expect(result.permissions.some((permission) => permission.code === `${prefix}_permission_module_auth`)).toBe(false)
  })

  it('权限分页查询 / 当按 keyword 过滤时 / 应返回正确结果', async () => {
    await repository.createMany([
      new Permission(
        randomUUID(),
        `${prefix}_permission_keyword_target`,
        PermissionModule.PERMISSION_SERVICE,
        'target keyword description'
      ),
      new Permission(
        randomUUID(),
        `${prefix}_permission_keyword_other`,
        PermissionModule.PERMISSION_SERVICE,
        'other description'
      )
    ])

    const result = await repository.findPaged({
      page: 1,
      pageSize: 20,
      keyword: 'target'
    })

    expect(result.permissions.some((permission) => permission.code === `${prefix}_permission_keyword_target`)).toBe(true)
    expect(result.permissions.some((permission) => permission.code === `${prefix}_permission_keyword_other`)).toBe(false)
  })

  it('删除权限前检查 / 当存在角色关联时 / 应识别为禁止删除', async () => {
    const permission = await repository.save(
      new Permission(
        randomUUID(),
        `${prefix}_permission_role_ref`,
        PermissionModule.PERMISSION_SERVICE,
        'permission referenced by role'
      )
    )

    const role = await prisma.role.create({
      data: {
        id: randomUUID(),
        tenantId: null,
        scopeKey: '__SYSTEM__',
        code: `${prefix}_role_admin`,
        name: 'Integration Admin',
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

    const result = await repository.hasAssignedRoles(permission.id)

    expect(result).toBe(true)
  })

  it('删除权限前检查 / 当存在 policy 关联时 / 应识别为禁止删除', async () => {
    const permission = await repository.save(
      new Permission(
        randomUUID(),
        `${prefix}_permission_policy_ref`,
        PermissionModule.PERMISSION_SERVICE,
        'permission referenced by policy'
      )
    )

    await prisma.policy.create({
      data: {
        id: randomUUID(),
        name: `${prefix}_policy_ref`,
        tenantId: null,
        effect: 'ALLOW',
        subjectType: 'ANY',
        subjectId: null,
        permissionCode: permission.code,
        resourceType: null,
        priority: 0,
        isEnabled: true
      }
    })

    const result = await repository.hasAttachedPolicies(permission.code)

    expect(result).toBe(true)
  })

  it('删除权限前检查 / 当存在 PolicyInstance 关联时 / 应识别为禁止删除', async () => {
    const permission = await repository.save(
      new Permission(
        randomUUID(),
        `${prefix}_permission_policy_instance_ref`,
        PermissionModule.PERMISSION_SERVICE,
        'permission referenced by policy instance'
      )
    )

    await prisma.policyInstance.create({
      data: {
        id: randomUUID(),
        tenantId: `${prefix}_tenant`,
        subjectSelectorType: 'ACCOUNT',
        subjectSelectorValue: `${prefix}_account`,
        permissionCode: permission.code,
        resourceType: 'item',
        templateCode: 'resource-field-in-set',
        effect: 'ALLOW',
        params: {
          field: 'categoryId',
          allowedValues: [`${prefix}_category`]
        },
        priority: 0,
        isEnabled: true,
        createdBy: `${prefix}_operator`,
        updatedBy: `${prefix}_operator`
      }
    })

    const result = await repository.hasAttachedPolicyInstances(permission.code)

    expect(result).toBe(true)
  })
})
