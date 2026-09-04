import { randomUUID } from 'crypto'
import { PrismaPolicyRepository } from '../../src/infrastructure/repositories/prisma/prisma.policy.repository'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { Policy } from '../../src/domain/aggregates/policy.aggregate'
import { PolicyEffect } from '../../src/domain/enums/policy-effect.enum'
import { PolicySubjectType } from '../../src/domain/enums/policy-subject-type.enum'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'

describe('PrismaPolicyRepository Integration', () => {
  let prisma: PrismaService
  let repository: PrismaPolicyRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    repository = new PrismaPolicyRepository(prisma)
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

  it('Policy 仓储 / 当保存新策略时 / 应正确落库并可按 id 查询', async () => {
    const permissionCode = `${prefix}_permission_policy_save`
    await createPermission(permissionCode)

    const policy = new Policy(
      randomUUID(),
      `${prefix}_policy_save`,
      PolicyEffect.ALLOW,
      5,
      PolicySubjectType.ROLE,
      'ADMIN',
      permissionCode,
      'document',
      'tenant-1',
      true,
      null,
      'policy save integration'
    )

    const saved = await repository.save(policy)
    const found = await repository.findById(saved.id)

    expect(saved.name).toBe(`${prefix}_policy_save`)
    expect(found?.permissionCode).toBe(permissionCode)
    expect(found?.priority).toBe(5)
  })

  it('Policy 查询 / 当按 permissionCode 和 tenant 查询时 / 应返回全局与租户策略并按优先级排序', async () => {
    const permissionCode = `${prefix}_permission_find_by_code`
    await createPermission(permissionCode)

    await prisma.policy.createMany({
      data: [
        {
          id: randomUUID(),
          name: `${prefix}_policy_global`,
          tenantId: null,
          effect: 'ALLOW',
          subjectType: 'ANY',
          subjectId: null,
          permissionCode,
          resourceType: null,
          priority: 1,
          isEnabled: true
        },
        {
          id: randomUUID(),
          name: `${prefix}_policy_tenant`,
          tenantId: 'tenant-1',
          effect: 'ALLOW',
          subjectType: 'ANY',
          subjectId: null,
          permissionCode,
          resourceType: null,
          priority: 10,
          isEnabled: true
        }
      ]
    })

    const result = await repository.findByPermissionCode(permissionCode, 'tenant-1')

    expect(result.map((policy) => policy.name)).toEqual([
      `${prefix}_policy_tenant`,
      `${prefix}_policy_global`
    ])
  })

  it('Policy 查询 / 当获取 applicable 策略时 / 应忽略禁用策略并返回全局加租户策略', async () => {
    const permissionCode = `${prefix}_permission_applicable`
    await createPermission(permissionCode)

    await prisma.policy.createMany({
      data: [
        {
          id: randomUUID(),
          name: `${prefix}_policy_disabled`,
          tenantId: null,
          effect: 'ALLOW',
          subjectType: 'ANY',
          subjectId: null,
          permissionCode,
          resourceType: null,
          priority: 100,
          isEnabled: false
        },
        {
          id: randomUUID(),
          name: `${prefix}_policy_global_enabled`,
          tenantId: null,
          effect: 'ALLOW',
          subjectType: 'ANY',
          subjectId: null,
          permissionCode,
          resourceType: null,
          priority: 1,
          isEnabled: true
        },
        {
          id: randomUUID(),
          name: `${prefix}_policy_tenant_enabled`,
          tenantId: 'tenant-1',
          effect: 'DENY',
          subjectType: 'ANY',
          subjectId: null,
          permissionCode,
          resourceType: null,
          priority: 20,
          isEnabled: true
        }
      ]
    })

    const result = await repository.findApplicable(permissionCode, 'tenant-1')

    expect(result.map((policy) => policy.name)).toEqual([
      `${prefix}_policy_tenant_enabled`,
      `${prefix}_policy_global_enabled`
    ])
  })

  it('Policy 分页查询 / 当按 keyword 和 isEnabled 过滤时 / 应返回正确结果', async () => {
    const permissionCode = `${prefix}_permission_paged`
    await createPermission(permissionCode)

    await prisma.policy.createMany({
      data: [
        {
          id: randomUUID(),
          name: `${prefix}_policy_target`,
          tenantId: 'tenant-1',
          effect: 'ALLOW',
          subjectType: 'ANY',
          subjectId: null,
          permissionCode,
          resourceType: null,
          priority: 1,
          isEnabled: true,
          description: 'target keyword'
        },
        {
          id: randomUUID(),
          name: `${prefix}_policy_other`,
          tenantId: 'tenant-1',
          effect: 'ALLOW',
          subjectType: 'ANY',
          subjectId: null,
          permissionCode,
          resourceType: null,
          priority: 1,
          isEnabled: false,
          description: 'other keyword'
        }
      ]
    })

    const result = await repository.findPaged({
      page: 1,
      pageSize: 10,
      tenantId: 'tenant-1',
      isEnabled: true,
      keyword: 'target'
    })

    expect(result.total).toBe(1)
    expect(result.policies[0]?.name).toBe(`${prefix}_policy_target`)
  })

  it('Policy 分页查询 / 当按 subjectType 和 subjectId 过滤时 / 应只返回目标账号策略', async () => {
    const permissionCode = `${prefix}_permission_subject_account`
    await createPermission(permissionCode)

    await prisma.policy.createMany({
      data: [
        {
          id: randomUUID(),
          name: `${prefix}_policy_target_account`,
          tenantId: 'tenant-1',
          effect: 'ALLOW',
          subjectType: 'ACCOUNT',
          subjectId: 'account-target',
          permissionCode,
          resourceType: null,
          priority: 10,
          isEnabled: true
        },
        {
          id: randomUUID(),
          name: `${prefix}_policy_other_account`,
          tenantId: 'tenant-1',
          effect: 'ALLOW',
          subjectType: 'ACCOUNT',
          subjectId: 'account-other',
          permissionCode,
          resourceType: null,
          priority: 5,
          isEnabled: true
        },
        {
          id: randomUUID(),
          name: `${prefix}_policy_any_subject`,
          tenantId: 'tenant-1',
          effect: 'ALLOW',
          subjectType: 'ANY',
          subjectId: null,
          permissionCode,
          resourceType: null,
          priority: 1,
          isEnabled: true
        }
      ]
    })

    const result = await repository.findPaged({
      page: 1,
      pageSize: 10,
      subjectType: PolicySubjectType.ACCOUNT,
      subjectId: 'account-target'
    })

    expect(result.total).toBe(1)
    expect(result.policies[0]?.name).toBe(`${prefix}_policy_target_account`)
  })
})
