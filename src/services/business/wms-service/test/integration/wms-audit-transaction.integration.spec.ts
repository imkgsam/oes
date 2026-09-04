import { AuditEnvelope } from '@oes/common'
import { GrpcRequestContextStore } from '@oes/common/authorization'
import { CreateReceiptDraftCommand } from '../../src/application/commands/create-receipt-draft.command'
import { CreateReceiptDraftHandler } from '../../src/application/commands/create-receipt-draft.handler'
import { WmsAuditWriter } from '../../src/application/ports/wms-audit-writer.port'
import { WmsAuditService } from '../../src/application/services/wms-audit.service'
import { ReceiptSourceType } from '../../src/domain/models/wms-records'
import { PrismaWmsAuditRepository } from '../../src/infrastructure/audit/prisma-wms-audit.repository'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { PrismaReceiptRepository } from '../../src/infrastructure/repositories/prisma/prisma-receipt.repository'
import { PrismaWmsTransactionRunner } from '../../src/infrastructure/transactions/prisma-wms-transaction-runner'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'

/** Forces the success audit append to fail so the receipt write must roll back. */
class FailOnceAuditWriter implements WmsAuditWriter {
  private attempts = 0

  async append(_envelope: AuditEnvelope): Promise<void> {
    this.attempts += 1
    if (this.attempts === 1) throw new Error('audit sink unavailable')
  }
}

/** Creates the guard-established HUMAN context required by WMS audit authority checks. */
function createTrustedHumanContext(prefix: string, tenantId: string) {
  const certificateThumbprint = 'A'.repeat(43)
  return {
    verifiedExecutionToken: {
      issuer: 'https://auth.example',
      audience: 'urn:oes:service:wms-service',
      subject: `${prefix}_operator`,
      principalType: 'HUMAN',
      clientId: 'spiffe://oes/api-gateway',
      tenantId,
      orgId: `${prefix}_org`,
      permissionCodes: ['wms.receipt.manage'],
      tokenId: `${prefix}_token`,
      issuedAt: 1,
      notBefore: 1,
      expiresAt: 9_999_999_999,
      certificateThumbprint,
      sessionId: `${prefix}_session`,
      sessionTerminal: 'WEB'
    },
    verifiedWorkloadIdentity: { spiffeId: 'spiffe://oes/api-gateway', certificateThumbprint },
    requestId: `${prefix}_request`,
    traceId: `${prefix}_trace`
  } as never
}

describe('WMS audit transaction Integration', () => {
  let prisma: PrismaService
  let receiptRepository: PrismaReceiptRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    receiptRepository = new PrismaReceiptRepository(prisma)
  })

  beforeEach(async () => {
    prefix = createTestPrefix()
    await cleanupByPrefix(prisma, prefix)
  })

  afterEach(async () => cleanupByPrefix(prisma, prefix))
  afterAll(async () => prisma?.$disconnect())

  it('rolls back the receipt draft when success audit persistence fails', async () => {
    const tenantId = `${prefix}_tenant`
    await seedWarehouse(prisma, prefix, tenantId)
    const contextStore = new GrpcRequestContextStore()
    const audit = new WmsAuditService(
      new PrismaWmsTransactionRunner(prisma),
      new FailOnceAuditWriter(),
      contextStore
    )
    const handler = new CreateReceiptDraftHandler(receiptRepository)

    await expect(
      contextStore.run(createTrustedHumanContext(prefix, tenantId), () =>
        audit.recordCommand(auditInput(prefix, tenantId), () =>
          handler.execute(command(prefix, tenantId))
        )
      )
    ).rejects.toThrow('audit sink unavailable')

    expect(
      await receiptRepository.searchReceipts({ tenantId, page: 1, pageSize: 20 })
    ).toMatchObject({
      total: 0,
      items: []
    })
  })

  it('persists the receipt and claims-derived audit in the same transaction path', async () => {
    const tenantId = `${prefix}_tenant`
    await seedWarehouse(prisma, prefix, tenantId)
    const contextStore = new GrpcRequestContextStore()
    const audit = new WmsAuditService(
      new PrismaWmsTransactionRunner(prisma),
      new PrismaWmsAuditRepository(prisma),
      contextStore
    )
    const handler = new CreateReceiptDraftHandler(receiptRepository)

    const created = await contextStore.run(createTrustedHumanContext(prefix, tenantId), () =>
      audit.recordCommand(auditInput(prefix, tenantId), () =>
        handler.execute(command(prefix, tenantId))
      )
    )
    const persisted = await receiptRepository.searchReceipts({ tenantId, page: 1, pageSize: 20 })
    const auditRows = await prisma.wmsAuditEnvelope.findMany({ where: { tenantId } })

    expect(persisted.items).toEqual([created])
    expect(auditRows).toHaveLength(1)
    expect(auditRows[0]).toMatchObject({
      service: 'wms-service',
      module: 'management',
      eventType: 'CreateReceiptDraft',
      result: 'SUCCEEDED',
      tenantId,
      operatorId: `${prefix}_operator`,
      traceId: `${prefix}_trace`,
      resourceType: 'receipt'
    })
  })
})

/** Seeds the existing WMS-owned warehouse FK required by a draft receipt. */
async function seedWarehouse(
  prisma: PrismaService,
  prefix: string,
  tenantId: string
): Promise<void> {
  await prisma.warehouse.create({
    data: {
      id: `${prefix}_wh`,
      tenantId,
      orgId: `${prefix}_org`,
      warehouseCode: `${prefix}_WH`,
      warehouseName: 'Trusted WMS Integration',
      warehouseScope: 'INTERNAL',
      status: 'ACTIVE',
      createdAt: new Date('2026-08-15T00:00:00.000Z'),
      updatedAt: new Date('2026-08-15T00:00:00.000Z')
    }
  })
}

/** Builds business input whose identity values match, but do not establish, verified authority. */
function auditInput(prefix: string, tenantId: string) {
  return {
    tenantId,
    operatorContext: {
      operatorId: `${prefix}_operator`,
      operatorType: 'HUMAN',
      orgId: `${prefix}_org`
    },
    traceContext: { traceId: `${prefix}_trace`, requestId: `${prefix}_request` },
    auditContext: { auditId: `${prefix}_hint`, reason: 'create draft', source: 'ignored' },
    commandName: 'CreateReceiptDraft',
    resourceType: 'receipt',
    targetId: null,
    requestSummary: { warehouseId: `${prefix}_wh` }
  }
}

/** Builds the unchanged business command used by both success and rollback paths. */
function command(prefix: string, tenantId: string): CreateReceiptDraftCommand {
  return new CreateReceiptDraftCommand({
    tenantId,
    orgId: `${prefix}_org`,
    warehouseId: `${prefix}_wh`,
    receiptSourceType: ReceiptSourceType.MANUAL,
    referencedReceivingExpectationIds: [],
    attachmentRefs: []
  })
}
