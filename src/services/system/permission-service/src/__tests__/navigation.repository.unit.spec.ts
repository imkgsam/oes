import { NavigationEntry } from '../domain/aggregates/navigation-entry.aggregate'
import { RoleLandingPolicy } from '../domain/vo/role-landing-policy.value-object'
import { RoleNavigationVisibility } from '../domain/vo/role-navigation-visibility.value-object'
import { PrismaNavigationRepository } from '../infrastructure/repositories/prisma/prisma.navigation.repository'

describe('PrismaNavigationRepository', () => {
  const createPrisma = () => {
    const prisma = {
      navigationEntry: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        upsert: jest.fn()
      },
      roleNavigationVisibility: {
        findMany: jest.fn(),
        deleteMany: jest.fn(),
        createMany: jest.fn()
      },
      roleLandingPolicy: {
        findMany: jest.fn(),
        deleteMany: jest.fn(),
        createMany: jest.fn()
      },
      $transaction: jest.fn()
    }

    prisma.$transaction.mockImplementation(async (input: unknown) => {
      if (typeof input === 'function') return input(prisma)
      return Promise.all(input as Promise<unknown>[])
    })

    return prisma
  }

  const createRepository = (prisma = createPrisma()) =>
    new PrismaNavigationRepository(prisma as any)

  it('stores and lists enabled navigation entries by terminal', async () => {
    const prisma = createPrisma()
    const repository = createRepository(prisma)
    const record = {
      entryKey: 'workbench.home',
      name: 'Workbench',
      description: null,
      featureKey: 'workbench',
      supportedTerminals: ['WEB'],
      registryPriority: 100,
      enabled: true,
      entryType: 'page'
    }

    prisma.navigationEntry.upsert.mockResolvedValue(record)
    prisma.navigationEntry.findMany.mockResolvedValue([record])
    prisma.navigationEntry.count.mockResolvedValue(1)

    await repository.saveEntry(
      new NavigationEntry('workbench.home', 'Workbench', null, 'workbench', ['WEB'], 100, true, 'page')
    )
    const result = await repository.listEntries({
      page: 1,
      pageSize: 20,
      terminal: 'WEB',
      enabled: true
    })

    expect(prisma.navigationEntry.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { entryKey: 'workbench.home' }
      })
    )
    expect(prisma.navigationEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          enabled: true,
          supportedTerminals: { array_contains: 'WEB' }
        })
      })
    )
    expect(result.entries).toEqual([
      new NavigationEntry('workbench.home', 'Workbench', null, 'workbench', ['WEB'], 100, true, 'page')
    ])
  })

  it('replaces role visibility as a full set', async () => {
    const prisma = createPrisma()
    const repository = createRepository(prisma)

    prisma.roleNavigationVisibility.findMany.mockResolvedValue([
      {
        roleId: 'role-1',
        entryKey: 'workbench.home',
        terminal: 'WEB',
        enabled: true
      }
    ])
    prisma.roleLandingPolicy.findMany.mockResolvedValue([])

    const result = await repository.replaceRoleVisibility('role-1', [
      new RoleNavigationVisibility('role-1', 'workbench.home', 'WEB', true)
    ])

    expect(prisma.roleNavigationVisibility.deleteMany).toHaveBeenCalledWith({
      where: { roleId: 'role-1' }
    })
    expect(prisma.roleNavigationVisibility.createMany).toHaveBeenCalledWith({
      data: [
        {
          roleId: 'role-1',
          entryKey: 'workbench.home',
          terminal: 'WEB',
          enabled: true
        }
      ]
    })
    expect(result.visibility).toEqual([
      new RoleNavigationVisibility('role-1', 'workbench.home', 'WEB', true)
    ])
  })

  it('replaces role landing policies as a full set', async () => {
    const prisma = createPrisma()
    const repository = createRepository(prisma)

    prisma.roleNavigationVisibility.findMany.mockResolvedValue([
      {
        roleId: 'role-1',
        entryKey: 'workbench.home',
        terminal: 'WEB',
        enabled: true
      }
    ])
    prisma.roleLandingPolicy.findMany.mockResolvedValue([
      {
        roleId: 'role-1',
        terminal: 'WEB',
        defaultEntryKey: 'workbench.home',
        priority: 100,
        enabled: true
      }
    ])

    const result = await repository.replaceRoleLandingPolicies('role-1', [
      new RoleLandingPolicy('role-1', 'WEB', 'workbench.home', 100, true)
    ])

    expect(prisma.roleLandingPolicy.deleteMany).toHaveBeenCalledWith({
      where: { roleId: 'role-1' }
    })
    expect(prisma.roleLandingPolicy.createMany).toHaveBeenCalledWith({
      data: [
        {
          roleId: 'role-1',
          terminal: 'WEB',
          defaultEntryKey: 'workbench.home',
          priority: 100,
          enabled: true
        }
      ]
    })
    expect(result.landingPolicies).toEqual([
      new RoleLandingPolicy('role-1', 'WEB', 'workbench.home', 100, true)
    ])
  })

  it('resolves highest-priority visible role landing entry facts', async () => {
    const prisma = createPrisma()
    const repository = createRepository(prisma)

    prisma.navigationEntry.findMany.mockResolvedValue([
      {
        entryKey: 'mes.work-order-board',
        name: 'Work Order Board',
        description: null,
        featureKey: 'mes',
        supportedTerminals: ['WEB'],
        registryPriority: 200,
        enabled: true,
        entryType: 'workspace'
      }
    ])
    prisma.roleLandingPolicy.findMany.mockResolvedValue([
      {
        roleId: 'role-2',
        terminal: 'WEB',
        defaultEntryKey: 'mes.work-order-board',
        priority: 900,
        enabled: true
      }
    ])

    const entries = await repository.findVisibleEntriesForRoles({
      roleIds: ['role-1', 'role-2'],
      terminal: 'WEB'
    })
    const policies = await repository.findLandingPoliciesForRoles({
      roleIds: ['role-1', 'role-2'],
      terminal: 'WEB'
    })

    expect(entries[0]?.entryKey).toBe('mes.work-order-board')
    expect(policies[0]).toEqual(
      new RoleLandingPolicy('role-2', 'WEB', 'mes.work-order-board', 900, true)
    )
    expect(prisma.roleLandingPolicy.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ priority: 'desc' }, { roleId: 'asc' }, { defaultEntryKey: 'asc' }]
      })
    )
  })

  it('resolves terminal navigation from DEFAULT rules plus terminal overrides', async () => {
    const prisma = createPrisma()
    const repository = createRepository(prisma)

    prisma.navigationEntry.findMany.mockResolvedValue([
      {
        entryKey: 'shared.notice',
        name: 'Shared Notice',
        description: null,
        featureKey: 'shared',
        supportedTerminals: ['WEB', 'MOBILE'],
        registryPriority: 90,
        enabled: true,
        entryType: 'page'
      }
    ])
    prisma.roleLandingPolicy.findMany.mockResolvedValue([
      {
        roleId: 'role-1',
        terminal: 'DEFAULT',
        defaultEntryKey: 'shared.notice',
        priority: 100,
        enabled: true
      }
    ])

    await repository.findVisibleEntriesForRoles({
      roleIds: ['role-1'],
      terminal: 'MOBILE'
    })
    const policies = await repository.findLandingPoliciesForRoles({
      roleIds: ['role-1'],
      terminal: 'MOBILE'
    })

    expect(prisma.navigationEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          roleVisibilities: {
            some: {
              roleId: { in: ['role-1'] },
              terminal: { in: ['DEFAULT', 'MOBILE'] },
              enabled: true
            }
          }
        })
      })
    )
    expect(prisma.roleLandingPolicy.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          roleId: { in: ['role-1'] },
          terminal: { in: ['DEFAULT', 'MOBILE'] },
          enabled: true
        })
      })
    )
    expect(policies[0]).toEqual(
      new RoleLandingPolicy('role-1', 'DEFAULT', 'shared.notice', 100, true)
    )
  })
})
