import { Reflector } from '@nestjs/core'
import { PERMISSION_CHECK_KEY } from '@oes/common/authorization'
import { ItemManagementController } from './item-management.controller'

// Verifies the item-management gateway controller keeps permissions and phase 1 request forwarding aligned with the item-master BFF surface.
describe('ItemManagementController', () => {
  const itemManagementService = {
    changeItemStatus: jest.fn(),
    changeItemCategoryStatus: jest.fn(),
    createItemCategory: jest.fn(),
    createItem: jest.fn(),
    getItem: jest.fn(),
    getItemComposition: jest.fn(),
    listItemCategories: jest.fn(),
    listItems: jest.fn(),
    listSupplierMappings: jest.fn(),
    setItemPrimaryCategory: jest.fn(),
    setItemCapabilities: jest.fn(),
    setItemComposition: jest.fn(),
    updateItemCategoryBasics: jest.fn(),
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
    expect(
      reflector.get(PERMISSION_CHECK_KEY, ItemManagementController.prototype.listItemCategories)
    ).toEqual({
      type: 'ALL',
      permissions: ['item_master.item_category.list']
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, ItemManagementController.prototype.createItemCategory)
    ).toEqual({
      type: 'ALL',
      permissions: ['item_master.item_category.create']
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, ItemManagementController.prototype.updateItemCategoryBasics)
    ).toEqual({
      type: 'ALL',
      permissions: ['item_master.item_category.update_basics']
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, ItemManagementController.prototype.changeItemCategoryStatus)
    ).toEqual({
      type: 'ALL',
      permissions: ['item_master.item_category.update_status']
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, ItemManagementController.prototype.setItemPrimaryCategory)
    ).toEqual({
      type: 'ALL',
      permissions: ['item_master.item.set_primary_category']
    })
  })

  it('forwards item and category requests to the item-management service', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1' }

    itemManagementService.listItems.mockResolvedValue({ items: [], page: 1, pageSize: 20, total: 0 })
    itemManagementService.listItemCategories.mockResolvedValue({ categories: [] })
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
    itemManagementService.createItemCategory.mockResolvedValue({ categoryId: 'category-1' })
    itemManagementService.updateItemCategoryBasics.mockResolvedValue({ categoryId: 'category-1' })
    itemManagementService.changeItemCategoryStatus.mockResolvedValue({
      categoryId: 'category-1',
      status: 'INACTIVE'
    })
    itemManagementService.setItemPrimaryCategory.mockResolvedValue({ itemId: 'item-1' })

    await controller.listItems(
      'tenant-1',
      {
        capability: 'sellable',
        categoryId: 'category-1',
        includeDescendants: true,
        keyword: 'starter',
        natureType: 'VIRTUAL',
        page: 2,
        pageSize: 10,
        status: 'ACTIVE',
        structureType: 'BUNDLE'
      } as any,
      source as any
    )
    await controller.listItemCategories(
      'tenant-1',
      {
        parentCategoryId: 'category-root'
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
    await controller.createItemCategory(
      'tenant-1',
      {
        categoryCode: 'FINISHED',
        categoryName: 'Finished Goods',
        parentCategoryId: 'category-root'
      } as any,
      source as any
    )
    await controller.changeItemStatus(
      'tenant-1',
      'item-1',
      { status: 'INACTIVE' } as any,
      source as any
    )
    await controller.updateItemCategoryBasics(
      'tenant-1',
      'category-1',
      {
        categoryCode: 'FINISHED-REV',
        categoryName: 'Finished Goods Rev'
      } as any,
      source as any
    )
    await controller.changeItemCategoryStatus(
      'tenant-1',
      'category-1',
      { status: 'INACTIVE' } as any,
      source as any
    )
    await controller.setItemPrimaryCategory(
      'tenant-1',
      'item-1',
      {
        primaryCategoryId: 'category-1'
      } as any,
      source as any
    )

    expect(itemManagementService.listItems).toHaveBeenCalledWith(
      'tenant-1',
      {
        capability: 'sellable',
        categoryId: 'category-1',
        includeDescendants: true,
        keyword: 'starter',
        natureType: 'VIRTUAL',
        page: 2,
        pageSize: 10,
        status: 'ACTIVE',
        structureType: 'BUNDLE'
      },
      source
    )
    expect(itemManagementService.listItemCategories).toHaveBeenCalledWith(
      'tenant-1',
      {
        parentCategoryId: 'category-root'
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
    expect(itemManagementService.createItemCategory).toHaveBeenCalledWith(
      'tenant-1',
      {
        categoryCode: 'FINISHED',
        categoryName: 'Finished Goods',
        parentCategoryId: 'category-root'
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
    expect(itemManagementService.updateItemCategoryBasics).toHaveBeenCalledWith(
      'tenant-1',
      'category-1',
      {
        categoryCode: 'FINISHED-REV',
        categoryName: 'Finished Goods Rev'
      },
      source
    )
    expect(itemManagementService.changeItemCategoryStatus).toHaveBeenCalledWith(
      'tenant-1',
      'category-1',
      {
        status: 'INACTIVE'
      },
      source
    )
    expect(itemManagementService.setItemPrimaryCategory).toHaveBeenCalledWith(
      'tenant-1',
      'item-1',
      {
        primaryCategoryId: 'category-1'
      },
      source
    )
  })
})
