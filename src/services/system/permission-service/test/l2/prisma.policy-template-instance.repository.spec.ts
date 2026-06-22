import { randomUUID } from 'crypto'
import { PolicyInstance } from '../../src/application/authorization/resource-policy'
import { PrismaPolicyTemplateInstanceRepository } from '../../src/infrastructure/repositories/prisma/prisma.policy-template-instance.repository'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'

describe('PrismaPolicyTemplateInstanceRepository L2', () => {
  let prisma: PrismaService
  let repository: PrismaPolicyTemplateInstanceRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    repository = new PrismaPolicyTemplateInstanceRepository(prisma)
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

  /** createPermission inserts the permission catalog row required by policy instance FK constraints. */
  async function createPermission(code: string) {
    return prisma.permission.create({
      data: {
        id: randomUUID(),
        code,
        module: 'PERMISSION_SERVICE'
      }
    })
  }

  /** createInstance builds a complete policy instance for repository integration tests. */
  function createInstance(permissionCode: string, overrides: Partial<PolicyInstance> = {}): PolicyInstance {
    return {
      id: overrides.id ?? randomUUID(),
      tenantId: overrides.tenantId ?? `${prefix}_tenant`,
      subjectSelector: overrides.subjectSelector ?? {
        type: 'ACCOUNT',
        accountId: `${prefix}_account`
      },
      permissionCode,
      resourceType: overrides.resourceType ?? 'item',
      templateCode: overrides.templateCode ?? 'resource-field-in-set',
      effect: overrides.effect ?? 'ALLOW',
      params: overrides.params ?? {
        field: 'categoryId',
        allowedValues: [`${prefix}_category`]
      },
      enabled: overrides.enabled ?? true,
      priority: overrides.priority ?? 10,
      createdBy: overrides.createdBy ?? `${prefix}_operator`,
      updatedBy: overrides.updatedBy ?? `${prefix}_operator`,
      createdAt: overrides.createdAt ?? '2026-05-16T00:00:00.000Z',
      updatedAt: overrides.updatedAt ?? '2026-05-16T00:00:00.000Z'
    }
  }

  it('PolicyInstance 仓储 / 保存后 / 应可按 id 查询并保持 selector 与 params', async () => {
    const permissionCode = `${prefix}_permission_instance_save`
    await createPermission(permissionCode)

    const saved = await repository.save(createInstance(permissionCode))
    const found = await repository.findById(saved.id)

    expect(found).toEqual(
      expect.objectContaining({
        id: saved.id,
        tenantId: `${prefix}_tenant`,
        subjectSelector: {
          type: 'ACCOUNT',
          accountId: `${prefix}_account`
        },
        permissionCode,
        templateCode: 'resource-field-in-set',
        enabled: true
      })
    )
    expect(found?.params).toEqual({
      field: 'categoryId',
      allowedValues: [`${prefix}_category`]
    })
  })

  it('PolicyInstance 查询 / evaluation 查询 / 应返回启用且 resourceType 匹配或为空的 instance', async () => {
    const permissionCode = `${prefix}_permission_instance_eval`
    await createPermission(permissionCode)

    const target = await repository.save(createInstance(permissionCode, { priority: 20 }))
    const allResources = await repository.save(
      createInstance(permissionCode, {
        id: randomUUID(),
        resourceType: undefined,
        subjectSelector: { type: 'TENANT_WIDE' },
        priority: 5
      })
    )
    await repository.save(
      createInstance(permissionCode, {
        id: randomUUID(),
        resourceType: 'warehouse',
        priority: 50
      })
    )
    await repository.save(
      createInstance(permissionCode, {
        id: randomUUID(),
        enabled: false,
        priority: 100
      })
    )

    const result = await repository.findEnabledForEvaluation({
      tenantId: `${prefix}_tenant`,
      permissionCode,
      resourceType: 'item'
    })

    expect(result.map((instance) => instance.id)).toEqual([target.id, allResources.id])
  })

  it('PolicyInstance 查询 / management 查询 / 应支持按 subject selector 过滤', async () => {
    const permissionCode = `${prefix}_permission_instance_subject_filter`
    await createPermission(permissionCode)

    const accountInstance = await repository.save(
      createInstance(permissionCode, {
        subjectSelector: {
          type: 'ACCOUNT',
          accountId: `${prefix}_account_target`
        }
      })
    )
    await repository.save(
      createInstance(permissionCode, {
        id: randomUUID(),
        subjectSelector: {
          type: 'ACCOUNT',
          accountId: `${prefix}_account_other`
        }
      })
    )
    await repository.save(
      createInstance(permissionCode, {
        id: randomUUID(),
        subjectSelector: {
          type: 'ROLE',
          roleId: `${prefix}_role`
        }
      })
    )

    const result = await repository.listForManagement({
      tenantId: `${prefix}_tenant`,
      subjectSelectorType: 'ACCOUNT',
      subjectSelectorValue: `${prefix}_account_target`,
      page: 1,
      pageSize: 20
    })

    expect(result.items.map((instance) => instance.id)).toEqual([accountInstance.id])
    expect(result.total).toBe(1)
  })
})
