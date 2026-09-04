import { PrismaPrincipalAuthorizationRepository } from '../infrastructure/repositories/prisma/prisma.principal-authorization.repository'

describe('PrismaPrincipalAuthorizationRepository', () => {
  it('loads active scoped bindings, BUSINESS permissions and coarse policies as domain facts', async () => {
    const prisma = {
      principalRoleBinding: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'binding-1',
            principalType: 'HUMAN',
            principalId: 'human-1',
            scopeLevel: 'TENANT',
            tenantId: 'tenant-1',
            createdAt: new Date('2026-08-01T00:00:00.000Z'),
            role: {
              code: 'tenant-member',
              updatedAt: new Date('2026-08-02T00:00:00.000Z'),
              permissions: [
                { permission: { code: 'inventory.read', kind: 'BUSINESS' } },
                { permission: { code: 'asset.internal.resolve', kind: 'INTERNAL' } }
              ]
            }
          }
        ])
      },
      policy: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'policy-1',
            permissionCode: 'inventory.read',
            effect: 'ALLOW',
            subjectType: 'ANY',
            subjectId: null,
            tenantId: 'tenant-1',
            conditionAstJson: null,
            updatedAt: new Date('2026-08-03T00:00:00.000Z')
          }
        ])
      }
    }
    const repository = new PrismaPrincipalAuthorizationRepository(
      prisma as never,
      () => new Date('2026-08-05T00:00:00.000Z')
    )

    const facts = await repository.resolveAuthorizationFacts({
      principalType: 'HUMAN',
      principalId: 'human-1',
      scopeLevel: 'TENANT',
      tenantId: 'tenant-1',
      requestedPermissionCodes: ['inventory.read']
    })

    expect(facts).toMatchObject({
      principalType: 'HUMAN',
      principalId: 'human-1',
      scopeLevel: 'TENANT',
      tenantId: 'tenant-1',
      permissionCodes: ['inventory.read'],
      roleCodes: ['tenant-member'],
      policies: [
        expect.objectContaining({
          permissionCode: 'inventory.read',
          effect: 'ALLOW',
          subjectType: 'ANY'
        })
      ]
    })
    expect(facts?.authzVersion).toMatch(/^[a-f0-9]{64}$/)
    expect(facts?.authzVersion).not.toContain('binding-1')
    expect(facts?.decisionReference).toContain('principal-grant:human-1:')
    expect(prisma.principalRoleBinding.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          principalType: 'HUMAN',
          principalId: 'human-1',
          tenantId: 'tenant-1'
        })
      })
    )
  })

  it('returns no authorization facts when no active binding exists', async () => {
    const prisma = {
      principalRoleBinding: { findMany: jest.fn().mockResolvedValue([]) },
      policy: { findMany: jest.fn() }
    }
    const repository = new PrismaPrincipalAuthorizationRepository(prisma as never)

    await expect(
      repository.resolveAuthorizationFacts({
        principalType: 'MACHINE',
        principalId: 'machine-1',
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        requestedPermissionCodes: ['inventory.read']
      })
    ).resolves.toBeNull()
    expect(prisma.policy.findMany).not.toHaveBeenCalled()
  })

  it('changes the opaque authorization version when the effective Code set changes', async () => {
    const binding = (permissionCode: string) => ({
      id: 'binding-1',
      principalType: 'HUMAN',
      principalId: 'human-1',
      scopeLevel: 'TENANT',
      tenantId: 'tenant-1',
      createdAt: new Date('2026-08-01T00:00:00.000Z'),
      role: {
        code: 'tenant-member',
        updatedAt: new Date('2026-08-02T00:00:00.000Z'),
        permissions: [{ permission: { code: permissionCode, kind: 'BUSINESS' } }]
      }
    })
    const prisma = {
      principalRoleBinding: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce([binding('inventory.read')])
          .mockResolvedValueOnce([binding('inventory.write')])
      },
      policy: { findMany: jest.fn().mockResolvedValue([]) }
    }
    const repository = new PrismaPrincipalAuthorizationRepository(prisma as never)
    const input = {
      principalType: 'HUMAN' as const,
      principalId: 'human-1',
      scopeLevel: 'TENANT' as const,
      tenantId: 'tenant-1',
      requestedPermissionCodes: ['inventory.read', 'inventory.write']
    }

    const before = await repository.resolveAuthorizationFacts(input)
    const after = await repository.resolveAuthorizationFacts(input)

    expect(before?.permissionCodes).toEqual(['inventory.read'])
    expect(after?.permissionCodes).toEqual(['inventory.write'])
    expect(after?.authzVersion).not.toBe(before?.authzVersion)
  })
})
