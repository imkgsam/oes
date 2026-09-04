import { status } from '@grpc/grpc-js'
import { AddOrReplaceReceiptLinesCommand } from '../application/commands/add-or-replace-receipt-lines.command'
import { AddOrReplaceReceiptLinesHandler } from '../application/commands/add-or-replace-receipt-lines.handler'
import { CancelReceiptDraftCommand } from '../application/commands/cancel-receipt-draft.command'
import { CancelReceiptDraftHandler } from '../application/commands/cancel-receipt-draft.handler'
import { CreateReceiptDraftCommand } from '../application/commands/create-receipt-draft.command'
import { CreateReceiptDraftHandler } from '../application/commands/create-receipt-draft.handler'
import { PostReceiptCommand } from '../application/commands/post-receipt.command'
import { PostReceiptHandler } from '../application/commands/post-receipt.handler'
import { ReceivingExpectationLookupPort, ReceivingExpectationLookupResult } from '../application/ports/receiving-expectation-lookup.port'
import { StockableItemLookupPort, StockableItemLookupResult } from '../application/ports/stockable-item-lookup.port'
import { GetInventoryBalanceHandler } from '../application/queries/get-inventory-balance.handler'
import { GetInventoryBalanceQuery } from '../application/queries/get-inventory-balance.query'
import { GetReceiptHandler } from '../application/queries/get-receipt.handler'
import { GetReceiptQuery } from '../application/queries/get-receipt.query'
import { SearchInventoryBalancesHandler } from '../application/queries/search-inventory-balances.handler'
import { SearchInventoryBalancesQuery } from '../application/queries/search-inventory-balances.query'
import { SearchReceiptLinesHandler } from '../application/queries/search-receipt-lines.handler'
import { SearchReceiptLinesQuery } from '../application/queries/search-receipt-lines.query'
import { SearchReceiptsHandler } from '../application/queries/search-receipts.handler'
import { SearchReceiptsQuery } from '../application/queries/search-receipts.query'
import { SearchStockLedgerEntriesHandler } from '../application/queries/search-stock-ledger-entries.handler'
import { SearchStockLedgerEntriesQuery } from '../application/queries/search-stock-ledger-entries.query'
import {
  InventoryBalanceStatusFilter,
  InventoryStatus,
  LocationScope,
  LocationStatus,
  LocationType,
  ReceiptPhysicalDiscrepancyType,
  ReceiptSourceType,
  ReceiptStatus,
  ReceiptTrackingRefType,
  RestrictedStatusReasonCode,
  WarehouseScope,
  WarehouseStatus
} from '../domain/models/wms-records'
import { InMemoryInventoryRepository } from '../infrastructure/repositories/in-memory/in-memory-inventory.repository'
import { InMemoryReceiptRepository } from '../infrastructure/repositories/in-memory/in-memory-receipt.repository'
import { InMemoryWarehouseRepository } from '../infrastructure/repositories/in-memory/in-memory-warehouse.repository'
import { WmsInMemoryStore } from '../infrastructure/store/wms-in-memory-store'

/** StubStockableItemLookupPort lets Unit drive item-master validation outcomes without reaching another service. */
class StubStockableItemLookupPort implements StockableItemLookupPort {
  private readonly items = new Map<string, StockableItemLookupResult>()

  seed(item: StockableItemLookupResult): void {
    this.items.set(item.itemId, item)
  }

  async getItemById(_tenantId: string, itemId: string): Promise<StockableItemLookupResult | null> {
    return this.items.get(itemId) ?? null
  }
}

/** StubReceivingExpectationLookupPort lets Unit drive procurement expectation visibility without reaching another service. */
class StubReceivingExpectationLookupPort implements ReceivingExpectationLookupPort {
  private readonly expectations = new Map<string, ReceivingExpectationLookupResult>()

  seed(expectation: ReceivingExpectationLookupResult): void {
    this.expectations.set(expectation.receivingExpectationId, expectation)
  }

  async getReceivingExpectationById(
    _tenantId: string,
    receivingExpectationId: string
  ): Promise<ReceivingExpectationLookupResult | null> {
    return this.expectations.get(receivingExpectationId) ?? null
  }
}

function createHarness() {
  const store = new WmsInMemoryStore()
  const warehouseRepository = new InMemoryWarehouseRepository(store)
  const receiptRepository = new InMemoryReceiptRepository(store)
  const inventoryRepository = new InMemoryInventoryRepository(store)
  const stockableItemLookup = new StubStockableItemLookupPort()
  const receivingExpectationLookup = new StubReceivingExpectationLookupPort()

  return {
    store,
    warehouseRepository,
    receiptRepository,
    inventoryRepository,
    stockableItemLookup,
    receivingExpectationLookup,
    createReceiptDraft: new CreateReceiptDraftHandler(receiptRepository),
    addOrReplaceReceiptLines: new AddOrReplaceReceiptLinesHandler(receiptRepository),
    postReceipt: new PostReceiptHandler(
      receiptRepository,
      warehouseRepository,
      inventoryRepository,
      stockableItemLookup,
      receivingExpectationLookup
    ),
    cancelReceiptDraft: new CancelReceiptDraftHandler(receiptRepository),
    getReceipt: new GetReceiptHandler(receiptRepository),
    searchReceipts: new SearchReceiptsHandler(receiptRepository),
    searchReceiptLines: new SearchReceiptLinesHandler(receiptRepository),
    searchStockLedgerEntries: new SearchStockLedgerEntriesHandler(inventoryRepository),
    getInventoryBalance: new GetInventoryBalanceHandler(inventoryRepository),
    searchInventoryBalances: new SearchInventoryBalancesHandler(inventoryRepository)
  }
}

function seedInternalWarehouse(store: WmsInMemoryStore): void {
  store.warehouses.set('wh-1', {
    warehouseId: 'wh-1',
    warehouseCode: 'WH-A',
    warehouseName: 'Main Internal Warehouse',
    tenantId: 'tenant-1',
    orgId: 'org-1',
    warehouseScope: WarehouseScope.INTERNAL,
    status: WarehouseStatus.ACTIVE,
    defaultReceivingLocationId: 'loc-rec',
    createdAt: '2026-04-29T09:00:00.000Z',
    updatedAt: '2026-04-29T09:00:00.000Z'
  })
  store.locations.set('loc-rec', {
    locationId: 'loc-rec',
    warehouseId: 'wh-1',
    parentLocationId: null,
    locationCode: 'REC-01',
    locationName: 'Receiving Dock',
    locationScope: LocationScope.INTERNAL,
    locationType: LocationType.RECEIVING,
    status: LocationStatus.ACTIVE,
    supportsReceipt: true,
    supportsStorage: false,
    createdAt: '2026-04-29T09:00:00.000Z',
    updatedAt: '2026-04-29T09:00:00.000Z'
  })
  store.locations.set('loc-stock', {
    locationId: 'loc-stock',
    warehouseId: 'wh-1',
    parentLocationId: null,
    locationCode: 'STK-01',
    locationName: 'Primary Storage',
    locationScope: LocationScope.INTERNAL,
    locationType: LocationType.STORAGE,
    status: LocationStatus.ACTIVE,
    supportsReceipt: true,
    supportsStorage: true,
    createdAt: '2026-04-29T09:00:00.000Z',
    updatedAt: '2026-04-29T09:00:00.000Z'
  })
}

describe('wms-service behavior Unit', () => {
  it('Receipt posting flow / should validate expectation-backed lines, append ledger truth, and refresh balances from the ledger projection', async () => {
    const harness = createHarness()
    seedInternalWarehouse(harness.store)
    harness.stockableItemLookup.seed({
      itemId: 'item-1',
      itemCode: 'RM-001',
      itemName: 'Resin',
      active: true,
      stockable: true
    })
    harness.receivingExpectationLookup.seed({
      receivingExpectationId: 'exp-1',
      purchaseOrderId: 'po-1',
      purchaseOrderLineId: 'po-line-1',
      targetWarehouseId: 'wh-1',
      openQuantity: '10',
      status: 'RECEIVING_EXPECTATION_STATUS_OPEN'
    })

    const created = await harness.createReceiptDraft.execute(
      new CreateReceiptDraftCommand({
        tenantId: 'tenant-1',
        orgId: 'org-1',
        warehouseId: 'wh-1',
        receiptSourceType: ReceiptSourceType.RECEIVING_EXPECTATION_REFERENCE,
        referencedReceivingExpectationIds: ['exp-1'],
        note: 'truck received',
        attachmentRefs: ['attachment-1']
      })
    )

    const lined = await harness.addOrReplaceReceiptLines.execute(
      new AddOrReplaceReceiptLinesCommand({
        tenantId: 'tenant-1',
        receiptId: created.receiptId,
        lines: [
          {
            itemId: 'item-1',
            receivingExpectationId: 'exp-1',
            targetLocationId: 'loc-stock',
            confirmedQuantity: '8',
            uom: 'KG',
            inventoryStatus: InventoryStatus.AVAILABLE,
            trackingRefs: [
              {
                trackingRefType: ReceiptTrackingRefType.BOX_CODE,
                trackingRefValue: 'BOX-001'
              }
            ],
            evidenceAttachmentRefs: []
          },
          {
            itemId: 'item-1',
            receivingExpectationId: 'exp-1',
            targetLocationId: 'loc-stock',
            confirmedQuantity: '2',
            uom: 'KG',
            inventoryStatus: InventoryStatus.RESTRICTED,
            restrictedReason: {
              reasonCode: RestrictedStatusReasonCode.DAMAGED,
              reasonNote: 'corner cracked'
            },
            trackingRefs: [],
            physicalDiscrepancy: {
              discrepancyType: ReceiptPhysicalDiscrepancyType.DAMAGED,
              discrepancyQuantity: '2',
              note: 'two bags damaged'
            },
            evidenceAttachmentRefs: ['line-photo-1']
          }
        ]
      })
    )

    const posted = await harness.postReceipt.execute(
      new PostReceiptCommand({
        tenantId: 'tenant-1',
        receiptId: created.receiptId,
        postComment: 'verified and posted'
      })
    )

    const foundReceipt = await harness.getReceipt.execute(
      new GetReceiptQuery('tenant-1', created.receiptId)
    )
    const receiptSearch = await harness.searchReceipts.execute(
      new SearchReceiptsQuery({
        tenantId: 'tenant-1',
        warehouseId: 'wh-1',
        status: ReceiptStatus.POSTED,
        page: 1,
        pageSize: 20
      })
    )
    const lineSearch = await harness.searchReceiptLines.execute(
      new SearchReceiptLinesQuery({
        tenantId: 'tenant-1',
        receiptId: created.receiptId,
        inventoryStatus: InventoryStatus.RESTRICTED,
        page: 1,
        pageSize: 20
      })
    )
    const ledgerSearch = await harness.searchStockLedgerEntries.execute(
      new SearchStockLedgerEntriesQuery({
        tenantId: 'tenant-1',
        receiptId: created.receiptId,
        page: 1,
        pageSize: 20
      })
    )
    const warehouseBalance = await harness.getInventoryBalance.execute(
      new GetInventoryBalanceQuery({
        tenantId: 'tenant-1',
        warehouseId: 'wh-1',
        itemId: 'item-1'
      })
    )
    const storageBalance = await harness.getInventoryBalance.execute(
      new GetInventoryBalanceQuery({
        tenantId: 'tenant-1',
        warehouseId: 'wh-1',
        locationId: 'loc-stock',
        itemId: 'item-1'
      })
    )
    const restrictedBalances = await harness.searchInventoryBalances.execute(
      new SearchInventoryBalancesQuery({
        tenantId: 'tenant-1',
        warehouseId: 'wh-1',
        inventoryStatus: InventoryBalanceStatusFilter.RESTRICTED,
        page: 1,
        pageSize: 20
      })
    )

    expect(created.status).toBe(ReceiptStatus.DRAFT)
    expect(lined.lines).toHaveLength(2)
    expect(posted.status).toBe(ReceiptStatus.POSTED)
    expect(posted.lines.every((line) => line.postedStockLedgerEntryIds.length === 1)).toBe(true)
    expect(posted.procurementReceiptSummary).toMatchObject({
      totalConfirmedQuantity: '10',
      restrictedQuantity: '2'
    })
    expect(foundReceipt.receiptNo).toBe(created.receiptNo)
    expect(receiptSearch.total).toBe(1)
    expect(lineSearch.items).toHaveLength(1)
    expect(lineSearch.items[0].restrictedReason?.reasonCode).toBe(RestrictedStatusReasonCode.DAMAGED)
    expect(ledgerSearch.items).toHaveLength(2)
    expect(warehouseBalance.onHandQuantity).toBe('10')
    expect(warehouseBalance.availableQuantity).toBe('8')
    expect(warehouseBalance.restrictedQuantity).toBe('2')
    expect(storageBalance.onHandQuantity).toBe('10')
    expect(restrictedBalances.total).toBe(2)
  })

  it('Receipt draft cancellation / should cancel draft receipts and reject posted receipt cancellation', async () => {
    const harness = createHarness()
    seedInternalWarehouse(harness.store)
    harness.stockableItemLookup.seed({
      itemId: 'item-1',
      itemCode: 'RM-001',
      itemName: 'Resin',
      active: true,
      stockable: true
    })

    const created = await harness.createReceiptDraft.execute(
      new CreateReceiptDraftCommand({
        tenantId: 'tenant-1',
        warehouseId: 'wh-1',
        receiptSourceType: ReceiptSourceType.MANUAL,
        referencedReceivingExpectationIds: [],
        attachmentRefs: []
      })
    )

    const cancelled = await harness.cancelReceiptDraft.execute(
      new CancelReceiptDraftCommand({
        tenantId: 'tenant-1',
        receiptId: created.receiptId,
        cancelReason: 'operator entered duplicate draft'
      })
    )

    await harness.addOrReplaceReceiptLines.execute(
      new AddOrReplaceReceiptLinesCommand({
        tenantId: 'tenant-1',
        receiptId: created.receiptId,
        lines: []
      })
    ).catch(() => undefined)

    expect(cancelled.status).toBe(ReceiptStatus.CANCELLED)

    const secondDraft = await harness.createReceiptDraft.execute(
      new CreateReceiptDraftCommand({
        tenantId: 'tenant-1',
        warehouseId: 'wh-1',
        receiptSourceType: ReceiptSourceType.MANUAL,
        referencedReceivingExpectationIds: [],
        attachmentRefs: []
      })
    )
    await harness.addOrReplaceReceiptLines.execute(
      new AddOrReplaceReceiptLinesCommand({
        tenantId: 'tenant-1',
        receiptId: secondDraft.receiptId,
        lines: [
          {
            itemId: 'item-1',
            targetLocationId: 'loc-stock',
            confirmedQuantity: '1',
            uom: 'KG',
            inventoryStatus: InventoryStatus.AVAILABLE,
            trackingRefs: [],
            evidenceAttachmentRefs: []
          }
        ]
      })
    )
    await harness.postReceipt.execute(
      new PostReceiptCommand({
        tenantId: 'tenant-1',
        receiptId: secondDraft.receiptId
      })
    )

    await expect(
      harness.cancelReceiptDraft.execute(
        new CancelReceiptDraftCommand({
          tenantId: 'tenant-1',
          receiptId: secondDraft.receiptId,
          cancelReason: 'too late'
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.FAILED_PRECONDITION
      }
    })
  })

  it('Receipt posting / should reject inactive stockable items before creating inventory truth', async () => {
    const harness = createHarness()
    seedInternalWarehouse(harness.store)
    harness.stockableItemLookup.seed({
      itemId: 'item-inactive',
      itemCode: 'RM-INACTIVE',
      itemName: 'Inactive Resin',
      active: false,
      stockable: true
    })

    const created = await harness.createReceiptDraft.execute(
      new CreateReceiptDraftCommand({
        tenantId: 'tenant-1',
        warehouseId: 'wh-1',
        receiptSourceType: ReceiptSourceType.MANUAL,
        referencedReceivingExpectationIds: [],
        note: 'Manual inactive item receipt',
        attachmentRefs: []
      })
    )
    await harness.addOrReplaceReceiptLines.execute(
      new AddOrReplaceReceiptLinesCommand({
        tenantId: 'tenant-1',
        receiptId: created.receiptId,
        lines: [
          {
            itemId: 'item-inactive',
            targetLocationId: 'loc-stock',
            confirmedQuantity: '1',
            uom: 'KG',
            inventoryStatus: InventoryStatus.AVAILABLE,
            trackingRefs: [],
            evidenceAttachmentRefs: []
          }
        ]
      })
    )

    await expect(
      harness.postReceipt.execute(
        new PostReceiptCommand({
          tenantId: 'tenant-1',
          receiptId: created.receiptId
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.FAILED_PRECONDITION
      }
    })
  })
})
