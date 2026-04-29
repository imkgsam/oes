import { randomUUID } from 'node:crypto'
import {
  AccountTransactionAllocationStatus,
  AccountTransactionDirection,
  AccountTransactionSourceType,
  AccountTransactionStatus,
  CustomerFinancialAccountVerifiedStatus,
  FinancialAccountStatus,
  FinancialAccountType,
  FinanceReleaseStatus,
  ReceivableScheduleLineStatus,
  ReceivableScheduleStatus
} from '../../src/domain/models/finance-records'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { PrismaFinanceRepository } from '../../src/infrastructure/repositories/prisma/prisma-finance.repository'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from './helpers/integration-db'

describe('Prisma finance repository L2', () => {
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

  it('account repository / when saving account, snapshot, customer account, import batch, and exchange rate / should round-trip finance phase 1A records', async () => {
    const tenantId = `${prefix}_tenant`
    const accountId = randomUUID()
    const batchId = randomUUID()

    await repository.saveFinancialAccount({
      id: accountId,
      accountNo: 'FA-0001',
      tenantId,
      orgId: `${prefix}_org`,
      accountType: FinancialAccountType.BANK,
      accountName: `${prefix}_main_account`,
      currencyCode: 'USD',
      institutionName: `${prefix}_bank`,
      accountIdentifierMasked: '****5678',
      status: FinancialAccountStatus.ACTIVE,
      lastTransactionAt: null,
      createdAt: '2026-04-01T00:00:00.000Z',
      updatedAt: '2026-04-01T00:00:00.000Z'
    })

    await repository.saveBalanceSnapshot({
      id: randomUUID(),
      tenantId,
      financialAccountId: accountId,
      snapshotBalance: '100.00',
      snapshotAt: '2026-04-01T00:00:00.000Z',
      createdAt: '2026-04-01T00:00:00.000Z'
    })

    await repository.saveImportBatch({
      id: batchId,
      tenantId,
      financialAccountId: accountId,
      sourceType: 'CSV_IMPORT',
      sourceBatchReference: `${prefix}_statement`,
      fileAssetId: 'asset-1',
      attachmentRef: 'attachment-1',
      importedBy: 'operator-1',
      totalRows: 1,
      acceptedCount: 1,
      duplicateCount: 0,
      failedCount: 0,
      createdAt: '2026-04-02T00:00:00.000Z'
    })

    await repository.saveAccountTransaction({
      id: randomUUID(),
      tenantId,
      orgId: `${prefix}_org`,
      financialAccountId: accountId,
      importBatchId: batchId,
      direction: AccountTransactionDirection.INFLOW,
      amount: '50.00',
      currencyCode: 'USD',
      transactionTime: '2026-04-02T00:00:00.000Z',
      valueDate: '2026-04-02',
      sourceType: AccountTransactionSourceType.CSV_IMPORT,
      status: AccountTransactionStatus.CONFIRMED,
      externalReference: `${prefix}_bank_ref`,
      counterpartyName: `${prefix}_customer`,
      counterpartyAccountSnapshot: '****1111',
      memo: `${prefix}_memo`,
      paymentExecutionId: null,
      allocationStatus: AccountTransactionAllocationStatus.UNALLOCATED,
      allocatedAmount: '0.00',
      unallocatedAmount: '50.00',
      fileAssetId: 'asset-1',
      attachmentRef: 'attachment-1',
      createdAt: '2026-04-02T00:00:00.000Z',
      updatedAt: '2026-04-02T00:00:00.000Z'
    })

    await repository.saveCustomerFinancialAccount({
      id: randomUUID(),
      tenantId,
      customerTenantPartyId: `${prefix}_customer_party`,
      accountHolderName: `${prefix}_customer_name`,
      accountProviderType: 'BANK',
      accountIdentifierMasked: '****2222',
      currencyCode: 'USD',
      isDefault: true,
      verifiedStatus: CustomerFinancialAccountVerifiedStatus.UNVERIFIED,
      createdAt: '2026-04-02T00:00:00.000Z',
      updatedAt: '2026-04-02T00:00:00.000Z'
    })

    await repository.saveExchangeRate({
      id: randomUUID(),
      tenantId,
      baseCurrencyCode: 'USD',
      quoteCurrencyCode: 'CNY',
      rateValue: '7.200000',
      effectiveAt: '2026-04-02T00:00:00.000Z',
      setBy: 'operator-1',
      updatedAt: '2026-04-02T00:00:00.000Z'
    })

    const found = await repository.findFinancialAccountById(tenantId, accountId)
    const balance = await repository.getCalculatedAccountBalance(tenantId, accountId)
    const transactions = await repository.searchAccountTransactions({
      tenantId,
      financialAccountId: accountId,
      page: 1,
      pageSize: 20
    })
    const rate = await repository.getExchangeRate({
      tenantId,
      baseCurrencyCode: 'USD',
      quoteCurrencyCode: 'CNY'
    })

    expect(found?.accountNo).toBe('FA-0001')
    expect(balance).toBe('150.00')
    expect(transactions.total).toBe(1)
    expect(rate?.rateValue).toBe('7.200000')
  })

  it('receivable allocation repository / when one confirmed inflow is allocated and then rewritten / should reject mutation of key fields after allocation', async () => {
    const tenantId = `${prefix}_tenant`
    const accountId = randomUUID()
    const transactionId = randomUUID()
    const scheduleId = randomUUID()
    const scheduleLineId = randomUUID()

    await repository.saveFinancialAccount({
      id: accountId,
      accountNo: 'FA-0009',
      tenantId,
      orgId: null,
      accountType: FinancialAccountType.BANK,
      accountName: `${prefix}_collection`,
      currencyCode: 'USD',
      institutionName: null,
      accountIdentifierMasked: '****0009',
      status: FinancialAccountStatus.ACTIVE,
      lastTransactionAt: null,
      createdAt: '2026-04-09T00:00:00.000Z',
      updatedAt: '2026-04-09T00:00:00.000Z'
    })

    await repository.saveAccountTransaction({
      id: transactionId,
      tenantId,
      orgId: null,
      financialAccountId: accountId,
      importBatchId: null,
      direction: AccountTransactionDirection.INFLOW,
      amount: '20.00',
      currencyCode: 'USD',
      transactionTime: '2026-04-10T00:00:00.000Z',
      valueDate: null,
      sourceType: AccountTransactionSourceType.MANUAL,
      status: AccountTransactionStatus.CONFIRMED,
      externalReference: null,
      counterpartyName: null,
      counterpartyAccountSnapshot: null,
      memo: null,
      paymentExecutionId: null,
      allocationStatus: AccountTransactionAllocationStatus.UNALLOCATED,
      allocatedAmount: '0.00',
      unallocatedAmount: '20.00',
      fileAssetId: null,
      attachmentRef: null,
      createdAt: '2026-04-10T00:00:00.000Z',
      updatedAt: '2026-04-10T00:00:00.000Z'
    })

    await repository.saveReceivableSchedule({
      id: scheduleId,
      scheduleNo: 'AR-0001',
      tenantId,
      orgId: null,
      sourceSalesOrderId: `${prefix}_sales_order`,
      customerTenantPartyId: `${prefix}_customer`,
      customerSnapshot: `${prefix}_Customer`,
      currencyCode: 'USD',
      status: ReceivableScheduleStatus.OPEN,
      totalScheduledAmount: '20.00',
      totalAllocatedAmount: '0.00',
      outstandingAmount: '20.00',
      salesExchangeRateSnapshot: null,
      createdAt: '2026-04-10T00:00:00.000Z',
      updatedAt: '2026-04-10T00:00:00.000Z',
      lines: [
        {
          id: scheduleLineId,
          tenantId,
          receivableScheduleId: scheduleId,
          lineNo: 1,
          dueDate: '2026-05-10',
          scheduledAmount: '20.00',
          allocatedAmount: '0.00',
          outstandingAmount: '20.00',
          status: ReceivableScheduleLineStatus.OPEN,
          sourceSalesOrderLineId: null,
          memo: null,
          createdAt: '2026-04-10T00:00:00.000Z',
          updatedAt: '2026-04-10T00:00:00.000Z'
        }
      ]
    })

    await repository.allocateTransactionToReceivable({
      id: randomUUID(),
      tenantId,
      accountTransactionId: transactionId,
      paymentExecutionId: null,
      targetType: 'RECEIVABLE_SCHEDULE_LINE',
      targetScheduleId: scheduleId,
      targetScheduleLineId: scheduleLineId,
      allocatedAmount: '20.00',
      currencyCode: 'USD',
      allocatedAt: '2026-04-10T01:00:00.000Z',
      createdAt: '2026-04-10T01:00:00.000Z'
    })

    await expect(
      repository.saveAccountTransaction({
        id: transactionId,
        tenantId,
        orgId: null,
        financialAccountId: accountId,
        importBatchId: null,
        direction: AccountTransactionDirection.INFLOW,
        amount: '25.00',
        currencyCode: 'USD',
        transactionTime: '2026-04-10T00:00:00.000Z',
        valueDate: null,
        sourceType: AccountTransactionSourceType.MANUAL,
        status: AccountTransactionStatus.CONFIRMED,
        externalReference: null,
        counterpartyName: null,
        counterpartyAccountSnapshot: null,
        memo: null,
        paymentExecutionId: null,
        allocationStatus: AccountTransactionAllocationStatus.FULLY_ALLOCATED,
        allocatedAmount: '20.00',
        unallocatedAmount: '0.00',
        fileAssetId: null,
        attachmentRef: null,
        createdAt: '2026-04-10T00:00:00.000Z',
        updatedAt: '2026-04-11T00:00:00.000Z'
      })
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: 9
      }
    })
  })

  it('finance release repository / when saving and reading the current signal / should keep the release truth inside finance-service', async () => {
    const tenantId = `${prefix}_tenant`

    await repository.saveFinanceReleaseSignal({
      id: randomUUID(),
      tenantId,
      salesOrderId: `${prefix}_sales_order`,
      customerTenantPartyId: `${prefix}_customer`,
      signalStatus: FinanceReleaseStatus.REVIEW_REQUIRED,
      reasonCode: 'LIMIT_REVIEW',
      reasonSummary: 'credit limit review',
      effectiveAt: '2026-04-12T00:00:00.000Z',
      expiresAt: null,
      basedOnSummary: 'available credit below threshold',
      updatedAt: '2026-04-12T00:00:00.000Z'
    })

    const found = await repository.getFinanceReleaseSignalBySalesOrderId(
      tenantId,
      `${prefix}_sales_order`
    )

    expect(found?.signalStatus).toBe(FinanceReleaseStatus.REVIEW_REQUIRED)
  })
})
