import { Reflector } from '@nestjs/core'
import { REQUIRE_PERMISSIONS_METADATA_KEY } from '@oes/common/authorization'
import { AccountRoleController } from './account-role.controller'

// Verifies the account-role gateway controller exposes the expected routes and coarse-grained guards.
describe('AccountRoleController', () => {
  const permissionService = {
    listAccountRoles: jest.fn(),
    getAccountRoleSelection: jest.fn(),
    assignAccountRole: jest.fn(),
    revokeAccountRole: jest.fn(),
    setAccountRoles: jest.fn(),
    listRoleAccounts: jest.fn(),
    getAccountTerminalAccess: jest.fn(),
    replaceAccountTerminalAccessOverride: jest.fn(),
    deleteAccountTerminalAccessOverride: jest.fn()
  }

  const controller = new AccountRoleController(permissionService as any)

  it('declares the expected coarse-grained permissions on account-role endpoints', () => {
    const reflector = new Reflector()

    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        AccountRoleController.prototype.listAccountRoles
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        AccountRoleController.prototype.getAccountRoleSelection
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        AccountRoleController.prototype.getAccountTerminalAccess
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        AccountRoleController.prototype.replaceAccountTerminalAccessOverride
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        AccountRoleController.prototype.deleteAccountTerminalAccessOverride
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        AccountRoleController.prototype.assignAccountRole
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        AccountRoleController.prototype.revokeAccountRole
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        AccountRoleController.prototype.setAccountRoles
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        AccountRoleController.prototype.listRoleAccounts
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
  })

  it('forwards account-role read routes to the proxy service', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1' }
    permissionService.listAccountRoles.mockResolvedValue({ roles: [{ id: 'role-1' }] })
    permissionService.getAccountRoleSelection.mockResolvedValue({
      availableRoles: [{ id: 'role-1' }],
      selectedRoleIds: ['role-1']
    })
    permissionService.listRoleAccounts.mockResolvedValue({
      accounts: [
        {
          accountId: 'account-1',
          roleId: 'role-1',
          accountType: 'USER',
          tenantId: 'tenant-1',
          scopeLevel: 'TENANT'
        }
      ]
    })

    await expect(
      controller.listAccountRoles(
        'account-1',
        { tenantId: 'tenant-1', scopeLevel: 'TENANT' } as any,
        source as any
      )
    ).resolves.toEqual({ roles: [{ id: 'role-1' }] })
    await expect(
      controller.getAccountRoleSelection(
        'account-1',
        { tenantId: 'tenant-1', scopeLevel: 'TENANT' } as any,
        source as any
      )
    ).resolves.toEqual({
      availableRoles: [{ id: 'role-1' }],
      selectedRoleIds: ['role-1']
    })
    await expect(controller.listRoleAccounts('role-1', source as any)).resolves.toEqual({
      accounts: [
        {
          accountId: 'account-1',
          roleId: 'role-1',
          accountType: 'USER',
          tenantId: 'tenant-1',
          scopeLevel: 'TENANT'
        }
      ]
    })

    expect(permissionService.listAccountRoles).toHaveBeenCalledWith(
      {
        accountId: 'account-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT'
      },
      source
    )
    expect(permissionService.getAccountRoleSelection).toHaveBeenCalledWith(
      {
        accountId: 'account-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT'
      },
      source
    )
    expect(permissionService.listRoleAccounts).toHaveBeenCalledWith({ roleId: 'role-1' }, source)
  })

  it('forwards account-role mutation routes to the proxy service', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1' }
    permissionService.assignAccountRole.mockResolvedValue(undefined)
    permissionService.revokeAccountRole.mockResolvedValue(undefined)
    permissionService.setAccountRoles.mockResolvedValue({ roles: [{ id: 'role-2' }] })

    await expect(
      controller.assignAccountRole(
        'account-1',
        {
          accountType: 'USER',
          roleId: 'role-1',
          tenantId: 'tenant-1',
          scopeLevel: 'TENANT',
          effectiveAt: '2026-04-13T08:00:00.000Z',
          expiresAt: '2026-04-14T08:00:00.000Z'
        } as any,
        source as any
      )
    ).resolves.toBeUndefined()
    await expect(
      controller.revokeAccountRole('account-1', 'role-1', source as any)
    ).resolves.toBeUndefined()
    await expect(
      controller.setAccountRoles(
        'account-1',
        {
          accountType: 'USER',
          tenantId: 'tenant-1',
          scopeLevel: 'TENANT',
          roleIds: ['role-2']
        } as any,
        source as any
      )
    ).resolves.toEqual({ roles: [{ id: 'role-2' }] })

    expect(permissionService.assignAccountRole).toHaveBeenCalledWith(
      {
        accountId: 'account-1',
        accountType: 'USER',
        roleId: 'role-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        effectiveAt: '2026-04-13T08:00:00.000Z',
        expiresAt: '2026-04-14T08:00:00.000Z'
      },
      source
    )
    expect(permissionService.revokeAccountRole).toHaveBeenCalledWith(
      {
        accountId: 'account-1',
        roleId: 'role-1'
      },
      source
    )
    expect(permissionService.setAccountRoles).toHaveBeenCalledWith(
      {
        accountId: 'account-1',
        accountType: 'USER',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        roleIds: ['role-2']
      },
      source
    )
  })

  it('forwards account terminal access routes to the proxy service', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1' }
    permissionService.getAccountTerminalAccess.mockResolvedValue({
      accountId: 'account-1',
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT',
      hasOverride: false,
      effectiveAllowedTerminals: ['WEB']
    })
    permissionService.replaceAccountTerminalAccessOverride.mockResolvedValue({
      accountId: 'account-1',
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT',
      hasOverride: true,
      effectiveAllowedTerminals: ['PDA']
    })
    permissionService.deleteAccountTerminalAccessOverride.mockResolvedValue({
      accountId: 'account-1',
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT',
      hasOverride: false,
      effectiveAllowedTerminals: ['WEB']
    })

    await expect(
      controller.getAccountTerminalAccess(
        'account-1',
        { tenantId: 'tenant-1', scopeLevel: 'TENANT' } as any,
        source as any
      )
    ).resolves.toEqual(expect.objectContaining({ effectiveAllowedTerminals: ['WEB'] }))
    await expect(
      controller.replaceAccountTerminalAccessOverride(
        'account-1',
        { tenantId: 'tenant-1', scopeLevel: 'TENANT', allowedTerminals: ['PDA'] } as any,
        source as any
      )
    ).resolves.toEqual(expect.objectContaining({ hasOverride: true }))
    await expect(
      controller.deleteAccountTerminalAccessOverride(
        'account-1',
        { tenantId: 'tenant-1', scopeLevel: 'TENANT' } as any,
        source as any
      )
    ).resolves.toEqual(expect.objectContaining({ hasOverride: false }))

    expect(permissionService.getAccountTerminalAccess).toHaveBeenCalledWith(
      {
        accountId: 'account-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT'
      },
      source
    )
    expect(permissionService.replaceAccountTerminalAccessOverride).toHaveBeenCalledWith(
      {
        accountId: 'account-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        allowedTerminals: ['PDA']
      },
      source
    )
    expect(permissionService.deleteAccountTerminalAccessOverride).toHaveBeenCalledWith(
      {
        accountId: 'account-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT'
      },
      source
    )
  })
})
