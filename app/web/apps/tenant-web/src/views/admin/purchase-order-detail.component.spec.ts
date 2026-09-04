/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const applyPurchaseOrderChangeApi = vi.fn()
const cancelPurchaseOrderApi = vi.fn()
const confirmSupplierAcknowledgementApi = vi.fn()
const createReceivingExpectationApi = vi.fn()
const getPurchaseOrderByIdApi = vi.fn()
const issuePurchaseOrderApi = vi.fn()
const listPurchaseOrderChangesApi = vi.fn()
const push = vi.fn()
const useRoute = vi.fn()

const authContextState: any = {
  actionCodes: [
    'procurement.purchase_order.get_by_id',
    'procurement.purchase_order.issue',
    'procurement.purchase_order.confirm_acknowledgement',
    'procurement.purchase_order.apply_change',
    'procurement.purchase_order.cancel',
    'procurement.purchase_order_change.list',
    'procurement.receiving_expectation.create'
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
  applyPurchaseOrderChangeApi,
  cancelPurchaseOrderApi,
  confirmSupplierAcknowledgementApi,
  createReceivingExpectationApi,
  getPurchaseOrderByIdApi,
  issuePurchaseOrderApi,
  listPurchaseOrderChangesApi
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

// Verifies the purchase order detail page loads one PO, shows change history, and only exposes the frozen phase 1 issue/ack/change/cancel/expectation actions.
describe('purchase order detail page', () => {
  beforeEach(() => {
    applyPurchaseOrderChangeApi.mockReset()
    cancelPurchaseOrderApi.mockReset()
    confirmSupplierAcknowledgementApi.mockReset()
    createReceivingExpectationApi.mockReset()
    getPurchaseOrderByIdApi.mockReset()
    issuePurchaseOrderApi.mockReset()
    listPurchaseOrderChangesApi.mockReset()
    push.mockReset()

    useRoute.mockReturnValue({
      params: {
        purchaseOrderId: 'po-1'
      }
    })

    getPurchaseOrderByIdApi.mockResolvedValue({
      currencyCode: 'USD',
      lines: [
        {
          allocations: [
            {
              allocationType: 'GENERAL_STOCK',
              quantity: '10',
              reason: 'Starter stock',
              referenceId: ''
            }
          ],
          description: 'Starter Item',
          itemCode: 'ITEM-001',
          itemId: 'item-1',
          itemName: 'Starter Item',
          lineNo: 1,
          lineType: 'STANDARD_ITEM',
          orderedQuantity: '10',
          orderedUnitPrice: '12.50',
          purchaseOrderLineId: 'po-line-1',
          uom: 'PCS'
        }
      ],
      orderNo: 'PO-001',
      purchaseOrderId: 'po-1',
      status: 'DRAFT',
      supplierId: 'supplier-1',
      supplierSnapshot: {
        supplierDisplayName: 'Supplier One',
        supplierId: 'supplier-1',
        supplierStatusAtIssue: 'ACTIVE'
      },
      tenantId: 'tenant-1'
    })
    listPurchaseOrderChangesApi.mockResolvedValue({
      changes: [
        {
          appliedAt: '2026-04-28T10:30:00.000Z',
          appliedBy: {
            displayName: 'Buyer One',
            operatorId: 'buyer-1'
          },
          changeReason: 'qty increase',
          changeSummary: 'line 1 qty 10 -> 12',
          changeType: 'QUANTITY_UPDATE',
          purchaseOrderChangeId: 'change-1',
          purchaseOrderId: 'po-1',
          status: 'APPLIED'
        }
      ],
      page: 1,
      pageSize: 20,
      total: 1
    })
    createReceivingExpectationApi.mockResolvedValue({
      receivingExpectationId: 're-1'
    })
  })

  it('loads one PO and supports issue, acknowledgement, change, cancel, and create-expectation actions', async () => {
    const page = (await import('./purchase-order-detail.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(getPurchaseOrderByIdApi).toHaveBeenCalledWith('tenant-1', 'po-1')
    expect(listPurchaseOrderChangesApi).toHaveBeenCalledWith('tenant-1', 'po-1', {
      page: 1,
      pageSize: 20
    })
    expect(wrapper.text()).toContain('PO-001')
    expect(wrapper.text()).toContain('line 1 qty 10 -> 12')

    await wrapper.get('[data-testid="purchase-order-issue-comment"]').setValue('email supplier')
    await wrapper.get('[data-testid="purchase-order-issue"]').trigger('click')
    await wrapper.get('[data-testid="purchase-order-ack-comment"]').setValue('confirmed')
    await wrapper.get('[data-testid="purchase-order-ack"]').trigger('click')
    await wrapper.get('[data-testid="purchase-order-change-reason"]').setValue('qty increase')
    await wrapper.get('[data-testid="purchase-order-change"]').trigger('click')
    await wrapper.get('[data-testid="purchase-order-cancel-reason"]').setValue('supplier unavailable')
    await wrapper.get('[data-testid="purchase-order-cancel"]').trigger('click')
    await wrapper.get('[data-testid="purchase-order-expectation-quantity"]').setValue('10')
    await wrapper.get('[data-testid="purchase-order-create-expectation"]').trigger('click')

    await flushPromises()

    expect(issuePurchaseOrderApi).toHaveBeenCalledWith('tenant-1', 'po-1', {
      auditReason: 'issue from tenant-web purchase order detail',
      issueComment: 'email supplier'
    })
    expect(confirmSupplierAcknowledgementApi).toHaveBeenCalledWith('tenant-1', 'po-1', {
      auditReason: 'acknowledgement from tenant-web purchase order detail',
      comment: 'confirmed'
    })
    expect(applyPurchaseOrderChangeApi).toHaveBeenCalledWith('tenant-1', 'po-1', {
      auditReason: 'change from tenant-web purchase order detail',
      changeReason: 'qty increase',
      changeType: 'MANUAL_UPDATE',
      targetState: {
        lines: [
          {
            allocations: [
              {
                allocationType: 'GENERAL_STOCK',
                quantity: '10',
                reason: 'Starter stock',
                referenceId: ''
              }
            ],
            description: 'Starter Item',
            itemId: 'item-1',
            lineType: 'STANDARD_ITEM',
            orderedQuantity: '10',
            orderedUnitPrice: '12.50',
            purchaseOrderLineId: 'po-line-1',
            uom: 'PCS'
          }
        ]
      }
    })
    expect(cancelPurchaseOrderApi).toHaveBeenCalledWith('tenant-1', 'po-1', {
      auditReason: 'cancel from tenant-web purchase order detail',
      cancelReason: 'supplier unavailable'
    })
    expect(createReceivingExpectationApi).toHaveBeenCalledWith('tenant-1', {
      expectedQuantity: '10',
      purchaseOrderId: 'po-1',
      purchaseOrderLineId: 'po-line-1'
    })
    expect(push).toHaveBeenCalledWith({
      name: 'TenantReceivingExpectationDetail',
      params: {
        receivingExpectationId: 're-1'
      }
    })
  })
})
