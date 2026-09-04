import { ForbiddenException } from '@nestjs/common'
import {
  FulfillmentHandoffStatusCode,
  PriceListStatus,
  PriceListType,
  QuoteStatus
} from '@oes/common/generated/sales_service'
import { SalesService } from './sales.service'

const SAMPLE_PRICE_SNAPSHOT = {
  currencyCode: 'USD',
  resolvedAt: '2026-04-26T10:00:00.000Z',
  sourceLineRefId: 'agreement-line-1',
  sourceRefId: 'agreement-1',
  sourceType: 'CUSTOMER_PRICE_AGREEMENT',
  sourceVersionNo: 2,
  unitPriceAmount: '12.50'
}

const SAMPLE_MOQ_SNAPSHOT = {
  moqQuantity: '20',
  quantityUomCode: 'PCS',
  resolvedAt: '2026-04-26T10:00:00.000Z',
  sourceLineRefId: 'agreement-line-1',
  sourceRefId: 'agreement-1',
  sourceType: 'CUSTOMER_PRICE_AGREEMENT',
  sourceVersionNo: 2
}

const SAMPLE_EXCHANGE_RATE_SNAPSHOT = {
  effectiveAt: '2026-04-26T10:00:00.000Z',
  exchangeRateValue: '1',
  financeRateRef: '',
  fromCurrencyCode: 'USD',
  snapshottedAt: '2026-04-26T10:00:00.000Z',
  toCurrencyCode: 'USD'
}

const SAMPLE_EXCEPTION_PLACEHOLDERS = [
  {
    actualValue: '12.50',
    baselineSourceType: 'CUSTOMER_PRICE_AGREEMENT',
    baselineValue: '13.00',
    currencyCode: 'USD',
    detectedAt: '2026-04-26T10:00:00.000Z',
    exceptionType: 'LOW_PRICE',
    quantityUomCode: '',
    status: 'REQUIRED'
  }
]

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
        exceptionPlaceholders: SAMPLE_EXCEPTION_PLACEHOLDERS,
        exchangeRateSnapshot: SAMPLE_EXCHANGE_RATE_SNAPSHOT,
        moqSnapshot: SAMPLE_MOQ_SNAPSHOT,
        priceSnapshot: SAMPLE_PRICE_SNAPSHOT,
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

const SAMPLE_PRICE_LIST = {
  currencyCode: 'USD',
  effectiveFrom: '2026-04-01',
  effectiveTo: '2026-12-31',
  priceListId: 'price-list-1',
  priceListName: 'North America Standard',
  priceListType: 'STANDARD',
  status: 'ACTIVE',
  tenantId: 'tenant-1'
}

const SAMPLE_PRICE_LIST_LINES = [
  {
    brandKey: 'BRAND-A',
    itemId: 'item-1',
    lineNo: 1,
    moqSnapshot: {
      moqQuantity: '20',
      quantityUomCode: 'PCS',
      resolvedAt: '2026-04-26T10:00:00.000Z',
      sourceLineRefId: 'price-list-line-1',
      sourceRefId: 'price-list-1',
      sourceType: 'PRICE_LIST',
      sourceVersionNo: 0
    },
    priceListLineId: 'price-list-line-1',
    priceSnapshot: {
      currencyCode: 'USD',
      resolvedAt: '2026-04-26T10:00:00.000Z',
      sourceLineRefId: 'price-list-line-1',
      sourceRefId: 'price-list-1',
      sourceType: 'PRICE_LIST',
      sourceVersionNo: 0,
      unitPriceAmount: '13.00'
    }
  }
]

const SAMPLE_CUSTOMER_PRICE_AGREEMENT = {
  currencyCode: 'USD',
  customerPriceAgreementId: 'agreement-1',
  customerTenantPartyId: 'customer-1',
  lines: [
    {
      brandKey: 'BRAND-A',
      customerPriceAgreementLineId: 'agreement-line-1',
      itemId: 'item-1',
      lineNo: 1,
      moqSnapshot: SAMPLE_MOQ_SNAPSHOT,
      priceSnapshot: SAMPLE_PRICE_SNAPSHOT
    }
  ],
  publishedAt: '2026-04-26T10:00:00.000Z',
  status: 'ACTIVE',
  tenantId: 'tenant-1',
  versionNo: 2
}

const SAMPLE_CUSTOMER_PRICE_AGREEMENT_VERSIONS = [
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

// Verifies the sales gateway service enforces tenant scope and maps the quote, order, and pricing slices into the downstream adapters.
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
    publishQuote: jest.fn(),
    submitFulfillmentHandoff: jest.fn(),
    updateQuoteDraft: jest.fn()
  }
  const pricingQueryAdapter = {
    getActiveCustomerPriceAgreement: jest.fn(),
    getCustomerPriceAgreement: jest.fn(),
    getPriceList: jest.fn(),
    getPriceListLines: jest.fn(),
    listCustomerPriceAgreementVersions: jest.fn(),
    previewQuoteLinePricing: jest.fn(),
    searchPriceLists: jest.fn()
  }
  const pricingManagementAdapter = {
    changePriceListStatus: jest.fn(),
    createCustomerPriceAgreement: jest.fn(),
    createCustomerPriceAgreementFromSalesOrderLine: jest.fn(),
    createPriceList: jest.fn(),
    publishCustomerPriceAgreementVersion: jest.fn(),
    replacePriceListLines: jest.fn(),
    updateCustomerPriceAgreementDraft: jest.fn(),
    updatePriceList: jest.fn()
  }

  const service = new SalesService(
    salesQueryAdapter as any,
    salesManagementAdapter as any,
    pricingQueryAdapter as any,
    pricingManagementAdapter as any
  )

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

  it('maps pricing query and management flows without widening the pricing contract', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', orgId: 'org-1', scopeLevel: 'TENANT', tid: 'tenant-1', typ: 'USER' }
    }

    pricingQueryAdapter.searchPriceLists.mockResolvedValue({
      page: 1,
      pageSize: 20,
      priceLists: [SAMPLE_PRICE_LIST],
      total: 1
    })
    pricingQueryAdapter.getPriceList.mockResolvedValue({
      priceList: SAMPLE_PRICE_LIST
    })
    pricingQueryAdapter.getPriceListLines.mockResolvedValue({
      page: 1,
      pageSize: 20,
      priceListLines: SAMPLE_PRICE_LIST_LINES,
      total: 1
    })
    pricingQueryAdapter.getActiveCustomerPriceAgreement.mockResolvedValue({
      customerPriceAgreement: SAMPLE_CUSTOMER_PRICE_AGREEMENT
    })
    pricingQueryAdapter.getCustomerPriceAgreement.mockResolvedValue({
      customerPriceAgreement: SAMPLE_CUSTOMER_PRICE_AGREEMENT
    })
    pricingQueryAdapter.listCustomerPriceAgreementVersions.mockResolvedValue({
      page: 1,
      pageSize: 20,
      total: 2,
      versions: SAMPLE_CUSTOMER_PRICE_AGREEMENT_VERSIONS
    })
    pricingQueryAdapter.previewQuoteLinePricing.mockResolvedValue({
      exceptionPlaceholders: SAMPLE_EXCEPTION_PLACEHOLDERS,
      exchangeRateSnapshot: SAMPLE_EXCHANGE_RATE_SNAPSHOT,
      moqSnapshot: SAMPLE_MOQ_SNAPSHOT,
      priceSnapshot: SAMPLE_PRICE_SNAPSHOT
    })
    pricingManagementAdapter.createPriceList.mockResolvedValue({
      priceList: SAMPLE_PRICE_LIST
    })
    pricingManagementAdapter.updatePriceList.mockResolvedValue({
      priceList: {
        ...SAMPLE_PRICE_LIST,
        priceListName: 'North America Standard Rev'
      }
    })
    pricingManagementAdapter.replacePriceListLines.mockResolvedValue({
      priceList: SAMPLE_PRICE_LIST,
      priceListLines: SAMPLE_PRICE_LIST_LINES
    })
    pricingManagementAdapter.changePriceListStatus.mockResolvedValue({
      priceList: {
        ...SAMPLE_PRICE_LIST,
        status: 'INACTIVE'
      }
    })
    pricingManagementAdapter.createCustomerPriceAgreement.mockResolvedValue({
      customerPriceAgreement: {
        ...SAMPLE_CUSTOMER_PRICE_AGREEMENT,
        publishedAt: '',
        status: 'DRAFT',
        versionNo: 1
      }
    })
    pricingManagementAdapter.updateCustomerPriceAgreementDraft.mockResolvedValue({
      customerPriceAgreement: {
        ...SAMPLE_CUSTOMER_PRICE_AGREEMENT,
        publishedAt: '',
        status: 'DRAFT',
        versionNo: 3
      }
    })
    pricingManagementAdapter.publishCustomerPriceAgreementVersion.mockResolvedValue({
      customerPriceAgreement: SAMPLE_CUSTOMER_PRICE_AGREEMENT
    })
    pricingManagementAdapter.createCustomerPriceAgreementFromSalesOrderLine.mockResolvedValue({
      customerPriceAgreement: {
        ...SAMPLE_CUSTOMER_PRICE_AGREEMENT,
        publishedAt: '',
        status: 'DRAFT',
        versionNo: 3
      }
    })

    await expect(
      service.searchPriceLists(
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
        source as any
      )
    ).resolves.toEqual({
      page: 1,
      pageSize: 20,
      priceLists: [SAMPLE_PRICE_LIST],
      total: 1
    })
    await expect(service.getPriceList('tenant-1', 'price-list-1', source as any)).resolves.toEqual(
      SAMPLE_PRICE_LIST
    )
    await expect(
      service.getPriceListLines(
        'tenant-1',
        'price-list-1',
        { itemId: 'item-1', page: 1, pageSize: 20 },
        source as any
      )
    ).resolves.toEqual({
      page: 1,
      pageSize: 20,
      priceListLines: SAMPLE_PRICE_LIST_LINES,
      total: 1
    })
    await expect(
      service.getActiveCustomerPriceAgreement(
        'tenant-1',
        { currencyCode: 'USD', customerTenantPartyId: 'customer-1' },
        source as any
      )
    ).resolves.toEqual(SAMPLE_CUSTOMER_PRICE_AGREEMENT)
    await expect(
      service.getCustomerPriceAgreement('tenant-1', 'agreement-1', { versionNo: 2 }, source as any)
    ).resolves.toEqual(SAMPLE_CUSTOMER_PRICE_AGREEMENT)
    await expect(
      service.listCustomerPriceAgreementVersions(
        'tenant-1',
        'agreement-1',
        { page: 1, pageSize: 20 },
        source as any
      )
    ).resolves.toEqual({
      page: 1,
      pageSize: 20,
      total: 2,
      versions: SAMPLE_CUSTOMER_PRICE_AGREEMENT_VERSIONS
    })
    await expect(
      service.previewQuoteLinePricing(
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
        source as any
      )
    ).resolves.toEqual({
      exceptionPlaceholders: SAMPLE_EXCEPTION_PLACEHOLDERS,
      exchangeRateSnapshot: SAMPLE_EXCHANGE_RATE_SNAPSHOT,
      moqSnapshot: SAMPLE_MOQ_SNAPSHOT,
      priceSnapshot: SAMPLE_PRICE_SNAPSHOT
    })
    await expect(
      service.createPriceList(
        'tenant-1',
        {
          currencyCode: 'USD',
          effectiveFrom: '2026-04-01',
          effectiveTo: '2026-12-31',
          initialLines: [
            {
              brandKey: 'BRAND-A',
              itemId: 'item-1',
              moqQuantity: '20',
              quantityUomCode: 'PCS',
              unitPriceAmount: '13.00'
            }
          ],
          priceListName: 'North America Standard',
          priceListType: 'STANDARD'
        },
        source as any
      )
    ).resolves.toEqual(SAMPLE_PRICE_LIST)
    await expect(
      service.updatePriceList(
        'tenant-1',
        'price-list-1',
        {
          effectiveTo: '2026-12-31',
          priceListName: 'North America Standard Rev'
        },
        source as any
      )
    ).resolves.toMatchObject({
      priceListId: 'price-list-1',
      priceListName: 'North America Standard Rev'
    })
    await expect(
      service.replacePriceListLines(
        'tenant-1',
        'price-list-1',
        {
          lines: [
            {
              brandKey: 'BRAND-A',
              itemId: 'item-1',
              moqQuantity: '20',
              quantityUomCode: 'PCS',
              unitPriceAmount: '13.00'
            }
          ]
        },
        source as any
      )
    ).resolves.toEqual({
      priceList: SAMPLE_PRICE_LIST,
      priceListLines: SAMPLE_PRICE_LIST_LINES
    })
    await expect(
      service.changePriceListStatus(
        'tenant-1',
        'price-list-1',
        { targetStatus: 'INACTIVE' },
        source as any
      )
    ).resolves.toMatchObject({
      priceListId: 'price-list-1',
      status: 'INACTIVE'
    })
    await expect(
      service.createCustomerPriceAgreement(
        'tenant-1',
        {
          currencyCode: 'USD',
          customerTenantPartyId: 'customer-1',
          initialLines: [
            {
              brandKey: 'BRAND-A',
              itemId: 'item-1',
              moqQuantity: '20',
              quantityUomCode: 'PCS',
              unitPriceAmount: '12.50'
            }
          ]
        },
        source as any
      )
    ).resolves.toMatchObject({
      customerPriceAgreementId: 'agreement-1',
      status: 'DRAFT',
      versionNo: 1
    })
    await expect(
      service.updateCustomerPriceAgreementDraft(
        'tenant-1',
        'agreement-1',
        {
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
        },
        source as any
      )
    ).resolves.toMatchObject({
      customerPriceAgreementId: 'agreement-1',
      status: 'DRAFT',
      versionNo: 3
    })
    await expect(
      service.publishCustomerPriceAgreementVersion(
        'tenant-1',
        'agreement-1',
        'publish customer agreement',
        source as any
      )
    ).resolves.toEqual(SAMPLE_CUSTOMER_PRICE_AGREEMENT)
    await expect(
      service.createCustomerPriceAgreementFromSalesOrderLine(
        'tenant-1',
        'order-line-1',
        'promote order line into draft agreement',
        source as any
      )
    ).resolves.toMatchObject({
      customerPriceAgreementId: 'agreement-1',
      status: 'DRAFT',
      versionNo: 3
    })

    expect(pricingQueryAdapter.searchPriceLists).toHaveBeenCalledWith(
      {
        currencyCode: 'USD',
        effectiveAt: '2026-04-26T10:00:00.000Z',
        keyword: 'North',
        page: 1,
        pageSize: 20,
        priceListType: PriceListType.PRICE_LIST_TYPE_STANDARD,
        status: PriceListStatus.PRICE_LIST_STATUS_ACTIVE,
        tenantId: 'tenant-1'
      },
      source
    )
    expect(pricingManagementAdapter.publishCustomerPriceAgreementVersion).toHaveBeenCalledWith(
      expect.objectContaining({
        auditReason: 'publish customer agreement',
        customerPriceAgreementId: 'agreement-1',
        tenantId: 'tenant-1'
      }),
      source
    )
    expect(pricingManagementAdapter.createCustomerPriceAgreementFromSalesOrderLine).toHaveBeenCalledWith(
      expect.objectContaining({
        auditReason: 'promote order line into draft agreement',
        salesOrderLineId: 'order-line-1',
        tenantId: 'tenant-1'
      }),
      source
    )
  })
})
