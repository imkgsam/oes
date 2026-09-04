/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createManagedSupplierApi = vi.fn()
const push = vi.fn()

const authContextState: any = {
  actionCodes: ['srm.supplier_profile.create'],
  sessionContext: {
    tenant: {
      tenantId: 'tenant-1',
      name: 'Alpha Tenant'
    }
  },
  tenantName: 'Alpha Tenant',
  visibleEntries: ['master-data.supplier-management']
}

vi.mock('#/api', () => ({
  createManagedSupplierApi
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

// Verifies the phase 1 supplier create page only submits the frozen creation fields and returns to the detail route.
describe('supplier management create page', () => {
  beforeEach(() => {
    createManagedSupplierApi.mockReset()
    push.mockReset()
    createManagedSupplierApi.mockResolvedValue({
      supplierId: 'supplier-1'
    })
  })

  it('creates one phase 1 supplier shell and redirects to the new detail page', async () => {
    const page = (await import('./supplier-management-create.vue')).default
    const wrapper = mount(page)

    await wrapper.get('[data-testid="create-supplier-display-name"]').setValue('Alpha Supply')
    await wrapper.get('[data-testid="create-supplier-no"]').setValue('SUP-001')
    await wrapper.get('[data-testid="create-supplier-category"]').setValue('RAW_MATERIAL')
    await wrapper.get('[data-testid="create-supplier-tags"]').setValue('strategic, cn')
    await wrapper.get('[data-testid="create-supplier-submit"]').trigger('click')

    await flushPromises()

    expect(createManagedSupplierApi).toHaveBeenCalledWith('tenant-1', {
      displayName: 'Alpha Supply',
      supplierNo: 'SUP-001',
      supplierCategory: 'RAW_MATERIAL',
      tags: ['strategic', 'cn']
    })
    expect(push).toHaveBeenCalledWith({
      name: 'TenantSupplierManagementDetail',
      params: {
        supplierId: 'supplier-1'
      }
    })
    expect(wrapper.text()).toContain('Deferred')
  })
})
