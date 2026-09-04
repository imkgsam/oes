/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getFinancialAccountByIdApi = vi.fn()
const listAccountTransactionsApi = vi.fn()
const recordAccountTransactionApi = vi.fn()
const updateFinancialAccountBasicsApi = vi.fn()
const useRoute = vi.fn()

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
  getFinancialAccountByIdApi,
  listAccountTransactionsApi,
  recordAccountTransactionApi,
  updateFinancialAccountBasicsApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('vue-router', () => ({
  useRoute: () => useRoute()
}))

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    template: '<div><slot /></div>'
  }
}))

// Verifies the financial-account detail page renders one account snapshot, one transaction list, and the minimal phase 1A update actions.
describe('financial account detail page', () => {
  beforeEach(() => {
    getFinancialAccountByIdApi.mockReset()
    listAccountTransactionsApi.mockReset()
    recordAccountTransactionApi.mockReset()
    updateFinancialAccountBasicsApi.mockReset()

    authContextState.actionCodes = [
      'finance.financial_account.get_by_id',
      'finance.financial_account.update_basics',
      'finance.account_transaction.list',
      'finance.account_transaction.record'
    ]
    useRoute.mockReturnValue({
      params: {
        financialAccountId: 'fa-1'
      }
    })
    getFinancialAccountByIdApi.mockResolvedValue({
      accountIdentifierMasked: '****1001',
      accountName: 'Main USD Account',
      accountNo: 'FA-001',
      accountType: 'BANK',
      currencyCode: 'USD',
      currentBalance: '1200.00',
      financialAccountId: 'fa-1',
      institutionName: 'Bank One',
      status: 'ACTIVE'
    })
    listAccountTransactionsApi.mockResolvedValue({
      accountTransactions: [
        {
          accountTransactionId: 'txn-1',
          amount: '150.00',
          allocationStatus: 'UNALLOCATED',
          currencyCode: 'USD',
          direction: 'INFLOW',
          transactionTime: '2026-04-28T09:15:00.000Z'
        }
      ],
      page: 1,
      pageSize: 20,
      total: 1
    })
    updateFinancialAccountBasicsApi.mockResolvedValue({
      accountIdentifierMasked: '****1001',
      accountName: 'Main USD Account Rev',
      accountNo: 'FA-001',
      accountType: 'BANK',
      currencyCode: 'USD',
      currentBalance: '1200.00',
      financialAccountId: 'fa-1',
      institutionName: 'Bank One',
      status: 'ACTIVE'
    })
    recordAccountTransactionApi.mockResolvedValue({
      accountTransactionId: 'txn-2',
      amount: '88.00',
      allocationStatus: 'UNALLOCATED',
      currencyCode: 'USD',
      direction: 'INFLOW',
      transactionTime: '2026-04-28T10:15:00.000Z'
    })
  })

  it('loads the selected account detail and supports thin update and record actions', async () => {
    const page = (await import('./finance-account-detail.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(getFinancialAccountByIdApi).toHaveBeenCalledWith('tenant-1', 'fa-1')
    expect(listAccountTransactionsApi).toHaveBeenCalledWith('tenant-1', {
      financialAccountId: 'fa-1',
      page: 1,
      pageSize: 20
    })
    expect(wrapper.text()).toContain('FA-001')
    expect(wrapper.text()).toContain('txn-1')

    await wrapper.get('[data-testid="finance-update-account"]').trigger('click')
    await wrapper.get('[data-testid="finance-record-transaction"]').trigger('click')

    expect(updateFinancialAccountBasicsApi).toHaveBeenCalledWith('tenant-1', 'fa-1', expect.any(Object))
    expect(recordAccountTransactionApi).toHaveBeenCalledWith('tenant-1', 'fa-1', expect.any(Object))
    expect(wrapper.text()).toContain('Main USD Account Rev')
  })

  it('does not load the account detail when finance read permissions are absent', async () => {
    authContextState.actionCodes = []

    const page = (await import('./finance-account-detail.vue')).default
    mount(page)

    await flushPromises()

    expect(getFinancialAccountByIdApi).not.toHaveBeenCalled()
    expect(listAccountTransactionsApi).not.toHaveBeenCalled()
  })
})
