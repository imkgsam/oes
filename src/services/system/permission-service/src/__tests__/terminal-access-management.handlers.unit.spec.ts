import { SetRoleTerminalAccessHandler } from '../application/commands/terminal-access/set-role-terminal-access.handler'
import { SetRoleTerminalAccessCommand } from '../application/commands/terminal-access/set-role-terminal-access.command'
import { ReplaceAccountTerminalAccessOverrideHandler } from '../application/commands/terminal-access/replace-account-terminal-access-override.handler'
import { ReplaceAccountTerminalAccessOverrideCommand } from '../application/commands/terminal-access/replace-account-terminal-access-override.command'
import { DeleteAccountTerminalAccessOverrideHandler } from '../application/commands/terminal-access/delete-account-terminal-access-override.handler'
import { DeleteAccountTerminalAccessOverrideCommand } from '../application/commands/terminal-access/delete-account-terminal-access-override.command'
import { GetRoleTerminalAccessHandler } from '../application/queries/terminal-access/get-role-terminal-access.handler'
import { GetRoleTerminalAccessQuery } from '../application/queries/terminal-access/get-role-terminal-access.query'
import { GetAccountTerminalAccessHandler } from '../application/queries/terminal-access/get-account-terminal-access.handler'
import { GetAccountTerminalAccessQuery } from '../application/queries/terminal-access/get-account-terminal-access.query'
import { Role } from '../domain/aggregates/role.aggregate'
import { RoleKind } from '../domain/enums/role-kind.enum'
import { ScopeLevel } from '../domain/enums/scope-level.enum'
import { RoleRepository } from '../domain/repositories/role.repository'
import { TerminalAccessRepository } from '../domain/repositories/terminal-access.repository'

describe('terminal access management handlers', () => {
  const tenantRole = new Role(
    'role-1',
    'tenant.role',
    'Tenant Role',
    'tenant-1',
    RoleKind.TENANT_INSTANCE,
    true
  )

  const createRoleRepository = (): jest.Mocked<Pick<RoleRepository, 'findById' | 'findAccountRoles'>> => ({
    findById: jest.fn(),
    findAccountRoles: jest.fn()
  })

  const createTerminalAccessRepository = (): jest.Mocked<TerminalAccessRepository> => ({
    findRoleTerminalAccess: jest.fn(),
    findAccountOverride: jest.fn(),
    replaceRoleTerminalAccess: jest.fn(),
    replaceAccountOverride: jest.fn(),
    deleteAccountOverride: jest.fn()
  })

  it('sets role terminal access after checking the role scope', async () => {
    const roleRepo = createRoleRepository()
    const terminalRepo = createTerminalAccessRepository()
    roleRepo.findById.mockResolvedValue(tenantRole)

    await new SetRoleTerminalAccessHandler(roleRepo as any, terminalRepo as any).execute(
      new SetRoleTerminalAccessCommand({
        roleId: 'role-1',
        allowedTerminals: ['PDA', 'WEB', 'PDA'],
        operatorScope: { operatorId: 'operator-1', tenantId: 'tenant-1', isSystemScope: false }
      })
    )

    expect(terminalRepo.replaceRoleTerminalAccess).toHaveBeenCalledWith('role-1', ['PDA', 'WEB', 'PDA'])
  })

  it('returns an empty role terminal access set when the role has no config', async () => {
    const terminalRepo = createTerminalAccessRepository()
    terminalRepo.findRoleTerminalAccess.mockResolvedValue([])

    await expect(new GetRoleTerminalAccessHandler(terminalRepo as any).execute(
      new GetRoleTerminalAccessQuery('role-1')
    )).resolves.toEqual({ roleId: 'role-1', allowedTerminals: [] })
  })

  it('replaces and deletes account overrides inside the requested scope', async () => {
    const terminalRepo = createTerminalAccessRepository()

    await new ReplaceAccountTerminalAccessOverrideHandler(terminalRepo as any).execute(
      new ReplaceAccountTerminalAccessOverrideCommand({
        accountId: 'account-1',
        tenantId: 'tenant-1',
        scopeLevel: ScopeLevel.TENANT,
        allowedTerminals: []
      })
    )
    await new DeleteAccountTerminalAccessOverrideHandler(terminalRepo as any).execute(
      new DeleteAccountTerminalAccessOverrideCommand({
        accountId: 'account-1',
        tenantId: 'tenant-1',
        scopeLevel: ScopeLevel.TENANT
      })
    )

    expect(terminalRepo.replaceAccountOverride).toHaveBeenCalledWith(
      'account-1',
      'tenant-1',
      ScopeLevel.TENANT,
      []
    )
    expect(terminalRepo.deleteAccountOverride).toHaveBeenCalledWith(
      'account-1',
      'tenant-1',
      ScopeLevel.TENANT
    )
  })

  it('returns final account terminal access without exposing role and override internals separately', async () => {
    const roleRepo = createRoleRepository()
    const terminalRepo = createTerminalAccessRepository()
    roleRepo.findAccountRoles.mockResolvedValue([tenantRole])
    terminalRepo.findAccountOverride.mockResolvedValue(null)
    terminalRepo.findRoleTerminalAccess.mockResolvedValue([
      { roleId: 'role-1', allowedTerminals: ['WEB', 'PDA'] }
    ])

    const result = await new GetAccountTerminalAccessHandler(roleRepo as any, terminalRepo as any).execute(
      new GetAccountTerminalAccessQuery('account-1', 'tenant-1', ScopeLevel.TENANT)
    )

    expect(result).toEqual({
      accountId: 'account-1',
      tenantId: 'tenant-1',
      scopeLevel: ScopeLevel.TENANT,
      hasOverride: false,
      effectiveAllowedTerminals: ['PDA', 'WEB']
    })
  })
})
