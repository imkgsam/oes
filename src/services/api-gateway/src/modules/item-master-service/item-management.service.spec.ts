import {
  BomLineRole,
  BomType,
  ItemModelKind,
  ItemModelType,
  ItemType
} from '@oes/common/generated/item_master_service'
import { ItemManagementService } from './item-management.service'

const source = {
  user: {
    scopeLevel: 'TENANT',
    tenantId: 'tenant-1'
  }
}

/** item-management service specs protect the API Gateway mapping layer against item-master Contract V2 drift. */
describe('ItemManagementService V2 BFF mapping', () => {
  const itemQueryAdapter = {
    getBomByOutputItem: jest.fn(),
    getItem: jest.fn(),
    getItemModel: jest.fn(),
    listItemCategories: jest.fn(),
    listSupplierItemMappingsByItem: jest.fn(),
    searchBoms: jest.fn(),
    searchItemModels: jest.fn(),
    searchItems: jest.fn()
  }
  const itemManagementAdapter = {
    changeBomStatus: jest.fn(),
    changeItemCategoryStatus: jest.fn(),
    changeItemModelStatus: jest.fn(),
    changeItemStatus: jest.fn(),
    createBom: jest.fn(),
    createItem: jest.fn(),
    createItemCategory: jest.fn(),
    createItemModel: jest.fn(),
    replaceBomLines: jest.fn(),
    setItemCapabilities: jest.fn(),
    setItemModelCapabilities: jest.fn(),
    setItemModelPrimaryCategory: jest.fn(),
    updateBomBasics: jest.fn(),
    updateItemBasics: jest.fn(),
    updateItemCategoryBasics: jest.fn(),
    updateItemModelBasics: jest.fn(),
    upsertSupplierItemMapping: jest.fn()
  }
  let service: ItemManagementService

  beforeEach(() => {
    jest.resetAllMocks()
    service = new ItemManagementService(itemQueryAdapter as never, itemManagementAdapter as never)
  })

  it('lists ItemModels with V2 model kind, model type, active status, and eight capability filters', async () => {
    itemQueryAdapter.searchItemModels.mockResolvedValue({
      itemModels: [
        {
          itemModelId: 'model-1',
          modelCode: 'TOILET-100',
          modelName: 'Toilet 100',
          modelKind: ItemModelKind.ITEM_MODEL_KIND_PHYSICAL,
          modelType: ItemModelType.ITEM_MODEL_TYPE_FINISHED_PRODUCT,
          active: true,
          capabilities: {
            sellable: true,
            purchasable: false,
            stockable: true,
            manufacturable: true,
            assemblable: false,
            transformable: false,
            packable: true,
            packaged: false
          }
        }
      ],
      total: 1,
      page: 1,
      pageSize: 20
    })

    await expect(
      service.listItemModels(
        'tenant-1',
        {
          capabilities: ['sellable', 'packable'],
          modelKind: 'PHYSICAL',
          modelType: 'FINISHED_PRODUCT',
          status: 'ACTIVE'
        },
        source as never
      )
    ).resolves.toMatchObject({
      itemModels: [
        {
          itemModelId: 'model-1',
          modelKind: 'PHYSICAL',
          modelType: 'FINISHED_PRODUCT',
          status: 'ACTIVE',
          capabilities: {
            sellable: true,
            stockable: true,
            manufacturable: true,
            packable: true,
            packaged: false
          }
        }
      ]
    })

    expect(itemQueryAdapter.searchItemModels).toHaveBeenCalledWith(
      expect.objectContaining({
        active: true,
        capabilityFilters: expect.objectContaining({
          sellable: true,
          packable: true
        }),
        modelKind: ItemModelKind.ITEM_MODEL_KIND_PHYSICAL,
        modelType: ItemModelType.ITEM_MODEL_TYPE_FINISHED_PRODUCT
      }),
      source
    )
  })

  it('creates executable Items against an ItemModel and passes all V2 capabilities', async () => {
    itemManagementAdapter.createItem.mockResolvedValue({
      itemId: 'item-1',
      item: {
        itemId: 'item-1',
        itemModelId: 'model-1',
        itemCode: 'SKU-1',
        itemName: 'SKU 1',
        itemType: ItemType.ITEM_TYPE_STANDARD,
        active: true,
        capabilities: {
          sellable: true,
          purchasable: false,
          stockable: true,
          manufacturable: true,
          assemblable: true,
          transformable: false,
          packable: true,
          packaged: false
        }
      }
    })

    await expect(
      service.createItem(
        'tenant-1',
        {
          itemModelId: 'model-1',
          itemCode: 'SKU-1',
          itemName: 'SKU 1',
          itemType: 'STANDARD',
          lockedAttributeOptionIds: ['opt-1'],
          capabilities: {
            sellable: true,
            purchasable: false,
            stockable: true,
            manufacturable: true,
            assemblable: true,
            transformable: false,
            packable: true,
            packaged: false
          }
        },
        source as never
      )
    ).resolves.toMatchObject({
      itemId: 'item-1',
      item: {
        itemModelId: 'model-1',
        itemType: 'STANDARD',
        capabilities: {
          assemblable: true,
          packable: true
        }
      }
    })

    expect(itemManagementAdapter.createItem).toHaveBeenCalledWith(
      expect.objectContaining({
        itemModelId: 'model-1',
        itemType: ItemType.ITEM_TYPE_STANDARD,
        lockedAttributeOptionIds: ['opt-1'],
        capabilities: expect.objectContaining({
          assemblable: true,
          transformable: false,
          packable: true,
          packaged: false
        })
      }),
      source
    )
  })

  it('creates BOMs with typed output and component lines', async () => {
    itemManagementAdapter.createBom.mockResolvedValue({
      bomId: 'bom-1',
      bom: {
        bomId: 'bom-1',
        bomCode: 'BOM-1',
        bomName: 'Composition BOM',
        bomType: BomType.BOM_TYPE_COMPOSITION,
        outputItemId: 'item-out',
        active: true,
        lines: [
          {
            bomLineId: 'line-1',
            componentItemId: 'item-in',
            lineRole: BomLineRole.BOM_LINE_ROLE_COMPONENT,
            quantity: '1',
            uomCode: 'PCS'
          }
        ]
      }
    })

    await expect(
      service.createBom(
        'tenant-1',
        {
          bomCode: 'BOM-1',
          bomName: 'Composition BOM',
          bomType: 'COMPOSITION',
          outputItemId: 'item-out',
          lines: [
            {
              componentItemId: 'item-in',
              lineRole: 'COMPONENT',
              quantity: '1',
              uomCode: 'PCS'
            }
          ]
        },
        source as never
      )
    ).resolves.toMatchObject({
      bomId: 'bom-1',
      bom: {
        bomType: 'COMPOSITION',
        lines: [
          {
            componentItemId: 'item-in',
            lineRole: 'COMPONENT'
          }
        ]
      }
    })

    expect(itemManagementAdapter.createBom).toHaveBeenCalledWith(
      expect.objectContaining({
        bomType: BomType.BOM_TYPE_COMPOSITION,
        lines: [
          expect.objectContaining({
            componentItemId: 'item-in',
            lineRole: BomLineRole.BOM_LINE_ROLE_COMPONENT
          })
        ]
      }),
      source
    )
  })
})
