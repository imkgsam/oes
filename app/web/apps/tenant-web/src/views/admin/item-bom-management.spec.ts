/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const changeManagedBomStatusApi = vi.fn()
const createManagedBomApi = vi.fn()
const listManagedBomsApi = vi.fn()
const listManagedItemsApi = vi.fn()
const replaceManagedBomLinesApi = vi.fn()
const updateManagedBomBasicsApi = vi.fn()
const routeState: any = {
  query: {}
}

const authContextState: any = {
  actionCodes: ['item_master.bom.list', 'item_master.bom.create', 'item_master.bom.manage'],
  sessionContext: {
    tenant: {
      tenantId: 'tenant-1',
      name: 'Alpha Tenant'
    }
  },
  tenantName: 'Alpha Tenant',
  visibleEntries: ['master-data.item-bom-management']
}

vi.mock('#/api', () => ({
  changeManagedBomStatusApi,
  createManagedBomApi,
  listManagedBomsApi,
  listManagedItemsApi,
  replaceManagedBomLinesApi,
  updateManagedBomBasicsApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeState
}))

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    template: '<div><slot /></div>'
  }
}))

vi.mock('ant-design-vue', async () => await import('./__tests__/ant-design-vue-mock'))

// Verifies the standalone BOM page owns first-phase BOM directory and line replacement.
describe('item BOM management page', () => {
  beforeEach(() => {
    changeManagedBomStatusApi.mockReset()
    createManagedBomApi.mockReset()
    listManagedBomsApi.mockReset()
    listManagedItemsApi.mockReset()
    replaceManagedBomLinesApi.mockReset()
    updateManagedBomBasicsApi.mockReset()
    routeState.query = {}

    listManagedItemsApi.mockResolvedValue({
      items: [
        {
          itemId: 'item-out',
          itemCode: 'TOILET-PKG',
          itemName: 'Packaged Toilet',
          itemType: 'PACKAGED_FINISHED_GOOD',
          capabilities: {},
          status: 'ACTIVE'
        },
        {
          itemId: 'item-in',
          itemCode: 'TOILET',
          itemName: 'Toilet',
          itemType: 'STANDARD',
          capabilities: {},
          status: 'ACTIVE'
        },
        {
          itemId: 'item-carton',
          itemCode: 'CARTON',
          itemName: 'Carton',
          itemType: 'STANDARD',
          capabilities: {},
          status: 'ACTIVE'
        }
      ],
      page: 1,
      pageSize: 50,
      total: 3
    })
    listManagedBomsApi.mockResolvedValue({
      boms: [
        {
          bomId: 'bom-1',
          bomCode: 'BOM-PKG',
          bomName: 'Packaging BOM',
          bomType: 'PACKAGING',
          outputItemId: 'item-out',
          status: 'ACTIVE',
          lines: [
            {
              bomLineId: 'line-1',
              componentItemId: 'item-in',
              lineRole: 'PRIMARY_INPUT',
              quantity: '1',
              uomCode: 'PCS'
            }
          ]
        }
      ],
      page: 1,
      pageSize: 50,
      total: 1
    })
    createManagedBomApi.mockResolvedValue({
      bomId: 'bom-2',
      bom: {
        bomId: 'bom-2',
        bomCode: 'BOM-COMP',
        bomName: 'Composition BOM',
        bomType: 'COMPOSITION',
        outputItemId: 'item-out',
        status: 'ACTIVE',
        lines: []
      }
    })
    updateManagedBomBasicsApi.mockResolvedValue({
      bomId: 'bom-1',
      bomCode: 'BOM-PKG-REV',
      bomName: 'Packaging BOM Rev',
      bomType: 'PACKAGING',
      outputItemId: 'item-out',
      status: 'ACTIVE',
      lines: []
    })
    replaceManagedBomLinesApi.mockResolvedValue({
      bomId: 'bom-1',
      bomCode: 'BOM-PKG-REV',
      bomName: 'Packaging BOM Rev',
      bomType: 'PACKAGING',
      outputItemId: 'item-out',
      status: 'ACTIVE',
      lines: []
    })
    changeManagedBomStatusApi.mockResolvedValue({
      bomId: 'bom-1',
      bomCode: 'BOM-PKG-REV',
      bomName: 'Packaging BOM Rev',
      bomType: 'PACKAGING',
      outputItemId: 'item-out',
      status: 'INACTIVE',
      lines: []
    })
  })

  it('loads BOMs, filters by type and output Item, creates BOMs, and replaces selected BOM lines', async () => {
    const page = (await import('./item-bom-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(listManagedItemsApi).toHaveBeenCalledWith('tenant-1', {
      page: 1,
      pageSize: 50,
      status: 'ACTIVE'
    })
    expect(listManagedBomsApi).toHaveBeenCalledWith('tenant-1', {
      bomType: undefined,
      componentItemId: undefined,
      keyword: undefined,
      outputItemId: undefined,
      page: 1,
      pageSize: 50,
      status: undefined
    })
    expect(wrapper.text()).toContain('Item BOM 管理')
    expect(wrapper.text()).toContain('BOM-PKG')

    await wrapper.get('[data-testid="bom-filter-type"]').setValue('PACKAGING')
    await wrapper.get('[data-testid="bom-filter-output"]').setValue('item-out')
    await wrapper.get('[data-testid="bom-filter-status"]').setValue('ACTIVE')
    await wrapper.get('[data-testid="bom-filter-submit"]').trigger('click')

    expect(listManagedBomsApi).toHaveBeenLastCalledWith('tenant-1', {
      bomType: 'PACKAGING',
      componentItemId: undefined,
      keyword: undefined,
      outputItemId: 'item-out',
      page: 1,
      pageSize: 50,
      status: 'ACTIVE'
    })

    await wrapper.get('[data-testid="bom-create-button"]').trigger('click')
    await wrapper.get('[data-testid="bom-code"]').setValue('BOM-COMP')
    await wrapper.get('[data-testid="bom-name"]').setValue('Composition BOM')
    await wrapper.get('[data-testid="bom-type"]').setValue('COMPOSITION')
    await wrapper.get('[data-testid="bom-output-item"]').setValue('item-out')
    await wrapper.get('[data-testid="bom-line-component"]').setValue('item-in')
    await wrapper.get('[data-testid="bom-line-role"]').setValue('COMPONENT')
    await wrapper.get('[data-testid="bom-line-quantity"]').setValue('2')
    await wrapper.get('[data-testid="bom-line-uom"]').setValue('PCS')
    await wrapper.get('[data-testid="bom-line-add"]').trigger('click')
    await wrapper.get('[data-testid="bom-submit"]').trigger('click')
    await flushPromises()

    expect(createManagedBomApi).toHaveBeenCalledWith('tenant-1', {
      bomCode: 'BOM-COMP',
      bomName: 'Composition BOM',
      bomType: 'COMPOSITION',
      outputItemId: 'item-out',
      lines: [
        {
          componentItemId: 'item-in',
          lineRole: 'COMPONENT',
          lineNote: undefined,
          quantity: '2',
          uomCode: 'PCS'
        }
      ]
    })

    await wrapper.get('[data-testid="bom-row-bom-1"]').trigger('click')
    await wrapper.get('[data-testid="bom-code"]').setValue('BOM-PKG-REV')
    await wrapper.get('[data-testid="bom-name"]').setValue('Packaging BOM Rev')
    await wrapper.get('[data-testid="bom-status"]').setValue('INACTIVE')
    await wrapper.get('[data-testid="bom-line-clear"]').trigger('click')
    await wrapper.get('[data-testid="bom-line-component"]').setValue('item-in')
    await wrapper.get('[data-testid="bom-line-role"]').setValue('PRIMARY_INPUT')
    await wrapper.get('[data-testid="bom-line-quantity"]').setValue('1')
    await wrapper.get('[data-testid="bom-line-uom"]').setValue('PCS')
    await wrapper.get('[data-testid="bom-line-add"]').trigger('click')
    await wrapper.get('[data-testid="bom-line-component"]').setValue('item-carton')
    await wrapper.get('[data-testid="bom-line-role"]').setValue('PACKAGING_MATERIAL')
    await wrapper.get('[data-testid="bom-line-quantity"]').setValue('1')
    await wrapper.get('[data-testid="bom-line-uom"]').setValue('PCS')
    await wrapper.get('[data-testid="bom-line-add"]').trigger('click')
    await wrapper.get('[data-testid="bom-submit"]').trigger('click')

    expect(updateManagedBomBasicsApi).toHaveBeenCalledWith('tenant-1', 'bom-1', {
      bomCode: 'BOM-PKG-REV',
      bomName: 'Packaging BOM Rev'
    })
    expect(replaceManagedBomLinesApi).toHaveBeenCalledWith('tenant-1', 'bom-1', {
      lines: [
        {
          componentItemId: 'item-in',
          lineRole: 'PRIMARY_INPUT',
          lineNote: undefined,
          quantity: '1',
          uomCode: 'PCS'
        },
        {
          componentItemId: 'item-carton',
          lineRole: 'PACKAGING_MATERIAL',
          lineNote: undefined,
          quantity: '1',
          uomCode: 'PCS'
        }
      ]
    })
    expect(changeManagedBomStatusApi).toHaveBeenCalledWith('tenant-1', 'bom-1', {
      status: 'INACTIVE'
    })
  })

  it('shows an empty state when no BOMs exist', async () => {
    listManagedBomsApi.mockResolvedValue({
      boms: [],
      page: 1,
      pageSize: 50,
      total: 0
    })

    const page = (await import('./item-bom-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(wrapper.text()).toContain('暂无 BOM')
  })

  it('applies output Item query filters when opened from the ItemModel workbench', async () => {
    routeState.query = {
      outputItemId: 'item-out'
    }

    const page = (await import('./item-bom-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(listManagedBomsApi).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        outputItemId: 'item-out'
      })
    )
    expect((wrapper.get('[data-testid="bom-filter-output"]').element as HTMLSelectElement).value).toBe('item-out')
  })

  it('applies BOM type query filters when opened from a completeness gap link', async () => {
    routeState.query = {
      bomType: 'PACKAGING',
      outputItemId: 'item-out'
    }

    const page = (await import('./item-bom-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(listManagedBomsApi).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        bomType: 'PACKAGING',
        outputItemId: 'item-out'
      })
    )
    expect((wrapper.get('[data-testid="bom-filter-type"]').element as HTMLSelectElement).value).toBe('PACKAGING')
  })

  it('blocks PACKAGING_BOM when output Item or line roles do not match packaging semantics', async () => {
    const page = (await import('./item-bom-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    await wrapper.get('[data-testid="bom-create-button"]').trigger('click')
    await wrapper.get('[data-testid="bom-code"]').setValue('BOM-PKG-BAD')
    await wrapper.get('[data-testid="bom-name"]').setValue('Invalid Packaging BOM')
    await wrapper.get('[data-testid="bom-type"]').setValue('PACKAGING')
    await wrapper.get('[data-testid="bom-output-item"]').setValue('item-in')
    await wrapper.get('[data-testid="bom-line-component"]').setValue('item-carton')
    await wrapper.get('[data-testid="bom-line-role"]').setValue('PACKAGING_MATERIAL')
    await wrapper.get('[data-testid="bom-line-add"]').trigger('click')
    await wrapper.get('[data-testid="bom-submit"]').trigger('click')

    expect(createManagedBomApi).not.toHaveBeenCalledWith('tenant-1', expect.objectContaining({ bomCode: 'BOM-PKG-BAD' }))
    expect(wrapper.text()).toContain('PACKAGING_BOM 的输出 Item 必须是 PackagedItem')

    await wrapper.get('[data-testid="bom-output-item"]').setValue('item-out')
    await wrapper.get('[data-testid="bom-submit"]').trigger('click')

    expect(createManagedBomApi).not.toHaveBeenCalledWith('tenant-1', expect.objectContaining({ bomCode: 'BOM-PKG-BAD' }))
    expect(wrapper.text()).toContain('PACKAGING_BOM 至少需要一个 PRIMARY_INPUT')
  })

  it('blocks composition and transformation BOMs when required line roles are missing', async () => {
    const page = (await import('./item-bom-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    await wrapper.get('[data-testid="bom-create-button"]').trigger('click')
    await wrapper.get('[data-testid="bom-code"]').setValue('BOM-COMP-BAD')
    await wrapper.get('[data-testid="bom-name"]').setValue('Invalid Composition BOM')
    await wrapper.get('[data-testid="bom-type"]').setValue('COMPOSITION')
    await wrapper.get('[data-testid="bom-output-item"]').setValue('item-in')
    await wrapper.get('[data-testid="bom-line-component"]').setValue('item-carton')
    await wrapper.get('[data-testid="bom-line-role"]').setValue('PRIMARY_INPUT')
    await wrapper.get('[data-testid="bom-line-add"]').trigger('click')
    await wrapper.get('[data-testid="bom-submit"]').trigger('click')

    expect(createManagedBomApi).not.toHaveBeenCalledWith('tenant-1', expect.objectContaining({ bomCode: 'BOM-COMP-BAD' }))
    expect(wrapper.text()).toContain('COMPOSITION_BOM 至少需要一个 COMPONENT')

    await wrapper.get('[data-testid="bom-code"]').setValue('BOM-TRANS-BAD')
    await wrapper.get('[data-testid="bom-name"]').setValue('Invalid Transformation BOM')
    await wrapper.get('[data-testid="bom-type"]').setValue('TRANSFORMATION')
    await wrapper.get('[data-testid="bom-line-clear"]').trigger('click')
    await wrapper.get('[data-testid="bom-line-component"]').setValue('item-carton')
    await wrapper.get('[data-testid="bom-line-role"]').setValue('COMPONENT')
    await wrapper.get('[data-testid="bom-line-add"]').trigger('click')
    await wrapper.get('[data-testid="bom-submit"]').trigger('click')

    expect(createManagedBomApi).not.toHaveBeenCalledWith('tenant-1', expect.objectContaining({ bomCode: 'BOM-TRANS-BAD' }))
    expect(wrapper.text()).toContain('TRANSFORMATION_BOM 至少需要一个 PRIMARY_INPUT')
  })
})
