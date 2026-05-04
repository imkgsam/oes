/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const changePriceListStatusApi = vi.fn()
const convertQuoteVersionToOrderApi = vi.fn()
const createCustomerPriceAgreementApi = vi.fn()
const createPriceListApi = vi.fn()
const getActiveCustomerPriceAgreementApi = vi.fn()
const getCustomerPriceAgreementApi = vi.fn()
const getPriceListApi = vi.fn()
const getPriceListLinesApi = vi.fn()
const listCustomerPriceAgreementVersionsApi = vi.fn()
const listPriceListsApi = vi.fn()
const listQuotesApi = vi.fn()
const listSalesOrdersApi = vi.fn()
const publishCustomerPriceAgreementVersionApi = vi.fn()
const publishQuoteApi = vi.fn()
const push = vi.fn()
const replacePriceListLinesApi = vi.fn()
const updateCustomerPriceAgreementDraftApi = vi.fn()
const updatePriceListApi = vi.fn()

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
  changePriceListStatusApi,
  convertQuoteVersionToOrderApi,
  createCustomerPriceAgreementApi,
  createPriceListApi,
  getActiveCustomerPriceAgreementApi,
  getCustomerPriceAgreementApi,
  getPriceListApi,
  getPriceListLinesApi,
  listCustomerPriceAgreementVersionsApi,
  listPriceListsApi,
  listQuotesApi,
  listSalesOrdersApi,
  publishCustomerPriceAgreementVersionApi,
  publishQuoteApi,
  replacePriceListLinesApi,
  updateCustomerPriceAgreementDraftApi,
  updatePriceListApi
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

// Verifies the sales workspace page loads quotes, orders, and pricing management regions for the tenant sales workspace.
describe('sales quote order workspace page', () => {
  beforeEach(() => {
    changePriceListStatusApi.mockReset()
    convertQuoteVersionToOrderApi.mockReset()
    createCustomerPriceAgreementApi.mockReset()
    createPriceListApi.mockReset()
    getActiveCustomerPriceAgreementApi.mockReset()
    getCustomerPriceAgreementApi.mockReset()
    getPriceListApi.mockReset()
    getPriceListLinesApi.mockReset()
    listCustomerPriceAgreementVersionsApi.mockReset()
    listPriceListsApi.mockReset()
    listQuotesApi.mockReset()
    listSalesOrdersApi.mockReset()
    publishCustomerPriceAgreementVersionApi.mockReset()
    publishQuoteApi.mockReset()
    push.mockReset()
    replacePriceListLinesApi.mockReset()
    updateCustomerPriceAgreementDraftApi.mockReset()
    updatePriceListApi.mockReset()

    authContextState.actionCodes = [
      'sales.quote.list',
      'sales.quote.get_by_id',
      'sales.quote.create',
      'sales.quote.publish',
      'sales.quote.convert_to_order',
      'sales.order.list',
      'sales.order.get_by_id',
      'sales.pricing.price_list.read',
      'sales.pricing.price_list.manage',
      'sales.pricing.customer_agreement.read',
      'sales.pricing.customer_agreement.manage'
    ]

    listQuotesApi.mockResolvedValue({
      page: 1,
      pageSize: 20,
      quotes: [
        {
          customerTenantPartyId: 'customer-1',
          latestPublishedVersionId: 'version-1',
          lines: [],
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
    listPriceListsApi.mockResolvedValue({
      page: 1,
      pageSize: 20,
      priceLists: [
        {
          currencyCode: 'USD',
          effectiveFrom: '2026-04-01',
          effectiveTo: '2026-12-31',
          priceListId: 'price-list-1',
          priceListName: 'North America Standard',
          priceListType: 'STANDARD',
          status: 'ACTIVE',
          tenantId: 'tenant-1'
        }
      ],
      total: 1
    })
    getPriceListApi.mockResolvedValue({
      currencyCode: 'USD',
      effectiveFrom: '2026-04-01',
      effectiveTo: '2026-12-31',
      priceListId: 'price-list-1',
      priceListName: 'North America Standard',
      priceListType: 'STANDARD',
      status: 'ACTIVE',
      tenantId: 'tenant-1'
    })
    getPriceListLinesApi.mockResolvedValue({
      page: 1,
      pageSize: 20,
      priceListLines: [
        {
          brandKey: 'BRAND-A',
          itemId: 'item-1',
          lineNo: 1,
          moqSnapshot: {
            moqQuantity: '20',
            quantityUomCode: 'PCS'
          },
          priceListLineId: 'price-list-line-1',
          priceSnapshot: {
            currencyCode: 'USD',
            unitPriceAmount: '13.00'
          }
        }
      ],
      total: 1
    })
    createPriceListApi.mockResolvedValue({
      currencyCode: 'USD',
      effectiveFrom: '2026-04-01',
      effectiveTo: '2026-12-31',
      priceListId: 'price-list-2',
      priceListName: 'New Draft Price List',
      priceListType: 'STANDARD',
      status: 'DRAFT',
      tenantId: 'tenant-1'
    })
    updatePriceListApi.mockResolvedValue({
      currencyCode: 'USD',
      effectiveFrom: '2026-04-01',
      effectiveTo: '2026-12-31',
      priceListId: 'price-list-1',
      priceListName: 'North America Standard Rev',
      priceListType: 'STANDARD',
      status: 'ACTIVE',
      tenantId: 'tenant-1'
    })
    replacePriceListLinesApi.mockResolvedValue({
      priceList: {
        currencyCode: 'USD',
        effectiveFrom: '2026-04-01',
        effectiveTo: '2026-12-31',
        priceListId: 'price-list-1',
        priceListName: 'North America Standard Rev',
        priceListType: 'STANDARD',
        status: 'ACTIVE',
        tenantId: 'tenant-1'
      },
      priceListLines: [
        {
          brandKey: 'BRAND-A',
          itemId: 'item-1',
          lineNo: 1,
          moqSnapshot: {
            moqQuantity: '24',
            quantityUomCode: 'PCS'
          },
          priceListLineId: 'price-list-line-1',
          priceSnapshot: {
            currencyCode: 'USD',
            unitPriceAmount: '13.40'
          }
        }
      ]
    })
    changePriceListStatusApi.mockResolvedValue({
      currencyCode: 'USD',
      effectiveFrom: '2026-04-01',
      effectiveTo: '2026-12-31',
      priceListId: 'price-list-1',
      priceListName: 'North America Standard Rev',
      priceListType: 'STANDARD',
      status: 'INACTIVE',
      tenantId: 'tenant-1'
    })
    getActiveCustomerPriceAgreementApi.mockResolvedValue({
      currencyCode: 'USD',
      customerPriceAgreementId: 'agreement-1',
      customerTenantPartyId: 'customer-1',
      lines: [
        {
          brandKey: 'BRAND-A',
          customerPriceAgreementLineId: 'agreement-line-1',
          itemId: 'item-1',
          lineNo: 1,
          moqSnapshot: {
            moqQuantity: '20',
            quantityUomCode: 'PCS'
          },
          priceSnapshot: {
            currencyCode: 'USD',
            unitPriceAmount: '12.50'
          }
        }
      ],
      publishedAt: '2026-04-26T10:00:00.000Z',
      status: 'ACTIVE',
      tenantId: 'tenant-1',
      versionNo: 2
    })
    getCustomerPriceAgreementApi.mockResolvedValue({
      currencyCode: 'USD',
      customerPriceAgreementId: 'agreement-1',
      customerTenantPartyId: 'customer-1',
      lines: [
        {
          brandKey: 'BRAND-A',
          customerPriceAgreementLineId: 'agreement-line-1',
          itemId: 'item-1',
          lineNo: 1,
          moqSnapshot: {
            moqQuantity: '20',
            quantityUomCode: 'PCS'
          },
          priceSnapshot: {
            currencyCode: 'USD',
            unitPriceAmount: '12.50'
          }
        }
      ],
      publishedAt: '2026-04-26T10:00:00.000Z',
      status: 'ACTIVE',
      tenantId: 'tenant-1',
      versionNo: 2
    })
    listCustomerPriceAgreementVersionsApi.mockResolvedValue({
      page: 1,
      pageSize: 20,
      total: 2,
      versions: [
        {
          customerPriceAgreementId: 'agreement-1',
          lineCount: 1,
          publishedAt: '',
          status: 'DRAFT',
          versionNo: 3
        },
        {
          customerPriceAgreementId: 'agreement-1',
          lineCount: 1,
          publishedAt: '2026-04-26T10:00:00.000Z',
          status: 'ACTIVE',
          versionNo: 2
        }
      ]
    })
    createCustomerPriceAgreementApi.mockResolvedValue({
      currencyCode: 'USD',
      customerPriceAgreementId: 'agreement-2',
      customerTenantPartyId: 'customer-1',
      lines: [],
      publishedAt: '',
      status: 'DRAFT',
      tenantId: 'tenant-1',
      versionNo: 1
    })
    updateCustomerPriceAgreementDraftApi.mockResolvedValue({
      currencyCode: 'USD',
      customerPriceAgreementId: 'agreement-1',
      customerTenantPartyId: 'customer-1',
      lines: [
        {
          brandKey: 'BRAND-A',
          customerPriceAgreementLineId: 'agreement-line-1',
          itemId: 'item-1',
          lineNo: 1,
          moqSnapshot: {
            moqQuantity: '24',
            quantityUomCode: 'PCS'
          },
          priceSnapshot: {
            currencyCode: 'USD',
            unitPriceAmount: '12.40'
          }
        }
      ],
      publishedAt: '',
      status: 'DRAFT',
      tenantId: 'tenant-1',
      versionNo: 3
    })
    publishCustomerPriceAgreementVersionApi.mockResolvedValue({
      currencyCode: 'USD',
      customerPriceAgreementId: 'agreement-1',
      customerTenantPartyId: 'customer-1',
      lines: [
        {
          brandKey: 'BRAND-A',
          customerPriceAgreementLineId: 'agreement-line-1',
          itemId: 'item-1',
          lineNo: 1,
          moqSnapshot: {
            moqQuantity: '24',
            quantityUomCode: 'PCS'
          },
          priceSnapshot: {
            currencyCode: 'USD',
            unitPriceAmount: '12.40'
          }
        }
      ],
      publishedAt: '2026-04-27T10:00:00.000Z',
      status: 'ACTIVE',
      tenantId: 'tenant-1',
      versionNo: 3
    })
    publishQuoteApi.mockResolvedValue({})
    convertQuoteVersionToOrderApi.mockResolvedValue({
      salesOrderId: 'order-1'
    })
  })

  it('loads directories and supports quote, order, and pricing management actions', async () => {
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
    expect(listPriceListsApi).toHaveBeenCalledWith('tenant-1', {
      currencyCode: undefined,
      effectiveAt: undefined,
      keyword: undefined,
      page: 1,
      pageSize: 20,
      priceListType: undefined,
      status: undefined
    })
    expect(wrapper.text()).toContain('Q-001')
    expect(wrapper.text()).toContain('SO-001')
    expect(wrapper.text()).toContain('North America Standard')

    await wrapper.get('[data-testid="sales-open-create"]').trigger('click')
    await wrapper.get('[data-testid="sales-open-quote-quote-1"]').trigger('click')
    await wrapper.get('[data-testid="sales-publish-quote-quote-1"]').trigger('click')
    await wrapper.get('[data-testid="sales-convert-version-version-1"]').trigger('click')
    await wrapper.get('[data-testid="sales-open-order-order-1"]').trigger('click')

    await wrapper.get('[data-testid="pricing-open-price-list-price-list-1"]').trigger('click')
    await flushPromises()

    expect(getPriceListApi).toHaveBeenCalledWith('tenant-1', 'price-list-1')
    expect(getPriceListLinesApi).toHaveBeenCalledWith('tenant-1', 'price-list-1', {
      itemId: undefined,
      page: 1,
      pageSize: 20
    })

    await wrapper.get('[data-testid="pricing-price-list-name-input"]').setValue(
      'North America Standard Rev'
    )
    await wrapper.get('[data-testid="pricing-price-list-line-unit-price-0"]').setValue('13.40')
    await wrapper.get('[data-testid="pricing-price-list-line-moq-0"]').setValue('24')
    await wrapper.get('[data-testid="pricing-save-price-list"]').trigger('click')
    await wrapper.get('[data-testid="pricing-replace-price-list-lines"]').trigger('click')
    await wrapper.get('[data-testid="pricing-status-price-list-inactive"]').trigger('click')

    await wrapper.get('[data-testid="pricing-create-price-list-name-input"]').setValue(
      'New Draft Price List'
    )
    await wrapper.get('[data-testid="pricing-create-price-list"]').trigger('click')

    await wrapper.get('[data-testid="pricing-agreement-customer-input"]').setValue('customer-1')
    await wrapper.get('[data-testid="pricing-agreement-currency-input"]').setValue('USD')
    await wrapper.get('[data-testid="pricing-load-active-agreement"]').trigger('click')
    await flushPromises()

    expect(getActiveCustomerPriceAgreementApi).toHaveBeenCalledWith('tenant-1', {
      currencyCode: 'USD',
      customerTenantPartyId: 'customer-1'
    })
    expect(listCustomerPriceAgreementVersionsApi).toHaveBeenCalledWith('tenant-1', 'agreement-1', {
      page: 1,
      pageSize: 20
    })

    await wrapper.get('[data-testid="pricing-agreement-id-input"]').setValue('agreement-1')
    await wrapper.get('[data-testid="pricing-load-agreement-by-id"]').trigger('click')
    await flushPromises()

    expect(getCustomerPriceAgreementApi).toHaveBeenCalledWith('tenant-1', 'agreement-1', {
      versionNo: undefined
    })

    await wrapper.get('[data-testid="pricing-agreement-line-unit-price-0"]').setValue('12.40')
    await wrapper.get('[data-testid="pricing-agreement-line-moq-0"]').setValue('24')
    await wrapper.get('[data-testid="pricing-save-agreement-draft"]').trigger('click')
    await wrapper.get('[data-testid="pricing-publish-agreement"]').trigger('click')
    await wrapper.get('[data-testid="pricing-create-agreement"]').trigger('click')

    await flushPromises()

    expect(updatePriceListApi).toHaveBeenCalledWith('tenant-1', 'price-list-1', {
      effectiveFrom: '2026-04-01',
      effectiveTo: '2026-12-31',
      priceListName: 'North America Standard Rev'
    })
    expect(replacePriceListLinesApi).toHaveBeenCalledWith('tenant-1', 'price-list-1', {
      lines: [
        {
          brandKey: 'BRAND-A',
          itemId: 'item-1',
          moqQuantity: '24',
          quantityUomCode: 'PCS',
          unitPriceAmount: '13.40'
        }
      ]
    })
    expect(changePriceListStatusApi).toHaveBeenCalledWith('tenant-1', 'price-list-1', {
      targetStatus: 'INACTIVE'
    })
    expect(createPriceListApi).toHaveBeenCalledWith('tenant-1', {
      currencyCode: 'USD',
      effectiveFrom: '2026-04-01',
      effectiveTo: '2026-12-31',
      initialLines: [],
      priceListName: 'New Draft Price List',
      priceListType: 'STANDARD'
    })
    expect(updateCustomerPriceAgreementDraftApi).toHaveBeenCalledWith('tenant-1', 'agreement-1', {
      draftMutation: {
        removals: [],
        upserts: [
          {
            brandKey: 'BRAND-A',
            itemId: 'item-1',
            moqQuantity: '24',
            quantityUomCode: 'PCS',
            unitPriceAmount: '12.40'
          }
        ]
      }
    })
    expect(publishCustomerPriceAgreementVersionApi).toHaveBeenCalledWith('tenant-1', 'agreement-1', {
      auditReason: 'publish customer agreement from tenant-web sales workspace'
    })
    expect(createCustomerPriceAgreementApi).toHaveBeenCalledWith('tenant-1', {
      currencyCode: 'USD',
      customerTenantPartyId: 'customer-1',
      initialLines: [
        {
          brandKey: 'BRAND-A',
          itemId: 'item-1',
          moqQuantity: '24',
          quantityUomCode: 'PCS',
          unitPriceAmount: '12.40'
        }
      ]
    })
    expect(wrapper.text()).toContain('V3')

    expect(push).toHaveBeenNthCalledWith(1, {
      name: 'TenantSalesQuoteCreate'
    })
    expect(push).toHaveBeenNthCalledWith(2, {
      name: 'TenantSalesQuoteDetail',
      params: {
        quoteId: 'quote-1'
      }
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

  it('skips governed sales and pricing actions when the session lacks the required action codes', async () => {
    authContextState.actionCodes = []

    const page = (await import('./sales-quote-order-workspace.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(listQuotesApi).not.toHaveBeenCalled()
    expect(listSalesOrdersApi).not.toHaveBeenCalled()
    expect(listPriceListsApi).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="sales-open-create"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="sales-open-quote-quote-1"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="sales-publish-quote-quote-1"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="sales-open-order-order-1"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="pricing-open-price-list-price-list-1"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="pricing-create-agreement"]').exists()).toBe(false)
  })
})
