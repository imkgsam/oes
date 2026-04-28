/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const changeManagedPrimaryEmploymentApi = vi.fn()
const completeManagedEmployeeAccessApi = vi.fn()
const createManagedEmployeeApi = vi.fn()
const createManagedEmploymentApi = vi.fn()
const endManagedEmploymentApi = vi.fn()
const getManagedEmployeeAccountAccessApi = vi.fn()
const getManagedEmployeeDetailApi = vi.fn()
const getManagedOrgTreeApi = vi.fn()
const listManagedEmployeesApi = vi.fn()
const listRolesApi = vi.fn()
const push = vi.fn()

const authContextState: any = {
  actionCodes: [
    'hr.employee.list',
    'hr.employee.get_by_id',
    'identity.account.create'
  ],
  sessionContext: {
    tenant: {
      tenantId: 'tenant-1',
      name: 'Alpha Tenant'
    }
  },
  tenantName: 'Alpha Tenant',
  visibleEntries: ['admin.account-management']
}

vi.mock('#/api', () => ({
  changeManagedPrimaryEmploymentApi,
  completeManagedEmployeeAccessApi,
  createManagedEmployeeApi,
  createManagedEmploymentApi,
  endManagedEmploymentApi,
  getManagedEmployeeAccountAccessApi,
  getManagedEmployeeDetailApi,
  getManagedOrgTreeApi,
  listManagedEmployeesApi,
  listRolesApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push
  })
}))

describe('employee management workspace', () => {
  beforeEach(() => {
    changeManagedPrimaryEmploymentApi.mockReset()
    completeManagedEmployeeAccessApi.mockReset()
    createManagedEmployeeApi.mockReset()
    createManagedEmploymentApi.mockReset()
    endManagedEmploymentApi.mockReset()
    getManagedEmployeeAccountAccessApi.mockReset()
    getManagedEmployeeDetailApi.mockReset()
    getManagedOrgTreeApi.mockReset()
    listManagedEmployeesApi.mockReset()
    listRolesApi.mockReset()
    push.mockReset()

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

    listManagedEmployeesApi.mockResolvedValue({
      items: [
        {
          employee: {
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
        },
        {
          employee: {
            employeeCode: 'EMP-002',
            id: 'employee-2',
            lifecycleStatus: 'OFFBOARDED',
            tenantId: 'tenant-1',
            tenantPartyId: 'tenant-party-2'
          }
        }
      ],
      page: 1,
      pageSize: 20,
      total: 2
    })

    getManagedEmployeeDetailApi.mockImplementation(async (_tenantId: string, employeeId: string) => {
      if (employeeId === 'employee-2') {
        return {
          employee: {
            employeeCode: 'EMP-002',
            id: 'employee-2',
            lifecycleStatus: 'OFFBOARDED',
            tenantId: 'tenant-1',
            tenantPartyId: 'tenant-party-2'
          },
          employments: []
        }
      }

      return {
        employee: {
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
          },
          {
            effectiveFrom: '2026-03-01T00:00:00.000Z',
            effectiveTo: '2026-04-23T23:59:59.000Z',
            employeeId: 'employee-1',
            endedReason: 'transfer',
            id: 'employment-0',
            orgUnitId: 'org-root-1',
            orgUnit: {
              depth: 0,
              id: 'org-root-1',
              name: 'Alpha 集团',
              path: '/org-root-1',
              sortOrder: 0,
              status: 'ACTIVE',
              tenantId: 'tenant-1',
              type: 'ROOT'
            },
            status: 'ENDED',
            tenantId: 'tenant-1'
          }
        ]
      }
    })

    getManagedEmployeeAccountAccessApi.mockResolvedValue({
      status: 'PENDING',
      canContinue: true,
      failureReason: 'permission-service unavailable',
      loginMethods: [
        {
          enabled: true,
          hasPassword: false,
          maskedIdentifier: 'm***@example.com',
          methodId: 'method-1',
          type: 'EMAIL_PASSWORD',
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

    listRolesApi.mockResolvedValue({
      page: 1,
      pageSize: 20,
      roles: [],
      total: 0
    })
  })

  it('renders the members workbench as org filter + directory + detail without a separate offboarded workspace', async () => {
    const view = await import('./employee-management-workspace.vue')

    const wrapper = mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()

    expect(listManagedEmployeesApi).toHaveBeenCalledWith('tenant-1', {
      keyword: undefined,
      lifecycleStatus: undefined,
      page: 1,
      pageSize: 20
    })
    expect(wrapper.get('[data-testid="employee-org-filter-panel"]').text()).toContain('组织筛选')
    expect(wrapper.get('[data-testid="employee-directory-panel"]').text()).toContain('成员目录')
    expect(wrapper.get('[data-testid="employee-detail-panel"]').text()).toContain('成员详情')
    expect(wrapper.text()).toContain('全部成员')
    expect(wrapper.text()).toContain('在职')
    expect(wrapper.text()).toContain('已离职')

    const sectionTitles = wrapper
      .findAll('[data-testid^="employee-detail-section-"] .employee-management__section-title')
      .map((node) => node.text())

    expect(sectionTitles).toEqual([
      '概要与动作',
      '员工信息',
      '当前任职',
      '账号与访问',
      '任职记录'
    ])
    expect(wrapper.text()).not.toContain('其他任职')
    expect(wrapper.text()).toContain('EMP-001')
    expect(wrapper.text()).toContain('制造中心')
    expect(wrapper.text()).toContain('Tenant Admin')
    expect(wrapper.text()).toContain('permission-service unavailable')
  })
})
