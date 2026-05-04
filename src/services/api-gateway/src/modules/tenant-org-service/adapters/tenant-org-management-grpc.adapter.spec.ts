import { mapTenantOnboardingGatewayResult } from './tenant-org-management-grpc.adapter'

describe('TenantOrgManagementGrpcAdapter mapping', () => {
  it('preserves first-admin employee and account.basic onboarding refs', () => {
    const result = mapTenantOnboardingGatewayResult({
      onboardingId: 'onboarding-1',
      status: 'SUCCEEDED',
      firstAdminEmployee: {
        employeeId: 'employee-first-admin',
        employmentId: 'employment-first-admin',
        accessProcessId: 'access-first-admin'
      },
      access: {
        roleCode: 'tenant.admin',
        roleId: 'role-tenant-admin',
        grantId: 'grant-tenant-admin',
        hrAdminRoleCode: 'hr.admin',
        hrAdminRoleId: 'role-hr-admin',
        hrAdminGrantId: 'grant-hr-admin',
        accountBasicRoleCode: 'account.basic',
        accountBasicRoleId: 'role-account-basic'
      },
      steps: []
    })

    expect(result).toMatchObject({
      firstAdminEmployee: {
        employeeId: 'employee-first-admin',
        employmentId: 'employment-first-admin',
        accessProcessId: 'access-first-admin'
      },
      access: {
        accountBasicRoleCode: 'account.basic',
        accountBasicRoleId: 'role-account-basic'
      }
    })
  })
})
