/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Checkbox, Modal, Select, TreeSelect, message } from 'ant-design-vue'

const changeManagedPrimaryEmploymentApi = vi.fn()
const completeManagedEmployeeAccessApi = vi.fn()
const createManagedEmployeeApi = vi.fn()
const createManagedEmploymentApi = vi.fn()
const endManagedEmploymentApi = vi.fn()
const getManagedEmployeeAccountAccessApi = vi.fn()
const getManagedEmployeeDetailApi = vi.fn()
const getManagedOrgTreeApi = vi.fn()
const getManagedOrgUnitByIdApi = vi.fn()
const listRolesApi = vi.fn()
const listManagedEmployeesApi = vi.fn()
const useRoute = vi.fn()
const replace = vi.fn()
const push = vi.fn()

const authContextState: any = {
  actionCodes: [
    'hr.employee.list',
    'hr.employee.get_by_id',
    'hr.employee.create',
    'hr.employment.create',
    'hr.employment.change_primary',
    'hr.employment.end',
    'identity.account.create',
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
  tenantName: 'Alpha Tenant',
  visibleEntries: ['admin.account-management', 'admin.role-management']
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
  getManagedOrgUnitByIdApi,
  listRolesApi,
  listManagedEmployeesApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('@vben/preferences', () => ({
  preferences: {
    app: {
      locale: 'zh-CN'
    }
  }
}))

vi.mock('vue-router', () => ({
  useRoute: () => useRoute(),
  useRouter: () => ({
    push,
    replace
  })
}))

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    props: ['title'],
    template: '<div><slot /></div>'
  }
}))

function emitSelectValue(wrapper: ReturnType<typeof mount>, testId: string, value: string) {
  const select = wrapper
    .findAllComponents(Select)
    .find((component) => component.attributes('data-testid') === testId)
  expect(select).toBeTruthy()
  select?.vm.$emit('update:value', value)
  select?.vm.$emit('change', value)
}

function emitTreeSelectValue(wrapper: ReturnType<typeof mount>, testId: string, value: string) {
  const select = wrapper
    .findAllComponents(TreeSelect)
    .find((component) => component.attributes('data-testid') === testId)
  expect(select).toBeTruthy()
  select?.vm.$emit('update:value', value)
  select?.vm.$emit('change', value)
}

function emitCheckboxValue(wrapper: ReturnType<typeof mount>, testId: string, checked: boolean) {
  const checkboxByTestId = wrapper
    .findAllComponents(Checkbox)
    .find((component) => component.attributes('data-testid') === testId)
  const checkbox = checkboxByTestId ?? wrapper.findComponent(Checkbox)
  expect(checkbox).toBeTruthy()
  checkbox.vm.$emit('update:checked', checked)
  checkbox.vm.$emit('change', { target: { checked } })
}

describe('employee management page', () => {
  beforeEach(() => {
    replace.mockReset()
    push.mockReset()
    changeManagedPrimaryEmploymentApi.mockReset()
    completeManagedEmployeeAccessApi.mockReset()
    createManagedEmployeeApi.mockReset()
    createManagedEmploymentApi.mockReset()
    endManagedEmploymentApi.mockReset()
    getManagedEmployeeAccountAccessApi.mockReset()
    getManagedEmployeeDetailApi.mockReset()
    getManagedOrgTreeApi.mockReset()
    getManagedOrgUnitByIdApi.mockReset()
    listRolesApi.mockReset()
    listManagedEmployeesApi.mockReset()
    authContextState.actionCodes = [
      'hr.employee.list',
      'hr.employee.get_by_id',
      'hr.employee.create',
      'hr.employment.create',
      'hr.employment.change_primary',
      'hr.employment.end',
      'identity.account.create',
      'tenant_org.org_unit.list_tree',
      'tenant_org.org_unit.get_by_id'
    ]
    authContextState.visibleEntries = ['admin.account-management']
    useRoute.mockReturnValue({
      meta: {
        entryKey: 'tenant-settings.employee-employment'
      }
    })
    listManagedEmployeesApi.mockResolvedValue({
      items: [
        {
          employee: {
            employeeCode: 'EMP-001',
            id: 'employee-1',
            lifecycleStatus: 'ACTIVE',
            partyId: 'party-1',
            tenantId: 'tenant-1',
            tenantPartyId: 'tenant-party-1'
          },
          activeEmployment: {
            effectiveFrom: '2026-04-24T00:00:00.000Z',
            employeeId: 'employee-1',
            id: 'employment-1',
            orgUnitId: 'org-branch-1',
            orgUnit: {
              depth: 1,
              id: 'org-branch-1',
              name: '华东分公司',
              organizationParty: {
                id: 'party-branch-1',
                legalName: '华东制造主体有限公司',
                status: 'ACTIVE',
                type: 'ORGANIZATION'
              },
              organizationPartyId: 'party-branch-1',
              parentOrgId: 'org-root-1',
              path: '/org-root-1/org-branch-1',
              sortOrder: 10,
              status: 'ACTIVE',
              tenantId: 'tenant-1',
              type: 'BRANCH'
            },
            status: 'ACTIVE',
            tenantId: 'tenant-1'
          }
        }
      ],
      page: 1,
      pageSize: 20,
      total: 1
    })
    getManagedEmployeeDetailApi.mockResolvedValue({
      employee: {
        employeeCode: 'EMP-001',
        id: 'employee-1',
        lifecycleStatus: 'ACTIVE',
        partyId: 'party-1',
        tenantId: 'tenant-1',
        tenantPartyId: 'tenant-party-1'
      },
      activeEmployment: {
        effectiveFrom: '2026-04-24T00:00:00.000Z',
        employeeId: 'employee-1',
        id: 'employment-1',
        orgUnitId: 'org-branch-1',
        orgUnit: {
          depth: 1,
          id: 'org-branch-1',
          name: '华东分公司',
          organizationParty: {
            id: 'party-branch-1',
            legalName: '华东制造主体有限公司',
            status: 'ACTIVE',
            type: 'ORGANIZATION'
          },
          organizationPartyId: 'party-branch-1',
          parentOrgId: 'org-root-1',
          path: '/org-root-1/org-branch-1',
          sortOrder: 10,
          status: 'ACTIVE',
          tenantId: 'tenant-1',
          type: 'BRANCH'
        },
        status: 'ACTIVE',
        tenantId: 'tenant-1'
      },
      employments: [
        {
          effectiveFrom: '2026-04-24T00:00:00.000Z',
          employeeId: 'employee-1',
          id: 'employment-1',
          orgUnitId: 'org-branch-1',
          orgUnit: {
            depth: 1,
            id: 'org-branch-1',
            name: '华东分公司',
            organizationParty: {
              id: 'party-branch-1',
              legalName: '华东制造主体有限公司',
              status: 'ACTIVE',
              type: 'ORGANIZATION'
            },
            organizationPartyId: 'party-branch-1',
            parentOrgId: 'org-root-1',
            path: '/org-root-1/org-branch-1',
            sortOrder: 10,
            status: 'ACTIVE',
            tenantId: 'tenant-1',
            type: 'BRANCH'
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
            organizationParty: {
              id: 'party-root-1',
              legalName: 'Alpha Holdings Co.',
              status: 'ACTIVE',
              type: 'ORGANIZATION'
            },
            organizationPartyId: 'party-root-1',
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
    })
    getManagedEmployeeAccountAccessApi.mockResolvedValue({
      status: 'PENDING',
      onboardingStatus: 'ACCESS_GRANT_PENDING',
      canContinue: true,
      activeEmploymentId: 'employment-1',
      failureReason: 'permission-service unavailable',
      account: {
        accountId: 'account-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        displayName: 'EMP-001',
        isEnabled: true,
        scopeLevel: 'TENANT'
      },
      loginMethods: [
        {
          methodId: 'method-1',
          type: 'EMAIL_PASSWORD',
          maskedIdentifier: 'm***@example.com',
          enabled: true,
          verified: true,
          hasPassword: false
        }
      ],
      passwordSetupRequired: true,
      roles: [
        {
          id: 'role-1',
          code: 'tenant.admin',
          name: 'Tenant Admin'
        }
      ]
    })
    getManagedOrgTreeApi.mockResolvedValue({
      roots: [
        {
          children: [
            {
              children: [],
              orgUnit: {
                depth: 1,
                id: 'org-branch-1',
                name: '华东分公司',
                organizationParty: {
                  id: 'party-branch-1',
                  legalName: '华东制造主体有限公司',
                  status: 'ACTIVE',
                  type: 'ORGANIZATION'
                },
                organizationPartyId: 'party-branch-1',
                parentOrgId: 'org-root-1',
                path: '/org-root-1/org-branch-1',
                sortOrder: 10,
                status: 'ACTIVE',
                tenantId: 'tenant-1',
                type: 'BRANCH'
              }
            }
          ],
          orgUnit: {
            depth: 0,
            id: 'org-root-1',
            name: 'Alpha 集团',
            organizationParty: {
              id: 'party-root-1',
              legalName: 'Alpha Holdings Co.',
              status: 'ACTIVE',
              type: 'ORGANIZATION'
            },
            organizationPartyId: 'party-root-1',
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
        id: 'org-branch-1',
        name: '华东分公司',
        organizationParty: {
          id: 'party-branch-1',
          legalName: '华东制造主体有限公司',
          status: 'ACTIVE',
          type: 'ORGANIZATION'
        },
        organizationPartyId: 'party-branch-1',
        path: '/org-root-1/org-branch-1',
        sortOrder: 10,
        status: 'ACTIVE',
        tenantId: 'tenant-1',
        type: 'BRANCH'
      }
    })
    createManagedEmployeeApi.mockResolvedValue({
      employee: {
        employeeCode: 'EMP-002',
        id: 'employee-2',
        lifecycleStatus: 'PREBOARDING',
        partyId: 'party-2',
        tenantId: 'tenant-1',
        tenantPartyId: 'tenant-party-2'
      }
    })
    createManagedEmploymentApi.mockResolvedValue({
      employee: {
        employeeCode: 'EMP-002',
        id: 'employee-2',
        lifecycleStatus: 'ACTIVE',
        partyId: 'party-2',
        tenantId: 'tenant-1',
        tenantPartyId: 'tenant-party-2'
      },
      employment: {
        effectiveFrom: '2026-04-25T00:00:00.000Z',
        employeeId: 'employee-2',
        id: 'employment-2',
        orgUnitId: 'org-1',
        status: 'ACTIVE',
        tenantId: 'tenant-1'
      }
    })
    changeManagedPrimaryEmploymentApi.mockResolvedValue({
      employee: { id: 'employee-1' },
      endedEmployment: { id: 'employment-1' },
      newEmployment: { id: 'employment-2' }
    })
    endManagedEmploymentApi.mockResolvedValue({
      employee: { id: 'employee-1' },
      employment: { id: 'employment-1', status: 'ENDED' }
    })
    completeManagedEmployeeAccessApi.mockResolvedValue({
      status: 'ACTIVE',
      onboardingStatus: 'COMPLETED',
      canContinue: false,
      activeEmploymentId: 'employment-1',
      account: {
        accountId: 'account-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        displayName: 'EMP-001',
        isEnabled: true,
        scopeLevel: 'TENANT'
      },
      loginMethods: [],
      passwordSetupRequired: false,
      roles: [
        {
          id: 'role-1',
          code: 'tenant.admin',
          name: 'Tenant Admin'
        }
      ]
    })
    listRolesApi.mockResolvedValue({
      page: 1,
      pageSize: 20,
      total: 1,
      roles: [
        {
          id: 'role-1',
          code: 'tenant.admin',
          name: 'Tenant Admin',
          isEnabled: true,
          isSystem: false,
          roleKind: 'TENANT',
          tenantId: 'tenant-1'
        }
      ]
    })
    vi.spyOn(message, 'success').mockImplementation(vi.fn())
    vi.spyOn(message, 'error').mockImplementation(vi.fn())
    vi.spyOn(Modal, 'confirm').mockImplementation((options: any) => {
      void options?.onOk?.()
      return {
        destroy: vi.fn(),
        update: vi.fn()
      } as any
    })
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('renders the tenant HR entry as the Stitch-style compact employee directory', async () => {
    const view = await import('./employee-management.vue')

    const wrapper = mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('员工管理')
    expect(wrapper.text()).toContain('部门')
    expect(wrapper.text()).toContain('状态')
    expect(wrapper.text()).toContain('职位')
    expect(wrapper.text()).toContain('高级筛选')
    expect(wrapper.text()).toContain('新增员工')
    expect(wrapper.find('.employee-management__hero').exists()).toBe(false)
    expect(wrapper.find('.employee-management__table-card').exists()).toBe(true)
    expect(wrapper.text()).toContain('待继续完成接入')
    expect(wrapper.text()).toContain('EMP-001')
    expect(wrapper.text()).toContain('华东分公司')
    expect(wrapper.text()).toContain('华东制造主体')
    expect(wrapper.text()).not.toContain('TenantPartyId')
    expect(wrapper.text()).not.toContain('PartyId')
    expect(listManagedEmployeesApi).toHaveBeenCalledWith('tenant-1', {
      keyword: undefined,
      lifecycleStatus: undefined,
      page: 1,
      pageSize: 20
    })
    expect(getManagedOrgTreeApi).toHaveBeenCalledWith('tenant-1')
    expect(getManagedEmployeeAccountAccessApi).toHaveBeenCalledWith('tenant-1', 'employee-1')
    expect(getManagedEmployeeDetailApi).not.toHaveBeenCalled()
    expect(getManagedOrgUnitByIdApi).not.toHaveBeenCalled()
  })

  it('does not write the selected employee id back into the route query on mount', async () => {
    const view = await import('./employee-management.vue')

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()

    expect(replace).not.toHaveBeenCalled()
  })

  it('routes employee view actions to the independent employee detail page', async () => {
    const view = await import('./employee-management.vue')

    const wrapper = mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()
    await wrapper.get('[data-testid="employee-open-detail-employee-1"]').trigger('click')
    await flushPromises()

    expect(push).toHaveBeenCalledWith({
      name: 'TenantEmployeeDetail',
      params: {
        employeeId: 'employee-1'
      }
    })
  })

  it('keeps account actions bounded to member-context enable/continue plus the account-management cross-link', async () => {
    const view = await import('./employee-management.vue')

    const wrapper = mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()
    await wrapper.get('[data-testid="employee-edit-employee-1"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('继续完成接入')
    await wrapper.get('[data-testid="employee-account-management-link"]').trigger('click')

    expect(push).toHaveBeenCalledWith('/admin/account-management')
  })

  it('creates one employee and immediately establishes the first employment plus optional login access onboarding', async () => {
    const view = await import('./employee-management.vue')
    const wrapper = mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()
    await wrapper.get('[data-testid="employee-create-open"]').trigger('click')
    await wrapper.get('[data-testid="employee-display-name-input"]').setValue('林予安')
    emitSelectValue(wrapper, 'employee-gender-select', 'FEMALE')
    emitSelectValue(wrapper, 'employee-identity-type-select', 'NATIONAL_ID')
    await wrapper.get('[data-testid="employee-identity-number-input"]').setValue('110101199001011234')
    expect(wrapper.text()).toContain('华东制造主体')
    emitTreeSelectValue(wrapper, 'employee-org-select', 'org-branch-1')
    await wrapper.get('[data-testid="employee-primary-position-input"]').setValue('生产主管')
    await wrapper.get('[data-testid="employee-joined-on-input"]').setValue('2026-04-25')
    emitCheckboxValue(wrapper, 'employee-allow-login-toggle', true)
    await flushPromises()
    await wrapper.get('[data-testid="employee-login-email-input"]').setValue('member@example.com')
    await wrapper.get('[data-testid="employee-create-submit"]').trigger('click')
    await flushPromises()

    expect(createManagedEmployeeApi).toHaveBeenCalledWith('tenant-1', {
      account: {
        displayName: '林予安',
        email: 'member@example.com',
        phone: undefined
      },
      person: {
        gender: 'FEMALE',
        identifiers: [
          {
            identifierType: 'NATIONAL_ID',
            issuerCountryOrRegion: 'CN',
            normalizedValue: '110101199001011234',
            rawValue: '110101199001011234'
          }
        ],
        legalName: '林予安'
      },
      primaryEmployment: {
        effectiveFrom: '2026-04-25T00:00:00.000Z',
        orgUnitId: 'org-branch-1',
        positionName: '生产主管'
      }
    })
    expect(createManagedEmploymentApi).toHaveBeenCalledWith('tenant-1', 'employee-2', {
      effectiveFrom: '2026-04-25T00:00:00.000Z',
      orgUnitId: 'org-branch-1'
    })
    expect(completeManagedEmployeeAccessApi).toHaveBeenCalledWith('tenant-1', 'employee-2', {
      employmentId: 'employment-2',
      roleIds: ['role-1'],
      reason: 'member_create_allow_login',
      createAccount: {
        displayName: '林予安',
        email: 'member@example.com',
        phone: undefined
      }
    })
  })

  it('allows ending the active employment and changing primary employment when backend commands exist', async () => {
    const view = await import('./employee-management.vue')
    const wrapper = mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()
    await wrapper.get('[data-testid="employee-edit-employee-1"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="employment-end-button"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="change-employment-open"]').trigger('click')
    emitSelectValue(wrapper, 'change-employment-org-select', 'org-branch-1')
    await wrapper.get('[data-testid="change-employment-effective-from-input"]').setValue('2026-04-26T00:00')
    await wrapper.get('[data-testid="change-employment-submit"]').trigger('click')
    await flushPromises()

    expect(endManagedEmploymentApi).toHaveBeenCalledWith('tenant-1', 'employee-1', 'employment-1', {
      effectiveTo: expect.any(String),
      endedReason: 'manual_end'
    })
    expect(changeManagedPrimaryEmploymentApi).toHaveBeenCalledWith('tenant-1', 'employee-1', {
      effectiveFrom: '2026-04-26T00:00:00.000Z',
      endedReason: 'transfer',
      fromEmploymentId: 'employment-1',
      toOrgUnitId: 'org-branch-1'
    })
  })

  it('continues one pending member access flow with the existing account instead of creating a second account', async () => {
    const view = await import('./employee-management.vue')
    const wrapper = mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()
    await wrapper.get('[data-testid="employee-edit-employee-1"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="employee-continue-access-open"]').trigger('click')
    emitSelectValue(wrapper, 'employee-login-role-select', 'role-1')
    await wrapper.get('[data-testid="employee-access-submit"]').trigger('click')
    await flushPromises()

    expect(completeManagedEmployeeAccessApi).toHaveBeenCalledWith('tenant-1', 'employee-1', {
      employmentId: 'employment-1',
      roleIds: ['role-1'],
      reason: 'member_access_continue',
      existingAccountId: 'account-1'
    })
  })
})
