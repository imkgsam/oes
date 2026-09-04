import { ListNavigationEntriesHandler } from '../application/queries/navigation/list-navigation-entries.handler'
import { ListNavigationEntriesQuery } from '../application/queries/navigation/list-navigation-entries.query'
import { GetRoleNavigationHandler } from '../application/queries/navigation/get-role-navigation.handler'
import { GetRoleNavigationQuery } from '../application/queries/navigation/get-role-navigation.query'
import { ResolveNavigationPreviewHandler } from '../application/queries/navigation/resolve-navigation-preview.handler'
import { ResolveNavigationPreviewQuery } from '../application/queries/navigation/resolve-navigation-preview.query'
import { SetRoleNavigationVisibilityCommand } from '../application/commands/navigation/set-role-navigation-visibility.command'
import { SetRoleNavigationVisibilityHandler } from '../application/commands/navigation/set-role-navigation-visibility.handler'
import { SetRoleLandingPoliciesCommand } from '../application/commands/navigation/set-role-landing-policies.command'
import { SetRoleLandingPoliciesHandler } from '../application/commands/navigation/set-role-landing-policies.handler'
import { NAVIGATION_LANDING_ENTRY_NOT_VISIBLE } from '../common/constants/exception-enums'
import { NavigationEntry } from '../domain/aggregates/navigation-entry.aggregate'
import { NavigationRepository, RoleNavigationConfig } from '../domain/repositories/navigation.repository'
import { NavigationResolverService } from '../domain/services/navigation-resolver.service'
import { RoleLandingPolicy } from '../domain/vo/role-landing-policy.value-object'
import { RoleNavigationVisibility } from '../domain/vo/role-navigation-visibility.value-object'

describe('Navigation Management Handlers', () => {
  const createNavigationRepository = (): jest.Mocked<NavigationRepository> => ({
    findEntryByKey: jest.fn(),
    listEntries: jest.fn(),
    saveEntry: jest.fn(),
    findRoleNavigation: jest.fn(),
    replaceRoleVisibility: jest.fn(),
    replaceRoleLandingPolicies: jest.fn(),
    findVisibleEntriesForRoles: jest.fn(),
    findLandingPoliciesForRoles: jest.fn()
  })

  const entry = (
    entryKey: string,
    registryPriority: number,
    supportedTerminals = ['WEB']
  ) =>
    new NavigationEntry(
      entryKey,
      entryKey,
      null,
      entryKey.split('.')[0],
      supportedTerminals,
      registryPriority,
      true,
      'page'
    )

  const roleNavigation = (roleId: string): RoleNavigationConfig => ({
    roleId,
    visibility: [
      new RoleNavigationVisibility(roleId, 'workbench.home', 'WEB', true),
      new RoleNavigationVisibility(roleId, 'mes.work-order-board', 'WEB', false)
    ],
    landingPolicies: [
      new RoleLandingPolicy(roleId, 'WEB', 'workbench.home', 100, true)
    ]
  })

  it('lists navigation entries with keyword and terminal filters', async () => {
    const navigationRepo = createNavigationRepository()
    const handler = new ListNavigationEntriesHandler(navigationRepo)

    navigationRepo.listEntries.mockResolvedValue({
      entries: [entry('workbench.home', 100)],
      total: 1,
      page: 1,
      pageSize: 20
    })

    const result = await handler.execute(
      new ListNavigationEntriesQuery({
        page: 1,
        pageSize: 20,
        keyword: 'workbench',
        terminal: 'WEB',
        enabled: true
      })
    )

    expect(navigationRepo.listEntries).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      keyword: 'workbench',
      featureKey: undefined,
      terminal: 'WEB',
      enabled: true
    })
    expect(result.entries[0]?.entryKey).toBe('workbench.home')
  })

  it('returns role navigation visibility and landing policy config', async () => {
    const navigationRepo = createNavigationRepository()
    const handler = new GetRoleNavigationHandler(navigationRepo)

    navigationRepo.findRoleNavigation.mockResolvedValue(roleNavigation('role-1'))

    const result = await handler.execute(new GetRoleNavigationQuery('role-1'))

    expect(navigationRepo.findRoleNavigation).toHaveBeenCalledWith('role-1')
    expect(result.visibility).toHaveLength(2)
    expect(result.landingPolicies[0]?.defaultEntryKey).toBe('workbench.home')
  })

  it('replaces role navigation visibility as a full set', async () => {
    const navigationRepo = createNavigationRepository()
    const handler = new SetRoleNavigationVisibilityHandler(navigationRepo)

    navigationRepo.findEntryByKey.mockResolvedValue(entry('workbench.home', 100))
    navigationRepo.replaceRoleVisibility.mockResolvedValue(roleNavigation('role-1'))

    await handler.execute(
      new SetRoleNavigationVisibilityCommand({
        roleId: 'role-1',
        visibility: [
          {
            entryKey: 'workbench.home',
            terminal: 'WEB',
            enabled: true
          }
        ]
      })
    )

    expect(navigationRepo.replaceRoleVisibility).toHaveBeenCalledWith('role-1', [
      new RoleNavigationVisibility('role-1', 'workbench.home', 'WEB', true)
    ])
  })

  it('allows DEFAULT visibility rules for entries supported by at least one terminal', async () => {
    const navigationRepo = createNavigationRepository()
    const handler = new SetRoleNavigationVisibilityHandler(navigationRepo)

    navigationRepo.findEntryByKey.mockResolvedValue(entry('shared.notice', 100, ['WEB', 'MOBILE']))
    navigationRepo.replaceRoleVisibility.mockResolvedValue({
      roleId: 'role-1',
      visibility: [
        new RoleNavigationVisibility('role-1', 'shared.notice', 'DEFAULT', true)
      ],
      landingPolicies: []
    })

    await handler.execute(
      new SetRoleNavigationVisibilityCommand({
        roleId: 'role-1',
        visibility: [
          {
            entryKey: 'shared.notice',
            terminal: 'DEFAULT',
            enabled: true
          }
        ]
      })
    )

    expect(navigationRepo.replaceRoleVisibility).toHaveBeenCalledWith('role-1', [
      new RoleNavigationVisibility('role-1', 'shared.notice', 'DEFAULT', true)
    ])
  })

  it('sets landing policies only when default entries are visible', async () => {
    const navigationRepo = createNavigationRepository()
    const handler = new SetRoleLandingPoliciesHandler(navigationRepo)

    navigationRepo.findRoleNavigation.mockResolvedValue(roleNavigation('role-1'))

    await expect(
      handler.execute(
        new SetRoleLandingPoliciesCommand({
          roleId: 'role-1',
          landingPolicies: [
            {
              terminal: 'WEB',
              defaultEntryKey: 'mes.work-order-board',
              priority: 100,
              enabled: true
            }
          ]
        })
      )
    ).rejects.toMatchObject({
      definition: {
        code: NAVIGATION_LANDING_ENTRY_NOT_VISIBLE.code
      }
    })

    expect(navigationRepo.replaceRoleLandingPolicies).not.toHaveBeenCalled()
  })

  it('resolves preview default entry from multiple role landing policies', async () => {
    const navigationRepo = createNavigationRepository()
    const handler = new ResolveNavigationPreviewHandler(
      navigationRepo,
      new NavigationResolverService()
    )

    navigationRepo.findVisibleEntriesForRoles.mockResolvedValue([
      entry('workbench.home', 100),
      entry('mes.work-order-board', 200)
    ])
    navigationRepo.findLandingPoliciesForRoles.mockResolvedValue([
      new RoleLandingPolicy('role-2', 'WEB', 'mes.work-order-board', 900, true),
      new RoleLandingPolicy('role-1', 'WEB', 'workbench.home', 100, true)
    ])

    const result = await handler.execute(
      new ResolveNavigationPreviewQuery({
        roleIds: ['role-1', 'role-2'],
        scopeLevel: 'TENANT',
        terminal: 'WEB'
      })
    )

    expect(result.visibleEntries).toEqual(['workbench.home', 'mes.work-order-board'])
    expect(result.defaultEntry).toBe('mes.work-order-board')
    expect(result.resolvedByRoleId).toBe('role-2')
  })

  it('prefers a terminal landing override over the DEFAULT landing policy', async () => {
    const navigationRepo = createNavigationRepository()
    const handler = new ResolveNavigationPreviewHandler(
      navigationRepo,
      new NavigationResolverService()
    )

    navigationRepo.findVisibleEntriesForRoles.mockResolvedValue([
      entry('shared.notice', 100, ['WEB', 'MOBILE']),
      entry('mobile.todo', 90, ['MOBILE'])
    ])
    navigationRepo.findLandingPoliciesForRoles.mockResolvedValue([
      new RoleLandingPolicy('role-1', 'DEFAULT', 'shared.notice', 100, true),
      new RoleLandingPolicy('role-1', 'MOBILE', 'mobile.todo', 10, true)
    ])

    const result = await handler.execute(
      new ResolveNavigationPreviewQuery({
        roleIds: ['role-1'],
        scopeLevel: 'TENANT',
        terminal: 'MOBILE'
      })
    )

    expect(result.defaultEntry).toBe('mobile.todo')
    expect(result.resolvedByRoleId).toBe('role-1')
  })

  it('falls back to registry priority when no landing policy is visible', async () => {
    const navigationRepo = createNavigationRepository()
    const handler = new ResolveNavigationPreviewHandler(
      navigationRepo,
      new NavigationResolverService()
    )

    navigationRepo.findVisibleEntriesForRoles.mockResolvedValue([
      entry('workbench.home', 100),
      entry('mes.work-order-board', 200)
    ])
    navigationRepo.findLandingPoliciesForRoles.mockResolvedValue([
      new RoleLandingPolicy('role-1', 'WEB', 'hidden.entry', 900, true)
    ])

    const result = await handler.execute(
      new ResolveNavigationPreviewQuery({
        roleIds: ['role-1'],
        scopeLevel: 'TENANT',
        terminal: 'WEB'
      })
    )

    expect(result.defaultEntry).toBe('mes.work-order-board')
    expect(result.fallbackReason).toBe('REGISTRY_PRIORITY')
  })
})
