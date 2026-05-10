import {
  BomLineRole,
  BomType,
  ItemModelKind,
  ItemModelType,
  ItemType
} from '@oes/common/generated/item_master_service'
import { ItemMasterManagementV2Service } from '../../src/application/item-master-v2.service'

function createPrismaMock(overrides: Record<string, any> = {}): any {
  const prisma: any = {
    itemModel: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn()
    },
    item: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn()
    },
    packagingSpec: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn()
    },
    bom: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn()
    },
    bomLine: {
      deleteMany: jest.fn()
    },
    itemModelAttributeRule: {
      findMany: jest.fn().mockResolvedValue([])
    },
    runInTransaction: jest.fn(async (callback) => callback()),
    getExecutionClient: jest.fn()
  }
  prisma.getExecutionClient.mockReturnValue(prisma)

  return deepMerge(prisma, overrides)
}

function deepMerge<T extends Record<string, any>>(target: T, source: Record<string, any>): T {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && key in target) {
      deepMerge(target[key], value)
    } else {
      target[key as keyof T] = value as T[keyof T]
    }
  }
  return target
}

const activeModel = {
  id: 'model-1',
  tenantId: 'tenant-1',
  active: true,
  sellable: false,
  purchasable: false,
  stockable: false,
  manufacturable: false,
  assemblable: false,
  transformable: false,
  packable: false,
  packaged: false,
  modelKind: 'PHYSICAL',
  modelType: 'FINISHED_PRODUCT',
  modelCode: 'M-1',
  modelName: 'Model 1',
  primaryCategory: null
}

/** item-master V2 application service tests assert the new contract invariants before persistence. */
describe('ItemMasterManagementV2Service', () => {
  it('rejects packaged finished goods without packaging spec', async () => {
    const prisma = createPrismaMock({
      itemModel: {
        findFirst: jest.fn().mockResolvedValue(activeModel)
      }
    })
    const service = new ItemMasterManagementV2Service(prisma)

    await expect(
      service.createItem({
        tenantId: 'tenant-1',
        itemModelId: 'model-1',
        itemCode: 'ITEM-1',
        itemName: 'Item 1',
        itemType: ItemType.ITEM_TYPE_PACKAGED_FINISHED_GOOD,
        capabilities: { packaged: true }
      })
    ).rejects.toBeDefined()
  })

  it('rejects clearing packaged capability on packaged finished goods', async () => {
    const prisma = createPrismaMock({
      item: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'item-1',
          tenantId: 'tenant-1',
          itemType: 'PACKAGED_FINISHED_GOOD',
          active: true,
          itemModel: activeModel
        })
      }
    })
    const service = new ItemMasterManagementV2Service(prisma)

    await expect(
      service.setItemCapabilities({
        tenantId: 'tenant-1',
        itemId: 'item-1',
        capabilities: { packaged: false }
      })
    ).rejects.toBeDefined()
  })

  it('rejects BOM lines that reference inactive component Items', async () => {
    const prisma = createPrismaMock({
      item: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'output-item',
          tenantId: 'tenant-1',
          active: true,
          packaged: true,
          itemType: 'PACKAGED_FINISHED_GOOD',
          itemModel: activeModel
        }),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'inactive-component',
            tenantId: 'tenant-1',
            active: false,
            packable: true,
            itemType: 'STANDARD',
            itemModel: activeModel
          }
        ])
      }
    })
    const service = new ItemMasterManagementV2Service(prisma)

    await expect(
      service.createBom({
        tenantId: 'tenant-1',
        bomCode: 'BOM-1',
        bomName: 'Packaging BOM',
        bomType: BomType.BOM_TYPE_PACKAGING,
        outputItemId: 'output-item',
        lines: [
          {
            componentItemId: 'inactive-component',
            lineRole: BomLineRole.BOM_LINE_ROLE_PRIMARY_INPUT,
            quantity: '1',
            uomCode: 'EA'
          }
        ]
      })
    ).rejects.toBeDefined()
  })

  it('creates ItemModel with model kind and model type from Contract V2', async () => {
    const prisma = createPrismaMock({
      itemModel: {
        create: jest.fn().mockResolvedValue({
          ...activeModel,
          id: 'model-2',
          modelCode: 'M-2',
          modelName: 'Model 2'
        })
      }
    })
    const service = new ItemMasterManagementV2Service(prisma)

    const result = await service.createItemModel({
      tenantId: 'tenant-1',
      modelCode: 'M-2',
      modelName: 'Model 2',
      modelKind: ItemModelKind.ITEM_MODEL_KIND_PHYSICAL,
      modelType: ItemModelType.ITEM_MODEL_TYPE_FINISHED_PRODUCT
    })

    expect(result.itemModelId).toBe('model-2')
    expect(prisma.itemModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          modelKind: 'PHYSICAL',
          modelType: 'FINISHED_PRODUCT'
        })
      })
    )
  })
})
