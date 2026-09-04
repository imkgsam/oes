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

// Verifies the tenant-web sales API client stays aligned with the quote, order, and pricing BFF surfaces.
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
    } = await import('../../../../src/api/bff/sales/index')

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
    } = await import('../../../../src/api/bff/sales/index')

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
          exceptionPlaceholders: [],
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

  it('loads pricing read paths from the tenant-scoped sales workspace entry', async () => {
    const {
      getActiveCustomerPriceAgreementApi,
      getCustomerPriceAgreementApi,
      getPriceListApi,
      getPriceListLinesApi,
      listCustomerPriceAgreementVersionsApi,
      listPriceListsApi
    } = await import('../../../../src/api/bff/sales/index')

    await listPriceListsApi('tenant-1', {
      currencyCode: 'USD',
      effectiveAt: '2026-04-26T10:00:00.000Z',
      keyword: 'North',
      page: 2,
      pageSize: 10,
      priceListType: 'STANDARD',
      status: 'ACTIVE'
    })
    await getPriceListApi('tenant-1', 'price-list-1')
    await getPriceListLinesApi('tenant-1', 'price-list-1', {
      itemId: 'item-1',
      page: 3,
      pageSize: 5
    })
    await getActiveCustomerPriceAgreementApi('tenant-1', {
      currencyCode: 'USD',
      customerTenantPartyId: 'customer-1'
    })
    await getCustomerPriceAgreementApi('tenant-1', 'agreement-1', {
      versionNo: 2
    })
    await listCustomerPriceAgreementVersionsApi('tenant-1', 'agreement-1', {
      page: 4,
      pageSize: 8
    })

    expect(get).toHaveBeenCalledWith('/sales/tenants/tenant-1/pricing/price-lists', {
      params: {
        currencyCode: 'USD',
        effectiveAt: '2026-04-26T10:00:00.000Z',
        keyword: 'North',
        page: 2,
        pageSize: 10,
        priceListType: 'STANDARD',
        status: 'ACTIVE'
      }
    })
    expect(get).toHaveBeenCalledWith('/sales/tenants/tenant-1/pricing/price-lists/price-list-1')
    expect(get).toHaveBeenCalledWith(
      '/sales/tenants/tenant-1/pricing/price-lists/price-list-1/lines',
      {
        params: {
          itemId: 'item-1',
          page: 3,
          pageSize: 5
        }
      }
    )
    expect(get).toHaveBeenCalledWith('/sales/tenants/tenant-1/pricing/customer-price-agreements/active', {
      params: {
        currencyCode: 'USD',
        customerTenantPartyId: 'customer-1'
      }
    })
    expect(get).toHaveBeenCalledWith('/sales/tenants/tenant-1/pricing/customer-price-agreements/agreement-1', {
      params: {
        versionNo: 2
      }
    })
    expect(get).toHaveBeenCalledWith(
      '/sales/tenants/tenant-1/pricing/customer-price-agreements/agreement-1/versions',
      {
        params: {
          page: 4,
          pageSize: 8
        }
      }
    )
  })

  it('submits pricing preview and management commands to the gateway pricing entry', async () => {
    const {
      changePriceListStatusApi,
      createCustomerPriceAgreementApi,
      createCustomerPriceAgreementFromSalesOrderLineApi,
      createPriceListApi,
      previewQuoteLinePricingApi,
      publishCustomerPriceAgreementVersionApi,
      replacePriceListLinesApi,
      updateCustomerPriceAgreementDraftApi,
      updatePriceListApi
    } = await import('../../../../src/api/bff/sales/index')

    await previewQuoteLinePricingApi('tenant-1', {
      currencyCode: 'USD',
      customerTenantPartyId: 'customer-1',
      exchangeRateTargetCurrencyCode: 'USD',
      itemId: 'item-1',
      manualUnitPriceAmount: '12.50',
      pricingAt: '2026-04-26T10:00:00.000Z',
      quantityUomCode: 'PCS',
      requestedQuantity: '10',
      selectedPriceListId: 'price-list-1'
    })
    await createPriceListApi('tenant-1', {
      currencyCode: 'USD',
      effectiveFrom: '2026-04-01',
      effectiveTo: '2026-12-31',
      initialLines: [],
      priceListName: 'North America Standard',
      priceListType: 'STANDARD'
    })
    await updatePriceListApi('tenant-1', 'price-list-1', {
      effectiveTo: '2026-12-31',
      priceListName: 'North America Standard Rev'
    })
    await replacePriceListLinesApi('tenant-1', 'price-list-1', {
      lines: []
    })
    await changePriceListStatusApi('tenant-1', 'price-list-1', {
      targetStatus: 'ACTIVE'
    })
    await createCustomerPriceAgreementApi('tenant-1', {
      currencyCode: 'USD',
      customerTenantPartyId: 'customer-1',
      initialLines: []
    })
    await updateCustomerPriceAgreementDraftApi('tenant-1', 'agreement-1', {
      draftMutation: {
        removals: [],
        upserts: []
      }
    })
    await publishCustomerPriceAgreementVersionApi('tenant-1', 'agreement-1', {
      auditReason: 'publish customer agreement'
    })
    await createCustomerPriceAgreementFromSalesOrderLineApi('tenant-1', 'order-line-1', {
      auditReason: 'promote order line into draft agreement'
    })

    expect(post).toHaveBeenCalledWith('/sales/tenants/tenant-1/pricing/quote-line-preview', {
      currencyCode: 'USD',
      customerTenantPartyId: 'customer-1',
      exchangeRateTargetCurrencyCode: 'USD',
      itemId: 'item-1',
      manualUnitPriceAmount: '12.50',
      pricingAt: '2026-04-26T10:00:00.000Z',
      quantityUomCode: 'PCS',
      requestedQuantity: '10',
      selectedPriceListId: 'price-list-1'
    })
    expect(post).toHaveBeenCalledWith('/sales/tenants/tenant-1/pricing/price-lists', {
      currencyCode: 'USD',
      effectiveFrom: '2026-04-01',
      effectiveTo: '2026-12-31',
      initialLines: [],
      priceListName: 'North America Standard',
      priceListType: 'STANDARD'
    })
    expect(put).toHaveBeenCalledWith('/sales/tenants/tenant-1/pricing/price-lists/price-list-1', {
      effectiveTo: '2026-12-31',
      priceListName: 'North America Standard Rev'
    })
    expect(put).toHaveBeenCalledWith(
      '/sales/tenants/tenant-1/pricing/price-lists/price-list-1/lines',
      {
        lines: []
      }
    )
    expect(post).toHaveBeenCalledWith(
      '/sales/tenants/tenant-1/pricing/price-lists/price-list-1/status',
      {
        targetStatus: 'ACTIVE'
      }
    )
    expect(post).toHaveBeenCalledWith('/sales/tenants/tenant-1/pricing/customer-price-agreements', {
      currencyCode: 'USD',
      customerTenantPartyId: 'customer-1',
      initialLines: []
    })
    expect(put).toHaveBeenCalledWith(
      '/sales/tenants/tenant-1/pricing/customer-price-agreements/agreement-1/draft',
      {
        draftMutation: {
          removals: [],
          upserts: []
        }
      }
    )
    expect(post).toHaveBeenCalledWith(
      '/sales/tenants/tenant-1/pricing/customer-price-agreements/agreement-1/publish',
      {
        auditReason: 'publish customer agreement'
      }
    )
    expect(post).toHaveBeenCalledWith(
      '/sales/tenants/tenant-1/pricing/customer-price-agreements/from-sales-order-lines/order-line-1',
      {
        auditReason: 'promote order line into draft agreement'
      }
    )
  })
})
