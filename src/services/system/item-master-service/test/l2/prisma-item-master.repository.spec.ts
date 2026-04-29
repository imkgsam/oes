import { randomUUID } from 'node:crypto'
import { Prisma } from '../../prisma/generated/prisma'
import { SetItemPrimaryCategoryHandler } from '../../src/application/commands/set-item-primary-category.handler'
import { SetItemPrimaryCategoryCommand } from '../../src/application/commands/set-item-primary-category.command'
import { SetItemCompositionHandler } from '../../src/application/commands/set-item-composition.handler'
import { SearchItemsHandler } from '../../src/application/queries/search-items.handler'
import { SearchItemsQuery } from '../../src/application/queries/search-items.query'
import { ResolveSupplierItemMappingHandler } from '../../src/application/queries/resolve-supplier-item-mapping.handler'
import { ResolveSupplierItemMappingQuery } from '../../src/application/queries/resolve-supplier-item-mapping.query'
import { SupplierItemResolutionView } from '../../src/application/queries/supplier-item-resolution.view'
import { Item } from '../../src/domain/aggregates/item.aggregate'
import { ItemCategory } from '../../src/domain/aggregates/item-category.aggregate'
import {
  ItemCapabilities,
  ItemNatureType,
  ItemStatus,
  ItemStructureType
} from '../../src/domain/value-objects/item.value-objects'
import { ItemCategoryStatus } from '../../src/domain/value-objects/item-category.value-objects'
import { PrismaItemCategoryRepository } from '../../src/infrastructure/repositories/prisma/prisma-item-category.repository'
import { PrismaItemCompositionRepository } from '../../src/infrastructure/repositories/prisma/prisma-item-composition.repository'
import { PrismaItemRepository } from '../../src/infrastructure/repositories/prisma/prisma-item.repository'
import { PrismaSupplierItemMappingRepository } from '../../src/infrastructure/repositories/prisma/prisma-supplier-item-mapping.repository'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { cleanupByPrefix, createPrismaForIntegration, createTestPrefix } from '../helpers/integration-db'

function buildItem(input: {
  id?: string
  tenantId: string
  itemCode: string
  itemName: string
  structureType: ItemStructureType
  natureType: ItemNatureType
}): Item {
  return Item.reconstitute({
    id: input.id ?? randomUUID(),
    tenantId: input.tenantId,
    itemCode: input.itemCode,
    itemName: input.itemName,
    structureType: input.structureType,
    natureType: input.natureType,
    status: ItemStatus.ACTIVE,
    capabilities: ItemCapabilities.none()
  })
}

function buildCategory(input: {
  id?: string
  tenantId: string
  categoryCode: string
  categoryName: string
  parentCategoryId?: string
}): ItemCategory {
  return ItemCategory.reconstitute({
    id: input.id ?? randomUUID(),
    tenantId: input.tenantId,
    categoryCode: input.categoryCode,
    categoryName: input.categoryName,
    parentCategoryId: input.parentCategoryId,
    status: ItemCategoryStatus.ACTIVE
  })
}

describe('Prisma item-master repositories L2', () => {
  let prisma: PrismaService
  let itemRepository: PrismaItemRepository
  let itemCategoryRepository: PrismaItemCategoryRepository
  let itemCompositionRepository: PrismaItemCompositionRepository
  let supplierItemMappingRepository: PrismaSupplierItemMappingRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    itemRepository = new PrismaItemRepository(prisma)
    itemCategoryRepository = new PrismaItemCategoryRepository(prisma)
    itemCompositionRepository = new PrismaItemCompositionRepository(prisma)
    supplierItemMappingRepository = new PrismaSupplierItemMappingRepository(prisma)
  })

  beforeEach(async () => {
    prefix = createTestPrefix()
    await cleanupByPrefix(prisma, prefix)
  })

  afterEach(async () => {
    await cleanupByPrefix(prisma, prefix)
  })

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  it('item repository / when same tenant reuses item_code / should reject on tenant unique constraint', async () => {
    const tenantId = `${prefix}_tenant`
    const itemCode = `${prefix}_ITEM_DUP`

    await itemRepository.save(
      buildItem({
        tenantId,
        itemCode,
        itemName: `${prefix}_Item One`,
        structureType: ItemStructureType.SINGLE,
        natureType: ItemNatureType.PHYSICAL
      })
    )

    await expect(
      itemRepository.save(
        buildItem({
          tenantId,
          itemCode,
          itemName: `${prefix}_Item Two`,
          structureType: ItemStructureType.SINGLE,
          natureType: ItemNatureType.PHYSICAL
        })
      )
    ).rejects.toMatchObject<Partial<Prisma.PrismaClientKnownRequestError>>({
      code: 'P2002'
    })
  })

  it('item composition repository / when replacing components twice / should keep only the latest full replacement set', async () => {
    const tenantId = `${prefix}_tenant`
    const parent = await itemRepository.save(
      buildItem({
        tenantId,
        itemCode: `${prefix}_BUNDLE_PARENT`,
        itemName: `${prefix}_Bundle Parent`,
        structureType: ItemStructureType.BUNDLE,
        natureType: ItemNatureType.VIRTUAL
      })
    )
    const componentA = await itemRepository.save(
      buildItem({
        tenantId,
        itemCode: `${prefix}_COMP_A`,
        itemName: `${prefix}_Component A`,
        structureType: ItemStructureType.SINGLE,
        natureType: ItemNatureType.PHYSICAL
      })
    )
    const componentB = await itemRepository.save(
      buildItem({
        tenantId,
        itemCode: `${prefix}_COMP_B`,
        itemName: `${prefix}_Component B`,
        structureType: ItemStructureType.SINGLE,
        natureType: ItemNatureType.PHYSICAL
      })
    )
    const componentC = await itemRepository.save(
      buildItem({
        tenantId,
        itemCode: `${prefix}_COMP_C`,
        itemName: `${prefix}_Component C`,
        structureType: ItemStructureType.SINGLE,
        natureType: ItemNatureType.PHYSICAL
      })
    )

    await itemCompositionRepository.replaceForParent(tenantId, parent.id, [componentA.id, componentB.id])
    await itemCompositionRepository.replaceForParent(tenantId, parent.id, [componentC.id])

    const components = await itemCompositionRepository.listByParentId(tenantId, parent.id)

    expect(components).toEqual([
      {
        parentItemId: parent.id,
        componentItemId: componentC.id,
        sortOrder: 0
      }
    ])
  })

  it('supplier item mapping repository / when same tenant supplier and code are duplicated / should reject on unique constraint', async () => {
    const tenantId = `${prefix}_tenant`
    const supplierId = `${prefix}_supplier`
    const item = await itemRepository.save(
      buildItem({
        tenantId,
        itemCode: `${prefix}_ITEM_SUP`,
        itemName: `${prefix}_Supplier Item`,
        structureType: ItemStructureType.SINGLE,
        natureType: ItemNatureType.PHYSICAL
      })
    )

    await supplierItemMappingRepository.upsert({
      tenantId,
      supplierId,
      supplierItemCode: `${prefix}_SUP_CODE`,
      itemId: item.id
    })

    await expect(
      prisma.supplierItemMapping.create({
        data: {
          tenantId,
          supplierId,
          supplierItemCode: `${prefix}_SUP_CODE`,
          supplierItemCodeKey: `${prefix}_SUP_CODE`.toLowerCase(),
          itemId: item.id
        }
      })
    ).rejects.toMatchObject<Partial<Prisma.PrismaClientKnownRequestError>>({
      code: 'P2002'
    })
  })

  it('resolve supplier item mapping / when mapping exists or not / should return MATCHED and NO_MATCH on real database data', async () => {
    const tenantId = `${prefix}_tenant`
    const supplierId = `${prefix}_supplier`
    const item = await itemRepository.save(
      buildItem({
        tenantId,
        itemCode: `${prefix}_ITEM_MATCH`,
        itemName: `${prefix}_Matched Item`,
        structureType: ItemStructureType.SINGLE,
        natureType: ItemNatureType.PHYSICAL
      })
    )
    await supplierItemMappingRepository.upsert({
      tenantId,
      supplierId,
      supplierItemCode: `${prefix}_SUP_MATCH`,
      supplierItemName: `${prefix}_Supplier Matched Name`,
      itemId: item.id
    })

    const handler = new ResolveSupplierItemMappingHandler(supplierItemMappingRepository, itemRepository)

    const matched = await handler.execute(
      new ResolveSupplierItemMappingQuery({
        tenantId,
        supplierId,
        supplierItemCode: `${prefix}_SUP_MATCH`
      })
    )
    const notMatched = await handler.execute(
      new ResolveSupplierItemMappingQuery({
        tenantId,
        supplierId,
        supplierItemCode: `${prefix}_SUP_UNKNOWN`
      })
    )

    expect(matched.resolutionStatus).toBe(SupplierItemResolutionView.MATCHED)
    expect(matched.mapping).toEqual(
      expect.objectContaining({
        supplierId,
        itemId: item.id,
        itemCode: `${prefix}_ITEM_MATCH`,
        itemName: `${prefix}_Matched Item`
      })
    )
    expect(notMatched).toEqual({
      resolutionStatus: SupplierItemResolutionView.NO_MATCH
    })
  })

  it('supplier item mapping repository / when listing by item with pagination / should return one stable page without procurement fields', async () => {
    const tenantId = `${prefix}_tenant`
    const item = await itemRepository.save(
      buildItem({
        tenantId,
        itemCode: `${prefix}_ITEM_LIST`,
        itemName: `${prefix}_Listed Item`,
        structureType: ItemStructureType.SINGLE,
        natureType: ItemNatureType.PHYSICAL
      })
    )
    const otherItem = await itemRepository.save(
      buildItem({
        tenantId,
        itemCode: `${prefix}_ITEM_OTHER`,
        itemName: `${prefix}_Other Item`,
        structureType: ItemStructureType.SINGLE,
        natureType: ItemNatureType.PHYSICAL
      })
    )

    await supplierItemMappingRepository.upsert({
      tenantId,
      supplierId: `${prefix}_supplier_b`,
      supplierItemCode: `${prefix}_SUP_B`,
      supplierItemName: `${prefix}_Supplier B`,
      itemId: item.id
    })
    const first = await supplierItemMappingRepository.upsert({
      tenantId,
      supplierId: `${prefix}_supplier_a`,
      supplierItemCode: `${prefix}_SUP_A`,
      supplierItemName: `${prefix}_Supplier A`,
      itemId: item.id
    })
    await supplierItemMappingRepository.upsert({
      tenantId,
      supplierId: `${prefix}_supplier_z`,
      supplierItemCode: `${prefix}_SUP_Z`,
      supplierItemName: `${prefix}_Supplier Z`,
      itemId: otherItem.id
    })

    const result = await supplierItemMappingRepository.listByItem({
      tenantId,
      itemId: item.id,
      page: 1,
      pageSize: 1
    })

    expect(result.total).toBe(2)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(1)
    expect(result.mappings).toHaveLength(1)
    expect(result.mappings[0]).toEqual(
      expect.objectContaining({
        id: first.id,
        tenantId,
        supplierId: `${prefix}_supplier_a`,
        supplierItemCode: `${prefix}_SUP_A`,
        supplierItemName: `${prefix}_Supplier A`,
        itemId: item.id
      })
    )
  })

  it('item category repository / when tree has root and child nodes / should list one layer and compute descendant ids', async () => {
    const tenantId = `${prefix}_tenant`
    const root = await itemCategoryRepository.save(
      buildCategory({
        tenantId,
        categoryCode: `${prefix}_CAT_ROOT`,
        categoryName: `${prefix}_Root Category`
      })
    )
    const child = await itemCategoryRepository.save(
      buildCategory({
        tenantId,
        categoryCode: `${prefix}_CAT_CHILD`,
        categoryName: `${prefix}_Child Category`,
        parentCategoryId: root.id
      })
    )
    await itemCategoryRepository.save(
      buildCategory({
        tenantId,
        categoryCode: `${prefix}_CAT_GRAND`,
        categoryName: `${prefix}_Grand Category`,
        parentCategoryId: child.id
      })
    )

    const rootLayer = await itemCategoryRepository.listByParentId(tenantId)
    const descendants = await itemCategoryRepository.listDescendantIds(tenantId, root.id)

    expect(rootLayer).toEqual([
      expect.objectContaining({
        categoryId: root.id,
        categoryCode: `${prefix}_CAT_ROOT`,
        hasChildren: true
      })
    ])
    expect(descendants).toEqual([child.id, expect.any(String)])
  })

  it('item primary category + SearchItems / when include_descendants is true / should persist and filter by primary-category subtree only', async () => {
    const tenantId = `${prefix}_tenant`
    const root = await itemCategoryRepository.save(
      buildCategory({
        tenantId,
        categoryCode: `${prefix}_CAT_FILTER_ROOT`,
        categoryName: `${prefix}_Filter Root`
      })
    )
    const child = await itemCategoryRepository.save(
      buildCategory({
        tenantId,
        categoryCode: `${prefix}_CAT_FILTER_CHILD`,
        categoryName: `${prefix}_Filter Child`,
        parentCategoryId: root.id
      })
    )
    const outside = await itemCategoryRepository.save(
      buildCategory({
        tenantId,
        categoryCode: `${prefix}_CAT_FILTER_OUTSIDE`,
        categoryName: `${prefix}_Filter Outside`
      })
    )
    const childItem = await itemRepository.save(
      buildItem({
        tenantId,
        itemCode: `${prefix}_ITEM_CHILD`,
        itemName: `${prefix}_Child Item`,
        structureType: ItemStructureType.SINGLE,
        natureType: ItemNatureType.PHYSICAL
      })
    )
    const outsideItem = await itemRepository.save(
      buildItem({
        tenantId,
        itemCode: `${prefix}_ITEM_OUTSIDE`,
        itemName: `${prefix}_Outside Item`,
        structureType: ItemStructureType.SINGLE,
        natureType: ItemNatureType.PHYSICAL
      })
    )

    const setPrimaryCategoryHandler = new SetItemPrimaryCategoryHandler(itemRepository, itemCategoryRepository)
    await setPrimaryCategoryHandler.execute(
      new SetItemPrimaryCategoryCommand({
        tenantId,
        itemId: childItem.id,
        categoryId: child.id
      })
    )
    await setPrimaryCategoryHandler.execute(
      new SetItemPrimaryCategoryCommand({
        tenantId,
        itemId: outsideItem.id,
        categoryId: outside.id
      })
    )

    const searchHandler = new SearchItemsHandler(itemCategoryRepository, itemRepository)
    const result = await searchHandler.execute(
      new SearchItemsQuery({
        tenantId,
        categoryId: root.id,
        includeDescendants: true
      })
    )

    expect(result.items.map((item) => item.id)).toEqual([childItem.id])
    expect(result.items[0].primaryCategory).toEqual({
      categoryId: child.id,
      categoryCode: `${prefix}_CAT_FILTER_CHILD`,
      categoryName: `${prefix}_Filter Child`,
      status: ItemCategoryStatus.ACTIVE
    })
  })
})
