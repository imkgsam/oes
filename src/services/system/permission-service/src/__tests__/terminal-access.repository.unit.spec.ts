import { ScopeLevel } from '../domain/enums/scope-level.enum'
import { PrismaTerminalAccessRepository } from '../infrastructure/repositories/prisma/prisma.terminal-access.repository'

describe('PrismaTerminalAccessRepository', () => {
  const createPrisma = () => {
    const prisma = {
      roleTerminalAccess: {
        findMany: jest.fn(),
        upsert: jest.fn()
      },
      accountTerminalAccessOverride: {
        findFirst: jest.fn(),
        deleteMany: jest.fn(),
        create: jest.fn()
      },
      $transaction: jest.fn()
    }

    prisma.$transaction.mockImplementation(async (input: unknown) => {
      if (typeof input === 'function') return input(prisma)
      return Promise.all(input as Promise<unknown>[])
    })

    return prisma
  }

  it('loads role terminal access facts for role union resolution', async () => {
    const prisma = createPrisma()
    const repository = new PrismaTerminalAccessRepository(prisma as any)

    prisma.roleTerminalAccess.findMany.mockResolvedValue([
      { roleId: 'role-1', allowedTerminals: ['WEB'] },
      { roleId: 'role-2', allowedTerminals: ['PDA', 'WEB'] }
    ])

    await expect(repository.findRoleTerminalAccess(['role-1', 'role-2'])).resolves.toEqual([
      { roleId: 'role-1', allowedTerminals: ['WEB'] },
      { roleId: 'role-2', allowedTerminals: ['PDA', 'WEB'] }
    ])
    expect(prisma.roleTerminalAccess.findMany).toHaveBeenCalledWith({
      where: { roleId: { in: ['role-1', 'role-2'] } },
      orderBy: { roleId: 'asc' }
    })
  })

  it('loads the account override for the selected scope', async () => {
    const prisma = createPrisma()
    const repository = new PrismaTerminalAccessRepository(prisma as any)

    prisma.accountTerminalAccessOverride.findFirst.mockResolvedValue({
      accountId: 'account-1',
      scopeLevel: 'TENANT',
      tenantId: 'tenant-1',
      allowedTerminals: ['PDA']
    })

    await expect(
      repository.findAccountOverride('account-1', 'tenant-1', ScopeLevel.TENANT)
    ).resolves.toEqual({
      accountId: 'account-1',
      allowedTerminals: ['PDA']
    })
    expect(prisma.accountTerminalAccessOverride.findFirst).toHaveBeenCalledWith({
      where: { accountId: 'account-1', scopeLevel: 'TENANT', tenantId: 'tenant-1' },
      orderBy: { updatedAt: 'desc' }
    })
  })

  it('replaces role terminal access as a full set', async () => {
    const prisma = createPrisma()
    const repository = new PrismaTerminalAccessRepository(prisma as any)

    await repository.replaceRoleTerminalAccess('role-1', ['PDA', 'WEB', 'PDA'])

    expect(prisma.roleTerminalAccess.upsert).toHaveBeenCalledWith({
      where: { roleId: 'role-1' },
      update: { allowedTerminals: ['PDA', 'WEB'] },
      create: { roleId: 'role-1', allowedTerminals: ['PDA', 'WEB'] }
    })
  })

  it('replaces an account override by deleting the old row before creating the new value', async () => {
    const prisma = createPrisma()
    const repository = new PrismaTerminalAccessRepository(prisma as any)

    await repository.replaceAccountOverride('account-1', 'tenant-1', ScopeLevel.TENANT, [])

    expect(prisma.accountTerminalAccessOverride.deleteMany).toHaveBeenCalledWith({
      where: { accountId: 'account-1', scopeLevel: 'TENANT', tenantId: 'tenant-1' }
    })
    expect(prisma.accountTerminalAccessOverride.create).toHaveBeenCalledWith({
      data: {
        accountId: 'account-1',
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        allowedTerminals: []
      }
    })
  })

  it('deletes account override to fall back to role terminal access', async () => {
    const prisma = createPrisma()
    const repository = new PrismaTerminalAccessRepository(prisma as any)

    await repository.deleteAccountOverride('account-1', null, ScopeLevel.SYSTEM)

    expect(prisma.accountTerminalAccessOverride.deleteMany).toHaveBeenCalledWith({
      where: { accountId: 'account-1', scopeLevel: 'SYSTEM', tenantId: null }
    })
  })
})
