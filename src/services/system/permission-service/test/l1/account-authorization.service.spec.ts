import { Permission } from '../../src/domain/aggregates/permission.aggregate'
import { Policy } from '../../src/domain/aggregates/policy.aggregate'
import { Role } from '../../src/domain/aggregates/role.aggregate'
import { PermissionModule } from '../../src/domain/enums/permission-module.enum'
import { PolicyEffect } from '../../src/domain/enums/policy-effect.enum'
import { PolicySubjectType } from '../../src/domain/enums/policy-subject-type.enum'
import { RoleKind } from '../../src/domain/enums/role-kind.enum'
import { PermissionRepository } from '../../src/domain/repositories/permission.repository'
import { PolicyRepository } from '../../src/domain/repositories/policy.repository'
import { RoleRepository } from '../../src/domain/repositories/role.repository'
import { AccountAuthorizationService } from '../../src/domain/services/account-authorization.service'
import { PolicyEngine } from '../../src/domain/services/policy-engine'
import { RolePermission } from '../../src/domain/vo/role-permission.value-object'

describe('AccountAuthorizationService', () => {
  const createPermissionRepository = (): jest.Mocked<PermissionRepository> => ({
    findById: jest.fn(),
    findByCode: jest.fn(),
    findAll: jest.fn(),
    findByModule: jest.fn(),
    findPaged: jest.fn(),
    findByCodes: jest.fn(),
    hasAssignedRoles: jest.fn(),
    hasAttachedPolicies: jest.fn(),
    createMany: jest.fn(),
    save: jest.fn(),
    delete: jest.fn()
  })

  const createPolicyRepository = (): jest.Mocked<PolicyRepository> => ({
    findById: jest.fn(),
    findByPermissionCode: jest.fn(),
    findApplicable: jest.fn(),
    findByTenant: jest.fn(),
    findAll: jest.fn(),
    findPaged: jest.fn(),
    save: jest.fn(),
    delete: jest.fn()
  })

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

  const createRoleWithPermission = (permissionCode: string, permissionId = 'permission-id') =>
    new Role(
      'role-id',
      'Admin',
      'ADMIN',
      null,
      RoleKind.SYSTEM_TEMPLATE,
      true,
      undefined,
      null,
      [new RolePermission('role-id', permissionId, permissionCode)]
    )

  it('权限判断 / 当权限不存在时 / 应返回 false', async () => {
    const roleRepo = createRoleRepository()
    const permissionRepo = createPermissionRepository()
    const policyRepo = createPolicyRepository()
    const service = new AccountAuthorizationService(roleRepo, permissionRepo, policyRepo, new PolicyEngine())

    permissionRepo.findByCode.mockResolvedValue(null)

    const result = await service.checkPermission('account-id', 'permission.read')

    expect(result).toBe(false)
    expect(roleRepo.findRolesForAccountId).not.toHaveBeenCalled()
  })

  it('权限判断 / 当角色拥有权限时 / 应返回 true', async () => {
    const roleRepo = createRoleRepository()
    const permissionRepo = createPermissionRepository()
    const policyRepo = createPolicyRepository()
    const service = new AccountAuthorizationService(roleRepo, permissionRepo, policyRepo, new PolicyEngine())

    permissionRepo.findByCode.mockResolvedValue(
      new Permission('permission-id', 'permission.read', PermissionModule.PERMISSION_SERVICE)
    )
    roleRepo.findRolesForAccountId.mockResolvedValue([createRoleWithPermission('permission.read')])

    const result = await service.checkPermission('account-id', 'permission.read')

    expect(result).toBe(true)
  })

  it('上下文权限判断 / 当 RBAC 不通过时 / 应直接返回拒绝', async () => {
    const roleRepo = createRoleRepository()
    const permissionRepo = createPermissionRepository()
    const policyRepo = createPolicyRepository()
    const service = new AccountAuthorizationService(roleRepo, permissionRepo, policyRepo, new PolicyEngine())

    permissionRepo.findByCode.mockResolvedValue(
      new Permission('permission-id', 'permission.read', PermissionModule.PERMISSION_SERVICE)
    )
    roleRepo.findRolesForAccountId.mockResolvedValue([])

    const result = await service.checkPermissionWithContext({
      accountId: 'account-id',
      permissionCode: 'permission.read',
      tenantId: 'tenant-1',
      subject: {},
      resource: {},
      environment: {},
      action: {}
    })

    expect(result).toEqual({
      allowed: false,
      reason: 'RBAC: role does not have this permission',
      evaluationMode: 'RBAC',
      explainCode: 'RBAC_DENIED',
      policyExplainEntries: []
    })
    expect(policyRepo.findApplicable).not.toHaveBeenCalled()
  })

  it('上下文权限判断 / 当 RBAC 通过且命中拒绝策略时 / 应返回拒绝', async () => {
    const roleRepo = createRoleRepository()
    const permissionRepo = createPermissionRepository()
    const policyRepo = createPolicyRepository()
    const service = new AccountAuthorizationService(roleRepo, permissionRepo, policyRepo, new PolicyEngine())

    permissionRepo.findByCode.mockResolvedValue(
      new Permission('permission-id', 'permission.read', PermissionModule.PERMISSION_SERVICE)
    )
    roleRepo.findRolesForAccountId.mockResolvedValue([createRoleWithPermission('permission.read')])
    policyRepo.findApplicable.mockResolvedValue([
      new Policy(
        'policy-id',
        'deny-admin',
        PolicyEffect.DENY,
        10,
        PolicySubjectType.ANY,
        null,
        'permission.read',
        null,
        null,
        true
      )
    ])

    const result = await service.checkPermissionWithContext({
      accountId: 'account-id',
      permissionCode: 'permission.read',
      tenantId: 'tenant-1',
      subject: {},
      resource: {},
      environment: {},
      action: {}
    })

    expect(result.allowed).toBe(false)
    expect(result.evaluationMode).toBe('RBAC_ABAC')
    expect(result.explainCode).toBe('POLICY_DENY_MATCHED')
  })
})
