/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createManagedItemApi = vi.fn()
const push = vi.fn()

const authContextState: any = {
  actionCodes: ['item_master.item.create'],
  sessionContext: {
    tenant: {
      tenantId: 'tenant-1',
      name: 'Alpha Tenant'
    }
  },
  tenantName: 'Alpha Tenant',
  visibleEntries: ['master-data.item-management']
}

vi.mock('#/api', () => ({
  createManagedItemApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push
  })
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

// Verifies the phase 1 item create page only submits the frozen creation fields and returns to the detail route.
describe('item management create page', () => {
  beforeEach(() => {
    createManagedItemApi.mockReset()
    push.mockReset()
    createManagedItemApi.mockResolvedValue({
      itemId: 'item-1',
      item: {
        itemId: 'item-1'
      }
    })
  })

  it('creates one phase 1 item and redirects to the new detail page', async () => {
    const page = (await import('./item-management-create.vue')).default
    const wrapper = mount(page)

    await wrapper.get('[data-testid="create-item-code"]').setValue('ITEM-001')
    await wrapper.get('[data-testid="create-item-name"]').setValue('Starter Item')
    await wrapper.get('[data-testid="create-item-structure"]').setValue('SINGLE')
    await wrapper.get('[data-testid="create-item-nature"]').setValue('PHYSICAL')
    await wrapper.get('[data-testid="create-item-submit"]').trigger('click')

    await flushPromises()

    expect(createManagedItemApi).toHaveBeenCalledWith('tenant-1', {
      itemCode: 'ITEM-001',
      itemName: 'Starter Item',
      structureType: 'SINGLE',
      natureType: 'PHYSICAL'
    })
    expect(push).toHaveBeenCalledWith({
      name: 'TenantItemManagementDetail',
      params: {
        itemId: 'item-1'
      }
    })
    expect(wrapper.text()).toContain('Item → 详情 → 模具方案')
    expect(wrapper.text()).toContain('创建后进入详情补齐能力、分类和模具方案')
    expect(wrapper.text()).toContain('Deferred')
  })
})
