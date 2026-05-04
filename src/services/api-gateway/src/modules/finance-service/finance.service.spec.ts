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

const SAMPLE_PAYABLE_SCHEDULE = {
  createdAt: '2026-04-28T10:30:00.000Z',
  currencyCode: 'USD',
  lines: [
    {
      allocatedAmount: '0.00',
      dueDate: '2026-05-10',
      executedAmount: '0.00',
      lineNo: 1,
      lineType: 'TERM_DUE',
      memo: 'first payable milestone',
      outstandingAmount: '300.00',
      payableScheduleLineId: 'payable-line-1',
      requestGovernanceStatus: 'DUE_NO_REQUEST',
      requestedAmount: '0.00',
      scheduledAmount: '300.00',
      sourcePurchaseOrderLineId: 'po-line-1',
      sourceRef: 'po-1/term-1',
      status: 'OPEN'
    }
  ],
  orgId: 'org-1',
  outstandingAmount: '300.00',
  payableScheduleId: 'ps-1',
  procurementSnapshotReference: 'po-1@snapshot',
  scheduleNo: 'AP-001',
  sourcePurchaseOrderId: 'po-1',
  sourcePurchaseOrderNo: 'PO-001',
  sourceType: 'PURCHASE_ORDER',
  status: 'OPEN',
  supplierSnapshot: 'Supplier One',
  supplierTenantPartyId: 'supplier-1',
  tenantId: 'tenant-1',
  totalAllocatedAmount: '0.00',
  totalExecutedAmount: '0.00',
  totalRequestedAmount: '0.00',
  totalScheduledAmount: '300.00',
  updatedAt: '2026-04-28T11:00:00.000Z'
}

const SAMPLE_PAYMENT_REQUEST = {
  beneficiarySupplierFinancialAccountId: 'supplier-account-1',
  currencyCode: 'USD',
  evidenceSnapshots: [
    {
      attachmentRef: 'asset://supplier-invoice',
      capturedAt: '2026-04-28T12:00:00.000Z',
      currencyCode: 'USD',
      documentAmount: '300.00',
      documentDate: '2026-04-28',
      evidenceSnapshotId: 'evidence-1',
      evidenceType: 'SUPPLIER_INVOICE',
      externalDocumentNo: 'INV-001',
      note: 'supplier invoice evidence'
    }
  ],
  lines: [
    {
      isEarlyRequest: false,
      lineStatus: 'OPEN',
      payableScheduleId: 'ps-1',
      payableScheduleLineId: 'payable-line-1',
      paymentRequestLineId: 'pr-line-1',
      requestedAmount: '300.00',
      scheduleDueDate: '2026-05-10'
    }
  ],
  orgId: 'org-1',
  paymentRequestId: 'pr-1',
  reason: 'due payable',
  requestNo: 'PAY-REQ-001',
  requestSource: 'FINANCE_INITIATED',
  requestedAmount: '300.00',
  requestedAt: '2026-04-28T12:00:00.000Z',
  sourcePurchaseOrderId: 'po-1',
  status: 'SUBMITTED',
  supplierTenantPartyId: 'supplier-1',
  tenantId: 'tenant-1',
  updatedAt: '2026-04-28T12:00:00.000Z'
}

const SAMPLE_PAYMENT_EXECUTION = {
  attachmentRefs: ['asset://payment-proof'],
  beneficiaryAccountSnapshot: '****7788',
  beneficiarySupplierFinancialAccountId: 'supplier-account-1',
  currencyCode: 'USD',
  executedAmount: '300.00',
  executedAt: '2026-04-28T13:00:00.000Z',
  executionReference: 'BANK-PAY-001',
  linkedAccountTransactionId: 'txn-out-1',
  paymentExecutionId: 'pe-1',
  paymentRequestId: 'pr-1',
  sourceFinancialAccountId: 'fa-1',
  status: 'RECORDED'
}

// Verifies the finance gateway service keeps tenant scoping and phase 1A DTO mapping aligned with the frozen finance contract.
describe('FinanceService', () => {
  const financeQueryAdapter = {
    getExchangeRate: jest.fn(),
    getFinanceReleaseSignal: jest.fn(),
    getFinancialAccount: jest.fn(),
    getPayableSchedule: jest.fn(),
    getReceivableSchedule: jest.fn(),
    searchAccountTransactions: jest.fn(),
    searchFinancialAccounts: jest.fn(),
    searchPayableSchedules: jest.fn(),
    searchPaymentAllocations: jest.fn(),
    searchPaymentExecutions: jest.fn(),
    searchPaymentRequests: jest.fn(),
    searchReceivableSchedules: jest.fn()
  }
  const financeManagementAdapter = {
    allocatePaymentToPayable: jest.fn(),
    allocatePaymentToReceivable: jest.fn(),
    applyPayableScheduleAdjustmentFromPurchaseOrderChange: jest.fn(),
    createFinancialAccount: jest.fn(),
    createPayableScheduleFromPurchaseOrder: jest.fn(),
    createPaymentRequest: jest.fn(),
    createReceivableScheduleFromSalesOrder: jest.fn(),
    decidePaymentRequest: jest.fn(),
    executePaymentRequest: jest.fn(),
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

  it('maps finance phase 1B payable and payment flows without promoting requests or executions into payable truth', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', orgId: 'org-1', scopeLevel: 'TENANT', tid: 'tenant-1', typ: 'USER' }
    }

    financeQueryAdapter.searchPayableSchedules.mockResolvedValue({
      page: 1,
      pageSize: 20,
      payableSchedules: [
        {
          currencyCode: 'USD',
          nearestDueDate: '2026-05-10',
          outstandingAmount: '300.00',
          payableScheduleId: 'ps-1',
          requestGovernanceStatusSummary: 'DUE_NO_REQUEST',
          scheduleNo: 'AP-001',
          sourcePurchaseOrderId: 'po-1',
          sourcePurchaseOrderNo: 'PO-001',
          status: 'OPEN',
          supplierDisplayName: 'Supplier One',
          supplierTenantPartyId: 'supplier-1'
        }
      ],
      total: 1
    })
    financeQueryAdapter.getPayableSchedule.mockResolvedValue({
      payableSchedule: SAMPLE_PAYABLE_SCHEDULE
    })
    financeQueryAdapter.searchPaymentRequests.mockResolvedValue({
      page: 1,
      pageSize: 20,
      paymentRequests: [
        {
          currencyCode: 'USD',
          paymentRequestId: 'pr-1',
          requestNo: 'PAY-REQ-001',
          requestSource: 'FINANCE_INITIATED',
          requestedAmount: '300.00',
          requestedAt: '2026-04-28T12:00:00.000Z',
          status: 'SUBMITTED',
          supplierDisplayName: 'Supplier One',
          supplierTenantPartyId: 'supplier-1'
        }
      ],
      total: 1
    })
    financeQueryAdapter.searchPaymentExecutions.mockResolvedValue({
      page: 1,
      pageSize: 20,
      paymentExecutions: [
        {
          currencyCode: 'USD',
          executedAmount: '300.00',
          executedAt: '2026-04-28T13:00:00.000Z',
          paymentExecutionId: 'pe-1',
          paymentRequestId: 'pr-1',
          status: 'RECORDED',
          supplierTenantPartyId: 'supplier-1'
        }
      ],
      total: 1
    })
    financeQueryAdapter.searchPaymentAllocations.mockResolvedValue({
      page: 1,
      pageSize: 20,
      paymentAllocations: [
        {
          ...SAMPLE_PAYMENT_ALLOCATION,
          accountTransactionId: 'txn-out-1',
          paymentExecutionId: 'pe-1',
          paymentRequestId: 'pr-1',
          targetScheduleId: 'ps-1',
          targetScheduleLineId: 'payable-line-1',
          targetType: 'PAYABLE_SCHEDULE_LINE'
        }
      ],
      total: 1
    })
    financeManagementAdapter.createPayableScheduleFromPurchaseOrder.mockResolvedValue({
      payableSchedule: SAMPLE_PAYABLE_SCHEDULE
    })
    financeManagementAdapter.applyPayableScheduleAdjustmentFromPurchaseOrderChange.mockResolvedValue({
      payableSchedule: SAMPLE_PAYABLE_SCHEDULE
    })
    financeManagementAdapter.createPaymentRequest.mockResolvedValue({
      paymentRequest: SAMPLE_PAYMENT_REQUEST
    })
    financeManagementAdapter.decidePaymentRequest.mockResolvedValue({
      paymentRequest: { ...SAMPLE_PAYMENT_REQUEST, status: 'APPROVED' }
    })
    financeManagementAdapter.executePaymentRequest.mockResolvedValue({
      paymentExecution: SAMPLE_PAYMENT_EXECUTION,
      paymentRequest: { ...SAMPLE_PAYMENT_REQUEST, status: 'EXECUTED' }
    })
    financeManagementAdapter.allocatePaymentToPayable.mockResolvedValue({
      paymentAllocations: [
        {
          ...SAMPLE_PAYMENT_ALLOCATION,
          accountTransactionId: 'txn-out-1',
          paymentExecutionId: 'pe-1',
          paymentRequestId: 'pr-1',
          targetScheduleId: 'ps-1',
          targetScheduleLineId: 'payable-line-1',
          targetType: 'PAYABLE_SCHEDULE_LINE'
        }
      ]
    })

    const payablePage = await service.searchPayableSchedules(
      'tenant-1',
      { keyword: 'PO-001', page: 1, pageSize: 20, requestGovernanceStatus: 'DUE_NO_REQUEST' },
      source as any
    )
    const payableDetail = await service.getPayableSchedule('tenant-1', 'ps-1', source as any)
    const requestPage = await service.searchPaymentRequests(
      'tenant-1',
      { page: 1, pageSize: 20, status: 'SUBMITTED' },
      source as any
    )
    const executionPage = await service.searchPaymentExecutions(
      'tenant-1',
      { page: 1, pageSize: 20, paymentRequestId: 'pr-1' },
      source as any
    )
    const allocationPage = await service.searchPaymentAllocations(
      'tenant-1',
      {
        page: 1,
        pageSize: 20,
        paymentExecutionId: 'pe-1',
        targetScheduleId: 'ps-1',
        targetType: 'PAYABLE_SCHEDULE_LINE'
      },
      source as any
    )
    const createdPayable = await service.createPayableScheduleFromPurchaseOrder(
      'tenant-1',
      {
        currencyCode: 'USD',
        lines: [
          {
            dueDate: '2026-05-10',
            lineType: 'TERM_DUE',
            scheduledAmount: '300.00',
            sourceRef: 'po-1/term-1'
          }
        ],
        purchaseOrderId: 'po-1',
        supplierSnapshot: 'Supplier One',
        supplierTenantPartyId: 'supplier-1'
      },
      source as any
    )
    const adjustedPayable = await service.applyPayableScheduleAdjustmentFromPurchaseOrderChange(
      'tenant-1',
      {
        adjustments: [{ action: 'ADD', dueDate: '2026-06-10', lineType: 'TERM_DUE', newSourceRef: 'po-1/change-1', scheduledAmount: '50.00' }],
        purchaseOrderChangeId: 'po-change-1',
        purchaseOrderId: 'po-1'
      },
      source as any
    )
    const paymentRequest = await service.createPaymentRequest(
      'tenant-1',
      {
        beneficiarySupplierFinancialAccountId: 'supplier-account-1',
        currencyCode: 'USD',
        requestSource: 'FINANCE_INITIATED',
        requestedAmount: '300.00',
        requestedLines: [
          {
            payableScheduleId: 'ps-1',
            payableScheduleLineId: 'payable-line-1',
            requestedAmount: '300.00'
          }
        ],
        supplierTenantPartyId: 'supplier-1'
      },
      source as any
    )
    const decidedRequest = await service.decidePaymentRequest(
      'tenant-1',
      'pr-1',
      { decision: 'APPROVED', decisionReason: 'approved for payment' },
      source as any
    )
    const executedRequest = await service.executePaymentRequest(
      'tenant-1',
      'pr-1',
      {
        currencyCode: 'USD',
        executedAmount: '300.00',
        executedAt: '2026-04-28T13:00:00.000Z',
        sourceFinancialAccountId: 'fa-1'
      },
      source as any
    )
    const payableAllocations = await service.allocatePaymentToPayable(
      'tenant-1',
      {
        accountTransactionId: 'txn-out-1',
        allocations: [
          {
            allocatedAmount: '300.00',
            payableScheduleId: 'ps-1',
            payableScheduleLineId: 'payable-line-1'
          }
        ],
        paymentExecutionId: 'pe-1'
      },
      source as any
    )

    expect(financeQueryAdapter.searchPayableSchedules).toHaveBeenCalledWith(
      expect.objectContaining({
        requestGovernanceStatus: 'DUE_NO_REQUEST',
        tenantId: 'tenant-1'
      }),
      source
    )
    expect(financeManagementAdapter.createPaymentRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        beneficiarySupplierFinancialAccountId: 'supplier-account-1',
        requestedLines: [expect.objectContaining({ payableScheduleLineId: 'payable-line-1' })],
        tenantId: 'tenant-1'
      }),
      source
    )
    expect(financeManagementAdapter.executePaymentRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentRequestId: 'pr-1',
        sourceFinancialAccountId: 'fa-1',
        tenantId: 'tenant-1'
      }),
      source
    )

    expect(payablePage.payableSchedules[0]?.requestGovernanceStatusSummary).toBe('DUE_NO_REQUEST')
    expect(payableDetail.lines[0]?.requestGovernanceStatus).toBe('DUE_NO_REQUEST')
    expect(requestPage.paymentRequests[0]?.status).toBe('SUBMITTED')
    expect(executionPage.paymentExecutions[0]?.paymentExecutionId).toBe('pe-1')
    expect(allocationPage.paymentAllocations[0]?.targetType).toBe('PAYABLE_SCHEDULE_LINE')
    expect(createdPayable.payableScheduleId).toBe('ps-1')
    expect(adjustedPayable.payableScheduleId).toBe('ps-1')
    expect(paymentRequest.paymentRequestId).toBe('pr-1')
    expect(decidedRequest.status).toBe('APPROVED')
    expect(executedRequest.paymentExecution.paymentExecutionId).toBe('pe-1')
    expect(payableAllocations[0]?.targetScheduleId).toBe('ps-1')
  })
})
