import { ForbiddenException } from '@nestjs/common'
import { FulfillmentHandoffStatusCode, QuoteStatus } from '@oes/common/generated/sales_service'
import { SalesService } from './sales.service'

const SAMPLE_QUOTE = {
  customerTenantPartyId: 'customer-1',
  latestPublishedVersionId: '',
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
  opportunityRef: {
    opportunityId: 'opp-1',
    opportunityName: 'Starter Deal',
    opportunityNo: 'OPP-001'
  },
  quoteId: 'quote-1',
  quoteNo: 'Q-001',
  status: 'DRAFT',
  tenantId: 'tenant-1'
}

const SAMPLE_QUOTE_VERSION = {
  customerTenantPartyId: 'customer-1',
  lines: SAMPLE_QUOTE.lines,
  publishedAt: '2026-04-26T10:00:00.000Z',
  quoteId: 'quote-1',
  quoteNo: 'Q-001',
  quoteVersionId: 'version-1',
  tenantId: 'tenant-1',
  versionNo: 1
}

const SAMPLE_ORDER = {
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
      customerItemSnapshot: SAMPLE_QUOTE.lines[0].customerItemSnapshot,
      itemId: 'item-1',
      itemSnapshot: SAMPLE_QUOTE.lines[0].itemSnapshot,
      lineNo: 1,
      packagingRequirementSnapshot: SAMPLE_QUOTE.lines[0].packagingRequirementSnapshot,
      priceQuantityDeliverySnapshot: SAMPLE_QUOTE.lines[0].priceQuantityDeliverySnapshot,
      salesConfigSnapshot: SAMPLE_QUOTE.lines[0].salesConfigSnapshot,
      salesOrderLineId: 'order-line-1'
    }
  ],
  quoteId: 'quote-1',
  quoteVersionId: 'version-1',
  salesOrderId: 'order-1',
  salesOrderNo: 'SO-001',
  tenantId: 'tenant-1'
}

// Verifies the sales gateway service enforces tenant scope and maps the minimum quote-order slice into the downstream adapters.
describe('SalesService', () => {
  const salesQueryAdapter = {
    getQuote: jest.fn(),
    getQuoteVersion: jest.fn(),
    getSalesOrder: jest.fn(),
    listQuoteVersions: jest.fn(),
    searchQuotes: jest.fn(),
    searchSalesOrders: jest.fn()
  }
  const salesManagementAdapter = {
    convertQuoteVersionToOrder: jest.fn(),
    createQuote: jest.fn(),
    submitFulfillmentHandoff: jest.fn(),
    publishQuote: jest.fn(),
    updateQuoteDraft: jest.fn()
  }

  const service = new SalesService(salesQueryAdapter as any, salesManagementAdapter as any)

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('rejects tenant-scoped operators when they request another tenant sales workspace', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1' }
    }

    await expect(
      service.searchQuotes(
        'tenant-2',
        {
          page: 1,
          pageSize: 20
        },
        source as any
      )
    ).rejects.toBeInstanceOf(ForbiddenException)

    expect(salesQueryAdapter.searchQuotes).not.toHaveBeenCalled()
  })

  it('maps quote list, detail, create, update, publish, and version history flows without widening the sales contract', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', orgId: 'org-1', scopeLevel: 'TENANT', tid: 'tenant-1', typ: 'USER' }
    }

    salesQueryAdapter.searchQuotes.mockResolvedValue({
      page: 2,
      pageSize: 10,
      quotes: [SAMPLE_QUOTE],
      total: 1
    })
    salesQueryAdapter.getQuote.mockResolvedValue({
      quote: SAMPLE_QUOTE
    })
    salesManagementAdapter.createQuote.mockResolvedValue({
      quote: SAMPLE_QUOTE
    })
    salesManagementAdapter.updateQuoteDraft.mockResolvedValue({
      quote: {
        ...SAMPLE_QUOTE,
        status: QuoteStatus.QUOTE_STATUS_PUBLISHED
      }
    })
    salesManagementAdapter.publishQuote.mockResolvedValue({
      quote: {
        ...SAMPLE_QUOTE,
        latestPublishedVersionId: 'version-1',
        status: QuoteStatus.QUOTE_STATUS_PUBLISHED
      },
      quoteVersion: SAMPLE_QUOTE_VERSION
    })
    salesQueryAdapter.listQuoteVersions.mockResolvedValue({
      page: 1,
      pageSize: 20,
      quoteVersions: [SAMPLE_QUOTE_VERSION],
      total: 1
    })
    salesQueryAdapter.getQuoteVersion.mockResolvedValue({
      quoteVersion: SAMPLE_QUOTE_VERSION
    })

    await expect(
      service.searchQuotes(
        'tenant-1',
        {
          customerTenantPartyId: 'customer-1',
          keyword: 'starter',
          page: 2,
          pageSize: 10,
          status: 'DRAFT'
        },
        source as any
      )
    ).resolves.toEqual({
      page: 2,
      pageSize: 10,
      quotes: [SAMPLE_QUOTE],
      total: 1
    })
    await expect(service.getQuote('tenant-1', 'quote-1', source as any)).resolves.toEqual(SAMPLE_QUOTE)
    await expect(
      service.createQuote(
        'tenant-1',
        {
          customerTenantPartyId: 'customer-1',
          draftLines: SAMPLE_QUOTE.lines.map((line) => ({
            customerItemSnapshot: line.customerItemSnapshot,
            itemId: line.itemId,
            itemSnapshot: line.itemSnapshot,
            lineNo: line.lineNo,
            packagingRequirementSnapshot: line.packagingRequirementSnapshot,
            priceQuantityDeliverySnapshot: line.priceQuantityDeliverySnapshot,
            salesConfigSnapshot: line.salesConfigSnapshot
          })),
          opportunityRef: SAMPLE_QUOTE.opportunityRef
        },
        source as any
      )
    ).resolves.toEqual(SAMPLE_QUOTE)
    await expect(
      service.updateQuoteDraft(
        'tenant-1',
        'quote-1',
        {
          draftMutation: {
            customerTenantPartyId: 'customer-1',
            lines: SAMPLE_QUOTE.lines.map((line) => ({
              customerItemSnapshot: line.customerItemSnapshot,
              itemId: line.itemId,
              itemSnapshot: line.itemSnapshot,
              lineNo: line.lineNo,
              packagingRequirementSnapshot: line.packagingRequirementSnapshot,
              priceQuantityDeliverySnapshot: line.priceQuantityDeliverySnapshot,
              salesConfigSnapshot: line.salesConfigSnapshot
            }))
          }
        },
        source as any
      )
    ).resolves.toMatchObject({
      quoteId: 'quote-1',
      status: 'PUBLISHED'
    })
    await expect(
      service.publishQuote(
        'tenant-1',
        'quote-1',
        'publish for customer confirmation',
        source as any
      )
    ).resolves.toMatchObject({
      quote: {
        latestPublishedVersionId: 'version-1',
        status: 'PUBLISHED'
      },
      quoteVersion: {
        quoteVersionId: 'version-1'
      }
    })
    await expect(
      service.listQuoteVersions(
        'tenant-1',
        'quote-1',
        {
          page: 1,
          pageSize: 20
        },
        source as any
      )
    ).resolves.toEqual({
      page: 1,
      pageSize: 20,
      quoteVersions: [SAMPLE_QUOTE_VERSION],
      total: 1
    })
    await expect(
      service.getQuoteVersion('tenant-1', 'version-1', source as any)
    ).resolves.toEqual(SAMPLE_QUOTE_VERSION)

    expect(salesQueryAdapter.searchQuotes).toHaveBeenCalledWith(
      {
        customerTenantPartyId: 'customer-1',
        keyword: 'starter',
        page: 2,
        pageSize: 10,
        status: QuoteStatus.QUOTE_STATUS_DRAFT,
        tenantId: 'tenant-1'
      },
      source
    )
    expect(salesQueryAdapter.getQuote).toHaveBeenCalledWith(
      {
        quoteId: 'quote-1',
        tenantId: 'tenant-1'
      },
      source
    )
    expect(salesManagementAdapter.createQuote).toHaveBeenCalledWith(
      expect.objectContaining({
        customerTenantPartyId: 'customer-1',
        draftLines: expect.any(Array),
        opportunityRef: SAMPLE_QUOTE.opportunityRef,
        tenantId: 'tenant-1'
      }),
      source
    )
    expect(salesManagementAdapter.updateQuoteDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        draftMutation: {
          customerTenantPartyId: 'customer-1',
          lines: expect.any(Array)
        },
        quoteId: 'quote-1',
        tenantId: 'tenant-1'
      }),
      source
    )
    expect(salesManagementAdapter.publishQuote).toHaveBeenCalledWith(
      expect.objectContaining({
        auditReason: 'publish for customer confirmation',
        quoteId: 'quote-1',
        tenantId: 'tenant-1'
      }),
      source
    )
    expect(salesQueryAdapter.listQuoteVersions).toHaveBeenCalledWith(
      {
        page: 1,
        pageSize: 20,
        quoteId: 'quote-1',
        tenantId: 'tenant-1'
      },
      source
    )
    expect(salesQueryAdapter.getQuoteVersion).toHaveBeenCalledWith(
      {
        quoteVersionId: 'version-1',
        tenantId: 'tenant-1'
      },
      source
    )
  })

  it('maps order conversion, handoff submission, list, and detail flows using the frozen quote-version and sales-order identifiers', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1', typ: 'USER' }
    }

    salesManagementAdapter.convertQuoteVersionToOrder.mockResolvedValue({
      salesOrder: SAMPLE_ORDER
    })
    salesManagementAdapter.submitFulfillmentHandoff.mockResolvedValue({
      salesOrder: {
        ...SAMPLE_ORDER,
        fulfillmentHandoffStatus: {
          status: FulfillmentHandoffStatusCode.FULFILLMENT_HANDOFF_STATUS_CODE_SUBMITTED,
          submittedAt: '2026-04-26T12:00:00.000Z'
        }
      }
    })
    salesQueryAdapter.searchSalesOrders.mockResolvedValue({
      page: 1,
      pageSize: 20,
      salesOrders: [SAMPLE_ORDER],
      total: 1
    })
    salesQueryAdapter.getSalesOrder
      .mockResolvedValueOnce({
        salesOrder: {
          ...SAMPLE_ORDER,
          fulfillmentHandoffStatus: {
            status: FulfillmentHandoffStatusCode.FULFILLMENT_HANDOFF_STATUS_CODE_SUBMITTED,
            submittedAt: '2026-04-26T12:00:00.000Z'
          }
        }
      })
      .mockResolvedValueOnce({
        salesOrder: SAMPLE_ORDER
      })

    await expect(
      service.convertQuoteVersionToOrder(
        'tenant-1',
        'version-1',
        'customer approved published quote',
        source as any
      )
    ).resolves.toEqual(SAMPLE_ORDER)
    await expect(
      service.submitFulfillmentHandoff(
        'tenant-1',
        'order-1',
        'sales submitted the fulfillment handoff',
        source as any
      )
    ).resolves.toMatchObject({
      fulfillmentHandoffStatus: {
        status: 'SUBMITTED'
      },
      salesOrderId: 'order-1'
    })
    await expect(
      service.searchSalesOrders(
        'tenant-1',
        {
          keyword: 'SO-001',
          page: 1,
          pageSize: 20,
          productionGate: false,
          quoteVersionId: 'version-1',
          shippingGate: false,
          stockingGate: false
        },
        source as any
      )
    ).resolves.toEqual({
      page: 1,
      pageSize: 20,
      salesOrders: [SAMPLE_ORDER],
      total: 1
    })
    await expect(
      service.getSalesOrder('tenant-1', 'order-1', source as any)
    ).resolves.toEqual(SAMPLE_ORDER)

    expect(salesManagementAdapter.convertQuoteVersionToOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        auditReason: 'customer approved published quote',
        quoteVersionId: 'version-1',
        tenantId: 'tenant-1'
      }),
      source
    )
    expect(salesManagementAdapter.submitFulfillmentHandoff).toHaveBeenCalledWith(
      expect.objectContaining({
        auditReason: 'sales submitted the fulfillment handoff',
        salesOrderId: 'order-1',
        tenantId: 'tenant-1'
      }),
      source
    )
    expect(salesQueryAdapter.searchSalesOrders).toHaveBeenCalledWith(
      {
        keyword: 'SO-001',
        page: 1,
        pageSize: 20,
        productionGate: false,
        quoteVersionId: 'version-1',
        shippingGate: false,
        stockingGate: false,
        tenantId: 'tenant-1'
      },
      source
    )
    expect(salesQueryAdapter.getSalesOrder).toHaveBeenCalledWith(
      {
        salesOrderId: 'order-1',
        tenantId: 'tenant-1'
      },
      source
    )
  })
})
