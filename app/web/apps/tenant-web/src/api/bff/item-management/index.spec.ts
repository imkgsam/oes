import { describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const post = vi.fn()
const put = vi.fn()
const request = vi.fn()

vi.mock('#/api/request', () => ({
  requestClient: {
    get,
    post,
    put,
    request
  }
}))

describe('item-management V2 BFF API client', async () => {
  const {
    createManagedBomApi,
    createManagedAttributeDefinitionApi,
    createManagedAttributeOptionApi,
    createManagedItemApi,
    createManagedItemModelApi,
    createManagedPackagingMethodApi,
    createManagedPackagingSpecApi,
    changeManagedPackagingMethodStatusApi,
    changeManagedPackagingSpecStatusApi,
    changeManagedItemCategoryStatusApi,
    changeManagedBomStatusApi,
    deleteManagedItemCategoryApi,
    deleteManagedPackagingMethodApi,
    getManagedBomByOutputItemApi,
    getManagedItemModelByIdApi,
    listManagedAttributeDefinitionsApi,
    listManagedAttributeOptionsApi,
    listManagedBomsApi,
    listManagedItemModelsApi,
    listManagedPackagingMethodsApi,
    listManagedPackagingSpecsApi,
    moveManagedItemCategoryApi,
    replaceManagedBomLinesApi,
    updateManagedBomBasicsApi,
    setManagedItemModelCapabilitiesApi,
    setManagedItemModelPrimaryCategoryApi,
    updateManagedAttributeDefinitionApi,
    updateManagedAttributeOptionApi,
    updateManagedItemModelBasicsApi,
    updateManagedPackagingMethodApi,
    updateManagedPackagingSpecApi,
    updateManagedItemCategoryBasicsApi
  } = await import('./index')

  it('uses ItemModel endpoints for model-level master data', async () => {
    await listManagedItemModelsApi('tenant-1', {
      modelKind: 'PHYSICAL',
      modelType: 'FINISHED_PRODUCT'
    })
    await getManagedItemModelByIdApi('tenant-1', 'model-1')
    await createManagedItemModelApi('tenant-1', {
      modelCode: 'MODEL-1',
      modelKind: 'PHYSICAL',
      modelName: 'Model 1',
      modelType: 'FINISHED_PRODUCT'
    })

    expect(get).toHaveBeenCalledWith('/item-management/tenants/tenant-1/item-models', {
      params: {
        modelKind: 'PHYSICAL',
        modelType: 'FINISHED_PRODUCT'
      }
    })
    expect(get).toHaveBeenCalledWith('/item-management/tenants/tenant-1/item-models/model-1')
    expect(post).toHaveBeenCalledWith(
      '/item-management/tenants/tenant-1/item-models',
      expect.objectContaining({
        modelCode: 'MODEL-1',
        modelKind: 'PHYSICAL'
      })
    )
  })

  it('uses ItemModel update endpoints for detail editing', async () => {
    await updateManagedItemModelBasicsApi('tenant-1', 'model-1', {
      modelCode: 'MODEL-1-UPD',
      modelName: 'Model 1 Updated'
    })
    await setManagedItemModelCapabilitiesApi('tenant-1', 'model-1', {
      capabilities: {
        assemblable: false,
        manufacturable: true,
        packable: false,
        packaged: false,
        purchasable: true,
        sellable: true,
        stockable: true,
        transformable: false
      }
    })
    await setManagedItemModelPrimaryCategoryApi('tenant-1', 'model-1', {
      primaryCategoryId: 'category-2'
    })

    expect(request).toHaveBeenCalledWith('/item-management/tenants/tenant-1/item-models/model-1/basics', {
      data: {
        modelCode: 'MODEL-1-UPD',
        modelName: 'Model 1 Updated'
      },
      method: 'PATCH'
    })
    expect(put).toHaveBeenCalledWith(
      '/item-management/tenants/tenant-1/item-models/model-1/capabilities',
      expect.objectContaining({
        capabilities: expect.objectContaining({
          purchasable: true
        })
      })
    )
    expect(put).toHaveBeenCalledWith('/item-management/tenants/tenant-1/item-models/model-1/primary-category', {
      primaryCategoryId: 'category-2'
    })
  })

  it('creates executable Items from ItemModel ids', async () => {
    await createManagedItemApi('tenant-1', {
      itemCode: 'SKU-1',
      itemModelId: 'model-1',
      itemName: 'SKU 1',
      itemType: 'STANDARD'
    })

    expect(post).toHaveBeenCalledWith(
      '/item-management/tenants/tenant-1/items',
      expect.objectContaining({
        itemModelId: 'model-1',
        itemType: 'STANDARD'
      })
    )
  })

  it('uses BOM endpoints for composition and packaging structures', async () => {
    await listManagedBomsApi('tenant-1', {
      bomType: 'PACKAGING',
      outputItemId: 'item-out',
      status: 'ACTIVE'
    })
    await getManagedBomByOutputItemApi('tenant-1', 'item-out', {
      bomType: 'COMPOSITION'
    })
    await createManagedBomApi('tenant-1', {
      bomCode: 'BOM-1',
      bomName: 'BOM 1',
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
    })
    await replaceManagedBomLinesApi('tenant-1', 'bom-1', {
      lines: [
        {
          componentItemId: 'item-in',
          lineRole: 'COMPONENT',
          quantity: '1',
          uomCode: 'PCS'
        }
      ]
    })

    expect(get).toHaveBeenCalledWith('/item-management/tenants/tenant-1/boms', {
      params: {
        bomType: 'PACKAGING',
        outputItemId: 'item-out',
        status: 'ACTIVE'
      }
    })
    expect(get).toHaveBeenCalledWith('/item-management/tenants/tenant-1/items/item-out/bom', {
      params: {
        bomType: 'COMPOSITION'
      }
    })
    expect(post).toHaveBeenCalledWith('/item-management/tenants/tenant-1/boms', expect.any(Object))
    expect(put).toHaveBeenCalledWith('/item-management/tenants/tenant-1/boms/bom-1/lines', expect.any(Object))
  })

  it('uses category mutation endpoints for category maintenance', async () => {
    await updateManagedItemCategoryBasicsApi('tenant-1', 'category-1', {
      categoryCode: 'FINISHED',
      categoryName: 'Finished Goods'
    })
    await changeManagedItemCategoryStatusApi('tenant-1', 'category-1', {
      status: 'INACTIVE'
    })
    await moveManagedItemCategoryApi('tenant-1', 'category-1', {
      parentCategoryId: 'category-parent'
    })
    await deleteManagedItemCategoryApi('tenant-1', 'category-1')

    expect(request).toHaveBeenCalledWith('/item-management/tenants/tenant-1/categories/category-1/basics', {
      data: {
        categoryCode: 'FINISHED',
        categoryName: 'Finished Goods'
      },
      method: 'PATCH'
    })
    expect(request).toHaveBeenCalledWith('/item-management/tenants/tenant-1/categories/category-1/status', {
      data: {
        status: 'INACTIVE'
      },
      method: 'PATCH'
    })
    expect(request).toHaveBeenCalledWith('/item-management/tenants/tenant-1/categories/category-1/parent', {
      data: {
        parentCategoryId: 'category-parent'
      },
      method: 'PATCH'
    })
    expect(request).toHaveBeenCalledWith('/item-management/tenants/tenant-1/categories/category-1', {
      method: 'DELETE'
    })
  })

  it('uses attribute endpoints for attribute master data', async () => {
    await listManagedAttributeDefinitionsApi('tenant-1', { keyword: 'color', status: 'ACTIVE' })
    await createManagedAttributeDefinitionApi('tenant-1', {
      attributeCode: 'COLOR',
      attributeName: 'Color'
    })
    await updateManagedAttributeDefinitionApi('tenant-1', 'attribute-1', {
      attributeCode: 'COLOR',
      attributeName: 'Color',
      status: 'INACTIVE'
    })
    await listManagedAttributeOptionsApi('tenant-1', 'attribute-1', { status: 'ACTIVE' })
    await createManagedAttributeOptionApi('tenant-1', 'attribute-1', {
      description: 'Glossy white option',
      optionCode: 'WHITE',
      optionName: 'White'
    })
    await updateManagedAttributeOptionApi('tenant-1', 'option-1', {
      description: 'Updated white option',
      optionCode: 'WHITE',
      optionName: 'White',
      status: 'INACTIVE'
    })

    expect(get).toHaveBeenCalledWith('/item-management/tenants/tenant-1/attributes/definitions', {
      params: { keyword: 'color', status: 'ACTIVE' }
    })
    expect(post).toHaveBeenCalledWith('/item-management/tenants/tenant-1/attributes/definitions', {
      attributeCode: 'COLOR',
      attributeName: 'Color'
    })
    expect(request).toHaveBeenCalledWith('/item-management/tenants/tenant-1/attributes/definitions/attribute-1', {
      data: {
        attributeCode: 'COLOR',
        attributeName: 'Color',
        status: 'INACTIVE'
      },
      method: 'PATCH'
    })
    expect(get).toHaveBeenCalledWith('/item-management/tenants/tenant-1/attributes/definitions/attribute-1/options', {
      params: { status: 'ACTIVE' }
    })
    expect(post).toHaveBeenCalledWith(
      '/item-management/tenants/tenant-1/attributes/definitions/attribute-1/options',
      {
        description: 'Glossy white option',
        optionCode: 'WHITE',
        optionName: 'White'
      }
    )
    expect(request).toHaveBeenCalledWith('/item-management/tenants/tenant-1/attributes/options/option-1', {
      data: {
        description: 'Updated white option',
        optionCode: 'WHITE',
        optionName: 'White',
        status: 'INACTIVE'
      },
      method: 'PATCH'
    })
  })

  it('uses packaging endpoints for method and spec master data', async () => {
    await listManagedPackagingMethodsApi('tenant-1', { status: 'ACTIVE' })
    await createManagedPackagingMethodApi('tenant-1', {
      description: 'Online parcel packaging',
      methodCode: 'ECOM',
      methodName: 'E-commerce'
    })
    await updateManagedPackagingMethodApi('tenant-1', 'method-1', {
      description: 'Online parcel packaging rev',
      methodCode: 'ECOM-REV',
      methodName: 'E-commerce Rev'
    })
    await changeManagedPackagingMethodStatusApi('tenant-1', 'method-1', {
      status: 'INACTIVE'
    })
    await deleteManagedPackagingMethodApi('tenant-1', 'method-1')
    await listManagedPackagingSpecsApi('tenant-1', { itemModelId: 'model-1' })
    await createManagedPackagingSpecApi('tenant-1', {
      itemModelId: 'model-1',
      packagingMethodId: 'method-1',
      specCode: 'PKG-1',
      specName: 'Standard box'
    })
    await updateManagedPackagingSpecApi('tenant-1', 'spec-1', {
      itemModelId: 'model-1',
      packagingMethodId: 'method-1',
      specCode: 'PKG-1-REV',
      specName: 'Standard box Rev'
    })
    await changeManagedPackagingSpecStatusApi('tenant-1', 'spec-1', {
      status: 'INACTIVE'
    })

    expect(get).toHaveBeenCalledWith('/item-management/tenants/tenant-1/packaging/methods', {
      params: { status: 'ACTIVE' }
    })
    expect(post).toHaveBeenCalledWith('/item-management/tenants/tenant-1/packaging/methods', {
      description: 'Online parcel packaging',
      methodCode: 'ECOM',
      methodName: 'E-commerce'
    })
    expect(request).toHaveBeenCalledWith('/item-management/tenants/tenant-1/packaging/methods/method-1/basics', {
      data: {
        description: 'Online parcel packaging rev',
        methodCode: 'ECOM-REV',
        methodName: 'E-commerce Rev'
      },
      method: 'PATCH'
    })
    expect(request).toHaveBeenCalledWith('/item-management/tenants/tenant-1/packaging/methods/method-1/status', {
      data: {
        status: 'INACTIVE'
      },
      method: 'PATCH'
    })
    expect(request).toHaveBeenCalledWith('/item-management/tenants/tenant-1/packaging/methods/method-1', {
      method: 'DELETE'
    })
    expect(get).toHaveBeenCalledWith('/item-management/tenants/tenant-1/packaging/specs', {
      params: { itemModelId: 'model-1' }
    })
    expect(post).toHaveBeenCalledWith(
      '/item-management/tenants/tenant-1/packaging/specs',
      expect.objectContaining({ itemModelId: 'model-1', packagingMethodId: 'method-1' })
    )
    expect(request).toHaveBeenCalledWith('/item-management/tenants/tenant-1/packaging/specs/spec-1', {
      data: expect.objectContaining({
        itemModelId: 'model-1',
        packagingMethodId: 'method-1',
        specCode: 'PKG-1-REV',
        specName: 'Standard box Rev'
      }),
      method: 'PATCH'
    })
    expect(request).toHaveBeenCalledWith('/item-management/tenants/tenant-1/packaging/specs/spec-1/status', {
      data: {
        status: 'INACTIVE'
      },
      method: 'PATCH'
    })
  })

  it('uses BOM mutation endpoints for basics and lifecycle status', async () => {
    await updateManagedBomBasicsApi('tenant-1', 'bom-1', {
      bomCode: 'BOM-1',
      bomName: 'BOM 1'
    })
    await changeManagedBomStatusApi('tenant-1', 'bom-1', {
      status: 'INACTIVE'
    })

    expect(request).toHaveBeenCalledWith('/item-management/tenants/tenant-1/boms/bom-1/basics', {
      data: {
        bomCode: 'BOM-1',
        bomName: 'BOM 1'
      },
      method: 'PATCH'
    })
    expect(request).toHaveBeenCalledWith('/item-management/tenants/tenant-1/boms/bom-1/status', {
      data: {
        status: 'INACTIVE'
      },
      method: 'PATCH'
    })
  })
})
