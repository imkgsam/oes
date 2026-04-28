import { AuditEnvelope } from '@oes/common'
import { CreateQuoteCommand } from '../../src/application/commands/create-quote.command'
import { CreateQuoteHandler } from '../../src/application/commands/create-quote.handler'
import { SalesAuditWriter } from '../../src/application/ports/sales-audit-writer.port'
import { SalesAuditService } from '../../src/application/services/sales-audit.service'
import { PrismaQuoteRepository } from '../../src/infrastructure/repositories/prisma/prisma-quote.repository'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { PrismaSalesTransactionRunner } from '../../src/infrastructure/transactions/prisma-sales-transaction-runner'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'

/** FailOnceAuditWriter forces the success audit append to fail so L2 can verify transaction rollback. */
class FailOnceAuditWriter implements SalesAuditWriter {
  private attempts = 0

  async append(_envelope: AuditEnvelope): Promise<void> {
    this.attempts += 1
    if (this.attempts === 1) {
      throw new Error('audit sink unavailable')
    }
  }
}

describe('Sales audit transaction L2', () => {
  let prisma: PrismaService
  let quoteRepository: PrismaQuoteRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    quoteRepository = new PrismaQuoteRepository(prisma)
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

  it('when success audit persistence fails / should roll back the quote write in the same Prisma transaction', async () => {
    const tenantId = `${prefix}_tenant`
    const handler = new CreateQuoteHandler(quoteRepository)
    const auditService = new SalesAuditService(
      new PrismaSalesTransactionRunner(prisma),
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
            reason: 'quote create',
            source: 'sales-l2'
          },
          commandName: 'CreateQuote',
          resourceType: 'quote',
          targetId: null,
          requestSummary: {
            tenantId
          }
        },
        () =>
          handler.execute(
            new CreateQuoteCommand({
              tenantId,
              customerTenantPartyId: `${tenantId}_customer`,
              draftLines: []
            })
          )
      )
    ).rejects.toThrow('audit sink unavailable')

    const persisted = await quoteRepository.search({
      tenantId,
      page: 1,
      pageSize: 20
    })

    expect(persisted.total).toBe(0)
    expect(persisted.items).toEqual([])
  })
})
