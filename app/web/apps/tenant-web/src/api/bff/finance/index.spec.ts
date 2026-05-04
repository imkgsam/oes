import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const post = vi.fn()
const put = vi.fn()

vi.mock('#/api/request', () => ({
  requestClient: {
    get,
    post,
    put
  }
}))

// Verifies the tenant-web finance API client stays aligned with the gateway phase 1A/1B finance BFF surface.
describe('tenant-web finance api', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    put.mockReset()
  })

  it('lists and loads the phase 1B payable and payment read surface', async () => {
    const {
      getPayableScheduleByIdApi,
      listPayableSchedulesApi,
      listPaymentAllocationsApi,
      listPaymentExecutionsApi,
      listPaymentRequestsApi
    } = await import('./index')

    await listPayableSchedulesApi('tenant-1', {
      page: 1,
      pageSize: 20,
      requestGovernanceStatus: 'DUE_NO_REQUEST'
    })
    await getPayableScheduleByIdApi('tenant-1', 'ps-1')
    await listPaymentRequestsApi('tenant-1', {
      page: 1,
      pageSize: 20,
      status: 'SUBMITTED'
    })
    await listPaymentExecutionsApi('tenant-1', {
      page: 1,
      pageSize: 20,
      paymentRequestId: 'pr-1'
    })
    await listPaymentAllocationsApi('tenant-1', {
      page: 1,
      pageSize: 20,
      paymentExecutionId: 'pe-1',
      targetScheduleId: 'ps-1',
      targetType: 'PAYABLE_SCHEDULE_LINE'
    })

    expect(get).toHaveBeenCalledWith('/finance/tenants/tenant-1/payable-schedules', {
      params: {
        page: 1,
        pageSize: 20,
        requestGovernanceStatus: 'DUE_NO_REQUEST'
      }
    })
    expect(get).toHaveBeenCalledWith('/finance/tenants/tenant-1/payable-schedules/ps-1')
    expect(get).toHaveBeenCalledWith('/finance/tenants/tenant-1/payment-requests', {
      params: {
        page: 1,
        pageSize: 20,
        status: 'SUBMITTED'
      }
    })
    expect(get).toHaveBeenCalledWith('/finance/tenants/tenant-1/payment-executions', {
      params: {
        page: 1,
        pageSize: 20,
        paymentRequestId: 'pr-1'
      }
    })
    expect(get).toHaveBeenCalledWith('/finance/tenants/tenant-1/payment-allocations', {
      params: {
        page: 1,
        pageSize: 20,
        paymentExecutionId: 'pe-1',
        targetScheduleId: 'ps-1',
        targetType: 'PAYABLE_SCHEDULE_LINE'
      }
    })
  })

  it('lists and loads financial accounts, account transactions, receivable schedules, allocations, exchange rates, and release signals', async () => {
    const {
      getExchangeRateApi,
      getFinanceReleaseSignalApi,
      getFinancialAccountByIdApi,
      getReceivableScheduleByIdApi,
      listAccountTransactionsApi,
      listFinancialAccountsApi,
      listPaymentAllocationsApi,
      listReceivableSchedulesApi
    } = await import('./index')

    await listFinancialAccountsApi('tenant-1', {
      accountType: 'BANK',
      keyword: 'main',
      page: 2,
      pageSize: 10,
      status: 'ACTIVE'
    })
    await getFinancialAccountByIdApi('tenant-1', 'fa-1')
    await listAccountTransactionsApi('tenant-1', {
      financialAccountId: 'fa-1',
      page: 1,
      pageSize: 20
    })
    await getExchangeRateApi('tenant-1', {
      baseCurrencyCode: 'USD',
      effectiveAt: '2026-04-28T00:00:00.000Z',
      quoteCurrencyCode: 'CNY'
    })
    await listReceivableSchedulesApi('tenant-1', {
      page: 1,
      pageSize: 20,
      status: 'PARTIALLY_PAID'
    })
    await getReceivableScheduleByIdApi('tenant-1', 'rs-1')
    await getFinanceReleaseSignalApi('tenant-1', 'so-1')
    await listPaymentAllocationsApi('tenant-1', {
      accountTransactionId: 'txn-1',
      page: 1,
      pageSize: 20,
      receivableScheduleId: 'rs-1'
    })

    expect(get).toHaveBeenCalledWith('/finance/tenants/tenant-1/accounts', {
      params: {
        accountType: 'BANK',
        keyword: 'main',
        page: 2,
        pageSize: 10,
        status: 'ACTIVE'
      }
    })
    expect(get).toHaveBeenCalledWith('/finance/tenants/tenant-1/accounts/fa-1')
    expect(get).toHaveBeenCalledWith('/finance/tenants/tenant-1/account-transactions', {
      params: {
        financialAccountId: 'fa-1',
        page: 1,
        pageSize: 20
      }
    })
    expect(get).toHaveBeenCalledWith('/finance/tenants/tenant-1/exchange-rate', {
      params: {
        baseCurrencyCode: 'USD',
        effectiveAt: '2026-04-28T00:00:00.000Z',
        quoteCurrencyCode: 'CNY'
      }
    })
    expect(get).toHaveBeenCalledWith('/finance/tenants/tenant-1/receivable-schedules', {
      params: {
        page: 1,
        pageSize: 20,
        status: 'PARTIALLY_PAID'
      }
    })
    expect(get).toHaveBeenCalledWith('/finance/tenants/tenant-1/receivable-schedules/rs-1')
    expect(get).toHaveBeenCalledWith('/finance/tenants/tenant-1/finance-release-signals/so-1')
    expect(get).toHaveBeenCalledWith('/finance/tenants/tenant-1/payment-allocations', {
      params: {
        accountTransactionId: 'txn-1',
        page: 1,
        pageSize: 20,
        receivableScheduleId: 'rs-1'
      }
    })
  })

  it('creates and mutates the phase 1A finance write surface without widening the finance contract', async () => {
    const {
      allocatePaymentToReceivableApi,
      createFinancialAccountApi,
      createReceivableScheduleFromSalesOrderApi,
      importAccountTransactionsApi,
      recordAccountTransactionApi,
      registerCustomerFinancialAccountApi,
      setExchangeRateApi,
      setFinanceReleaseSignalApi,
      updateFinancialAccountBasicsApi
    } = await import('./index')

    await createFinancialAccountApi('tenant-1', {
      accountIdentifier: '00112233',
      accountName: 'Main USD Account',
      accountType: 'BANK',
      currencyCode: 'USD'
    })
    await updateFinancialAccountBasicsApi('tenant-1', 'fa-1', {
      accountName: 'Main USD Account Rev',
      status: 'ACTIVE'
    })
    await importAccountTransactionsApi('tenant-1', 'fa-1', {
      auditReason: 'import statement',
      sourceType: 'CSV_IMPORT',
      transactions: []
    })
    await recordAccountTransactionApi('tenant-1', 'fa-1', {
      amount: '150.00',
      currencyCode: 'USD',
      direction: 'INFLOW',
      transactionTime: '2026-04-28T09:15:00.000Z'
    })
    await registerCustomerFinancialAccountApi('tenant-1', {
      accountHolderName: 'Customer One',
      accountIdentifier: '99887766',
      accountProviderType: 'BANK',
      customerTenantPartyId: 'customer-1'
    })
    await setExchangeRateApi('tenant-1', {
      baseCurrencyCode: 'USD',
      effectiveAt: '2026-04-28T00:00:00.000Z',
      quoteCurrencyCode: 'CNY',
      rateValue: '7.230000',
      setBy: 'operator-1'
    })
    await createReceivableScheduleFromSalesOrderApi('tenant-1', {
      currencyCode: 'USD',
      customerSnapshot: 'Customer One',
      customerTenantPartyId: 'customer-1',
      lines: [],
      salesOrderId: 'so-1'
    })
    await setFinanceReleaseSignalApi('tenant-1', 'so-1', {
      customerTenantPartyId: 'customer-1',
      effectiveAt: '2026-04-28T11:30:00.000Z',
      signalStatus: 'RELEASED'
    })
    await allocatePaymentToReceivableApi('tenant-1', {
      accountTransactionId: 'txn-1',
      allocations: []
    })

    expect(post).toHaveBeenCalledWith('/finance/tenants/tenant-1/accounts', {
      accountIdentifier: '00112233',
      accountName: 'Main USD Account',
      accountType: 'BANK',
      currencyCode: 'USD'
    })
    expect(put).toHaveBeenCalledWith('/finance/tenants/tenant-1/accounts/fa-1/basics', {
      accountName: 'Main USD Account Rev',
      status: 'ACTIVE'
    })
    expect(post).toHaveBeenCalledWith('/finance/tenants/tenant-1/accounts/fa-1/transactions/import', {
      auditReason: 'import statement',
      sourceType: 'CSV_IMPORT',
      transactions: []
    })
    expect(post).toHaveBeenCalledWith('/finance/tenants/tenant-1/accounts/fa-1/transactions', {
      amount: '150.00',
      currencyCode: 'USD',
      direction: 'INFLOW',
      transactionTime: '2026-04-28T09:15:00.000Z'
    })
    expect(post).toHaveBeenCalledWith('/finance/tenants/tenant-1/customer-financial-accounts', {
      accountHolderName: 'Customer One',
      accountIdentifier: '99887766',
      accountProviderType: 'BANK',
      customerTenantPartyId: 'customer-1'
    })
    expect(post).toHaveBeenCalledWith('/finance/tenants/tenant-1/exchange-rates', {
      baseCurrencyCode: 'USD',
      effectiveAt: '2026-04-28T00:00:00.000Z',
      quoteCurrencyCode: 'CNY',
      rateValue: '7.230000',
      setBy: 'operator-1'
    })
    expect(post).toHaveBeenCalledWith('/finance/tenants/tenant-1/receivable-schedules/from-sales-order', {
      currencyCode: 'USD',
      customerSnapshot: 'Customer One',
      customerTenantPartyId: 'customer-1',
      lines: [],
      salesOrderId: 'so-1'
    })
    expect(post).toHaveBeenCalledWith('/finance/tenants/tenant-1/finance-release-signals/so-1', {
      customerTenantPartyId: 'customer-1',
      effectiveAt: '2026-04-28T11:30:00.000Z',
      signalStatus: 'RELEASED'
    })
    expect(post).toHaveBeenCalledWith('/finance/tenants/tenant-1/payment-allocations/allocate-to-receivable', {
      accountTransactionId: 'txn-1',
      allocations: []
    })
  })

  it('creates and mutates the phase 1B payable/payment command surface without expanding full AP', async () => {
    const {
      allocatePaymentToPayableApi,
      applyPayableScheduleAdjustmentFromPurchaseOrderChangeApi,
      createPayableScheduleFromPurchaseOrderApi,
      createPaymentRequestApi,
      decidePaymentRequestApi,
      executePaymentRequestApi
    } = await import('./index')

    await createPayableScheduleFromPurchaseOrderApi('tenant-1', {
      currencyCode: 'USD',
      lines: [],
      purchaseOrderId: 'po-1',
      supplierSnapshot: 'Supplier One',
      supplierTenantPartyId: 'supplier-1'
    })
    await applyPayableScheduleAdjustmentFromPurchaseOrderChangeApi('tenant-1', {
      adjustments: [],
      purchaseOrderChangeId: 'po-change-1',
      purchaseOrderId: 'po-1'
    })
    await createPaymentRequestApi('tenant-1', {
      beneficiarySupplierFinancialAccountId: 'supplier-account-1',
      currencyCode: 'USD',
      requestSource: 'FINANCE_INITIATED',
      requestedAmount: '300.00',
      requestedLines: [],
      supplierTenantPartyId: 'supplier-1'
    })
    await decidePaymentRequestApi('tenant-1', 'pr-1', {
      decision: 'APPROVED'
    })
    await executePaymentRequestApi('tenant-1', 'pr-1', {
      currencyCode: 'USD',
      executedAmount: '300.00',
      executedAt: '2026-04-28T13:00:00.000Z',
      sourceFinancialAccountId: 'fa-1'
    })
    await allocatePaymentToPayableApi('tenant-1', {
      accountTransactionId: 'txn-out-1',
      allocations: [],
      paymentExecutionId: 'pe-1'
    })

    expect(post).toHaveBeenCalledWith('/finance/tenants/tenant-1/payable-schedules/from-purchase-order', {
      currencyCode: 'USD',
      lines: [],
      purchaseOrderId: 'po-1',
      supplierSnapshot: 'Supplier One',
      supplierTenantPartyId: 'supplier-1'
    })
    expect(post).toHaveBeenCalledWith(
      '/finance/tenants/tenant-1/payable-schedules/from-purchase-order-change',
      {
        adjustments: [],
        purchaseOrderChangeId: 'po-change-1',
        purchaseOrderId: 'po-1'
      }
    )
    expect(post).toHaveBeenCalledWith('/finance/tenants/tenant-1/payment-requests', {
      beneficiarySupplierFinancialAccountId: 'supplier-account-1',
      currencyCode: 'USD',
      requestSource: 'FINANCE_INITIATED',
      requestedAmount: '300.00',
      requestedLines: [],
      supplierTenantPartyId: 'supplier-1'
    })
    expect(post).toHaveBeenCalledWith('/finance/tenants/tenant-1/payment-requests/pr-1/decisions', {
      decision: 'APPROVED'
    })
    expect(post).toHaveBeenCalledWith('/finance/tenants/tenant-1/payment-requests/pr-1/executions', {
      currencyCode: 'USD',
      executedAmount: '300.00',
      executedAt: '2026-04-28T13:00:00.000Z',
      sourceFinancialAccountId: 'fa-1'
    })
    expect(post).toHaveBeenCalledWith('/finance/tenants/tenant-1/payment-allocations/allocate-to-payable', {
      accountTransactionId: 'txn-out-1',
      allocations: [],
      paymentExecutionId: 'pe-1'
    })
  })
})
