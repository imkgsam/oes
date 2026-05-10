/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const changeManagedItemStatusApi = vi.fn()
const createManagedBomApi = vi.fn()
const getManagedBomByOutputItemApi = vi.fn()
const getManagedItemByIdApi = vi.fn()
const listManagedItemsApi = vi.fn()
const listManagedSupplierItemMappingsApi = vi.fn()
const replaceManagedBomLinesApi = vi.fn()
const setManagedItemCapabilitiesApi = vi.fn()
const updateManagedItemBasicsApi = vi.fn()
const upsertManagedSupplierItemMappingApi = vi.fn()

vi.mock('#/api', () => ({
  changeManagedItemStatusApi,
  createManagedBomApi,
  getManagedBomByOutputItemApi,
  getManagedItemByIdApi,
  listManagedItemsApi,
  listManagedSupplierItemMappingsApi,
  replaceManagedBomLinesApi,
  setManagedItemCapabilitiesApi,
  updateManagedItemBasicsApi,
  upsertManagedSupplierItemMappingApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => ({
    actionCodes: [
      'item_master.item.update_basics',
      'item_master.item.update_status',
      'item_master.item.set_capabilities',
      'item_master.bom.manage',
      'item_master.supplier_item_mapping.upsert'
    ],
    sessionContext: {
      tenant: {
        tenantId: 'tenant-1'
      }
    }
  })
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: {
      itemId: 'item-1'
    }
  })
}))

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    template: '<div><slot /></div>'
  }
}))

vi.mock('ant-design-vue', async () => await import('./__tests__/ant-design-vue-mock'))

describe('item management V2 detail page', () => {
  beforeEach(() => {
    changeManagedItemStatusApi.mockReset()
    createManagedBomApi.mockReset()
    getManagedBomByOutputItemApi.mockReset()
    getManagedItemByIdApi.mockReset()
    listManagedItemsApi.mockReset()
    listManagedSupplierItemMappingsApi.mockReset()
    replaceManagedBomLinesApi.mockReset()
    setManagedItemCapabilitiesApi.mockReset()
    updateManagedItemBasicsApi.mockReset()
    upsertManagedSupplierItemMappingApi.mockReset()
    getManagedItemByIdApi.mockResolvedValue({
      itemId: 'item-1',
      itemModelId: 'model-1',
      itemCode: 'SKU-1',
      itemName: 'SKU 1',
      itemType: 'STANDARD',
      lockedAttributeOptionIds: [],
      status: 'ACTIVE',
      capabilities: {
        assemblable: false,
        manufacturable: false,
        packable: true,
        packaged: false,
        purchasable: false,
        sellable: true,
        stockable: true,
        transformable: false
      }
    })
    getManagedBomByOutputItemApi.mockResolvedValue({
      bom: {
        bomId: 'bom-1',
        lines: [
          {
            bomLineId: 'line-1',
            componentItemId: 'component-1',
            lineRole: 'COMPONENT',
            quantity: '1',
            uomCode: 'PCS'
          }
        ]
      }
    })
    listManagedItemsApi.mockResolvedValue({
      items: [
        {
          itemId: 'component-1',
          itemCode: 'COMP-1',
          itemName: 'Component 1',
          capabilities: {
            assemblable: false,
            manufacturable: false,
            packable: false,
            packaged: false,
            purchasable: false,
            sellable: false,
            stockable: true,
            transformable: false
          }
        },
        {
          itemId: 'component-2',
          itemCode: 'COMP-2',
          itemName: 'Component 2',
          capabilities: {
            assemblable: false,
            manufacturable: false,
            packable: false,
            packaged: false,
            purchasable: false,
            sellable: false,
            stockable: true,
            transformable: false
          }
        }
      ]
    })
    listManagedSupplierItemMappingsApi.mockResolvedValue({ mappings: [] })
  })

  it('loads Item detail and resolves its composition BOM', async () => {
    const page = (await import('./item-management-detail.vue')).default
    mount(page)
    await flushPromises()

    expect(getManagedItemByIdApi).toHaveBeenCalledWith('tenant-1', 'item-1')
    expect(getManagedBomByOutputItemApi).toHaveBeenCalledWith('tenant-1', 'item-1', {
      bomType: 'COMPOSITION'
    })
  })

  it('replaces BOM lines when component selections change', async () => {
    const page = (await import('./item-management-detail.vue')).default
    const wrapper = mount(page)
    await flushPromises()

    await wrapper.get('[data-testid="detail-edit-button"]').trigger('click')
    await wrapper.get('[data-testid="detail-component-component-2"]').setValue(true)
    await wrapper.get('[data-testid="detail-save-all"]').trigger('click')
    await flushPromises()

    expect(replaceManagedBomLinesApi).toHaveBeenCalledWith(
      'tenant-1',
      'bom-1',
      expect.objectContaining({
        lines: expect.arrayContaining([
          expect.objectContaining({
            componentItemId: 'component-2',
            lineRole: 'COMPONENT'
          })
        ])
      })
    )
  })
})
