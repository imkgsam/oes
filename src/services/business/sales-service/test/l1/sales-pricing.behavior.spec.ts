import { status } from '@grpc/grpc-js'
import { CreateQuoteCommand } from '../../src/application/commands/create-quote.command'
import { CreateQuoteHandler } from '../../src/application/commands/create-quote.handler'
import { PublishQuoteCommand } from '../../src/application/commands/publish-quote.command'
import { PublishQuoteHandler } from '../../src/application/commands/publish-quote.handler'
import { ConvertQuoteVersionToOrderCommand } from '../../src/application/commands/convert-quote-version-to-order.command'
import { ConvertQuoteVersionToOrderHandler } from '../../src/application/commands/convert-quote-version-to-order.handler'
import { CreateCustomerPriceAgreementCommand } from '../../src/application/commands/create-customer-price-agreement.command'
import { CreateCustomerPriceAgreementHandler } from '../../src/application/commands/create-customer-price-agreement.handler'
import { PublishCustomerPriceAgreementVersionCommand } from '../../src/application/commands/publish-customer-price-agreement-version.command'
import { PublishCustomerPriceAgreementVersionHandler } from '../../src/application/commands/publish-customer-price-agreement-version.handler'
import { UpdateCustomerPriceAgreementDraftCommand } from '../../src/application/commands/update-customer-price-agreement-draft.command'
import { UpdateCustomerPriceAgreementDraftHandler } from '../../src/application/commands/update-customer-price-agreement-draft.handler'
import { CreatePriceListCommand } from '../../src/application/commands/create-price-list.command'
import { CreatePriceListHandler } from '../../src/application/commands/create-price-list.handler'
import { ReplacePriceListLinesCommand } from '../../src/application/commands/replace-price-list-lines.command'
import { ReplacePriceListLinesHandler } from '../../src/application/commands/replace-price-list-lines.handler'
import { ChangePriceListStatusCommand } from '../../src/application/commands/change-price-list-status.command'
import { ChangePriceListStatusHandler } from '../../src/application/commands/change-price-list-status.handler'
import { GetActiveCustomerPriceAgreementQuery } from '../../src/application/queries/get-active-customer-price-agreement.query'
import { GetActiveCustomerPriceAgreementHandler } from '../../src/application/queries/get-active-customer-price-agreement.handler'
import { GetCustomerPriceAgreementQuery } from '../../src/application/queries/get-customer-price-agreement.query'
import { GetCustomerPriceAgreementHandler } from '../../src/application/queries/get-customer-price-agreement.handler'
import { PreviewQuoteLinePricingQuery } from '../../src/application/queries/preview-quote-line-pricing.query'
import { PreviewQuoteLinePricingHandler } from '../../src/application/queries/preview-quote-line-pricing.handler'
import { InMemoryCustomerPriceAgreementRepository } from '../../src/infrastructure/repositories/in-memory/in-memory-customer-price-agreement.repository'
import { InMemoryPriceListRepository } from '../../src/infrastructure/repositories/in-memory/in-memory-price-list.repository'
import { InMemoryQuoteRepository } from '../../src/infrastructure/repositories/in-memory/in-memory-quote.repository'
import { InMemoryQuoteVersionRepository } from '../../src/infrastructure/repositories/in-memory/in-memory-quote-version.repository'
import { InMemorySalesOrderRepository } from '../../src/infrastructure/repositories/in-memory/in-memory-sales-order.repository'
import { FixedExchangeRateResolver } from '../../src/infrastructure/pricing/fixed-exchange-rate.resolver'
import { SalesInMemoryStore } from '../../src/infrastructure/store/sales-in-memory-store'

/** buildPricingLineInput creates one quote line payload with a fully frozen pricing snapshot subtree. */
function buildPricingLineInput(overrides: Partial<Record<string, unknown>> = {}) {
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
      unitPrice: '88.00',
      quantity: '12',
      deliveryTerm: 'FOB SHANGHAI',
      requestedDeliveryDate: '2026-06-01',
      priceSnapshot: {
        currencyCode: 'USD',
        unitPriceAmount: '88.00',
        sourceType: 'MANUAL',
        sourceRefId: '',
        sourceLineRefId: '',
        sourceVersionNo: 0,
        resolvedAt: '2026-04-28T08:00:00.000Z'
      },
      moqSnapshot: {
        moqQuantity: '20',
        quantityUomCode: 'PCS',
        sourceType: 'CUSTOMER_PRICE_AGREEMENT',
        sourceRefId: 'agreement-1',
        sourceLineRefId: 'agreement-line-1',
        sourceVersionNo: 3,
        resolvedAt: '2026-04-28T08:00:00.000Z'
      },
      exchangeRateSnapshot: {
        fromCurrencyCode: 'USD',
        toCurrencyCode: 'CNY',
        exchangeRateValue: '7.200000',
        financeRateRef: 'fx-usd-cny-20260428',
        effectiveAt: '2026-04-28T00:00:00.000Z',
        snapshottedAt: '2026-04-28T08:00:00.000Z'
      },
      exceptionPlaceholders: [
        {
          exceptionType: 'LOW_PRICE',
          status: 'REQUIRED',
          baselineSourceType: 'CUSTOMER_PRICE_AGREEMENT',
          baselineValue: '96.00',
          actualValue: '88.00',
          currencyCode: 'USD',
          quantityUomCode: '',
          detectedAt: '2026-04-28T08:00:00.000Z'
        },
        {
          exceptionType: 'LOW_MOQ',
          status: 'REQUIRED',
          baselineSourceType: 'CUSTOMER_PRICE_AGREEMENT',
          baselineValue: '20',
          actualValue: '12',
          currencyCode: '',
          quantityUomCode: 'PCS',
          detectedAt: '2026-04-28T08:00:00.000Z'
        }
      ]
    },
    customerItemSnapshot: {
      customerSku: 'CUS-001',
      customerModel: 'MODEL-RED',
      customerDisplayName: 'Customer Red Cup'
    },
    ...overrides
  }
}

function createHarness() {
  const store = new SalesInMemoryStore()
  const quoteRepository = new InMemoryQuoteRepository(store)
  const quoteVersionRepository = new InMemoryQuoteVersionRepository(store)
  const salesOrderRepository = new InMemorySalesOrderRepository(store)
  const priceListRepository = new InMemoryPriceListRepository(store)
  const agreementRepository = new InMemoryCustomerPriceAgreementRepository(store)
  const exchangeRateResolver = new FixedExchangeRateResolver([
    {
      tenantId: 'tenant-1',
      fromCurrencyCode: 'USD',
      toCurrencyCode: 'CNY',
      exchangeRateValue: '7.200000',
      financeRateRef: 'finance-rate-usd-cny',
      effectiveAt: '2026-04-28T00:00:00.000Z'
    }
  ])

  return {
    createQuote: new CreateQuoteHandler(quoteRepository),
    publishQuote: new PublishQuoteHandler(quoteRepository, quoteVersionRepository),
    convertQuoteVersionToOrder: new ConvertQuoteVersionToOrderHandler(
      quoteVersionRepository,
      salesOrderRepository
    ),
    createPriceList: new CreatePriceListHandler(priceListRepository),
    replacePriceListLines: new ReplacePriceListLinesHandler(priceListRepository),
    changePriceListStatus: new ChangePriceListStatusHandler(priceListRepository),
    createAgreement: new CreateCustomerPriceAgreementHandler(agreementRepository),
    updateAgreementDraft: new UpdateCustomerPriceAgreementDraftHandler(agreementRepository),
    publishAgreement: new PublishCustomerPriceAgreementVersionHandler(agreementRepository),
    getActiveAgreement: new GetActiveCustomerPriceAgreementHandler(agreementRepository),
    getAgreement: new GetCustomerPriceAgreementHandler(agreementRepository),
    previewPricing: new PreviewQuoteLinePricingHandler(
      agreementRepository,
      priceListRepository,
      exchangeRateResolver
    ),
    quoteVersionRepository,
    salesOrderRepository
  }
}

describe('sales-service pricing behavior L1', () => {
  it('PreviewQuoteLinePricing / when agreement and price list both match / should prefer the active agreement baseline', async () => {
    const harness = createHarness()
    const priceList = await harness.createPriceList.execute(
      new CreatePriceListCommand({
        tenantId: 'tenant-1',
        priceListName: 'Spring Fair USD',
        priceListType: 'EXHIBITION',
        currencyCode: 'USD',
        effectiveFrom: '2026-04-01T00:00:00.000Z',
        effectiveTo: '2026-05-31T23:59:59.000Z',
        initialLines: [
          {
            itemId: 'item-1',
            brandKey: 'brand-a',
            unitPriceAmount: '95.00',
            moqQuantity: '50',
            quantityUomCode: 'PCS'
          }
        ]
      })
    )
    await harness.changePriceListStatus.execute(
      new ChangePriceListStatusCommand({
        tenantId: 'tenant-1',
        priceListId: priceList.id,
        targetStatus: 'ACTIVE'
      })
    )
    const agreementDraft = await harness.createAgreement.execute(
      new CreateCustomerPriceAgreementCommand({
        tenantId: 'tenant-1',
        customerTenantPartyId: 'party-1',
        currencyCode: 'USD',
        initialLines: [
          {
            itemId: 'item-1',
            brandKey: 'brand-a',
            unitPriceAmount: '90.00',
            moqQuantity: '30',
            quantityUomCode: 'PCS'
          }
        ]
      })
    )
    await harness.publishAgreement.execute(
      new PublishCustomerPriceAgreementVersionCommand({
        tenantId: 'tenant-1',
        customerPriceAgreementId: agreementDraft.customerPriceAgreementId
      })
    )

    const preview = await harness.previewPricing.execute(
      new PreviewQuoteLinePricingQuery({
        tenantId: 'tenant-1',
        customerTenantPartyId: 'party-1',
        itemId: 'item-1',
        brandKey: 'brand-a',
        currencyCode: 'USD',
        requestedQuantity: '40',
        quantityUomCode: 'PCS',
        selectedPriceListId: priceList.id,
        pricingAt: '2026-04-28T08:00:00.000Z',
        exchangeRateTargetCurrencyCode: 'CNY'
      })
    )

    expect(preview.priceSnapshot.sourceType).toBe('CUSTOMER_PRICE_AGREEMENT')
    expect(preview.priceSnapshot.unitPriceAmount).toBe('90.00')
    expect(preview.moqSnapshot.sourceType).toBe('CUSTOMER_PRICE_AGREEMENT')
    expect(preview.moqSnapshot.moqQuantity).toBe('30')
    expect(preview.exchangeRateSnapshot.exchangeRateValue).toBe('7.200000')
    expect(preview.exceptionPlaceholders).toEqual([])
  })

  it('PreviewQuoteLinePricing / when manual override is below baseline and requested quantity is below MOQ / should emit low-price and low-moq placeholders', async () => {
    const harness = createHarness()
    const agreementDraft = await harness.createAgreement.execute(
      new CreateCustomerPriceAgreementCommand({
        tenantId: 'tenant-1',
        customerTenantPartyId: 'party-1',
        currencyCode: 'USD',
        initialLines: [
          {
            itemId: 'item-2',
            brandKey: '',
            unitPriceAmount: '100.00',
            moqQuantity: '100',
            quantityUomCode: 'PCS'
          }
        ]
      })
    )
    await harness.publishAgreement.execute(
      new PublishCustomerPriceAgreementVersionCommand({
        tenantId: 'tenant-1',
        customerPriceAgreementId: agreementDraft.customerPriceAgreementId
      })
    )

    const preview = await harness.previewPricing.execute(
      new PreviewQuoteLinePricingQuery({
        tenantId: 'tenant-1',
        customerTenantPartyId: 'party-1',
        itemId: 'item-2',
        brandKey: '',
        currencyCode: 'USD',
        requestedQuantity: '40',
        quantityUomCode: 'PCS',
        manualUnitPriceAmount: '88.00'
      })
    )

    expect(preview.priceSnapshot.sourceType).toBe('MANUAL')
    expect(preview.priceSnapshot.unitPriceAmount).toBe('88.00')
    expect(preview.moqSnapshot.moqQuantity).toBe('100')
    expect(preview.exceptionPlaceholders.map((item) => item.exceptionType)).toEqual([
      'LOW_PRICE',
      'LOW_MOQ'
    ])
  })

  it('CustomerPriceAgreement versioning / when active exists and draft is updated / should fork the next draft version instead of mutating active', async () => {
    const harness = createHarness()
    const initialDraft = await harness.createAgreement.execute(
      new CreateCustomerPriceAgreementCommand({
        tenantId: 'tenant-1',
        customerTenantPartyId: 'party-1',
        currencyCode: 'USD',
        initialLines: [
          {
            itemId: 'item-3',
            brandKey: '',
            unitPriceAmount: '110.00',
            moqQuantity: '10',
            quantityUomCode: 'PCS'
          }
        ]
      })
    )

    const activeV1 = await harness.publishAgreement.execute(
      new PublishCustomerPriceAgreementVersionCommand({
        tenantId: 'tenant-1',
        customerPriceAgreementId: initialDraft.customerPriceAgreementId
      })
    )

    const draftV2 = await harness.updateAgreementDraft.execute(
      new UpdateCustomerPriceAgreementDraftCommand({
        tenantId: 'tenant-1',
        customerPriceAgreementId: initialDraft.customerPriceAgreementId,
        draftMutation: {
          upserts: [
            {
              itemId: 'item-3',
              brandKey: '',
              unitPriceAmount: '108.00',
              moqQuantity: '20',
              quantityUomCode: 'PCS'
            }
          ],
          removals: []
        }
      })
    )

    const activeStillV1 = await harness.getActiveAgreement.execute(
      new GetActiveCustomerPriceAgreementQuery({
        tenantId: 'tenant-1',
        customerTenantPartyId: 'party-1',
        currencyCode: 'USD'
      })
    )
    const currentHead = await harness.getAgreement.execute(
      new GetCustomerPriceAgreementQuery({
        tenantId: 'tenant-1',
        customerPriceAgreementId: initialDraft.customerPriceAgreementId
      })
    )

    expect(activeV1.versionNo).toBe(1)
    expect(activeStillV1.versionNo).toBe(1)
    expect(activeStillV1.lines[0].priceSnapshot.unitPriceAmount).toBe('110.00')
    expect(draftV2.versionNo).toBe(2)
    expect(draftV2.status).toBe('DRAFT')
    expect(currentHead.versionNo).toBe(2)
    expect(currentHead.lines[0].priceSnapshot.unitPriceAmount).toBe('108.00')
  })

  it('Quote publish and order convert / when pricing snapshots are already frozen on the quote line / should copy the exact pricing subtree into version and order lines without re-resolution', async () => {
    const harness = createHarness()
    const created = await harness.createQuote.execute(
      new CreateQuoteCommand({
        tenantId: 'tenant-1',
        customerTenantPartyId: 'party-1',
        draftLines: [buildPricingLineInput()]
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
        quoteVersionId: published.quoteVersion.id
      })
    )

    expect(published.quoteVersion.lines[0].priceQuantityDeliverySnapshot.priceSnapshot).toEqual(
      created.lines[0].priceQuantityDeliverySnapshot.priceSnapshot
    )
    expect(published.quoteVersion.lines[0].priceQuantityDeliverySnapshot.moqSnapshot).toEqual(
      created.lines[0].priceQuantityDeliverySnapshot.moqSnapshot
    )
    expect(order.lines[0].priceQuantityDeliverySnapshot.exchangeRateSnapshot).toEqual(
      published.quoteVersion.lines[0].priceQuantityDeliverySnapshot.exchangeRateSnapshot
    )
    expect(order.lines[0].priceQuantityDeliverySnapshot.exceptionPlaceholders).toEqual(
      published.quoteVersion.lines[0].priceQuantityDeliverySnapshot.exceptionPlaceholders
    )
  })

  it('PreviewQuoteLinePricing / when no price baseline can produce a MOQ snapshot / should reject with FAILED_PRECONDITION', async () => {
    const harness = createHarness()

    await expect(
      harness.previewPricing.execute(
        new PreviewQuoteLinePricingQuery({
          tenantId: 'tenant-1',
          customerTenantPartyId: 'party-1',
          itemId: 'item-missing',
          brandKey: '',
          currencyCode: 'USD',
          requestedQuantity: '5',
          quantityUomCode: 'PCS'
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.FAILED_PRECONDITION
      }
    })
  })
})
