/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createManagedItemApi = vi.fn()
const listManagedItemModelsApi = vi.fn()
const push = vi.fn()

vi.mock('#/api', () => ({
  createManagedItemApi,
  listManagedItemModelsApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => ({
    sessionContext: {
      tenant: {
        tenantId: 'tenant-1'
      }
    }
  })
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

vi.mock('@vben/icons', () => ({
  IconifyIcon: {
    name: 'IconifyIcon',
    template: '<span data-testid="iconify-icon" />'
  }
}))

describe('item management V2 create page', () => {
  beforeEach(() => {
    createManagedItemApi.mockReset()
    listManagedItemModelsApi.mockReset()
    push.mockReset()
    listManagedItemModelsApi.mockResolvedValue({
      itemModels: [
        {
          itemModelId: 'model-1',
          modelCode: 'MODEL-1',
          modelName: 'Model 1'
        }
      ]
    })
    createManagedItemApi.mockResolvedValue({ itemId: 'item-1' })
  })

  it('creates one executable Item from an ItemModel and redirects to detail', async () => {
    const page = (await import('./item-management-create.vue')).default
    const wrapper = mount(page)
    await flushPromises()

    await wrapper.get('[data-testid="create-item-code"]').setValue('SKU-1')
    await wrapper.get('[data-testid="create-item-name"]').setValue('SKU 1')
    await wrapper.get('[data-testid="create-item-submit"]').trigger('click')
    await flushPromises()

    expect(createManagedItemApi).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        itemModelId: 'model-1',
        itemType: 'STANDARD'
      })
    )
    expect(push).toHaveBeenCalledWith({ name: 'TenantItemManagementDetail', params: { itemId: 'item-1' } })
  })
})
