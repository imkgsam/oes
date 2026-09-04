import { Reflector } from '@nestjs/core'
import { REQUIRE_PERMISSIONS_METADATA_KEY } from '@oes/common/authorization'
import { FinanceController } from '../../../../../../../src/modules/finance-service/interface/http/controllers/finance.controller'

// Verifies the finance gateway controller keeps permissions and phase 1A request forwarding aligned with the frozen finance BFF surface.
describe('FinanceController', () => {
  const financeService = {
    allocatePaymentToPayable: jest.fn(),
    allocatePaymentToReceivable: jest.fn(),
    applyPayableScheduleAdjustmentFromPurchaseOrderChange: jest.fn(),
    createFinancialAccount: jest.fn(),
    createPayableScheduleFromPurchaseOrder: jest.fn(),
    createPaymentRequest: jest.fn(),
    createReceivableScheduleFromSalesOrder: jest.fn(),
    decidePaymentRequest: jest.fn(),
    executePaymentRequest: jest.fn(),
    getExchangeRate: jest.fn(),
    getFinanceReleaseSignal: jest.fn(),
    getFinancialAccount: jest.fn(),
    getPayableSchedule: jest.fn(),
    getReceivableSchedule: jest.fn(),
    importAccountTransactions: jest.fn(),
    recordAccountTransaction: jest.fn(),
    registerCustomerFinancialAccount: jest.fn(),
    searchAccountTransactions: jest.fn(),
    searchFinancialAccounts: jest.fn(),
    searchPayableSchedules: jest.fn(),
    searchPaymentAllocations: jest.fn(),
    searchPaymentExecutions: jest.fn(),
    searchPaymentRequests: jest.fn(),
    searchReceivableSchedules: jest.fn(),
    setExchangeRate: jest.fn(),
    setFinanceReleaseSignal: jest.fn(),
    updateFinancialAccountBasics: jest.fn()
  }

  const controller = new FinanceController(financeService as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('declares the expected permissions on finance endpoints', () => {
    const reflector = new Reflector()

    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        FinanceController.prototype.searchFinancialAccounts
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        FinanceController.prototype.getFinancialAccount
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        FinanceController.prototype.searchAccountTransactions
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        FinanceController.prototype.createFinancialAccount
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        FinanceController.prototype.updateFinancialAccountBasics
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        FinanceController.prototype.importAccountTransactions
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        FinanceController.prototype.recordAccountTransaction
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        FinanceController.prototype.registerCustomerFinancialAccount
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, FinanceController.prototype.getExchangeRate)
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, FinanceController.prototype.setExchangeRate)
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        FinanceController.prototype.searchReceivableSchedules
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        FinanceController.prototype.getReceivableSchedule
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        FinanceController.prototype.getFinanceReleaseSignal
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        FinanceController.prototype.createReceivableScheduleFromSalesOrder
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        FinanceController.prototype.setFinanceReleaseSignal
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        FinanceController.prototype.searchPaymentAllocations
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        FinanceController.prototype.allocatePaymentToReceivable
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        FinanceController.prototype.searchPayableSchedules
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        FinanceController.prototype.getPayableSchedule
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        FinanceController.prototype.searchPaymentRequests
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        FinanceController.prototype.searchPaymentExecutions
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        FinanceController.prototype.createPayableScheduleFromPurchaseOrder
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        FinanceController.prototype.applyPayableScheduleAdjustmentFromPurchaseOrderChange
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        FinanceController.prototype.createPaymentRequest
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        FinanceController.prototype.decidePaymentRequest
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        FinanceController.prototype.executePaymentRequest
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        FinanceController.prototype.allocatePaymentToPayable
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
  })

  it('forwards the minimum finance phase 1A BFF surface to the proxy service', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1' }

    financeService.searchFinancialAccounts.mockResolvedValue({
      financialAccounts: [],
      page: 1,
      pageSize: 20,
      total: 0
    })
    financeService.getFinancialAccount.mockResolvedValue({ financialAccountId: 'fa-1' })
    financeService.searchAccountTransactions.mockResolvedValue({
      accountTransactions: [],
      page: 1,
      pageSize: 20,
      total: 0
    })
    financeService.createFinancialAccount.mockResolvedValue({ financialAccountId: 'fa-1' })
    financeService.updateFinancialAccountBasics.mockResolvedValue({ financialAccountId: 'fa-1' })
    financeService.importAccountTransactions.mockResolvedValue({
      accountTransactionIds: ['txn-1'],
      batch: { acceptedCount: 1 }
    })
    financeService.recordAccountTransaction.mockResolvedValue({ accountTransactionId: 'txn-1' })
    financeService.registerCustomerFinancialAccount.mockResolvedValue({
      customerFinancialAccountId: 'cfa-1'
    })
    financeService.getExchangeRate.mockResolvedValue({ exchangeRateId: 'fx-1' })
    financeService.setExchangeRate.mockResolvedValue({ exchangeRateId: 'fx-1' })
    financeService.searchReceivableSchedules.mockResolvedValue({
      page: 1,
      pageSize: 20,
      receivableSchedules: [],
      total: 0
    })
    financeService.getReceivableSchedule.mockResolvedValue({ receivableScheduleId: 'rs-1' })
    financeService.getFinanceReleaseSignal.mockResolvedValue({ financeReleaseSignalId: 'fr-1' })
    financeService.createReceivableScheduleFromSalesOrder.mockResolvedValue({
      receivableScheduleId: 'rs-1'
    })
    financeService.setFinanceReleaseSignal.mockResolvedValue({ financeReleaseSignalId: 'fr-1' })
    financeService.searchPaymentAllocations.mockResolvedValue({
      page: 1,
      pageSize: 20,
      paymentAllocations: [],
      total: 0
    })
    financeService.allocatePaymentToReceivable.mockResolvedValue([{ paymentAllocationId: 'pa-1' }])
    financeService.searchPayableSchedules.mockResolvedValue({
      page: 1,
      pageSize: 20,
      payableSchedules: [],
      total: 0
    })
    financeService.getPayableSchedule.mockResolvedValue({ payableScheduleId: 'ps-1' })
    financeService.searchPaymentRequests.mockResolvedValue({
      page: 1,
      pageSize: 20,
      paymentRequests: [],
      total: 0
    })
    financeService.searchPaymentExecutions.mockResolvedValue({
      page: 1,
      pageSize: 20,
      paymentExecutions: [],
      total: 0
    })
    financeService.createPayableScheduleFromPurchaseOrder.mockResolvedValue({
      payableScheduleId: 'ps-1'
    })
    financeService.applyPayableScheduleAdjustmentFromPurchaseOrderChange.mockResolvedValue({
      payableScheduleId: 'ps-1'
    })
    financeService.createPaymentRequest.mockResolvedValue({ paymentRequestId: 'pr-1' })
    financeService.decidePaymentRequest.mockResolvedValue({
      paymentRequestId: 'pr-1',
      status: 'APPROVED'
    })
    financeService.executePaymentRequest.mockResolvedValue({
      paymentExecution: { paymentExecutionId: 'pe-1' },
      paymentRequest: { paymentRequestId: 'pr-1' }
    })
    financeService.allocatePaymentToPayable.mockResolvedValue([
      { paymentAllocationId: 'pa-payable-1' }
    ])

    await controller.searchFinancialAccounts(
      'tenant-1',
      { accountType: 'BANK', keyword: 'main', page: 2, pageSize: 10, status: 'ACTIVE' } as any,
      source as any
    )
    await controller.getFinancialAccount('tenant-1', 'fa-1', source as any)
    await controller.searchAccountTransactions(
      'tenant-1',
      { financialAccountId: 'fa-1', page: 1, pageSize: 20 } as any,
      source as any
    )
    await controller.createFinancialAccount(
      'tenant-1',
      {
        accountIdentifier: '00112233',
        accountName: 'Main USD Account',
        accountType: 'BANK',
        currencyCode: 'USD'
      } as any,
      source as any
    )
    await controller.updateFinancialAccountBasics(
      'tenant-1',
      'fa-1',
      { accountName: 'Main USD Account Rev', status: 'ACTIVE' } as any,
      source as any
    )
    await controller.importAccountTransactions(
      'tenant-1',
      'fa-1',
      { sourceType: 'CSV_IMPORT', transactions: [] } as any,
      source as any
    )
    await controller.recordAccountTransaction(
      'tenant-1',
      'fa-1',
      {
        amount: '150.00',
        currencyCode: 'USD',
        direction: 'INFLOW',
        transactionTime: '2026-04-28T09:15:00.000Z'
      } as any,
      source as any
    )
    await controller.registerCustomerFinancialAccount(
      'tenant-1',
      {
        accountHolderName: 'Customer One',
        accountIdentifier: '99887766',
        accountProviderType: 'BANK',
        customerTenantPartyId: 'customer-1'
      } as any,
      source as any
    )
    await controller.getExchangeRate(
      'tenant-1',
      {
        baseCurrencyCode: 'USD',
        effectiveAt: '2026-04-28T00:00:00.000Z',
        quoteCurrencyCode: 'CNY'
      } as any,
      source as any
    )
    await controller.setExchangeRate(
      'tenant-1',
      {
        baseCurrencyCode: 'USD',
        effectiveAt: '2026-04-28T00:00:00.000Z',
        quoteCurrencyCode: 'CNY',
        rateValue: '7.230000',
        setBy: 'operator-1'
      } as any,
      source as any
    )
    await controller.searchReceivableSchedules(
      'tenant-1',
      { page: 1, pageSize: 20, status: 'PARTIALLY_PAID' } as any,
      source as any
    )
    await controller.getReceivableSchedule('tenant-1', 'rs-1', source as any)
    await controller.getFinanceReleaseSignal('tenant-1', 'so-1', source as any)
    await controller.createReceivableScheduleFromSalesOrder(
      'tenant-1',
      {
        currencyCode: 'USD',
        customerSnapshot: 'Customer One',
        customerTenantPartyId: 'customer-1',
        lines: [],
        salesOrderId: 'so-1'
      } as any,
      source as any
    )
    await controller.setFinanceReleaseSignal(
      'tenant-1',
      'so-1',
      {
        customerTenantPartyId: 'customer-1',
        effectiveAt: '2026-04-28T11:30:00.000Z',
        signalStatus: 'RELEASED'
      } as any,
      source as any
    )
    await controller.searchPaymentAllocations(
      'tenant-1',
      { accountTransactionId: 'txn-1', page: 1, pageSize: 20 } as any,
      source as any
    )
    await controller.allocatePaymentToReceivable(
      'tenant-1',
      { accountTransactionId: 'txn-1', allocations: [] } as any,
      source as any
    )
    await controller.searchPayableSchedules(
      'tenant-1',
      { page: 1, pageSize: 20, requestGovernanceStatus: 'DUE_NO_REQUEST' } as any,
      source as any
    )
    await controller.getPayableSchedule('tenant-1', 'ps-1', source as any)
    await controller.searchPaymentRequests(
      'tenant-1',
      { page: 1, pageSize: 20, status: 'SUBMITTED' } as any,
      source as any
    )
    await controller.searchPaymentExecutions(
      'tenant-1',
      { page: 1, pageSize: 20, paymentRequestId: 'pr-1' } as any,
      source as any
    )
    await controller.createPayableScheduleFromPurchaseOrder(
      'tenant-1',
      {
        currencyCode: 'USD',
        lines: [],
        purchaseOrderId: 'po-1',
        supplierSnapshot: 'Supplier One',
        supplierTenantPartyId: 'supplier-1'
      } as any,
      source as any
    )
    await controller.applyPayableScheduleAdjustmentFromPurchaseOrderChange(
      'tenant-1',
      { adjustments: [], purchaseOrderChangeId: 'po-change-1', purchaseOrderId: 'po-1' } as any,
      source as any
    )
    await controller.createPaymentRequest(
      'tenant-1',
      {
        beneficiarySupplierFinancialAccountId: 'supplier-account-1',
        currencyCode: 'USD',
        requestSource: 'FINANCE_INITIATED',
        requestedAmount: '300.00',
        requestedLines: [],
        supplierTenantPartyId: 'supplier-1'
      } as any,
      source as any
    )
    await controller.decidePaymentRequest(
      'tenant-1',
      'pr-1',
      { decision: 'APPROVED' } as any,
      source as any
    )
    await controller.executePaymentRequest(
      'tenant-1',
      'pr-1',
      {
        currencyCode: 'USD',
        executedAmount: '300.00',
        executedAt: '2026-04-28T13:00:00.000Z',
        sourceFinancialAccountId: 'fa-1'
      } as any,
      source as any
    )
    await controller.allocatePaymentToPayable(
      'tenant-1',
      { accountTransactionId: 'txn-out-1', allocations: [], paymentExecutionId: 'pe-1' } as any,
      source as any
    )

    expect(financeService.searchFinancialAccounts).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({ keyword: 'main', page: 2, pageSize: 10 }),
      source
    )
    expect(financeService.importAccountTransactions).toHaveBeenCalledWith(
      'tenant-1',
      'fa-1',
      expect.objectContaining({ transactions: [] }),
      source
    )
    expect(financeService.allocatePaymentToReceivable).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({ accountTransactionId: 'txn-1' }),
      source
    )
    expect(financeService.searchPayableSchedules).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({ requestGovernanceStatus: 'DUE_NO_REQUEST' }),
      source
    )
    expect(financeService.createPaymentRequest).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({ beneficiarySupplierFinancialAccountId: 'supplier-account-1' }),
      source
    )
    expect(financeService.allocatePaymentToPayable).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({ accountTransactionId: 'txn-out-1' }),
      source
    )
  })
})
