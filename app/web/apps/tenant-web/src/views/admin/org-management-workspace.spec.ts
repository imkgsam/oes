/* @vitest-environment happy-dom */

import { config, flushPromises, mount } from '@vue/test-utils'
import { Select, Table, TreeSelect } from 'ant-design-vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, onMounted, reactive, ref } from 'vue'

const archiveManagedOrgUnitApi = vi.fn()
const createManagedOrgUnitApi = vi.fn()
const getManagedOrgTreeApi = vi.fn()
const getManagedOrgUnitByIdApi = vi.fn()
const listManagedTenantsApi = vi.fn()
const moveManagedOrgUnitApi = vi.fn()
const updateManagedOrgUnitApi = vi.fn()
const setTreeExpand = vi.fn()
const push = vi.fn()
const mountedWrappers: any[] = []

config.global.directives = {
  ...config.global.directives,
  access: {},
  loading: {}
}

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

/** mountOrgWorkspace tracks Vue wrappers so each test fully unmounts async effects and teleports. */
function mountOrgWorkspace(component: any, options: Parameters<typeof mount>[1]) {
  const wrapper = mount(component, options)
  mountedWrappers.push(wrapper)
  return wrapper
}

/** openOrgRowActions opens the Ant Design row action menu that owns the per-row operation test ids. */
async function openOrgRowActions(wrapper: any, orgUnitId: string) {
  const row = wrapper.get(`[data-testid="org-row-${orgUnitId}"]`).element.closest('tr')
  const actionButton = row?.querySelector('button[aria-label="组织操作"]') as HTMLButtonElement | null

  expect(actionButton).not.toBeNull()
  actionButton?.click()
  await flushPromises()
}

/** clickOrgRowAction triggers one visible organization row action from the dropdown menu. */
async function clickOrgRowAction(
  wrapper: any,
  orgUnitId: string,
  action: 'append' | 'edit' | 'view'
) {
  let menuItem = document.body.querySelector(
    `[data-testid="org-${action}-${orgUnitId}"]`
  ) as HTMLElement | null

  if (!menuItem) {
    await openOrgRowActions(wrapper, orgUnitId)
    menuItem = document.body.querySelector(
      `[data-testid="org-${action}-${orgUnitId}"]`
    ) as HTMLElement | null
  }

  expect(menuItem).not.toBeNull()
  for (const eventName of ['pointerdown', 'mousedown', 'mouseup', 'click']) {
    menuItem?.dispatchEvent(new MouseEvent(eventName, { bubbles: true, cancelable: true }))
  }
  await flushPromises()
  await flushPromises()
}

/** getCreateTypeSelection reads the visible child org type selected in the create drawer. */
function getCreateTypeSelection() {
  return (
    document.body
      .querySelector('[data-testid="org-create-form-type"] .ant-select-selection-item')
      ?.textContent?.trim() ?? ''
  )
}

vi.mock('#/api', () => ({
  archiveManagedOrgUnitApi,
  createManagedOrgUnitApi,
  getManagedOrgTreeApi,
  getManagedOrgUnitByIdApi,
  listManagedTenantsApi,
  moveManagedOrgUnitApi,
  updateManagedOrgUnitApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push
  })
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

          const visibleOperationOptions = operationOptions.filter((option: any) => {
            const show = typeof option.show === 'function' ? option.show(row) : option.show
            return show !== false
          })

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
              ...visibleOperationOptions.map((option: any) =>
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
            h(
              'div',
              { class: 'mock-grid-columns' },
              config.gridOptions.columns.map((column: any) => h('span', column.title ?? column.field))
            ),
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
    moveManagedOrgUnitApi.mockReset()
    updateManagedOrgUnitApi.mockReset()
    setTreeExpand.mockReset()
    push.mockReset()

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
        organizationTenantPartyId: undefined,
        parentOrgId: 'org-root-1',
        path: '/org-root-1/org-dept-1',
        sortOrder: 10,
        status: 'ACTIVE',
        tenantId: 'tenant-1',
        type: 'DEPARTMENT'
      }
    })
    moveManagedOrgUnitApi.mockResolvedValue({
      orgUnit: {
        depth: 2,
        id: 'org-dept-1',
        name: '制造中心',
        organizationTenantPartyId: undefined,
        parentOrgId: 'org-support-1',
        path: '/org-root-1/org-support-1/org-dept-1',
        sortOrder: 10,
        status: 'ACTIVE',
        tenantId: 'tenant-1',
        type: 'DEPARTMENT'
      }
    })
  })

  afterEach(() => {
    for (const wrapper of mountedWrappers.splice(0)) {
      wrapper.unmount()
    }
    document.body.innerHTML = ''
  })

  it('renders the organization tree with an Ant Design native expandable table', async () => {
    const view = await import('./org-management-workspace.vue')

    const wrapper = mountOrgWorkspace(view.default, {
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

    expect(wrapper.get('[data-testid="org-tree-panel"]').text()).toContain('组织列表')
    expect(wrapper.get('[data-testid="org-tree-panel"]').text()).toContain('制造中心')
    expect(wrapper.get('[data-testid="org-tree-panel"]').text()).not.toContain('/org-root-1')
    expect(wrapper.find('[data-testid="org-ant-tree-table"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="mock-grid-root"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="org-tree-panel"]').text()).not.toContain('OrganizationTenantParty')
    expect(wrapper.get('[data-testid="org-tree-panel"]').text()).not.toContain('未关联')

    const table = wrapper.findComponent(Table)
    const operationColumn = (table.props('columns') as any[]).find((column) => column.key === 'operation')
    expect(operationColumn).toEqual(expect.objectContaining({ align: 'center' }))
    const tableRows = table.props('dataSource') as any[]
    expect(tableRows[0].children[0].id).toBe('org-dept-1')
    expect(tableRows[0].children[0]).not.toHaveProperty('children')
  })

  it('defaults every nested org node to expanded for tenant and system org entries', async () => {
    const nestedOrgTree = {
      roots: [
        {
          children: [
            {
              children: [
                {
                  children: [],
                  orgUnit: {
                    depth: 2,
                    id: 'org-team-1',
                    name: '夜班小组',
                    parentOrgId: 'org-dept-1',
                    path: '/org-root-1/org-dept-1/org-team-1',
                    sortOrder: 20,
                    status: 'ACTIVE',
                    tenantId: 'tenant-1',
                    type: 'TEAM'
                  }
                }
              ],
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
    }
    getManagedOrgTreeApi.mockResolvedValue(nestedOrgTree)
    listManagedTenantsApi.mockResolvedValue({
      items: [{ id: 'tenant-1', name: 'Alpha Tenant' }]
    })
    const view = await import('./org-management-workspace.vue')

    const tenantWrapper = mountOrgWorkspace(view.default, {
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

    expect(tenantWrapper.findComponent(Table).props('expandedRowKeys')).toEqual([
      'org-root-1',
      'org-dept-1'
    ])

    tenantWrapper.unmount()
    authContextState.isPlatformScope = true

    const systemWrapper = mountOrgWorkspace(view.default, {
      attachTo: document.body,
      props: {
        managementMode: 'SYSTEM'
      },
      global: {
        directives: {
          loading: {}
        }
      }
    })
    await flushPromises()

    expect(systemWrapper.findComponent(Table).props('expandedRowKeys')).toEqual([
      'org-root-1',
      'org-dept-1'
    ])
  })

  it('does not render the current-tenant header copy in tenant mode', async () => {
    const view = await import('./org-management-workspace.vue')

    const wrapper = mountOrgWorkspace(view.default, {
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

  it('routes tenant org view actions to the independent department detail page', async () => {
    const view = await import('./org-management-workspace.vue')

    const wrapper = mountOrgWorkspace(view.default, {
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

    expect(push).not.toHaveBeenCalled()

    await clickOrgRowAction(wrapper, 'org-dept-1', 'view')

    expect(push).toHaveBeenCalledWith({
      name: 'TenantOrgUnitDetail',
      params: {
        orgUnitId: 'org-dept-1'
      }
    })
    expect(getManagedOrgUnitByIdApi).not.toHaveBeenCalled()
  })

  it('does not expose edit actions for the root org node', async () => {
    authContextState.actionCodes = [
      'tenant_org.org_unit.list_tree',
      'tenant_org.org_unit.get_by_id',
      'tenant_org.org_unit.update'
    ]
    getManagedOrgUnitByIdApi.mockResolvedValueOnce({
      orgUnit: {
        depth: 0,
        id: 'org-root-1',
        name: 'Alpha 集团',
        parentOrgId: undefined,
        path: '/org-root-1',
        sortOrder: 0,
        status: 'ACTIVE',
        tenantId: 'tenant-1',
        type: 'ROOT'
      }
    })

    const view = await import('./org-management-workspace.vue')

    const wrapper = mountOrgWorkspace(view.default, {
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

    await openOrgRowActions(wrapper, 'org-root-1')
    expect(document.body.querySelector('[data-testid="org-edit-org-root-1"]')).toBeNull()

    await clickOrgRowAction(wrapper, 'org-root-1', 'view')

    expect(push).toHaveBeenCalledWith({
      name: 'TenantOrgUnitDetail',
      params: {
        orgUnitId: 'org-root-1'
      }
    })
  })

  it('opens non-root edits in a dedicated edit drawer while keeping the detail drawer read-only', async () => {
    authContextState.actionCodes = [
      'tenant_org.org_unit.list_tree',
      'tenant_org.org_unit.get_by_id',
      'tenant_org.org_unit.update'
    ]

    const view = await import('./org-management-workspace.vue')

    const wrapper = mountOrgWorkspace(view.default, {
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

    expect(document.body.querySelector('[data-testid="org-edit-drawer"]')).toBeNull()
    expect(document.body.textContent ?? '').not.toContain('编辑信息')

    await clickOrgRowAction(wrapper, 'org-dept-1', 'edit')

    const editDrawer = document.body.querySelector('[data-testid="org-edit-drawer"]')
    expect(editDrawer).not.toBeNull()
    expect(editDrawer?.textContent ?? '').toContain('编辑组织节点')
    expect(editDrawer?.textContent ?? '').toContain('排序')
  })

  it('edits an org unit through a dedicated drawer with the same parent selector pattern as creation', async () => {
    authContextState.actionCodes = [
      'tenant_org.org_unit.list_tree',
      'tenant_org.org_unit.get_by_id',
      'tenant_org.org_unit.update'
    ]
    getManagedOrgTreeApi.mockResolvedValue({
      roots: [
        {
          children: [
            {
              children: [
                {
                  children: [],
                  orgUnit: {
                    depth: 2,
                    id: 'org-team-1',
                    name: '夜班小组',
                    parentOrgId: 'org-dept-1',
                    path: '/org-root-1/org-dept-1/org-team-1',
                    sortOrder: 20,
                    status: 'ACTIVE',
                    tenantId: 'tenant-1',
                    type: 'TEAM'
                  }
                }
              ],
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
            },
            {
              children: [],
              orgUnit: {
                depth: 1,
                id: 'org-support-1',
                name: '运营支持',
                parentOrgId: 'org-root-1',
                path: '/org-root-1/org-support-1',
                sortOrder: 30,
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
    updateManagedOrgUnitApi.mockResolvedValue({
      orgUnit: {
        depth: 1,
        id: 'org-dept-1',
        name: '制造中心',
        organizationTenantPartyId: undefined,
        parentOrgId: 'org-root-1',
        path: '/org-root-1/org-dept-1',
        sortOrder: 10,
        status: 'ACTIVE',
        tenantId: 'tenant-1',
        type: 'DEPARTMENT'
      }
    })

    const view = await import('./org-management-workspace.vue')

    const wrapper = mountOrgWorkspace(view.default, {
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
    await clickOrgRowAction(wrapper, 'org-dept-1', 'edit')

    const editDrawer = document.body.querySelector('[data-testid="org-edit-drawer"]')
    expect(editDrawer).not.toBeNull()
    expect(editDrawer?.querySelector('[data-testid="org-edit-parent-tree"]')).not.toBeNull()
    expect(editDrawer?.textContent ?? '').toContain('挂载父节点')

    const saveButton = document.body.querySelector('[data-testid="org-edit-save"]') as HTMLButtonElement
    saveButton.click()
    await flushPromises()

    expect(updateManagedOrgUnitApi).toHaveBeenCalledWith('tenant-1', 'org-dept-1', {
      name: '制造中心',
      sortOrder: 10,
      type: 'DEPARTMENT'
    })
    expect(moveManagedOrgUnitApi).not.toHaveBeenCalled()
  })

  it('keeps ordinary creation on row append actions instead of a duplicate toolbar create button', async () => {
    authContextState.actionCodes = [
      'tenant_org.org_unit.list_tree',
      'tenant_org.org_unit.get_by_id',
      'tenant_org.org_unit.create'
    ]

    const view = await import('./org-management-workspace.vue')

    const wrapper = mountOrgWorkspace(view.default, {
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

    expect(wrapper.find('[data-testid="org-create-open"]').exists()).toBe(false)

    await clickOrgRowAction(wrapper, 'org-root-1', 'append')

    expect(document.body.textContent ?? '').toContain('新建 OrgUnit')
    expect(document.body.textContent ?? '').not.toContain('概览')
    expect(document.body.querySelector('[data-testid="org-create-drawer"]')).not.toBeNull()
  })

  it('opens ordinary org creation from the table dropdown with a single tree parent selector', async () => {
    authContextState.actionCodes = [
      'tenant_org.org_unit.list_tree',
      'tenant_org.org_unit.get_by_id',
      'tenant_org.org_unit.create'
    ]

    const view = await import('./org-management-workspace.vue')

    const wrapper = mountOrgWorkspace(view.default, {
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

    expect(wrapper.get('[data-testid="org-create-dropdown"]').text().replace(/\s/g, '')).toContain('新建')

    await wrapper.get('[data-testid="org-create-dropdown"]').trigger('click')
    await flushPromises()

    const branchItem = document.body.querySelector('[data-testid="org-create-branch-disabled"]')
    expect(branchItem?.getAttribute('aria-disabled')).toBe('true')

    ;(document.body.querySelector('[data-testid="org-create-ordinary"]') as HTMLElement).click()
    await flushPromises()

    const createDrawer = document.body.querySelector('[data-testid="org-create-drawer"]')
    expect(createDrawer).not.toBeNull()

    const parentTree = wrapper.findComponent(TreeSelect)
    expect(parentTree.exists()).toBe(true)
    expect(parentTree.props('treeCheckable')).toBeFalsy()
    expect(parentTree.props('multiple')).toBeFalsy()
    expect(parentTree.props('treeData')).toEqual([
      {
        children: [
          {
            children: [],
            key: 'org-dept-1',
            title: '制造中心',
            value: 'org-dept-1'
          }
        ],
        key: 'org-root-1',
        title: 'Alpha 集团',
        value: 'org-root-1'
      }
    ])

    parentTree.vm.$emit('update:value', 'org-dept-1')
    parentTree.vm.$emit('change', 'org-dept-1')
    await flushPromises()

    const typeSelect = wrapper.findComponent(Select)
    expect(typeSelect.props('options')).toEqual([
      { label: '部门', value: 'DEPARTMENT' },
      { label: '小组', value: 'TEAM' }
    ])
  })

  it('limits ordinary child creation to the approved org hierarchy rules', async () => {
    authContextState.actionCodes = [
      'tenant_org.org_unit.list_tree',
      'tenant_org.org_unit.get_by_id',
      'tenant_org.org_unit.create'
    ]
    getManagedOrgTreeApi.mockResolvedValue({
      roots: [
        {
          children: [
            {
              children: [],
              orgUnit: {
                depth: 1,
                id: 'org-branch-1',
                name: '华东分支',
                parentOrgId: 'org-root-1',
                path: '/org-root-1/org-branch-1',
                sortOrder: 5,
                status: 'ACTIVE',
                tenantId: 'tenant-1',
                type: 'BRANCH'
              }
            },
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
            },
            {
              children: [],
              orgUnit: {
                depth: 1,
                id: 'org-team-1',
                name: '夜班小组',
                parentOrgId: 'org-root-1',
                path: '/org-root-1/org-team-1',
                sortOrder: 15,
                status: 'ACTIVE',
                tenantId: 'tenant-1',
                type: 'TEAM'
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

    const view = await import('./org-management-workspace.vue')

    const wrapper = mountOrgWorkspace(view.default, {
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

    await openOrgRowActions(wrapper, 'org-root-1')
    expect(document.body.querySelector('[data-testid="org-append-org-root-1"]')).not.toBeNull()

    await clickOrgRowAction(wrapper, 'org-root-1', 'append')
    expect(document.body.querySelector('[data-testid="org-create-drawer"]')).not.toBeNull()
    expect(getCreateTypeSelection()).toBe('部门')

    ;(document.body.querySelector('[data-testid="org-create-cancel"]') as HTMLButtonElement).click()
    await flushPromises()

    await clickOrgRowAction(wrapper, 'org-branch-1', 'append')
    expect(getCreateTypeSelection()).toBe('部门')
    expect(document.body.textContent ?? '').not.toContain('OTHER')
    expect(document.body.textContent ?? '').not.toContain('ROOT')
    expect(document.body.textContent ?? '').not.toContain('BRANCH')

    ;(document.body.querySelector('[data-testid="org-create-cancel"]') as HTMLButtonElement).click()
    await flushPromises()
    await clickOrgRowAction(wrapper, 'org-dept-1', 'append')
    expect(getCreateTypeSelection()).toBe('部门')

    ;(document.body.querySelector('[data-testid="org-create-cancel"]') as HTMLButtonElement).click()
    await flushPromises()
    await clickOrgRowAction(wrapper, 'org-team-1', 'append')
    expect(getCreateTypeSelection()).toBe('小组')
  })

  it('keeps department list focused and sends read-only details to the dedicated route', async () => {
    const view = await import('./org-management-workspace.vue')

    const wrapper = mountOrgWorkspace(view.default, {
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

    expect(wrapper.get('[data-testid="org-tree-panel"]').text()).toContain('组织列表')
    expect(wrapper.find('[data-testid="org-ant-tree-table"]').exists()).toBe(true)

    await clickOrgRowAction(wrapper, 'org-dept-1', 'view')

    const pageText = document.body.textContent ?? ''
    expect(pageText).not.toContain('OrganizationTenantParty')
    expect(pageText).not.toContain('未关联')
    expect(pageText).not.toContain('Backend gap')
    expect(push).toHaveBeenCalledWith({
      name: 'TenantOrgUnitDetail',
      params: {
        orgUnitId: 'org-dept-1'
      }
    })
  })

  it('reloads the org tree after permission context arrives late from the page shell refresh', async () => {
    authContextState.actionCodes = []

    const view = await import('./org-management-workspace.vue')

    const wrapper = mountOrgWorkspace(view.default, {
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

    expect(wrapper.get('[data-testid="org-tree-panel"]').text()).toContain('组织列表')
    expect(wrapper.get('[data-testid="org-tree-panel"]').text()).not.toContain('制造中心')
    expect(wrapper.find('[data-testid="org-ant-tree-table"]').exists()).toBe(true)

    authContextState.actionCodes = ['tenant_org.org_unit.list_tree']
    await flushPromises()

    expect(wrapper.get('[data-testid="org-tree-panel"]').text()).toContain('制造中心')
  }, 15_000)
})
