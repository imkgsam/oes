/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getFinanceReleaseSignalApi = vi.fn()
const getReceivableScheduleByIdApi = vi.fn()
const listPaymentAllocationsApi = vi.fn()
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
  getFinanceReleaseSignalApi,
  getReceivableScheduleByIdApi,
  listPaymentAllocationsApi
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

// Verifies the receivable detail page renders one schedule, its release signal, and linked allocation summaries without pulling in extra finance ownership.
describe('receivable schedule detail page', () => {
  beforeEach(() => {
    getFinanceReleaseSignalApi.mockReset()
    getReceivableScheduleByIdApi.mockReset()
    listPaymentAllocationsApi.mockReset()

    authContextState.actionCodes = [
      'finance.receivable_schedule.get_by_id',
      'finance.finance_release_signal.get',
      'finance.payment_allocation.list'
    ]
    useRoute.mockReturnValue({
      params: {
        receivableScheduleId: 'rs-1'
      }
    })
    getReceivableScheduleByIdApi.mockResolvedValue({
      currencyCode: 'USD',
      customerSnapshot: 'Customer One',
      lines: [
        {
          allocatedAmount: '50.00',
          dueDate: '2026-05-10',
          outstandingAmount: '100.00',
          receivableScheduleLineId: 'line-1',
          scheduledAmount: '150.00',
          status: 'PARTIALLY_PAID'
        }
      ],
      outstandingAmount: '100.00',
      receivableScheduleId: 'rs-1',
      scheduleNo: 'AR-001',
      sourceSalesOrderId: 'so-1',
      status: 'PARTIALLY_PAID'
    })
    getFinanceReleaseSignalApi.mockResolvedValue({
      financeReleaseSignalId: 'fr-1',
      signalStatus: 'RELEASED'
    })
    listPaymentAllocationsApi.mockResolvedValue({
      page: 1,
      pageSize: 20,
      paymentAllocations: [
        {
          allocatedAmount: '50.00',
          paymentAllocationId: 'pa-1',
          targetScheduleLineId: 'line-1'
        }
      ],
      total: 1
    })
  })

  it('loads the selected receivable schedule and its linked finance summaries', async () => {
    const page = (await import('./finance-receivable-schedule-detail.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(getReceivableScheduleByIdApi).toHaveBeenCalledWith('tenant-1', 'rs-1')
    expect(getFinanceReleaseSignalApi).toHaveBeenCalledWith('tenant-1', 'so-1')
    expect(listPaymentAllocationsApi).toHaveBeenCalledWith('tenant-1', {
      page: 1,
      pageSize: 20,
      receivableScheduleId: 'rs-1'
    })
    expect(wrapper.text()).toContain('AR-001')
    expect(wrapper.text()).toContain('RELEASED')
    expect(wrapper.text()).toContain('pa-1')
  })

  it('does not load the receivable detail when schedule read permission is absent', async () => {
    authContextState.actionCodes = []

    const page = (await import('./finance-receivable-schedule-detail.vue')).default
    mount(page)

    await flushPromises()

    expect(getReceivableScheduleByIdApi).not.toHaveBeenCalled()
    expect(getFinanceReleaseSignalApi).not.toHaveBeenCalled()
  })
})
