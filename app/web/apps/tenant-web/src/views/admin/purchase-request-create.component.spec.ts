/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createPurchaseRequestApi = vi.fn()
const push = vi.fn()

const authContextState: any = {
  actionCodes: ['procurement.purchase_request.create'],
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
  createPurchaseRequestApi
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

// Verifies the purchase request create page only submits the frozen phase 1 draft fields and redirects to PR detail.
describe('purchase request create page', () => {
  beforeEach(() => {
    createPurchaseRequestApi.mockReset()
    push.mockReset()
    createPurchaseRequestApi.mockResolvedValue({
      purchaseRequestId: 'pr-1'
    })
  })

  it('creates one phase 1 purchase request draft with one standard line and routes to detail', async () => {
    const page = (await import('./purchase-request-create.vue')).default
    const wrapper = mount(page)

    await wrapper.get('[data-testid="purchase-request-create-type"]').setValue('DEPARTMENTAL')
    await wrapper.get('[data-testid="purchase-request-create-title"]').setValue('Starter PR')
    await wrapper.get('[data-testid="purchase-request-create-reason"]').setValue('Need starter inventory')
    await wrapper.get('[data-testid="purchase-request-line-type-0"]').setValue('STANDARD_ITEM')
    await wrapper.get('[data-testid="purchase-request-line-item-id-0"]').setValue('item-1')
    await wrapper.get('[data-testid="purchase-request-line-description-0"]').setValue('Starter Item')
    await wrapper.get('[data-testid="purchase-request-line-quantity-0"]').setValue('10')
    await wrapper.get('[data-testid="purchase-request-line-uom-0"]').setValue('PCS')
    await wrapper.get('[data-testid="purchase-request-create-submit"]').trigger('click')

    await flushPromises()

    expect(createPurchaseRequestApi).toHaveBeenCalledWith('tenant-1', {
      lines: [
        {
          description: 'Starter Item',
          itemId: 'item-1',
          lineType: 'STANDARD_ITEM',
          requestedQuantity: '10',
          uom: 'PCS'
        }
      ],
      reason: 'Need starter inventory',
      requestType: 'DEPARTMENTAL',
      title: 'Starter PR'
    })
    expect(push).toHaveBeenCalledWith({
      name: 'TenantPurchaseRequestDetail',
      params: {
        purchaseRequestId: 'pr-1'
      }
    })
  })
})
