import { PrismaRoleRepository } from '../infrastructure/repositories/prisma/prisma.role.repository'
import { AccountType } from '../domain/enums/account-type.enum'
import { ScopeLevel } from '../domain/enums/scope-level.enum'

const persistedBinding = {
  id: 'binding-1',
  principalType: 'HUMAN',
  principalId: 'account-1',
  roleId: 'role-1',
  tenantId: 'tenant-1',
  scopeLevel: 'TENANT',
  effectiveAt: null,
  expiresAt: null,
  revokedAt: null,
  revokedByOperatorId: null,
  revokeReason: null,
  revokeAuditEventId: null
}

describe('PrismaRoleRepository PrincipalRoleBinding persistence', () => {
  it('creates a new immutable row and returns its persisted bindingId', async () => {
    const create = jest.fn().mockResolvedValue(persistedBinding)
    const repository = new PrismaRoleRepository({
      principalRoleBinding: { create }
    } as any)

    const result = await repository.assignAccountRole(
      'account-1',
      'role-1',
      'tenant-1',
      ScopeLevel.TENANT,
      AccountType.USER,
      null,
      null,
      {
        operatorId: 'operator-1',
        requestId: 'request-1',
        traceId: 'trace-1',
        bindingId: 'binding-1'
      }
    )

    expect(result.bindingId).toBe('binding-1')
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: 'binding-1',
        principalType: 'HUMAN',
        principalId: 'account-1',
        roleId: 'role-1',
        createdByOperatorId: 'operator-1',
        createdRequestId: 'request-1',
        createdTraceId: 'trace-1'
      })
    })
  })

  it('returns the exact first revoke facts when the same binding is revoked again', async () => {
    const firstFacts = {
      ...persistedBinding,
      revokedAt: new Date('2026-07-29T10:00:00.000Z'),
      revokedByOperatorId: 'operator-1',
      revokeReason: 'rotation',
      revokeAuditEventId: 'audit-1'
    }
    const updateMany = jest
      .fn()
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 })
    const findUnique = jest.fn().mockResolvedValue(firstFacts)
    const transaction = jest.fn(async (callback: (tx: any) => unknown) =>
      callback({
        principalRoleBinding: { updateMany, findUnique }
      })
    )
    const repository = new PrismaRoleRepository({ $transaction: transaction } as any)

    const first = await repository.revokePrincipalRoleBinding({
      bindingId: 'binding-1',
      revokedAt: firstFacts.revokedAt,
      revokedByOperatorId: 'operator-1',
      reason: 'rotation',
      auditEventId: 'audit-1'
    })
    const retry = await repository.revokePrincipalRoleBinding({
      bindingId: 'binding-1',
      revokedAt: new Date('2026-07-29T11:00:00.000Z'),
      revokedByOperatorId: 'operator-2',
      reason: 'different',
      auditEventId: 'audit-2'
    })

    expect(first).toMatchObject({ revokedNow: true })
    expect(retry).toEqual({
      bindingId: 'binding-1',
      revokedAt: firstFacts.revokedAt,
      revokedByOperatorId: 'operator-1',
      reason: 'rotation',
      auditEventId: 'audit-1',
      revokedNow: false
    })
  })

  it('replays one opaque stable outcome for an unknown binding without reporting a state change', async () => {
    const tombstone = {
      bindingId: 'missing-binding',
      revokedAt: new Date('2026-07-29T10:00:00.000Z'),
      revokedByOperatorId: 'operator-1',
      reason: 'rotation',
      opaqueRevokeOutcomeId: 'opaque-1'
    }
    const upsert = jest.fn().mockResolvedValue(tombstone)
    const transaction = jest.fn(async (callback: (tx: any) => unknown) =>
      callback({
        principalRoleBinding: {
          updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          findUnique: jest.fn().mockResolvedValue(null)
        },
        principalRoleBindingRevokeTombstone: { upsert }
      })
    )
    const repository = new PrismaRoleRepository({ $transaction: transaction } as any)

    const first = await repository.revokePrincipalRoleBinding({
      bindingId: 'missing-binding',
      revokedAt: tombstone.revokedAt,
      revokedByOperatorId: 'operator-1',
      reason: 'rotation',
      auditEventId: 'opaque-1'
    })
    const retry = await repository.revokePrincipalRoleBinding({
      bindingId: 'missing-binding',
      revokedAt: new Date('2026-07-29T11:00:00.000Z'),
      revokedByOperatorId: 'operator-2',
      reason: 'different',
      auditEventId: 'opaque-2'
    })

    expect(retry).toEqual(first)
    expect(first.revokedNow).toBe(false)
    expect(upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { bindingId: 'missing-binding' },
        update: {}
      })
    )
  })

  it('rejects a database exclusion violation as an overlapping grant', async () => {
    const repository = new PrismaRoleRepository({
      principalRoleBinding: {
        create: jest.fn().mockRejectedValue({
          code: 'P2004',
          meta: { constraint: 'principal_role_binding_non_overlapping_window' }
        })
      }
    } as any)

    await expect(
      repository.assignAccountRole(
        'account-1',
        'role-1',
        'tenant-1',
        ScopeLevel.TENANT,
        AccountType.USER
      )
    ).rejects.toMatchObject({
      definition: { code: 'ACCOUNT_ROLE_ALREADY_ASSIGNED' }
    })
  })
})
