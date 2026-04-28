import { status } from '@grpc/grpc-js'
import { BatchGetItemsQuery } from '../../src/application/queries/batch-get-items.query'
import { BatchGetItemsHandler } from '../../src/application/queries/batch-get-items.handler'
import {
  ListSupplierItemMappingsByItemHandler
} from '../../src/application/queries/list-supplier-item-mappings-by-item.handler'
import {
  ListSupplierItemMappingsByItemQuery
} from '../../src/application/queries/list-supplier-item-mappings-by-item.query'
import { ResolveSupplierItemMappingQuery } from '../../src/application/queries/resolve-supplier-item-mapping.query'
import { ResolveSupplierItemMappingHandler } from '../../src/application/queries/resolve-supplier-item-mapping.handler'
import { SearchItemsQuery } from '../../src/application/queries/search-items.query'
import { SearchItemsHandler } from '../../src/application/queries/search-items.handler'
import { Item } from '../../src/domain/aggregates/item.aggregate'
import {
  ItemCapabilities,
  ItemNatureType,
  ItemStatus,
  ItemStructureType
} from '../../src/domain/value-objects/item.value-objects'
import { ItemRepository } from '../../src/domain/repositories/item.repository'
import {
  SupplierItemMapping,
  SupplierItemMappingRepository
} from '../../src/domain/repositories/supplier-item-mapping.repository'
import { SupplierItemResolutionStatus } from '../../src/application/queries/supplier-item-resolution.view'

function createItemRepositoryMock(): jest.Mocked<ItemRepository> {
  return {
    findById: jest.fn(),
    findByIds: jest.fn(),
    findByCode: jest.fn(),
    save: jest.fn(),
    search: jest.fn()
  }
}

function createSupplierMappingRepositoryMock(): jest.Mocked<SupplierItemMappingRepository> {
  return {
    upsert: jest.fn(),
    resolve: jest.fn(),
    listByItem: jest.fn()
  }
}

function buildItem(id: string, overrides: Partial<Parameters<typeof Item.reconstitute>[0]> = {}): Item {
  return Item.reconstitute({
    id,
    tenantId: 'tenant-1',
    itemCode: `ITEM-${id}`,
    itemName: `Item ${id}`,
    structureType: ItemStructureType.SINGLE,
    natureType: ItemNatureType.PHYSICAL,
    status: ItemStatus.ACTIVE,
    capabilities: ItemCapabilities.none(),
    ...overrides
  })
}

describe('Item query handlers L1', () => {
  it('BatchGetItems / when some item ids are missing / should return items and missing_item_ids separately', async () => {
    const itemRepository = createItemRepositoryMock()
    const handler = new BatchGetItemsHandler(itemRepository)

    itemRepository.findByIds.mockResolvedValue([buildItem('item-1')])

    const result = await handler.execute(
      new BatchGetItemsQuery({
        tenantId: 'tenant-1',
        itemIds: ['item-1', 'item-2']
      })
    )

    expect(result.items.map((item) => item.id)).toEqual(['item-1'])
    expect(result.missingItemIds).toEqual(['item-2'])
  })

  it('SearchItems / when capability filters are present / should pass them through to repository search', async () => {
    const itemRepository = createItemRepositoryMock()
    const handler = new SearchItemsHandler(itemRepository)

    itemRepository.search.mockResolvedValue({
      items: [buildItem('item-1')],
      total: 1,
      page: 1,
      pageSize: 20
    })

    const result = await handler.execute(
      new SearchItemsQuery({
        tenantId: 'tenant-1',
        capabilityFilters: {
          sellable: true,
          stockable: true
        }
      })
    )

    expect(itemRepository.search).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        capabilityFilters: {
          sellable: true,
          stockable: true
        }
      })
    )
    expect(result.total).toBe(1)
  })

  it('ResolveSupplierItemMapping / when mapping exists / should return MATCHED', async () => {
    const itemRepository = createItemRepositoryMock()
    const mappingRepository = createSupplierMappingRepositoryMock()
    const handler = new ResolveSupplierItemMappingHandler(mappingRepository, itemRepository)

    const mapping: SupplierItemMapping = {
      id: 'mapping-1',
      tenantId: 'tenant-1',
      supplierId: 'supplier-1',
      supplierItemCode: 'SUP-001',
      supplierItemName: 'Supplier Item',
      itemId: 'item-1'
    }

    mappingRepository.resolve.mockResolvedValue(mapping)
    itemRepository.findById.mockResolvedValue(buildItem('item-1'))

    const result = await handler.execute(
      new ResolveSupplierItemMappingQuery({
        tenantId: 'tenant-1',
        supplierId: 'supplier-1',
        supplierItemCode: 'SUP-001'
      })
    )

    expect(result.resolutionStatus).toBe(SupplierItemResolutionStatus.MATCHED)
    expect(result.mapping?.itemId).toBe('item-1')
  })

  it('ResolveSupplierItemMapping / when mapping does not exist / should return NO_MATCH without throwing', async () => {
    const itemRepository = createItemRepositoryMock()
    const mappingRepository = createSupplierMappingRepositoryMock()
    const handler = new ResolveSupplierItemMappingHandler(mappingRepository, itemRepository)

    mappingRepository.resolve.mockResolvedValue(null)

    const result = await handler.execute(
      new ResolveSupplierItemMappingQuery({
        tenantId: 'tenant-1',
        supplierId: 'supplier-1',
        supplierItemName: 'Unknown'
      })
    )

    expect(result.resolutionStatus).toBe(SupplierItemResolutionStatus.NO_MATCH)
    expect(result.mapping).toBeUndefined()
    expect(itemRepository.findById).not.toHaveBeenCalled()
  })

  it('ListSupplierItemMappingsByItem / when mappings exist / should return paged mappings for an existing item', async () => {
    const itemRepository = createItemRepositoryMock()
    const mappingRepository = createSupplierMappingRepositoryMock()
    const handler = new ListSupplierItemMappingsByItemHandler(mappingRepository, itemRepository)

    itemRepository.findById.mockResolvedValue(buildItem('item-1'))
    mappingRepository.listByItem.mockResolvedValue({
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
      total: 3,
      page: 2,
      pageSize: 1
    })

    const result = await handler.execute(
      new ListSupplierItemMappingsByItemQuery({
        tenantId: 'tenant-1',
        itemId: 'item-1',
        page: 2,
        pageSize: 1
      })
    )

    expect(itemRepository.findById).toHaveBeenCalledWith('tenant-1', 'item-1')
    expect(mappingRepository.listByItem).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      itemId: 'item-1',
      page: 2,
      pageSize: 1
    })
    expect(result).toEqual({
      mappings: [
        expect.objectContaining({
          supplierId: 'supplier-1',
          supplierItemCode: 'SUP-001',
          supplierItemName: 'Supplier One',
          itemId: 'item-1'
        })
      ],
      total: 3,
      page: 2,
      pageSize: 1
    })
  })

  it('ListSupplierItemMappingsByItem / when item exists but has no mappings / should return an empty page', async () => {
    const itemRepository = createItemRepositoryMock()
    const mappingRepository = createSupplierMappingRepositoryMock()
    const handler = new ListSupplierItemMappingsByItemHandler(mappingRepository, itemRepository)

    itemRepository.findById.mockResolvedValue(buildItem('item-1'))
    mappingRepository.listByItem.mockResolvedValue({
      mappings: [],
      total: 0,
      page: 1,
      pageSize: 20
    })

    const result = await handler.execute(
      new ListSupplierItemMappingsByItemQuery({
        tenantId: 'tenant-1',
        itemId: 'item-1'
      })
    )

    expect(result).toEqual({
      mappings: [],
      total: 0,
      page: 1,
      pageSize: 20
    })
  })

  it('ListSupplierItemMappingsByItem / when item does not exist / should reject with NOT_FOUND', async () => {
    const itemRepository = createItemRepositoryMock()
    const mappingRepository = createSupplierMappingRepositoryMock()
    const handler = new ListSupplierItemMappingsByItemHandler(mappingRepository, itemRepository)

    itemRepository.findById.mockResolvedValue(null)

    await expect(
      handler.execute(
        new ListSupplierItemMappingsByItemQuery({
          tenantId: 'tenant-1',
          itemId: 'missing-item'
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.NOT_FOUND
      }
    })
    expect(mappingRepository.listByItem).not.toHaveBeenCalled()
  })

  it('ListSupplierItemMappingsByItem / when required fields are missing / should reject with INVALID_ARGUMENT', async () => {
    const itemRepository = createItemRepositoryMock()
    const mappingRepository = createSupplierMappingRepositoryMock()
    const handler = new ListSupplierItemMappingsByItemHandler(mappingRepository, itemRepository)

    await expect(
      handler.execute(
        new ListSupplierItemMappingsByItemQuery({
          tenantId: '',
          itemId: 'item-1'
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.INVALID_ARGUMENT
      }
    })

    await expect(
      handler.execute(
        new ListSupplierItemMappingsByItemQuery({
          tenantId: 'tenant-1',
          itemId: '',
          page: 0,
          pageSize: 20
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.INVALID_ARGUMENT
      }
    })
    expect(itemRepository.findById).not.toHaveBeenCalled()
  })
})
