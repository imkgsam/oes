import { ResolveAccountTerminalAccessHandler } from '../../src/application/queries/terminal-access/resolve-account-terminal-access.handler'
import { ResolveAccountTerminalAccessQuery } from '../../src/application/queries/terminal-access/resolve-account-terminal-access.query'
import { Role } from '../../src/domain/aggregates/role.aggregate'
import { RoleKind } from '../../src/domain/enums/role-kind.enum'
import { ScopeLevel } from '../../src/domain/enums/scope-level.enum'
import { RoleRepository } from '../../src/domain/repositories/role.repository'
import { TerminalAccessRepository } from '../../src/domain/repositories/terminal-access.repository'
import { TerminalAccessResolverService } from '../../src/domain/services/terminal-access-resolver.service'

describe('ResolveAccountTerminalAccessHandler', () => {
  const createRoleRepository = (): jest.Mocked<Pick<RoleRepository, 'findAccountRoles'>> => ({
    findAccountRoles: jest.fn()
  })

  const createTerminalAccessRepository = (): jest.Mocked<
    Pick<TerminalAccessRepository, 'findAccountOverride' | 'findRoleTerminalAccess'>
  > => ({
    findAccountOverride: jest.fn(),
    findRoleTerminalAccess: jest.fn()
  })

  const role = (id: string) =>
    new Role(id, id, id, 'tenant-1', RoleKind.TENANT_INSTANCE, true)

  it('resolves terminal access from selected account active roles', async () => {
    const roleRepo = createRoleRepository()
    const terminalAccessRepo = createTerminalAccessRepository()
    const handler = new ResolveAccountTerminalAccessHandler(
      roleRepo as any,
      terminalAccessRepo as any,
      new TerminalAccessResolverService()
    )

    roleRepo.findAccountRoles.mockResolvedValue([role('worker-role'), role('lead-role')])
    terminalAccessRepo.findAccountOverride.mockResolvedValue(null)
    terminalAccessRepo.findRoleTerminalAccess.mockResolvedValue([
      { roleId: 'worker-role', allowedTerminals: ['PDA'] },
      { roleId: 'lead-role', allowedTerminals: ['WEB'] }
    ])

    const result = await handler.execute(
      new ResolveAccountTerminalAccessQuery('account-1', 'tenant-1', ScopeLevel.TENANT, 'WEB')
    )

    expect(roleRepo.findAccountRoles).toHaveBeenCalledWith('account-1', 'tenant-1', ScopeLevel.TENANT)
    expect(terminalAccessRepo.findAccountOverride).toHaveBeenCalledWith(
      'account-1',
      'tenant-1',
      ScopeLevel.TENANT
    )
    expect(terminalAccessRepo.findRoleTerminalAccess).toHaveBeenCalledWith(['worker-role', 'lead-role'])
    expect(result.allowed).toBe(true)
    expect(result.effectiveAllowedTerminals).toEqual(['PDA', 'WEB'])
    expect(result.resolutionSource).toBe('ROLE_UNION')
  })

  it('uses account override without loading role terminal access facts', async () => {
    const roleRepo = createRoleRepository()
    const terminalAccessRepo = createTerminalAccessRepository()
    const handler = new ResolveAccountTerminalAccessHandler(
      roleRepo as any,
      terminalAccessRepo as any,
      new TerminalAccessResolverService()
    )

    roleRepo.findAccountRoles.mockResolvedValue([role('worker-role')])
    terminalAccessRepo.findAccountOverride.mockResolvedValue({
      accountId: 'account-1',
      allowedTerminals: ['KIOSK']
    })

    const result = await handler.execute(
      new ResolveAccountTerminalAccessQuery('account-1', 'tenant-1', ScopeLevel.TENANT, 'PDA')
    )

    expect(terminalAccessRepo.findRoleTerminalAccess).not.toHaveBeenCalled()
    expect(result.allowed).toBe(false)
    expect(result.effectiveAllowedTerminals).toEqual(['KIOSK'])
    expect(result.resolutionSource).toBe('ACCOUNT_OVERRIDE')
  })

  it('rejects tenant-scope requests without tenantId', async () => {
    const handler = new ResolveAccountTerminalAccessHandler(
      createRoleRepository() as any,
      createTerminalAccessRepository() as any,
      new TerminalAccessResolverService()
    )

    await expect(
      handler.execute(new ResolveAccountTerminalAccessQuery('account-1', undefined, ScopeLevel.TENANT, 'WEB'))
    ).rejects.toThrow()
  })
})
