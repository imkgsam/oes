/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getReceivingExpectationByIdApi = vi.fn()
const recordReceivingDiscrepancyResolutionApi = vi.fn()
const useRoute = vi.fn()

const authContextState: any = {
  actionCodes: [
    'procurement.receiving_expectation.get_by_id',
    'procurement.receiving_discrepancy.record_resolution'
  ],
  sessionContext: {
    tenant: {
      tenantId: 'tenant-1',
      name: 'Alpha Tenant'
    }
  },
  tenantName: 'Alpha Tenant',
  visibleEntries: ['procurement.management']
}

vi.mock('#/api', () => ({
  getReceivingExpectationByIdApi,
  recordReceivingDiscrepancyResolutionApi
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

// Verifies the receiving expectation detail page loads one procurement expectation and only records discrepancy resolution summaries.
describe('receiving expectation detail page', () => {
  beforeEach(() => {
    getReceivingExpectationByIdApi.mockReset()
    recordReceivingDiscrepancyResolutionApi.mockReset()

    useRoute.mockReturnValue({
      params: {
        receivingExpectationId: 're-1'
      }
    })

    getReceivingExpectationByIdApi.mockResolvedValue({
      discrepancy: {
        discrepancyType: 'SHORT_RECEIPT',
        receivingDiscrepancyId: 'rd-1',
        resolutionCode: '',
        resolutionNote: '',
        resolvedAt: '',
        status: 'OPEN',
        summary: 'received 8 of 10'
      },
      expectedQuantity: '10',
      expectedReceiptDate: '2026-05-02',
      openQuantity: '2',
      purchaseOrderId: 'po-1',
      purchaseOrderLineId: 'po-line-1',
      receivedQuantitySummary: '8',
      receivingExpectationId: 're-1',
      status: 'PARTIALLY_RECEIVED',
      supplierId: 'supplier-1'
    })
  })

  it('loads one expectation and records a discrepancy resolution summary without widening into WMS receipt truth', async () => {
    const page = (await import('./receiving-expectation-detail.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(getReceivingExpectationByIdApi).toHaveBeenCalledWith('tenant-1', 're-1')
    expect(wrapper.text()).toContain('received 8 of 10')

    await wrapper.get('[data-testid="receiving-resolution-code"]').setValue('WAIT_REDELIVERY')
    await wrapper.get('[data-testid="receiving-resolution-note"]').setValue('supplier promised resend')
    await wrapper.get('[data-testid="receiving-resolution-submit"]').trigger('click')

    await flushPromises()

    expect(recordReceivingDiscrepancyResolutionApi).toHaveBeenCalledWith('tenant-1', 're-1', 'rd-1', {
      auditReason: 'resolution from tenant-web receiving expectation detail',
      resolutionCode: 'WAIT_REDELIVERY',
      resolutionNote: 'supplier promised resend'
    })
  })
})
