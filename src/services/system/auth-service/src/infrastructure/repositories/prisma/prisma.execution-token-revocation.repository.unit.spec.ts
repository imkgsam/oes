import { PrismaExecutionTokenRevocationRepository } from './prisma.execution-token-revocation.repository'

/** Verifies the Auth persistence adapter writes one emergency revocation decision, audit fact, and outbox intent atomically. */
describe('PrismaExecutionTokenRevocationRepository', () => {
  it('persists the monotonic decision, immutable audit, and Event-owned outbox intent in one transaction', async () => {
    const transaction = {
      executionTokenRevocation: { findUnique: jest.fn().mockResolvedValue(null), upsert: jest.fn().mockResolvedValue({ revocationVersion: 3 }), updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
      auditEvent: { create: jest.fn().mockResolvedValue(undefined) },
      authEventOutbox: { create: jest.fn().mockResolvedValue(undefined) },
    }
    const prisma = { $transaction: jest.fn(async (work: (tx: typeof transaction) => Promise<void>) => work(transaction)) }
    const repository = new PrismaExecutionTokenRevocationRepository(prisma as never)

    await repository.record({ auditRef: 'audit-1', traceId: 'trace-1', correlationId: 'correlation-1', data: {
      selectorKind: 'TOKEN_JTI', selectorRef: 'jti:token-1', revocationVersion: 3,
      effectiveAt: '2026-07-29T08:00:00.000Z', denyUntil: '2026-07-29T08:06:00.000Z', reasonCode: 'TOKEN_COMPROMISE',
    } })

    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
    expect(transaction.executionTokenRevocation.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { selectorKind_selectorRef: { selectorKind: 'TOKEN_JTI', selectorRef: 'jti:token-1' } },
    }))
    expect(transaction.auditEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ id: 'audit-1', eventType: 'EXECUTION_TOKEN_REVOKED' }) }))
    expect(transaction.authEventOutbox.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ eventId: expect.any(String), eventType: 'auth.execution-token.revoked' }) }))
  })

  it('guards stale delivery and keeps an equivalent version idempotent', async () => {
    const transaction = {
      executionTokenRevocation: {
        findUnique: jest.fn().mockResolvedValue({ revocationVersion: 5 }),
        upsert: jest.fn().mockResolvedValue({ revocationVersion: 5 }),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      auditEvent: { create: jest.fn() },
      authEventOutbox: { create: jest.fn() },
    }
    const prisma = { $transaction: jest.fn(async (work: (tx: typeof transaction) => Promise<void>) => work(transaction)) }
    const repository = new PrismaExecutionTokenRevocationRepository(prisma as never)

    await repository.record({ auditRef: 'audit-stale', traceId: 'trace-1', data: {
      selectorKind: 'TOKEN_JTI', selectorRef: 'jti:token-1', revocationVersion: 4,
      effectiveAt: '2026-07-29T08:00:00.000Z', denyUntil: '2026-07-29T08:06:00.000Z', reasonCode: 'TOKEN_COMPROMISE',
    } })

    expect(transaction.executionTokenRevocation.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ revocationVersion: { lt: 4 } }),
    }))
    expect(transaction.auditEvent.create).not.toHaveBeenCalled()
    expect(transaction.authEventOutbox.create).not.toHaveBeenCalled()
  })

  it('does not duplicate audit or publication intent for the retained version', async () => {
    const transaction = {
      executionTokenRevocation: {
        findUnique: jest.fn().mockResolvedValue({ revocationVersion: 4 }),
        upsert: jest.fn().mockResolvedValue({ revocationVersion: 4 }),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      auditEvent: { create: jest.fn() },
      authEventOutbox: { create: jest.fn() },
    }
    const prisma = { $transaction: jest.fn(async (work: (tx: typeof transaction) => Promise<void>) => work(transaction)) }
    const repository = new PrismaExecutionTokenRevocationRepository(prisma as never)

    await repository.record({ auditRef: 'audit-repeat', traceId: 'trace-1', data: {
      selectorKind: 'TOKEN_JTI', selectorRef: 'jti:token-1', revocationVersion: 4,
      effectiveAt: '2026-07-29T08:00:00.000Z', denyUntil: '2026-07-29T08:06:00.000Z', reasonCode: 'TOKEN_COMPROMISE',
    } })

    expect(transaction.auditEvent.create).not.toHaveBeenCalled()
    expect(transaction.authEventOutbox.create).not.toHaveBeenCalled()
  })
})
