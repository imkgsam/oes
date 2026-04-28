import { SalesController } from './sales.controller'

// Verifies the sales gateway controller forwards the minimum phase 1 quote and order requests into the sales BFF service.
describe('SalesController', () => {
  const salesService = {
    convertQuoteVersionToOrder: jest.fn(),
    createQuote: jest.fn(),
    getQuote: jest.fn(),
    getQuoteVersion: jest.fn(),
    getSalesOrder: jest.fn(),
    listQuoteVersions: jest.fn(),
    publishQuote: jest.fn(),
    searchQuotes: jest.fn(),
    searchSalesOrders: jest.fn(),
    submitFulfillmentHandoff: jest.fn(),
    updateQuoteDraft: jest.fn()
  }

  const controller = new SalesController(salesService as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('forwards the minimum quote and order BFF surface with normalized paging defaults', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1'
    }

    salesService.searchQuotes.mockResolvedValue({ quotes: [], total: 0, page: 1, pageSize: 20 })
    salesService.getQuote.mockResolvedValue({ quoteId: 'quote-1' })
    salesService.createQuote.mockResolvedValue({ quoteId: 'quote-1' })
    salesService.updateQuoteDraft.mockResolvedValue({ quoteId: 'quote-1' })
    salesService.publishQuote.mockResolvedValue({
      quote: { quoteId: 'quote-1' },
      quoteVersion: { quoteVersionId: 'version-1' }
    })
    salesService.listQuoteVersions.mockResolvedValue({
      quoteVersions: [],
      total: 0,
      page: 1,
      pageSize: 20
    })
    salesService.getQuoteVersion.mockResolvedValue({ quoteVersionId: 'version-1' })
    salesService.convertQuoteVersionToOrder.mockResolvedValue({ salesOrderId: 'order-1' })
    salesService.searchSalesOrders.mockResolvedValue({
      salesOrders: [],
      total: 0,
      page: 1,
      pageSize: 20
    })
    salesService.getSalesOrder.mockResolvedValue({ salesOrderId: 'order-1' })
    salesService.submitFulfillmentHandoff.mockResolvedValue({
      salesOrderId: 'order-1',
      fulfillmentHandoffStatus: {
        status: 'SUBMITTED'
      }
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
})
