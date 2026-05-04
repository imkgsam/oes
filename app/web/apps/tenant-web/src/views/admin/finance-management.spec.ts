/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const allocatePaymentToPayableApi = vi.fn()
const allocatePaymentToReceivableApi = vi.fn()
const createFinancialAccountApi = vi.fn()
const createPaymentRequestApi = vi.fn()
const createReceivableScheduleFromSalesOrderApi = vi.fn()
const decidePaymentRequestApi = vi.fn()
const executePaymentRequestApi = vi.fn()
const getExchangeRateApi = vi.fn()
const getFinanceReleaseSignalApi = vi.fn()
const listFinancialAccountsApi = vi.fn()
const listPayableSchedulesApi = vi.fn()
const listPaymentExecutionsApi = vi.fn()
const listPaymentRequestsApi = vi.fn()
const listReceivableSchedulesApi = vi.fn()
const registerCustomerFinancialAccountApi = vi.fn()
const setExchangeRateApi = vi.fn()
const setFinanceReleaseSignalApi = vi.fn()
const push = vi.fn()

const authContextState: any = {
  actionCodes: [],
  sessionContext: {
    tenant: {
      tenantId: 'tenant-1',
      name: 'Alpha Tenant'
    }
  },
  tenantName: 'Alpha Tenant',
  visibleEntries: ['finance.dashboard']
}

vi.mock('#/api', () => ({
  allocatePaymentToPayableApi,
  allocatePaymentToReceivableApi,
  createFinancialAccountApi,
  createPaymentRequestApi,
  createReceivableScheduleFromSalesOrderApi,
  decidePaymentRequestApi,
  executePaymentRequestApi,
  getExchangeRateApi,
  getFinanceReleaseSignalApi,
  listFinancialAccountsApi,
  listPayableSchedulesApi,
  listPaymentExecutionsApi,
  listPaymentRequestsApi,
  listReceivableSchedulesApi,
  registerCustomerFinancialAccountApi,
  setExchangeRateApi,
  setFinanceReleaseSignalApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push
  })
}))

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    template: '<div><slot /></div>'
  }
}))

// Verifies the finance workspace page loads phase 1A/1B directories and exposes the minimal finance operations entrypoints.
describe('finance workspace page', () => {
  beforeEach(() => {
    allocatePaymentToPayableApi.mockReset()
    allocatePaymentToReceivableApi.mockReset()
    createFinancialAccountApi.mockReset()
    createPaymentRequestApi.mockReset()
    createReceivableScheduleFromSalesOrderApi.mockReset()
    decidePaymentRequestApi.mockReset()
    executePaymentRequestApi.mockReset()
    getExchangeRateApi.mockReset()
    getFinanceReleaseSignalApi.mockReset()
    listFinancialAccountsApi.mockReset()
    listPayableSchedulesApi.mockReset()
    listPaymentExecutionsApi.mockReset()
    listPaymentRequestsApi.mockReset()
    listReceivableSchedulesApi.mockReset()
    registerCustomerFinancialAccountApi.mockReset()
    setExchangeRateApi.mockReset()
    setFinanceReleaseSignalApi.mockReset()
    push.mockReset()

    authContextState.actionCodes = [
      'finance.financial_account.list',
      'finance.financial_account.create',
      'finance.receivable_schedule.list',
      'finance.customer_financial_account.register',
      'finance.exchange_rate.get',
      'finance.exchange_rate.set',
      'finance.finance_release_signal.get',
      'finance.finance_release_signal.set',
      'finance.receivable_schedule.create_from_sales_order',
      'finance.payment_allocation.allocate_to_receivable',
      'finance.payable.read',
      'finance.payment_request.create',
      'finance.payment_request.decide',
      'finance.payment_execution.create',
      'finance.payment_allocation.create'
    ]

    listFinancialAccountsApi.mockResolvedValue({
      financialAccounts: [
        {
          accountName: 'Main USD Account',
          accountNo: 'FA-001',
          accountType: 'BANK',
          currencyCode: 'USD',
          currentBalance: '1200.00',
          financialAccountId: 'fa-1',
          lastTransactionAt: '2026-04-28T09:00:00.000Z',
          status: 'ACTIVE'
        }
      ],
      page: 1,
      pageSize: 20,
      total: 1
    })
    listReceivableSchedulesApi.mockResolvedValue({
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
    listPayableSchedulesApi.mockResolvedValue({
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
    listPaymentRequestsApi.mockResolvedValue({
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
    listPaymentExecutionsApi.mockResolvedValue({
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
    getExchangeRateApi.mockResolvedValue({
      exchangeRateId: 'fx-1',
      rateValue: '7.230000'
    })
    getFinanceReleaseSignalApi.mockResolvedValue({
      financeReleaseSignalId: 'fr-1',
      signalStatus: 'RELEASED'
    })
    createFinancialAccountApi.mockResolvedValue({ financialAccountId: 'fa-1' })
    registerCustomerFinancialAccountApi.mockResolvedValue({ customerFinancialAccountId: 'cfa-1' })
    setExchangeRateApi.mockResolvedValue({ exchangeRateId: 'fx-1' })
    setFinanceReleaseSignalApi.mockResolvedValue({ financeReleaseSignalId: 'fr-1' })
    createReceivableScheduleFromSalesOrderApi.mockResolvedValue({ receivableScheduleId: 'rs-1' })
    createPaymentRequestApi.mockResolvedValue({ paymentRequestId: 'pr-1' })
    decidePaymentRequestApi.mockResolvedValue({ paymentRequestId: 'pr-1', status: 'APPROVED' })
    executePaymentRequestApi.mockResolvedValue({
      paymentExecution: { paymentExecutionId: 'pe-1' },
      paymentRequest: { paymentRequestId: 'pr-1' }
    })
    allocatePaymentToPayableApi.mockResolvedValue([{ paymentAllocationId: 'pa-payable-1' }])
    allocatePaymentToReceivableApi.mockResolvedValue([{ paymentAllocationId: 'pa-1' }])
  })

  it('loads the finance directories and routes into account and receivable detail pages', async () => {
    const page = (await import('./finance-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(listFinancialAccountsApi).toHaveBeenCalledWith('tenant-1', {
      keyword: undefined,
      page: 1,
      pageSize: 20,
      status: undefined
    })
    expect(listReceivableSchedulesApi).toHaveBeenCalledWith('tenant-1', {
      keyword: undefined,
      page: 1,
      pageSize: 20,
      status: undefined
    })
    expect(listPayableSchedulesApi).toHaveBeenCalledWith('tenant-1', {
      keyword: undefined,
      page: 1,
      pageSize: 20,
      requestGovernanceStatus: undefined,
      status: undefined
    })
    expect(listPaymentRequestsApi).toHaveBeenCalledWith('tenant-1', {
      page: 1,
      pageSize: 20,
      status: undefined
    })
    expect(listPaymentExecutionsApi).toHaveBeenCalledWith('tenant-1', {
      page: 1,
      pageSize: 20
    })
    expect(wrapper.text()).toContain('Main USD Account')
    expect(wrapper.text()).toContain('AR-001')
    expect(wrapper.text()).toContain('AP-001')
    expect(wrapper.text()).toContain('DUE_NO_REQUEST')
    expect(wrapper.text()).toContain('PAY-REQ-001')
    expect(wrapper.text()).toContain('pe-1')

    await wrapper.get('[data-testid="finance-open-account-fa-1"]').trigger('click')
    await wrapper.get('[data-testid="finance-open-receivable-rs-1"]').trigger('click')

    expect(push).toHaveBeenNthCalledWith(1, {
      name: 'TenantFinancialAccountDetail',
      params: {
        financialAccountId: 'fa-1'
      }
    })
    expect(push).toHaveBeenNthCalledWith(2, {
      name: 'TenantReceivableScheduleDetail',
      params: {
        receivableScheduleId: 'rs-1'
      }
    })
  })

  it('submits the minimal finance phase 1A forms from the workspace', async () => {
    const page = (await import('./finance-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    await wrapper.get('[data-testid="finance-create-account"]').trigger('click')
    await wrapper.get('[data-testid="finance-register-customer-account"]').trigger('click')
    await wrapper.get('[data-testid="finance-get-exchange-rate"]').trigger('click')
    await wrapper.get('[data-testid="finance-set-exchange-rate"]').trigger('click')
    await wrapper.get('[data-testid="finance-get-release-signal"]').trigger('click')
    await wrapper.get('[data-testid="finance-set-release-signal"]').trigger('click')
    await wrapper.get('[data-testid="finance-create-receivable-schedule"]').trigger('click')
    await wrapper.get('[data-testid="finance-create-payment-request"]').trigger('click')
    await wrapper.get('[data-testid="finance-approve-payment-request"]').trigger('click')
    await wrapper.get('[data-testid="finance-reject-payment-request"]').trigger('click')
    await wrapper.get('[data-testid="finance-execute-payment-request"]').trigger('click')
    await wrapper.get('[data-testid="finance-allocate-payable-payment"]').trigger('click')
    await wrapper.get('[data-testid="finance-allocate-payment"]').trigger('click')

    expect(createFinancialAccountApi).toHaveBeenCalledWith('tenant-1', expect.any(Object))
    expect(registerCustomerFinancialAccountApi).toHaveBeenCalledWith('tenant-1', expect.any(Object))
    expect(getExchangeRateApi).toHaveBeenCalledWith('tenant-1', expect.any(Object))
    expect(setExchangeRateApi).toHaveBeenCalledWith('tenant-1', expect.any(Object))
    expect(getFinanceReleaseSignalApi).toHaveBeenCalledWith('tenant-1', 'so-1')
    expect(setFinanceReleaseSignalApi).toHaveBeenCalledWith('tenant-1', 'so-1', expect.any(Object))
    expect(createReceivableScheduleFromSalesOrderApi).toHaveBeenCalledWith('tenant-1', expect.any(Object))
    expect(createPaymentRequestApi).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        beneficiarySupplierFinancialAccountId: 'supplier-account-1',
        requestSource: 'FINANCE_INITIATED'
      })
    )
    expect(decidePaymentRequestApi).toHaveBeenNthCalledWith(
      1,
      'tenant-1',
      'pr-1',
      expect.objectContaining({ decision: 'APPROVED' })
    )
    expect(decidePaymentRequestApi).toHaveBeenNthCalledWith(
      2,
      'tenant-1',
      'pr-1',
      expect.objectContaining({ decision: 'REJECTED' })
    )
    expect(executePaymentRequestApi).toHaveBeenCalledWith(
      'tenant-1',
      'pr-1',
      expect.objectContaining({ sourceFinancialAccountId: 'fa-1' })
    )
    expect(allocatePaymentToPayableApi).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({ accountTransactionId: 'txn-out-1' })
    )
    expect(allocatePaymentToReceivableApi).toHaveBeenCalledWith('tenant-1', expect.any(Object))
    expect(wrapper.text()).toContain('供应商收款账号维护 blocker')
  })
})
