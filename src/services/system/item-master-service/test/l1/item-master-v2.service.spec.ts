import {
  BomLineRole,
  BomType,
  ItemModelKind,
  ItemModelType,
  ItemType
} from '@oes/common/generated/item_master_service'
import {
  ItemMasterManagementV2Service,
  ItemMasterQueryV2Service
} from '../../src/application/item-master-v2.service'

function createPrismaMock(overrides: Record<string, any> = {}): any {
  const prisma: any = {
    itemModel: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn()
    },
    itemCategory: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      delete: jest.fn()
    },
    attributeDefinition: {
      count: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    attributeOption: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    item: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn()
    },
    packagingMethod: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
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
    $transaction: jest.fn(async (queries) => Promise.all(queries)),
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
  it('lists only root item categories when parent category is omitted', async () => {
    const prisma = createPrismaMock({
      itemCategory: {
        findMany: jest.fn().mockResolvedValue([])
      }
    })
    const service = new ItemMasterQueryV2Service(prisma)

    await service.listItemCategories({
      tenantId: 'tenant-1'
    })

    expect(prisma.itemCategory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          parentCategoryId: null,
          tenantId: 'tenant-1'
        })
      })
    )
  })

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

  it('lists attribute definitions with option counts', async () => {
    const prisma = createPrismaMock({
      attributeDefinition: {
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'attr-1',
            tenantId: 'tenant-1',
            attributeCode: 'COLOR',
            attributeName: 'Color',
            active: true,
            _count: { options: 3 }
          }
        ])
      }
    })
    const service = new ItemMasterQueryV2Service(prisma)

    await expect(
      service.listAttributeDefinitions({
        tenantId: 'tenant-1',
        page: 1,
        pageSize: 20
      })
    ).resolves.toMatchObject({
      attributeDefinitions: [
        {
          attributeDefinitionId: 'attr-1',
          optionCount: 3
        }
      ]
    })

    expect(prisma.attributeDefinition.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: { _count: { select: { options: true } } }
      })
    )
  })

  it('creates and updates attribute options with descriptions', async () => {
    const prisma = createPrismaMock({
      attributeDefinition: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'attr-1',
          tenantId: 'tenant-1'
        })
      },
      attributeOption: {
        create: jest.fn().mockResolvedValue({
          id: 'opt-1',
          tenantId: 'tenant-1',
          attributeDefinitionId: 'attr-1',
          optionCode: 'WHITE',
          optionName: 'White',
          description: 'Glossy white option',
          active: true
        }),
        findFirst: jest.fn().mockResolvedValue({
          id: 'opt-1',
          tenantId: 'tenant-1'
        }),
        update: jest.fn().mockResolvedValue({
          id: 'opt-1',
          tenantId: 'tenant-1',
          attributeDefinitionId: 'attr-1',
          optionCode: 'WHITE-REV',
          optionName: 'White Rev',
          description: null,
          active: false
        })
      }
    })
    const service = new ItemMasterManagementV2Service(prisma)

    await expect(
      service.createAttributeOption({
        tenantId: 'tenant-1',
        attributeDefinitionId: 'attr-1',
        optionCode: 'WHITE',
        optionName: 'White',
        description: ' Glossy white option '
      })
    ).resolves.toMatchObject({
      attributeOption: {
        attributeOptionId: 'opt-1',
        description: 'Glossy white option'
      }
    })
    expect(prisma.attributeOption.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          description: 'Glossy white option'
        })
      })
    )

    await expect(
      service.updateAttributeOption({
        tenantId: 'tenant-1',
        attributeOptionId: 'opt-1',
        optionCode: 'WHITE-REV',
        optionName: 'White Rev',
        description: '   ',
        active: false
      })
    ).resolves.toMatchObject({
      attributeOption: {
        attributeOptionId: 'opt-1',
        description: ''
      }
    })
    expect(prisma.attributeOption.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          description: null
        })
      })
    )
  })

  it('deletes an unused leaf item category', async () => {
    const prisma = createPrismaMock({
      itemCategory: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'category-leaf',
          tenantId: 'tenant-1'
        }),
        count: jest.fn().mockResolvedValue(0),
        delete: jest.fn().mockResolvedValue({
          id: 'category-leaf',
          tenantId: 'tenant-1'
        })
      },
      itemModel: {
        count: jest.fn().mockResolvedValue(0)
      }
    })
    const service = new ItemMasterManagementV2Service(prisma)

    await expect(
      service.deleteItemCategory({
        tenantId: 'tenant-1',
        categoryId: 'category-leaf'
      })
    ).resolves.toEqual({})

    expect(prisma.itemCategory.delete).toHaveBeenCalledWith({
      where: { id: 'category-leaf' }
    })
  })

  it('moves an item category to a valid parent or root', async () => {
    const prisma = createPrismaMock({
      itemCategory: {
        findFirst: jest.fn()
          .mockResolvedValueOnce({ id: 'category-child', tenantId: 'tenant-1' })
          .mockResolvedValueOnce({ id: 'category-parent', tenantId: 'tenant-1' }),
        findMany: jest.fn().mockResolvedValue([
          { id: 'category-parent', parentCategoryId: null },
          { id: 'category-child', parentCategoryId: null }
        ]),
        update: jest.fn().mockResolvedValue({
          id: 'category-child',
          tenantId: 'tenant-1',
          categoryCode: 'CHILD',
          categoryName: 'Child',
          parentCategoryId: 'category-parent',
          active: true,
          children: []
        })
      }
    })
    const service = new ItemMasterManagementV2Service(prisma)

    await expect(
      service.moveItemCategory({
        tenantId: 'tenant-1',
        categoryId: 'category-child',
        parentCategoryId: 'category-parent'
      })
    ).resolves.toMatchObject({
      category: expect.objectContaining({
        categoryId: 'category-child',
        parentCategoryId: 'category-parent'
      })
    })

    expect(prisma.itemCategory.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { parentCategoryId: 'category-parent' },
        where: { id: 'category-child' }
      })
    )
  })

  it('rejects moving item categories under themselves or descendants', async () => {
    const prisma = createPrismaMock({
      itemCategory: {
        findFirst: jest.fn().mockResolvedValue({ id: 'category-root', tenantId: 'tenant-1' }),
        findMany: jest.fn().mockResolvedValue([
          { id: 'category-root', parentCategoryId: null },
          { id: 'category-child', parentCategoryId: 'category-root' }
        ]),
        update: jest.fn()
      }
    })
    const service = new ItemMasterManagementV2Service(prisma)

    await expect(
      service.moveItemCategory({
        tenantId: 'tenant-1',
        categoryId: 'category-root',
        parentCategoryId: 'category-root'
      })
    ).rejects.toBeDefined()

    await expect(
      service.moveItemCategory({
        tenantId: 'tenant-1',
        categoryId: 'category-root',
        parentCategoryId: 'category-child'
      })
    ).rejects.toBeDefined()

    expect(prisma.itemCategory.update).not.toHaveBeenCalled()
  })

  it('rejects deleting item categories that still have children or ItemModel references', async () => {
    const category = {
      id: 'category-parent',
      tenantId: 'tenant-1'
    }
    const prisma = createPrismaMock({
      itemCategory: {
        findFirst: jest.fn().mockResolvedValue(category),
        count: jest.fn()
          .mockResolvedValueOnce(1)
          .mockResolvedValueOnce(0),
        delete: jest.fn()
      },
      itemModel: {
        count: jest.fn().mockResolvedValue(1)
      }
    })
    const service = new ItemMasterManagementV2Service(prisma)

    await expect(
      service.deleteItemCategory({
        tenantId: 'tenant-1',
        categoryId: 'category-parent'
      })
    ).rejects.toBeDefined()

    await expect(
      service.deleteItemCategory({
        tenantId: 'tenant-1',
        categoryId: 'category-parent'
      })
    ).rejects.toBeDefined()

    expect(prisma.itemCategory.delete).not.toHaveBeenCalled()
  })

  it('deletes an unused packaging method', async () => {
    const prisma = createPrismaMock({
      packagingMethod: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'method-unused',
          tenantId: 'tenant-1'
        }),
        delete: jest.fn().mockResolvedValue({
          id: 'method-unused',
          tenantId: 'tenant-1'
        })
      },
      packagingSpec: {
        count: jest.fn().mockResolvedValue(0)
      }
    })
    const service = new ItemMasterManagementV2Service(prisma)

    await expect(
      service.deletePackagingMethod({
        tenantId: 'tenant-1',
        packagingMethodId: 'method-unused'
      })
    ).resolves.toEqual({})

    expect(prisma.packagingSpec.count).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        packagingMethodId: 'method-unused'
      }
    })
    expect(prisma.packagingMethod.delete).toHaveBeenCalledWith({
      where: { id: 'method-unused' }
    })
  })

  it('creates, updates, lists, and returns packaging method descriptions', async () => {
    const prisma = createPrismaMock({
      packagingMethod: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'method-1',
          tenantId: 'tenant-1'
        }),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'method-1',
            tenantId: 'tenant-1',
            methodCode: 'ECOM',
            methodName: 'E-commerce',
            description: 'Online parcel packaging',
            active: true
          }
        ]),
        create: jest.fn().mockResolvedValue({
          id: 'method-1',
          tenantId: 'tenant-1',
          methodCode: 'ECOM',
          methodName: 'E-commerce',
          description: 'Online parcel packaging',
          active: true
        }),
        update: jest.fn().mockResolvedValue({
          id: 'method-1',
          tenantId: 'tenant-1',
          methodCode: 'ECOM-REV',
          methodName: 'E-commerce Rev',
          description: null,
          active: true
        })
      }
    })
    const service = new ItemMasterManagementV2Service(prisma)
    const queryService = new ItemMasterQueryV2Service(prisma)

    await expect(
      service.createPackagingMethod({
        tenantId: 'tenant-1',
        methodCode: 'ECOM',
        methodName: 'E-commerce',
        description: ' Online parcel packaging '
      })
    ).resolves.toMatchObject({
      packagingMethod: {
        description: 'Online parcel packaging'
      }
    })
    await expect(
      service.updatePackagingMethod({
        tenantId: 'tenant-1',
        packagingMethodId: 'method-1',
        methodCode: 'ECOM-REV',
        methodName: 'E-commerce Rev',
        description: '   '
      })
    ).resolves.toMatchObject({
      packagingMethod: {
        description: ''
      }
    })
    await expect(
      queryService.listPackagingMethods({
        tenantId: 'tenant-1',
        keyword: 'parcel'
      })
    ).resolves.toMatchObject({
      packagingMethods: [
        {
          description: 'Online parcel packaging'
        }
      ]
    })

    expect(prisma.packagingMethod.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        description: 'Online parcel packaging'
      })
    })
    expect(prisma.packagingMethod.update).toHaveBeenCalledWith({
      where: { id: 'method-1' },
      data: expect.objectContaining({
        description: null
      })
    })
    expect(prisma.packagingMethod.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        OR: expect.arrayContaining([
          {
            description: {
              contains: 'parcel',
              mode: 'insensitive'
            }
          }
        ])
      }),
      orderBy: [{ methodCode: 'asc' }, { id: 'asc' }]
    })
  })

  it('rejects deleting packaging methods that are referenced by packaging specs', async () => {
    const prisma = createPrismaMock({
      packagingMethod: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'method-in-use',
          tenantId: 'tenant-1'
        }),
        delete: jest.fn()
      },
      packagingSpec: {
        count: jest.fn().mockResolvedValue(1)
      }
    })
    const service = new ItemMasterManagementV2Service(prisma)

    await expect(
      service.deletePackagingMethod({
        tenantId: 'tenant-1',
        packagingMethodId: 'method-in-use'
      })
    ).rejects.toBeDefined()

    expect(prisma.packagingMethod.delete).not.toHaveBeenCalled()
  })
})
