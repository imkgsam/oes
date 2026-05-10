import 'reflect-metadata'
import { Reflector } from '@nestjs/core'
import { PERMISSION_CHECK_KEY } from '@oes/common/authorization'
import { ItemManagementController } from './item-management.controller'

const source = {
  user: {
    scopeLevel: 'TENANT',
    tenantId: 'tenant-1'
  }
}

/** item-management controller specs keep the HTTP BFF surface aligned with item-master V2 concepts. */
describe('ItemManagementController V2', () => {
  const itemManagementService = {
    changeBomStatus: jest.fn(),
    changeItemCategoryStatus: jest.fn(),
    changeItemModelStatus: jest.fn(),
    changeItemStatus: jest.fn(),
    createBom: jest.fn(),
    createItem: jest.fn(),
    createItemCategory: jest.fn(),
    createItemModel: jest.fn(),
    getBom: jest.fn(),
    getBomByOutputItem: jest.fn(),
    getItem: jest.fn(),
    getItemModel: jest.fn(),
    listBoms: jest.fn(),
    listItemCategories: jest.fn(),
    listItemModels: jest.fn(),
    listItems: jest.fn(),
    listSupplierMappings: jest.fn(),
    replaceBomLines: jest.fn(),
    setItemCapabilities: jest.fn(),
    setItemModelCapabilities: jest.fn(),
    setItemModelPrimaryCategory: jest.fn(),
    updateBomBasics: jest.fn(),
    updateItemBasics: jest.fn(),
    updateItemCategoryBasics: jest.fn(),
    updateItemModelBasics: jest.fn(),
    upsertSupplierMapping: jest.fn()
  }
  const controller = new ItemManagementController(itemManagementService as never)

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('attaches permissions to V2 ItemModel, Item, and BOM entrypoints', () => {
    const reflector = new Reflector()

    expect(reflector.get(PERMISSION_CHECK_KEY, ItemManagementController.prototype.listItemModels)).toMatchObject({
      permissions: ['item_master.item_model.list'],
      type: 'ALL'
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, ItemManagementController.prototype.createItem)).toMatchObject({
      permissions: ['item_master.item.create'],
      type: 'ALL'
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, ItemManagementController.prototype.createBom)).toMatchObject({
      permissions: ['item_master.bom.create'],
      type: 'ALL'
    })
  })

  it('delegates ItemModel creation to the V2 BFF service', async () => {
    itemManagementService.createItemModel.mockResolvedValue({ itemModelId: 'model-1' })

    await expect(
      controller.createItemModel(
        'tenant-1',
        {
          modelCode: 'MODEL-1',
          modelName: 'Model 1',
          modelKind: 'PHYSICAL',
          modelType: 'FINISHED_PRODUCT'
        },
        source as never
      )
    ).resolves.toEqual({ itemModelId: 'model-1' })

    expect(itemManagementService.createItemModel).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        modelCode: 'MODEL-1',
        modelKind: 'PHYSICAL'
      }),
      source
    )
  })

  it('delegates executable Item creation with itemModelId and itemType', async () => {
    itemManagementService.createItem.mockResolvedValue({ itemId: 'item-1' })

    await expect(
      controller.createItem(
        'tenant-1',
        {
          itemModelId: 'model-1',
          itemCode: 'SKU-1',
          itemName: 'SKU 1',
          itemType: 'STANDARD'
        },
        source as never
      )
    ).resolves.toEqual({ itemId: 'item-1' })

    expect(itemManagementService.createItem).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        itemModelId: 'model-1',
        itemType: 'STANDARD'
      }),
      source
    )
  })

  it('delegates BOM line replacement instead of old composition endpoints', async () => {
    itemManagementService.replaceBomLines.mockResolvedValue({ bomId: 'bom-1' })

    await expect(
      controller.replaceBomLines(
        'tenant-1',
        'bom-1',
        {
          lines: [
            {
              componentItemId: 'item-1',
              lineRole: 'COMPONENT',
              quantity: '1',
              uomCode: 'PCS'
            }
          ]
        },
        source as never
      )
    ).resolves.toEqual({ bomId: 'bom-1' })

    expect(itemManagementService.replaceBomLines).toHaveBeenCalledWith(
      'tenant-1',
      'bom-1',
      expect.objectContaining({
        lines: [
          expect.objectContaining({
            componentItemId: 'item-1',
            lineRole: 'COMPONENT'
          })
        ]
      }),
      source
    )
  })
})
