/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createManagedItemApi = vi.fn()
const createManagedItemModelApi = vi.fn()
const listManagedItemModelsApi = vi.fn()
const listManagedItemsApi = vi.fn()
const push = vi.fn()

const authContextState: any = {
  actionCodes: [
    'item_master.item.list',
    'item_master.item.get_by_id',
    'item_master.item.create',
    'item_master.item_model.list',
    'item_master.item_model.create'
  ],
  sessionContext: {
    tenant: {
      tenantId: 'tenant-1'
    }
  }
}

vi.mock('#/api', () => ({
  createManagedItemApi,
  createManagedItemModelApi,
  listManagedItemModelsApi,
  listManagedItemsApi
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
    listManagedItemModelsApi.mockReset()
    listManagedItemsApi.mockReset()
    push.mockReset()
    listManagedItemModelsApi.mockResolvedValue({
      itemModels: [
        {
          itemModelId: 'model-1',
          modelCode: 'MODEL-1',
          modelKind: 'PHYSICAL',
          modelName: 'Model 1',
          modelType: 'FINISHED_PRODUCT',
          status: 'ACTIVE',
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

    expect(listManagedItemModelsApi).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ status: 'ACTIVE' }))
    expect(listManagedItemsApi).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ page: 1, pageSize: 20 }))
  })

  it('creates executable Items from selected ItemModel ids', async () => {
    createManagedItemApi.mockResolvedValue({ itemId: 'item-2' })
    const page = (await import('./item-management.vue')).default
    const wrapper = mount(page)
    await flushPromises()

    await wrapper.get('[data-testid="item-create-button"]').trigger('click')
    await wrapper.get('[data-testid="create-modal-item-code"]').setValue('SKU-2')
    await wrapper.get('[data-testid="create-modal-item-name"]').setValue('SKU 2')
    await wrapper.get('[data-testid="create-modal-submit"]').trigger('click')
    await flushPromises()

    expect(createManagedItemApi).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        itemModelId: 'model-1',
        itemType: 'STANDARD'
      })
    )
    expect(push).toHaveBeenCalledWith({ name: 'TenantItemManagementDetail', params: { itemId: 'item-2' } })
  })
})
