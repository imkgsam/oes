/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, onMounted, reactive, ref } from 'vue'

const archiveManagedOrgUnitApi = vi.fn()
const createManagedOrgUnitApi = vi.fn()
const getManagedOrgTreeApi = vi.fn()
const getManagedOrgUnitByIdApi = vi.fn()
const listManagedTenantsApi = vi.fn()
const updateManagedOrgUnitApi = vi.fn()
const setTreeExpand = vi.fn()

const authContextState: any = reactive({
  actionCodes: [
    'tenant_org.org_unit.list_tree',
    'tenant_org.org_unit.get_by_id'
  ],
  isPlatformScope: false,
  sessionContext: {
    tenant: {
      tenantId: 'tenant-1',
      name: 'Alpha Tenant'
    }
  },
  tenantName: 'Alpha Tenant'
})

function createStorageMock(): Storage {
  const store = new Map<string, string>()
  return {
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => [...store.keys()][index] ?? null,
    get length() {
      return store.size
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    setItem: (key: string, value: string) => {
      store.set(key, value)
    }
  }
}

vi.mock('#/api', () => ({
  archiveManagedOrgUnitApi,
  createManagedOrgUnitApi,
  getManagedOrgTreeApi,
  getManagedOrgUnitByIdApi,
  listManagedTenantsApi,
  updateManagedOrgUnitApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('#/adapter/vxe-table', () => ({
  useVbenVxeGrid: (config: any) => {
    const rows = ref<any[]>([])
    const expandedRowIds = ref<string[]>([])

    const query = async () => {
      const result = await config.gridOptions.proxyConfig.ajax.query()
      rows.value = Array.isArray(result) ? result : result.items ?? []
      return result
    }

    const applyTreeExpand = (targetRows: any[] | any, expanded: boolean) => {
      const items = Array.isArray(targetRows) ? targetRows : [targetRows]
      const ids = items.map((item) => item.id)
      expandedRowIds.value = expanded
        ? [...new Set([...expandedRowIds.value, ...ids])]
        : expandedRowIds.value.filter((id) => !ids.includes(id))
    }

    const grid = {
      getData: vi.fn(() => rows.value),
      setTreeExpand: vi.fn((targetRows: any[] | any, expanded: boolean) => {
        setTreeExpand(targetRows, expanded)
        applyTreeExpand(targetRows, expanded)
        return Promise.resolve()
      })
    }

    const Grid = defineComponent({
      name: 'MockOrgGrid',
      props: {
        tableTitle: {
          type: String,
          default: ''
        }
      },
      setup(props, { slots }) {
        onMounted(async () => {
          await query()
        })

        const renderableRows = () => {
          const transform = config.gridOptions?.treeConfig?.transform
          if (
            transform === false &&
            rows.value.length > 0 &&
            rows.value.every((row) => !Array.isArray(row.children))
          ) {
            return []
          }

          return rows.value
        }

        const renderRow = (row: any): any[] => {
          const operationOptions =
            config.gridOptions.columns.find((column: any) => column.field === 'operation').cellRender.options ?? []

          return [
            h('div', { class: 'mock-grid-row', 'data-depth': String(row.depth) }, [
              h(
                'button',
                {
                  'data-testid': `org-row-${row.id}`,
                  onClick: async () =>
                    await config.gridEvents?.cellClick?.({ column: { field: 'name' }, row })
                },
                row.name
              ),
              ...operationOptions.map((option: any) =>
                h(
                  'button',
                  {
                    'data-testid': `org-${option.code}-${row.id}`,
                    onClick: async () =>
                      await config.gridOptions.columns
                        .find((column: any) => column.field === 'operation')
                        .cellRender.attrs.onClick({ code: option.code, row })
                  },
                  option.text
                )
              )
            ]),
            ...(expandedRowIds.value.includes(row.id)
              ? (row.children ?? []).flatMap((child: any) => renderRow(child))
              : [])
          ]
        }

        return () =>
          h('div', { 'data-testid': 'mock-grid-root' }, [
            h('div', { 'data-testid': 'mock-grid-height' }, String(config.gridOptions.height ?? '')),
            h('div', props.tableTitle),
            h('div', { class: 'mock-grid-toolbar' }, slots['toolbar-tools']?.() ?? []),
            ...renderableRows().flatMap((row) => renderRow(row))
          ])
      }
    })

    return [Grid, { grid, query }]
  }
}))

describe('org management workspace', () => {
  beforeEach(() => {
    archiveManagedOrgUnitApi.mockReset()
    createManagedOrgUnitApi.mockReset()
    getManagedOrgTreeApi.mockReset()
    getManagedOrgUnitByIdApi.mockReset()
    listManagedTenantsApi.mockReset()
    updateManagedOrgUnitApi.mockReset()
    setTreeExpand.mockReset()

    authContextState.actionCodes = [
      'tenant_org.org_unit.list_tree',
      'tenant_org.org_unit.get_by_id'
    ]
    authContextState.isPlatformScope = false
    authContextState.sessionContext = {
      tenant: {
        tenantId: 'tenant-1',
        name: 'Alpha Tenant'
      }
    }
    authContextState.tenantName = 'Alpha Tenant'

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: createStorageMock()
    })
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      value: createStorageMock()
    })
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({
        addEventListener: vi.fn(),
        addListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches: false,
        media: '',
        onchange: null,
        removeListener: vi.fn(),
        removeEventListener: vi.fn()
      })
    })

    getManagedOrgTreeApi.mockResolvedValue({
      roots: [
        {
          children: [
            {
              children: [],
              orgUnit: {
                depth: 1,
                id: 'org-dept-1',
                name: '制造中心',
                parentOrgId: 'org-root-1',
                path: '/org-root-1/org-dept-1',
                sortOrder: 10,
                status: 'ACTIVE',
                tenantId: 'tenant-1',
                type: 'DEPARTMENT'
              }
            }
          ],
          orgUnit: {
            depth: 0,
            id: 'org-root-1',
            name: 'Alpha 集团',
            path: '/org-root-1',
            sortOrder: 0,
            status: 'ACTIVE',
            tenantId: 'tenant-1',
            type: 'ROOT'
          }
        }
      ],
      scope: 'TENANT'
    })

    getManagedOrgUnitByIdApi.mockResolvedValue({
      orgUnit: {
        depth: 1,
        id: 'org-dept-1',
        name: '制造中心',
        organizationPartyId: undefined,
        parentOrgId: 'org-root-1',
        path: '/org-root-1/org-dept-1',
        sortOrder: 10,
        status: 'ACTIVE',
        tenantId: 'tenant-1',
        type: 'DEPARTMENT'
      }
    })
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('expands root nodes by default so first-level child nodes are visible on entry', async () => {
    const view = await import('./org-management-workspace.vue')

    const wrapper = mount(view.default, {
      attachTo: document.body,
      props: {
        managementMode: 'TENANT'
      },
      global: {
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()

    expect(wrapper.get('[data-testid="org-tree-panel"]').text()).toContain('部门列表')
    expect(wrapper.get('[data-testid="org-tree-panel"]').text()).toContain('制造中心')
    expect(setTreeExpand).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 'org-root-1' })]),
      true
    )
    expect(setTreeExpand).not.toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 'org-dept-1' })]),
      true
    )
  })

  it('does not render the current-tenant header copy in tenant mode', async () => {
    const view = await import('./org-management-workspace.vue')

    const wrapper = mount(view.default, {
      attachTo: document.body,
      props: {
        managementMode: 'TENANT'
      },
      global: {
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()

    expect(wrapper.get('[data-testid="org-tree-panel"]').text()).not.toContain('当前租户')
    expect(wrapper.get('[data-testid="org-tree-panel"]').text()).not.toContain('Alpha Tenant')
  })

  it('opens the detail drawer only from an explicit view action instead of whole-row clicks', async () => {
    const view = await import('./org-management-workspace.vue')

    const wrapper = mount(view.default, {
      attachTo: document.body,
      props: {
        managementMode: 'TENANT'
      },
      global: {
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()

    await wrapper.get('[data-testid="org-row-org-dept-1"]').trigger('click')
    await flushPromises()

    expect(document.body.textContent ?? '').not.toContain('概览')

    await wrapper.get('[data-testid="org-view-org-dept-1"]').trigger('click')
    await flushPromises()

    const drawerText = document.body.textContent ?? ''
    expect(drawerText).toContain('概览')
    expect(drawerText).toContain('编辑信息')
    expect(drawerText).toContain('成员')
    expect(drawerText).toContain('技术信息')
    expect(drawerText).not.toContain('新建下级')
  })

  it('opens create actions inside a dedicated create drawer instead of the detail drawer', async () => {
    authContextState.actionCodes = [
      'tenant_org.org_unit.list_tree',
      'tenant_org.org_unit.get_by_id',
      'tenant_org.org_unit.create'
    ]

    const view = await import('./org-management-workspace.vue')

    const wrapper = mount(view.default, {
      attachTo: document.body,
      props: {
        managementMode: 'TENANT'
      },
      global: {
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()

    await wrapper.get('[data-testid="org-create-open"]').trigger('click')
    await flushPromises()

    expect(document.body.textContent ?? '').toContain('新建 OrgUnit')
    expect(document.body.textContent ?? '').not.toContain('概览')
    expect(document.body.querySelector('[data-testid="org-create-drawer"]')).not.toBeNull()
  })

  it('renders department detail as basic info plus read-only backend-gap summaries without fake leader or member data', async () => {
    const view = await import('./org-management-workspace.vue')

    const wrapper = mount(view.default, {
      attachTo: document.body,
      props: {
        managementMode: 'TENANT'
      },
      global: {
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()

    expect(wrapper.get('[data-testid="org-tree-panel"]').text()).toContain('部门列表')
    expect(wrapper.get('[data-testid="org-tree-panel"]').text()).toContain('新增下级')
    expect(wrapper.get('[data-testid="org-tree-panel"]').text()).toContain('编辑')
    expect(Number(wrapper.get('[data-testid="mock-grid-height"]').text())).toBeGreaterThanOrEqual(560)

    await wrapper.get('[data-testid="org-view-org-dept-1"]').trigger('click')
    await flushPromises()

    const drawerText = document.body.textContent ?? ''
    expect(drawerText).toContain('概览')
    expect(drawerText).toContain('编辑信息')
    expect(drawerText).toContain('成员')
    expect(drawerText).toContain('技术信息')
    expect(drawerText).toContain('Backend gap')
    expect(drawerText).toContain('当前读模型尚未提供组织负责人名字')
  })

  it('reloads the org tree after permission context arrives late from the page shell refresh', async () => {
    authContextState.actionCodes = []

    const view = await import('./org-management-workspace.vue')

    const wrapper = mount(view.default, {
      attachTo: document.body,
      props: {
        managementMode: 'TENANT'
      },
      global: {
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()

    expect(wrapper.get('[data-testid="org-tree-panel"]').text()).toContain('部门列表')
    expect(wrapper.get('[data-testid="org-tree-panel"]').text()).not.toContain('制造中心')
    expect(Number(wrapper.get('[data-testid="mock-grid-height"]').text())).toBeGreaterThanOrEqual(560)

    authContextState.actionCodes = ['tenant_org.org_unit.list_tree']
    await flushPromises()

    expect(wrapper.get('[data-testid="org-tree-panel"]').text()).toContain('制造中心')
  })
})
