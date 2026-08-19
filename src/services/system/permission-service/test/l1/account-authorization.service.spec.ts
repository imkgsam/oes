import * as authorization from '@oes/common/authorization'
import {
  getPermissionCodeDefinition,
  permissionDefinitionFingerprint
} from '@oes/common/authorization'
import { Permission } from '../../src/domain/aggregates/permission.aggregate'
import { Role } from '../../src/domain/aggregates/role.aggregate'
import { PermissionKind } from '../../src/domain/enums/permission-kind.enum'
import { PermissionModule } from '../../src/domain/enums/permission-module.enum'
import { RoleKind } from '../../src/domain/enums/role-kind.enum'
import { ScopeLevel } from '../../src/domain/enums/scope-level.enum'
import { PermissionRepository } from '../../src/domain/repositories/permission.repository'
import { RoleRepository } from '../../src/domain/repositories/role.repository'
import {
  AccountAuthorizationService,
  PermissionCatalogMetadataError
} from '../../src/domain/services/account-authorization.service'
import { RolePermission } from '../../src/domain/vo/role-permission.value-object'

jest.mock('@oes/common/authorization', () => {
  const actual = jest.requireActual('@oes/common/authorization')
  return { ...actual, getPermissionCodeDefinition: jest.fn(actual.getPermissionCodeDefinition) }
})

/** Verifies CheckPermission binds grants to scope and fails stale runtime metadata closed. */
describe('AccountAuthorizationService', () => {
  const actualAuthorization = jest.requireActual<typeof authorization>('@oes/common/authorization')
  const mockedGetDefinition = authorization.getPermissionCodeDefinition as jest.MockedFunction<
    typeof authorization.getPermissionCodeDefinition
  >

  afterEach(() => {
    mockedGetDefinition.mockReset()
    mockedGetDefinition.mockImplementation(actualAuthorization.getPermissionCodeDefinition)
  })

  const repos = () => {
    const permissionRepo = { findByCode: jest.fn() } as unknown as jest.Mocked<PermissionRepository>
    const roleRepo = { findAccountRoles: jest.fn() } as unknown as jest.Mocked<RoleRepository>
    return {
      permissionRepo,
      roleRepo,
      service: new AccountAuthorizationService(roleRepo, permissionRepo)
    }
  }

  const currentPermission = (code: string) => {
    const definition = getPermissionCodeDefinition(code)!
    return new Permission(
      'permission-id',
      code,
      PermissionModule.PERMISSION_SERVICE,
      definition.description,
      definition.kind as PermissionKind,
      Boolean(definition.externalApiEligible),
      [...definition.allowedScopeLevels] as ScopeLevel[],
      permissionDefinitionFingerprint(definition)
    )
  }

  const roleWith = (code: string) =>
    new Role(
      'role-id',
      'Admin',
      'ADMIN',
      'tenant-1',
      RoleKind.TENANT_INSTANCE,
      true,
      undefined,
      null,
      [new RolePermission('role-id', 'permission-id', code)]
    )

  it('returns false for an unknown Common code without querying runtime grants', async () => {
    const { service, permissionRepo, roleRepo } = repos()
    await expect(service.checkPermission('account-id', 'unknown.code', 'tenant-1')).resolves.toBe(
      false
    )
    expect(permissionRepo.findByCode).not.toHaveBeenCalled()
    expect(roleRepo.findAccountRoles).not.toHaveBeenCalled()
  })

  it('throws for a known code with missing or stale persisted metadata', async () => {
    const { service, permissionRepo } = repos()
    permissionRepo.findByCode
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(
        new Permission('permission-id', 'site.management.read', PermissionModule.SITE_SERVICE)
      )
    await expect(
      service.checkPermission('account-id', 'site.management.read', 'tenant-1')
    ).rejects.toBeInstanceOf(PermissionCatalogMetadataError)
    await expect(
      service.checkPermission('account-id', 'site.management.read', 'tenant-1')
    ).rejects.toBeInstanceOf(PermissionCatalogMetadataError)
  })

  it('denies an excluded current scope before reading grants', async () => {
    const { service, permissionRepo, roleRepo } = repos()
    permissionRepo.findByCode.mockResolvedValue(currentPermission('site.management.read'))
    await expect(service.checkPermission('account-id', 'site.management.read')).resolves.toBe(false)
    expect(roleRepo.findAccountRoles).not.toHaveBeenCalled()
  })

  it('denies a current INTERNAL Code even when bad data leaves a role relation', async () => {
    const { service, permissionRepo, roleRepo } = repos()
    permissionRepo.findByCode.mockResolvedValue(
      currentPermission('permission.internal.permission.check')
    )
    await expect(
      service.checkPermission('account-id', 'permission.internal.permission.check')
    ).resolves.toBe(false)
    expect(roleRepo.findAccountRoles).not.toHaveBeenCalled()
  })

  it('denies a current BUSINESS Code whose metadata excludes HUMAN assignment', async () => {
    const { service, permissionRepo, roleRepo } = repos()
    const code = 'machine.only.manage'
    const definition = {
      code,
      ownerService: 'permission-service',
      description: 'Machine-only fixture',
      kind: 'BUSINESS' as const,
      assignableTo: ['MACHINE'] as const,
      allowedScopeLevels: ['TENANT'] as const,
      externalApiEligible: false
    }
    mockedGetDefinition.mockImplementation((candidate) =>
      candidate === code ? definition : actualAuthorization.getPermissionCodeDefinition(candidate)
    )
    permissionRepo.findByCode.mockResolvedValue(
      new Permission(
        'permission-machine-only',
        code,
        PermissionModule.PERMISSION_SERVICE,
        definition.description,
        PermissionKind.BUSINESS,
        false,
        [ScopeLevel.TENANT],
        permissionDefinitionFingerprint(definition)
      )
    )

    await expect(service.checkPermission('account-id', code, 'tenant-1')).resolves.toBe(false)
    expect(roleRepo.findAccountRoles).not.toHaveBeenCalled()
  })

  it('resolves TENANT grants only within the exact trusted tenant binding', async () => {
    const { service, permissionRepo, roleRepo } = repos()
    permissionRepo.findByCode.mockResolvedValue(currentPermission('site.management.read'))
    roleRepo.findAccountRoles.mockResolvedValue([roleWith('site.management.read')])
    await expect(
      service.checkPermission('account-id', 'site.management.read', 'tenant-1')
    ).resolves.toBe(true)
    expect(roleRepo.findAccountRoles).toHaveBeenCalledWith(
      'account-id',
      'tenant-1',
      ScopeLevel.TENANT
    )
  })

  it('resolves SYSTEM grants only through SYSTEM bindings for a dual-scope code', async () => {
    const { service, permissionRepo, roleRepo } = repos()
    permissionRepo.findByCode.mockResolvedValue(currentPermission('permission.list'))
    roleRepo.findAccountRoles.mockResolvedValue([roleWith('permission.list')])
    await expect(service.checkPermission('account-id', 'permission.list')).resolves.toBe(true)
    expect(roleRepo.findAccountRoles).toHaveBeenCalledWith('account-id', null, ScopeLevel.SYSTEM)
  })
})
