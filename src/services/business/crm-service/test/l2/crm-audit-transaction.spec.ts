import { AuditEnvelope } from '@oes/common'
import { CreateCustomerAccountCommand } from '../../src/application/commands/create-customer-account.command'
import { CreateCustomerAccountHandler } from '../../src/application/commands/create-customer-account.handler'
import { TenantPartyLookupPort } from '../../src/application/ports/tenant-party-lookup.port'
import { CrmAuditWriter } from '../../src/application/ports/crm-audit-writer.port'
import { CrmAuditService } from '../../src/application/services/crm-audit.service'
import { PrismaCrmAuditRepository } from '../../src/infrastructure/audit/prisma-crm-audit.repository'
import { PrismaCustomerAccountRepository } from '../../src/infrastructure/repositories/prisma/prisma-customer-account.repository'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { PrismaCrmTransactionRunner } from '../../src/infrastructure/transactions/prisma-crm-transaction-runner'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'

/** parseCustomerAccountNoValue converts one CA-#### summary into its numeric sequence value for relative assertions. */
function parseCustomerAccountNoValue(customerAccountNo: string): number {
  const match = customerAccountNo.match(/^CA-(\d+)$/)
  if (!match) {
    throw new Error(`Unexpected customerAccountNo format: ${customerAccountNo}`)
  }

  return Number(match[1])
}

/** FailOnceAuditWriter forces the success audit append to fail so L2 can verify transaction rollback. */
class FailOnceAuditWriter implements CrmAuditWriter {
  private attempts = 0

  async append(_envelope: AuditEnvelope): Promise<void> {
    this.attempts += 1
    if (this.attempts === 1) {
      throw new Error('audit sink unavailable')
    }
  }
}

/** NullTenantPartyLookupPort keeps the audit rollback test focused on local transaction behavior only. */
class NullTenantPartyLookupPort implements TenantPartyLookupPort {
  async getTenantPartyById(): Promise<null> {
    return null
  }
}

describe('CRM audit transaction L2', () => {
  let prisma: PrismaService
  let accountRepository: PrismaCustomerAccountRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    accountRepository = new PrismaCustomerAccountRepository(prisma)
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

  it('when success audit persistence fails / should roll back the customer account write in the same Prisma transaction', async () => {
    const tenantId = `${prefix}_tenant`
    const handler = new CreateCustomerAccountHandler(accountRepository)
    const auditService = new CrmAuditService(
      new PrismaCrmTransactionRunner(prisma),
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
            reason: 'customer account create',
            source: 'crm-l2'
          },
          commandName: 'CreateCustomerAccount',
          resourceType: 'customer_account',
          targetId: null,
          requestSummary: {
            tenantId
          }
        },
        () =>
          handler.execute(
            new CreateCustomerAccountCommand({
              tenantId,
              displayName: `${prefix} Acme CRM`,
              customerCategory: 'EXPORT',
              tags: []
            })
          )
      )
    ).rejects.toThrow('audit sink unavailable')

    const persisted = await accountRepository.search({
      tenantId,
      page: 1,
      pageSize: 20
    })

    expect(persisted.total).toBe(0)
    expect(persisted.items).toEqual([])
  })

  it('when the command succeeds / should persist the customer account and success audit envelope in the same database path', async () => {
    const tenantId = `${prefix}_tenant`
    const handler = new CreateCustomerAccountHandler(accountRepository)
    const auditService = new CrmAuditService(
      new PrismaCrmTransactionRunner(prisma),
      new PrismaCrmAuditRepository(prisma)
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
          reason: 'customer account create',
          source: 'crm-l2'
        },
        commandName: 'CreateCustomerAccount',
        resourceType: 'customer_account',
        targetId: null,
        requestSummary: {
          tenantId
        }
      },
      () =>
        handler.execute(
          new CreateCustomerAccountCommand({
            tenantId,
            displayName: `${prefix} Audit CRM`,
            customerCategory: 'EXPORT',
            tags: ['priority']
          })
        )
    )

    const persisted = await accountRepository.search({
      tenantId,
      page: 1,
      pageSize: 20
    })
    const auditRows = await prisma.crmAuditEnvelope.findMany({
      where: {
        tenantId
      }
    })

    expect(persisted.items).toEqual([created])
    expect(auditRows).toHaveLength(1)
    expect(auditRows[0]).toMatchObject({
      service: 'crm-service',
      module: 'management',
      eventType: 'CreateCustomerAccount',
      result: 'SUCCEEDED',
      tenantId,
      operatorId: `${prefix}_operator`,
      traceId: `${prefix}_trace`,
      resourceType: 'customer_account'
    })
  })

  it('when another tenant already consumed one customerAccountNo / should allocate the next globally unique number on the create live path', async () => {
    const firstTenantId = `${prefix}_tenant_first`
    const secondTenantId = `${prefix}_tenant_second`
    const handler = new CreateCustomerAccountHandler(accountRepository)
    const auditService = new CrmAuditService(
      new PrismaCrmTransactionRunner(prisma),
      new PrismaCrmAuditRepository(prisma)
    )

    const first = await auditService.recordCommand(
      {
        tenantId: firstTenantId,
        operatorContext: {
          operatorId: `${prefix}_operator_first`,
          operatorType: 'HUMAN',
          orgId: `${prefix}_org`
        },
        traceContext: {
          traceId: `${prefix}_trace_first`,
          requestId: `${prefix}_request_first`
        },
        auditContext: {
          auditId: `${prefix}_audit_first`,
          reason: 'customer account create',
          source: 'crm-l2'
        },
        commandName: 'CreateCustomerAccount',
        resourceType: 'customer_account',
        targetId: null,
        requestSummary: {
          tenantId: firstTenantId
        }
      },
      () =>
        handler.execute(
          new CreateCustomerAccountCommand({
            tenantId: firstTenantId,
            displayName: `${prefix} First Tenant CRM`,
            tags: []
          })
        )
    )

    const second = await auditService.recordCommand(
      {
        tenantId: secondTenantId,
        operatorContext: {
          operatorId: `${prefix}_operator_second`,
          operatorType: 'HUMAN',
          orgId: `${prefix}_org`
        },
        traceContext: {
          traceId: `${prefix}_trace_second`,
          requestId: `${prefix}_request_second`
        },
        auditContext: {
          auditId: `${prefix}_audit_second`,
          reason: 'customer account create',
          source: 'crm-l2'
        },
        commandName: 'CreateCustomerAccount',
        resourceType: 'customer_account',
        targetId: null,
        requestSummary: {
          tenantId: secondTenantId
        }
      },
      () =>
        handler.execute(
          new CreateCustomerAccountCommand({
            tenantId: secondTenantId,
            displayName: `${prefix} Second Tenant CRM`,
            tags: []
          })
        )
    )

    expect(second.customerAccountNo).not.toBe(first.customerAccountNo)
    expect(parseCustomerAccountNoValue(second.customerAccountNo)).toBe(
      parseCustomerAccountNoValue(first.customerAccountNo) + 1
    )
  })
})
