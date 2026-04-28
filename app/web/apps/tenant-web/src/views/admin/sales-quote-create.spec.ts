/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createQuoteApi = vi.fn()
const listSelectableCustomersApi = vi.fn()
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
  createQuoteApi,
  listSelectableCustomersApi
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

// Verifies the sales quote create page submits one manual line snapshot and redirects into the draft detail workspace.
describe('sales quote create page', () => {
  beforeEach(() => {
    createQuoteApi.mockReset()
    listSelectableCustomersApi.mockReset()
    push.mockReset()
    authContextState.actionCodes = ['sales.quote.create']
    createQuoteApi.mockResolvedValue({
      quoteId: 'quote-1'
    })
    listSelectableCustomersApi.mockResolvedValue({
      customers: [
        {
          customerAccountId: 'customer-1',
          customerAccountNo: 'CA-001',
          displayName: 'Alpha Manufacturing',
          primaryPartyDisplayName: 'Alpha Manufacturing Legal Entity',
          primaryTenantPartyId: 'party-1',
          status: 'ACTIVE_CUSTOMER'
        }
      ],
      page: 1,
      pageSize: 10,
      total: 1
    })
  })

  it('creates one draft quote after selecting one CRM customer and persists only the primary tenant party id', async () => {
    const page = (await import('./sales-quote-create.vue')).default
    const wrapper = mount(page)

    await wrapper.get('[data-testid="sales-create-customer-search-input"]').setValue('alpha')
    await wrapper.get('[data-testid="sales-create-customer-search-button"]').trigger('click')
    await flushPromises()

    expect(listSelectableCustomersApi).toHaveBeenCalledWith('tenant-1', {
      keyword: 'alpha',
      page: 1,
      pageSize: 10
    })

    await wrapper.get('[data-testid="sales-create-customer-option-customer-1"]').trigger('click')
    await wrapper.get('[data-testid="sales-create-opportunity-no"]').setValue('OPP-001')
    await wrapper.get('[data-testid="sales-create-opportunity-name"]').setValue('Starter Deal')
    await wrapper.get('[data-testid="sales-line-item-id-0"]').setValue('item-1')
    await wrapper.get('[data-testid="sales-line-item-code-0"]').setValue('ITEM-001')
    await wrapper.get('[data-testid="sales-line-item-name-0"]').setValue('Starter Item')
    await wrapper.get('[data-testid="sales-line-sales-uom-0"]').setValue('PCS')
    await wrapper.get('[data-testid="sales-line-sales-unit-label-0"]').setValue('pcs')
    await wrapper.get('[data-testid="sales-line-package-mode-0"]').setValue('BOX')
    await wrapper.get('[data-testid="sales-line-package-label-0"]').setValue('Carton')
    await wrapper.get('[data-testid="sales-line-quantity-0"]').setValue('10')
    await wrapper.get('[data-testid="sales-line-unit-price-0"]').setValue('12.50')
    await wrapper.get('[data-testid="sales-line-currency-0"]').setValue('USD')
    await wrapper.get('[data-testid="sales-line-customer-sku-0"]').setValue('SKU-1')
    await wrapper.get('[data-testid="sales-line-customer-model-0"]').setValue('MODEL-1')
    await wrapper.get('[data-testid="sales-line-customer-label-0"]').setValue('Customer Label')
    await wrapper.get('[data-testid="sales-create-submit"]').trigger('click')

    await flushPromises()

    expect(wrapper.get('[data-testid="sales-create-selected-customer-summary"]').text()).toContain(
      'Alpha Manufacturing'
    )
    expect(wrapper.get('[data-testid="sales-create-selected-customer-summary"]').text()).toContain(
      'party-1'
    )
    expect(createQuoteApi).toHaveBeenCalledWith('tenant-1', {
      customerTenantPartyId: 'party-1',
      draftLines: [
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
            specialInstructions: ''
          },
          priceQuantityDeliverySnapshot: {
            currencyCode: 'USD',
            deliveryTerm: '',
            quantity: '10',
            requestedDeliveryDate: '',
            unitPrice: '12.50'
          },
          salesConfigSnapshot: {
            notes: '',
            salesUnitLabel: 'pcs',
            salesUom: 'PCS'
          }
        }
      ],
      opportunityRef: {
        opportunityId: '',
        opportunityName: 'Starter Deal',
        opportunityNo: 'OPP-001'
      }
    })
    expect(push).toHaveBeenCalledWith({
      name: 'TenantSalesQuoteDetail',
      params: {
        quoteId: 'quote-1'
      }
    })
  })

  it('does not submit a draft create command when the session lacks quote create permission', async () => {
    authContextState.actionCodes = []

    const page = (await import('./sales-quote-create.vue')).default
    const wrapper = mount(page)

    expect(wrapper.find('[data-testid="sales-create-submit"]').exists()).toBe(false)
    expect(createQuoteApi).not.toHaveBeenCalled()
  })
})
