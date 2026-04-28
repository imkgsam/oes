/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const cancelPurchaseRequestApi = vi.fn()
const convertPurchaseRequestToPurchaseOrderApi = vi.fn()
const decidePurchaseRequestApi = vi.fn()
const getPurchaseRequestByIdApi = vi.fn()
const push = vi.fn()
const submitPurchaseRequestApi = vi.fn()
const useRoute = vi.fn()

const authContextState: any = {
  actionCodes: [
    'procurement.purchase_request.get_by_id',
    'procurement.purchase_request.submit',
    'procurement.purchase_request.decide',
    'procurement.purchase_request.cancel',
    'procurement.purchase_request.convert_to_order'
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
  cancelPurchaseRequestApi,
  convertPurchaseRequestToPurchaseOrderApi,
  decidePurchaseRequestApi,
  getPurchaseRequestByIdApi,
  submitPurchaseRequestApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('vue-router', () => ({
  useRoute: () => useRoute(),
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

// Verifies the purchase request detail page loads one PR and exposes only the frozen phase 1 submit/decide/cancel/convert actions.
describe('purchase request detail page', () => {
  beforeEach(() => {
    cancelPurchaseRequestApi.mockReset()
    convertPurchaseRequestToPurchaseOrderApi.mockReset()
    decidePurchaseRequestApi.mockReset()
    getPurchaseRequestByIdApi.mockReset()
    push.mockReset()
    submitPurchaseRequestApi.mockReset()

    useRoute.mockReturnValue({
      params: {
        purchaseRequestId: 'pr-1'
      }
    })

    getPurchaseRequestByIdApi.mockResolvedValue({
      lines: [
        {
          description: 'Starter Item',
          itemCode: 'ITEM-001',
          itemId: 'item-1',
          itemName: 'Starter Item',
          lineNo: 1,
          lineType: 'STANDARD_ITEM',
          purchaseRequestLineId: 'pr-line-1',
          requestedQuantity: '10',
          uom: 'PCS'
        }
      ],
      purchaseRequestId: 'pr-1',
      reason: 'Need starter inventory',
      requestNo: 'PR-001',
      requestType: 'DEPARTMENTAL',
      requester: {
        displayName: 'Requester One',
        operatorId: 'requester-1'
      },
      status: 'DRAFT',
      tenantId: 'tenant-1',
      title: 'Starter PR'
    })
    convertPurchaseRequestToPurchaseOrderApi.mockResolvedValue({
      purchaseOrderId: 'po-1'
    })
  })

  it('loads one PR and submits, approves, cancels, and converts it using only phase 1 contract fields', async () => {
    const page = (await import('./purchase-request-detail.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(getPurchaseRequestByIdApi).toHaveBeenCalledWith('tenant-1', 'pr-1')
    expect(wrapper.text()).toContain('PR-001')

    await wrapper.get('[data-testid="purchase-request-submit-comment"]').setValue('please approve')
    await wrapper.get('[data-testid="purchase-request-submit"]').trigger('click')
    await wrapper.get('[data-testid="purchase-request-decision-comment"]').setValue('approved')
    await wrapper.get('[data-testid="purchase-request-approve"]').trigger('click')
    await wrapper.get('[data-testid="purchase-request-cancel-reason"]').setValue('duplicate')
    await wrapper.get('[data-testid="purchase-request-cancel"]').trigger('click')
    await wrapper.get('[data-testid="purchase-request-convert-supplier-id"]').setValue('supplier-1')
    await wrapper.get('[data-testid="purchase-request-convert-currency"]').setValue('USD')
    await wrapper.get('[data-testid="purchase-request-convert"]').trigger('click')

    await flushPromises()

    expect(submitPurchaseRequestApi).toHaveBeenCalledWith('tenant-1', 'pr-1', {
      auditReason: 'submit from tenant-web purchase request detail',
      submissionComment: 'please approve'
    })
    expect(decidePurchaseRequestApi).toHaveBeenCalledWith('tenant-1', 'pr-1', {
      auditReason: 'decision from tenant-web purchase request detail',
      comment: 'approved',
      decision: 'APPROVED'
    })
    expect(cancelPurchaseRequestApi).toHaveBeenCalledWith('tenant-1', 'pr-1', {
      auditReason: 'cancel from tenant-web purchase request detail',
      cancelReason: 'duplicate'
    })
    expect(convertPurchaseRequestToPurchaseOrderApi).toHaveBeenCalledWith('tenant-1', 'pr-1', {
      auditReason: 'convert from tenant-web purchase request detail',
      currencyCode: 'USD',
      selectedLines: [
        {
          purchaseOrderQuantity: '10',
          purchaseRequestLineId: 'pr-line-1'
        }
      ],
      supplierId: 'supplier-1'
    })
    expect(push).toHaveBeenCalledWith({
      name: 'TenantPurchaseOrderDetail',
      params: {
        purchaseOrderId: 'po-1'
      }
    })
  })
})
