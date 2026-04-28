import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const post = vi.fn()
const put = vi.fn()

vi.mock('#/api/request', () => ({
  requestClient: {
    get,
    post,
    put
  }
}))

// Verifies the tenant-web sales API client stays aligned with the minimum sales quote-order BFF surface.
describe('tenant-web sales api', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    put.mockReset()
  })

  it('loads quote and order read paths from the tenant-scoped sales workspace entry', async () => {
    const {
      getQuoteByIdApi,
      getQuoteVersionByIdApi,
      getSalesOrderByIdApi,
      listQuoteVersionsApi,
      listQuotesApi,
      listSalesOrdersApi
    } = await import('./index')

    await listQuotesApi('tenant-1', {
      customerTenantPartyId: 'customer-1',
      keyword: 'starter',
      page: 2,
      pageSize: 10,
      status: 'DRAFT'
    })
    await getQuoteByIdApi('tenant-1', 'quote-1')
    await listQuoteVersionsApi('tenant-1', 'quote-1', {
      page: 3,
      pageSize: 5
    })
    await getQuoteVersionByIdApi('tenant-1', 'version-1')
    await listSalesOrdersApi('tenant-1', {
      keyword: 'SO-001',
      page: 4,
      pageSize: 8,
      productionGate: true,
      quoteVersionId: 'version-1',
      shippingGate: false,
      stockingGate: true
    })
    await getSalesOrderByIdApi('tenant-1', 'order-1')

    expect(get).toHaveBeenCalledWith('/sales/tenants/tenant-1/quotes', {
      params: {
        customerTenantPartyId: 'customer-1',
        keyword: 'starter',
        page: 2,
        pageSize: 10,
        status: 'DRAFT'
      }
    })
    expect(get).toHaveBeenCalledWith('/sales/tenants/tenant-1/quotes/quote-1')
    expect(get).toHaveBeenCalledWith('/sales/tenants/tenant-1/quotes/quote-1/versions', {
      params: {
        page: 3,
        pageSize: 5
      }
    })
    expect(get).toHaveBeenCalledWith('/sales/tenants/tenant-1/quote-versions/version-1')
    expect(get).toHaveBeenCalledWith('/sales/tenants/tenant-1/orders', {
      params: {
        keyword: 'SO-001',
        page: 4,
        pageSize: 8,
        productionGate: true,
        quoteVersionId: 'version-1',
        shippingGate: false,
        stockingGate: true
      }
    })
    expect(get).toHaveBeenCalledWith('/sales/tenants/tenant-1/orders/order-1')
  })

  it('submits quote create, draft update, publish, and conversion commands to the gateway sales entry', async () => {
    const {
      convertQuoteVersionToOrderApi,
      createQuoteApi,
      publishQuoteApi,
      updateQuoteDraftApi
    } = await import('./index')

    const draftLines = [
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
        salesConfigSnapshot: {
          notes: 'Manual config',
          salesUnitLabel: 'pcs',
          salesUom: 'PCS'
        }
      }
    ]

    await createQuoteApi('tenant-1', {
      customerTenantPartyId: 'customer-1',
      draftLines,
      opportunityRef: {
        opportunityId: 'opp-1',
        opportunityName: 'Starter Deal',
        opportunityNo: 'OPP-001'
      }
    })
    await updateQuoteDraftApi('tenant-1', 'quote-1', {
      draftMutation: {
        customerTenantPartyId: 'customer-1',
        lines: draftLines
      }
    })
    await publishQuoteApi('tenant-1', 'quote-1', {
      auditReason: 'publish for customer confirmation'
    })
    await convertQuoteVersionToOrderApi('tenant-1', 'version-1', {
      auditReason: 'customer approved published quote'
    })

    expect(post).toHaveBeenCalledWith('/sales/tenants/tenant-1/quotes', {
      customerTenantPartyId: 'customer-1',
      draftLines,
      opportunityRef: {
        opportunityId: 'opp-1',
        opportunityName: 'Starter Deal',
        opportunityNo: 'OPP-001'
      }
    })
    expect(put).toHaveBeenCalledWith('/sales/tenants/tenant-1/quotes/quote-1/draft', {
      draftMutation: {
        customerTenantPartyId: 'customer-1',
        lines: draftLines
      }
    })
    expect(post).toHaveBeenCalledWith('/sales/tenants/tenant-1/quotes/quote-1/publish', {
      auditReason: 'publish for customer confirmation'
    })
    expect(post).toHaveBeenCalledWith(
      '/sales/tenants/tenant-1/quote-versions/version-1/convert-to-order',
      {
        auditReason: 'customer approved published quote'
      }
    )
  })
})
