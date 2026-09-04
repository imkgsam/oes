import { randomUUID } from 'node:crypto'
import {
  AccountTransactionAllocationStatus,
  AccountTransactionDirection,
  AccountTransactionSourceType,
  AccountTransactionStatus,
  FinancialAccountStatus,
  FinancialAccountType,
  PayableScheduleLineStatus,
  PayableScheduleLineType,
  PayableScheduleStatus,
  PaymentAllocationTargetType,
  PaymentExecutionStatus,
  PaymentRequestLineStatus,
  PaymentRequestSource,
  PaymentRequestStatus,
  SupplierFinancialAccountVerifiedStatus
} from '../../src/domain/models/finance-records'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { PrismaFinanceRepository } from '../../src/infrastructure/repositories/prisma/prisma-finance.repository'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'

describe('Prisma finance payables repository Integration', () => {
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

  it('payable repository / when payable schedule payment request payment execution and payable allocation are saved / should round-trip the phase 1B AP-compatible records', async () => {
    const tenantId = `${prefix}_tenant`
    const financialAccountId = randomUUID()
    const accountTransactionId = randomUUID()
    const supplierFinancialAccountId = randomUUID()
    const payableScheduleId = randomUUID()
    const payableScheduleLineId = randomUUID()
    const paymentRequestId = randomUUID()
    const paymentRequestLineId = randomUUID()
    const paymentExecutionId = randomUUID()

    await repository.saveFinancialAccount({
      id: financialAccountId,
      accountNo: 'FA-1001',
      tenantId,
      orgId: `${prefix}_org`,
      accountType: FinancialAccountType.BANK,
      accountName: `${prefix}_outflow_account`,
      currencyCode: 'USD',
      institutionName: `${prefix}_bank`,
      accountIdentifierMasked: '****1001',
      status: FinancialAccountStatus.ACTIVE,
      lastTransactionAt: null,
      createdAt: '2026-04-01T00:00:00.000Z',
      updatedAt: '2026-04-01T00:00:00.000Z'
    })

    await repository.saveSupplierFinancialAccount({
      id: supplierFinancialAccountId,
      tenantId,
      supplierTenantPartyId: `${prefix}_supplier_party`,
      accountHolderName: `${prefix}_supplier`,
      accountProviderType: 'BANK',
      accountIdentifierMasked: '****7777',
      currencyCode: 'USD',
      isDefault: true,
      verifiedStatus: SupplierFinancialAccountVerifiedStatus.UNVERIFIED,
      createdAt: '2026-04-02T00:00:00.000Z',
      updatedAt: '2026-04-02T00:00:00.000Z'
    })

    await repository.savePayableSchedule({
      id: payableScheduleId,
      scheduleNo: 'AP-0001',
      tenantId,
      orgId: `${prefix}_org`,
      sourceType: 'PURCHASE_ORDER',
      sourcePurchaseOrderId: `${prefix}_po`,
      sourcePurchaseOrderNo: `${prefix}_PO-0001`,
      procurementSnapshotReference: `${prefix}_snapshot`,
      supplierTenantPartyId: `${prefix}_supplier_party`,
      supplierSnapshot: `${prefix}_Supplier`,
      currencyCode: 'USD',
      status: PayableScheduleStatus.OPEN,
      totalScheduledAmount: '120.00',
      totalRequestedAmount: '120.00',
      totalExecutedAmount: '120.00',
      totalAllocatedAmount: '0.00',
      outstandingAmount: '120.00',
      createdAt: '2026-04-02T00:00:00.000Z',
      updatedAt: '2026-04-02T00:00:00.000Z',
      lines: [
        {
          id: payableScheduleLineId,
          tenantId,
          payableScheduleId,
          lineNo: 1,
          lineType: PayableScheduleLineType.TERM_DUE,
          sourceRef: `${prefix}_po/term`,
          dueDate: '2026-04-15',
          scheduledAmount: '120.00',
          requestedAmount: '120.00',
          executedAmount: '120.00',
          allocatedAmount: '0.00',
          outstandingAmount: '120.00',
          status: PayableScheduleLineStatus.OPEN,
          requestGovernanceStatus: 'PARTIALLY_PAID',
          sourcePurchaseOrderLineId: `${prefix}_po_line_1`,
          supersedesSourceRef: null,
          memo: null,
          createdAt: '2026-04-02T00:00:00.000Z',
          updatedAt: '2026-04-02T00:00:00.000Z'
        }
      ]
    })

    await repository.savePaymentRequest({
      id: paymentRequestId,
      requestNo: 'PR-0001',
      tenantId,
      orgId: `${prefix}_org`,
      requestSource: PaymentRequestSource.FINANCE_INITIATED,
      sourcePurchaseOrderId: `${prefix}_po`,
      supplierTenantPartyId: `${prefix}_supplier_party`,
      supplierSnapshot: `${prefix}_Supplier`,
      beneficiarySupplierFinancialAccountId: supplierFinancialAccountId,
      currencyCode: 'USD',
      requestedAmount: '120.00',
      status: PaymentRequestStatus.EXECUTED,
      reason: null,
      requestedAt: '2026-04-15T00:00:00.000Z',
      updatedAt: '2026-04-16T00:00:00.000Z',
      lines: [
        {
          id: paymentRequestLineId,
          tenantId,
          paymentRequestId,
          payableScheduleId,
          payableScheduleLineId,
          scheduleDueDate: '2026-04-15',
          requestedAmount: '120.00',
          executedAmount: '120.00',
          isEarlyRequest: false,
          lineStatus: PaymentRequestLineStatus.EXECUTED,
          createdAt: '2026-04-15T00:00:00.000Z',
          updatedAt: '2026-04-16T00:00:00.000Z'
        }
      ],
      evidenceSnapshots: [
        {
          id: randomUUID(),
          tenantId,
          paymentRequestId,
          evidenceType: 'SUPPLIER_INVOICE',
          externalDocumentNo: `${prefix}_invoice`,
          documentDate: '2026-04-10',
          currencyCode: 'USD',
          documentAmount: '120.00',
          attachmentRef: 'asset://invoice-1',
          note: 'invoice snapshot',
          capturedAt: '2026-04-15T00:00:00.000Z'
        }
      ]
    })

    await repository.savePaymentExecution({
      id: paymentExecutionId,
      tenantId,
      orgId: `${prefix}_org`,
      paymentRequestId,
      supplierTenantPartyId: `${prefix}_supplier_party`,
      sourceFinancialAccountId: financialAccountId,
      beneficiarySupplierFinancialAccountId: supplierFinancialAccountId,
      beneficiaryAccountSnapshot: '****7777',
      executedAmount: '120.00',
      currencyCode: 'USD',
      executedAt: '2026-04-16T00:00:00.000Z',
      executionReference: `${prefix}_bank_ref`,
      attachmentRefs: ['asset://payment-proof-1'],
      linkedAccountTransactionId: accountTransactionId,
      status: PaymentExecutionStatus.MATCHED,
      createdAt: '2026-04-16T00:00:00.000Z',
      updatedAt: '2026-04-16T00:00:00.000Z'
    })

    await repository.saveAccountTransaction({
      id: accountTransactionId,
      tenantId,
      orgId: `${prefix}_org`,
      financialAccountId,
      importBatchId: null,
      direction: AccountTransactionDirection.OUTFLOW,
      amount: '120.00',
      currencyCode: 'USD',
      transactionTime: '2026-04-16T00:00:00.000Z',
      valueDate: '2026-04-16',
      sourceType: AccountTransactionSourceType.MANUAL,
      status: AccountTransactionStatus.CONFIRMED,
      externalReference: `${prefix}_bank_ref`,
      counterpartyName: `${prefix}_supplier`,
      counterpartyAccountSnapshot: '****7777',
      memo: `${prefix}_payment`,
      paymentExecutionId,
      allocationStatus: AccountTransactionAllocationStatus.UNALLOCATED,
      allocatedAmount: '0.00',
      unallocatedAmount: '120.00',
      fileAssetId: null,
      attachmentRef: 'asset://payment-proof-1',
      createdAt: '2026-04-16T00:00:00.000Z',
      updatedAt: '2026-04-16T00:00:00.000Z'
    })

    await repository.allocateTransactionToPayable({
      id: randomUUID(),
      tenantId,
      accountTransactionId,
      paymentExecutionId,
      paymentRequestId,
      targetType: PaymentAllocationTargetType.PAYABLE_SCHEDULE_LINE,
      targetScheduleId: payableScheduleId,
      targetScheduleLineId: payableScheduleLineId,
      allocatedAmount: '120.00',
      currencyCode: 'USD',
      allocatedAt: '2026-04-16T00:05:00.000Z',
      createdAt: '2026-04-16T00:05:00.000Z'
    })

    const schedule = await repository.findPayableScheduleById(tenantId, payableScheduleId)
    const requests = await repository.searchPaymentRequests({
      tenantId,
      sourcePurchaseOrderId: `${prefix}_po`,
      page: 1,
      pageSize: 20
    })
    const executions = await repository.searchPaymentExecutions({
      tenantId,
      paymentRequestId,
      page: 1,
      pageSize: 20
    })
    const allocations = await repository.searchPaymentAllocations({
      tenantId,
      paymentExecutionId,
      targetType: PaymentAllocationTargetType.PAYABLE_SCHEDULE_LINE,
      targetScheduleId: payableScheduleId,
      page: 1,
      pageSize: 20
    })

    expect(schedule?.status).toBe(PayableScheduleStatus.PAID)
    expect(requests.total).toBe(1)
    expect(executions.total).toBe(1)
    expect(allocations.total).toBe(1)
  })

  it('payable repository invariant / when an allocated payable line is overwritten with a different scheduled amount / should reject silent rewrite of paid history', async () => {
    const tenantId = `${prefix}_tenant`
    const payableScheduleId = randomUUID()
    const payableScheduleLineId = randomUUID()

    await repository.savePayableSchedule({
      id: payableScheduleId,
      scheduleNo: 'AP-0099',
      tenantId,
      orgId: null,
      sourceType: 'PURCHASE_ORDER',
      sourcePurchaseOrderId: `${prefix}_po_paid`,
      sourcePurchaseOrderNo: `${prefix}_PO-0099`,
      procurementSnapshotReference: null,
      supplierTenantPartyId: `${prefix}_supplier_party`,
      supplierSnapshot: `${prefix}_Supplier`,
      currencyCode: 'USD',
      status: PayableScheduleStatus.PAID,
      totalScheduledAmount: '60.00',
      totalRequestedAmount: '60.00',
      totalExecutedAmount: '60.00',
      totalAllocatedAmount: '60.00',
      outstandingAmount: '0.00',
      createdAt: '2026-04-20T00:00:00.000Z',
      updatedAt: '2026-04-20T00:00:00.000Z',
      lines: [
        {
          id: payableScheduleLineId,
          tenantId,
          payableScheduleId,
          lineNo: 1,
          lineType: PayableScheduleLineType.TERM_DUE,
          sourceRef: `${prefix}_po_paid/term`,
          dueDate: '2026-04-20',
          scheduledAmount: '60.00',
          requestedAmount: '60.00',
          executedAmount: '60.00',
          allocatedAmount: '60.00',
          outstandingAmount: '0.00',
          status: PayableScheduleLineStatus.PAID,
          requestGovernanceStatus: 'PAID',
          sourcePurchaseOrderLineId: null,
          supersedesSourceRef: null,
          memo: null,
          createdAt: '2026-04-20T00:00:00.000Z',
          updatedAt: '2026-04-20T00:00:00.000Z'
        }
      ]
    })

    await expect(
      repository.savePayableSchedule({
        id: payableScheduleId,
        scheduleNo: 'AP-0099',
        tenantId,
        orgId: null,
        sourceType: 'PURCHASE_ORDER',
        sourcePurchaseOrderId: `${prefix}_po_paid`,
        sourcePurchaseOrderNo: `${prefix}_PO-0099`,
        procurementSnapshotReference: null,
        supplierTenantPartyId: `${prefix}_supplier_party`,
        supplierSnapshot: `${prefix}_Supplier`,
        currencyCode: 'USD',
        status: PayableScheduleStatus.PAID,
        totalScheduledAmount: '80.00',
        totalRequestedAmount: '60.00',
        totalExecutedAmount: '60.00',
        totalAllocatedAmount: '60.00',
        outstandingAmount: '20.00',
        createdAt: '2026-04-20T00:00:00.000Z',
        updatedAt: '2026-04-21T00:00:00.000Z',
        lines: [
          {
            id: payableScheduleLineId,
            tenantId,
            payableScheduleId,
            lineNo: 1,
            lineType: PayableScheduleLineType.TERM_DUE,
            sourceRef: `${prefix}_po_paid/term`,
            dueDate: '2026-04-20',
            scheduledAmount: '80.00',
            requestedAmount: '60.00',
            executedAmount: '60.00',
            allocatedAmount: '60.00',
            outstandingAmount: '20.00',
            status: PayableScheduleLineStatus.PARTIALLY_PAID,
            requestGovernanceStatus: 'PARTIALLY_PAID',
            sourcePurchaseOrderLineId: null,
            supersedesSourceRef: null,
            memo: null,
            createdAt: '2026-04-20T00:00:00.000Z',
            updatedAt: '2026-04-21T00:00:00.000Z'
          }
        ]
      })
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: 9
      }
    })
  })
})
