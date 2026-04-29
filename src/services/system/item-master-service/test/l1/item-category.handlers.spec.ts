import { status } from '@grpc/grpc-js'
import { CreateItemCategoryCommand } from '../../src/application/commands/create-item-category.command'
import { CreateItemCategoryHandler } from '../../src/application/commands/create-item-category.handler'
import { SetItemPrimaryCategoryCommand } from '../../src/application/commands/set-item-primary-category.command'
import { SetItemPrimaryCategoryHandler } from '../../src/application/commands/set-item-primary-category.handler'
import { ChangeItemCategoryStatusCommand } from '../../src/application/commands/change-item-category-status.command'
import { ChangeItemCategoryStatusHandler } from '../../src/application/commands/change-item-category-status.handler'
import { ListItemCategoriesHandler } from '../../src/application/queries/list-item-categories.handler'
import { ListItemCategoriesQuery } from '../../src/application/queries/list-item-categories.query'
import { Item } from '../../src/domain/aggregates/item.aggregate'
import { ItemCategory } from '../../src/domain/aggregates/item-category.aggregate'
import { ItemCategoryRepository } from '../../src/domain/repositories/item-category.repository'
import { ItemRepository } from '../../src/domain/repositories/item.repository'
import {
  ItemCategoryStatus,
  ItemCategoryTreeNode
} from '../../src/domain/value-objects/item-category.value-objects'
import {
  ItemCapabilities,
  ItemNatureType,
  ItemStatus,
  ItemStructureType
} from '../../src/domain/value-objects/item.value-objects'

function createItemRepositoryMock(): jest.Mocked<ItemRepository> {
  return {
    findById: jest.fn(),
    findByIds: jest.fn(),
    findByCode: jest.fn(),
    save: jest.fn(),
    search: jest.fn()
  }
}

function createItemCategoryRepositoryMock(): jest.Mocked<ItemCategoryRepository> {
  return {
    findById: jest.fn(),
    findByCode: jest.fn(),
    save: jest.fn(),
    listByParentId: jest.fn(),
    listDescendantIds: jest.fn()
  }
}

function buildItem(overrides: Partial<Parameters<typeof Item.reconstitute>[0]> = {}): Item {
  return Item.reconstitute({
    id: 'item-1',
    tenantId: 'tenant-1',
    itemCode: 'ITEM-001',
    itemName: 'Demo Item',
    structureType: ItemStructureType.SINGLE,
    natureType: ItemNatureType.PHYSICAL,
    status: ItemStatus.ACTIVE,
    capabilities: ItemCapabilities.none(),
    ...overrides
  })
}

function buildCategory(overrides: Partial<Parameters<typeof ItemCategory.reconstitute>[0]> = {}): ItemCategory {
  return ItemCategory.reconstitute({
    id: 'category-1',
    tenantId: 'tenant-1',
    categoryCode: 'CAT-001',
    categoryName: 'Root Category',
    status: ItemCategoryStatus.ACTIVE,
    ...overrides
  })
}

describe('Item category handlers L1', () => {
  it('ListItemCategories / when parent exists but has no children / should return a normal empty layer', async () => {
    const itemCategoryRepository = createItemCategoryRepositoryMock()
    const handler = new ListItemCategoriesHandler(itemCategoryRepository)

    itemCategoryRepository.findById.mockResolvedValue(buildCategory())
    itemCategoryRepository.listByParentId.mockResolvedValue([])

    const result = await handler.execute(
      new ListItemCategoriesQuery({
        tenantId: 'tenant-1',
        parentCategoryId: 'category-1'
      })
    )

    expect(result).toEqual({
      categories: []
    })
  })

  it('ListItemCategories / when parent category does not exist / should reject with NOT_FOUND', async () => {
    const itemCategoryRepository = createItemCategoryRepositoryMock()
    const handler = new ListItemCategoriesHandler(itemCategoryRepository)

    itemCategoryRepository.findById.mockResolvedValue(null)

    await expect(
      handler.execute(
        new ListItemCategoriesQuery({
          tenantId: 'tenant-1',
          parentCategoryId: 'missing-category'
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.NOT_FOUND
      }
    })
  })

  it('CreateItemCategory / when parent category does not exist / should reject with NOT_FOUND', async () => {
    const itemCategoryRepository = createItemCategoryRepositoryMock()
    const handler = new CreateItemCategoryHandler(itemCategoryRepository)

    itemCategoryRepository.findById.mockResolvedValue(null)

    await expect(
      handler.execute(
        new CreateItemCategoryCommand({
          tenantId: 'tenant-1',
          categoryCode: 'CAT-CHILD',
          categoryName: 'Child Category',
          parentCategoryId: 'missing-parent'
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.NOT_FOUND
      }
    })
  })

  it('SetItemPrimaryCategory / when category exists / should persist one primary category summary on the item', async () => {
    const itemRepository = createItemRepositoryMock()
    const itemCategoryRepository = createItemCategoryRepositoryMock()
    const handler = new SetItemPrimaryCategoryHandler(itemRepository, itemCategoryRepository)

    const item = buildItem()
    const category = buildCategory()
    itemRepository.findById.mockResolvedValue(item)
    itemCategoryRepository.findById.mockResolvedValue(category)
    itemRepository.save.mockImplementation(async (saved) => saved)

    const result = await handler.execute(
      new SetItemPrimaryCategoryCommand({
        tenantId: 'tenant-1',
        itemId: 'item-1',
        categoryId: 'category-1'
      })
    )

    expect(itemRepository.save).toHaveBeenCalled()
    expect(result.primaryCategory).toEqual({
      categoryId: 'category-1',
      categoryCode: 'CAT-001',
      categoryName: 'Root Category',
      status: ItemCategoryStatus.ACTIVE
    })
  })

  it('ChangeItemCategoryStatus / when target status is the same / should return category without saving', async () => {
    const itemCategoryRepository = createItemCategoryRepositoryMock()
    const handler = new ChangeItemCategoryStatusHandler(itemCategoryRepository)
    const category = buildCategory({
      status: ItemCategoryStatus.ACTIVE
    })

    itemCategoryRepository.findById.mockResolvedValue(category)

    const result = await handler.execute(
      new ChangeItemCategoryStatusCommand({
        tenantId: 'tenant-1',
        categoryId: 'category-1',
        targetStatus: ItemCategoryStatus.ACTIVE
      })
    )

    expect(result.status).toBe(ItemCategoryStatus.ACTIVE)
    expect(itemCategoryRepository.save).not.toHaveBeenCalled()
  })

  it('ListItemCategories / when root has direct children / should preserve has_children metadata', async () => {
    const itemCategoryRepository = createItemCategoryRepositoryMock()
    const handler = new ListItemCategoriesHandler(itemCategoryRepository)

    const layer: ItemCategoryTreeNode[] = [
      {
        categoryId: 'category-1',
        categoryCode: 'CAT-001',
        categoryName: 'Root Category',
        status: ItemCategoryStatus.ACTIVE,
        hasChildren: true
      }
    ]
    itemCategoryRepository.listByParentId.mockResolvedValue(layer)

    const result = await handler.execute(
      new ListItemCategoriesQuery({
        tenantId: 'tenant-1'
      })
    )

    expect(result.categories).toEqual(layer)
  })
})
