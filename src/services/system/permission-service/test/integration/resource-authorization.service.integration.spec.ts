import { randomUUID } from 'crypto'
import {
  PolicyTemplateInstanceAuthorizationService,
  PolicyTemplateInstanceReader
} from '../../src/application/authorization/resource-policy'
import { ResourceAuthorizationService } from '../../src/application/authorization/resource-authorization.service'
import { PrismaPolicyTemplateInstanceRepository } from '../../src/infrastructure/repositories/prisma/prisma.policy-template-instance.repository'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'

describe('ResourceAuthorizationService Integration', () => {
  let prisma: PrismaService
  let service: ResourceAuthorizationService
  let repository: PrismaPolicyTemplateInstanceRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    repository = new PrismaPolicyTemplateInstanceRepository(prisma)
    service = new ResourceAuthorizationService(
      new PolicyTemplateInstanceAuthorizationService(new PolicyTemplateInstanceReader(repository))
    )
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

  /** createCategoryPolicy saves one ACCOUNT policy instance for category-based resource authorization. */
  async function createCategoryPolicy(permissionCode: string) {
    await repository.save({
      id: randomUUID(),
      tenantId: `${prefix}_tenant`,
      subjectSelector: {
        type: 'ACCOUNT',
        accountId: `${prefix}_account`
      },
      permissionCode,
      resourceType: 'item',
      templateCode: 'resource-field-in-set',
      effect: 'ALLOW',
      params: {
        field: 'categoryId',
        allowedValues: [`${prefix}_category_a`, `${prefix}_category_b`]
      },
      enabled: true,
      priority: 10,
      createdBy: `${prefix}_operator`,
      updatedBy: `${prefix}_operator`,
      createdAt: '2026-05-16T00:00:00.000Z',
      updatedAt: '2026-05-16T00:00:00.000Z'
    })
  }

  it('checkResource / repository-backed facade / 应按已存储 PolicyInstance 返回允许或拒绝', async () => {
    const permissionCode = `${prefix}_permission_check_resource`
    await createPermission(permissionCode)
    await createCategoryPolicy(permissionCode)

    await expect(
      service.checkResource({
        subject: {
          accountId: `${prefix}_account`,
          tenantId: `${prefix}_tenant`,
          roleIds: []
        },
        permissionCode,
        resource: {
          tenantId: `${prefix}_tenant`,
          resourceType: 'item',
          categoryId: `${prefix}_category_a`
        }
      })
    ).resolves.toEqual(
      expect.objectContaining({
        allowed: true,
        reasonCode: 'POLICY_ALLOW_MATCHED'
      })
    )

    await expect(
      service.checkResource({
        subject: {
          accountId: `${prefix}_account`,
          tenantId: `${prefix}_tenant`,
          roleIds: []
        },
        permissionCode,
        resource: {
          tenantId: `${prefix}_tenant`,
          resourceType: 'item',
          categoryId: `${prefix}_category_c`
        }
      })
    ).resolves.toEqual(
      expect.objectContaining({
        allowed: false,
        reasonCode: 'POLICY_NO_ALLOW_MATCHED'
      })
    )
  })

  it('buildQueryScope / repository-backed facade / 应从已存储 PolicyInstance 编译结构化 scope', async () => {
    const permissionCode = `${prefix}_permission_build_scope`
    await createPermission(permissionCode)
    await createCategoryPolicy(permissionCode)

    const result = await service.buildQueryScope({
      subject: {
        accountId: `${prefix}_account`,
        tenantId: `${prefix}_tenant`,
        roleIds: []
      },
      permissionCode,
      resourceType: 'item'
    })

    expect(result).toEqual(
      expect.objectContaining({
        allowed: true,
        reasonCode: 'POLICY_ALLOW_MATCHED',
        scope: {
          field: 'categoryId',
          op: 'IN',
          value: [`${prefix}_category_a`, `${prefix}_category_b`]
        }
      })
    )
  })
})
