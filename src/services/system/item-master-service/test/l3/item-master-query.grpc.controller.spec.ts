import {
  ItemCategoryStatus,
  ItemNatureType,
  ItemStatus,
  ItemStructureType,
  ListItemCategoriesResponse,
  ListSupplierItemMappingsByItemResponse,
  SupplierItemResolutionStatus
} from '@oes/common/generated/item_master_service'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { BatchGetItemsQuery } from '../../src/application/queries/batch-get-items.query'
import {
  ListSupplierItemMappingsByItemQuery
} from '../../src/application/queries/list-supplier-item-mappings-by-item.query'
import { ResolveSupplierItemMappingQuery } from '../../src/application/queries/resolve-supplier-item-mapping.query'
import { SearchItemsQuery } from '../../src/application/queries/search-items.query'
import { ItemMasterQueryGrpcController } from '../../src/interfaces/grpc/item-master-query.grpc.controller'
import { SupplierItemResolutionView } from '../../src/application/queries/supplier-item-resolution.view'

describe('ItemMasterQueryGrpcController L3', () => {
  const createQueryBus = () => ({
    execute: jest.fn()
  })

  it('gRPC BatchGetItems / when repository returns partial miss / should preserve missing_item_ids', async () => {
    const queryBus = createQueryBus()
    const controller = new ItemMasterQueryGrpcController(queryBus as unknown as ValidatingQueryBus)

    queryBus.execute.mockResolvedValue({
      items: [],
      missingItemIds: ['item-2']
    })

    const result = await controller.batchGetItems({
      tenantId: 'tenant-1',
      itemIds: ['item-2']
    } as never)

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining<BatchGetItemsQuery>({
        tenantId: 'tenant-1',
        itemIds: ['item-2']
      })
    )
    expect(result).toEqual({
      items: [],
      missingItemIds: ['item-2']
    })
  })

  it('gRPC SearchItems / when capability filters are provided / should map them into query input and return empty page normally', async () => {
    const queryBus = createQueryBus()
    const controller = new ItemMasterQueryGrpcController(queryBus as unknown as ValidatingQueryBus)

    queryBus.execute.mockResolvedValue({
      items: [],
      total: 0,
      page: 2,
      pageSize: 10
    })

    const result = await controller.searchItems({
      tenantId: 'tenant-1',
      keyword: 'bundle',
      structureType: ItemStructureType.ITEM_STRUCTURE_TYPE_BUNDLE,
      natureType: ItemNatureType.ITEM_NATURE_TYPE_VIRTUAL,
      status: ItemStatus.ITEM_STATUS_ACTIVE,
      capabilityFilters: {
        sellable: true
      },
      page: 2,
      pageSize: 10
    } as never)

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining<SearchItemsQuery>({
        tenantId: 'tenant-1',
        keyword: 'bundle',
        structureType: ItemStructureType.ITEM_STRUCTURE_TYPE_BUNDLE,
        natureType: ItemNatureType.ITEM_NATURE_TYPE_VIRTUAL,
        status: ItemStatus.ITEM_STATUS_ACTIVE,
        capabilityFilters: {
          sellable: true
        },
        page: 2,
        pageSize: 10
      })
    )
    expect(result).toEqual({
      items: [],
      total: 0,
      page: 2,
      pageSize: 10
    })
  })

  it('gRPC SearchItems / when category coordinates are provided / should map category_id and include_descendants into query input', async () => {
    const queryBus = createQueryBus()
    const controller = new ItemMasterQueryGrpcController(queryBus as unknown as ValidatingQueryBus)

    queryBus.execute.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20
    })

    await controller.searchItems({
      tenantId: 'tenant-1',
      categoryId: 'category-root',
      includeDescendants: true
    } as never)

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining<SearchItemsQuery>({
        tenantId: 'tenant-1',
        categoryId: 'category-root',
        includeDescendants: true
      } as never)
    )
  })

  it('gRPC ListItemCategories / when request targets one parent / should map request and preserve empty child list semantics', async () => {
    const queryBus = createQueryBus()
    const controller = new ItemMasterQueryGrpcController(queryBus as unknown as ValidatingQueryBus)

    queryBus.execute.mockResolvedValue({
      categories: [
        {
          categoryId: 'category-child',
          categoryCode: 'CAT-CHILD',
          categoryName: 'Child Category',
          parentCategoryId: 'category-root',
          status: ItemCategoryStatus.ITEM_CATEGORY_STATUS_ACTIVE,
          hasChildren: false
        }
      ]
    })

    const result = await (controller as any).listItemCategories({
      tenantId: 'tenant-1',
      parentCategoryId: 'category-root'
    })

    expect(result).toEqual<ListItemCategoriesResponse>({
      categories: [
        {
          categoryId: 'category-child',
          categoryCode: 'CAT-CHILD',
          categoryName: 'Child Category',
          parentCategoryId: 'category-root',
          status: ItemCategoryStatus.ITEM_CATEGORY_STATUS_ACTIVE,
          hasChildren: false
        }
      ]
    })
  })

  it('gRPC ResolveSupplierItemMapping / when query returns NO_MATCH / should return normal response instead of throwing', async () => {
    const queryBus = createQueryBus()
    const controller = new ItemMasterQueryGrpcController(queryBus as unknown as ValidatingQueryBus)

    queryBus.execute.mockResolvedValue({
      resolutionStatus: SupplierItemResolutionView.NO_MATCH
    })

    const result = await controller.resolveSupplierItemMapping({
      tenantId: 'tenant-1',
      supplierId: 'supplier-1',
      supplierItemName: 'Unknown'
    } as never)

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining<ResolveSupplierItemMappingQuery>({
        tenantId: 'tenant-1',
        supplierId: 'supplier-1',
        supplierItemName: 'Unknown'
      })
    )
    expect(result).toEqual({
      resolutionStatus: SupplierItemResolutionStatus.SUPPLIER_ITEM_RESOLUTION_STATUS_NO_MATCH
    })
  })

  it('gRPC ListSupplierItemMappingsByItem / when query returns a page / should map request coordinates and preserve phase 1 fields only', async () => {
    const queryBus = createQueryBus()
    const controller = new ItemMasterQueryGrpcController(queryBus as unknown as ValidatingQueryBus)

    queryBus.execute.mockResolvedValue({
      mappings: [
        {
          id: 'mapping-1',
          tenantId: 'tenant-1',
          supplierId: 'supplier-1',
          supplierItemCode: 'SUP-001',
          supplierItemName: 'Supplier One',
          itemId: 'item-1'
        }
      ],
      total: 1,
      page: 2,
      pageSize: 5
    })

    const result = await controller.listSupplierItemMappingsByItem({
      tenantId: 'tenant-1',
      itemId: 'item-1',
      page: 2,
      pageSize: 5
    } as never)

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining<ListSupplierItemMappingsByItemQuery>({
        tenantId: 'tenant-1',
        itemId: 'item-1',
        page: 2,
        pageSize: 5
      })
    )
    expect(result).toEqual<ListSupplierItemMappingsByItemResponse>({
      mappings: [
        {
          supplierId: 'supplier-1',
          supplierItemCode: 'SUP-001',
          supplierItemName: 'Supplier One',
          itemId: 'item-1'
        }
      ],
      total: 1,
      page: 2,
      pageSize: 5
    })
  })
})
