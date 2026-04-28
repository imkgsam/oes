import { randomUUID } from 'node:crypto'
import { PrismaQuoteRepository } from '../../src/infrastructure/repositories/prisma/prisma-quote.repository'
import { PrismaQuoteVersionRepository } from '../../src/infrastructure/repositories/prisma/prisma-quote-version.repository'
import { PrismaSalesOrderRepository } from '../../src/infrastructure/repositories/prisma/prisma-sales-order.repository'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import {
  QuoteLineRecord,
  QuoteRecord,
  QuoteVersionRecord,
  SalesFulfillmentHandoffStatus,
  SalesOrderRecord,
  SalesQuoteStatus
} from '../../src/domain/models/sales-records'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'

/** buildQuoteLine creates one stable phase 1 quote line payload for repository L2 tests. */
function buildQuoteLine(tenantPrefix: string, lineNo: number): QuoteLineRecord {
  return {
    quoteLineId: randomUUID(),
    lineNo,
    itemId: `${tenantPrefix}_item_${lineNo}`,
    itemSnapshot: {
      itemCode: `${tenantPrefix}_ITEM_${lineNo}`,
      itemName: `${tenantPrefix}_Item ${lineNo}`
    },
    salesConfigSnapshot: {
      salesUom: 'PCS',
      salesUnitLabel: 'piece',
      notes: `${tenantPrefix}_sales_notes_${lineNo}`
    },
    packagingRequirementSnapshot: {
      packageMode: 'CARTON',
      packageLabel: `${tenantPrefix}_carton_${lineNo}`,
      specialInstructions: `${tenantPrefix}_special_${lineNo}`
    },
    priceQuantityDeliverySnapshot: {
      currencyCode: 'USD',
      unitPrice: `${100 + lineNo}.00`,
      quantity: `${10 + lineNo}`,
      deliveryTerm: 'FOB SHANGHAI',
      requestedDeliveryDate: `2026-05-${String(lineNo).padStart(2, '0')}`
    },
    customerItemSnapshot: {
      customerSku: `${tenantPrefix}_sku_${lineNo}`,
      customerModel: `${tenantPrefix}_model_${lineNo}`,
      customerDisplayName: `${tenantPrefix}_display_${lineNo}`
    }
  }
}

/** buildQuoteRecord creates one quote aggregate record for Prisma repository round-trip tests. */
function buildQuoteRecord(input: {
  tenantId: string
  quoteNo: string
  status?: SalesQuoteStatus
  latestPublishedVersionId?: string | null
  lineCount?: number
}): QuoteRecord {
  return {
    id: randomUUID(),
    quoteNo: input.quoteNo,
    tenantId: input.tenantId,
    customerTenantPartyId: `${input.tenantId}_customer`,
    opportunityRef: {
      opportunityId: `${input.tenantId}_opp`,
      opportunityNo: `${input.tenantId}_OPP`,
      opportunityName: `${input.tenantId}_Opportunity`
    },
    status: input.status ?? SalesQuoteStatus.DRAFT,
    latestPublishedVersionId: input.latestPublishedVersionId ?? null,
    lines: Array.from({ length: input.lineCount ?? 1 }, (_, index) =>
      buildQuoteLine(input.tenantId, index + 1)
    )
  }
}

/** buildQuoteVersionRecord creates one immutable published version record for Prisma history tests. */
function buildQuoteVersionRecord(input: {
  tenantId: string
  quoteId: string
  quoteNo: string
  versionNo: number
  lineCount?: number
}): QuoteVersionRecord {
  return {
    id: randomUUID(),
    quoteId: input.quoteId,
    quoteNo: input.quoteNo,
    versionNo: input.versionNo,
    tenantId: input.tenantId,
    customerTenantPartyId: `${input.tenantId}_customer`,
    publishedAt: `2026-04-${String(20 + input.versionNo).padStart(2, '0')}T00:00:00.000Z`,
    lines: Array.from({ length: input.lineCount ?? 1 }, (_, index) =>
      buildQuoteLine(input.tenantId, index + 1)
    )
  }
}

/** buildSalesOrderRecord creates one established sales order record with gate and handoff snapshots. */
function buildSalesOrderRecord(input: {
  tenantId: string
  salesOrderNo: string
  quoteId: string
  quoteVersionId: string
  lineCount?: number
}): SalesOrderRecord {
  return {
    id: randomUUID(),
    salesOrderNo: input.salesOrderNo,
    tenantId: input.tenantId,
    customerTenantPartyId: `${input.tenantId}_customer`,
    quoteId: input.quoteId,
    quoteVersionId: input.quoteVersionId,
    commercialGateSummary: {
      orderEstablished: true,
      productionGate: true,
      stockingGate: false,
      shippingGate: false
    },
    fulfillmentHandoffStatus: {
      status: SalesFulfillmentHandoffStatus.SUBMITTED,
      submittedAt: '2026-04-26T00:00:00.000Z'
    },
    lines: Array.from({ length: input.lineCount ?? 1 }, (_, index) => {
      const quoteLine = buildQuoteLine(input.tenantId, index + 1)
      return {
        salesOrderLineId: randomUUID(),
        lineNo: quoteLine.lineNo,
        itemId: quoteLine.itemId,
        itemSnapshot: quoteLine.itemSnapshot,
        salesConfigSnapshot: quoteLine.salesConfigSnapshot,
        packagingRequirementSnapshot: quoteLine.packagingRequirementSnapshot,
        priceQuantityDeliverySnapshot: quoteLine.priceQuantityDeliverySnapshot,
        customerItemSnapshot: quoteLine.customerItemSnapshot
      }
    })
  }
}

describe('Prisma sales repositories L2', () => {
  let prisma: PrismaService
  let quoteRepository: PrismaQuoteRepository
  let quoteVersionRepository: PrismaQuoteVersionRepository
  let salesOrderRepository: PrismaSalesOrderRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    quoteRepository = new PrismaQuoteRepository(prisma)
    quoteVersionRepository = new PrismaQuoteVersionRepository(prisma)
    salesOrderRepository = new PrismaSalesOrderRepository(prisma)
  })

  beforeEach(async () => {
    prefix = createTestPrefix()
    await cleanupByPrefix(prisma, prefix)
  })

  afterEach(async () => {
    await cleanupByPrefix(prisma, prefix)
  })

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  it('quote repository / when reserving numbers and searching by status / should persist draft payloads and stable numbering', async () => {
    const tenantId = `${prefix}_tenant`

    await expect(quoteRepository.nextQuoteNo(tenantId)).resolves.toBe('SQ-0001')
    await expect(quoteRepository.nextQuoteNo(tenantId)).resolves.toBe('SQ-0002')

    const draftQuote = buildQuoteRecord({
      tenantId,
      quoteNo: 'SQ-0001'
    })
    const publishedQuote = buildQuoteRecord({
      tenantId,
      quoteNo: 'SQ-0002',
      status: SalesQuoteStatus.PUBLISHED,
      latestPublishedVersionId: randomUUID(),
      lineCount: 2
    })

    await quoteRepository.save(draftQuote)
    await quoteRepository.save(publishedQuote)

    const found = await quoteRepository.findById(tenantId, draftQuote.id)
    const search = await quoteRepository.search({
      tenantId,
      status: SalesQuoteStatus.PUBLISHED,
      keyword: 'SQ-0002',
      page: 1,
      pageSize: 20
    })

    expect(found).toEqual(draftQuote)
    expect(search.total).toBe(1)
    expect(search.items).toEqual([publishedQuote])
  })

  it('quote version repository / when saving two versions / should list published history in ascending version order', async () => {
    const tenantId = `${prefix}_tenant`
    const quoteId = randomUUID()

    await expect(quoteVersionRepository.nextVersionNo(tenantId, quoteId)).resolves.toBe(1)

    const version2 = buildQuoteVersionRecord({
      tenantId,
      quoteId,
      quoteNo: 'SQ-0007',
      versionNo: 2
    })
    const version1 = buildQuoteVersionRecord({
      tenantId,
      quoteId,
      quoteNo: 'SQ-0007',
      versionNo: 1,
      lineCount: 2
    })

    await quoteVersionRepository.save(version2)
    await quoteVersionRepository.save(version1)

    const listed = await quoteVersionRepository.listByQuoteId({
      tenantId,
      quoteId,
      page: 1,
      pageSize: 20
    })

    expect(listed.total).toBe(2)
    expect(listed.items.map((item) => item.versionNo)).toEqual([1, 2])
    expect(listed.items[0]).toEqual(version1)
    await expect(quoteVersionRepository.nextVersionNo(tenantId, quoteId)).resolves.toBe(3)
  })

  it('sales order repository / when saving one established order / should support id, quote-version, and gate-filter reads', async () => {
    const tenantId = `${prefix}_tenant`
    const order = buildSalesOrderRecord({
      tenantId,
      salesOrderNo: 'SO-0001',
      quoteId: randomUUID(),
      quoteVersionId: randomUUID(),
      lineCount: 2
    })

    await expect(salesOrderRepository.nextSalesOrderNo(tenantId)).resolves.toBe('SO-0001')
    await salesOrderRepository.save(order)

    const foundById = await salesOrderRepository.findById(tenantId, order.id)
    const foundByVersion = await salesOrderRepository.findByQuoteVersionId(tenantId, order.quoteVersionId)
    const search = await salesOrderRepository.search({
      tenantId,
      quoteVersionId: order.quoteVersionId,
      productionGate: true,
      shippingGate: false,
      page: 1,
      pageSize: 20
    })

    expect(foundById).toEqual(order)
    expect(foundByVersion).toEqual(order)
    expect(search.total).toBe(1)
    expect(search.items).toEqual([order])
  })
})
