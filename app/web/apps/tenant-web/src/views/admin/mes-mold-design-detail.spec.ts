/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getMoldDesignApi = vi.fn()
const listProductionMoldsByDesignApi = vi.fn()
const useRoute = vi.fn()
const push = vi.fn()

const authContextState: any = {
  actionCodes: [
    'mes.mold_design.read',
    'mes.production_mold.read'
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
  getMoldDesignApi,
  listProductionMoldsByDesignApi
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
  const actual = await import('./__tests__/ant-design-vue-mock')

  /** Statistic renders Ant metric content without depending on layout APIs. */
  const Statistic = defineComponent({
    name: 'Statistic',
    props: {
      title: String,
      value: [Number, String]
    },
    setup(props, { attrs, slots }) {
      return () =>
        h('div', { ...attrs, class: ['ant-statistic', attrs.class].filter(Boolean) }, [
          h('div', { class: 'ant-statistic-title' }, slots.title?.() ?? props.title),
          h('div', { class: 'ant-statistic-content' }, slots.default?.() ?? props.value)
        ])
    }
  })

  /** List renders each data item through Ant Design Vue's default slot contract. */
  const List = defineComponent({
    name: 'List',
    props: {
      dataSource: {
        default: () => [],
        type: Array
      }
    },
    setup(props, { attrs, slots }) {
      return () =>
        h('div', { ...attrs, class: ['ant-list', attrs.class].filter(Boolean) },
          props.dataSource.length
            ? props.dataSource.map((item: any, index) => slots.renderItem?.({ item, index }))
            : slots.default?.()
        )
    }
  })

  /** ListItem renders one Ant Design Vue list row for option/output assertions. */
  const ListItem = defineComponent({
    name: 'ListItem',
    setup(_props, { attrs, slots }) {
      return () => h('div', { ...attrs, class: ['ant-list-item', attrs.class].filter(Boolean) }, slots.default?.())
    }
  })

  /** Spin preserves the loading wrapper marker while always rendering child content in unit tests. */
  const Spin = defineComponent({
    name: 'Spin',
    props: {
      spinning: Boolean
    },
    setup(props, { attrs, slots }) {
      return () =>
        h(
          'div',
          {
            ...attrs,
            class: ['ant-spin-nested-loading', attrs.class].filter(Boolean),
            'data-spinning': props.spinning ? 'true' : 'false'
          },
          slots.default?.()
        )
    }
  })

  return {
    ...actual,
    List,
    ListItem,
    Spin,
    Statistic
  }
})

// Verifies the mold design detail page closes the design, output-option, and production-mold read loop.
describe('MES mold design detail page', () => {
  beforeEach(() => {
    getMoldDesignApi.mockReset()
    listProductionMoldsByDesignApi.mockReset()
    push.mockReset()
    useRoute.mockReturnValue({
      params: {
        moldDesignId: 'design-1'
      }
    })

    getMoldDesignApi.mockResolvedValue({
      createdAt: '2026-05-01T08:30:00.000Z',
      defaultLifeLimit: '1200',
      defaultLifeUnit: 'USE',
      designCode: 'MD-LT-HP-01',
      functionRole: 'PRODUCTION',
      itemRef: {
        itemCodeSnapshot: 'WC-ONE-300',
        itemId: 'item-1',
        itemNameSnapshot: '连体马桶 300/400 坑距'
      },
      materialType: 'RESIN',
      moldDesignId: 'design-1',
      name: '连体马桶高压模具方案',
      outputs: [
        {
          componentRole: '主体',
          isPrimaryOutput: true,
          productionSpecRef: {
            displayNameSnapshot: '连体马桶 300 坑距注浆规格',
            productionSpecId: 'spec-300',
            specCodeSnapshot: 'MS-LT-300'
          },
          moldDesignOutputId: 'output-body',
          options: [
            {
              isDefault: true,
              label: '300 坑距',
              productionSpecRef: {
                displayNameSnapshot: '连体马桶 300 坑距注浆规格',
                productionSpecId: 'spec-300',
                specCodeSnapshot: 'MS-LT-300'
              },
              moldDesignOutputId: 'output-body',
              moldDesignOutputOptionId: 'option-300',
              optionCode: 'PIT-300',
              quantityPerUse: '1'
            }
          ],
          outputCode: 'BODY',
          outputKind: 'PRODUCT',
          quantityPerUse: '1',
          sequenceNo: 1
        }
      ],
      productionMethodTags: ['HIGH_PRESSURE'],
      revisionCode: 'R1',
      status: 'ACTIVE'
    })
    listProductionMoldsByDesignApi.mockResolvedValue({
      productionMolds: [
        {
          createdAt: '2026-05-02T09:00:00.000Z',
          currentInstallationSummary: {
            installedAt: '2026-05-03T09:00:00.000Z',
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
          productionMoldId: 'mold-1'
        }
      ],
      moldDesignSummary: {
        designCode: 'MD-LT-HP-01',
        moldDesignId: 'design-1',
        name: '连体马桶高压模具方案',
        revisionCode: 'R1'
      },
      page: 1,
      pageSize: 50,
      total: 1
    })
  })

  it('loads design basics, output options, metrics, and current production molds', async () => {
    const page = (await import('./mes-mold-design-detail.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(getMoldDesignApi).toHaveBeenCalledWith('tenant-1', 'design-1')
    expect(listProductionMoldsByDesignApi).toHaveBeenCalledWith('tenant-1', 'design-1', {
      page: 1,
      pageSize: 50
    })
    expect(wrapper.text()).toContain('模具方案详情')
    expect(wrapper.text()).toContain('MD-LT-HP-01')
    expect(wrapper.text()).toContain('连体马桶 300/400 坑距')
    expect(wrapper.text()).toContain('高压机')
    expect(wrapper.text()).toContain('未记录')
    expect(wrapper.text()).toContain('1200 USE')
    expect(wrapper.text()).not.toContain('产品合格率')
    expect(wrapper.text()).toContain('BODY')
    expect(wrapper.text()).toContain('MS-LT-300')
    expect(wrapper.text()).toContain('PIT-300')
    expect(wrapper.text()).toContain('300 坑距')
    expect(wrapper.text()).toContain('PM-LT-001')
    expect(wrapper.text()).toContain('连体马桶上线一线')
    expect(wrapper.text()).toContain('340/1200 USE')
    expect(wrapper.findAll('.ant-statistic')).toHaveLength(3)
    expect(wrapper.find('.ant-descriptions').exists()).toBe(true)
    expect(wrapper.find('.ant-list').exists()).toBe(true)
    expect(wrapper.find('.ant-table').exists()).toBe(true)
  })

  it('returns to the mold-management entry route from the detail header', async () => {
    const page = (await import('./mes-mold-design-detail.vue')).default
    const wrapper = mount(page)

    await flushPromises()
    await wrapper.get('[data-testid="mes-mold-design-detail-back"]').trigger('click')

    expect(push).toHaveBeenCalledWith({
      name: 'TenantMesMoldManagement'
    })
  })

  it('opens the hidden production mold management page scoped to the current MoldDesign', async () => {
    const page = (await import('./mes-mold-design-detail.vue')).default
    const wrapper = mount(page)

    await flushPromises()
    await wrapper.get('[data-testid="mes-mold-design-production-molds"]').trigger('click')

    expect(push).toHaveBeenCalledWith({
      name: 'TenantMesProductionMoldManagement',
      query: {
        moldDesignId: 'design-1'
      }
    })
  })
})
