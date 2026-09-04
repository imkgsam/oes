import {
  PolicyInstance,
  PolicyTemplateInstanceReader
} from '../application/authorization/resource-policy'
import { PolicyTemplateInstanceRepository } from '../domain/repositories/policy-template-instance.repository'
import { PolicyTemplateInstanceMapper } from '../infrastructure/mappers/policy-template-instance.mapper'
import { PrismaPolicyTemplateInstanceRepository } from '../infrastructure/repositories/prisma/prisma.policy-template-instance.repository'

const instance: PolicyInstance = {
  id: 'instance-1',
  tenantId: 'tenant-1',
  subjectSelector: {
    type: 'ACCOUNT',
    accountId: 'account-1'
  },
  permissionCode: 'procurement.purchase.create',
  resourceType: 'item',
  templateCode: 'resource-field-in-set',
  effect: 'ALLOW',
  params: {
    field: 'categoryId',
    allowedValues: ['raw-material']
  },
  enabled: true,
  priority: 10,
  createdBy: 'operator-1',
  updatedBy: 'operator-1',
  createdAt: '2026-05-16T00:00:00.000Z',
  updatedAt: '2026-05-16T00:00:00.000Z'
}

function createPrismaMock() {
  return {
    policyInstance: {
      count: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn()
    }
  }
}

/** createRepository constructs the Prisma-backed repository with a typed mock Prisma client. */
function createRepository(prisma = createPrismaMock()): PolicyTemplateInstanceRepository {
  return new PrismaPolicyTemplateInstanceRepository(prisma as any)
}

describe('Policy template instance storage', () => {
  it('mapper / ACCOUNT selector / 应映射为持久化 selector type 和 value', () => {
    const persistent = PolicyTemplateInstanceMapper.toPersistent(instance)

    expect(persistent).toEqual(
      expect.objectContaining({
        subjectSelectorType: 'ACCOUNT',
        subjectSelectorValue: 'account-1',
        templateCode: 'resource-field-in-set',
        isEnabled: true
      })
    )
  })

  it('mapper / TENANT_WIDE selector / 应保持 selector value 为空并可映射回 contract shape', () => {
    const domain = PolicyTemplateInstanceMapper.toDomain({
      ...PolicyTemplateInstanceMapper.toPersistent({
        ...instance,
        subjectSelector: { type: 'TENANT_WIDE' }
      }),
      subjectSelectorValue: null
    })

    expect(domain.subjectSelector).toEqual({ type: 'TENANT_WIDE' })
  })

  it('repository / 未知 templateCode / 应拒绝保存', async () => {
    const repository = createRepository()

    await expect(
      repository.save({
        ...instance,
        templateCode: 'tenant-custom-script'
      })
    ).rejects.toThrow('POLICY_TEMPLATE_NOT_FOUND')
  })

  it('repository / 无效 params / 应拒绝保存并避免自由 JSON 策略扩散', async () => {
    const repository = createRepository()

    await expect(
      repository.save({
        ...instance,
        params: {
          field: 'categoryId'
        }
      })
    ).rejects.toThrow('POLICY_TEMPLATE_PARAMS_INVALID')
  })

  it('repository / save / 应 upsert PolicyInstance 持久化记录', async () => {
    const prisma = createPrismaMock()
    prisma.policyInstance.upsert.mockResolvedValue(PolicyTemplateInstanceMapper.toPersistent(instance))
    const repository = createRepository(prisma)

    await repository.save(instance)

    expect(prisma.policyInstance.upsert).toHaveBeenCalledWith({
      where: { id: 'instance-1' },
      update: expect.objectContaining({
        tenantId: 'tenant-1',
        subjectSelectorType: 'ACCOUNT',
        subjectSelectorValue: 'account-1',
        templateCode: 'resource-field-in-set',
        isEnabled: true
      }),
      create: expect.objectContaining({
        id: 'instance-1',
        permissionCode: 'procurement.purchase.create',
        params: instance.params
      })
    })
  })

  it('repository / save update / 不应覆盖创建审计字段', async () => {
    const prisma = createPrismaMock()
    prisma.policyInstance.upsert.mockResolvedValue(PolicyTemplateInstanceMapper.toPersistent(instance))
    const repository = createRepository(prisma)

    await repository.save({
      ...instance,
      updatedBy: 'operator-2'
    })

    expect(prisma.policyInstance.upsert.mock.calls[0][0].update).not.toHaveProperty(
      'createdBy'
    )
    expect(prisma.policyInstance.upsert.mock.calls[0][0].update).not.toHaveProperty(
      'createdAt'
    )
    expect(prisma.policyInstance.upsert.mock.calls[0][0].update).toEqual(
      expect.objectContaining({
        updatedBy: 'operator-2'
      })
    )
  })

  it('repository / findEnabledForEvaluation / 应只查询启用且匹配 tenant permission resourceType 的 instance', async () => {
    const prisma = createPrismaMock()
    prisma.policyInstance.findMany.mockResolvedValue([
      PolicyTemplateInstanceMapper.toPersistent(instance)
    ])
    const repository = createRepository(prisma)

    const result = await repository.findEnabledForEvaluation({
      tenantId: 'tenant-1',
      permissionCode: 'procurement.purchase.create',
      resourceType: 'item'
    })

    expect(prisma.policyInstance.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        permissionCode: 'procurement.purchase.create',
        isEnabled: true,
        OR: [{ resourceType: null }, { resourceType: 'item' }]
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
    })
    expect(result[0]).toEqual(instance)
  })

  it('repository / listForManagement / 应按管理筛选分页查询 PolicyInstance', async () => {
    const prisma = createPrismaMock()
    prisma.policyInstance.count.mockResolvedValue(1)
    prisma.policyInstance.findMany.mockResolvedValue([
      PolicyTemplateInstanceMapper.toPersistent(instance)
    ])
    const repository = createRepository(prisma)

    const result = await repository.listForManagement({
      tenantId: 'tenant-1',
      permissionCode: 'procurement.purchase.create',
      resourceType: 'item',
      templateCode: 'resource-field-in-set',
      enabled: true,
      page: 2,
      pageSize: 10
    })

    expect(prisma.policyInstance.count).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        permissionCode: 'procurement.purchase.create',
        resourceType: 'item',
        templateCode: 'resource-field-in-set',
        isEnabled: true
      }
    })
    expect(prisma.policyInstance.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        permissionCode: 'procurement.purchase.create',
        resourceType: 'item',
        templateCode: 'resource-field-in-set',
        isEnabled: true
      },
      orderBy: [{ createdAt: 'desc' }, { priority: 'desc' }],
      skip: 10,
      take: 10
    })
    expect(result).toEqual({
      items: [instance],
      total: 1,
      page: 2,
      pageSize: 10
    })
  })

  it('reader / listEnabledPolicyInstances / 应从 evaluator request 中提取查询条件', async () => {
    const repository: jest.Mocked<PolicyTemplateInstanceRepository> = {
      findById: jest.fn(),
      findEnabledForEvaluation: jest.fn().mockResolvedValue([instance]),
      listForManagement: jest.fn(),
      save: jest.fn()
    }
    const reader = new PolicyTemplateInstanceReader(repository)

    const result = await reader.listEnabledPolicyInstances({
      subject: {
        accountId: 'account-1',
        tenantId: 'tenant-1',
        roleIds: []
      },
      permissionCode: 'procurement.purchase.create',
      resource: {
        tenantId: 'tenant-1',
        resourceType: 'item'
      }
    })

    expect(repository.findEnabledForEvaluation).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      permissionCode: 'procurement.purchase.create',
      resourceType: 'item'
    })
    expect(result).toEqual([instance])
  })
})
