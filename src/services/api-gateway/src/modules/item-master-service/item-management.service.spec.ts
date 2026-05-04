import { ForbiddenException } from '@nestjs/common'
import {
  ItemCategoryStatus,
  ItemNatureType,
  ItemStatus,
  ItemStructureType
} from '@oes/common/generated/item_master_service'
import { ItemManagementService } from './item-management.service'

// Verifies the gateway item-management service keeps tenant scope enforcement and phase 1 request mapping aligned with item-master contracts.
describe('ItemManagementService', () => {
  const itemQueryAdapter = {
    getItem: jest.fn(),
    getItemComposition: jest.fn(),
    listItemCategories: jest.fn(),
    listSupplierItemMappingsByItem: jest.fn(),
    searchItems: jest.fn()
  }
  const itemManagementAdapter = {
    changeItemStatus: jest.fn(),
    changeItemCategoryStatus: jest.fn(),
    createItemCategory: jest.fn(),
    createItem: jest.fn(),
    setItemPrimaryCategory: jest.fn(),
    setItemCapabilities: jest.fn(),
    setItemComposition: jest.fn(),
    updateItemCategoryBasics: jest.fn(),
    updateItemBasics: jest.fn(),
    upsertSupplierItemMapping: jest.fn()
  }

  const service = new ItemManagementService(
    itemQueryAdapter as any,
    itemManagementAdapter as any
  )

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('rejects tenant-scoped operators when they request another tenant item directory', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1' }
    }

    await expect(
      service.listItems(
        'tenant-2',
        {
          page: 1,
          pageSize: 20
        },
        source as any
      )
    ).rejects.toBeInstanceOf(ForbiddenException)

    expect(itemQueryAdapter.searchItems).not.toHaveBeenCalled()
  })

  it('maps list and detail queries into the item-master phase 1 gateway read model', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1' }
    }

    itemQueryAdapter.searchItems.mockResolvedValue({
      items: [
        {
          itemId: 'item-1',
          itemCode: 'BUNDLE-001',
          itemName: 'Starter Bundle',
          structureType: ItemStructureType.ITEM_STRUCTURE_TYPE_BUNDLE,
          natureType: ItemNatureType.ITEM_NATURE_TYPE_VIRTUAL,
          status: ItemStatus.ITEM_STATUS_ACTIVE,
          capabilities: {
            sellable: true,
            purchasable: false,
            stockable: false,
            manufacturable: false
          },
          primaryCategorySummary: {
            categoryId: 'category-1',
            categoryCode: 'FINISHED',
            categoryName: 'Finished Goods',
            status: ItemCategoryStatus.ITEM_CATEGORY_STATUS_ACTIVE
          }
        }
      ],
      total: 1,
      page: 2,
      pageSize: 10
    })
    itemQueryAdapter.getItem.mockResolvedValue({
      item: {
        itemId: 'item-1',
        itemCode: 'BUNDLE-001',
        itemName: 'Starter Bundle',
        structureType: ItemStructureType.ITEM_STRUCTURE_TYPE_BUNDLE,
        natureType: ItemNatureType.ITEM_NATURE_TYPE_VIRTUAL,
        status: ItemStatus.ITEM_STATUS_ACTIVE,
        capabilities: {
          sellable: true,
          purchasable: false,
          stockable: false,
          manufacturable: false
        },
        primaryCategorySummary: {
          categoryId: 'category-1',
          categoryCode: 'FINISHED',
          categoryName: 'Finished Goods',
          status: ItemCategoryStatus.ITEM_CATEGORY_STATUS_ACTIVE
        }
      }
    })

    await expect(
      service.listItems(
        'tenant-1',
        {
          capability: 'sellable',
          keyword: 'starter',
          natureType: 'VIRTUAL',
          categoryId: 'category-1',
          includeDescendants: true,
          page: 2,
          pageSize: 10,
          status: 'ACTIVE',
          structureType: 'BUNDLE'
        },
        source as any
      )
    ).resolves.toEqual({
      items: [
        {
          itemId: 'item-1',
          itemCode: 'BUNDLE-001',
          itemName: 'Starter Bundle',
          structureType: 'BUNDLE',
          natureType: 'VIRTUAL',
          status: 'ACTIVE',
          capabilities: {
            sellable: true,
            purchasable: false,
            stockable: false,
            manufacturable: false
          },
          primaryCategorySummary: {
            categoryId: 'category-1',
            categoryCode: 'FINISHED',
            categoryName: 'Finished Goods',
            status: 'ACTIVE'
          }
        }
      ],
      total: 1,
      page: 2,
      pageSize: 10
    })
    await expect(service.getItem('tenant-1', 'item-1', source as any)).resolves.toEqual({
      itemId: 'item-1',
      itemCode: 'BUNDLE-001',
        itemName: 'Starter Bundle',
        structureType: 'BUNDLE',
        natureType: 'VIRTUAL',
        status: 'ACTIVE',
        capabilities: {
          sellable: true,
          purchasable: false,
          stockable: false,
          manufacturable: false
        },
        primaryCategorySummary: {
          categoryId: 'category-1',
          categoryCode: 'FINISHED',
          categoryName: 'Finished Goods',
          status: 'ACTIVE'
        }
      })

    expect(itemQueryAdapter.searchItems).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        keyword: 'starter',
        structureType: ItemStructureType.ITEM_STRUCTURE_TYPE_BUNDLE,
        natureType: ItemNatureType.ITEM_NATURE_TYPE_VIRTUAL,
        capabilityFilters: {
          sellable: true
        },
        status: ItemStatus.ITEM_STATUS_ACTIVE,
        categoryId: 'category-1',
        includeDescendants: true,
        page: 2,
        pageSize: 10
      },
      source
    )
    expect(itemQueryAdapter.getItem).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        itemId: 'item-1'
      },
      source
    )
  })

  it('maps phase 1 create, update, composition, supplier mapping, and status operations without widening the contract', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1' }
    }

    itemManagementAdapter.createItem.mockResolvedValue({
      itemId: 'item-1',
      item: {
        itemId: 'item-1',
        itemCode: 'ITEM-001',
        itemName: 'Starter Item',
        structureType: ItemStructureType.ITEM_STRUCTURE_TYPE_SINGLE,
        natureType: ItemNatureType.ITEM_NATURE_TYPE_PHYSICAL,
        status: ItemStatus.ITEM_STATUS_ACTIVE,
        capabilities: {
          sellable: false,
          purchasable: false,
          stockable: false,
          manufacturable: false
        }
      }
    })
    itemManagementAdapter.updateItemBasics.mockResolvedValue({
      item: {
        itemId: 'item-1',
        itemCode: 'ITEM-001-REV',
        itemName: 'Starter Item Rev',
        structureType: ItemStructureType.ITEM_STRUCTURE_TYPE_SINGLE,
        natureType: ItemNatureType.ITEM_NATURE_TYPE_PHYSICAL,
        status: ItemStatus.ITEM_STATUS_ACTIVE,
        capabilities: {
          sellable: true,
          purchasable: true,
          stockable: true,
          manufacturable: false
        }
      }
    })
    itemManagementAdapter.setItemCapabilities.mockResolvedValue({
      item: {
        itemId: 'item-1',
        itemCode: 'ITEM-001-REV',
        itemName: 'Starter Item Rev',
        structureType: ItemStructureType.ITEM_STRUCTURE_TYPE_SINGLE,
        natureType: ItemNatureType.ITEM_NATURE_TYPE_PHYSICAL,
        status: ItemStatus.ITEM_STATUS_ACTIVE,
        capabilities: {
          sellable: true,
          purchasable: true,
          stockable: true,
          manufacturable: false
        }
      }
    })
    itemQueryAdapter.getItemComposition.mockResolvedValue({
      itemId: 'item-1',
      components: [
        {
          componentItemId: 'component-1',
          componentItemCode: 'COMP-001',
          componentItemName: 'Component 1'
        }
      ]
    })
    itemManagementAdapter.setItemComposition.mockResolvedValue({
      itemId: 'item-1',
      components: [
        {
          componentItemId: 'component-2',
          componentItemCode: 'COMP-002',
          componentItemName: 'Component 2'
        }
      ]
    })
    itemQueryAdapter.listSupplierItemMappingsByItem.mockResolvedValue({
      mappings: [
        {
          supplierId: 'supplier-1',
          supplierItemCode: 'SUP-001',
          supplierItemName: 'Supplier Item 1',
          itemId: 'item-1'
        }
      ],
      total: 1,
      page: 1,
      pageSize: 20
    })
    itemManagementAdapter.upsertSupplierItemMapping.mockResolvedValue({
      mapping: {
        supplierId: 'supplier-2',
        supplierItemCode: 'SUP-002',
        supplierItemName: 'Supplier Item 2',
        itemId: 'item-1',
        itemCode: 'ITEM-001-REV',
        itemName: 'Starter Item Rev'
      }
    })
    itemManagementAdapter.changeItemStatus.mockResolvedValue({
      item: {
        itemId: 'item-1',
        itemCode: 'ITEM-001-REV',
        itemName: 'Starter Item Rev',
        structureType: ItemStructureType.ITEM_STRUCTURE_TYPE_SINGLE,
        natureType: ItemNatureType.ITEM_NATURE_TYPE_PHYSICAL,
        status: ItemStatus.ITEM_STATUS_INACTIVE,
        capabilities: {
          sellable: true,
          purchasable: true,
          stockable: true,
          manufacturable: false
        }
      }
    })

    await expect(
      service.createItem(
        'tenant-1',
        {
          itemCode: 'ITEM-001',
          itemName: 'Starter Item',
          structureType: 'SINGLE',
          natureType: 'PHYSICAL'
        },
        source as any
      )
    ).resolves.toMatchObject({
      itemId: 'item-1',
      item: {
        structureType: 'SINGLE',
        natureType: 'PHYSICAL',
        status: 'ACTIVE'
      }
    })
    await expect(
      service.updateItemBasics(
        'tenant-1',
        'item-1',
        {
          itemCode: 'ITEM-001-REV',
          itemName: 'Starter Item Rev'
        },
        source as any
      )
    ).resolves.toMatchObject({
      itemId: 'item-1',
      itemCode: 'ITEM-001-REV'
    })
    await expect(
      service.setItemCapabilities(
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
        source as any
      )
    ).resolves.toMatchObject({
      capabilities: {
        sellable: true,
        purchasable: true,
        stockable: true,
        manufacturable: false
      }
    })
    await expect(
      service.getItemComposition('tenant-1', 'item-1', source as any)
    ).resolves.toEqual({
      itemId: 'item-1',
      components: [
        {
          componentItemId: 'component-1',
          componentItemCode: 'COMP-001',
          componentItemName: 'Component 1'
        }
      ]
    })
    await expect(
      service.setItemComposition(
        'tenant-1',
        'item-1',
        {
          components: [{ componentItemId: 'component-2' }]
        },
        source as any
      )
    ).resolves.toEqual({
      itemId: 'item-1',
      components: [
        {
          componentItemId: 'component-2',
          componentItemCode: 'COMP-002',
          componentItemName: 'Component 2'
        }
      ]
    })
    await expect(
      service.listSupplierMappings(
        'tenant-1',
        'item-1',
        { page: 1, pageSize: 20 },
        source as any
      )
    ).resolves.toEqual({
      mappings: [
        {
          supplierId: 'supplier-1',
          supplierItemCode: 'SUP-001',
          supplierItemName: 'Supplier Item 1',
          itemId: 'item-1'
        }
      ],
      total: 1,
      page: 1,
      pageSize: 20
    })
    await expect(
      service.upsertSupplierMapping(
        'tenant-1',
        'item-1',
        {
          supplierId: 'supplier-2',
          supplierItemCode: 'SUP-002',
          supplierItemName: 'Supplier Item 2'
        },
        source as any
      )
    ).resolves.toEqual({
      supplierId: 'supplier-2',
      supplierItemCode: 'SUP-002',
      supplierItemName: 'Supplier Item 2',
      itemId: 'item-1',
      itemCode: 'ITEM-001-REV',
      itemName: 'Starter Item Rev'
    })
    await expect(
      service.changeItemStatus(
        'tenant-1',
        'item-1',
        {
          status: 'INACTIVE'
        },
        source as any
      )
    ).resolves.toMatchObject({
      itemId: 'item-1',
      status: 'INACTIVE'
    })

    expect(itemManagementAdapter.createItem).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        itemCode: 'ITEM-001',
        itemName: 'Starter Item',
        structureType: ItemStructureType.ITEM_STRUCTURE_TYPE_SINGLE,
        natureType: ItemNatureType.ITEM_NATURE_TYPE_PHYSICAL
      },
      source
    )
    expect(itemManagementAdapter.updateItemBasics).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        itemId: 'item-1',
        itemCode: 'ITEM-001-REV',
        itemName: 'Starter Item Rev'
      },
      source
    )
    expect(itemManagementAdapter.setItemCapabilities).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        itemId: 'item-1',
        capabilities: {
          sellable: true,
          purchasable: true,
          stockable: true,
          manufacturable: false
        }
      },
      source
    )
    expect(itemManagementAdapter.setItemComposition).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        itemId: 'item-1',
        components: [{ componentItemId: 'component-2' }]
      },
      source
    )
    expect(itemManagementAdapter.upsertSupplierItemMapping).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        supplierId: 'supplier-2',
        supplierItemCode: 'SUP-002',
        supplierItemName: 'Supplier Item 2',
        itemId: 'item-1'
      },
      source
    )
    expect(itemManagementAdapter.changeItemStatus).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        itemId: 'item-1',
        targetStatus: ItemStatus.ITEM_STATUS_INACTIVE
      },
      source
    )
  })

  it('maps item category read and write operations without widening item-master ownership', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1' }
    }

    itemQueryAdapter.listItemCategories.mockResolvedValue({
      categories: [
        {
          categoryId: 'category-root',
          categoryCode: 'ROOT',
          categoryName: 'Root Category',
          parentCategoryId: '',
          status: ItemCategoryStatus.ITEM_CATEGORY_STATUS_ACTIVE,
          hasChildren: true
        }
      ]
    })
    itemManagementAdapter.createItemCategory.mockResolvedValue({
      category: {
        categoryId: 'category-child',
        categoryCode: 'FINISHED',
        categoryName: 'Finished Goods',
        parentCategoryId: 'category-root',
        status: ItemCategoryStatus.ITEM_CATEGORY_STATUS_ACTIVE
      }
    })
    itemManagementAdapter.updateItemCategoryBasics.mockResolvedValue({
      category: {
        categoryId: 'category-child',
        categoryCode: 'FINISHED-REV',
        categoryName: 'Finished Goods Rev',
        parentCategoryId: 'category-root',
        status: ItemCategoryStatus.ITEM_CATEGORY_STATUS_ACTIVE
      }
    })
    itemManagementAdapter.changeItemCategoryStatus.mockResolvedValue({
      category: {
        categoryId: 'category-child',
        categoryCode: 'FINISHED-REV',
        categoryName: 'Finished Goods Rev',
        parentCategoryId: 'category-root',
        status: ItemCategoryStatus.ITEM_CATEGORY_STATUS_INACTIVE
      }
    })
    itemManagementAdapter.setItemPrimaryCategory.mockResolvedValue({
      item: {
        itemId: 'item-1',
        itemCode: 'ITEM-001',
        itemName: 'Starter Item',
        structureType: ItemStructureType.ITEM_STRUCTURE_TYPE_SINGLE,
        natureType: ItemNatureType.ITEM_NATURE_TYPE_PHYSICAL,
        status: ItemStatus.ITEM_STATUS_ACTIVE,
        capabilities: {
          sellable: true,
          purchasable: true,
          stockable: true,
          manufacturable: false
        },
        primaryCategorySummary: {
          categoryId: 'category-child',
          categoryCode: 'FINISHED-REV',
          categoryName: 'Finished Goods Rev',
          status: ItemCategoryStatus.ITEM_CATEGORY_STATUS_ACTIVE
        }
      }
    })

    await expect(
      service.listItemCategories('tenant-1', { parentCategoryId: 'category-root' }, source as any)
    ).resolves.toEqual({
      categories: [
        {
          categoryId: 'category-root',
          categoryCode: 'ROOT',
          categoryName: 'Root Category',
          parentCategoryId: '',
          status: 'ACTIVE',
          hasChildren: true
        }
      ]
    })
    await expect(
      service.createItemCategory(
        'tenant-1',
        {
          categoryCode: 'FINISHED',
          categoryName: 'Finished Goods',
          parentCategoryId: 'category-root'
        },
        source as any
      )
    ).resolves.toEqual({
      categoryId: 'category-child',
      categoryCode: 'FINISHED',
      categoryName: 'Finished Goods',
      status: 'ACTIVE'
    })
    await expect(
      service.updateItemCategoryBasics(
        'tenant-1',
        'category-child',
        {
          categoryCode: 'FINISHED-REV',
          categoryName: 'Finished Goods Rev'
        },
        source as any
      )
    ).resolves.toEqual({
      categoryId: 'category-child',
      categoryCode: 'FINISHED-REV',
      categoryName: 'Finished Goods Rev',
      status: 'ACTIVE'
    })
    await expect(
      service.changeItemCategoryStatus(
        'tenant-1',
        'category-child',
        {
          status: 'INACTIVE'
        },
        source as any
      )
    ).resolves.toEqual({
      categoryId: 'category-child',
      categoryCode: 'FINISHED-REV',
      categoryName: 'Finished Goods Rev',
      status: 'INACTIVE'
    })
    await expect(
      service.setItemPrimaryCategory(
        'tenant-1',
        'item-1',
        {
          primaryCategoryId: 'category-child'
        },
        source as any
      )
    ).resolves.toMatchObject({
      itemId: 'item-1',
      primaryCategorySummary: {
        categoryId: 'category-child',
        categoryCode: 'FINISHED-REV',
        categoryName: 'Finished Goods Rev',
        status: 'ACTIVE'
      }
    })

    expect(itemQueryAdapter.listItemCategories).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        parentCategoryId: 'category-root'
      },
      source
    )
    expect(itemManagementAdapter.createItemCategory).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        categoryCode: 'FINISHED',
        categoryName: 'Finished Goods',
        parentCategoryId: 'category-root'
      },
      source
    )
    expect(itemManagementAdapter.updateItemCategoryBasics).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        categoryId: 'category-child',
        categoryCode: 'FINISHED-REV',
        categoryName: 'Finished Goods Rev'
      },
      source
    )
    expect(itemManagementAdapter.changeItemCategoryStatus).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        categoryId: 'category-child',
        targetStatus: ItemCategoryStatus.ITEM_CATEGORY_STATUS_INACTIVE
      },
      source
    )
    expect(itemManagementAdapter.setItemPrimaryCategory).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        itemId: 'item-1',
        categoryId: 'category-child'
      },
      source
    )
  })
})
