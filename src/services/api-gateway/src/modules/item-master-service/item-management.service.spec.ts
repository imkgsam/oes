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
    getItemModelAttributeRules: jest.fn(),
    getBomByOutputItem: jest.fn(),
    getItem: jest.fn(),
    getItemModel: jest.fn(),
    getPackagingSpec: jest.fn(),
    listAttributeDefinitions: jest.fn(),
    listAttributeOptions: jest.fn(),
    listItemCategories: jest.fn(),
    listPackagingMethods: jest.fn(),
    listSupplierItemMappingsByItem: jest.fn(),
    searchBoms: jest.fn(),
    searchItemModels: jest.fn(),
    searchItems: jest.fn(),
    searchPackagingSpecs: jest.fn()
  }
  const itemManagementAdapter = {
    changeBomStatus: jest.fn(),
    changeItemCategoryStatus: jest.fn(),
    changeItemModelStatus: jest.fn(),
    changePackagingMethodStatus: jest.fn(),
    changePackagingSpecStatus: jest.fn(),
    changeItemStatus: jest.fn(),
    createAttributeDefinition: jest.fn(),
    createAttributeOption: jest.fn(),
    createBom: jest.fn(),
    createItem: jest.fn(),
    createItemCategory: jest.fn(),
    createItemModel: jest.fn(),
    createPackagingMethod: jest.fn(),
    createPackagingSpec: jest.fn(),
    deletePackagingMethod: jest.fn(),
    moveItemCategory: jest.fn(),
    replaceBomLines: jest.fn(),
    setItemCapabilities: jest.fn(),
    setItemModelAttributeRules: jest.fn(),
    setItemModelCapabilities: jest.fn(),
    setItemModelPrimaryCategory: jest.fn(),
    updateAttributeDefinition: jest.fn(),
    updateAttributeOption: jest.fn(),
    updateBomBasics: jest.fn(),
    updateItemBasics: jest.fn(),
    updateItemCategoryBasics: jest.fn(),
    updateItemModelBasics: jest.fn(),
    updatePackagingMethod: jest.fn(),
    updatePackagingSpec: jest.fn(),
    upsertSupplierItemMapping: jest.fn(),
    deleteItemCategory: jest.fn()
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

  it('deletes item categories through the management adapter', async () => {
    itemManagementAdapter.deleteItemCategory.mockResolvedValue({})

    await expect(
      service.deleteItemCategory('tenant-1', 'category-1', source as never)
    ).resolves.toEqual({})

    expect(itemManagementAdapter.deleteItemCategory).toHaveBeenCalledWith(
      {
        categoryId: 'category-1'
      },
      source
    )
  })

  it('moves item categories through the management adapter', async () => {
    itemManagementAdapter.moveItemCategory.mockResolvedValue({
      category: {
        categoryId: 'category-1',
        categoryCode: 'CHILD',
        categoryName: 'Child',
        parentCategoryId: 'category-parent',
        active: true
      }
    })

    await expect(
      service.moveItemCategory(
        'tenant-1',
        'category-1',
        { parentCategoryId: 'category-parent' },
        source as never
      )
    ).resolves.toMatchObject({
      categoryId: 'category-1',
      parentCategoryId: 'category-parent'
    })

    expect(itemManagementAdapter.moveItemCategory).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: 'category-1',
        parentCategoryId: 'category-parent'
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

  it('maps attribute definition query and mutation commands', async () => {
    itemQueryAdapter.listAttributeDefinitions.mockResolvedValue({
      attributeDefinitions: [
        {
          attributeDefinitionId: 'attr-1',
          attributeCode: 'COLOR',
          attributeName: 'Color',
          active: true,
          optionCount: 2
        }
      ],
      total: 1,
      page: 1,
      pageSize: 20
    })
    itemManagementAdapter.updateAttributeDefinition.mockResolvedValue({
      attributeDefinition: {
        attributeDefinitionId: 'attr-1',
        attributeCode: 'COLOR',
        attributeName: 'Color',
        active: false
      }
    })

    await expect(
      service.listAttributeDefinitions(
        'tenant-1',
        { keyword: 'color', status: 'ACTIVE' },
        source as never
      )
    ).resolves.toMatchObject({
      attributeDefinitions: [
        {
          attributeDefinitionId: 'attr-1',
          attributeCode: 'COLOR',
          status: 'ACTIVE',
          optionCount: 2
        }
      ],
      total: 1
    })

    await expect(
      service.updateAttributeDefinition(
        'tenant-1',
        'attr-1',
        { attributeCode: 'COLOR', attributeName: 'Color', status: 'INACTIVE' },
        source as never
      )
    ).resolves.toMatchObject({
      attributeDefinitionId: 'attr-1',
      status: 'INACTIVE'
    })

    expect(itemQueryAdapter.listAttributeDefinitions).toHaveBeenCalledWith(
      expect.objectContaining({ active: true, keyword: 'color' }),
      source
    )
    expect(itemManagementAdapter.updateAttributeDefinition).toHaveBeenCalledWith(
      expect.objectContaining({ active: false, attributeDefinitionId: 'attr-1' }),
      source
    )
  })

  it('maps attribute option descriptions across query and mutation commands', async () => {
    itemQueryAdapter.listAttributeOptions.mockResolvedValue({
      attributeOptions: [
        {
          attributeOptionId: 'opt-1',
          attributeDefinitionId: 'attr-1',
          optionCode: 'WHITE',
          optionName: 'White',
          description: 'Glossy white option',
          active: true
        }
      ]
    })
    itemManagementAdapter.createAttributeOption.mockResolvedValue({
      attributeOption: {
        attributeOptionId: 'opt-2',
        attributeDefinitionId: 'attr-1',
        optionCode: 'BLACK',
        optionName: 'Black',
        description: 'Matte black option',
        active: true
      }
    })
    itemManagementAdapter.updateAttributeOption.mockResolvedValue({
      attributeOption: {
        attributeOptionId: 'opt-1',
        attributeDefinitionId: 'attr-1',
        optionCode: 'WHITE-REV',
        optionName: 'White Rev',
        description: 'Updated option',
        active: false
      }
    })

    await expect(
      service.listAttributeOptions('tenant-1', 'attr-1', { status: 'ACTIVE' }, source as never)
    ).resolves.toMatchObject({
      attributeOptions: [
        {
          attributeOptionId: 'opt-1',
          description: 'Glossy white option',
          status: 'ACTIVE'
        }
      ]
    })

    await expect(
      service.createAttributeOption(
        'tenant-1',
        'attr-1',
        { optionCode: 'BLACK', optionName: 'Black', description: 'Matte black option' },
        source as never
      )
    ).resolves.toMatchObject({
      attributeOptionId: 'opt-2',
      description: 'Matte black option'
    })

    await expect(
      service.updateAttributeOption(
        'tenant-1',
        'opt-1',
        {
          optionCode: 'WHITE-REV',
          optionName: 'White Rev',
          description: 'Updated option',
          status: 'INACTIVE'
        },
        source as never
      )
    ).resolves.toMatchObject({
      attributeOptionId: 'opt-1',
      description: 'Updated option',
      status: 'INACTIVE'
    })

    expect(itemManagementAdapter.createAttributeOption).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Matte black option'
      }),
      source
    )
    expect(itemManagementAdapter.updateAttributeOption).toHaveBeenCalledWith(
      expect.objectContaining({
        active: false,
        description: 'Updated option'
      }),
      source
    )
  })

  it('maps packaging method and packaging spec commands', async () => {
    itemManagementAdapter.createPackagingMethod.mockResolvedValue({
      packagingMethod: {
        packagingMethodId: 'method-1',
        methodCode: 'ECOM',
        methodName: 'E-commerce',
        description: 'Online parcel packaging',
        active: true
      }
    })
    itemManagementAdapter.createPackagingSpec.mockResolvedValue({
      packagingSpec: {
        packagingSpecId: 'spec-1',
        itemModelId: 'model-1',
        packagingMethodId: 'method-1',
        customerId: '',
        specCode: 'PKG-1',
        specName: 'Standard box',
        active: true
      }
    })

    await expect(
      service.createPackagingMethod(
        'tenant-1',
        { methodCode: 'ECOM', methodName: 'E-commerce', description: ' Online parcel packaging ' },
        source as never
      )
    ).resolves.toMatchObject({
      description: 'Online parcel packaging',
      methodCode: 'ECOM',
      status: 'ACTIVE'
    })
    await expect(
      service.createPackagingSpec(
        'tenant-1',
        {
          itemModelId: 'model-1',
          packagingMethodId: 'method-1',
          specCode: 'PKG-1',
          specName: 'Standard box'
        },
        source as never
      )
    ).resolves.toMatchObject({
      packagingSpecId: 'spec-1',
      itemModelId: 'model-1',
      status: 'ACTIVE'
    })

    expect(itemManagementAdapter.createPackagingMethod).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Online parcel packaging',
        methodCode: 'ECOM'
      }),
      source
    )
    expect(itemManagementAdapter.createPackagingSpec).toHaveBeenCalledWith(
      expect.objectContaining({
        itemModelId: 'model-1',
        packagingMethodId: 'method-1',
        specCode: 'PKG-1'
      }),
      source
    )
  })

  it('deletes packaging methods through the management adapter', async () => {
    itemManagementAdapter.deletePackagingMethod.mockResolvedValue({})

    await expect(
      service.deletePackagingMethod('tenant-1', 'method-1', source as never)
    ).resolves.toEqual({})

    expect(itemManagementAdapter.deletePackagingMethod).toHaveBeenCalledWith(
      {
        packagingMethodId: 'method-1'
      },
      source
    )
  })
})
