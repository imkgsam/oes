import { ForbiddenException } from '@nestjs/common'
import { WmsService } from './wms.service'

const SAMPLE_RECEIPT = {
  attachmentRefs: [],
  cancelledAt: '',
  createdAt: '2026-04-29T08:00:00.000Z',
  lineCount: 2,
  lines: [
    {
      confirmedQuantity: '8',
      createdAt: '2026-04-29T08:05:00.000Z',
      evidenceAttachmentRefs: [],
      inventoryStatus: 'AVAILABLE',
      itemCode: 'ITEM-001',
      itemId: 'item-1',
      itemName: 'Starter Item',
      lineNo: 1,
      physicalDiscrepancy: {
        discrepancyQuantity: '2',
        discrepancyType: 'SHORT_RECEIVED',
        note: 'supplier shipped fewer units'
      },
      postedStockLedgerEntryIds: [],
      receiptId: 'receipt-1',
      receiptLineId: 'receipt-line-1',
      receivingExpectationId: 'expectation-1',
      restrictedReason: undefined,
      targetLocationId: 'location-1',
      trackingRefs: [],
      uom: 'PCS',
      updatedAt: '2026-04-29T08:05:00.000Z'
    },
    {
      confirmedQuantity: '2',
      createdAt: '2026-04-29T08:05:00.000Z',
      evidenceAttachmentRefs: [],
      inventoryStatus: 'RESTRICTED',
      itemCode: 'ITEM-001',
      itemId: 'item-1',
      itemName: 'Starter Item',
      lineNo: 2,
      physicalDiscrepancy: {
        discrepancyQuantity: '2',
        discrepancyType: 'DAMAGED',
        note: 'outer box collapsed'
      },
      postedStockLedgerEntryIds: [],
      receiptId: 'receipt-1',
      receiptLineId: 'receipt-line-2',
      receivingExpectationId: 'expectation-1',
      restrictedReason: {
        reasonCode: 'DAMAGED',
        reasonNote: 'visual damage'
      },
      targetLocationId: 'location-2',
      trackingRefs: [],
      uom: 'PCS',
      updatedAt: '2026-04-29T08:05:00.000Z'
    }
  ],
  note: 'dock A',
  orgId: 'org-1',
  postedAt: '',
  receiptDate: '2026-04-29',
  receiptId: 'receipt-1',
  receiptNo: 'RCPT-001',
  receiptSourceType: 'MANUAL',
  referencedReceivingExpectationIds: ['expectation-1'],
  status: 'DRAFT',
  tenantId: 'tenant-1',
  updatedAt: '2026-04-29T08:10:00.000Z',
  warehouseId: 'warehouse-1'
}

// Verifies the WMS gateway service keeps tenant scope pinned and maps the frozen phase 1 WMS contract into the BFF shape without widening inventory ownership.
describe('WmsService', () => {
  const wmsQueryAdapter = {
    getInventoryBalance: jest.fn(),
    getLocation: jest.fn(),
    getReceipt: jest.fn(),
    getReceiptLine: jest.fn(),
    getWarehouse: jest.fn(),
    listLocations: jest.fn(),
    listWarehouses: jest.fn(),
    searchInventoryBalances: jest.fn(),
    searchReceiptLines: jest.fn(),
    searchReceipts: jest.fn(),
    searchStockLedgerEntries: jest.fn()
  }
  const wmsManagementAdapter = {
    addOrReplaceReceiptLines: jest.fn(),
    cancelReceiptDraft: jest.fn(),
    createReceiptDraft: jest.fn(),
    postReceipt: jest.fn()
  }

  const service = new WmsService(wmsQueryAdapter as any, wmsManagementAdapter as any)

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('rejects tenant-scoped operators when they request another tenant WMS workspace', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1' }
    }

    await expect(
      service.listWarehouses('tenant-2', { page: 1, pageSize: 20 }, source as any)
    ).rejects.toBeInstanceOf(ForbiddenException)

    expect(wmsQueryAdapter.listWarehouses).not.toHaveBeenCalled()
  })

  it('maps phase 1 warehouse, receipt, and inventory calls without inventing new WMS rules', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', orgId: 'org-1', scopeLevel: 'TENANT', tid: 'tenant-1', typ: 'USER' }
    }

    wmsQueryAdapter.listWarehouses.mockResolvedValue({
      page: 1,
      pageSize: 20,
      total: 1,
      warehouses: [
        {
          defaultReceivingLocationId: 'location-1',
          status: 'ACTIVE',
          warehouseCode: 'WH-001',
          warehouseId: 'warehouse-1',
          warehouseName: 'Main Warehouse',
          warehouseScope: 'INTERNAL'
        }
      ]
    })
    wmsQueryAdapter.listLocations.mockResolvedValue({
      locations: [
        {
          locationCode: 'RCV-A',
          locationId: 'location-1',
          locationName: 'Receiving A',
          locationScope: 'INTERNAL',
          locationType: 'RECEIVING',
          parentLocationId: '',
          status: 'ACTIVE',
          supportsReceipt: true,
          supportsStorage: true,
          warehouseId: 'warehouse-1'
        }
      ],
      page: 1,
      pageSize: 20,
      total: 1
    })
    wmsQueryAdapter.searchReceipts.mockResolvedValue({
      page: 1,
      pageSize: 20,
      receipts: [
        {
          hasPhysicalDiscrepancy: true,
          hasRestrictedLines: true,
          lineCount: 2,
          postedAt: '',
          receiptDate: '2026-04-29',
          receiptId: 'receipt-1',
          receiptNo: 'RCPT-001',
          receiptSourceType: 'MANUAL',
          status: 'DRAFT',
          warehouseId: 'warehouse-1'
        }
      ],
      total: 1
    })
    wmsQueryAdapter.getReceipt.mockResolvedValue({
      receipt: SAMPLE_RECEIPT
    })
    wmsManagementAdapter.createReceiptDraft.mockResolvedValue({
      receipt: SAMPLE_RECEIPT
    })
    wmsManagementAdapter.addOrReplaceReceiptLines.mockResolvedValue({
      receipt: SAMPLE_RECEIPT
    })
    wmsManagementAdapter.postReceipt.mockResolvedValue({
      postedStockLedgerEntryIds: ['ledger-1', 'ledger-2'],
      receipt: {
        ...SAMPLE_RECEIPT,
        postedAt: '2026-04-29T09:00:00.000Z',
        status: 'POSTED'
      }
    })
    wmsManagementAdapter.cancelReceiptDraft.mockResolvedValue({
      receipt: {
        ...SAMPLE_RECEIPT,
        cancelledAt: '2026-04-29T09:15:00.000Z',
        status: 'CANCELLED'
      }
    })
    wmsQueryAdapter.searchStockLedgerEntries.mockResolvedValue({
      entries: [
        {
          entryType: 'RECEIPT_POSTED',
          inventoryStatus: 'RESTRICTED',
          itemId: 'item-1',
          locationId: 'location-2',
          postedAt: '2026-04-29T09:00:00.000Z',
          quantityDelta: '2',
          restrictedReasonCode: 'DAMAGED',
          sourceDocumentId: 'receipt-1',
          stockLedgerEntryId: 'ledger-2',
          uom: 'PCS',
          warehouseId: 'warehouse-1'
        }
      ],
      page: 1,
      pageSize: 20,
      total: 1
    })
    wmsQueryAdapter.getInventoryBalance.mockResolvedValue({
      inventoryBalance: {
        availableQuantity: '8',
        itemCode: 'ITEM-001',
        itemId: 'item-1',
        itemName: 'Starter Item',
        lastLedgerEntryId: 'ledger-2',
        lastPostedAt: '2026-04-29T09:00:00.000Z',
        locationId: 'location-2',
        onHandQuantity: '10',
        orgId: 'org-1',
        restrictedQuantities: [{ quantity: '2', reasonCode: 'DAMAGED' }],
        restrictedQuantity: '2',
        tenantId: 'tenant-1',
        uom: 'PCS',
        updatedAt: '2026-04-29T09:00:01.000Z',
        warehouseId: 'warehouse-1'
      }
    })
    wmsQueryAdapter.searchInventoryBalances.mockResolvedValue({
      inventoryBalances: [
        {
          availableQuantity: '8',
          itemCode: 'ITEM-001',
          itemId: 'item-1',
          itemName: 'Starter Item',
          lastPostedAt: '2026-04-29T09:00:00.000Z',
          locationId: 'location-2',
          onHandQuantity: '10',
          restrictedQuantity: '2',
          uom: 'PCS',
          warehouseId: 'warehouse-1'
        }
      ],
      page: 1,
      pageSize: 20,
      total: 1
    })

    const warehouses = await service.listWarehouses(
      'tenant-1',
      { keyword: 'main', page: 1, pageSize: 20 },
      source as any
    )
    const locations = await service.listLocations(
      'tenant-1',
      { page: 1, pageSize: 20, warehouseId: 'warehouse-1' },
      source as any
    )
    const receipts = await service.searchReceipts(
      'tenant-1',
      { page: 1, pageSize: 20, status: 'DRAFT', warehouseId: 'warehouse-1' },
      source as any
    )
    const receipt = await service.getReceipt('tenant-1', 'receipt-1', source as any)
    const createdReceipt = await service.createReceiptDraft(
      'tenant-1',
      {
        note: 'dock A',
        orgId: 'org-1',
        receiptDate: '2026-04-29',
        receiptSourceType: 'MANUAL',
        warehouseId: 'warehouse-1'
      },
      source as any
    )
    const updatedReceipt = await service.addOrReplaceReceiptLines(
      'tenant-1',
      'receipt-1',
      {
        auditReason: 'edit draft lines from tenant-web',
        lines: [
          {
            confirmedQuantity: '8',
            inventoryStatus: 'AVAILABLE',
            itemId: 'item-1',
            targetLocationId: 'location-1',
            uom: 'PCS'
          },
          {
            confirmedQuantity: '2',
            inventoryStatus: 'RESTRICTED',
            itemId: 'item-1',
            restrictedReason: {
              reasonCode: 'DAMAGED',
              reasonNote: 'visual damage'
            },
            targetLocationId: 'location-2',
            uom: 'PCS'
          }
        ]
      },
      source as any
    )
    const postedReceipt = await service.postReceipt(
      'tenant-1',
      'receipt-1',
      { auditReason: 'post from tenant-web', postComment: 'ready to stock' },
      source as any
    )
    const cancelledReceipt = await service.cancelReceiptDraft(
      'tenant-1',
      'receipt-1',
      { auditReason: 'cancel from tenant-web', cancelReason: 'duplicate draft' },
      source as any
    )
    const entries = await service.searchStockLedgerEntries(
      'tenant-1',
      { page: 1, pageSize: 20, restrictedReasonCode: 'DAMAGED' },
      source as any
    )
    const balance = await service.getInventoryBalance(
      'tenant-1',
      { itemId: 'item-1', locationId: 'location-2', warehouseId: 'warehouse-1' },
      source as any
    )
    const balances = await service.searchInventoryBalances(
      'tenant-1',
      { inventoryStatus: 'RESTRICTED', page: 1, pageSize: 20, warehouseId: 'warehouse-1' },
      source as any
    )

    expect(warehouses.warehouses[0]).toMatchObject({
      status: 'ACTIVE',
      warehouseCode: 'WH-001',
      warehouseId: 'warehouse-1',
      warehouseScope: 'INTERNAL'
    })
    expect(locations.locations[0]).toMatchObject({
      locationId: 'location-1',
      locationType: 'RECEIVING',
      supportsReceipt: true
    })
    expect(receipts.receipts[0]).toMatchObject({
      hasPhysicalDiscrepancy: true,
      hasRestrictedLines: true,
      receiptId: 'receipt-1'
    })
    expect(receipt.lines).toHaveLength(2)
    expect(createdReceipt.receiptId).toBe('receipt-1')
    expect(updatedReceipt.lines[1]?.restrictedReason?.reasonCode).toBe('DAMAGED')
    expect(postedReceipt.postedStockLedgerEntryIds).toEqual(['ledger-1', 'ledger-2'])
    expect(cancelledReceipt.status).toBe('CANCELLED')
    expect(entries.entries[0]).toMatchObject({
      restrictedReasonCode: 'DAMAGED',
      sourceDocumentId: 'receipt-1'
    })
    expect(balance.restrictedQuantities[0]).toEqual({
      quantity: '2',
      reasonCode: 'DAMAGED'
    })
    expect(balances.inventoryBalances[0]).toMatchObject({
      onHandQuantity: '10',
      restrictedQuantity: '2'
    })
  })
})
