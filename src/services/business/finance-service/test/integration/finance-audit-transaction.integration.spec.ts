import { randomUUID } from 'node:crypto'
import { FinanceAuditService } from '../../src/application/services/finance-audit.service'
import { FinancialAccountType } from '../../src/domain/models/finance-records'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { PrismaFinanceRepository } from '../../src/infrastructure/repositories/prisma/prisma-finance.repository'
import { PrismaFinanceTransactionRunner } from '../../src/infrastructure/transactions/prisma-finance-transaction-runner'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'

describe('finance-service audit transaction Integration', () => {
  let prisma: PrismaService
  let repository: PrismaFinanceRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    repository = new PrismaFinanceRepository(prisma)
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

  it('recordCommand / when audit append fails / should roll back the finance write because both share one local transaction', async () => {
    const tenantId = `${prefix}_tenant`
    const accountId = randomUUID()
    const auditService = new FinanceAuditService(
      new PrismaFinanceTransactionRunner(prisma),
      {
        append: async () => {
          throw new Error('force-audit-failure')
        }
      }
    )

    await expect(
      auditService.recordCommand(
        {
          tenantId,
          operatorContext: {
            operatorId: 'operator-1',
            operatorType: 'HUMAN',
            orgId: `${prefix}_org`
          },
          traceContext: {
            traceId: 'trace-1',
            requestId: 'request-1'
          },
          auditContext: {
            auditId: 'audit-1',
            reason: 'rollback test',
            source: 'jest'
          },
          commandName: 'CreateFinancialAccount',
          resourceType: 'financial_account',
          targetId: accountId,
          requestSummary: {
            accountNo: 'FA-ROLLBACK-1'
          }
        },
        async () => {
          await repository.saveFinancialAccount({
            id: accountId,
            accountNo: 'FA-ROLLBACK-1',
            tenantId,
            orgId: `${prefix}_org`,
            accountType: FinancialAccountType.BANK,
            accountName: `${prefix}_rollback_account`,
            currencyCode: 'USD',
            institutionName: null,
            accountIdentifierMasked: '****0001',
            status: 'ACTIVE',
            lastTransactionAt: null,
            createdAt: '2026-04-15T00:00:00.000Z',
            updatedAt: '2026-04-15T00:00:00.000Z'
          })
        }
      )
    ).rejects.toThrow('force-audit-failure')

    await expect(repository.findFinancialAccountById(tenantId, accountId)).resolves.toBeNull()
  })
})
