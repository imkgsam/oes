import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const post = vi.fn()

vi.mock('#/api/request', () => ({
  requestClient: {
    get,
    post
  }
}))

// Verifies the tenant-web HR management API client stays aligned with the gateway employee and employment contract.
describe('tenant-web hr management api', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
  })

  it('lists the employee directory and loads one employee detail from the tenant-scoped HR entry', async () => {
    const { getManagedEmployeeDetailApi, listManagedEmployeesApi } = await import('./index')

    await listManagedEmployeesApi('tenant-1', {
      keyword: 'EMP',
      lifecycleStatus: 'ACTIVE',
      page: 2,
      pageSize: 10
    })
    await getManagedEmployeeDetailApi('tenant-1', 'employee-1')

    expect(get).toHaveBeenCalledWith('/hr-management/tenants/tenant-1/employees', {
      params: {
        keyword: 'EMP',
        lifecycleStatus: 'ACTIVE',
        page: 2,
        pageSize: 10
      }
    })
    expect(get).toHaveBeenCalledWith('/hr-management/tenants/tenant-1/employees/employee-1')
  })

  it('creates employees, creates employments, ends employments, and changes primary employment', async () => {
    const {
      changeManagedPrimaryEmploymentApi,
      completeManagedEmployeeAccessApi,
      createManagedEmployeeApi,
      createManagedEmploymentApi,
      endManagedEmploymentApi
    } = await import('./index')

    await createManagedEmployeeApi('tenant-1', {
      employeeCode: 'EMP-001',
      partyId: 'party-1',
      tenantPartyId: 'tenant-party-1'
    })
    await createManagedEmploymentApi('tenant-1', 'employee-1', {
      effectiveFrom: '2026-04-24T00:00:00.000Z',
      orgUnitId: 'org-1'
    })
    await endManagedEmploymentApi('tenant-1', 'employee-1', 'employment-1', {
      effectiveTo: '2026-04-25T00:00:00.000Z',
      endedReason: 'manual'
    })
    await changeManagedPrimaryEmploymentApi('tenant-1', 'employee-1', {
      effectiveFrom: '2026-04-26T00:00:00.000Z',
      endedReason: 'transfer',
      fromEmploymentId: 'employment-1',
      toOrgUnitId: 'org-2'
    })
    await completeManagedEmployeeAccessApi('tenant-1', 'employee-1', {
      employmentId: 'employment-1',
      roleIds: ['role-1'],
      reason: 'member_access_enable',
      createAccount: {
        displayName: 'EMP-001',
        email: 'member@example.com'
      }
    })

    expect(post).toHaveBeenCalledWith('/hr-management/tenants/tenant-1/employees', {
      employeeCode: 'EMP-001',
      partyId: 'party-1',
      tenantPartyId: 'tenant-party-1'
    })
    expect(post).toHaveBeenCalledWith('/hr-management/tenants/tenant-1/employees/employee-1/employments', {
      effectiveFrom: '2026-04-24T00:00:00.000Z',
      orgUnitId: 'org-1'
    })
    expect(post).toHaveBeenCalledWith(
      '/hr-management/tenants/tenant-1/employees/employee-1/employments/employment-1/end',
      {
        effectiveTo: '2026-04-25T00:00:00.000Z',
        endedReason: 'manual'
      }
    )
    expect(post).toHaveBeenCalledWith(
      '/hr-management/tenants/tenant-1/employees/employee-1/employments/change-primary',
      {
        effectiveFrom: '2026-04-26T00:00:00.000Z',
        endedReason: 'transfer',
        fromEmploymentId: 'employment-1',
        toOrgUnitId: 'org-2'
      }
    )
    expect(post).toHaveBeenCalledWith(
      '/hr-management/tenants/tenant-1/employees/employee-1/account-access',
      {
        employmentId: 'employment-1',
        roleIds: ['role-1'],
        reason: 'member_access_enable',
        createAccount: {
          displayName: 'EMP-001',
          email: 'member@example.com'
        }
      }
    )
  })

  it('loads the employee account-access summary for the member detail block', async () => {
    const { getManagedEmployeeAccountAccessApi } = await import('./index')

    await getManagedEmployeeAccountAccessApi('tenant-1', 'employee-1')

    expect(get).toHaveBeenCalledWith(
      '/hr-management/tenants/tenant-1/employees/employee-1/account-access'
    )
  })
})
