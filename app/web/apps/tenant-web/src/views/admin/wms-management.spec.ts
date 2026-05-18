/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const listInventoryBalancesApi = vi.fn()
const listLocationsApi = vi.fn()
const listReceiptsApi = vi.fn()
const listStockLedgerEntriesApi = vi.fn()
const listWarehousesApi = vi.fn()
const push = vi.fn()

const authContextState: any = {
  actionCodes: [],
  sessionContext: {
    tenant: {
      name: 'Alpha Tenant',
      tenantId: 'tenant-1'
    }
  },
  tenantName: 'Alpha Tenant',
  visibleEntries: ['wms.management']
}

vi.mock('#/api', () => ({
  listInventoryBalancesApi,
  listLocationsApi,
  listReceiptsApi,
  listStockLedgerEntriesApi,
  listWarehousesApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push
  })
}))

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    template: '<div><slot /></div>'
  }
}))

// Verifies the WMS workspace page loads the phase 1 Warehouse/Location/Receipt/Inventory directories and routes into dedicated receipt flows.
describe('wms workspace page', () => {
  beforeEach(() => {
    listInventoryBalancesApi.mockReset()
    listLocationsApi.mockReset()
    listReceiptsApi.mockReset()
    listStockLedgerEntriesApi.mockReset()
    listWarehousesApi.mockReset()
    push.mockReset()
    authContextState.actionCodes = [
      'wms.warehouse.read',
      'wms.location.read',
      'wms.receipt.read',
      'wms.receipt.manage',
      'wms.inventory.read'
    ]

    listWarehousesApi.mockResolvedValue({
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
    listLocationsApi.mockResolvedValue({
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
    listReceiptsApi.mockResolvedValue({
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
    listInventoryBalancesApi.mockResolvedValue({
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
    listStockLedgerEntriesApi.mockResolvedValue({
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
          stockLedgerEntryId: 'ledger-1',
          uom: 'PCS',
          warehouseId: 'warehouse-1'
        }
      ],
      page: 1,
      pageSize: 20,
      total: 1
    })
  })

  it('loads the five WMS directories and supports create/detail navigation', async () => {
    const page = (await import('./wms-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(listWarehousesApi).toHaveBeenCalledWith('tenant-1', {
      keyword: undefined,
      page: 1,
      pageSize: 20,
      status: undefined
    })
    expect(listLocationsApi).toHaveBeenCalledWith('tenant-1', {
      page: 1,
      pageSize: 20,
      supportsReceipt: undefined,
      warehouseId: undefined
    })
    expect(listReceiptsApi).toHaveBeenCalledWith('tenant-1', {
      keyword: undefined,
      page: 1,
      pageSize: 20,
      status: undefined,
      warehouseId: undefined
    })
    expect(listInventoryBalancesApi).toHaveBeenCalledWith('tenant-1', {
      inventoryStatus: undefined,
      onlyPositiveOnHand: true,
      page: 1,
      pageSize: 20,
      warehouseId: undefined
    })
    expect(listStockLedgerEntriesApi).toHaveBeenCalledWith('tenant-1', {
      page: 1,
      pageSize: 20,
      restrictedReasonCode: undefined,
      warehouseId: undefined
    })
    expect(wrapper.text()).toContain('WH-001')
    expect(wrapper.text()).toContain('RCV-A')
    expect(wrapper.text()).toContain('RCPT-001')
    expect(wrapper.text()).toContain('ITEM-001')
    expect(wrapper.text()).toContain('ledger-1')

    await wrapper.get('[data-testid="wms-open-create-receipt"]').trigger('click')
    await wrapper.get('button[aria-label="收货单操作"]').trigger('click')
    await flushPromises()
    document.querySelector('[data-testid="wms-open-receipt-receipt-1"]')!.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    )

    expect(push).toHaveBeenNthCalledWith(1, {
      name: 'TenantWmsReceiptCreate'
    })
    expect(push).toHaveBeenNthCalledWith(2, {
      name: 'TenantWmsReceiptDetail',
      params: {
        receiptId: 'receipt-1'
      }
    })
  })
})
