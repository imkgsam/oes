import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const post = vi.fn()
const put = vi.fn()

vi.mock('#/api/request', () => ({
  requestClient: {
    get,
    post,
    put
  }
}))

// Verifies the tenant-web WMS API client stays aligned with the gateway phase 1 Warehouse/Receipt/Inventory BFF surface.
describe('tenant-web WMS api', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    put.mockReset()
  })

  it('lists the frozen phase 1 WMS query directories and single-object reads', async () => {
    const {
      getInventoryBalanceApi,
      getLocationByIdApi,
      getReceiptByIdApi,
      getReceiptLineByIdApi,
      getWarehouseByIdApi,
      listInventoryBalancesApi,
      listLocationsApi,
      listReceiptLinesApi,
      listReceiptsApi,
      listStockLedgerEntriesApi,
      listWarehousesApi
    } = await import('./index')

    await listWarehousesApi('tenant-1', { keyword: 'main', page: 1, pageSize: 20, status: 'ACTIVE' })
    await getWarehouseByIdApi('tenant-1', 'warehouse-1')
    await listLocationsApi('tenant-1', { supportsReceipt: true, warehouseId: 'warehouse-1' })
    await getLocationByIdApi('tenant-1', 'location-1')
    await listReceiptsApi('tenant-1', { page: 2, pageSize: 10, status: 'DRAFT', warehouseId: 'warehouse-1' })
    await getReceiptByIdApi('tenant-1', 'receipt-1')
    await listReceiptLinesApi('tenant-1', { receiptId: 'receipt-1' })
    await getReceiptLineByIdApi('tenant-1', 'receipt-line-1')
    await listStockLedgerEntriesApi('tenant-1', { restrictedReasonCode: 'DAMAGED', warehouseId: 'warehouse-1' })
    await getInventoryBalanceApi('tenant-1', {
      itemId: 'item-1',
      locationId: 'location-2',
      warehouseId: 'warehouse-1'
    })
    await listInventoryBalancesApi('tenant-1', {
      inventoryStatus: 'RESTRICTED',
      onlyPositiveOnHand: true,
      warehouseId: 'warehouse-1'
    })

    expect(get).toHaveBeenCalledWith('/wms/tenants/tenant-1/warehouses', {
      params: {
        keyword: 'main',
        page: 1,
        pageSize: 20,
        status: 'ACTIVE'
      }
    })
    expect(get).toHaveBeenCalledWith('/wms/tenants/tenant-1/warehouses/warehouse-1')
    expect(get).toHaveBeenCalledWith('/wms/tenants/tenant-1/locations', {
      params: {
        supportsReceipt: true,
        warehouseId: 'warehouse-1'
      }
    })
    expect(get).toHaveBeenCalledWith('/wms/tenants/tenant-1/locations/location-1')
    expect(get).toHaveBeenCalledWith('/wms/tenants/tenant-1/receipts', {
      params: {
        page: 2,
        pageSize: 10,
        status: 'DRAFT',
        warehouseId: 'warehouse-1'
      }
    })
    expect(get).toHaveBeenCalledWith('/wms/tenants/tenant-1/receipts/receipt-1')
    expect(get).toHaveBeenCalledWith('/wms/tenants/tenant-1/receipt-lines', {
      params: {
        receiptId: 'receipt-1'
      }
    })
    expect(get).toHaveBeenCalledWith('/wms/tenants/tenant-1/receipt-lines/receipt-line-1')
    expect(get).toHaveBeenCalledWith('/wms/tenants/tenant-1/stock-ledger-entries', {
      params: {
        restrictedReasonCode: 'DAMAGED',
        warehouseId: 'warehouse-1'
      }
    })
    expect(get).toHaveBeenCalledWith('/wms/tenants/tenant-1/inventory-balance', {
      params: {
        itemId: 'item-1',
        locationId: 'location-2',
        warehouseId: 'warehouse-1'
      }
    })
    expect(get).toHaveBeenCalledWith('/wms/tenants/tenant-1/inventory-balances', {
      params: {
        inventoryStatus: 'RESTRICTED',
        onlyPositiveOnHand: true,
        warehouseId: 'warehouse-1'
      }
    })
  })

  it('creates and mutates receipt drafts without widening the WMS contract surface', async () => {
    const {
      cancelReceiptDraftApi,
      createReceiptDraftApi,
      postReceiptApi,
      replaceReceiptLinesApi
    } = await import('./index')

    await createReceiptDraftApi('tenant-1', {
      note: 'dock A',
      orgId: 'org-1',
      receiptDate: '2026-04-29',
      receiptSourceType: 'MANUAL',
      warehouseId: 'warehouse-1'
    })
    await replaceReceiptLinesApi('tenant-1', 'receipt-1', {
      auditReason: 'edit draft lines from tenant-web',
      lines: [
        {
          confirmedQuantity: '2',
          inventoryStatus: 'RESTRICTED',
          itemId: 'item-1',
          restrictedReason: {
            reasonCode: 'DAMAGED'
          },
          targetLocationId: 'location-2',
          uom: 'PCS'
        }
      ]
    })
    await postReceiptApi('tenant-1', 'receipt-1', {
      auditReason: 'post receipt from tenant-web',
      postComment: 'ready'
    })
    await cancelReceiptDraftApi('tenant-1', 'receipt-1', {
      auditReason: 'cancel duplicate',
      cancelReason: 'duplicate draft'
    })

    expect(post).toHaveBeenCalledWith('/wms/tenants/tenant-1/receipts', {
      note: 'dock A',
      orgId: 'org-1',
      receiptDate: '2026-04-29',
      receiptSourceType: 'MANUAL',
      warehouseId: 'warehouse-1'
    })
    expect(put).toHaveBeenCalledWith('/wms/tenants/tenant-1/receipts/receipt-1/lines', {
      auditReason: 'edit draft lines from tenant-web',
      lines: [
        {
          confirmedQuantity: '2',
          inventoryStatus: 'RESTRICTED',
          itemId: 'item-1',
          restrictedReason: {
            reasonCode: 'DAMAGED'
          },
          targetLocationId: 'location-2',
          uom: 'PCS'
        }
      ]
    })
    expect(post).toHaveBeenCalledWith('/wms/tenants/tenant-1/receipts/receipt-1/post', {
      auditReason: 'post receipt from tenant-web',
      postComment: 'ready'
    })
    expect(post).toHaveBeenCalledWith('/wms/tenants/tenant-1/receipts/receipt-1/cancel', {
      auditReason: 'cancel duplicate',
      cancelReason: 'duplicate draft'
    })
  })
})
