import { Reflector } from '@nestjs/core'
import { PERMISSION_CHECK_KEY } from '@oes/common/authorization'
import { ItemManagementController } from './item-management.controller'

// Verifies the item-management gateway controller keeps permissions and phase 1 request forwarding aligned with the item-master BFF surface.
describe('ItemManagementController', () => {
  const itemManagementService = {
    changeItemStatus: jest.fn(),
    createItem: jest.fn(),
    getItem: jest.fn(),
    getItemComposition: jest.fn(),
    listItems: jest.fn(),
    listSupplierMappings: jest.fn(),
    setItemCapabilities: jest.fn(),
    setItemComposition: jest.fn(),
    updateItemBasics: jest.fn(),
    upsertSupplierMapping: jest.fn()
  }

  const controller = new ItemManagementController(itemManagementService as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('declares the expected permissions on item-management endpoints', () => {
    const reflector = new Reflector()

    expect(reflector.get(PERMISSION_CHECK_KEY, ItemManagementController.prototype.listItems)).toEqual({
      type: 'ALL',
      permissions: ['item_master.item.list']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, ItemManagementController.prototype.getItem)).toEqual({
      type: 'ALL',
      permissions: ['item_master.item.get_by_id']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, ItemManagementController.prototype.createItem)).toEqual({
      type: 'ALL',
      permissions: ['item_master.item.create']
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, ItemManagementController.prototype.updateItemBasics)
    ).toEqual({
      type: 'ALL',
      permissions: ['item_master.item.update_basics']
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, ItemManagementController.prototype.setItemCapabilities)
    ).toEqual({
      type: 'ALL',
      permissions: ['item_master.item.set_capabilities']
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, ItemManagementController.prototype.getItemComposition)
    ).toEqual({
      type: 'ALL',
      permissions: ['item_master.item.set_composition']
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, ItemManagementController.prototype.setItemComposition)
    ).toEqual({
      type: 'ALL',
      permissions: ['item_master.item.set_composition']
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, ItemManagementController.prototype.listSupplierMappings)
    ).toEqual({
      type: 'ALL',
      permissions: ['item_master.supplier_item_mapping.list_by_item']
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, ItemManagementController.prototype.upsertSupplierMapping)
    ).toEqual({
      type: 'ALL',
      permissions: ['item_master.supplier_item_mapping.upsert']
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, ItemManagementController.prototype.changeItemStatus)
    ).toEqual({
      type: 'ALL',
      permissions: ['item_master.item.update_status']
    })
  })

  it('forwards phase 1 list, detail, write, composition, and supplier mapping requests to the item-management service', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1' }

    itemManagementService.listItems.mockResolvedValue({ items: [], page: 1, pageSize: 20, total: 0 })
    itemManagementService.getItem.mockResolvedValue({ itemId: 'item-1' })
    itemManagementService.createItem.mockResolvedValue({ itemId: 'item-1' })
    itemManagementService.updateItemBasics.mockResolvedValue({ itemId: 'item-1' })
    itemManagementService.setItemCapabilities.mockResolvedValue({ itemId: 'item-1' })
    itemManagementService.getItemComposition.mockResolvedValue({ itemId: 'item-1', components: [] })
    itemManagementService.setItemComposition.mockResolvedValue({ itemId: 'item-1', components: [] })
    itemManagementService.listSupplierMappings.mockResolvedValue({
      mappings: [],
      page: 1,
      pageSize: 20,
      total: 0
    })
    itemManagementService.upsertSupplierMapping.mockResolvedValue({ supplierId: 'supplier-1' })
    itemManagementService.changeItemStatus.mockResolvedValue({ itemId: 'item-1', status: 'INACTIVE' })

    await controller.listItems(
      'tenant-1',
      {
        capability: 'sellable',
        keyword: 'starter',
        natureType: 'VIRTUAL',
        page: 2,
        pageSize: 10,
        status: 'ACTIVE',
        structureType: 'BUNDLE'
      } as any,
      source as any
    )
    await controller.getItem('tenant-1', 'item-1', source as any)
    await controller.createItem(
      'tenant-1',
      {
        itemCode: 'ITEM-001',
        itemName: 'Starter Item',
        structureType: 'SINGLE',
        natureType: 'PHYSICAL'
      } as any,
      source as any
    )
    await controller.updateItemBasics(
      'tenant-1',
      'item-1',
      {
        itemCode: 'ITEM-001-REV',
        itemName: 'Starter Item Rev'
      } as any,
      source as any
    )
    await controller.setItemCapabilities(
      'tenant-1',
      'item-1',
      {
        capabilities: {
          sellable: true,
          purchasable: true,
          stockable: true,
          manufacturable: false
        }
      } as any,
      source as any
    )
    await controller.getItemComposition('tenant-1', 'item-1', source as any)
    await controller.setItemComposition(
      'tenant-1',
      'item-1',
      {
        components: [{ componentItemId: 'component-1' }]
      } as any,
      source as any
    )
    await controller.listSupplierMappings(
      'tenant-1',
      'item-1',
      { page: 2, pageSize: 50 } as any,
      source as any
    )
    await controller.upsertSupplierMapping(
      'tenant-1',
      'item-1',
      {
        supplierId: 'supplier-1',
        supplierItemCode: 'SUP-001',
        supplierItemName: 'Supplier Item 1'
      } as any,
      source as any
    )
    await controller.changeItemStatus(
      'tenant-1',
      'item-1',
      { status: 'INACTIVE' } as any,
      source as any
    )

    expect(itemManagementService.listItems).toHaveBeenCalledWith(
      'tenant-1',
      {
        capability: 'sellable',
        keyword: 'starter',
        natureType: 'VIRTUAL',
        page: 2,
        pageSize: 10,
        status: 'ACTIVE',
        structureType: 'BUNDLE'
      },
      source
    )
    expect(itemManagementService.getItem).toHaveBeenCalledWith('tenant-1', 'item-1', source)
    expect(itemManagementService.createItem).toHaveBeenCalledWith(
      'tenant-1',
      {
        itemCode: 'ITEM-001',
        itemName: 'Starter Item',
        structureType: 'SINGLE',
        natureType: 'PHYSICAL'
      },
      source
    )
    expect(itemManagementService.updateItemBasics).toHaveBeenCalledWith(
      'tenant-1',
      'item-1',
      {
        itemCode: 'ITEM-001-REV',
        itemName: 'Starter Item Rev'
      },
      source
    )
    expect(itemManagementService.setItemCapabilities).toHaveBeenCalledWith(
      'tenant-1',
      'item-1',
      {
        capabilities: {
          sellable: true,
          purchasable: true,
          stockable: true,
          manufacturable: false
        }
      },
      source
    )
    expect(itemManagementService.getItemComposition).toHaveBeenCalledWith(
      'tenant-1',
      'item-1',
      source
    )
    expect(itemManagementService.setItemComposition).toHaveBeenCalledWith(
      'tenant-1',
      'item-1',
      {
        components: [{ componentItemId: 'component-1' }]
      },
      source
    )
    expect(itemManagementService.listSupplierMappings).toHaveBeenCalledWith(
      'tenant-1',
      'item-1',
      {
        page: 2,
        pageSize: 50
      },
      source
    )
    expect(itemManagementService.upsertSupplierMapping).toHaveBeenCalledWith(
      'tenant-1',
      'item-1',
      {
        supplierId: 'supplier-1',
        supplierItemCode: 'SUP-001',
        supplierItemName: 'Supplier Item 1'
      },
      source
    )
    expect(itemManagementService.changeItemStatus).toHaveBeenCalledWith(
      'tenant-1',
      'item-1',
      {
        status: 'INACTIVE'
      },
      source
    )
  })
})
