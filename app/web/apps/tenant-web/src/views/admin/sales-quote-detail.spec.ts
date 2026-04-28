/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const convertQuoteVersionToOrderApi = vi.fn()
const getQuoteByIdApi = vi.fn()
const listManagedCustomerAccountsApi = vi.fn()
const listSelectableCustomersApi = vi.fn()
const listQuoteVersionsApi = vi.fn()
const publishQuoteApi = vi.fn()
const push = vi.fn()
const updateQuoteDraftApi = vi.fn()
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
  convertQuoteVersionToOrderApi,
  getQuoteByIdApi,
  listManagedCustomerAccountsApi,
  listSelectableCustomersApi,
  listQuoteVersionsApi,
  publishQuoteApi,
  updateQuoteDraftApi
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

// Verifies the sales quote detail page loads the current draft and version history, then supports save, publish, and convert-to-order actions.
describe('sales quote detail page', () => {
  beforeEach(() => {
    convertQuoteVersionToOrderApi.mockReset()
    getQuoteByIdApi.mockReset()
    listManagedCustomerAccountsApi.mockReset()
    listSelectableCustomersApi.mockReset()
    listQuoteVersionsApi.mockReset()
    publishQuoteApi.mockReset()
    push.mockReset()
    updateQuoteDraftApi.mockReset()
    authContextState.actionCodes = [
      'sales.quote.get_by_id',
      'sales.quote.update_draft',
      'sales.quote.publish',
      'sales.quote.convert_to_order'
    ]

    useRoute.mockReturnValue({
      params: {
        quoteId: 'quote-1'
      }
    })

    getQuoteByIdApi.mockResolvedValue({
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
    })
    listQuoteVersionsApi.mockResolvedValue({
      page: 1,
      pageSize: 20,
      quoteVersions: [
        {
          customerTenantPartyId: 'customer-1',
          lines: [],
          publishedAt: '2026-04-26T10:00:00.000Z',
          quoteId: 'quote-1',
          quoteNo: 'Q-001',
          quoteVersionId: 'version-1',
          tenantId: 'tenant-1',
          versionNo: 1
        }
      ],
      total: 1
    })
    listManagedCustomerAccountsApi.mockResolvedValue({
      customerAccounts: [
        {
          customerAccountId: 'customer-legacy',
          customerAccountNo: 'CA-LEGACY',
          customerCategory: 'DISTRIBUTOR',
          displayName: 'Legacy Customer',
          primaryBinding: {
            customerPartyBindingId: 'binding-1',
            partyDisplayName: 'Legacy Customer Legal Entity',
            tenantPartyId: 'customer-1'
          },
          status: 'BLOCKED',
          tags: ['legacy'],
          tenantId: 'tenant-1'
        }
      ],
      page: 1,
      pageSize: 1,
      total: 1
    })
    listSelectableCustomersApi.mockResolvedValue({
      customers: [
        {
          customerAccountId: 'customer-2',
          customerAccountNo: 'CA-002',
          displayName: 'Replacement Customer',
          primaryPartyDisplayName: 'Replacement Customer Legal Entity',
          primaryTenantPartyId: 'party-2',
          status: 'ACTIVE_CUSTOMER'
        }
      ],
      page: 1,
      pageSize: 10,
      total: 1
    })
    updateQuoteDraftApi.mockResolvedValue({})
    publishQuoteApi.mockResolvedValue({})
    convertQuoteVersionToOrderApi.mockResolvedValue({
      salesOrderId: 'order-1'
    })
  })

  it('loads the draft and current customer summary, then replaces the customer through the CRM selector before saving, publishing, and converting', async () => {
    const page = (await import('./sales-quote-detail.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(getQuoteByIdApi).toHaveBeenCalledWith('tenant-1', 'quote-1')
    expect(listQuoteVersionsApi).toHaveBeenCalledWith('tenant-1', 'quote-1', {
      page: 1,
      pageSize: 20
    })
    expect(listManagedCustomerAccountsApi).toHaveBeenCalledWith('tenant-1', {
      page: 1,
      pageSize: 1,
      primaryTenantPartyId: 'customer-1'
    })
    expect(wrapper.text()).toContain('Q-001')
    expect(wrapper.get('[data-testid="sales-detail-current-customer-summary"]').text()).toContain(
      'Legacy Customer'
    )
    expect(wrapper.get('[data-testid="sales-detail-current-customer-summary"]').text()).toContain(
      'BLOCKED'
    )

    await wrapper.get('[data-testid="sales-detail-customer-search-input"]').setValue('replacement')
    await wrapper.get('[data-testid="sales-detail-customer-search-button"]').trigger('click')
    await flushPromises()

    expect(listSelectableCustomersApi).toHaveBeenCalledWith('tenant-1', {
      keyword: 'replacement',
      page: 1,
      pageSize: 10
    })

    await wrapper.get('[data-testid="sales-detail-customer-option-customer-2"]').trigger('click')
    expect(wrapper.get('[data-testid="sales-detail-selected-customer-summary"]').text()).toContain(
      'Replacement Customer'
    )

    await wrapper.get('[data-testid="sales-detail-item-name-0"]').setValue('Starter Item Rev')
    await wrapper.get('[data-testid="sales-detail-quantity-0"]').setValue('15')
    await wrapper.get('[data-testid="sales-detail-save"]').trigger('click')
    await wrapper.get('[data-testid="sales-detail-publish"]').trigger('click')
    await wrapper.get('[data-testid="sales-detail-convert-version-1"]').trigger('click')

    await flushPromises()

    expect(updateQuoteDraftApi).toHaveBeenCalledWith('tenant-1', 'quote-1', {
      draftMutation: {
        customerTenantPartyId: 'party-2',
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
              itemName: 'Starter Item Rev'
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
              quantity: '15',
              requestedDeliveryDate: '2026-05-01',
              unitPrice: '12.50'
            },
            salesConfigSnapshot: {
              notes: 'Manual config',
              salesUnitLabel: 'pcs',
              salesUom: 'PCS'
            }
          }
        ]
      }
    })
    expect(publishQuoteApi).toHaveBeenCalledWith('tenant-1', 'quote-1', {
      auditReason: 'publish from tenant-web quote detail'
    })
    expect(convertQuoteVersionToOrderApi).toHaveBeenCalledWith('tenant-1', 'version-1', {
      auditReason: 'convert from tenant-web quote detail'
    })
    expect(push).toHaveBeenCalledWith({
      name: 'TenantSalesOrderDetail',
      params: {
        salesOrderId: 'order-1'
      }
    })
  })

  it('does not load the governed quote detail workspace when quote read permission is absent', async () => {
    authContextState.actionCodes = []

    const page = (await import('./sales-quote-detail.vue')).default
    mount(page)

    await flushPromises()

    expect(getQuoteByIdApi).not.toHaveBeenCalled()
    expect(listQuoteVersionsApi).not.toHaveBeenCalled()
  })
})
