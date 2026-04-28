import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const post = vi.fn()
const put = vi.fn()
const request = vi.fn()

vi.mock('#/api/request', () => ({
  requestClient: {
    get,
    post,
    put,
    request
  }
}))

// Verifies the tenant-web item-management API client stays aligned with the gateway phase 1 BFF surface.
describe('tenant-web item management api', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    put.mockReset()
    request.mockReset()
  })

  it('lists items, loads detail, composition, and supplier mapping sections from the tenant-scoped item-management entry', async () => {
    const {
      getManagedItemByIdApi,
      getManagedItemCompositionApi,
      listManagedItemsApi,
      listManagedSupplierItemMappingsApi
    } = await import('./index')

    await listManagedItemsApi('tenant-1', {
      capability: 'sellable',
      keyword: 'starter',
      natureType: 'VIRTUAL',
      page: 2,
      pageSize: 10,
      status: 'ACTIVE',
      structureType: 'BUNDLE'
    })
    await getManagedItemByIdApi('tenant-1', 'item-1')
    await getManagedItemCompositionApi('tenant-1', 'item-1')
    await listManagedSupplierItemMappingsApi('tenant-1', 'item-1', {
      page: 3,
      pageSize: 25
    })

    expect(get).toHaveBeenCalledWith('/item-management/tenants/tenant-1/items', {
      params: {
        capability: 'sellable',
        keyword: 'starter',
        natureType: 'VIRTUAL',
        page: 2,
        pageSize: 10,
        status: 'ACTIVE',
        structureType: 'BUNDLE'
      }
    })
    expect(get).toHaveBeenCalledWith('/item-management/tenants/tenant-1/items/item-1')
    expect(get).toHaveBeenCalledWith('/item-management/tenants/tenant-1/items/item-1/composition')
    expect(get).toHaveBeenCalledWith(
      '/item-management/tenants/tenant-1/items/item-1/supplier-mappings',
      {
        params: {
          page: 3,
          pageSize: 25
        }
      }
    )
  })

  it('creates and mutates phase 1 items without widening the contract surface', async () => {
    const {
      changeManagedItemStatusApi,
      createManagedItemApi,
      setManagedItemCapabilitiesApi,
      setManagedItemCompositionApi,
      updateManagedItemBasicsApi,
      upsertManagedSupplierItemMappingApi
    } = await import('./index')

    await createManagedItemApi('tenant-1', {
      itemCode: 'ITEM-001',
      itemName: 'Starter Item',
      structureType: 'SINGLE',
      natureType: 'PHYSICAL'
    })
    await updateManagedItemBasicsApi('tenant-1', 'item-1', {
      itemCode: 'ITEM-001-REV',
      itemName: 'Starter Item Rev'
    })
    await setManagedItemCapabilitiesApi('tenant-1', 'item-1', {
      capabilities: {
        sellable: true,
        purchasable: true,
        stockable: true,
        manufacturable: false
      }
    })
    await setManagedItemCompositionApi('tenant-1', 'item-1', {
      components: [
        { componentItemId: 'component-1' },
        { componentItemId: 'component-2' }
      ]
    })
    await upsertManagedSupplierItemMappingApi('tenant-1', 'item-1', {
      supplierId: 'supplier-1',
      supplierItemCode: 'SUP-001',
      supplierItemName: 'Supplier Item 1'
    })
    await changeManagedItemStatusApi('tenant-1', 'item-1', {
      status: 'INACTIVE'
    })

    expect(post).toHaveBeenCalledWith('/item-management/tenants/tenant-1/items', {
      itemCode: 'ITEM-001',
      itemName: 'Starter Item',
      structureType: 'SINGLE',
      natureType: 'PHYSICAL'
    })
    expect(request).toHaveBeenCalledWith(
      '/item-management/tenants/tenant-1/items/item-1/basics',
      {
        data: {
          itemCode: 'ITEM-001-REV',
          itemName: 'Starter Item Rev'
        },
        method: 'PATCH'
      }
    )
    expect(put).toHaveBeenCalledWith(
      '/item-management/tenants/tenant-1/items/item-1/capabilities',
      {
        capabilities: {
          sellable: true,
          purchasable: true,
          stockable: true,
          manufacturable: false
        }
      }
    )
    expect(put).toHaveBeenCalledWith(
      '/item-management/tenants/tenant-1/items/item-1/composition',
      {
        components: [
          { componentItemId: 'component-1' },
          { componentItemId: 'component-2' }
        ]
      }
    )
    expect(post).toHaveBeenCalledWith(
      '/item-management/tenants/tenant-1/items/item-1/supplier-mappings',
      {
        supplierId: 'supplier-1',
        supplierItemCode: 'SUP-001',
        supplierItemName: 'Supplier Item 1'
      }
    )
    expect(request).toHaveBeenCalledWith(
      '/item-management/tenants/tenant-1/items/item-1/status',
      {
        data: {
          status: 'INACTIVE'
        },
        method: 'PATCH'
      }
    )
  })
})
