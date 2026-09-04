import { Reflector } from '@nestjs/core'
import { REQUIRE_PERMISSIONS_METADATA_KEY } from '@oes/common/authorization'
import { WmsController } from '../../../../../../../src/modules/wms-service/interface/http/controllers/wms.controller'

// Verifies the WMS gateway controller keeps permissions and phase 1 request forwarding aligned with the frozen Warehouse/Receipt/Inventory BFF surface.
describe('WmsController', () => {
  const wmsService = {
    addOrReplaceReceiptLines: jest.fn(),
    cancelReceiptDraft: jest.fn(),
    createReceiptDraft: jest.fn(),
    getInventoryBalance: jest.fn(),
    getLocation: jest.fn(),
    getReceipt: jest.fn(),
    getReceiptLine: jest.fn(),
    getWarehouse: jest.fn(),
    listLocations: jest.fn(),
    listWarehouses: jest.fn(),
    postReceipt: jest.fn(),
    searchInventoryBalances: jest.fn(),
    searchReceiptLines: jest.fn(),
    searchReceipts: jest.fn(),
    searchStockLedgerEntries: jest.fn()
  }

  const controller = new WmsController(wmsService as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('declares the expected WMS permissions on gateway endpoints', () => {
    const reflector = new Reflector()

    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, WmsController.prototype.listWarehouses)
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, WmsController.prototype.getWarehouse)
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, WmsController.prototype.listLocations)
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, WmsController.prototype.searchReceipts)
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, WmsController.prototype.createReceiptDraft)
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        WmsController.prototype.addOrReplaceReceiptLines
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, WmsController.prototype.postReceipt)
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        WmsController.prototype.searchStockLedgerEntries
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, WmsController.prototype.getInventoryBalance)
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
  })

  it('forwards the minimum phase 1 WMS BFF surface to the proxy service', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1' }

    wmsService.listWarehouses.mockResolvedValue({ page: 1, pageSize: 20, total: 0, warehouses: [] })
    wmsService.getWarehouse.mockResolvedValue({ warehouseId: 'warehouse-1' })
    wmsService.listLocations.mockResolvedValue({ locations: [], page: 1, pageSize: 20, total: 0 })
    wmsService.getLocation.mockResolvedValue({ locationId: 'location-1' })
    wmsService.searchReceipts.mockResolvedValue({ page: 1, pageSize: 20, receipts: [], total: 0 })
    wmsService.getReceipt.mockResolvedValue({ receiptId: 'receipt-1' })
    wmsService.getReceiptLine.mockResolvedValue({ receiptLineId: 'receipt-line-1' })
    wmsService.searchReceiptLines.mockResolvedValue({
      page: 1,
      pageSize: 20,
      receiptLines: [],
      total: 0
    })
    wmsService.createReceiptDraft.mockResolvedValue({ receiptId: 'receipt-1' })
    wmsService.addOrReplaceReceiptLines.mockResolvedValue({ receiptId: 'receipt-1' })
    wmsService.postReceipt.mockResolvedValue({ receiptId: 'receipt-1' })
    wmsService.cancelReceiptDraft.mockResolvedValue({ receiptId: 'receipt-1' })
    wmsService.searchStockLedgerEntries.mockResolvedValue({
      entries: [],
      page: 1,
      pageSize: 20,
      total: 0
    })
    wmsService.getInventoryBalance.mockResolvedValue({ warehouseId: 'warehouse-1' })
    wmsService.searchInventoryBalances.mockResolvedValue({
      inventoryBalances: [],
      page: 1,
      pageSize: 20,
      total: 0
    })

    await controller.listWarehouses(
      'tenant-1',
      { keyword: 'main', page: 2, pageSize: 10 } as any,
      source as any
    )
    await controller.getWarehouse('tenant-1', 'warehouse-1', source as any)
    await controller.listLocations('tenant-1', { warehouseId: 'warehouse-1' } as any, source as any)
    await controller.getLocation('tenant-1', 'location-1', source as any)
    await controller.searchReceipts(
      'tenant-1',
      { warehouseId: 'warehouse-1' } as any,
      source as any
    )
    await controller.getReceipt('tenant-1', 'receipt-1', source as any)
    await controller.getReceiptLine('tenant-1', 'receipt-line-1', source as any)
    await controller.searchReceiptLines(
      'tenant-1',
      { receiptId: 'receipt-1' } as any,
      source as any
    )
    await controller.createReceiptDraft(
      'tenant-1',
      {
        receiptSourceType: 'MANUAL',
        warehouseId: 'warehouse-1'
      } as any,
      source as any
    )
    await controller.addOrReplaceReceiptLines(
      'tenant-1',
      'receipt-1',
      {
        lines: []
      } as any,
      source as any
    )
    await controller.postReceipt(
      'tenant-1',
      'receipt-1',
      {
        auditReason: 'post',
        postComment: 'ready'
      } as any,
      source as any
    )
    await controller.cancelReceiptDraft(
      'tenant-1',
      'receipt-1',
      {
        auditReason: 'cancel',
        cancelReason: 'duplicate'
      } as any,
      source as any
    )
    await controller.searchStockLedgerEntries(
      'tenant-1',
      { warehouseId: 'warehouse-1' } as any,
      source as any
    )
    await controller.getInventoryBalance(
      'tenant-1',
      {
        itemId: 'item-1',
        warehouseId: 'warehouse-1'
      } as any,
      source as any
    )
    await controller.searchInventoryBalances(
      'tenant-1',
      { warehouseId: 'warehouse-1' } as any,
      source as any
    )

    expect(wmsService.listWarehouses).toHaveBeenCalledWith(
      'tenant-1',
      {
        keyword: 'main',
        page: 2,
        pageSize: 10,
        status: undefined
      },
      source
    )
    expect(wmsService.getWarehouse).toHaveBeenCalledWith('tenant-1', 'warehouse-1', source)
    expect(wmsService.listLocations).toHaveBeenCalledWith(
      'tenant-1',
      {
        locationType: undefined,
        page: undefined,
        pageSize: undefined,
        parentLocationId: undefined,
        status: undefined,
        supportsReceipt: undefined,
        supportsStorage: undefined,
        warehouseId: 'warehouse-1'
      },
      source
    )
    expect(wmsService.createReceiptDraft).toHaveBeenCalled()
    expect(wmsService.addOrReplaceReceiptLines).toHaveBeenCalled()
    expect(wmsService.postReceipt).toHaveBeenCalled()
    expect(wmsService.cancelReceiptDraft).toHaveBeenCalled()
    expect(wmsService.searchStockLedgerEntries).toHaveBeenCalled()
    expect(wmsService.getInventoryBalance).toHaveBeenCalledWith(
      'tenant-1',
      {
        itemId: 'item-1',
        locationId: undefined,
        warehouseId: 'warehouse-1'
      },
      source
    )
    expect(wmsService.searchInventoryBalances).toHaveBeenCalled()
  })
})
