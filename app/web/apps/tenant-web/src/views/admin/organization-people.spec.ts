/* @vitest-environment happy-dom */

import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getSessionAccessSummaryApi = vi.fn()
const getSessionContextApi = vi.fn()
const replace = vi.fn()
const authContextState: any = {
  sessionContext: {
    tenant: {
      tenantId: 'tenant-1',
      name: 'Alpha Tenant'
    }
  },
  tenantName: 'Alpha Tenant'
}
const routeState: any = {
  name: 'TenantOrganizationPeople',
  path: '/settings/organization-people',
  query: {
    employeeId: 'employee-1',
    orgUnitId: 'org-1',
    pageKey: 'tenant-settings.organization-people',
    tab: 'members'
  }
}

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
  useRouter: () => ({
    replace
  })
}))

vi.mock('@vben/stores', () => ({
  useAccessStore: () => ({
    setAccessCodes: vi.fn()
  })
}))

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    props: ['autoContentHeight'],
    template: '<div data-testid="page-shell" :data-auto-content-height="String(autoContentHeight)"><slot /></div>'
  }
}))

vi.mock('#/api', () => ({
  getSessionAccessSummaryApi,
  getSessionContextApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('./employee-management-workspace.vue', () => ({
  default: {
    name: 'EmployeeManagementWorkspace',
    props: ['selectedEmployeeId'],
    emits: ['update:selectedEmployeeId'],
    template:
      '<div data-testid="members-workspace">Members Workspace {{ selectedEmployeeId }}</div>'
  }
}))

vi.mock('./org-management-workspace.vue', () => ({
  default: {
    name: 'OrgManagementWorkspace',
    props: ['managementMode', 'selectedOrgUnitId'],
    emits: ['update:selectedOrgUnitId'],
    template:
      '<div data-testid="departments-workspace">Departments Workspace {{ managementMode }} {{ selectedOrgUnitId }}</div>'
  }
}))

describe('organization people page', () => {
  beforeEach(() => {
    replace.mockReset()
    getSessionAccessSummaryApi.mockReset()
    getSessionContextApi.mockReset()
    getSessionContextApi.mockResolvedValue(authContextState.sessionContext)
    getSessionAccessSummaryApi.mockResolvedValue({
      actionCodes: ['tenant_org.org_unit.list_tree'],
      roles: []
    })
    routeState.name = 'TenantOrganizationPeople'
    routeState.path = '/settings/organization-people'
    routeState.query = {
      employeeId: 'employee-1',
      orgUnitId: 'org-1',
      pageKey: 'tenant-settings.organization-people',
      tab: 'members'
    }
  })

  it('defaults to the members tab and cleans legacy selection query state from the URL', async () => {
    const view = await import('./organization-people.vue')

    const wrapper = mount(view.default, {
      attachTo: document.body
    })

    expect(replace).toHaveBeenCalledWith({
      name: 'TenantOrganizationPeople',
      query: {}
    })
    expect(wrapper.text()).toContain('员工')
    expect(wrapper.text()).toContain('组织')
    expect(wrapper.find('[data-testid="members-workspace"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Members Workspace')
    expect(wrapper.text()).not.toContain('Departments Workspace')
  })

  it('switches to the departments tab while preserving the current query selection state', async () => {
    const view = await import('./organization-people.vue')

    const wrapper = mount(view.default, {
      attachTo: document.body
    })

    replace.mockReset()
    await wrapper.findAll('.ant-tabs-tab')[1]!.trigger('click')

    expect(replace).toHaveBeenCalledWith({
      name: 'TenantOrganizationPeople',
      query: {
        tab: 'departments',
      }
    })
  })

  it('reuses the tenant-mode org workspace when the departments tab route is active', async () => {
    routeState.query = {
      tab: 'departments'
    }

    const view = await import('./organization-people.vue')

    const wrapper = mount(view.default, {
      attachTo: document.body
    })

    expect(wrapper.find('[data-testid="departments-workspace"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Departments Workspace TENANT')
    expect(wrapper.text()).not.toContain('Members Workspace')
  })

  it('does not opt into page-level auto content scrolling for the unified workbench shell', async () => {
    const view = await import('./organization-people.vue')

    const wrapper = mount(view.default, {
      attachTo: document.body
    })

    expect(wrapper.get('[data-testid="page-shell"]').attributes('data-auto-content-height')).not.toBe('true')
  })
})
