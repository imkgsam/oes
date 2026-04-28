import { AuditEnvelope } from '@oes/common'
import { CreatePurchaseRequestCommand } from '../../src/application/commands/create-purchase-request.command'
import { CreatePurchaseRequestHandler } from '../../src/application/commands/create-purchase-request.handler'
import { ItemReferenceLookupPort } from '../../src/application/ports/item-reference-lookup.port'
import { ProcurementAuditWriter } from '../../src/application/ports/procurement-audit-writer.port'
import { ProcurementAuditService } from '../../src/application/services/procurement-audit.service'
import { PrismaProcurementAuditRepository } from '../../src/infrastructure/audit/prisma-procurement-audit.repository'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { PrismaPurchaseRequestRepository } from '../../src/infrastructure/repositories/prisma/prisma-purchase-request.repository'
import { PrismaProcurementTransactionRunner } from '../../src/infrastructure/transactions/prisma-procurement-transaction-runner'
import { PurchaseRequestType } from '../../src/domain/models/procurement-records'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'

/** NullItemReferenceLookupPort keeps the audit rollback test focused on local transaction behavior only. */
class NullItemReferenceLookupPort implements ItemReferenceLookupPort {
  async getItemById(): Promise<null> {
    return null
  }
}

/** FailOnceAuditWriter forces the success audit append to fail so L2 can verify transaction rollback. */
class FailOnceAuditWriter implements ProcurementAuditWriter {
  private attempts = 0

  async append(_envelope: AuditEnvelope): Promise<void> {
    this.attempts += 1
    if (this.attempts === 1) {
      throw new Error('audit sink unavailable')
    }
  }
}

describe('procurement audit transaction L2', () => {
  let prisma: PrismaService
  let purchaseRequestRepository: PrismaPurchaseRequestRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    purchaseRequestRepository = new PrismaPurchaseRequestRepository(prisma)
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

  it('when success audit persistence fails / should roll back the purchase request write in the same Prisma transaction', async () => {
    const tenantId = `${prefix}_tenant`
    const handler = new CreatePurchaseRequestHandler(
      purchaseRequestRepository,
      new NullItemReferenceLookupPort()
    )
    const auditService = new ProcurementAuditService(
      new PrismaProcurementTransactionRunner(prisma),
      new FailOnceAuditWriter()
    )

    await expect(
      auditService.recordCommand(
        {
          tenantId,
          operatorContext: {
            operatorId: `${prefix}_operator`,
            operatorType: 'HUMAN',
            orgId: `${prefix}_org`
          },
          traceContext: {
            traceId: `${prefix}_trace`,
            requestId: `${prefix}_request`
          },
          auditContext: {
            auditId: `${prefix}_audit`,
            reason: 'purchase request create',
            source: 'procurement-l2'
          },
          commandName: 'CreatePurchaseRequest',
          resourceType: 'purchase_request',
          targetId: null,
          requestSummary: {
            tenantId
          }
        },
        () =>
          handler.execute(
            new CreatePurchaseRequestCommand({
              tenantId,
              requester: {
                operatorId: `${prefix}_operator`,
                displayName: 'Buyer L2'
              },
              requestType: PurchaseRequestType.DEPARTMENTAL,
              title: `${prefix} stationery`,
              lines: [
                {
                  lineType: 'TEXT',
                  description: 'stationery set',
                  requestedQuantity: '2',
                  uom: 'SET'
                }
              ]
            })
          )
      )
    ).rejects.toThrow('audit sink unavailable')

    const persisted = await purchaseRequestRepository.search({
      tenantId,
      page: 1,
      pageSize: 20
    })

    expect(persisted.total).toBe(0)
    expect(persisted.items).toEqual([])
  })

  it('when the command succeeds / should persist the purchase request and success audit envelope in the same database path', async () => {
    const tenantId = `${prefix}_tenant`
    const handler = new CreatePurchaseRequestHandler(
      purchaseRequestRepository,
      new NullItemReferenceLookupPort()
    )
    const auditService = new ProcurementAuditService(
      new PrismaProcurementTransactionRunner(prisma),
      new PrismaProcurementAuditRepository(prisma)
    )

    const created = await auditService.recordCommand(
      {
        tenantId,
        operatorContext: {
          operatorId: `${prefix}_operator`,
          operatorType: 'HUMAN',
          orgId: `${prefix}_org`
        },
        traceContext: {
          traceId: `${prefix}_trace`,
          requestId: `${prefix}_request`
        },
        auditContext: {
          auditId: `${prefix}_audit_success`,
          reason: 'purchase request create',
          source: 'procurement-l2'
        },
        commandName: 'CreatePurchaseRequest',
        resourceType: 'purchase_request',
        targetId: null,
        requestSummary: {
          tenantId
        }
      },
      () =>
        handler.execute(
          new CreatePurchaseRequestCommand({
            tenantId,
            requester: {
              operatorId: `${prefix}_operator`,
              displayName: 'Buyer L2'
            },
            requestType: PurchaseRequestType.DEPARTMENTAL,
            title: `${prefix} stationery`,
            lines: [
              {
                lineType: 'TEXT',
                description: 'stationery set',
                requestedQuantity: '2',
                uom: 'SET'
              }
            ]
          })
        )
    )

    const persisted = await purchaseRequestRepository.search({
      tenantId,
      page: 1,
      pageSize: 20
    })
    const auditRows = await prisma.procurementAuditEnvelope.findMany({
      where: {
        tenantId
      }
    })

    expect(persisted.items).toEqual([created])
    expect(auditRows).toHaveLength(1)
    expect(auditRows[0]).toMatchObject({
      service: 'procurement-service',
      module: 'management',
      eventType: 'CreatePurchaseRequest',
      result: 'SUCCEEDED',
      tenantId,
      operatorId: `${prefix}_operator`,
      traceId: `${prefix}_trace`,
      resourceType: 'purchase_request'
    })
  })
})
