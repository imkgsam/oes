/* @vitest-environment happy-dom */

import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    template: '<div><slot /></div>'
  }
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
    routeState.name = 'TenantOrganizationPeople'
    routeState.path = '/settings/organization-people'
    routeState.query = {
      employeeId: 'employee-1',
      orgUnitId: 'org-1',
      pageKey: 'tenant-settings.organization-people',
      tab: 'members'
    }
  })

  it('defaults to the members tab and passes the selected employee query into the members workspace', async () => {
    const view = await import('./organization-people.vue')

    const wrapper = mount(view.default, {
      attachTo: document.body
    })

    expect(wrapper.text()).toContain('组织与人员')
    expect(wrapper.text()).toContain('成员')
    expect(wrapper.text()).toContain('部门')
    expect(wrapper.find('[data-testid="members-workspace"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Members Workspace employee-1')
    expect(wrapper.text()).not.toContain('Departments Workspace')
  })

  it('switches to the departments tab while preserving the current query selection state', async () => {
    const view = await import('./organization-people.vue')

    const wrapper = mount(view.default, {
      attachTo: document.body
    })

    await wrapper.get('[data-testid="organization-people-tab-departments"]').trigger('click')

    expect(replace).toHaveBeenCalledWith({
      name: 'TenantOrganizationPeople',
      query: {
        employeeId: 'employee-1',
        orgUnitId: 'org-1',
        pageKey: 'tenant-settings.organization-people',
        tab: 'departments'
      }
    })
  })

  it('reuses the tenant-mode org workspace when the departments tab route is active', async () => {
    routeState.query = {
      employeeId: 'employee-1',
      orgUnitId: 'org-1',
      pageKey: 'tenant-settings.organization-people',
      tab: 'departments'
    }

    const view = await import('./organization-people.vue')

    const wrapper = mount(view.default, {
      attachTo: document.body
    })

    expect(wrapper.find('[data-testid="departments-workspace"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Departments Workspace TENANT org-1')
    expect(wrapper.text()).not.toContain('Members Workspace')
  })
})
