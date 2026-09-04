import { ResolveAccountNavigationHandler } from '../application/queries/access-summary/resolve-account-navigation.handler'
import { ResolveAccountNavigationQuery } from '../application/queries/access-summary/resolve-account-navigation.query'
import { NavigationEntry } from '../domain/aggregates/navigation-entry.aggregate'
import { Role } from '../domain/aggregates/role.aggregate'
import { RoleKind } from '../domain/enums/role-kind.enum'
import { ScopeLevel } from '../domain/enums/scope-level.enum'
import { NavigationRepository } from '../domain/repositories/navigation.repository'
import { RoleRepository } from '../domain/repositories/role.repository'
import { NavigationResolverService } from '../domain/services/navigation-resolver.service'
import { RoleLandingPolicy } from '../domain/vo/role-landing-policy.value-object'

describe('ResolveAccountNavigationHandler', () => {
  const createRoleRepository = (): jest.Mocked<Pick<RoleRepository, 'findAccountRoles'>> => ({
    findAccountRoles: jest.fn()
  })

  const createNavigationRepository = (): jest.Mocked<
    Pick<NavigationRepository, 'findVisibleEntriesForRoles' | 'findLandingPoliciesForRoles'>
  > => ({
    findVisibleEntriesForRoles: jest.fn(),
    findLandingPoliciesForRoles: jest.fn()
  })

  const role = (id: string) =>
    new Role(id, id, id, 'tenant-1', RoleKind.TENANT_INSTANCE, true)

  const entry = (entryKey: string, priority: number) =>
    new NavigationEntry(entryKey, entryKey, null, null, ['WEB'], priority, true, 'page')

  it('resolves runtime navigation from effective account roles', async () => {
    const roleRepo = createRoleRepository()
    const navigationRepo = createNavigationRepository()
    const handler = new ResolveAccountNavigationHandler(
      roleRepo as any,
      navigationRepo as any,
      new NavigationResolverService()
    )

    roleRepo.findAccountRoles.mockResolvedValue([role('role-1'), role('role-2')])
    navigationRepo.findVisibleEntriesForRoles.mockResolvedValue([
      entry('workbench.home', 100),
      entry('mes.work-order-board', 200)
    ])
    navigationRepo.findLandingPoliciesForRoles.mockResolvedValue([
      new RoleLandingPolicy('role-2', 'WEB', 'mes.work-order-board', 900, true)
    ])

    const result = await handler.execute(
      new ResolveAccountNavigationQuery('account-1', 'tenant-1', ScopeLevel.TENANT, 'WEB')
    )

    expect(roleRepo.findAccountRoles).toHaveBeenCalledWith('account-1', 'tenant-1', ScopeLevel.TENANT)
    expect(navigationRepo.findVisibleEntriesForRoles).toHaveBeenCalledWith({
      roleIds: ['role-1', 'role-2'],
      terminal: 'WEB'
    })
    expect(navigationRepo.findLandingPoliciesForRoles).toHaveBeenCalledWith({
      roleIds: ['role-1', 'role-2'],
      terminal: 'WEB'
    })
    expect(result.defaultEntry).toBe('mes.work-order-board')
    expect(result.visibleEntries).toEqual(['workbench.home', 'mes.work-order-board'])
  })

  it('fails closed when the account has no visible navigation entries', async () => {
    const roleRepo = createRoleRepository()
    const navigationRepo = createNavigationRepository()
    const handler = new ResolveAccountNavigationHandler(
      roleRepo as any,
      navigationRepo as any,
      new NavigationResolverService()
    )

    roleRepo.findAccountRoles.mockResolvedValue([])
    navigationRepo.findVisibleEntriesForRoles.mockResolvedValue([])
    navigationRepo.findLandingPoliciesForRoles.mockResolvedValue([])

    const result = await handler.execute(
      new ResolveAccountNavigationQuery('account-1', undefined, ScopeLevel.SYSTEM, 'WEB')
    )

    expect(result.defaultEntry).toBe('')
    expect(result.visibleEntries).toEqual([])
    expect(result.fallbackReason).toBe('NO_VISIBLE_ENTRIES')
  })
})
