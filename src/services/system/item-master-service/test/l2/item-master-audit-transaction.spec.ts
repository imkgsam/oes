import { randomUUID } from 'node:crypto'
import { GrpcRequestContextStore } from '@oes/common/authorization'
import { AuditEnvelope } from '@oes/common'
import { ItemMasterAuditWriter } from '../../src/application/ports/item-master-audit-writer.port'
import { ItemMasterAuditService } from '../../src/application/services/item-master-audit.service'
import { Item } from '../../src/domain/aggregates/item.aggregate'
import {
  ItemCapabilities,
  ItemNatureType,
  ItemStatus,
  ItemStructureType
} from '../../src/domain/value-objects/item.value-objects'
import { PrismaItemRepository } from '../../src/infrastructure/repositories/prisma/prisma-item.repository'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { cleanupByPrefix, createPrismaForIntegration, createTestPrefix } from '../helpers/integration-db'

/** FailOnceAuditWriter simulates one audit persistence failure so L2 can verify business data rolls back atomically. */
class FailOnceAuditWriter implements ItemMasterAuditWriter {
  private attempts = 0

  async append(_envelope: AuditEnvelope): Promise<void> {
    this.attempts += 1
    if (this.attempts === 1) {
      throw new Error('audit sink unavailable')
    }
  }
}

/** buildItem reconstitutes one item aggregate for audit transaction integration tests. */
function buildItem(input: {
  tenantId: string
  itemCode: string
  itemName: string
}): Item {
  return Item.reconstitute({
    id: randomUUID(),
    tenantId: input.tenantId,
    itemCode: input.itemCode,
    itemName: input.itemName,
    structureType: ItemStructureType.SINGLE,
    natureType: ItemNatureType.PHYSICAL,
    status: ItemStatus.ACTIVE,
    capabilities: ItemCapabilities.none()
  })
}

describe('Item master audit transaction L2', () => {
  let prisma: PrismaService
  let itemRepository: PrismaItemRepository
  let requestContextStore: GrpcRequestContextStore
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    itemRepository = new PrismaItemRepository(prisma)
    requestContextStore = new GrpcRequestContextStore()
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

  it('when success audit persistence fails / should roll back the item write in the same Prisma transaction', async () => {
    const tenantId = `${prefix}_tenant`
    const itemCode = `${prefix}_AUDIT_TX`
    const auditService = new ItemMasterAuditService(
      requestContextStore,
      prisma,
      new FailOnceAuditWriter()
    )

    await expect(
      requestContextStore.run(
        {
          internalServiceName: 'wms-service',
          requestId: `${prefix}_request`,
          traceId: `${prefix}_trace`,
          operatorContext: {
            operator_id: `${prefix}_operator`,
            operator_type: 'HUMAN',
            tenant_id: tenantId,
            org_id: `${prefix}_org`,
            issuer: 'auth-service',
            issued_at: '2026-04-26T00:00:00.000Z',
            expires_at: '2026-04-26T01:00:00.000Z',
            signature: 'sig',
            request_id: `${prefix}_request`,
            trace_id: `${prefix}_trace`
          } as never
        },
        () =>
          auditService.recordCommand(
            {
              tenantId,
              commandName: 'CreateItem',
              targetId: null,
              requestSummary: {
                itemCode
              }
            },
            async () =>
              itemRepository.save(
                buildItem({
                  tenantId,
                  itemCode,
                  itemName: `${prefix}_Audit Tx Item`
                })
              )
          )
      )
    ).rejects.toThrow('audit sink unavailable')

    await expect(itemRepository.findByCode(tenantId, itemCode)).resolves.toBeNull()
  })
})
