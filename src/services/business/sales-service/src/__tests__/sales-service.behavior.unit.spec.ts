import { status } from '@grpc/grpc-js'
import { CreateQuoteCommand } from '../application/commands/create-quote.command'
import { CreateQuoteHandler } from '../application/commands/create-quote.handler'
import { UpdateQuoteDraftCommand } from '../application/commands/update-quote-draft.command'
import { UpdateQuoteDraftHandler } from '../application/commands/update-quote-draft.handler'
import { PublishQuoteCommand } from '../application/commands/publish-quote.command'
import { PublishQuoteHandler } from '../application/commands/publish-quote.handler'
import { ConvertQuoteVersionToOrderCommand } from '../application/commands/convert-quote-version-to-order.command'
import { ConvertQuoteVersionToOrderHandler } from '../application/commands/convert-quote-version-to-order.handler'
import { SetOrderCommercialGateCommand } from '../application/commands/set-order-commercial-gate.command'
import { SetOrderCommercialGateHandler } from '../application/commands/set-order-commercial-gate.handler'
import { SubmitFulfillmentHandoffCommand } from '../application/commands/submit-fulfillment-handoff.command'
import { SubmitFulfillmentHandoffHandler } from '../application/commands/submit-fulfillment-handoff.handler'
import { GetQuoteQuery } from '../application/queries/get-quote.query'
import { GetQuoteHandler } from '../application/queries/get-quote.handler'
import { SearchQuotesQuery } from '../application/queries/search-quotes.query'
import { SearchQuotesHandler } from '../application/queries/search-quotes.handler'
import { GetQuoteVersionQuery } from '../application/queries/get-quote-version.query'
import { GetQuoteVersionHandler } from '../application/queries/get-quote-version.handler'
import { ListQuoteVersionsQuery } from '../application/queries/list-quote-versions.query'
import { ListQuoteVersionsHandler } from '../application/queries/list-quote-versions.handler'
import { GetSalesOrderQuery } from '../application/queries/get-sales-order.query'
import { GetSalesOrderHandler } from '../application/queries/get-sales-order.handler'
import { InMemoryQuoteRepository } from '../infrastructure/repositories/in-memory/in-memory-quote.repository'
import { InMemoryQuoteVersionRepository } from '../infrastructure/repositories/in-memory/in-memory-quote-version.repository'
import { InMemorySalesOrderRepository } from '../infrastructure/repositories/in-memory/in-memory-sales-order.repository'
import { SalesInMemoryStore } from '../infrastructure/store/sales-in-memory-store'
import {
  SalesFulfillmentHandoffStatus,
  SalesOrderRecord
} from '../domain/models/sales-records'

function createHarness() {
  const store = new SalesInMemoryStore()
  const quoteRepository = new InMemoryQuoteRepository(store)
  const quoteVersionRepository = new InMemoryQuoteVersionRepository(store)
  const salesOrderRepository = new InMemorySalesOrderRepository(store)

  return {
    quoteRepository,
    quoteVersionRepository,
    salesOrderRepository,
    createQuote: new CreateQuoteHandler(quoteRepository),
    updateQuoteDraft: new UpdateQuoteDraftHandler(quoteRepository),
    publishQuote: new PublishQuoteHandler(quoteRepository, quoteVersionRepository),
    convertQuoteVersionToOrder: new ConvertQuoteVersionToOrderHandler(
      quoteVersionRepository,
      salesOrderRepository
    ),
    setOrderCommercialGate: new SetOrderCommercialGateHandler(salesOrderRepository),
    submitFulfillmentHandoff: new SubmitFulfillmentHandoffHandler(salesOrderRepository),
    getQuote: new GetQuoteHandler(quoteRepository),
    searchQuotes: new SearchQuotesHandler(quoteRepository),
    getQuoteVersion: new GetQuoteVersionHandler(quoteVersionRepository),
    listQuoteVersions: new ListQuoteVersionsHandler(quoteRepository, quoteVersionRepository),
    getSalesOrder: new GetSalesOrderHandler(salesOrderRepository)
  }
}

function buildLineInput(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    lineNo: 10,
    itemId: 'item-1',
    itemSnapshot: {
      itemCode: 'ITEM-001',
      itemName: 'Ceramic Cup'
    },
    salesConfigSnapshot: {
      salesUom: 'PCS',
      salesUnitLabel: 'piece',
      notes: 'standard export sale'
    },
    packagingRequirementSnapshot: {
      packageMode: 'CARTON',
      packageLabel: 'export carton',
      specialInstructions: 'foam separator'
    },
    priceQuantityDeliverySnapshot: {
      currencyCode: 'USD',
      unitPrice: '100.00',
      quantity: '20',
      deliveryTerm: 'FOB SHANGHAI',
      requestedDeliveryDate: '2026-05-20'
    },
    customerItemSnapshot: {
      customerSku: 'CUS-001',
      customerModel: 'MODEL-RED',
      customerDisplayName: 'Customer Red Cup'
    },
    ...overrides
  }
}

function buildDraftMutation(lines: Array<ReturnType<typeof buildLineInput>>) {
  return {
    customerTenantPartyId: 'party-1',
    opportunityRef: {
      opportunityId: 'opp-1',
      opportunityNo: 'OPP-001',
      opportunityName: 'Hotel Refit'
    },
    lines
  }
}

describe('sales-service behavior Unit', () => {
  it('PublishQuote / when draft changes after publish / should keep published QuoteVersion immutable', async () => {
    const harness = createHarness()
    const created = await harness.createQuote.execute(
      new CreateQuoteCommand({
        tenantId: 'tenant-1',
        customerTenantPartyId: 'party-1',
        opportunityRef: {
          opportunityId: 'opp-1',
          opportunityNo: 'OPP-001',
          opportunityName: 'Hotel Refit'
        },
        draftLines: [buildLineInput()]
      })
    )

    const published = await harness.publishQuote.execute(
      new PublishQuoteCommand({
        tenantId: 'tenant-1',
        quoteId: created.id
      })
    )

    await harness.updateQuoteDraft.execute(
      new UpdateQuoteDraftCommand({
        tenantId: 'tenant-1',
        quoteId: created.id,
        draftMutation: buildDraftMutation([
          buildLineInput({
            itemSnapshot: {
              itemCode: 'ITEM-001',
              itemName: 'Ceramic Cup Revised'
            },
            priceQuantityDeliverySnapshot: {
              currencyCode: 'USD',
              unitPrice: '120.00',
              quantity: '30',
              deliveryTerm: 'FOB SHANGHAI',
              requestedDeliveryDate: '2026-06-02'
            }
          })
        ])
      })
    )

    const version = await harness.getQuoteVersion.execute(
      new GetQuoteVersionQuery('tenant-1', published.id)
    )

    expect(version.lines[0].itemSnapshot.itemName).toBe('Ceramic Cup')
    expect(version.lines[0].priceQuantityDeliverySnapshot.unitPrice).toBe('100.00')
    expect(version.lines[0].priceQuantityDeliverySnapshot.quantity).toBe('20')
  })

  it('GetQuote / SearchQuotes / ListQuoteVersions / should not generate QuoteVersion for preview-style reads', async () => {
    const harness = createHarness()
    const created = await harness.createQuote.execute(
      new CreateQuoteCommand({
        tenantId: 'tenant-1',
        customerTenantPartyId: 'party-1',
        opportunityRef: {
          opportunityId: 'opp-1',
          opportunityNo: 'OPP-001',
          opportunityName: 'Hotel Refit'
        },
        draftLines: [buildLineInput()]
      })
    )

    await harness.getQuote.execute(new GetQuoteQuery('tenant-1', created.id))
    await harness.searchQuotes.execute(
      new SearchQuotesQuery({
        tenantId: 'tenant-1',
        keyword: 'SQ-',
        page: 1,
        pageSize: 20
      })
    )

    const versions = await harness.listQuoteVersions.execute(
      new ListQuoteVersionsQuery({
        tenantId: 'tenant-1',
        quoteId: created.id,
        page: 1,
        pageSize: 20
      })
    )

    expect(versions.total).toBe(0)
    expect(versions.quoteVersions).toHaveLength(0)
  })

  it('ConvertQuoteVersionToOrder / when only draft quote exists / should reject because unpublished draft cannot be converted', async () => {
    const harness = createHarness()
    const created = await harness.createQuote.execute(
      new CreateQuoteCommand({
        tenantId: 'tenant-1',
        customerTenantPartyId: 'party-1',
        opportunityRef: {
          opportunityId: 'opp-1',
          opportunityNo: 'OPP-001',
          opportunityName: 'Hotel Refit'
        },
        draftLines: [buildLineInput()]
      })
    )

    await expect(
      harness.convertQuoteVersionToOrder.execute(
        new ConvertQuoteVersionToOrderCommand({
          tenantId: 'tenant-1',
          quoteVersionId: created.id
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.NOT_FOUND
      }
    })
  })

  it('ConvertQuoteVersionToOrder / when same QuoteVersion is converted twice / should reject second attempt with ALREADY_EXISTS', async () => {
    const harness = createHarness()
    const created = await harness.createQuote.execute(
      new CreateQuoteCommand({
        tenantId: 'tenant-1',
        customerTenantPartyId: 'party-1',
        opportunityRef: undefined,
        draftLines: [buildLineInput()]
      })
    )
    const published = await harness.publishQuote.execute(
      new PublishQuoteCommand({
        tenantId: 'tenant-1',
        quoteId: created.id
      })
    )

    await harness.convertQuoteVersionToOrder.execute(
      new ConvertQuoteVersionToOrderCommand({
        tenantId: 'tenant-1',
        quoteVersionId: published.id
      })
    )

    await expect(
      harness.convertQuoteVersionToOrder.execute(
        new ConvertQuoteVersionToOrderCommand({
          tenantId: 'tenant-1',
          quoteVersionId: published.id
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.ALREADY_EXISTS
      }
    })
  })

  it('ConvertQuoteVersionToOrder / should freeze all required SalesOrderLine snapshots from QuoteVersion', async () => {
    const harness = createHarness()
    const created = await harness.createQuote.execute(
      new CreateQuoteCommand({
        tenantId: 'tenant-1',
        customerTenantPartyId: 'party-1',
        opportunityRef: undefined,
        draftLines: [buildLineInput()]
      })
    )
    const published = await harness.publishQuote.execute(
      new PublishQuoteCommand({
        tenantId: 'tenant-1',
        quoteId: created.id
      })
    )

    const order = await harness.convertQuoteVersionToOrder.execute(
      new ConvertQuoteVersionToOrderCommand({
        tenantId: 'tenant-1',
        quoteVersionId: published.id
      })
    )

    await harness.updateQuoteDraft.execute(
      new UpdateQuoteDraftCommand({
        tenantId: 'tenant-1',
        quoteId: created.id,
        draftMutation: buildDraftMutation([
          buildLineInput({
            itemId: 'item-2',
            itemSnapshot: {
              itemCode: 'ITEM-002',
              itemName: 'Changed Draft Item'
            },
            salesConfigSnapshot: {
              salesUom: 'BOX',
              salesUnitLabel: 'box',
              notes: 'reconfigured'
            },
            packagingRequirementSnapshot: {
              packageMode: 'PALLET',
              packageLabel: 'full pallet',
              specialInstructions: 'corner guard'
            },
            priceQuantityDeliverySnapshot: {
              currencyCode: 'EUR',
              unitPrice: '88.00',
              quantity: '10',
              deliveryTerm: 'CIF HAMBURG',
              requestedDeliveryDate: '2026-07-01'
            },
            customerItemSnapshot: {
              customerSku: 'CUS-999',
              customerModel: 'MODEL-BLUE',
              customerDisplayName: 'Changed Draft Name'
            }
          })
        ])
      })
    )

    const frozenOrder = await harness.getSalesOrder.execute(
      new GetSalesOrderQuery('tenant-1', order.id)
    )

    expect(frozenOrder.lines[0].itemId).toBe('item-1')
    expect(frozenOrder.lines[0].itemSnapshot.itemCode).toBe('ITEM-001')
    expect(frozenOrder.lines[0].salesConfigSnapshot.salesUom).toBe('PCS')
    expect(frozenOrder.lines[0].packagingRequirementSnapshot.packageMode).toBe('CARTON')
    expect(frozenOrder.lines[0].priceQuantityDeliverySnapshot.currencyCode).toBe('USD')
    expect(frozenOrder.lines[0].customerItemSnapshot.customerSku).toBe('CUS-001')
  })

  it('SetOrderCommercialGate + SubmitFulfillmentHandoff / should keep commercial gates independent from handoff summary', async () => {
    const harness = createHarness()
    const created = await harness.createQuote.execute(
      new CreateQuoteCommand({
        tenantId: 'tenant-1',
        customerTenantPartyId: 'party-1',
        opportunityRef: undefined,
        draftLines: [buildLineInput()]
      })
    )
    const published = await harness.publishQuote.execute(
      new PublishQuoteCommand({
        tenantId: 'tenant-1',
        quoteId: created.id
      })
    )
    const order = await harness.convertQuoteVersionToOrder.execute(
      new ConvertQuoteVersionToOrderCommand({
        tenantId: 'tenant-1',
        quoteVersionId: published.id
      })
    )

    await harness.setOrderCommercialGate.execute(
      new SetOrderCommercialGateCommand({
        tenantId: 'tenant-1',
        salesOrderId: order.id,
        gateName: 'production_gate',
        allowed: true
      })
    )

    const handoff = await harness.submitFulfillmentHandoff.execute(
      new SubmitFulfillmentHandoffCommand({
        tenantId: 'tenant-1',
        salesOrderId: order.id
      })
    )

    expect(handoff.commercialGateSummary.orderEstablished).toBe(true)
    expect(handoff.commercialGateSummary.productionGate).toBe(true)
    expect(handoff.commercialGateSummary.stockingGate).toBe(false)
    expect(handoff.commercialGateSummary.shippingGate).toBe(false)
    expect(handoff.fulfillmentHandoffStatus.status).toBe(SalesFulfillmentHandoffStatus.SUBMITTED)
  })

  it('SubmitFulfillmentHandoff / when order_established is false in stored order / should reject with FAILED_PRECONDITION', async () => {
    const harness = createHarness()
    const seededOrder: SalesOrderRecord = {
      id: 'sales-order-1',
      salesOrderNo: 'SO-0001',
      tenantId: 'tenant-1',
      customerTenantPartyId: 'party-1',
      quoteId: 'quote-1',
      quoteVersionId: 'quote-version-1',
      commercialGateSummary: {
        orderEstablished: false,
        productionGate: false,
        stockingGate: false,
        shippingGate: false
      },
      fulfillmentHandoffStatus: {
        status: SalesFulfillmentHandoffStatus.NOT_SUBMITTED
      },
      lines: [
        {
          salesOrderLineId: 'sales-order-line-1',
          lineNo: 10,
          itemId: 'item-1',
          itemSnapshot: {
            itemCode: 'ITEM-001',
            itemName: 'Ceramic Cup'
          },
          salesConfigSnapshot: {
            salesUom: 'PCS',
            salesUnitLabel: 'piece',
            notes: 'standard export sale'
          },
          packagingRequirementSnapshot: {
            packageMode: 'CARTON',
            packageLabel: 'export carton',
            specialInstructions: 'foam separator'
          },
          priceQuantityDeliverySnapshot: {
            currencyCode: 'USD',
            unitPrice: '100.00',
            quantity: '20',
            deliveryTerm: 'FOB SHANGHAI',
            requestedDeliveryDate: '2026-05-20'
          },
          customerItemSnapshot: {
            customerSku: 'CUS-001',
            customerModel: 'MODEL-RED',
            customerDisplayName: 'Customer Red Cup'
          }
        }
      ]
    }
    await harness.salesOrderRepository.save(seededOrder)

    await expect(
      harness.submitFulfillmentHandoff.execute(
        new SubmitFulfillmentHandoffCommand({
          tenantId: 'tenant-1',
          salesOrderId: seededOrder.id
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.FAILED_PRECONDITION
      }
    })
  })
})
