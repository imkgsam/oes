/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const getManagedEmployeeAccountAccessApi = vi.fn()
const getManagedEmployeeDetailApi = vi.fn()
const push = vi.fn()
const routeState: any = {
  params: {
    employeeId: 'employee-1'
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
  getManagedEmployeeAccountAccessApi,
  getManagedEmployeeDetailApi
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

describe('employee management detail page', () => {
  beforeEach(() => {
    push.mockReset()
    getManagedEmployeeAccountAccessApi.mockReset()
    getManagedEmployeeDetailApi.mockReset()
    getManagedEmployeeDetailApi.mockResolvedValue({
      employee: {
        employeeCode: 'EMP-001',
        displayName: 'Ada Chen',
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
        },
        status: 'ACTIVE',
        tenantId: 'tenant-1'
      },
      employments: [
        {
          effectiveFrom: '2026-04-24T00:00:00.000Z',
          employeeId: 'employee-1',
          id: 'employment-1',
          orgUnitId: 'org-dept-1',
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
          },
          status: 'ACTIVE',
          tenantId: 'tenant-1'
        }
      ]
    })
    getManagedEmployeeAccountAccessApi.mockResolvedValue({
      status: 'ACTIVE',
      canContinue: false,
      loginMethods: [
        {
          enabled: true,
          hasPassword: false,
          maskedIdentifier: 'a***@example.com',
          methodId: 'method-1',
          type: 'EMAIL_OTP',
          verified: true
        }
      ],
      passwordSetupRequired: true,
      roles: [
        {
          code: 'tenant.admin',
          id: 'role-1',
          name: 'Tenant Admin'
        }
      ]
    })
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('loads employee detail and access summary as a dedicated detail page', async () => {
    const view = await import('./employee-management-detail.vue')

    const wrapper = mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()

    expect(getManagedEmployeeDetailApi).toHaveBeenCalledWith('tenant-1', 'employee-1')
    expect(getManagedEmployeeAccountAccessApi).toHaveBeenCalledWith('tenant-1', 'employee-1')
    expect(wrapper.text()).toContain('员工详情')
    expect(wrapper.text()).toContain('Ada Chen')
    expect(wrapper.text()).toContain('制造中心')
    expect(wrapper.text()).toContain('账号与访问')
  })
})
