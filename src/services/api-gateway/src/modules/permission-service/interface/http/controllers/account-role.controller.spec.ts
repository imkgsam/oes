import { Reflector } from '@nestjs/core'
import { PERMISSION_CHECK_KEY } from '@oes/common/authorization'
import { AccountRoleController } from './account-role.controller'

// Verifies the account-role gateway controller exposes the expected routes and coarse-grained guards.
describe('AccountRoleController', () => {
  const permissionService = {
    listAccountRoles: jest.fn(),
    getAccountRoleSelection: jest.fn(),
    assignAccountRole: jest.fn(),
    revokeAccountRole: jest.fn(),
    setAccountRoles: jest.fn(),
    listRoleAccounts: jest.fn()
  }

  const controller = new AccountRoleController(permissionService as any)

  it('declares the expected coarse-grained permissions on account-role endpoints', () => {
    const reflector = new Reflector()

    expect(reflector.get(PERMISSION_CHECK_KEY, AccountRoleController.prototype.listAccountRoles)).toEqual({
      type: 'ALL',
      permissions: ['permission.account.get_roles']
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, AccountRoleController.prototype.getAccountRoleSelection)
    ).toEqual({
      type: 'ALL',
      permissions: ['permission.account.get_roles']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, AccountRoleController.prototype.assignAccountRole)).toEqual({
      type: 'ALL',
      permissions: ['permission.account.assign_roles']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, AccountRoleController.prototype.revokeAccountRole)).toEqual({
      type: 'ALL',
      permissions: ['permission.account.assign_roles']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, AccountRoleController.prototype.setAccountRoles)).toEqual({
      type: 'ALL',
      permissions: ['permission.account.assign_roles']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, AccountRoleController.prototype.listRoleAccounts)).toEqual({
      type: 'ALL',
      permissions: ['permission.account.get_roles']
    })
  })

  it('forwards account-role read routes to the proxy service', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1' }
    permissionService.listAccountRoles.mockResolvedValue({ roles: [{ id: 'role-1' }] })
    permissionService.getAccountRoleSelection.mockResolvedValue({
      availableRoles: [{ id: 'role-1' }],
      selectedRoleIds: ['role-1']
    })
    permissionService.listRoleAccounts.mockResolvedValue({
      accounts: [{ accountId: 'account-1', roleId: 'role-1', accountType: 'USER', tenantId: 'tenant-1', scopeLevel: 'TENANT' }]
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
    await expect(controller.revokeAccountRole('account-1', 'role-1', source as any)).resolves.toBeUndefined()
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
})
