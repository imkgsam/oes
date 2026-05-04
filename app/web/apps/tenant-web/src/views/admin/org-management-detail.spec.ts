/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const getManagedOrgTreeApi = vi.fn()
const getManagedOrgUnitByIdApi = vi.fn()
const listManagedEmployeesApi = vi.fn()
const push = vi.fn()
const routeState: any = {
  params: {
    orgUnitId: 'org-dept-1'
  }
}
const authContextState: any = {
  sessionContext: {
    tenant: {
      tenantId: 'tenant-1',
      name: 'Alpha Tenant'
    }
  }
}

vi.mock('#/api', () => ({
  getManagedOrgTreeApi,
  getManagedOrgUnitByIdApi,
  listManagedEmployeesApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
  useRouter: () => ({
    push
  })
}))

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    props: ['title'],
    template: '<div><h1>{{ title }}</h1><slot /></div>'
  }
}))

describe('org management detail page', () => {
  beforeEach(() => {
    push.mockReset()
    getManagedOrgTreeApi.mockReset()
    getManagedOrgUnitByIdApi.mockReset()
    listManagedEmployeesApi.mockReset()
    getManagedOrgUnitByIdApi.mockResolvedValue({
      orgUnit: {
        depth: 1,
        id: 'org-dept-1',
        name: '制造中心',
        organizationPartyId: 'party-1',
        parentOrgId: 'org-root-1',
        path: '/org-root-1/org-dept-1',
        sortOrder: 10,
        status: 'ACTIVE',
        tenantId: 'tenant-1',
        type: 'DEPARTMENT'
      }
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
            },
            {
              children: [],
              orgUnit: {
                depth: 1,
                id: 'org-team-1',
                name: '装配一组',
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
    listManagedEmployeesApi.mockResolvedValue({
      items: [
        {
          employee: {
            displayName: '林予安',
            employeeCode: 'EMP-001',
            id: 'employee-1',
            lifecycleStatus: 'ACTIVE',
            tenantId: 'tenant-1',
            tenantPartyId: 'tenant-party-1'
          },
          activeEmployment: {
            effectiveFrom: '2026-04-24T00:00:00.000Z',
            employeeId: 'employee-1',
            id: 'employment-1',
            orgUnitId: 'org-dept-1',
            status: 'ACTIVE',
            tenantId: 'tenant-1'
          }
        },
        {
          employee: {
            displayName: '周承屿',
            employeeCode: 'EMP-002',
            id: 'employee-2',
            lifecycleStatus: 'ACTIVE',
            tenantId: 'tenant-1',
            tenantPartyId: 'tenant-party-2'
          },
          activeEmployment: {
            effectiveFrom: '2026-04-20T00:00:00.000Z',
            employeeId: 'employee-2',
            id: 'employment-2',
            orgUnitId: 'org-team-1',
            status: 'ACTIVE',
            tenantId: 'tenant-1'
          }
        }
      ],
      page: 1,
      pageSize: 100,
      total: 2
    })
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('loads department detail and child orgs without exposing organization party fields', async () => {
    const view = await import('./org-management-detail.vue')

    const wrapper = mount(view.default, {
      attachTo: document.body
    })

    await flushPromises()

    expect(getManagedOrgUnitByIdApi).toHaveBeenCalledWith('tenant-1', 'org-dept-1')
    expect(getManagedOrgTreeApi).toHaveBeenCalledWith('tenant-1')
    expect(listManagedEmployeesApi).toHaveBeenCalledWith('tenant-1', {
      lifecycleStatus: 'ACTIVE',
      page: 1,
      pageSize: 100
    })
    expect(wrapper.text()).toContain('部门详情')
    expect(wrapper.text()).toContain('制造中心')
    expect(wrapper.text()).toContain('装配一组')
    expect(wrapper.text()).toContain('成员数量')
    expect(wrapper.text()).not.toContain('OrganizationParty')
    expect(wrapper.text()).not.toContain('party-1')
  })

  it('shows only direct members assigned to the current department', async () => {
    const view = await import('./org-management-detail.vue')

    const wrapper = mount(view.default, {
      attachTo: document.body
    })

    await flushPromises()

    expect(wrapper.text()).toContain('直属成员')
    expect(wrapper.text()).toContain('林予安')
    expect(wrapper.text()).toContain('EMP-001')
    expect(wrapper.text()).not.toContain('周承屿')
    expect(wrapper.text()).toContain('1')
  })
})
