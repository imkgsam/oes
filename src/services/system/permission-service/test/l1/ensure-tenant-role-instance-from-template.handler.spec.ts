import { EnsureTenantRoleInstanceFromTemplateCommand } from '../../src/application/commands/role/ensure-tenant-role-instance-from-template.command'
import { EnsureTenantRoleInstanceFromTemplateHandler } from '../../src/application/commands/role/ensure-tenant-role-instance-from-template.handler'
import { buildTenantBoundQueryScope } from '../../src/application/authorization/operator-scope'
import { Role } from '../../src/domain/aggregates/role.aggregate'
import { RoleKind } from '../../src/domain/enums/role-kind.enum'

function createRoleRepository() {
  return {
    findByScopeKindAndCode: jest.fn(),
    save: jest.fn()
  }
}

function createNavigationRepository() {
  return {
    findRoleNavigation: jest.fn().mockResolvedValue({ roleId: 'template-1', visibility: [], landingPolicies: [] }),
    replaceRoleVisibility: jest.fn().mockResolvedValue({ roleId: 'role-1', visibility: [], landingPolicies: [] }),
    replaceRoleLandingPolicies: jest.fn().mockResolvedValue({ roleId: 'role-1', visibility: [], landingPolicies: [] })
  }
}

describe('EnsureTenantRoleInstanceFromTemplateHandler', () => {
  it('returns an existing tenant role instance without creating a duplicate', async () => {
    const existing = new Role('tenant-admin-role-1', 'Tenant Admin', 'tenant.admin', 'tenant-1', RoleKind.TENANT_INSTANCE, true)
    const roleRepository = createRoleRepository()
    const navigationRepository = createNavigationRepository()
    roleRepository.findByScopeKindAndCode.mockResolvedValueOnce(existing)

    const handler = new EnsureTenantRoleInstanceFromTemplateHandler(roleRepository as any, navigationRepository as any)

    await expect(
      handler.execute(
        new EnsureTenantRoleInstanceFromTemplateCommand({
          tenantId: 'tenant-1',
          templateRoleCode: 'tenant.admin',
          idempotencyKey: 'tenant-onboarding-1:ensure-admin-role',
          operatorScope: buildTenantBoundQueryScope(
            { operatorId: 'operator-1', tenantId: 'tenant-1', isSystemScope: false },
            'tenant-1'
          )
        })
      )
    ).resolves.toMatchObject({
      role: existing,
      created: false
    })
    expect(roleRepository.save).not.toHaveBeenCalled()
  })

  it('creates a tenant role instance from the system template code when missing', async () => {
    const template = new Role('template-1', 'Tenant Admin', 'tenant.admin', null, RoleKind.SYSTEM_TEMPLATE, true)
    const saved = new Role('tenant-admin-role-1', 'Tenant Admin', 'tenant.admin', 'tenant-1', RoleKind.TENANT_INSTANCE, true)
    const roleRepository = createRoleRepository()
    const navigationRepository = createNavigationRepository()
    roleRepository.findByScopeKindAndCode.mockResolvedValueOnce(null).mockResolvedValueOnce(template)
    roleRepository.save.mockResolvedValue(saved)

    const handler = new EnsureTenantRoleInstanceFromTemplateHandler(roleRepository as any, navigationRepository as any)

    await expect(
      handler.execute(
        new EnsureTenantRoleInstanceFromTemplateCommand({
          tenantId: 'tenant-1',
          templateRoleCode: 'tenant.admin',
          idempotencyKey: 'tenant-onboarding-1:ensure-admin-role',
          operatorScope: buildTenantBoundQueryScope(
            { operatorId: 'operator-1', tenantId: 'tenant-1', isSystemScope: false },
            'tenant-1'
          )
        })
      )
    ).resolves.toMatchObject({
      role: saved,
      created: true
    })
    expect(roleRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'tenant.admin',
        tenantId: 'tenant-1',
        kind: RoleKind.TENANT_INSTANCE,
        templateRoleId: 'template-1'
      })
    )
  })
})
