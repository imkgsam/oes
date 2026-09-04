import { describe, expect, it, jest } from '@jest/globals'
import { PrismaRoleRepository } from '../infrastructure/repositories/prisma/prisma.role.repository'
import { RoleKind } from '../domain/enums/role-kind.enum'
import { ScopeLevel } from '../domain/enums/scope-level.enum'

describe('PrismaRoleRepository scope filtering', () => {
  it('includes both system and tenant role kinds when scopeLevel is omitted', async () => {
    const findMany = jest.fn().mockResolvedValue([])
    const count = jest.fn().mockResolvedValue(0)
    const transaction = jest.fn(async (operations: Array<Promise<unknown>>) => Promise.all(operations))
    const repository = new PrismaRoleRepository({
      role: {
        count,
        findMany
      },
      $transaction: transaction
    } as any)

    await repository.findRoleInstances({
      page: 1,
      pageSize: 20
    })

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          kind: {
            in: [RoleKind.SYSTEM_INSTANCE, RoleKind.TENANT_INSTANCE]
          }
        })
      })
    )
    expect(count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          kind: {
            in: [RoleKind.SYSTEM_INSTANCE, RoleKind.TENANT_INSTANCE]
          }
        })
      })
    )
  })

  it('narrows the role kind when scopeLevel is explicitly provided', async () => {
    const findMany = jest.fn().mockResolvedValue([])
    const count = jest.fn().mockResolvedValue(0)
    const transaction = jest.fn(async (operations: Array<Promise<unknown>>) => Promise.all(operations))
    const repository = new PrismaRoleRepository({
      role: {
        count,
        findMany
      },
      $transaction: transaction
    } as any)

    await repository.findRoleInstances({
      page: 1,
      pageSize: 20,
      scopeLevel: ScopeLevel.SYSTEM
    })

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          kind: RoleKind.SYSTEM_INSTANCE
        })
      })
    )
  })
})
