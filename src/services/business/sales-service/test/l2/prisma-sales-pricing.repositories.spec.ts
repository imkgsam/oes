import { randomUUID } from 'node:crypto'
import { PrismaPriceListRepository } from '../../src/infrastructure/repositories/prisma/prisma-price-list.repository'
import { PrismaCustomerPriceAgreementRepository } from '../../src/infrastructure/repositories/prisma/prisma-customer-price-agreement.repository'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'

describe('Prisma sales pricing repositories L2', () => {
  let prisma: PrismaService
  let priceListRepository: PrismaPriceListRepository
  let agreementRepository: PrismaCustomerPriceAgreementRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    priceListRepository = new PrismaPriceListRepository(prisma)
    agreementRepository = new PrismaCustomerPriceAgreementRepository(prisma)
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

  it('price list repository / when saving tiered and brand-scoped rows / should support header search and filtered line reads', async () => {
    const tenantId = `${prefix}_tenant`
    const priceListId = randomUUID()

    await priceListRepository.save({
      id: priceListId,
      tenantId,
      priceListName: `${prefix}_USD_STANDARD`,
      priceListType: 'STANDARD',
      status: 'ACTIVE',
      currencyCode: 'USD',
      effectiveFrom: '2026-04-01T00:00:00.000Z',
      effectiveTo: '2026-12-31T23:59:59.000Z',
      lines: [
        {
          priceListLineId: randomUUID(),
          lineNo: 1,
          itemId: `${tenantId}_item_1`,
          brandKey: '',
          priceSnapshot: {
            currencyCode: 'USD',
            unitPriceAmount: '100.00',
            sourceType: 'PRICE_LIST',
            sourceRefId: priceListId,
            sourceLineRefId: 'line-1',
            sourceVersionNo: 0,
            resolvedAt: '2026-04-28T00:00:00.000Z'
          },
          moqSnapshot: {
            moqQuantity: '10',
            quantityUomCode: 'PCS',
            sourceType: 'PRICE_LIST',
            sourceRefId: priceListId,
            sourceLineRefId: 'line-1',
            sourceVersionNo: 0,
            resolvedAt: '2026-04-28T00:00:00.000Z'
          }
        },
        {
          priceListLineId: randomUUID(),
          lineNo: 2,
          itemId: `${tenantId}_item_1`,
          brandKey: 'brand-a',
          priceSnapshot: {
            currencyCode: 'USD',
            unitPriceAmount: '92.00',
            sourceType: 'PRICE_LIST',
            sourceRefId: priceListId,
            sourceLineRefId: 'line-2',
            sourceVersionNo: 0,
            resolvedAt: '2026-04-28T00:00:00.000Z'
          },
          moqSnapshot: {
            moqQuantity: '100',
            quantityUomCode: 'PCS',
            sourceType: 'PRICE_LIST',
            sourceRefId: priceListId,
            sourceLineRefId: 'line-2',
            sourceVersionNo: 0,
            resolvedAt: '2026-04-28T00:00:00.000Z'
          }
        }
      ]
    })

    const found = await priceListRepository.findById(tenantId, priceListId)
    const search = await priceListRepository.search({
      tenantId,
      keyword: `${prefix}_USD`,
      status: 'ACTIVE',
      currencyCode: 'USD',
      effectiveAt: '2026-04-28T00:00:00.000Z',
      page: 1,
      pageSize: 20
    })
    const lines = await priceListRepository.listLines({
      tenantId,
      priceListId,
      itemId: `${tenantId}_item_1`,
      page: 1,
      pageSize: 20
    })

    expect(found?.lines).toHaveLength(2)
    expect(search.total).toBe(1)
    expect(lines.total).toBe(2)
    expect(lines.items.map((line) => line.brandKey)).toEqual(['', 'brand-a'])
  })

  it('customer agreement repository / when active and draft versions coexist / should return active lookup, head lookup, and ordered version history', async () => {
    const tenantId = `${prefix}_tenant`
    const agreementId = randomUUID()

    await agreementRepository.saveVersion({
      id: randomUUID(),
      customerPriceAgreementId: agreementId,
      tenantId,
      customerTenantPartyId: `${tenantId}_customer`,
      currencyCode: 'USD',
      versionNo: 1,
      status: 'ACTIVE',
      publishedAt: '2026-04-20T00:00:00.000Z',
      lines: [
        {
          customerPriceAgreementLineId: randomUUID(),
          lineNo: 1,
          itemId: `${tenantId}_item_1`,
          brandKey: '',
          priceSnapshot: {
            currencyCode: 'USD',
            unitPriceAmount: '98.00',
            sourceType: 'CUSTOMER_PRICE_AGREEMENT',
            sourceRefId: agreementId,
            sourceLineRefId: 'agreement-line-1',
            sourceVersionNo: 1,
            resolvedAt: '2026-04-20T00:00:00.000Z'
          },
          moqSnapshot: {
            moqQuantity: '20',
            quantityUomCode: 'PCS',
            sourceType: 'CUSTOMER_PRICE_AGREEMENT',
            sourceRefId: agreementId,
            sourceLineRefId: 'agreement-line-1',
            sourceVersionNo: 1,
            resolvedAt: '2026-04-20T00:00:00.000Z'
          }
        }
      ]
    })

    await agreementRepository.saveVersion({
      id: randomUUID(),
      customerPriceAgreementId: agreementId,
      tenantId,
      customerTenantPartyId: `${tenantId}_customer`,
      currencyCode: 'USD',
      versionNo: 2,
      status: 'DRAFT',
      publishedAt: null,
      lines: [
        {
          customerPriceAgreementLineId: randomUUID(),
          lineNo: 1,
          itemId: `${tenantId}_item_1`,
          brandKey: 'brand-a',
          priceSnapshot: {
            currencyCode: 'USD',
            unitPriceAmount: '95.00',
            sourceType: 'CUSTOMER_PRICE_AGREEMENT',
            sourceRefId: agreementId,
            sourceLineRefId: 'agreement-line-2',
            sourceVersionNo: 2,
            resolvedAt: '2026-04-28T00:00:00.000Z'
          },
          moqSnapshot: {
            moqQuantity: '50',
            quantityUomCode: 'PCS',
            sourceType: 'CUSTOMER_PRICE_AGREEMENT',
            sourceRefId: agreementId,
            sourceLineRefId: 'agreement-line-2',
            sourceVersionNo: 2,
            resolvedAt: '2026-04-28T00:00:00.000Z'
          }
        }
      ]
    })

    const active = await agreementRepository.findActiveByCustomerCurrency({
      tenantId,
      customerTenantPartyId: `${tenantId}_customer`,
      currencyCode: 'USD'
    })
    const head = await agreementRepository.findHeadVersion(tenantId, agreementId)
    const versions = await agreementRepository.listVersions({
      tenantId,
      customerPriceAgreementId: agreementId,
      page: 1,
      pageSize: 20
    })

    expect(active?.versionNo).toBe(1)
    expect(head?.versionNo).toBe(2)
    expect(versions.total).toBe(2)
    expect(versions.items.map((item) => item.versionNo)).toEqual([1, 2])
  })
})
