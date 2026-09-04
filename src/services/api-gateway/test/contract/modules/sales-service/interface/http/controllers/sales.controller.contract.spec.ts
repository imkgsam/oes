import { SalesController } from '../../../../../../../src/modules/sales-service/interface/http/controllers/sales.controller'

// Verifies the sales gateway controller forwards the quote, order, and pricing BFF surfaces into the sales service.
describe('SalesController', () => {
  const salesService = {
    changePriceListStatus: jest.fn(),
    convertQuoteVersionToOrder: jest.fn(),
    createCustomerPriceAgreement: jest.fn(),
    createCustomerPriceAgreementFromSalesOrderLine: jest.fn(),
    createPriceList: jest.fn(),
    createQuote: jest.fn(),
    getActiveCustomerPriceAgreement: jest.fn(),
    getCustomerPriceAgreement: jest.fn(),
    getPriceList: jest.fn(),
    getPriceListLines: jest.fn(),
    getQuote: jest.fn(),
    getQuoteVersion: jest.fn(),
    getSalesOrder: jest.fn(),
    listCustomerPriceAgreementVersions: jest.fn(),
    listQuoteVersions: jest.fn(),
    previewQuoteLinePricing: jest.fn(),
    publishCustomerPriceAgreementVersion: jest.fn(),
    publishQuote: jest.fn(),
    replacePriceListLines: jest.fn(),
    searchPriceLists: jest.fn(),
    searchQuotes: jest.fn(),
    searchSalesOrders: jest.fn(),
    submitFulfillmentHandoff: jest.fn(),
    updateCustomerPriceAgreementDraft: jest.fn(),
    updatePriceList: jest.fn(),
    updateQuoteDraft: jest.fn()
  }

  const controller = new SalesController(salesService as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('forwards the quote and order BFF surface with normalized paging defaults', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1'
    }

    salesService.searchQuotes.mockResolvedValue({ page: 1, pageSize: 20, quotes: [], total: 0 })
    salesService.getQuote.mockResolvedValue({ quoteId: 'quote-1' })
    salesService.createQuote.mockResolvedValue({ quoteId: 'quote-1' })
    salesService.updateQuoteDraft.mockResolvedValue({ quoteId: 'quote-1' })
    salesService.publishQuote.mockResolvedValue({
      quote: { quoteId: 'quote-1' },
      quoteVersion: { quoteVersionId: 'version-1' }
    })
    salesService.listQuoteVersions.mockResolvedValue({
      page: 1,
      pageSize: 20,
      quoteVersions: [],
      total: 0
    })
    salesService.getQuoteVersion.mockResolvedValue({ quoteVersionId: 'version-1' })
    salesService.convertQuoteVersionToOrder.mockResolvedValue({ salesOrderId: 'order-1' })
    salesService.searchSalesOrders.mockResolvedValue({
      page: 1,
      pageSize: 20,
      salesOrders: [],
      total: 0
    })
    salesService.getSalesOrder.mockResolvedValue({ salesOrderId: 'order-1' })
    salesService.submitFulfillmentHandoff.mockResolvedValue({
      fulfillmentHandoffStatus: {
        status: 'SUBMITTED'
      },
      salesOrderId: 'order-1'
    })

    await controller.searchQuotes(
      'tenant-1',
      {
        customerTenantPartyId: 'customer-1',
        keyword: 'starter',
        page: 2,
        pageSize: 10,
        status: 'DRAFT'
      } as any,
      source as any
    )
    await controller.getQuote('tenant-1', 'quote-1', source as any)
    await controller.createQuote(
      'tenant-1',
      {
        customerTenantPartyId: 'customer-1',
        draftLines: [],
        opportunityRef: {
          opportunityId: 'opp-1',
          opportunityName: 'Starter Deal',
          opportunityNo: 'OPP-001'
        }
      } as any,
      source as any
    )
    await controller.updateQuoteDraft(
      'tenant-1',
      'quote-1',
      {
        draftMutation: {
          customerTenantPartyId: 'customer-1',
          lines: []
        }
      } as any,
      source as any
    )
    await controller.publishQuote(
      'tenant-1',
      'quote-1',
      {
        auditReason: 'publish for customer confirmation'
      } as any,
      source as any
    )
    await controller.listQuoteVersions(
      'tenant-1',
      'quote-1',
      {
        page: 3,
        pageSize: 5
      } as any,
      source as any
    )
    await controller.getQuoteVersion('tenant-1', 'version-1', source as any)
    await controller.convertQuoteVersionToOrder(
      'tenant-1',
      'version-1',
      {
        auditReason: 'customer approved published quote'
      } as any,
      source as any
    )
    await controller.searchSalesOrders(
      'tenant-1',
      {
        keyword: 'SO-001',
        page: 4,
        pageSize: 8,
        productionGate: true,
        quoteVersionId: 'version-1',
        shippingGate: false,
        stockingGate: true
      } as any,
      source as any
    )
    await controller.getSalesOrder('tenant-1', 'order-1', source as any)
    await controller.submitFulfillmentHandoff(
      'tenant-1',
      'order-1',
      {
        auditReason: 'sales submitted the fulfillment handoff'
      } as any,
      source as any
    )

    expect(salesService.searchQuotes).toHaveBeenCalledWith(
      'tenant-1',
      {
        customerTenantPartyId: 'customer-1',
        keyword: 'starter',
        page: 2,
        pageSize: 10,
        status: 'DRAFT'
      },
      source
    )
    expect(salesService.getQuote).toHaveBeenCalledWith('tenant-1', 'quote-1', source)
    expect(salesService.createQuote).toHaveBeenCalledWith(
      'tenant-1',
      {
        customerTenantPartyId: 'customer-1',
        draftLines: [],
        opportunityRef: {
          opportunityId: 'opp-1',
          opportunityName: 'Starter Deal',
          opportunityNo: 'OPP-001'
        }
      },
      source
    )
    expect(salesService.updateQuoteDraft).toHaveBeenCalledWith(
      'tenant-1',
      'quote-1',
      {
        draftMutation: {
          customerTenantPartyId: 'customer-1',
          lines: []
        }
      },
      source
    )
    expect(salesService.publishQuote).toHaveBeenCalledWith(
      'tenant-1',
      'quote-1',
      'publish for customer confirmation',
      source
    )
    expect(salesService.listQuoteVersions).toHaveBeenCalledWith(
      'tenant-1',
      'quote-1',
      {
        page: 3,
        pageSize: 5
      },
      source
    )
    expect(salesService.getQuoteVersion).toHaveBeenCalledWith('tenant-1', 'version-1', source)
    expect(salesService.convertQuoteVersionToOrder).toHaveBeenCalledWith(
      'tenant-1',
      'version-1',
      'customer approved published quote',
      source
    )
    expect(salesService.searchSalesOrders).toHaveBeenCalledWith(
      'tenant-1',
      {
        keyword: 'SO-001',
        page: 4,
        pageSize: 8,
        productionGate: true,
        quoteVersionId: 'version-1',
        shippingGate: false,
        stockingGate: true
      },
      source
    )
    expect(salesService.getSalesOrder).toHaveBeenCalledWith('tenant-1', 'order-1', source)
    expect(salesService.submitFulfillmentHandoff).toHaveBeenCalledWith(
      'tenant-1',
      'order-1',
      'sales submitted the fulfillment handoff',
      source
    )
  })

  it('forwards the pricing BFF surface into the sales service', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1'
    }

    salesService.searchPriceLists.mockResolvedValue({
      page: 1,
      pageSize: 20,
      priceLists: [],
      total: 0
    })
    salesService.getPriceList.mockResolvedValue({ priceListId: 'price-list-1' })
    salesService.getPriceListLines.mockResolvedValue({
      page: 1,
      pageSize: 20,
      priceListLines: [],
      total: 0
    })
    salesService.getActiveCustomerPriceAgreement.mockResolvedValue({
      customerPriceAgreementId: 'agreement-1'
    })
    salesService.getCustomerPriceAgreement.mockResolvedValue({
      customerPriceAgreementId: 'agreement-1'
    })
    salesService.listCustomerPriceAgreementVersions.mockResolvedValue({
      page: 1,
      pageSize: 20,
      total: 0,
      versions: []
    })
    salesService.previewQuoteLinePricing.mockResolvedValue({
      priceSnapshot: {
        sourceType: 'MANUAL',
        unitPriceAmount: '12.50'
      }
    })
    salesService.createPriceList.mockResolvedValue({ priceListId: 'price-list-1' })
    salesService.updatePriceList.mockResolvedValue({ priceListId: 'price-list-1' })
    salesService.replacePriceListLines.mockResolvedValue({
      priceList: { priceListId: 'price-list-1' },
      priceListLines: []
    })
    salesService.changePriceListStatus.mockResolvedValue({
      priceListId: 'price-list-1',
      status: 'ACTIVE'
    })
    salesService.createCustomerPriceAgreement.mockResolvedValue({
      customerPriceAgreementId: 'agreement-1'
    })
    salesService.updateCustomerPriceAgreementDraft.mockResolvedValue({
      customerPriceAgreementId: 'agreement-1'
    })
    salesService.publishCustomerPriceAgreementVersion.mockResolvedValue({
      customerPriceAgreementId: 'agreement-1'
    })
    salesService.createCustomerPriceAgreementFromSalesOrderLine.mockResolvedValue({
      customerPriceAgreementId: 'agreement-1'
    })

    await controller.searchPriceLists(
      'tenant-1',
      {
        currencyCode: 'USD',
        effectiveAt: '2026-04-26T10:00:00.000Z',
        keyword: 'North',
        page: 1,
        pageSize: 20,
        priceListType: 'STANDARD',
        status: 'ACTIVE'
      } as any,
      source as any
    )
    await controller.getPriceList('tenant-1', 'price-list-1', source as any)
    await controller.getPriceListLines(
      'tenant-1',
      'price-list-1',
      {
        itemId: 'item-1',
        page: 2,
        pageSize: 10
      } as any,
      source as any
    )
    await controller.getActiveCustomerPriceAgreement(
      'tenant-1',
      {
        currencyCode: 'USD',
        customerTenantPartyId: 'customer-1'
      } as any,
      source as any
    )
    await controller.getCustomerPriceAgreement(
      'tenant-1',
      'agreement-1',
      {
        versionNo: 2
      } as any,
      source as any
    )
    await controller.listCustomerPriceAgreementVersions(
      'tenant-1',
      'agreement-1',
      {
        page: 1,
        pageSize: 20
      } as any,
      source as any
    )
    await controller.previewQuoteLinePricing(
      'tenant-1',
      {
        currencyCode: 'USD',
        customerTenantPartyId: 'customer-1',
        exchangeRateTargetCurrencyCode: 'USD',
        itemId: 'item-1',
        manualUnitPriceAmount: '12.50',
        pricingAt: '2026-04-26T10:00:00.000Z',
        quantityUomCode: 'PCS',
        requestedQuantity: '10',
        selectedPriceListId: 'price-list-1'
      } as any,
      source as any
    )
    await controller.createPriceList(
      'tenant-1',
      {
        currencyCode: 'USD',
        effectiveFrom: '2026-04-01',
        effectiveTo: '2026-12-31',
        initialLines: [],
        priceListName: 'North America Standard',
        priceListType: 'STANDARD'
      } as any,
      source as any
    )
    await controller.updatePriceList(
      'tenant-1',
      'price-list-1',
      {
        effectiveTo: '2026-12-31',
        priceListName: 'North America Standard Rev'
      } as any,
      source as any
    )
    await controller.replacePriceListLines(
      'tenant-1',
      'price-list-1',
      {
        lines: []
      } as any,
      source as any
    )
    await controller.changePriceListStatus(
      'tenant-1',
      'price-list-1',
      {
        targetStatus: 'ACTIVE'
      } as any,
      source as any
    )
    await controller.createCustomerPriceAgreement(
      'tenant-1',
      {
        currencyCode: 'USD',
        customerTenantPartyId: 'customer-1',
        initialLines: []
      } as any,
      source as any
    )
    await controller.updateCustomerPriceAgreementDraft(
      'tenant-1',
      'agreement-1',
      {
        draftMutation: {
          removals: [],
          upserts: []
        }
      } as any,
      source as any
    )
    await controller.publishCustomerPriceAgreementVersion(
      'tenant-1',
      'agreement-1',
      {
        auditReason: 'publish customer agreement'
      } as any,
      source as any
    )
    await controller.createCustomerPriceAgreementFromSalesOrderLine(
      'tenant-1',
      'order-line-1',
      {
        auditReason: 'promote order line into draft agreement'
      } as any,
      source as any
    )

    expect(salesService.searchPriceLists).toHaveBeenCalledWith(
      'tenant-1',
      {
        currencyCode: 'USD',
        effectiveAt: '2026-04-26T10:00:00.000Z',
        keyword: 'North',
        page: 1,
        pageSize: 20,
        priceListType: 'STANDARD',
        status: 'ACTIVE'
      },
      source
    )
    expect(salesService.getPriceList).toHaveBeenCalledWith('tenant-1', 'price-list-1', source)
    expect(salesService.getPriceListLines).toHaveBeenCalledWith(
      'tenant-1',
      'price-list-1',
      {
        itemId: 'item-1',
        page: 2,
        pageSize: 10
      },
      source
    )
    expect(salesService.getActiveCustomerPriceAgreement).toHaveBeenCalledWith(
      'tenant-1',
      {
        currencyCode: 'USD',
        customerTenantPartyId: 'customer-1'
      },
      source
    )
    expect(salesService.getCustomerPriceAgreement).toHaveBeenCalledWith(
      'tenant-1',
      'agreement-1',
      {
        versionNo: 2
      },
      source
    )
    expect(salesService.listCustomerPriceAgreementVersions).toHaveBeenCalledWith(
      'tenant-1',
      'agreement-1',
      {
        page: 1,
        pageSize: 20
      },
      source
    )
    expect(salesService.previewQuoteLinePricing).toHaveBeenCalledWith(
      'tenant-1',
      {
        currencyCode: 'USD',
        customerTenantPartyId: 'customer-1',
        exchangeRateTargetCurrencyCode: 'USD',
        itemId: 'item-1',
        manualUnitPriceAmount: '12.50',
        pricingAt: '2026-04-26T10:00:00.000Z',
        quantityUomCode: 'PCS',
        requestedQuantity: '10',
        selectedPriceListId: 'price-list-1'
      },
      source
    )
    expect(salesService.createPriceList).toHaveBeenCalledWith(
      'tenant-1',
      {
        currencyCode: 'USD',
        effectiveFrom: '2026-04-01',
        effectiveTo: '2026-12-31',
        initialLines: [],
        priceListName: 'North America Standard',
        priceListType: 'STANDARD'
      },
      source
    )
    expect(salesService.updatePriceList).toHaveBeenCalledWith(
      'tenant-1',
      'price-list-1',
      {
        effectiveTo: '2026-12-31',
        priceListName: 'North America Standard Rev'
      },
      source
    )
    expect(salesService.replacePriceListLines).toHaveBeenCalledWith(
      'tenant-1',
      'price-list-1',
      {
        lines: []
      },
      source
    )
    expect(salesService.changePriceListStatus).toHaveBeenCalledWith(
      'tenant-1',
      'price-list-1',
      'ACTIVE',
      source
    )
    expect(salesService.createCustomerPriceAgreement).toHaveBeenCalledWith(
      'tenant-1',
      {
        currencyCode: 'USD',
        customerTenantPartyId: 'customer-1',
        initialLines: []
      },
      source
    )
    expect(salesService.updateCustomerPriceAgreementDraft).toHaveBeenCalledWith(
      'tenant-1',
      'agreement-1',
      {
        draftMutation: {
          removals: [],
          upserts: []
        }
      },
      source
    )
    expect(salesService.publishCustomerPriceAgreementVersion).toHaveBeenCalledWith(
      'tenant-1',
      'agreement-1',
      'publish customer agreement',
      source
    )
    expect(salesService.createCustomerPriceAgreementFromSalesOrderLine).toHaveBeenCalledWith(
      'tenant-1',
      'order-line-1',
      'promote order line into draft agreement',
      source
    )
  })
})
