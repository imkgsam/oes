import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { PrismaInventoryRepository } from '../../src/infrastructure/repositories/prisma/prisma-inventory.repository'
import { PrismaReceiptRepository } from '../../src/infrastructure/repositories/prisma/prisma-receipt.repository'
import { PrismaWarehouseRepository } from '../../src/infrastructure/repositories/prisma/prisma-warehouse.repository'
import {
  InventoryStatus,
  LocationScope,
  LocationStatus,
  LocationType,
  ReceiptSourceType,
  ReceiptStatus,
  RestrictedStatusReasonCode,
  StockLedgerDirection,
  StockLedgerEntryType,
  StockLedgerSourceDocumentType,
  WarehouseScope,
  WarehouseStatus
} from '../../src/domain/models/wms-records'
import { cleanupByPrefix, createPrismaForIntegration, createTestPrefix } from '../helpers/integration-db'

describe('Prisma WMS repositories Integration', () => {
  let prisma: PrismaService
  let warehouseRepository: PrismaWarehouseRepository
  let receiptRepository: PrismaReceiptRepository
  let inventoryRepository: PrismaInventoryRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    warehouseRepository = new PrismaWarehouseRepository(prisma)
    receiptRepository = new PrismaReceiptRepository(prisma)
    inventoryRepository = new PrismaInventoryRepository(prisma)
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

  it('repositories / should round-trip warehouse receipt ledger and balance records while keeping balance derived from ledger entries', async () => {
    const tenantId = `${prefix}_tenant`
    await prisma.warehouse.create({
      data: {
        id: `${prefix}_wh`,
        tenantId,
        orgId: `${prefix}_org`,
        warehouseCode: `${prefix}_WH`,
        warehouseName: 'Phase 1 Warehouse',
        warehouseScope: 'INTERNAL',
        status: 'ACTIVE',
        defaultReceivingLocationId: `${prefix}_loc`,
        createdAt: new Date('2026-04-29T09:00:00.000Z'),
        updatedAt: new Date('2026-04-29T09:00:00.000Z')
      }
    })
    await prisma.location.create({
      data: {
        id: `${prefix}_loc`,
        tenantId,
        warehouseId: `${prefix}_wh`,
        locationCode: `${prefix}_STK`,
        locationName: 'Primary Storage',
        locationScope: 'INTERNAL',
        locationType: 'STORAGE',
        status: 'ACTIVE',
        supportsReceipt: true,
        supportsStorage: true,
        createdAt: new Date('2026-04-29T09:00:00.000Z'),
        updatedAt: new Date('2026-04-29T09:00:00.000Z')
      }
    })

    const receipt = await receiptRepository.save({
      receiptId: crypto.randomUUID(),
      receiptNo: `${prefix}-RC-0001`,
      tenantId,
      orgId: `${prefix}_org`,
      warehouseId: `${prefix}_wh`,
      status: ReceiptStatus.POSTED,
      receiptSourceType: ReceiptSourceType.RECEIVING_EXPECTATION_REFERENCE,
      referencedReceivingExpectationIds: [`${prefix}_exp`],
      receiptDate: '2026-04-29',
      note: 'posted in Integration',
      attachmentRefs: ['attachment-1'],
      lineCount: 2,
      postedAt: '2026-04-29T10:00:00.000Z',
      cancelledAt: null,
      cancelReason: null,
      postComment: 'posted',
      procurementReceiptSummary: {
        referencedReceivingExpectationIds: [`${prefix}_exp`],
        totalConfirmedQuantity: '10',
        restrictedQuantity: '2',
        discrepancyLines: [
          {
            receiptLineId: 'line-2',
            discrepancyType: 'DAMAGED',
            discrepancyQuantity: '2'
          }
        ],
        recordedAt: '2026-04-29T10:00:00.000Z'
      },
      createdAt: '2026-04-29T09:30:00.000Z',
      updatedAt: '2026-04-29T10:00:00.000Z',
      lines: [
        {
          receiptLineId: 'line-1',
          receiptId: '',
          lineNo: 1,
          itemId: `${prefix}_item`,
          itemCode: 'RM-001',
          itemName: 'Resin',
          receivingExpectationId: `${prefix}_exp`,
          targetLocationId: `${prefix}_loc`,
          confirmedQuantity: '8',
          uom: 'KG',
          inventoryStatus: InventoryStatus.AVAILABLE,
          restrictedReason: null,
          trackingRefs: [],
          physicalDiscrepancy: null,
          evidenceAttachmentRefs: [],
          postedStockLedgerEntryIds: ['ledger-1'],
          createdAt: '2026-04-29T09:40:00.000Z',
          updatedAt: '2026-04-29T10:00:00.000Z'
        },
        {
          receiptLineId: 'line-2',
          receiptId: '',
          lineNo: 2,
          itemId: `${prefix}_item`,
          itemCode: 'RM-001',
          itemName: 'Resin',
          receivingExpectationId: `${prefix}_exp`,
          targetLocationId: `${prefix}_loc`,
          confirmedQuantity: '2',
          uom: 'KG',
          inventoryStatus: InventoryStatus.RESTRICTED,
          restrictedReason: {
            reasonCode: RestrictedStatusReasonCode.DAMAGED,
            reasonNote: 'damaged'
          },
          trackingRefs: [],
          physicalDiscrepancy: {
            discrepancyType: 'DAMAGED',
            discrepancyQuantity: '2',
            note: 'damaged'
          },
          evidenceAttachmentRefs: [],
          postedStockLedgerEntryIds: ['ledger-2'],
          createdAt: '2026-04-29T09:41:00.000Z',
          updatedAt: '2026-04-29T10:00:00.000Z'
        }
      ]
    })

    await inventoryRepository.applyLedgerEntries([
      {
        stockLedgerEntryId: 'ledger-1',
        tenantId,
        orgId: `${prefix}_org`,
        entryType: StockLedgerEntryType.RECEIPT_POSTED,
        direction: StockLedgerDirection.IN,
        warehouseId: `${prefix}_wh`,
        locationId: `${prefix}_loc`,
        itemId: `${prefix}_item`,
        itemCode: 'RM-001',
        itemName: 'Resin',
        quantityDelta: '8',
        uom: 'KG',
        inventoryStatus: InventoryStatus.AVAILABLE,
        restrictedReason: null,
        sourceDocumentType: StockLedgerSourceDocumentType.RECEIPT,
        sourceDocumentId: receipt.receiptId,
        sourceDocumentLineId: 'line-1',
        receivingExpectationId: `${prefix}_exp`,
        trackingRefs: [],
        postedAt: '2026-04-29T10:00:00.000Z'
      },
      {
        stockLedgerEntryId: 'ledger-2',
        tenantId,
        orgId: `${prefix}_org`,
        entryType: StockLedgerEntryType.RECEIPT_POSTED,
        direction: StockLedgerDirection.IN,
        warehouseId: `${prefix}_wh`,
        locationId: `${prefix}_loc`,
        itemId: `${prefix}_item`,
        itemCode: 'RM-001',
        itemName: 'Resin',
        quantityDelta: '2',
        uom: 'KG',
        inventoryStatus: InventoryStatus.RESTRICTED,
        restrictedReason: {
          reasonCode: RestrictedStatusReasonCode.DAMAGED,
          reasonNote: 'damaged'
        },
        sourceDocumentType: StockLedgerSourceDocumentType.RECEIPT,
        sourceDocumentId: receipt.receiptId,
        sourceDocumentLineId: 'line-2',
        receivingExpectationId: `${prefix}_exp`,
        trackingRefs: [],
        postedAt: '2026-04-29T10:00:00.000Z'
      }
    ])

    const warehouse = await warehouseRepository.findWarehouseById(tenantId, `${prefix}_wh`)
    const location = await warehouseRepository.findLocationById(tenantId, `${prefix}_loc`)
    const foundReceipt = await receiptRepository.findById(tenantId, receipt.receiptId)
    const line = await receiptRepository.findLineById(tenantId, 'line-2')
    const ledgerPage = await inventoryRepository.searchStockLedgerEntries({
      tenantId,
      receiptId: receipt.receiptId,
      page: 1,
      pageSize: 20
    })
    const warehouseBalance = await inventoryRepository.getInventoryBalance({
      tenantId,
      warehouseId: `${prefix}_wh`,
      itemId: `${prefix}_item`
    })
    const locationBalance = await inventoryRepository.getInventoryBalance({
      tenantId,
      warehouseId: `${prefix}_wh`,
      locationId: `${prefix}_loc`,
      itemId: `${prefix}_item`
    })
    const balancePage = await inventoryRepository.searchInventoryBalances({
      tenantId,
      warehouseId: `${prefix}_wh`,
      page: 1,
      pageSize: 20
    })

    expect(warehouse).toMatchObject({
      warehouseScope: WarehouseScope.INTERNAL,
      status: WarehouseStatus.ACTIVE
    })
    expect(location).toMatchObject({
      locationScope: LocationScope.INTERNAL,
      locationType: LocationType.STORAGE,
      status: LocationStatus.ACTIVE
    })
    expect(foundReceipt?.status).toBe(ReceiptStatus.POSTED)
    expect(foundReceipt?.lines).toHaveLength(2)
    expect(line?.restrictedReason?.reasonCode).toBe(RestrictedStatusReasonCode.DAMAGED)
    expect(ledgerPage.total).toBe(2)
    expect(warehouseBalance).toMatchObject({
      onHandQuantity: '10',
      availableQuantity: '8',
      restrictedQuantity: '2'
    })
    expect(locationBalance).toMatchObject({
      onHandQuantity: '10',
      availableQuantity: '8',
      restrictedQuantity: '2'
    })
    expect(balancePage.total).toBe(2)
  })
})
