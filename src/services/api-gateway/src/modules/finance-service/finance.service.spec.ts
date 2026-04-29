import { ForbiddenException } from '@nestjs/common'
import { FinanceService } from './finance.service'

const SAMPLE_FINANCIAL_ACCOUNT = {
  accountIdentifierMasked: '****1001',
  accountName: 'Main USD Account',
  accountNo: 'FA-001',
  accountType: 'BANK',
  createdAt: '2026-04-28T08:00:00.000Z',
  currencyCode: 'USD',
  currentBalance: '1200.00',
  financialAccountId: 'fa-1',
  institutionName: 'Bank One',
  lastTransactionAt: '2026-04-28T09:00:00.000Z',
  orgId: 'org-1',
  status: 'ACTIVE',
  tenantId: 'tenant-1',
  updatedAt: '2026-04-28T09:00:00.000Z'
}

const SAMPLE_TRANSACTION = {
  accountTransactionId: 'txn-1',
  allocatedAmount: '0.00',
  allocationStatus: 'UNALLOCATED',
  amount: '150.00',
  attachmentRef: 'attachments/txn-1',
  counterpartyAccountSnapshot: '****9988',
  counterpartyName: 'Customer One',
  createdAt: '2026-04-28T09:30:00.000Z',
  currencyCode: 'USD',
  direction: 'INFLOW',
  externalReference: 'BANK-001',
  fileAssetId: 'asset-1',
  financialAccountId: 'fa-1',
  memo: 'Manual receipt',
  paymentExecutionId: '',
  sourceType: 'MANUAL',
  status: 'CONFIRMED',
  transactionTime: '2026-04-28T09:15:00.000Z',
  unallocatedAmount: '150.00',
  valueDate: '2026-04-28'
}

const SAMPLE_CUSTOMER_FINANCIAL_ACCOUNT = {
  accountHolderName: 'Customer One',
  accountIdentifierMasked: '****0011',
  accountProviderType: 'BANK',
  currencyCode: 'USD',
  customerFinancialAccountId: 'cfa-1',
  customerTenantPartyId: 'customer-1',
  isDefault: true,
  verifiedStatus: 'UNVERIFIED'
}

const SAMPLE_EXCHANGE_RATE = {
  baseCurrencyCode: 'USD',
  effectiveAt: '2026-04-28T00:00:00.000Z',
  exchangeRateId: 'fx-1',
  quoteCurrencyCode: 'CNY',
  rateValue: '7.230000',
  setBy: 'operator-1',
  tenantId: 'tenant-1',
  updatedAt: '2026-04-28T10:00:00.000Z'
}

const SAMPLE_RECEIVABLE_SCHEDULE = {
  createdAt: '2026-04-28T10:30:00.000Z',
  currencyCode: 'USD',
  customerSnapshot: 'Customer One',
  customerTenantPartyId: 'customer-1',
  lines: [
    {
      allocatedAmount: '50.00',
      dueDate: '2026-05-10',
      lineNo: 1,
      memo: 'first milestone',
      outstandingAmount: '100.00',
      receivableScheduleLineId: 'line-1',
      scheduledAmount: '150.00',
      sourceSalesOrderLineId: 'so-line-1',
      status: 'PARTIALLY_PAID'
    }
  ],
  orgId: 'org-1',
  outstandingAmount: '100.00',
  receivableScheduleId: 'rs-1',
  salesExchangeRateSnapshot: 'USD/CNY 7.20',
  scheduleNo: 'AR-001',
  sourceSalesOrderId: 'so-1',
  status: 'PARTIALLY_PAID',
  tenantId: 'tenant-1',
  totalAllocatedAmount: '50.00',
  totalScheduledAmount: '150.00',
  updatedAt: '2026-04-28T11:00:00.000Z'
}

const SAMPLE_FINANCE_RELEASE_SIGNAL = {
  basedOnSummary: 'credit ok',
  customerTenantPartyId: 'customer-1',
  effectiveAt: '2026-04-28T11:30:00.000Z',
  expiresAt: '',
  financeReleaseSignalId: 'fr-1',
  reasonCode: 'CREDIT_OK',
  reasonSummary: 'within limit',
  salesOrderId: 'so-1',
  signalStatus: 'RELEASED',
  tenantId: 'tenant-1',
  updatedAt: '2026-04-28T11:30:00.000Z'
}

const SAMPLE_PAYMENT_ALLOCATION = {
  accountTransactionId: 'txn-1',
  allocatedAmount: '50.00',
  allocatedAt: '2026-04-28T12:00:00.000Z',
  currencyCode: 'USD',
  paymentAllocationId: 'pa-1',
  paymentExecutionId: '',
  targetScheduleId: 'rs-1',
  targetScheduleLineId: 'line-1',
  targetType: 'RECEIVABLE_SCHEDULE_LINE'
}

// Verifies the finance gateway service keeps tenant scoping and phase 1A DTO mapping aligned with the frozen finance contract.
describe('FinanceService', () => {
  const financeQueryAdapter = {
    getExchangeRate: jest.fn(),
    getFinanceReleaseSignal: jest.fn(),
    getFinancialAccount: jest.fn(),
    getReceivableSchedule: jest.fn(),
    searchAccountTransactions: jest.fn(),
    searchFinancialAccounts: jest.fn(),
    searchPaymentAllocations: jest.fn(),
    searchReceivableSchedules: jest.fn()
  }
  const financeManagementAdapter = {
    allocatePaymentToReceivable: jest.fn(),
    createFinancialAccount: jest.fn(),
    createReceivableScheduleFromSalesOrder: jest.fn(),
    importAccountTransactions: jest.fn(),
    recordAccountTransaction: jest.fn(),
    registerCustomerFinancialAccount: jest.fn(),
    setExchangeRate: jest.fn(),
    setFinanceReleaseSignal: jest.fn(),
    updateFinancialAccountBasics: jest.fn()
  }

  const service = new FinanceService(financeQueryAdapter as any, financeManagementAdapter as any)

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('rejects tenant-scoped operators when they request another tenant finance workspace', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1' }
    }

    await expect(
      service.searchFinancialAccounts('tenant-2', { page: 1, pageSize: 20 }, source as any)
    ).rejects.toBeInstanceOf(ForbiddenException)

    expect(financeQueryAdapter.searchFinancialAccounts).not.toHaveBeenCalled()
  })

  it('maps finance phase 1A query and command flows without widening the finance owner boundary', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', orgId: 'org-1', scopeLevel: 'TENANT', tid: 'tenant-1', typ: 'USER' }
    }

    financeQueryAdapter.searchFinancialAccounts.mockResolvedValue({
      financialAccounts: [SAMPLE_FINANCIAL_ACCOUNT],
      page: 2,
      pageSize: 10,
      total: 1
    })
    financeQueryAdapter.getFinancialAccount.mockResolvedValue({
      financialAccount: SAMPLE_FINANCIAL_ACCOUNT
    })
    financeQueryAdapter.searchAccountTransactions.mockResolvedValue({
      accountTransactions: [SAMPLE_TRANSACTION],
      page: 1,
      pageSize: 20,
      total: 1
    })
    financeManagementAdapter.createFinancialAccount.mockResolvedValue({
      financialAccount: SAMPLE_FINANCIAL_ACCOUNT
    })
    financeManagementAdapter.updateFinancialAccountBasics.mockResolvedValue({
      financialAccount: { ...SAMPLE_FINANCIAL_ACCOUNT, accountName: 'Main USD Account Rev' }
    })
    financeManagementAdapter.importAccountTransactions.mockResolvedValue({
      accountTransactionIds: ['txn-1'],
      batch: {
        acceptedCount: 1,
        accountTransactionImportBatchId: 'batch-1',
        attachmentRef: 'attachments/import-1',
        duplicateCount: 0,
        failedCount: 0,
        fileAssetId: 'asset-import-1',
        sourceBatchReference: 'BATCH-001',
        sourceType: 'CSV_IMPORT',
        totalRows: 1
      }
    })
    financeManagementAdapter.recordAccountTransaction.mockResolvedValue({
      accountTransaction: SAMPLE_TRANSACTION
    })
    financeManagementAdapter.registerCustomerFinancialAccount.mockResolvedValue({
      customerFinancialAccount: SAMPLE_CUSTOMER_FINANCIAL_ACCOUNT
    })
    financeQueryAdapter.getExchangeRate.mockResolvedValue({
      exchangeRate: SAMPLE_EXCHANGE_RATE
    })
    financeManagementAdapter.setExchangeRate.mockResolvedValue({
      exchangeRate: SAMPLE_EXCHANGE_RATE
    })
    financeQueryAdapter.searchReceivableSchedules.mockResolvedValue({
      page: 1,
      pageSize: 20,
      receivableSchedules: [
        {
          currencyCode: 'USD',
          customerDisplayName: 'Customer One',
          customerTenantPartyId: 'customer-1',
          financeReleaseStatus: 'RELEASED',
          nearestDueDate: '2026-05-10',
          outstandingAmount: '100.00',
          receivableScheduleId: 'rs-1',
          scheduleNo: 'AR-001',
          sourceSalesOrderId: 'so-1',
          status: 'PARTIALLY_PAID'
        }
      ],
      total: 1
    })
    financeQueryAdapter.getReceivableSchedule.mockResolvedValue({
      receivableSchedule: SAMPLE_RECEIVABLE_SCHEDULE
    })
    financeQueryAdapter.getFinanceReleaseSignal.mockResolvedValue({
      financeReleaseSignal: SAMPLE_FINANCE_RELEASE_SIGNAL
    })
    financeManagementAdapter.createReceivableScheduleFromSalesOrder.mockResolvedValue({
      receivableSchedule: SAMPLE_RECEIVABLE_SCHEDULE
    })
    financeManagementAdapter.setFinanceReleaseSignal.mockResolvedValue({
      financeReleaseSignal: SAMPLE_FINANCE_RELEASE_SIGNAL
    })
    financeQueryAdapter.searchPaymentAllocations.mockResolvedValue({
      page: 1,
      pageSize: 20,
      paymentAllocations: [SAMPLE_PAYMENT_ALLOCATION],
      total: 1
    })
    financeManagementAdapter.allocatePaymentToReceivable.mockResolvedValue({
      paymentAllocations: [SAMPLE_PAYMENT_ALLOCATION]
    })

    const accountPage = await service.searchFinancialAccounts(
      'tenant-1',
      {
        accountType: 'BANK',
        keyword: 'main',
        page: 2,
        pageSize: 10,
        status: 'ACTIVE'
      },
      source as any
    )
    const accountDetail = await service.getFinancialAccount('tenant-1', 'fa-1', source as any)
    const transactionPage = await service.searchAccountTransactions(
      'tenant-1',
      {
        allocationStatus: 'UNALLOCATED',
        financialAccountId: 'fa-1',
        page: 1,
        pageSize: 20
      },
      source as any
    )
    const createdAccount = await service.createFinancialAccount(
      'tenant-1',
      {
        accountIdentifier: '00112233',
        accountName: 'Main USD Account',
        accountType: 'BANK',
        currencyCode: 'USD',
        institutionName: 'Bank One',
        openingBalance: '1200.00',
        openingBalanceAsOf: '2026-04-28',
        orgId: 'org-1'
      },
      source as any
    )
    const updatedAccount = await service.updateFinancialAccountBasics(
      'tenant-1',
      'fa-1',
      {
        accountIdentifier: '00112233',
        accountName: 'Main USD Account Rev',
        institutionName: 'Bank One',
        status: 'ACTIVE'
      },
      source as any
    )
    const importedBatch = await service.importAccountTransactions(
      'tenant-1',
      'fa-1',
      {
        attachmentRef: 'attachments/import-1',
        auditReason: 'import statement',
        fileAssetId: 'asset-import-1',
        importedBy: 'finance-operator',
        sourceBatchReference: 'BATCH-001',
        sourceType: 'CSV_IMPORT',
        transactions: [
          {
            amount: '150.00',
            counterpartyAccountSnapshot: '****9988',
            counterpartyName: 'Customer One',
            currencyCode: 'USD',
            direction: 'INFLOW',
            externalReference: 'BANK-001',
            memo: 'csv row',
            transactionTime: '2026-04-28T09:15:00.000Z',
            valueDate: '2026-04-28'
          }
        ]
      },
      source as any
    )
    const recordedTransaction = await service.recordAccountTransaction(
      'tenant-1',
      'fa-1',
      {
        amount: '150.00',
        attachmentRef: 'attachments/txn-1',
        auditReason: 'record receipt',
        counterpartyAccountSnapshot: '****9988',
        counterpartyName: 'Customer One',
        currencyCode: 'USD',
        direction: 'INFLOW',
        externalReference: 'BANK-001',
        fileAssetId: 'asset-1',
        memo: 'Manual receipt',
        status: 'CONFIRMED',
        transactionTime: '2026-04-28T09:15:00.000Z',
        valueDate: '2026-04-28'
      },
      source as any
    )
    const customerAccount = await service.registerCustomerFinancialAccount(
      'tenant-1',
      {
        accountHolderName: 'Customer One',
        accountIdentifier: '99887766',
        accountProviderType: 'BANK',
        auditReason: 'register remittance account',
        currencyCode: 'USD',
        customerTenantPartyId: 'customer-1',
        isDefault: true
      },
      source as any
    )
    const exchangeRate = await service.getExchangeRate(
      'tenant-1',
      {
        baseCurrencyCode: 'USD',
        effectiveAt: '2026-04-28T00:00:00.000Z',
        quoteCurrencyCode: 'CNY'
      },
      source as any
    )
    const savedExchangeRate = await service.setExchangeRate(
      'tenant-1',
      {
        auditReason: 'daily rate refresh',
        baseCurrencyCode: 'USD',
        effectiveAt: '2026-04-28T00:00:00.000Z',
        quoteCurrencyCode: 'CNY',
        rateValue: '7.230000',
        setBy: 'operator-1'
      },
      source as any
    )
    const receivablePage = await service.searchReceivableSchedules(
      'tenant-1',
      {
        financeReleaseStatus: 'RELEASED',
        overdueOnly: false,
        page: 1,
        pageSize: 20,
        status: 'PARTIALLY_PAID'
      },
      source as any
    )
    const receivableDetail = await service.getReceivableSchedule('tenant-1', 'rs-1', source as any)
    const financeReleaseSignal = await service.getFinanceReleaseSignal('tenant-1', 'so-1', source as any)
    const createdReceivable = await service.createReceivableScheduleFromSalesOrder(
      'tenant-1',
      {
        auditReason: 'create receivable from established order',
        currencyCode: 'USD',
        customerSnapshot: 'Customer One',
        customerTenantPartyId: 'customer-1',
        lines: [
          {
            dueDate: '2026-05-10',
            memo: 'first milestone',
            scheduledAmount: '150.00',
            sourceSalesOrderLineId: 'so-line-1'
          }
        ],
        orgId: 'org-1',
        salesExchangeRateSnapshot: 'USD/CNY 7.20',
        salesOrderId: 'so-1'
      },
      source as any
    )
    const savedFinanceRelease = await service.setFinanceReleaseSignal(
      'tenant-1',
      'so-1',
      {
        auditReason: 'refresh finance gate',
        basedOnSummary: 'credit ok',
        customerTenantPartyId: 'customer-1',
        effectiveAt: '2026-04-28T11:30:00.000Z',
        expiresAt: '',
        reasonCode: 'CREDIT_OK',
        reasonSummary: 'within limit',
        signalStatus: 'RELEASED'
      },
      source as any
    )
    const allocationPage = await service.searchPaymentAllocations(
      'tenant-1',
      {
        accountTransactionId: 'txn-1',
        page: 1,
        pageSize: 20,
        receivableScheduleId: 'rs-1'
      },
      source as any
    )
    const createdAllocations = await service.allocatePaymentToReceivable(
      'tenant-1',
      {
        accountTransactionId: 'txn-1',
        allocations: [
          {
            allocatedAmount: '50.00',
            receivableScheduleId: 'rs-1',
            receivableScheduleLineId: 'line-1'
          }
        ],
        auditReason: 'apply customer receipt'
      },
      source as any
    )

    expect(financeQueryAdapter.searchFinancialAccounts).toHaveBeenCalledWith(
      expect.objectContaining({
        accountType: expect.any(Number),
        keyword: 'main',
        page: 2,
        pageSize: 10,
        status: expect.any(Number),
        tenantId: 'tenant-1'
      }),
      source
    )
    expect(financeManagementAdapter.importAccountTransactions).toHaveBeenCalledWith(
      expect.objectContaining({
        auditReason: 'import statement',
        financialAccountId: 'fa-1',
        sourceType: expect.any(Number),
        tenantId: 'tenant-1'
      }),
      source
    )
    expect(financeManagementAdapter.allocatePaymentToReceivable).toHaveBeenCalledWith(
      expect.objectContaining({
        accountTransactionId: 'txn-1',
        tenantId: 'tenant-1'
      }),
      source
    )

    expect(accountPage.financialAccounts[0]?.currentBalance).toBe('1200.00')
    expect(accountDetail.financialAccountId).toBe('fa-1')
    expect(transactionPage.accountTransactions[0]?.allocationStatus).toBe('UNALLOCATED')
    expect(createdAccount.financialAccountId).toBe('fa-1')
    expect(updatedAccount.accountName).toBe('Main USD Account Rev')
    expect(importedBatch.batch?.acceptedCount).toBe(1)
    expect(recordedTransaction.accountTransactionId).toBe('txn-1')
    expect(customerAccount.customerFinancialAccountId).toBe('cfa-1')
    expect(exchangeRate.exchangeRateId).toBe('fx-1')
    expect(savedExchangeRate.rateValue).toBe('7.230000')
    expect(receivablePage.receivableSchedules[0]?.financeReleaseStatus).toBe('RELEASED')
    expect(receivableDetail.receivableScheduleId).toBe('rs-1')
    expect(financeReleaseSignal.financeReleaseSignalId).toBe('fr-1')
    expect(createdReceivable.receivableScheduleId).toBe('rs-1')
    expect(savedFinanceRelease.signalStatus).toBe('RELEASED')
    expect(allocationPage.paymentAllocations[0]?.paymentAllocationId).toBe('pa-1')
    expect(createdAllocations[0]?.targetScheduleId).toBe('rs-1')
  })
})
