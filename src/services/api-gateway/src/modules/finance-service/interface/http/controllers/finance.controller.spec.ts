import { Reflector } from '@nestjs/core'
import { PERMISSION_CHECK_KEY } from '@oes/common/authorization'
import { FinanceController } from './finance.controller'

// Verifies the finance gateway controller keeps permissions and phase 1A request forwarding aligned with the frozen finance BFF surface.
describe('FinanceController', () => {
  const financeService = {
    allocatePaymentToReceivable: jest.fn(),
    createFinancialAccount: jest.fn(),
    createReceivableScheduleFromSalesOrder: jest.fn(),
    getExchangeRate: jest.fn(),
    getFinanceReleaseSignal: jest.fn(),
    getFinancialAccount: jest.fn(),
    getReceivableSchedule: jest.fn(),
    importAccountTransactions: jest.fn(),
    recordAccountTransaction: jest.fn(),
    registerCustomerFinancialAccount: jest.fn(),
    searchAccountTransactions: jest.fn(),
    searchFinancialAccounts: jest.fn(),
    searchPaymentAllocations: jest.fn(),
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
      reflector.get(PERMISSION_CHECK_KEY, FinanceController.prototype.searchFinancialAccounts)
    ).toEqual({
      permissions: ['finance.financial_account.list'],
      type: 'ALL'
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, FinanceController.prototype.getFinancialAccount)
    ).toEqual({
      permissions: ['finance.financial_account.get_by_id'],
      type: 'ALL'
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, FinanceController.prototype.searchAccountTransactions)
    ).toEqual({
      permissions: ['finance.account_transaction.list'],
      type: 'ALL'
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, FinanceController.prototype.createFinancialAccount)
    ).toEqual({
      permissions: ['finance.financial_account.create'],
      type: 'ALL'
    })
    expect(
      reflector.get(
        PERMISSION_CHECK_KEY,
        FinanceController.prototype.updateFinancialAccountBasics
      )
    ).toEqual({
      permissions: ['finance.financial_account.update_basics'],
      type: 'ALL'
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, FinanceController.prototype.importAccountTransactions)
    ).toEqual({
      permissions: ['finance.account_transaction.import'],
      type: 'ALL'
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, FinanceController.prototype.recordAccountTransaction)
    ).toEqual({
      permissions: ['finance.account_transaction.record'],
      type: 'ALL'
    })
    expect(
      reflector.get(
        PERMISSION_CHECK_KEY,
        FinanceController.prototype.registerCustomerFinancialAccount
      )
    ).toEqual({
      permissions: ['finance.customer_financial_account.register'],
      type: 'ALL'
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, FinanceController.prototype.getExchangeRate)
    ).toEqual({
      permissions: ['finance.exchange_rate.get'],
      type: 'ALL'
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, FinanceController.prototype.setExchangeRate)
    ).toEqual({
      permissions: ['finance.exchange_rate.set'],
      type: 'ALL'
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, FinanceController.prototype.searchReceivableSchedules)
    ).toEqual({
      permissions: ['finance.receivable_schedule.list'],
      type: 'ALL'
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, FinanceController.prototype.getReceivableSchedule)
    ).toEqual({
      permissions: ['finance.receivable_schedule.get_by_id'],
      type: 'ALL'
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, FinanceController.prototype.getFinanceReleaseSignal)
    ).toEqual({
      permissions: ['finance.finance_release_signal.get'],
      type: 'ALL'
    })
    expect(
      reflector.get(
        PERMISSION_CHECK_KEY,
        FinanceController.prototype.createReceivableScheduleFromSalesOrder
      )
    ).toEqual({
      permissions: ['finance.receivable_schedule.create_from_sales_order'],
      type: 'ALL'
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, FinanceController.prototype.setFinanceReleaseSignal)
    ).toEqual({
      permissions: ['finance.finance_release_signal.set'],
      type: 'ALL'
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, FinanceController.prototype.searchPaymentAllocations)
    ).toEqual({
      permissions: ['finance.payment_allocation.list'],
      type: 'ALL'
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, FinanceController.prototype.allocatePaymentToReceivable)
    ).toEqual({
      permissions: ['finance.payment_allocation.allocate_to_receivable'],
      type: 'ALL'
    })
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
      { accountIdentifier: '00112233', accountName: 'Main USD Account', accountType: 'BANK', currencyCode: 'USD' } as any,
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
      { amount: '150.00', currencyCode: 'USD', direction: 'INFLOW', transactionTime: '2026-04-28T09:15:00.000Z' } as any,
      source as any
    )
    await controller.registerCustomerFinancialAccount(
      'tenant-1',
      { accountHolderName: 'Customer One', accountIdentifier: '99887766', accountProviderType: 'BANK', customerTenantPartyId: 'customer-1' } as any,
      source as any
    )
    await controller.getExchangeRate(
      'tenant-1',
      { baseCurrencyCode: 'USD', effectiveAt: '2026-04-28T00:00:00.000Z', quoteCurrencyCode: 'CNY' } as any,
      source as any
    )
    await controller.setExchangeRate(
      'tenant-1',
      { baseCurrencyCode: 'USD', effectiveAt: '2026-04-28T00:00:00.000Z', quoteCurrencyCode: 'CNY', rateValue: '7.230000', setBy: 'operator-1' } as any,
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
      { currencyCode: 'USD', customerSnapshot: 'Customer One', customerTenantPartyId: 'customer-1', lines: [], salesOrderId: 'so-1' } as any,
      source as any
    )
    await controller.setFinanceReleaseSignal(
      'tenant-1',
      'so-1',
      { customerTenantPartyId: 'customer-1', effectiveAt: '2026-04-28T11:30:00.000Z', signalStatus: 'RELEASED' } as any,
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
  })
})
