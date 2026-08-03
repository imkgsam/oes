import { PrismaDelegationGrantRepository } from './prisma-delegation-grant.repository'

const grant = {
  delegationReference: 'delegation-1',
  humanPrincipalId: 'human-1',
  sessionId: 'session-1',
  tenantId: 'tenant-1',
  agentPrincipalId: 'agent-1',
  toolContractId: 'tool-1',
  toolContractVersion: '1.0.0',
  operationKeys: ['operation-1'],
  permissionCodes: ['permission-1'],
  authzVersion: 'v1',
  authorizationDecisionReference: 'decision-1',
  expiresAt: new Date('2030-01-01T00:00:00Z'),
  createdAt: new Date('2029-01-01T00:00:00Z')
}
const audit = {
  auditId: 'audit-1',
  eventType: 'DELEGATION_GRANT_CREATED' as const,
  result: 'SUCCEEDED' as const,
  humanPrincipalId: 'human-1',
  tenantId: 'tenant-1',
  delegationReference: 'delegation-1',
  authorizationDecisionReference: 'decision-1',
  traceId: 'trace-1',
  occurredAt: new Date('2029-01-01T00:00:00Z')
}

describe('PrismaDelegationGrantRepository', () => {
  it('creates grant state and lifecycle audit in one Auth transaction', async () => {
    const tx = {
      delegationGrant: { create: jest.fn().mockResolvedValue({}) },
      delegatedExecutionAudit: { create: jest.fn().mockResolvedValue({}) }
    }
    const prisma = {
      $transaction: jest.fn(async (work: (client: typeof tx) => unknown) => work(tx))
    }
    await new PrismaDelegationGrantRepository(prisma as never).create(grant, audit)
    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
    expect(tx.delegationGrant.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ id: 'delegation-1', humanPrincipalId: 'human-1' })
      })
    )
    expect(tx.delegatedExecutionAudit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ id: 'audit-1', actionGrantJti: undefined })
      })
    )
  })

  it('preserves the first revocation with a conditional database update', async () => {
    const firstRevokedAt = new Date('2029-06-01T00:00:00Z')
    const current = {
      id: grant.delegationReference,
      humanPrincipalId: grant.humanPrincipalId,
      sessionId: grant.sessionId,
      tenantId: grant.tenantId,
      orgId: null,
      agentPrincipalId: grant.agentPrincipalId,
      toolContractId: grant.toolContractId,
      toolContractVersion: grant.toolContractVersion,
      operationKeys: grant.operationKeys,
      permissionCodes: grant.permissionCodes,
      authzVersion: grant.authzVersion,
      authorizationDecisionReference: grant.authorizationDecisionReference,
      expiresAt: grant.expiresAt,
      revokedAt: firstRevokedAt,
      revokeReasonCategory: 'USER_REVOKED',
      createdAt: grant.createdAt,
      updatedAt: firstRevokedAt
    }
    const tx = {
      delegationGrant: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        findUnique: jest.fn().mockResolvedValue(current)
      },
      delegatedExecutionAudit: { create: jest.fn().mockResolvedValue({}) }
    }
    const prisma = {
      $transaction: jest.fn(async (work: (client: typeof tx) => unknown) => work(tx))
    }

    const result = await new PrismaDelegationGrantRepository(prisma as never).revoke(
      grant.delegationReference,
      new Date('2029-07-01T00:00:00Z'),
      { ...audit, eventType: 'DELEGATION_GRANT_REVOKED' },
      'ADMIN_REVOKED'
    )

    expect(tx.delegationGrant.updateMany).toHaveBeenCalledWith({
      where: { id: grant.delegationReference, revokedAt: null },
      data: {
        revokedAt: new Date('2029-07-01T00:00:00Z'),
        revokeReasonCategory: 'ADMIN_REVOKED'
      }
    })
    expect(result.revokedAt).toEqual(firstRevokedAt)
    expect(result.revokeReasonCategory).toBe('USER_REVOKED')
    expect(tx.delegatedExecutionAudit.create).not.toHaveBeenCalled()
  })
})
