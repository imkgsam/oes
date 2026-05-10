/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getProductionMoldApi = vi.fn()
const listMoldDesignsApi = vi.fn()
const listProductionMoldsApi = vi.fn()
const registerProductionMoldApi = vi.fn()
const useRoute = vi.fn()
const push = vi.fn()

const authContextState: any = {
  actionCodes: [
    'mes.mold_design.read',
    'mes.production_mold.read',
    'mes.production_mold.manage'
  ],
  sessionContext: {
    tenant: {
      name: 'Alpha Tenant',
      tenantId: 'tenant-1'
    }
  },
  tenantName: 'Alpha Tenant',
  visibleEntries: ['mes.mold-management']
}

vi.mock('#/api', () => ({
  getProductionMoldApi,
  listMoldDesignsApi,
  listProductionMoldsApi,
  registerProductionMoldApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('vue-router', () => ({
  useRoute: () => useRoute(),
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

vi.mock('ant-design-vue', async () => {
  const { defineComponent, h } = await import('vue')
  const antdMock = await import('./__tests__/ant-design-vue-mock')

  return {
    ...antdMock,
    Spin: defineComponent({
      name: 'Spin',
      props: {
        spinning: Boolean
      },
      setup(_props, { attrs, slots }) {
        return () => h('div', { ...attrs, class: 'ant-spin-nested-loading' }, slots.default?.())
      }
    }),
    Statistic: defineComponent({
      name: 'Statistic',
      props: {
        title: String,
        value: [Number, String]
      },
      setup(props, { attrs }) {
        return () =>
          h('div', { ...attrs, class: 'ant-statistic' }, [
            h('div', { class: 'ant-statistic-title' }, props.title),
            h('div', { class: 'ant-statistic-content' }, `${props.value ?? ''}`)
          ])
      }
    })
  }
})

const moldDesign = {
  defaultLifeLimit: '1200',
  defaultLifeUnit: 'USE',
  designCode: 'MD-LT-HP-01',
  moldDesignId: 'design-1',
  name: '连体马桶高压模具方案',
  revisionCode: 'R1'
}

const productionMold = {
  createdAt: '2026-05-02T09:00:00.000Z',
  currentInstallationSummary: {
    toolingInstallationId: 'install-1',
    moldDetail: {
      moldPosition: 'A01'
    },
    workCenterRef: {
      displayNameSnapshot: '连体马桶上线一线',
      workCenterCodeSnapshot: 'LINE-LT-01',
      workCenterId: 'wc-1'
    }
  },
  currentStatus: 'INSTALLED',
  lifeCounterSummary: {
    lifeUnit: 'USE',
    limitValue: '1200',
    remainingValue: '860',
    usedValue: '340'
  },
  moldDesignSummary: {
    designCode: 'MD-LT-HP-01',
    moldDesignId: 'design-1',
    name: '连体马桶高压模具方案'
  },
  moldCode: 'PM-LT-001',
  productionMoldId: 'mold-1',
  supplierRef: {
    supplierCodeSnapshot: 'SUP-01',
    supplierDisplayNameSnapshot: '精工模具厂',
    supplierId: 'supplier-1'
  }
}

// Verifies the hidden production-mold management page closes list, filter, read-only detail, and creation flows.
describe('MES production mold management page', () => {
  beforeEach(() => {
    getProductionMoldApi.mockReset()
    listMoldDesignsApi.mockReset()
    listProductionMoldsApi.mockReset()
    registerProductionMoldApi.mockReset()
    push.mockReset()
    useRoute.mockReturnValue({
      query: {
        moldDesignId: 'design-1'
      }
    })

    listMoldDesignsApi.mockResolvedValue({
      moldDesigns: [moldDesign],
      page: 1,
      pageSize: 100,
      total: 1
    })
    listProductionMoldsApi.mockResolvedValue({
      productionMolds: [productionMold],
      page: 1,
      pageSize: 100,
      total: 1
    })
    getProductionMoldApi.mockResolvedValue(productionMold)
    registerProductionMoldApi.mockResolvedValue({
      ...productionMold,
      moldCode: 'PM-LT-009',
      productionMoldId: 'mold-new'
    })
  })

  it('loads mold designs and production molds with the incoming moldDesignId filter', async () => {
    const page = (await import('./mes-production-mold-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(listMoldDesignsApi).toHaveBeenCalledWith('tenant-1', {
      page: 1,
      pageSize: 100,
      status: 'ACTIVE'
    })
    expect(listProductionMoldsApi).toHaveBeenCalledWith('tenant-1', {
      moldDesignId: 'design-1',
      page: 1,
      pageSize: 100
    })
    expect(wrapper.text()).toContain('生产模具管理')
    expect(wrapper.text()).toContain('PM-LT-001')
    expect(wrapper.text()).toContain('MD-LT-HP-01')
    expect(wrapper.text()).toContain('INSTALLED')
    expect(wrapper.text()).toContain('连体马桶上线一线')
    expect(wrapper.text()).toContain('340/1200 USE')
    expect(wrapper.find('.ant-table').exists()).toBe(true)
    expect(wrapper.findAll('.ant-statistic')).toHaveLength(4)

    await wrapper.get('[data-testid="mes-production-mold-search"]').setValue('不存在')

    expect(wrapper.text()).toContain('没有匹配的生产模具')
  })

  it('reloads the list when status and moldDesign filters are submitted', async () => {
    const page = (await import('./mes-production-mold-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()
    await wrapper.get('[data-testid="mes-production-mold-status"]').setValue('INSTALLED')
    await wrapper.get('[data-testid="mes-production-mold-design"]').setValue('design-1')
    await wrapper.get('[data-testid="mes-production-mold-apply-filters"]').trigger('click')

    expect(listProductionMoldsApi).toHaveBeenLastCalledWith('tenant-1', {
      moldDesignId: 'design-1',
      page: 1,
      pageSize: 100,
      status: 'INSTALLED'
    })
  })

  it('opens a read-only detail drawer for one production mold', async () => {
    const page = (await import('./mes-production-mold-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()
    await wrapper.get('[data-testid="mes-production-mold-view-mold-1"]').trigger('click')
    await flushPromises()

    expect(getProductionMoldApi).toHaveBeenCalledWith('tenant-1', 'mold-1')
    expect(wrapper.find('.ant-drawer').exists()).toBe(true)
    expect(wrapper.find('.ant-descriptions').exists()).toBe(true)
    expect(wrapper.text()).toContain('生产模具基础信息')
    expect(wrapper.text()).toContain('PM-LT-001')
    expect(wrapper.text()).toContain('精工模具厂')
  })

  it('opens the create drawer, submits a real registration payload, and refreshes the list', async () => {
    const page = (await import('./mes-production-mold-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()
    await wrapper.get('[data-testid="mes-open-create-production-mold"]').trigger('click')
    expect(wrapper.find('.ant-drawer').exists()).toBe(true)
    expect(wrapper.find('.ant-form').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('供应商来源')
    expect(wrapper.find('[data-testid="mes-production-mold-supplier-code"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="mes-production-mold-supplier-name"]').exists()).toBe(false)
    await wrapper.get('[data-testid="mes-production-mold-code"]').setValue('PM-LT-009')
    await wrapper.get('[data-testid="mes-submit-create-production-mold"]').trigger('click')
    await flushPromises()

    expect(registerProductionMoldApi).toHaveBeenCalledWith('tenant-1', {
      moldDesignId: 'design-1',
      moldCode: 'PM-LT-009',
      reason: 'web create production mold'
    })
    const registerPayload = registerProductionMoldApi.mock.calls[0]?.[1]
    expect(registerPayload).toBeDefined()
    expect(registerPayload).not.toHaveProperty('supplierRef')
    expect(listProductionMoldsApi).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).not.toContain('提交生产模具')
    expect(wrapper.text()).toContain('生产模具已创建')
  })
})
