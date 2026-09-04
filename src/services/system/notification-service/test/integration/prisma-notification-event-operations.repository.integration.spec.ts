import { PrismaNotificationEventOperationsRepository } from '../../src/infrastructure/events/operations/prisma-notification-event-operations.repository'

/** Verifies the Notification-local operations repository keeps unresolved advisory evidence immutable and writes audit facts append-only. */
describe('PrismaNotificationEventOperationsRepository Integration', () => {
  it('creates one unresolved advisory record and one immutable audit entry when the same advisory is recovered twice', async () => {
    const calls: string[] = []
    const existing = new Map<string, any>()
    const prisma = {
      $transaction: async (callback: (transaction: any) => Promise<unknown>) => callback({
        notificationEventAdvisoryRecovery: {
          createMany: async ({ data }: any) => {
            const row = data[0]
            const key = `${row.consumerName}:${row.sourceStream}:${row.sourceStreamSequence}`
            if (existing.has(key)) return { count: 0 }
            existing.set(key, row)
            calls.push('recovery.createMany')
            return { count: 1 }
          },
          findUnique: async ({ where }: any) => existing.get(`${where.consumerName_sourceStream_sourceStreamSequence.consumerName}:${where.consumerName_sourceStream_sourceStreamSequence.sourceStream}:${where.consumerName_sourceStream_sourceStreamSequence.sourceStreamSequence}`)
        },
        notificationEventAdvisoryAudit: {
          create: async () => calls.push('audit.create')
        }
      })
    }
    const repository = new PrismaNotificationEventOperationsRepository(prisma as any)
    const record = {
      id: 'advisory:notification-service__collaboration-task__v1:OES_BUSINESS_EVENTS:41',
      consumerName: 'notification-service__collaboration-task__v1',
      sourceStream: 'OES_BUSINESS_EVENTS',
      sourceStreamSequence: 41,
      sourceConsumerSequence: 9,
      deliveryAttempts: 5,
      sourceExpiresAt: new Date('2026-08-03T08:00:00.000Z'),
      status: 'UNRESOLVED_SOURCE_TERMINATION_AUTHORITY_REQUIRED' as const,
      originalSourceTermination: 'AUTHORITY_UNAVAILABLE' as const
    }

    await repository.ensureAdvisory(record)
    await repository.ensureAdvisory(record)

    expect(calls).toEqual(['recovery.createMany', 'audit.create'])
  })
})
