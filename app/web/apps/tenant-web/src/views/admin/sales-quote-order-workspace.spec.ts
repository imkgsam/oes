/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const convertQuoteVersionToOrderApi = vi.fn()
const listQuotesApi = vi.fn()
const listSalesOrdersApi = vi.fn()
const publishQuoteApi = vi.fn()
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
  visibleEntries: []
}

vi.mock('#/api', () => ({
  convertQuoteVersionToOrderApi,
  listQuotesApi,
  listSalesOrdersApi,
  publishQuoteApi
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

// Verifies the sales workspace page loads quotes and orders, then exposes the minimum publish and convert actions for manual testing.
describe('sales quote order workspace page', () => {
  beforeEach(() => {
    convertQuoteVersionToOrderApi.mockReset()
    listQuotesApi.mockReset()
    listSalesOrdersApi.mockReset()
    publishQuoteApi.mockReset()
    push.mockReset()
    authContextState.actionCodes = [
      'sales.quote.list',
      'sales.quote.get_by_id',
      'sales.quote.create',
      'sales.quote.publish',
      'sales.quote.convert_to_order',
      'sales.order.list',
      'sales.order.get_by_id'
    ]

    listQuotesApi.mockResolvedValue({
      page: 1,
      pageSize: 20,
      quotes: [
        {
          customerTenantPartyId: 'customer-1',
          latestPublishedVersionId: 'version-1',
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
                quantity: '10',
                requestedDeliveryDate: '2026-05-01',
                unitPrice: '12.50'
              },
              quoteLineId: 'line-1',
              salesConfigSnapshot: {
                notes: 'Manual config',
                salesUnitLabel: 'pcs',
                salesUom: 'PCS'
              }
            }
          ],
          quoteId: 'quote-1',
          quoteNo: 'Q-001',
          status: 'DRAFT',
          tenantId: 'tenant-1'
        }
      ],
      total: 1
    })
    listSalesOrdersApi.mockResolvedValue({
      page: 1,
      pageSize: 20,
      salesOrders: [
        {
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
          lines: [],
          quoteId: 'quote-1',
          quoteVersionId: 'version-1',
          salesOrderId: 'order-1',
          salesOrderNo: 'SO-001',
          tenantId: 'tenant-1'
        }
      ],
      total: 1
    })
    publishQuoteApi.mockResolvedValue({})
    convertQuoteVersionToOrderApi.mockResolvedValue({
      salesOrderId: 'order-1'
    })
  })

  it('loads both directories and supports create, quote detail, publish, convert, and order detail actions', async () => {
    const page = (await import('./sales-quote-order-workspace.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(listQuotesApi).toHaveBeenCalledWith('tenant-1', {
      keyword: undefined,
      page: 1,
      pageSize: 20,
      status: undefined
    })
    expect(listSalesOrdersApi).toHaveBeenCalledWith('tenant-1', {
      keyword: undefined,
      page: 1,
      pageSize: 20
    })
    expect(wrapper.text()).toContain('Q-001')
    expect(wrapper.text()).toContain('SO-001')

    await wrapper.get('[data-testid="sales-open-create"]').trigger('click')
    await wrapper.get('[data-testid="sales-open-quote-quote-1"]').trigger('click')
    await wrapper.get('[data-testid="sales-publish-quote-quote-1"]').trigger('click')
    await wrapper.get('[data-testid="sales-convert-version-version-1"]').trigger('click')
    await wrapper.get('[data-testid="sales-open-order-order-1"]').trigger('click')

    await flushPromises()

    expect(push).toHaveBeenNthCalledWith(1, {
      name: 'TenantSalesQuoteCreate'
    })
    expect(push).toHaveBeenNthCalledWith(2, {
      name: 'TenantSalesQuoteDetail',
      params: {
        quoteId: 'quote-1'
      }
    })
    expect(publishQuoteApi).toHaveBeenCalledWith('tenant-1', 'quote-1', {
      auditReason: 'publish from tenant-web sales workspace'
    })
    expect(convertQuoteVersionToOrderApi).toHaveBeenCalledWith('tenant-1', 'version-1', {
      auditReason: 'convert from tenant-web sales workspace'
    })
    expect(push).toHaveBeenNthCalledWith(3, {
      name: 'TenantSalesOrderDetail',
      params: {
        salesOrderId: 'order-1'
      }
    })
    expect(push).toHaveBeenNthCalledWith(4, {
      name: 'TenantSalesOrderDetail',
      params: {
        salesOrderId: 'order-1'
      }
    })
  })

  it('skips governed sales actions when the session lacks the required action codes', async () => {
    authContextState.actionCodes = []

    const page = (await import('./sales-quote-order-workspace.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(listQuotesApi).not.toHaveBeenCalled()
    expect(listSalesOrdersApi).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="sales-open-create"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="sales-open-quote-quote-1"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="sales-publish-quote-quote-1"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="sales-open-order-order-1"]').exists()).toBe(false)
  })
})
