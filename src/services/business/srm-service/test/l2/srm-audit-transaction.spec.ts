import { AuditEnvelope } from '@oes/common'
import { CreateSupplierProfileCommand } from '../../src/application/commands/create-supplier-profile.command'
import { CreateSupplierProfileHandler } from '../../src/application/commands/create-supplier-profile.handler'
import { TenantPartyLookupPort } from '../../src/application/ports/tenant-party-lookup.port'
import { SrmAuditWriter } from '../../src/application/ports/srm-audit-writer.port'
import { SrmAuditService } from '../../src/application/services/srm-audit.service'
import { PrismaSrmAuditRepository } from '../../src/infrastructure/audit/prisma-srm-audit.repository'
import { PrismaSupplierProfileRepository } from '../../src/infrastructure/repositories/prisma/prisma-supplier-profile.repository'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { PrismaSrmTransactionRunner } from '../../src/infrastructure/transactions/prisma-srm-transaction-runner'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'

/** parseSupplierProfileNoValue converts one CA-#### summary into its numeric sequence value for relative assertions. */
function parseSupplierProfileNoValue(supplierNo: string): number {
  const match = supplierNo.match(/^CA-(\d+)$/)
  if (!match) {
    throw new Error(`Unexpected supplierNo format: ${supplierNo}`)
  }

  return Number(match[1])
}

/** FailOnceAuditWriter forces the success audit append to fail so L2 can verify transaction rollback. */
class FailOnceAuditWriter implements SrmAuditWriter {
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

describe('SRM audit transaction L2', () => {
  let prisma: PrismaService
  let accountRepository: PrismaSupplierProfileRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    accountRepository = new PrismaSupplierProfileRepository(prisma)
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

  it('when success audit persistence fails / should roll back the supplier profile write in the same Prisma transaction', async () => {
    const tenantId = `${prefix}_tenant`
    const handler = new CreateSupplierProfileHandler(accountRepository)
    const auditService = new SrmAuditService(
      new PrismaSrmTransactionRunner(prisma),
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
            reason: 'supplier profile create',
            source: 'srm-l2'
          },
          commandName: 'CreateSupplierProfile',
          resourceType: 'supplier_profile',
          targetId: null,
          requestSummary: {
            tenantId
          }
        },
        () =>
          handler.execute(
            new CreateSupplierProfileCommand({
              tenantId,
              displayName: `${prefix} Acme SRM`,
              supplierCategory: 'EXPORT',
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

  it('when the command succeeds / should persist the supplier profile and success audit envelope in the same database path', async () => {
    const tenantId = `${prefix}_tenant`
    const handler = new CreateSupplierProfileHandler(accountRepository)
    const auditService = new SrmAuditService(
      new PrismaSrmTransactionRunner(prisma),
      new PrismaSrmAuditRepository(prisma)
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
          reason: 'supplier profile create',
          source: 'srm-l2'
        },
        commandName: 'CreateSupplierProfile',
        resourceType: 'supplier_profile',
        targetId: null,
        requestSummary: {
          tenantId
        }
      },
      () =>
        handler.execute(
          new CreateSupplierProfileCommand({
            tenantId,
            displayName: `${prefix} Audit SRM`,
            supplierCategory: 'EXPORT',
            tags: ['priority']
          })
        )
    )

    const persisted = await accountRepository.search({
      tenantId,
      page: 1,
      pageSize: 20
    })
    const auditRows = await prisma.srmAuditEnvelope.findMany({
      where: {
        tenantId
      }
    })

    expect(persisted.items).toEqual([created])
    expect(auditRows).toHaveLength(1)
    expect(auditRows[0]).toMatchObject({
      service: 'srm-service',
      module: 'management',
      eventType: 'CreateSupplierProfile',
      result: 'SUCCEEDED',
      tenantId,
      operatorId: `${prefix}_operator`,
      traceId: `${prefix}_trace`,
      resourceType: 'supplier_profile'
    })
  })

  it('when another tenant already consumed one supplierNo / should allocate the next globally unique number on the create live path', async () => {
    const firstTenantId = `${prefix}_tenant_first`
    const secondTenantId = `${prefix}_tenant_second`
    const handler = new CreateSupplierProfileHandler(accountRepository)
    const auditService = new SrmAuditService(
      new PrismaSrmTransactionRunner(prisma),
      new PrismaSrmAuditRepository(prisma)
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
          reason: 'supplier profile create',
          source: 'srm-l2'
        },
        commandName: 'CreateSupplierProfile',
        resourceType: 'supplier_profile',
        targetId: null,
        requestSummary: {
          tenantId: firstTenantId
        }
      },
      () =>
        handler.execute(
          new CreateSupplierProfileCommand({
            tenantId: firstTenantId,
            displayName: `${prefix} First Tenant SRM`,
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
          reason: 'supplier profile create',
          source: 'srm-l2'
        },
        commandName: 'CreateSupplierProfile',
        resourceType: 'supplier_profile',
        targetId: null,
        requestSummary: {
          tenantId: secondTenantId
        }
      },
      () =>
        handler.execute(
          new CreateSupplierProfileCommand({
            tenantId: secondTenantId,
            displayName: `${prefix} Second Tenant SRM`,
            tags: []
          })
        )
    )

    expect(second.supplierNo).not.toBe(first.supplierNo)
    expect(parseSupplierProfileNoValue(second.supplierNo)).toBe(
      parseSupplierProfileNoValue(first.supplierNo) + 1
    )
  })
})
