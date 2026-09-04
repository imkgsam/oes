/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const changeManagedItemCategoryStatusApi = vi.fn()
const createManagedItemCategoryApi = vi.fn()
const deleteManagedItemCategoryApi = vi.fn()
const listManagedItemCategoriesApi = vi.fn()
const moveManagedItemCategoryApi = vi.fn()
const updateManagedItemCategoryBasicsApi = vi.fn()

const authContextState: any = {
  actionCodes: [
    'item_master.item_category.list',
    'item_master.item_category.create',
    'item_master.item_category.delete',
    'item_master.item_category.update_basics',
    'item_master.item_category.update_status'
  ],
  sessionContext: {
    tenant: {
      tenantId: 'tenant-1',
      name: 'Alpha Tenant'
    }
  },
  tenantName: 'Alpha Tenant',
  visibleEntries: ['master-data.item-category-management']
}

vi.mock('#/api', () => ({
  changeManagedItemCategoryStatusApi,
  createManagedItemCategoryApi,
  deleteManagedItemCategoryApi,
  listManagedItemCategoriesApi,
  moveManagedItemCategoryApi,
  updateManagedItemCategoryBasicsApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
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

vi.mock('ant-design-vue', async () => await import('./__tests__/ant-design-vue-mock'))

// Verifies the standalone item category page owns category tree browsing and category mutations.
describe('item category management page', () => {
  beforeEach(() => {
    changeManagedItemCategoryStatusApi.mockReset()
    createManagedItemCategoryApi.mockReset()
    deleteManagedItemCategoryApi.mockReset()
    listManagedItemCategoriesApi.mockReset()
    moveManagedItemCategoryApi.mockReset()
    updateManagedItemCategoryBasicsApi.mockReset()

    listManagedItemCategoriesApi.mockImplementation(async (_tenantId, params) => {
      if (params.parentCategoryId === 'category-root') {
        return {
          categories: [
            {
              categoryId: 'category-1',
              categoryCode: 'FINISHED',
              categoryName: 'Finished Goods',
              parentCategoryId: 'category-root',
              status: 'ACTIVE',
              hasChildren: false
            }
          ]
        }
      }

      return {
        categories: [
          {
            categoryId: 'category-root',
            categoryCode: 'ROOT',
            categoryName: 'Root Category',
            parentCategoryId: '',
            status: 'ACTIVE',
            hasChildren: true
          }
        ]
      }
    })
    createManagedItemCategoryApi.mockResolvedValue({
      categoryId: 'category-2',
      categoryCode: 'RAW',
      categoryName: 'Raw Material',
      status: 'ACTIVE'
    })
    updateManagedItemCategoryBasicsApi.mockResolvedValue({
      categoryId: 'category-1',
      categoryCode: 'FINISHED-REV',
      categoryName: 'Finished Goods Rev',
      status: 'ACTIVE'
    })
    changeManagedItemCategoryStatusApi.mockResolvedValue({
      categoryId: 'category-1',
      categoryCode: 'FINISHED-REV',
      categoryName: 'Finished Goods Rev',
      status: 'INACTIVE'
    })
    deleteManagedItemCategoryApi.mockResolvedValue({})
    moveManagedItemCategoryApi.mockResolvedValue({
      categoryId: 'category-1',
      categoryCode: 'FINISHED-REV',
      categoryName: 'Finished Goods Rev',
      parentCategoryId: '',
      status: 'INACTIVE'
    })
  })

  it('loads a hierarchical product category list and manages categories through a drawer form', async () => {
    const page = (await import('./item-category-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(listManagedItemCategoriesApi).toHaveBeenCalledWith('tenant-1', {
      parentCategoryId: undefined
    })
    expect(listManagedItemCategoriesApi).toHaveBeenCalledWith('tenant-1', {
      parentCategoryId: 'category-root'
    })
    expect(wrapper.text()).toContain('产品分类管理')
    expect(wrapper.text()).not.toContain('Alpha Tenant')
    expect(wrapper.text()).toContain('Root Category')
    expect(wrapper.text()).toContain('Finished Goods')
    expect(wrapper.find('.ant-card').exists()).toBe(true)
    expect(wrapper.find('.ant-table').exists()).toBe(true)
    expect(wrapper.text()).toContain('分类名称')
    expect(wrapper.text()).toContain('分类编码')
    expect(wrapper.text().indexOf('分类名称')).toBeLessThan(wrapper.text().indexOf('分类编码'))
    expect(wrapper.find('.ant-tree').exists()).toBe(false)
    expect(wrapper.find('[data-testid="category-refresh-button"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="category-form-drawer"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="category-code-category-root"]').text()).toContain('ROOT')
    expect(wrapper.get('[data-testid="category-name-category-root"]').text()).toContain('Root Category')
    expect(wrapper.get('[data-testid="category-operation-category-root"]').classes()).toContain(
      'item-category-workbench__operation-cell'
    )
    expect(wrapper.get('[data-testid="category-code-category-root"]').attributes('data-depth')).toBe('0')
    expect(wrapper.get('[data-testid="category-list-row-category-1"]').attributes('data-depth')).toBe('1')
    expect(wrapper.find('[data-testid="category-row-delete-category-1"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="category-row-delete-category-root"]').attributes('aria-disabled')).toBe('true')
    expect(
      wrapper.find('[data-testid="category-row-delete-confirm-category-root"] .ant-popconfirm-confirm').exists()
    ).toBe(false)

    await wrapper.get('[data-testid="category-row-toggle-category-root"]').trigger('click')
    expect(wrapper.find('[data-testid="category-list-row-category-1"]').exists()).toBe(false)
    await wrapper.get('[data-testid="category-row-toggle-category-root"]').trigger('click')
    expect(wrapper.find('[data-testid="category-list-row-category-1"]').exists()).toBe(true)

    await wrapper.get('[data-testid="category-tree-search"]').setValue('finished')

    expect(wrapper.text()).not.toContain('Root Category')
    expect(wrapper.text()).toContain('Finished Goods')
    await wrapper.get('[data-testid="category-tree-search"]').setValue('')

    await wrapper.get('[data-testid="category-create-button"]').trigger('click')
    expect(wrapper.find('[data-testid="category-form-drawer"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="category-form-drawer"]').text()).toContain('创建分类')
    expect(wrapper.get('[data-testid="category-parent-tree"]').text()).toContain('顶层分类')
    expect(wrapper.get('[data-testid="category-parent-tree"]').text()).toContain('Root Category（ROOT）')
    await wrapper.get('[data-testid="category-parent-tree"]').setValue('category-root')
    await wrapper.get('[data-testid="category-form-code"]').setValue('raw')
    expect((wrapper.get('[data-testid="category-form-code"]').element as HTMLInputElement).value).toBe('RAW')
    await wrapper.get('[data-testid="category-form-name"]').setValue('Raw Material')
    await wrapper.get('[data-testid="category-form-submit"]').trigger('click')
    await flushPromises()

    expect(createManagedItemCategoryApi).toHaveBeenCalledWith('tenant-1', {
      categoryCode: 'RAW',
      categoryName: 'Raw Material',
      parentCategoryId: 'category-root'
    })

    await wrapper.get('[data-testid="category-list-row-category-root"]').trigger('click')
    await wrapper.get('[data-testid="category-row-create-child-category-root"]').trigger('click')
    expect(wrapper.get('[data-testid="category-form-drawer"]').text()).toContain('创建分类')
    expect((wrapper.get('[data-testid="category-parent-tree"]').element as HTMLSelectElement).value).toBe(
      'category-root'
    )
    await wrapper.get('[data-testid="category-form-code"]').setValue('CHILD')
    await wrapper.get('[data-testid="category-form-name"]').setValue('Child Category')
    await wrapper.get('[data-testid="category-form-submit"]').trigger('click')
    await flushPromises()

    expect(createManagedItemCategoryApi).toHaveBeenLastCalledWith('tenant-1', {
      categoryCode: 'CHILD',
      categoryName: 'Child Category',
      parentCategoryId: 'category-root'
    })

    await wrapper.get('[data-testid="category-row-edit-category-1"]').trigger('click')
    expect(wrapper.get('[data-testid="category-form-drawer"]').text()).toContain('编辑产品分类')
    expect(wrapper.find('[data-testid="category-form-status"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="category-status-active-toggle"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="category-status-inactive-toggle"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="category-form-drawer"]').text()).not.toContain('停用后不再用于新建业务')
    expect((wrapper.get('[data-testid="category-status-switch"]').element as HTMLInputElement).checked).toBe(true)
    expect(wrapper.get('[data-testid="category-parent-tree"]').text()).toContain('Root Category（ROOT）')
    expect(wrapper.get('[data-testid="category-parent-tree"]').text()).not.toContain('Finished Goods（FINISHED）')
    await wrapper.get('[data-testid="category-parent-tree"]').setValue('')
    await wrapper.get('[data-testid="category-form-code"]').setValue('FINISHED-REV')
    await wrapper.get('[data-testid="category-form-name"]').setValue('Finished Goods Rev')
    await wrapper.get('[data-testid="category-status-switch"]').setValue(false)
    expect((wrapper.get('[data-testid="category-status-switch"]').element as HTMLInputElement).checked).toBe(false)
    await wrapper.get('[data-testid="category-form-submit"]').trigger('click')
    await flushPromises()

    expect(updateManagedItemCategoryBasicsApi).toHaveBeenCalledWith('tenant-1', 'category-1', {
      categoryCode: 'FINISHED-REV',
      categoryName: 'Finished Goods Rev'
    })
    expect(changeManagedItemCategoryStatusApi).toHaveBeenCalledWith('tenant-1', 'category-1', {
      status: 'INACTIVE'
    })
    expect(moveManagedItemCategoryApi).toHaveBeenCalledWith('tenant-1', 'category-1', {
      parentCategoryId: ''
    })

    await wrapper.get('[data-testid="category-row-delete-category-1"]').trigger('click')
    await flushPromises()

    expect(deleteManagedItemCategoryApi).toHaveBeenCalledWith('tenant-1', 'category-1')
  })

  it('submits one child category create request when save is triggered repeatedly while saving', async () => {
    let resolveCreate: (value: unknown) => void = () => undefined
    createManagedItemCategoryApi.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve
        })
    )

    const page = (await import('./item-category-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    await wrapper.get('[data-testid="category-row-create-child-category-root"]').trigger('click')
    await wrapper.get('[data-testid="category-form-code"]').setValue('split')
    await wrapper.get('[data-testid="category-form-name"]').setValue('分体马桶')

    const submit = wrapper.get('[data-testid="category-form-submit"]')
    submit.element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    submit.element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()

    expect(createManagedItemCategoryApi).toHaveBeenCalledTimes(1)
    expect(createManagedItemCategoryApi).toHaveBeenCalledWith('tenant-1', {
      categoryCode: 'SPLIT',
      categoryName: '分体马桶',
      parentCategoryId: 'category-root'
    })

    resolveCreate({
      categoryCode: 'SPLIT',
      categoryId: 'category-split',
      categoryName: '分体马桶',
      status: 'ACTIVE'
    })
    await flushPromises()
  })

  it('closes the create drawer before refreshing categories after a successful create', async () => {
    let resolveReload: (value: unknown) => void = () => undefined
    let listCallCount = 0

    listManagedItemCategoriesApi.mockImplementation(async (_tenantId, params) => {
      listCallCount += 1
      if (listCallCount > 1) {
        return new Promise((resolve) => {
          resolveReload = resolve
        })
      }

      if (params.parentCategoryId === 'category-root') {
        return {
          categories: []
        }
      }

      return {
        categories: [
          {
            categoryId: 'category-root',
            categoryCode: 'ROOT',
            categoryName: 'Root Category',
            parentCategoryId: '',
            status: 'ACTIVE',
            hasChildren: false
          }
        ]
      }
    })

    const page = (await import('./item-category-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    await wrapper.get('[data-testid="category-row-create-child-category-root"]').trigger('click')
    await wrapper.get('[data-testid="category-form-code"]').setValue('split')
    await wrapper.get('[data-testid="category-form-name"]').setValue('分体马桶')
    await wrapper.get('[data-testid="category-form-submit"]').trigger('click')
    await flushPromises()

    expect(createManagedItemCategoryApi).toHaveBeenCalledTimes(1)
    expect(wrapper.find('[data-testid="category-form-drawer"]').exists()).toBe(false)

    resolveReload({
      categories: [
        {
          categoryId: 'category-root',
          categoryCode: 'ROOT',
          categoryName: 'Root Category',
          parentCategoryId: '',
          status: 'ACTIVE',
          hasChildren: true
        }
      ]
    })
    await flushPromises()
  })

  it('shows an empty state when no categories are available', async () => {
    listManagedItemCategoriesApi.mockResolvedValue({
      categories: []
    })

    const page = (await import('./item-category-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(wrapper.text()).toContain('暂无产品分类')
  })
})
