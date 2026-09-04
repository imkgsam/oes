import { CreateRoleInstanceFromTemplateCommand } from '../application/commands/role/create-role-instance-from-template.command'
import { CreateRoleInstanceFromTemplateHandler } from '../application/commands/role/create-role-instance-from-template.handler'
import { SyncRoleNavigationFromTemplateCommand } from '../application/commands/role/sync-role-navigation-from-template.command'
import { SyncRoleNavigationFromTemplateHandler } from '../application/commands/role/sync-role-navigation-from-template.handler'
import { Role } from '../domain/aggregates/role.aggregate'
import { RoleKind } from '../domain/enums/role-kind.enum'
import { NavigationRepository } from '../domain/repositories/navigation.repository'
import { RoleRepository } from '../domain/repositories/role.repository'
import { TerminalAccessRepository } from '../domain/repositories/terminal-access.repository'
import { RoleLandingPolicy } from '../domain/vo/role-landing-policy.value-object'
import { RoleNavigationVisibility } from '../domain/vo/role-navigation-visibility.value-object'
import { RolePermission } from '../domain/vo/role-permission.value-object'

describe('CreateRoleInstanceFromTemplateHandler', () => {
  /** Builds a mocked role repository for role instance creation handler tests. */
  const createRoleRepository = (): jest.Mocked<RoleRepository> => ({
    findById: jest.fn(),
    findByCode: jest.fn(),
    findByScopeAndCode: jest.fn(),
    findByScopeKindAndCode: jest.fn(),
    findAll: jest.fn(),
    findRoleInstances: jest.fn(),
    findRoleTemplates: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    hasAssignedAccounts: jest.fn(),
    hasAssignedPermissions: jest.fn(),
    hasTemplateInstances: jest.fn(),
    findOwnPermissions: jest.fn(),
    findRolesByPermissionId: jest.fn(),
    findRolesForAccountId: jest.fn(),
    assignAccountRole: jest.fn(),
    revokeAccountRole: jest.fn(),
    findAccountRoles: jest.fn(),
    findRoleAccounts: jest.fn(),
    findTenantRoles: jest.fn(),
    findSystemRoles: jest.fn(),
    findRoleTemplateById: jest.fn(),
    replaceAccountRoles: jest.fn()
  })

  /** Builds a mocked navigation repository for template navigation inheritance tests. */
  const createNavigationRepository = (): jest.Mocked<
    Pick<
      NavigationRepository,
      'findRoleNavigation' | 'replaceRoleVisibility' | 'replaceRoleLandingPolicies'
    >
  > => ({
    findRoleNavigation: jest.fn(),
    replaceRoleVisibility: jest.fn(),
    replaceRoleLandingPolicies: jest.fn()
  })

  /** Builds a mocked terminal access repository for template terminal access inheritance tests. */
  const createTerminalAccessRepository = (): jest.Mocked<
    Pick<TerminalAccessRepository, 'findRoleTerminalAccess' | 'replaceRoleTerminalAccess'>
  > => ({
    findRoleTerminalAccess: jest.fn(),
    replaceRoleTerminalAccess: jest.fn()
  })

  it('通过模板创建角色实例时应继承模板 code，忽略请求体中的 code 覆盖', async () => {
    const roleRepo = createRoleRepository()
    const navigationRepo = createNavigationRepository()
    const terminalAccessRepo = createTerminalAccessRepository()
    const handler = new CreateRoleInstanceFromTemplateHandler(roleRepo, navigationRepo as any, terminalAccessRepo as any)
    const templateRole = new Role(
      'template-role-id',
      'Tenant Admin Template',
      'tenant.admin',
      null,
      RoleKind.SYSTEM_TEMPLATE,
      true,
      'Tenant administrator baseline',
      null,
      [new RolePermission('template-role-id', 'permission-id', 'permission.read')],
      false,
      true
    )

    roleRepo.findRoleTemplateById.mockResolvedValue(templateRole)
    roleRepo.findByScopeKindAndCode.mockResolvedValue(null)
    roleRepo.save.mockImplementation(async (role) => role)
    navigationRepo.findRoleNavigation.mockResolvedValue({
      roleId: 'template-role-id',
      visibility: [],
      landingPolicies: []
    })
    terminalAccessRepo.findRoleTerminalAccess.mockResolvedValue([])

    const created = await handler.execute(
      new CreateRoleInstanceFromTemplateCommand({
        templateRoleId: 'template-role-id',
        tenantId: 'tenant-1',
        name: 'Tenant Admin',
        code: 'tenant.admin.custom',
        operatorScope: {
          operatorId: 'system-admin',
          isSystemScope: true
        }
      } as any)
    )

    expect(roleRepo.findByScopeKindAndCode).toHaveBeenCalledWith(
      'tenant-1',
      RoleKind.TENANT_INSTANCE,
      'tenant.admin'
    )
    expect(created.code).toBe('tenant.admin')
    expect(created.templateRoleId).toBe('template-role-id')
    expect(created.allowTenantPermissionOverride).toBe(false)
    expect(created.isProtected).toBe(true)
    expect(created.permissions.map((permission) => permission.permissionCode)).toEqual(['permission.read'])
  })

  it('通过模板创建角色实例时应复制模板导航配置为实例自己的快照', async () => {
    const roleRepo = createRoleRepository()
    const navigationRepo = createNavigationRepository()
    const terminalAccessRepo = createTerminalAccessRepository()
    const handler = new CreateRoleInstanceFromTemplateHandler(roleRepo, navigationRepo as any, terminalAccessRepo as any)
    const templateRole = new Role(
      'template-role-id',
      'Tenant Admin Template',
      'tenant.admin',
      null,
      RoleKind.SYSTEM_TEMPLATE,
      true
    )

    roleRepo.findRoleTemplateById.mockResolvedValue(templateRole)
    roleRepo.findByScopeKindAndCode.mockResolvedValue(null)
    roleRepo.save.mockImplementation(async (role) => role)
    navigationRepo.findRoleNavigation.mockResolvedValue({
      roleId: 'template-role-id',
      visibility: [
        new RoleNavigationVisibility('template-role-id', 'workbench.home', 'DEFAULT', true),
        new RoleNavigationVisibility('template-role-id', 'mobile.todo', 'MOBILE', true)
      ],
      landingPolicies: [
        new RoleLandingPolicy('template-role-id', 'DEFAULT', 'workbench.home', 100, true),
        new RoleLandingPolicy('template-role-id', 'MOBILE', 'mobile.todo', 100, true)
      ]
    })
    navigationRepo.replaceRoleVisibility.mockResolvedValue({
      roleId: 'created-role-id',
      visibility: [],
      landingPolicies: []
    })
    navigationRepo.replaceRoleLandingPolicies.mockResolvedValue({
      roleId: 'created-role-id',
      visibility: [],
      landingPolicies: []
    })
    terminalAccessRepo.findRoleTerminalAccess.mockResolvedValue([])

    const created = await handler.execute(
      new CreateRoleInstanceFromTemplateCommand({
        templateRoleId: 'template-role-id',
        tenantId: 'tenant-1',
        operatorScope: {
          operatorId: 'system-admin',
          isSystemScope: true
        }
      })
    )

    expect(navigationRepo.findRoleNavigation).toHaveBeenCalledWith('template-role-id')
    expect(navigationRepo.replaceRoleVisibility).toHaveBeenCalledWith(created.id, [
      new RoleNavigationVisibility(created.id, 'workbench.home', 'DEFAULT', true),
      new RoleNavigationVisibility(created.id, 'mobile.todo', 'MOBILE', true)
    ])
    expect(navigationRepo.replaceRoleLandingPolicies).toHaveBeenCalledWith(created.id, [
      new RoleLandingPolicy(created.id, 'DEFAULT', 'workbench.home', 100, true),
      new RoleLandingPolicy(created.id, 'MOBILE', 'mobile.todo', 100, true)
    ])
  })

  it('通过模板创建角色实例时应复制模板终端准入配置为实例自己的快照', async () => {
    const roleRepo = createRoleRepository()
    const navigationRepo = createNavigationRepository()
    const terminalAccessRepo = createTerminalAccessRepository()
    const handler = new CreateRoleInstanceFromTemplateHandler(roleRepo, navigationRepo as any, terminalAccessRepo as any)
    const templateRole = new Role(
      'template-role-id',
      'Tenant Admin Template',
      'tenant.admin',
      null,
      RoleKind.SYSTEM_TEMPLATE,
      true
    )

    roleRepo.findRoleTemplateById.mockResolvedValue(templateRole)
    roleRepo.findByScopeKindAndCode.mockResolvedValue(null)
    roleRepo.save.mockImplementation(async (role) => role)
    navigationRepo.findRoleNavigation.mockResolvedValue({
      roleId: 'template-role-id',
      visibility: [],
      landingPolicies: []
    })
    terminalAccessRepo.findRoleTerminalAccess.mockResolvedValue([
      { roleId: 'template-role-id', allowedTerminals: ['WEB', 'PDA'] }
    ])

    const created = await handler.execute(
      new CreateRoleInstanceFromTemplateCommand({
        templateRoleId: 'template-role-id',
        tenantId: 'tenant-1',
        operatorScope: {
          operatorId: 'system-admin',
          isSystemScope: true
        }
      } as any)
    )

    expect(terminalAccessRepo.findRoleTerminalAccess).toHaveBeenCalledWith(['template-role-id'])
    expect(terminalAccessRepo.replaceRoleTerminalAccess).toHaveBeenCalledWith(created.id, ['WEB', 'PDA'])
  })

  it('角色实例应支持一键同步模板导航快照', async () => {
    const roleRepo = createRoleRepository()
    const navigationRepo = createNavigationRepository()
    const handler = new SyncRoleNavigationFromTemplateHandler(roleRepo, navigationRepo as any)
    const role = new Role(
      'role-instance-id',
      'Tenant Admin',
      'tenant.admin',
      'tenant-1',
      RoleKind.TENANT_INSTANCE,
      true,
      undefined,
      'template-role-id'
    )
    const templateRole = new Role(
      'template-role-id',
      'Tenant Admin Template',
      'tenant.admin',
      null,
      RoleKind.SYSTEM_TEMPLATE,
      true
    )

    roleRepo.findById.mockResolvedValue(role)
    roleRepo.findRoleTemplateById.mockResolvedValue(templateRole)
    navigationRepo.findRoleNavigation.mockResolvedValue({
      roleId: 'template-role-id',
      visibility: [
        new RoleNavigationVisibility('template-role-id', 'workbench.home', 'DEFAULT', true)
      ],
      landingPolicies: [
        new RoleLandingPolicy('template-role-id', 'DEFAULT', 'workbench.home', 100, true)
      ]
    })
    navigationRepo.replaceRoleVisibility.mockResolvedValue({
      roleId: role.id,
      visibility: [],
      landingPolicies: []
    })
    navigationRepo.replaceRoleLandingPolicies.mockResolvedValue({
      roleId: role.id,
      visibility: [
        new RoleNavigationVisibility(role.id, 'workbench.home', 'DEFAULT', true)
      ],
      landingPolicies: [
        new RoleLandingPolicy(role.id, 'DEFAULT', 'workbench.home', 100, true)
      ]
    })

    const result = await handler.execute(
      new SyncRoleNavigationFromTemplateCommand({
        roleId: role.id,
        operatorScope: {
          operatorId: 'system-admin',
          isSystemScope: true
        }
      })
    )

    expect(roleRepo.findRoleTemplateById).toHaveBeenCalledWith('template-role-id')
    expect(navigationRepo.replaceRoleVisibility).toHaveBeenCalledWith(role.id, [
      new RoleNavigationVisibility(role.id, 'workbench.home', 'DEFAULT', true)
    ])
    expect(result.roleId).toBe(role.id)
  })
})
