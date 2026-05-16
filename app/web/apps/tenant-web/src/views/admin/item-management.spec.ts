/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createManagedItemApi = vi.fn()
const createManagedItemModelApi = vi.fn()
const changeManagedItemStatusApi = vi.fn()
const getManagedItemModelAttributeRulesApi = vi.fn()
const listManagedAttributeDefinitionsApi = vi.fn()
const listManagedAttributeOptionsApi = vi.fn()
const listManagedBomsApi = vi.fn()
const listManagedItemCategoriesApi = vi.fn()
const listManagedItemModelsApi = vi.fn()
const listManagedItemsApi = vi.fn()
const listManagedPackagingSpecsApi = vi.fn()
const listManagedSupplierItemMappingsApi = vi.fn()
const setManagedItemCapabilitiesApi = vi.fn()
const setManagedItemModelAttributeRulesApi = vi.fn()
const push = vi.fn()

const authContextState: any = {
  actionCodes: [
    'item_master.item.list',
    'item_master.item.get_by_id',
    'item_master.item.create',
    'item_master.item.set_capabilities',
    'item_master.item.update_status',
    'item_master.item_model.list',
    'item_master.item_model.create',
    'item_master.attribute.list',
    'item_master.attribute.manage',
    'item_master.packaging.list',
    'item_master.bom.list',
    'item_master.supplier_item_mapping.list_by_item'
  ],
  sessionContext: {
    tenant: {
      tenantId: 'tenant-1'
    }
  }
}

vi.mock('#/api', () => ({
  changeManagedItemStatusApi,
  createManagedItemApi,
  createManagedItemModelApi,
  getManagedItemModelAttributeRulesApi,
  listManagedAttributeDefinitionsApi,
  listManagedAttributeOptionsApi,
  listManagedBomsApi,
  listManagedItemCategoriesApi,
  listManagedItemModelsApi,
  listManagedItemsApi,
  listManagedPackagingSpecsApi,
  listManagedSupplierItemMappingsApi,
  setManagedItemCapabilitiesApi,
  setManagedItemModelAttributeRulesApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push })
}))

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    template: '<div><slot /></div>'
  }
}))

vi.mock('ant-design-vue', async () => await import('./__tests__/ant-design-vue-mock'))

describe('item management V2 list page', () => {
  beforeEach(() => {
    createManagedItemApi.mockReset()
    createManagedItemModelApi.mockReset()
    changeManagedItemStatusApi.mockReset()
    getManagedItemModelAttributeRulesApi.mockReset()
    listManagedAttributeDefinitionsApi.mockReset()
    listManagedAttributeOptionsApi.mockReset()
    listManagedBomsApi.mockReset()
    listManagedItemCategoriesApi.mockReset()
    listManagedItemModelsApi.mockReset()
    listManagedItemsApi.mockReset()
    listManagedPackagingSpecsApi.mockReset()
    listManagedSupplierItemMappingsApi.mockReset()
    setManagedItemCapabilitiesApi.mockReset()
    setManagedItemModelAttributeRulesApi.mockReset()
    push.mockReset()
    getManagedItemModelAttributeRulesApi.mockResolvedValue({
      rules: [
        {
          allowedOptionIds: ['option-white'],
          attributeDefinitionId: 'attribute-color',
          itemModelId: 'model-1',
          required: true
        }
      ]
    })
    listManagedAttributeDefinitionsApi.mockResolvedValue({
      attributeDefinitions: [
        {
          attributeDefinitionId: 'attribute-color',
          attributeCode: 'COLOR',
          attributeName: 'Color',
          status: 'ACTIVE'
        }
      ],
      page: 1,
      pageSize: 50,
      total: 1
    })
    listManagedAttributeOptionsApi.mockResolvedValue({
      attributeOptions: [
        {
          attributeOptionId: 'option-white',
          attributeDefinitionId: 'attribute-color',
          optionCode: 'WHITE',
          optionName: 'White',
          status: 'ACTIVE'
        },
        {
          attributeOptionId: 'option-black',
          attributeDefinitionId: 'attribute-color',
          optionCode: 'BLACK',
          optionName: 'Black',
          status: 'ACTIVE'
        }
      ]
    })
    listManagedPackagingSpecsApi.mockResolvedValue({
      packagingSpecs: [
        {
          packagingSpecId: 'packaging-spec-1',
          itemModelId: 'model-1',
          packagingMethodId: 'method-1',
          specCode: 'PKG-STD',
          specName: 'Standard Packaging',
          status: 'ACTIVE'
        }
      ],
      page: 1,
      pageSize: 50,
      total: 1
    })
    listManagedBomsApi.mockResolvedValue({
      boms: [
        {
          bomId: 'bom-1',
          bomCode: 'BOM-PKG',
          bomName: 'Packaging BOM',
          bomType: 'PACKAGING',
          outputItemId: 'item-1',
          status: 'ACTIVE',
          lines: []
        }
      ],
      page: 1,
      pageSize: 50,
      total: 1
    })
    listManagedSupplierItemMappingsApi.mockResolvedValue({
      mappings: [],
      page: 1,
      pageSize: 50,
      total: 0
    })
    setManagedItemModelAttributeRulesApi.mockResolvedValue({
      rules: []
    })
    changeManagedItemStatusApi.mockResolvedValue({})
    setManagedItemCapabilitiesApi.mockResolvedValue({})
    listManagedItemCategoriesApi.mockResolvedValue({
      categories: [
        {
          categoryId: 'category-1',
          categoryCode: 'FINISHED',
          categoryName: 'Finished Goods',
          parentCategoryId: '',
          status: 'ACTIVE',
          hasChildren: false
        }
      ]
    })
    listManagedItemModelsApi.mockResolvedValue({
      itemModels: [
        {
          itemModelId: 'model-1',
          modelCode: 'MODEL-1',
          modelKind: 'PHYSICAL',
          modelName: 'Model 1',
          modelType: 'FINISHED_PRODUCT',
          status: 'ACTIVE',
          primaryCategorySummary: {
            categoryId: 'category-1',
            categoryCode: 'FINISHED',
            categoryName: 'Finished Goods',
            status: 'ACTIVE'
          },
          capabilities: {
            assemblable: false,
            manufacturable: true,
            packable: false,
            packaged: false,
            purchasable: false,
            sellable: true,
            stockable: true,
            transformable: false
          }
        }
      ],
      total: 1
    })
    listManagedItemsApi.mockResolvedValue({
      items: [
        {
          itemId: 'item-1',
          itemModelId: 'model-1',
          itemCode: 'SKU-1',
          itemName: 'SKU 1',
          itemType: 'STANDARD',
          lockedAttributeOptionIds: [],
          status: 'ACTIVE',
          capabilities: {
            assemblable: false,
            manufacturable: true,
            packable: true,
            packaged: false,
            purchasable: false,
            sellable: true,
            stockable: true,
            transformable: false
          },
          itemModelSummary: {
            itemModelId: 'model-1',
            modelCode: 'MODEL-1',
            modelKind: 'PHYSICAL',
            modelName: 'Model 1',
            modelType: 'FINISHED_PRODUCT',
            status: 'ACTIVE'
          }
        }
      ],
      total: 1
    })
  })

  it('loads ItemModels and executable Items with V2 filters', async () => {
    const page = (await import('./item-management.vue')).default
    mount(page)
    await flushPromises()

    expect(listManagedItemCategoriesApi).toHaveBeenCalledWith('tenant-1', {
      parentCategoryId: undefined
    })
    expect(listManagedItemModelsApi).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ status: 'ACTIVE' }))
    expect(listManagedItemsApi).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ page: 1, pageSize: 20 }))
  })

  it('filters ItemModels and Items by ItemCategory descendants', async () => {
    const page = (await import('./item-management.vue')).default
    const wrapper = mount(page)
    await flushPromises()

    await wrapper.get('[data-testid="item-filter-category"]').setValue('category-1')
    await wrapper.get('[data-testid="item-filter-search"]').trigger('click')
    await flushPromises()

    expect(listManagedItemModelsApi).toHaveBeenLastCalledWith(
      'tenant-1',
      expect.objectContaining({
        categoryId: 'category-1',
        includeDescendants: true
      })
    )
    expect(listManagedItemsApi).toHaveBeenLastCalledWith(
      'tenant-1',
      expect.objectContaining({
        categoryId: 'category-1',
        includeDescendants: true
      })
    )
  })

  it('creates ItemModels with selected primary category ids', async () => {
    const page = (await import('./item-management.vue')).default
    const wrapper = mount(page)
    await flushPromises()

    await wrapper.get('[data-testid="item-model-create-button"]').trigger('click')
    await wrapper.get('[data-testid="create-model-code"]').setValue('BATHTUB-COASTER')
    await wrapper.get('[data-testid="create-model-name"]').setValue('Bathtub Coaster')
    await wrapper.get('[data-testid="create-model-category"]').setValue('category-1')
    await wrapper.get('[data-testid="create-model-submit"]').trigger('click')
    await flushPromises()

    expect(createManagedItemModelApi).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        modelCode: 'BATHTUB-COASTER',
        primaryCategoryId: 'category-1'
      })
    )
  })

  it('routes top-level Item creation to the full Item create page', async () => {
    const page = (await import('./item-management.vue')).default
    const wrapper = mount(page)
    await flushPromises()

    await wrapper.get('[data-testid="item-create-button"]').trigger('click')

    expect(createManagedItemApi).not.toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith({ name: 'TenantItemManagementCreate' })
  })

  it('opens an Odoo-like ItemModel workbench with attribute rules and linked downstream records', async () => {
    const page = (await import('./item-management.vue')).default
    const wrapper = mount(page)
    await flushPromises()

    await wrapper.get('[data-testid="item-model-select-model-1"]').trigger('click')
    await flushPromises()

    expect(getManagedItemModelAttributeRulesApi).toHaveBeenCalledWith('tenant-1', 'model-1')
    expect(listManagedAttributeDefinitionsApi).toHaveBeenCalledWith('tenant-1', {
      page: 1,
      pageSize: 50,
      status: 'ACTIVE'
    })
    expect(listManagedPackagingSpecsApi).toHaveBeenCalledWith('tenant-1', {
      itemModelId: 'model-1',
      page: 1,
      pageSize: 50
    })
    expect(listManagedBomsApi).toHaveBeenCalledWith('tenant-1', {
      outputItemId: 'item-1',
      page: 1,
      pageSize: 50
    })
    expect(wrapper.text()).toContain('MODEL-1')
    expect(wrapper.text()).toContain('Attributes')
    expect(wrapper.text()).toContain('Standard Packaging')
    expect(wrapper.text()).toContain('BOM-PKG')

    await wrapper.get('[data-testid="item-model-smart-create-item"]').trigger('click')
    expect(push).toHaveBeenCalledWith({
      name: 'TenantItemManagementCreate',
      query: { itemModelId: 'model-1' }
    })

    await wrapper.get('[data-testid="item-model-derived-item-item-1"]').trigger('click')
    expect(push).toHaveBeenCalledWith({
      name: 'TenantItemManagementDetail',
      params: { itemId: 'item-1' }
    })

    await wrapper.get('[data-testid="item-model-rule-attribute"]').setValue('attribute-color')
    await wrapper.get('[data-testid="item-model-rule-options"]').setValue(['option-black'])
    await wrapper.get('[data-testid="item-model-rule-required"]').setValue('false')
    await wrapper.get('[data-testid="item-model-rule-add"]').trigger('click')
    await wrapper.get('[data-testid="item-model-rules-save"]').trigger('click')

    expect(setManagedItemModelAttributeRulesApi).toHaveBeenCalledWith('tenant-1', 'model-1', {
      rules: expect.arrayContaining([
        {
          allowedOptionIds: ['option-black'],
          attributeDefinitionId: 'attribute-color',
          required: false
        }
      ])
    })

    await wrapper.get('[data-testid="item-model-smart-packaging"]').trigger('click')
    expect(push).toHaveBeenCalledWith({
      name: 'TenantItemPackagingManagement',
      query: { itemModelId: 'model-1' }
    })

    await wrapper.get('[data-testid="item-model-smart-bom"]').trigger('click')
    expect(push).toHaveBeenCalledWith({
      name: 'TenantItemBomManagement',
      query: { outputItemId: 'item-1' }
    })
  })

  it('guides the next setup action when an ItemModel workbench section is empty', async () => {
    getManagedItemModelAttributeRulesApi.mockResolvedValue({ rules: [] })
    listManagedItemsApi
      .mockResolvedValueOnce({
        items: [],
        total: 0
      })
      .mockResolvedValueOnce({
        items: [],
        total: 0
      })
    listManagedPackagingSpecsApi.mockResolvedValue({
      packagingSpecs: [],
      page: 1,
      pageSize: 50,
      total: 0
    })

    const page = (await import('./item-management.vue')).default
    const wrapper = mount(page)
    await flushPromises()

    await wrapper.get('[data-testid="item-model-select-model-1"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('先配置该 ItemModel 的规格属性')
    expect(wrapper.text()).toContain('AttributeRule 配置完成后，创建具体执行 Item')
    expect(wrapper.text()).toContain('如果该模型需要包装规格')
    expect(wrapper.text()).toContain('BOM 绑定到具体 Item')

    await wrapper.get('[data-testid="item-model-empty-attributes"]').trigger('click')
    expect(push).toHaveBeenCalledWith({ name: 'TenantItemAttributeManagement' })

    await wrapper.get('[data-testid="item-model-empty-create-item"]').trigger('click')
    expect(push).toHaveBeenCalledWith({
      name: 'TenantItemManagementCreate',
      query: { itemModelId: 'model-1' }
    })

    await wrapper.get('[data-testid="item-model-empty-packaging"]').trigger('click')
    expect(push).toHaveBeenCalledWith({
      name: 'TenantItemPackagingManagement',
      query: { itemModelId: 'model-1' }
    })

    await wrapper.get('[data-testid="item-model-empty-bom-create-item"]').trigger('click')
    expect(push).toHaveBeenCalledWith({
      name: 'TenantItemManagementCreate',
      query: { itemModelId: 'model-1' }
    })
  })

  it('batch-generates STANDARD Items from required ItemModel attribute option combinations', async () => {
    getManagedItemModelAttributeRulesApi.mockResolvedValue({
      rules: [
        {
          allowedOptionIds: ['option-white', 'option-black'],
          attributeDefinitionId: 'attribute-color',
          itemModelId: 'model-1',
          required: true
        }
      ]
    })
    listManagedItemsApi
      .mockResolvedValueOnce({
        items: [],
        total: 0
      })
      .mockResolvedValueOnce({
        items: [],
        total: 0
      })
      .mockResolvedValue({
        items: [],
        total: 0
      })
    createManagedItemApi.mockResolvedValue({ itemId: 'created-item' })

    const page = (await import('./item-management.vue')).default
    const wrapper = mount(page)
    await flushPromises()

    await wrapper.get('[data-testid="item-model-select-model-1"]').trigger('click')
    await flushPromises()

    await wrapper.get('[data-testid="item-model-batch-generate-items"]').trigger('click')
    await flushPromises()

    expect(createManagedItemApi).toHaveBeenCalledTimes(2)
    expect(createManagedItemApi).toHaveBeenNthCalledWith(
      1,
      'tenant-1',
      expect.objectContaining({
        itemCode: 'MODEL-1-WHITE',
        itemModelId: 'model-1',
        itemName: 'Model 1 - White',
        itemType: 'STANDARD',
        lockedAttributeOptionIds: ['option-white'],
        packagingSpecId: undefined
      })
    )
    expect(createManagedItemApi).toHaveBeenNthCalledWith(
      2,
      'tenant-1',
      expect.objectContaining({
        itemCode: 'MODEL-1-BLACK',
        itemModelId: 'model-1',
        itemName: 'Model 1 - Black',
        itemType: 'STANDARD',
        lockedAttributeOptionIds: ['option-black'],
        packagingSpecId: undefined
      })
    )
  })

  it('bulk-updates selected derived Item status and editable capabilities', async () => {
    listManagedItemsApi
      .mockResolvedValueOnce({
        items: [
          {
            itemId: 'item-1',
            itemModelId: 'model-1',
            itemCode: 'SKU-1',
            itemName: 'SKU 1',
            itemType: 'STANDARD',
            lockedAttributeOptionIds: ['option-white'],
            status: 'ACTIVE',
            capabilities: {
              assemblable: false,
              manufacturable: false,
              packable: false,
              packaged: false,
              purchasable: false,
              sellable: false,
              stockable: false,
              transformable: false
            }
          },
          {
            itemId: 'item-2',
            itemModelId: 'model-1',
            itemCode: 'SKU-2',
            itemName: 'SKU 2',
            itemType: 'PACKAGED_FINISHED_GOOD',
            lockedAttributeOptionIds: ['option-black'],
            status: 'ACTIVE',
            capabilities: {
              assemblable: false,
              manufacturable: false,
              packable: false,
              packaged: true,
              purchasable: false,
              sellable: false,
              stockable: false,
              transformable: false
            }
          }
        ],
        total: 2
      })
      .mockResolvedValueOnce({
        items: [
          {
            itemId: 'item-1',
            itemModelId: 'model-1',
            itemCode: 'SKU-1',
            itemName: 'SKU 1',
            itemType: 'STANDARD',
            lockedAttributeOptionIds: ['option-white'],
            status: 'ACTIVE',
            capabilities: {
              assemblable: false,
              manufacturable: false,
              packable: false,
              packaged: false,
              purchasable: false,
              sellable: false,
              stockable: false,
              transformable: false
            }
          },
          {
            itemId: 'item-2',
            itemModelId: 'model-1',
            itemCode: 'SKU-2',
            itemName: 'SKU 2',
            itemType: 'PACKAGED_FINISHED_GOOD',
            lockedAttributeOptionIds: ['option-black'],
            status: 'ACTIVE',
            capabilities: {
              assemblable: false,
              manufacturable: false,
              packable: false,
              packaged: true,
              purchasable: false,
              sellable: false,
              stockable: false,
              transformable: false
            }
          }
        ],
        total: 2
      })
      .mockResolvedValue({
        items: [],
        total: 0
      })

    const page = (await import('./item-management.vue')).default
    const wrapper = mount(page)
    await flushPromises()

    await wrapper.get('[data-testid="item-model-select-model-1"]').trigger('click')
    await flushPromises()

    await wrapper.get('[data-testid="item-model-derived-select-item-1"]').setValue(true)
    await wrapper.get('[data-testid="item-model-derived-select-item-2"]').setValue(true)
    await wrapper.get('[data-testid="item-model-bulk-status"]').setValue('INACTIVE')
    await wrapper.get('[data-testid="item-model-bulk-capability-sellable"]').setValue(true)
    await wrapper.get('[data-testid="item-model-bulk-capability-stockable"]').setValue(true)
    await wrapper.get('[data-testid="item-model-bulk-apply"]').trigger('click')
    await flushPromises()

    expect(changeManagedItemStatusApi).toHaveBeenCalledWith('tenant-1', 'item-1', { status: 'INACTIVE' })
    expect(changeManagedItemStatusApi).toHaveBeenCalledWith('tenant-1', 'item-2', { status: 'INACTIVE' })
    expect(setManagedItemCapabilitiesApi).toHaveBeenCalledWith('tenant-1', 'item-1', {
      capabilities: expect.objectContaining({
        packaged: false,
        sellable: true,
        stockable: true
      })
    })
    expect(setManagedItemCapabilitiesApi).toHaveBeenCalledWith('tenant-1', 'item-2', {
      capabilities: expect.objectContaining({
        packaged: true,
        sellable: true,
        stockable: true
      })
    })
    expect(wrapper.find('[data-testid="item-model-bulk-capability-packaged"]').exists()).toBe(false)
  })

  it('shows ItemModel workbench completeness gaps for derived Items', async () => {
    listManagedItemsApi
      .mockResolvedValueOnce({
        items: [],
        total: 0
      })
      .mockResolvedValueOnce({
        items: [
          {
            itemId: 'item-missing-capability',
            itemModelId: 'model-1',
            itemCode: 'SKU-NO-CAP',
            itemName: 'Missing Capability',
            itemType: 'STANDARD',
            lockedAttributeOptionIds: ['option-white'],
            status: 'ACTIVE',
            capabilities: {
              assemblable: false,
              manufacturable: false,
              packable: false,
              packaged: false,
              purchasable: false,
              sellable: false,
              stockable: false,
              transformable: false
            }
          },
          {
            itemId: 'item-packaged-gap',
            itemModelId: 'model-1',
            itemCode: 'SKU-PACKAGED-GAP',
            itemName: 'Packaged Gap',
            itemType: 'PACKAGED_FINISHED_GOOD',
            lockedAttributeOptionIds: ['option-black'],
            status: 'ACTIVE',
            capabilities: {
              assemblable: false,
              manufacturable: false,
              packable: false,
              packaged: true,
              purchasable: true,
              sellable: true,
              stockable: true,
              transformable: false
            }
          }
        ],
        total: 2
      })
    listManagedBomsApi.mockResolvedValue({
      boms: [],
      page: 1,
      pageSize: 50,
      total: 0
    })
    listManagedSupplierItemMappingsApi.mockResolvedValue({
      mappings: [],
      page: 1,
      pageSize: 50,
      total: 0
    })

    const page = (await import('./item-management.vue')).default
    const wrapper = mount(page)
    await flushPromises()

    await wrapper.get('[data-testid="item-model-select-model-1"]').trigger('click')
    await flushPromises()

    expect(listManagedSupplierItemMappingsApi).toHaveBeenCalledWith('tenant-1', 'item-packaged-gap', {
      page: 1,
      pageSize: 50
    })
    expect(wrapper.text()).toContain('SKU-NO-CAP')
    expect(wrapper.text()).toContain('缺 capability')
    expect(wrapper.text()).toContain('SKU-PACKAGED-GAP')
    expect(wrapper.text()).toContain('缺 PackagingSpec')
    expect(wrapper.text()).toContain('缺 PACKAGING_BOM')
    expect(wrapper.text()).toContain('缺 SupplierMapping')
  })

  it('routes derived Item completeness gaps to the matching setup workbench', async () => {
    listManagedItemsApi
      .mockResolvedValueOnce({
        items: [],
        total: 0
      })
      .mockResolvedValueOnce({
        items: [
          {
            itemId: 'item-packaged-gap',
            itemModelId: 'model-1',
            itemCode: 'SKU-PACKAGED-GAP',
            itemName: 'Packaged Gap',
            itemType: 'PACKAGED_FINISHED_GOOD',
            lockedAttributeOptionIds: ['option-black'],
            status: 'ACTIVE',
            capabilities: {
              assemblable: false,
              manufacturable: false,
              packable: false,
              packaged: true,
              purchasable: true,
              sellable: true,
              stockable: true,
              transformable: false
            }
          }
        ],
        total: 1
      })
    listManagedBomsApi.mockResolvedValue({
      boms: [],
      page: 1,
      pageSize: 50,
      total: 0
    })
    listManagedSupplierItemMappingsApi.mockResolvedValue({
      mappings: [],
      page: 1,
      pageSize: 50,
      total: 0
    })

    const page = (await import('./item-management.vue')).default
    const wrapper = mount(page)
    await flushPromises()

    await wrapper.get('[data-testid="item-model-select-model-1"]').trigger('click')
    await flushPromises()

    await wrapper.get('[data-testid="item-model-derived-gap-item-packaged-gap-缺 PackagingSpec"]').trigger('click')
    expect(push).toHaveBeenCalledWith({
      name: 'TenantItemPackagingManagement',
      query: { itemModelId: 'model-1' }
    })

    await wrapper.get('[data-testid="item-model-derived-gap-item-packaged-gap-缺 PACKAGING_BOM"]').trigger('click')
    expect(push).toHaveBeenCalledWith({
      name: 'TenantItemBomManagement',
      query: { bomType: 'PACKAGING', outputItemId: 'item-packaged-gap' }
    })

    await wrapper.get('[data-testid="item-model-derived-gap-item-packaged-gap-缺 SupplierMapping"]').trigger('click')
    expect(push).toHaveBeenCalledWith({
      name: 'TenantItemManagementDetail',
      params: { itemId: 'item-packaged-gap' }
    })
  })
})
