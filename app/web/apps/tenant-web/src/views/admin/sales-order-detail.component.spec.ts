/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createCustomerPriceAgreementFromSalesOrderLineApi = vi.fn()
const getSalesOrderByIdApi = vi.fn()
const submitFulfillmentHandoffApi = vi.fn()
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
  visibleEntries: []
}

vi.mock('#/api', () => ({
  createCustomerPriceAgreementFromSalesOrderLineApi,
  getSalesOrderByIdApi,
  submitFulfillmentHandoffApi
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

// Verifies the sales order detail page renders frozen pricing snapshots and supports the thin handoff plus create-agreement-from-line action.
describe('sales order detail page', () => {
  beforeEach(() => {
    createCustomerPriceAgreementFromSalesOrderLineApi.mockReset()
    getSalesOrderByIdApi.mockReset()
    submitFulfillmentHandoffApi.mockReset()
    authContextState.actionCodes = [
      'sales.order.get_by_id',
      'sales.order.submit_fulfillment_handoff',
      'sales.pricing.customer_agreement.manage'
    ]
    useRoute.mockReturnValue({
      params: {
        salesOrderId: 'order-1'
      }
    })
    getSalesOrderByIdApi.mockResolvedValue({
      commercialGateSummary: {
        orderEstablished: true,
        productionGate: false,
        shippingGate: false,
        stockingGate: false
      },
      customerTenantPartyId: 'customer-1',
      fulfillmentHandoffStatus: {
        status: 'NOT_SUBMITTED',
        submittedAt: ''
      },
      lines: [
        {
          customerItemSnapshot: {
            customerDisplayName: 'Customer Label',
            customerModel: 'MODEL-1',
            customerSku: 'SKU-1'
          },
          itemId: 'item-1',
          itemSnapshot: {
            itemCode: 'ITEM-001',
            itemName: 'Starter Item'
          },
          lineNo: 1,
          packagingRequirementSnapshot: {
            packageLabel: 'Carton',
            packageMode: 'BOX',
            specialInstructions: 'Keep dry'
          },
          priceQuantityDeliverySnapshot: {
            currencyCode: 'USD',
            deliveryTerm: 'FOB',
            exceptionPlaceholders: [
              {
                actualValue: '12.40',
                baselineSourceType: 'CUSTOMER_PRICE_AGREEMENT',
                baselineValue: '13.00',
                currencyCode: 'USD',
                detectedAt: '2026-04-27T10:00:00.000Z',
                exceptionType: 'LOW_PRICE',
                quantityUomCode: '',
                status: 'REQUIRED'
              }
            ],
            moqSnapshot: {
              moqQuantity: '20',
              quantityUomCode: 'PCS',
              sourceType: 'CUSTOMER_PRICE_AGREEMENT'
            },
            priceSnapshot: {
              currencyCode: 'USD',
              sourceType: 'MANUAL',
              unitPriceAmount: '12.40'
            },
            quantity: '10',
            requestedDeliveryDate: '2026-05-01',
            unitPrice: '12.40'
          },
          salesConfigSnapshot: {
            notes: 'Manual config',
            salesUnitLabel: 'pcs',
            salesUom: 'PCS'
          },
          salesOrderLineId: 'order-line-1'
        }
      ],
      quoteId: 'quote-1',
      quoteVersionId: 'version-1',
      salesOrderId: 'order-1',
      salesOrderNo: 'SO-001',
      tenantId: 'tenant-1'
    })
    submitFulfillmentHandoffApi.mockResolvedValue({
      commercialGateSummary: {
        orderEstablished: true,
        productionGate: false,
        shippingGate: false,
        stockingGate: false
      },
      customerTenantPartyId: 'customer-1',
      fulfillmentHandoffStatus: {
        status: 'SUBMITTED',
        submittedAt: '2026-04-26T12:00:00.000Z'
      },
      lines: [
        {
          customerItemSnapshot: {
            customerDisplayName: 'Customer Label',
            customerModel: 'MODEL-1',
            customerSku: 'SKU-1'
          },
          itemId: 'item-1',
          itemSnapshot: {
            itemCode: 'ITEM-001',
            itemName: 'Starter Item'
          },
          lineNo: 1,
          packagingRequirementSnapshot: {
            packageLabel: 'Carton',
            packageMode: 'BOX',
            specialInstructions: 'Keep dry'
          },
          priceQuantityDeliverySnapshot: {
            currencyCode: 'USD',
            deliveryTerm: 'FOB',
            exceptionPlaceholders: [],
            quantity: '10',
            requestedDeliveryDate: '2026-05-01',
            unitPrice: '12.40'
          },
          salesConfigSnapshot: {
            notes: 'Manual config',
            salesUnitLabel: 'pcs',
            salesUom: 'PCS'
          },
          salesOrderLineId: 'order-line-1'
        }
      ],
      quoteId: 'quote-1',
      quoteVersionId: 'version-1',
      salesOrderId: 'order-1',
      salesOrderNo: 'SO-001',
      tenantId: 'tenant-1'
    })
    createCustomerPriceAgreementFromSalesOrderLineApi.mockResolvedValue({
      currencyCode: 'USD',
      customerPriceAgreementId: 'agreement-1',
      customerTenantPartyId: 'customer-1',
      lines: [],
      publishedAt: '',
      status: 'DRAFT',
      tenantId: 'tenant-1',
      versionNo: 3
    })
  })

  it('loads the selected order detail, then supports fulfillment handoff and create-agreement-from-line actions', async () => {
    const page = (await import('./sales-order-detail.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(getSalesOrderByIdApi).toHaveBeenCalledWith('tenant-1', 'order-1')
    expect(wrapper.text()).toContain('SO-001')
    expect(wrapper.text()).toContain('NOT_SUBMITTED')
    expect(wrapper.text()).toContain('Starter Item')
    expect(wrapper.text()).toContain('LOW_PRICE')
    expect(wrapper.text()).toContain('MANUAL')

    await wrapper.get('[data-testid="sales-submit-handoff"]').trigger('click')
    await wrapper.get('[data-testid="sales-create-agreement-from-order-line-order-line-1"]').trigger('click')

    await flushPromises()

    expect(submitFulfillmentHandoffApi).toHaveBeenCalledWith('tenant-1', 'order-1', {
      auditReason: 'submit fulfillment handoff from tenant-web sales order detail'
    })
    expect(createCustomerPriceAgreementFromSalesOrderLineApi).toHaveBeenCalledWith(
      'tenant-1',
      'order-line-1',
      {
        auditReason: 'create customer agreement draft from tenant-web sales order detail'
      }
    )
    expect(wrapper.text()).toContain('SUBMITTED')
    expect(wrapper.text()).toContain('agreement-1')
  })

  it('does not load the order detail when order read permission is absent', async () => {
    authContextState.actionCodes = []

    const page = (await import('./sales-order-detail.vue')).default
    mount(page)

    await flushPromises()

    expect(getSalesOrderByIdApi).not.toHaveBeenCalled()
  })
})
