/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const listPurchaseOrdersApi = vi.fn()
const listPurchaseRequestsApi = vi.fn()
const listReceivingExpectationsApi = vi.fn()
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
  visibleEntries: ['procurement.management']
}

vi.mock('#/api', () => ({
  listPurchaseOrdersApi,
  listPurchaseRequestsApi,
  listReceivingExpectationsApi
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

// Verifies the procurement workspace page loads phase 1 PR, PO, and receiving summaries and routes into dedicated create/detail pages.
describe('procurement workspace page', () => {
  beforeEach(() => {
    listPurchaseOrdersApi.mockReset()
    listPurchaseRequestsApi.mockReset()
    listReceivingExpectationsApi.mockReset()
    push.mockReset()
    authContextState.actionCodes = [
      'procurement.purchase_request.list',
      'procurement.purchase_request.create',
      'procurement.purchase_request.get_by_id',
      'procurement.purchase_order.list',
      'procurement.purchase_order.get_by_id',
      'procurement.receiving_expectation.list',
      'procurement.receiving_expectation.get_by_id'
    ]

    listPurchaseRequestsApi.mockResolvedValue({
      page: 1,
      pageSize: 20,
      purchaseRequests: [
        {
          createdAt: '2026-04-28T08:00:00.000Z',
          decidedAt: '',
          lineCount: 1,
          purchaseRequestId: 'pr-1',
          requestNo: 'PR-001',
          requestType: 'DEPARTMENTAL',
          requesterDisplayName: 'Requester One',
          status: 'DRAFT',
          submittedAt: ''
        }
      ],
      total: 1
    })
    listPurchaseOrdersApi.mockResolvedValue({
      page: 1,
      pageSize: 20,
      purchaseOrders: [
        {
          createdAt: '2026-04-28T08:30:00.000Z',
          currencyCode: 'USD',
          issuedAt: '',
          lineCount: 1,
          orderNo: 'PO-001',
          purchaseOrderId: 'po-1',
          status: 'DRAFT',
          supplierDisplayName: 'Supplier One',
          supplierId: 'supplier-1'
        }
      ],
      total: 1
    })
    listReceivingExpectationsApi.mockResolvedValue({
      page: 1,
      pageSize: 20,
      receivingExpectations: [
        {
          expectedReceiptDate: '2026-05-02',
          hasOpenDiscrepancy: true,
          openQuantity: '2',
          purchaseOrderId: 'po-1',
          purchaseOrderLineId: 'po-line-1',
          receivingExpectationId: 're-1',
          status: 'PARTIALLY_RECEIVED',
          supplierId: 'supplier-1'
        }
      ],
      total: 1
    })
  })

  it('loads the three procurement directories and supports create/detail navigation', async () => {
    const page = (await import('./procurement-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(listPurchaseRequestsApi).toHaveBeenCalledWith('tenant-1', {
      keyword: undefined,
      page: 1,
      pageSize: 20,
      requestType: undefined,
      status: undefined
    })
    expect(listPurchaseOrdersApi).toHaveBeenCalledWith('tenant-1', {
      keyword: undefined,
      page: 1,
      pageSize: 20,
      status: undefined
    })
    expect(listReceivingExpectationsApi).toHaveBeenCalledWith('tenant-1', {
      hasOpenDiscrepancy: undefined,
      page: 1,
      pageSize: 20,
      status: undefined
    })
    expect(wrapper.text()).toContain('PR-001')
    expect(wrapper.text()).toContain('PO-001')
    expect(wrapper.text()).toContain('re-1')

    await wrapper.get('[data-testid="procurement-open-create-pr"]').trigger('click')
    await wrapper.get('[data-testid="procurement-open-pr-pr-1"]').trigger('click')
    await wrapper.get('[data-testid="procurement-open-po-po-1"]').trigger('click')
    await wrapper.get('[data-testid="procurement-open-re-re-1"]').trigger('click')

    expect(push).toHaveBeenNthCalledWith(1, {
      name: 'TenantPurchaseRequestCreate'
    })
    expect(push).toHaveBeenNthCalledWith(2, {
      name: 'TenantPurchaseRequestDetail',
      params: {
        purchaseRequestId: 'pr-1'
      }
    })
    expect(push).toHaveBeenNthCalledWith(3, {
      name: 'TenantPurchaseOrderDetail',
      params: {
        purchaseOrderId: 'po-1'
      }
    })
    expect(push).toHaveBeenNthCalledWith(4, {
      name: 'TenantReceivingExpectationDetail',
      params: {
        receivingExpectationId: 're-1'
      }
    })
  })
})
