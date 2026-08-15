import { of } from 'rxjs'
import { PermissionTenantOnboardingGrpcAdapter } from '../../src/infrastructure/adapters/permission-tenant-onboarding.grpc.adapter'

// Verifies tenant onboarding asks permission-service for both governance and HR admin role access.
describe('PermissionTenantOnboardingGrpcAdapter', () => {
  it('ensures account.basic role instances from the permission role template contract', async () => {
    const ensureTenantRoleInstanceFromTemplate = jest.fn().mockReturnValue(
      of({
        role: { id: 'role-account-basic', code: 'account.basic' },
        created: true
      })
    )
    const adapter = createAdapter({ ensureTenantRoleInstanceFromTemplate })

    await expect(
      adapter.ensureAccountBasicRole({
        tenantId: 'tenant-1',
        idempotencyKey: 'onboarding-1:ENSURE_ACCOUNT_BASIC_ROLE'
      })
    ).resolves.toEqual({ roleId: 'role-account-basic', roleCode: 'account.basic', created: true })

    expect(ensureTenantRoleInstanceFromTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        templateRoleCode: 'account.basic',
        idempotencyKey: 'onboarding-1:ENSURE_ACCOUNT_BASIC_ROLE',
        name: 'Account Basic'
      }),
      undefined
    )
  })

  it('ensures hr.admin role instances from the permission role template contract', async () => {
    const ensureTenantRoleInstanceFromTemplate = jest.fn().mockReturnValue(
      of({
        role: { id: 'role-hr-admin', code: 'hr.admin' },
        created: true
      })
    )
    const adapter = createAdapter({ ensureTenantRoleInstanceFromTemplate })

    await expect(
      adapter.ensureHrAdminRole({
        tenantId: 'tenant-1',
        idempotencyKey: 'onboarding-1:ENSURE_HR_ADMIN_ROLE'
      })
    ).resolves.toEqual({ roleId: 'role-hr-admin', roleCode: 'hr.admin', created: true })

    expect(ensureTenantRoleInstanceFromTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        templateRoleCode: 'hr.admin',
        idempotencyKey: 'onboarding-1:ENSURE_HR_ADMIN_ROLE',
        name: 'HR Admin'
      }),
      undefined
    )
  })

  it('grants hr.admin role instances to the first tenant account through the tenant onboarding grant contract', async () => {
    const grantInitialAccessForTenantAccount = jest.fn().mockReturnValue(
      of({
        grant: { id: 'grant-hr-admin' }
      })
    )
    const adapter = createAdapter({ grantInitialAccessForTenantAccount })

    await expect(
      adapter.grantHrAdmin({
        tenantId: 'tenant-1',
        accountId: 'account-1',
        roleId: 'role-hr-admin',
        idempotencyKey: 'onboarding-1:GRANT_HR_ADMIN_ROLE'
      })
    ).resolves.toEqual({ grantId: 'grant-hr-admin' })

    expect(grantInitialAccessForTenantAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        accountId: 'account-1',
        roleIds: ['role-hr-admin'],
        idempotencyKey: 'onboarding-1:GRANT_HR_ADMIN_ROLE'
      }),
      undefined
    )
  })
})

function createAdapter(service: {
  ensureTenantRoleInstanceFromTemplate?: jest.Mock
  grantInitialAccessForTenantAccount?: jest.Mock
}) {
  const adapter = new PermissionTenantOnboardingGrpcAdapter(
    {
      getService: jest.fn(() => ({
        ensureTenantRoleInstanceFromTemplate: service.ensureTenantRoleInstanceFromTemplate ?? jest.fn(),
        grantInitialAccessForTenantAccount: service.grantInitialAccessForTenantAccount ?? jest.fn()
      }))
    } as any,
    {} as any,
    {} as any
  )
  adapter.onModuleInit()
  ;(adapter as any).trusted = {
    forBusinessCall: jest.fn().mockResolvedValue(undefined)
  }
  return adapter
}
