// @ts-nocheck
const { NotificationProviderOutboxWorker } = require('../../dist/infrastructure/outbox/notification-provider-outbox.worker.js')
const { DeploymentNotificationDeliveryPayloadProtector } = require('../../dist/infrastructure/security/deployment-notification-delivery-payload-protector.js')

/** Exercises the shared atomic lease so concurrent replicas cannot send one provider job twice. */
describe('Notification provider outbox worker', () => {
  it('allows only one of two replicas to claim and deliver one job', async () => {
    const now = new Date('2026-08-11T00:00:00.000Z')
    const job: any = { id: 'job-1', dispatchId: 'dispatch-1', channel: 'EMAIL', encryptedPayload: 'payload', payloadExpiresAt: new Date(now.valueOf() + 60_000), status: 'PENDING', attempts: 0, nextAttemptAt: now, leaseOwner: null, leaseExpiresAt: null, createdAt: now }
    const dispatch: any = { id: 'dispatch-1', channel: 'EMAIL', category: 'AUTH_OTP', sourceService: 'spiffe://auth', machinePrincipal: 'machine-1', recipientAddress: 'user@example.com', templateKey: 'AUTH_OTP_EMAIL', variablePayload: {}, commandDigest: 'digest', protectedPayload: 'payload', protectedPayloadExpiresAt: job.payloadExpiresAt, idempotencyKey: 'key', status: 'QUEUED', createdAt: now, updatedAt: now, acceptedAt: now }
    const prisma: any = {
      notificationProviderOutbox: {
        findMany: jest.fn(async () => [job]),
        findUnique: jest.fn(async ({ where }: any) => where.id === 'job-1' ? job : null),
        updateMany: jest.fn(async ({ where, data }: any) => {
          if (data.leaseOwner) { if (job.leaseOwner) return { count: 0 }; job.leaseOwner = data.leaseOwner; job.leaseExpiresAt = data.leaseExpiresAt; return { count: 1 } }
          if (where.leaseOwner !== job.leaseOwner) return { count: 0 }
          Object.assign(job, data); return { count: 1 }
        })
      },
      notificationDispatch: { findUnique: jest.fn(async () => dispatch), update: jest.fn(async ({ data }: any) => { Object.assign(dispatch, data); return dispatch }) },
      notificationDispatchAudit: { create: jest.fn(async () => ({})) },
      $transaction: jest.fn(async (callback: any) => callback(prisma))
    }
    const provider = { send: jest.fn(async () => undefined) }
    const protector = { unprotect: jest.fn(() => ({ code: '123456' })) }
    const one = new NotificationProviderOutboxWorker(prisma, protector, provider, provider)
    const two = new NotificationProviderOutboxWorker(prisma, protector, provider, provider)
    await Promise.all([one.runOnce(now), two.runOnce(now)])
    expect(provider.send).toHaveBeenCalledTimes(1)
    expect(job.encryptedPayload).toBe('')
    expect(dispatch.protectedPayload).toBe('')
  })

  it('renews ownership while an in-flight provider call crosses the original lease expiry', async () => {
    jest.useFakeTimers()
    const now = new Date('2026-08-11T00:00:00.000Z')
    jest.setSystemTime(now)
    let resolveProvider: (() => void) | undefined
    const pending = new Promise<void>((resolve) => { resolveProvider = resolve })
    const job: any = { id: 'job-2', dispatchId: 'dispatch-2', channel: 'EMAIL', encryptedPayload: 'payload', payloadExpiresAt: new Date(now.valueOf() + 600_000), status: 'PENDING', attempts: 0, nextAttemptAt: now, leaseOwner: null, leaseExpiresAt: null, createdAt: now }
    const dispatch: any = { id: 'dispatch-2', channel: 'EMAIL', category: 'AUTH_OTP', sourceService: 'spiffe://auth', machinePrincipal: 'machine-1', recipientAddress: 'user@example.com', templateKey: 'AUTH_OTP_EMAIL', variablePayload: {}, commandDigest: 'digest', protectedPayload: 'payload', protectedPayloadExpiresAt: job.payloadExpiresAt, idempotencyKey: 'key-2', status: 'QUEUED', createdAt: now, updatedAt: now, acceptedAt: now }
    const prisma: any = {
      notificationProviderOutbox: {
        findMany: jest.fn(async () => [job]), findUnique: jest.fn(async () => job),
        updateMany: jest.fn(async ({ where, data }: any) => {
          if (data.leaseOwner) { if (job.leaseOwner) return { count: 0 }; Object.assign(job, data); return { count: 1 } }
          if (where.leaseOwner !== job.leaseOwner) return { count: 0 }
          Object.assign(job, data); return { count: 1 }
        })
      },
      notificationDispatch: { findUnique: jest.fn(async () => dispatch), update: jest.fn(async ({ data }: any) => { Object.assign(dispatch, data); return dispatch }) },
      notificationDispatchAudit: { create: jest.fn(async () => ({})) }, $transaction: jest.fn(async (callback: any) => callback(prisma))
    }
    const provider = { send: jest.fn(() => pending) }
    const protector = { unprotect: jest.fn(() => ({ code: '123456' })) }
    const first = new NotificationProviderOutboxWorker(prisma, protector, provider, provider)
    const second = new NotificationProviderOutboxWorker(prisma, protector, provider, provider)
    const firstRun = first.runOnce(now)
    await Promise.resolve()
    await jest.advanceTimersByTimeAsync(61_000)
    await second.runOnce(new Date(Date.now()))
    expect(provider.send).toHaveBeenCalledTimes(1)
    resolveProvider?.()
    await firstRun
    jest.useRealTimers()
  })

  it('retries provider deadlines with deterministic exponential backoff before the terminal ceiling', async () => {
    jest.useFakeTimers()
    let now = new Date('2026-08-11T00:00:00.000Z')
    jest.setSystemTime(now)
    const job: any = { id: 'job-3', dispatchId: 'dispatch-3', channel: 'EMAIL', encryptedPayload: 'payload', payloadExpiresAt: new Date(now.valueOf() + 3_600_000), status: 'PENDING', attempts: 0, nextAttemptAt: now, leaseOwner: null, leaseExpiresAt: null, createdAt: now }
    const dispatch: any = { id: 'dispatch-3', channel: 'EMAIL', category: 'AUTH_OTP', sourceService: 'spiffe://auth', machinePrincipal: 'machine-1', recipientAddress: 'user@example.com', templateKey: 'AUTH_OTP_EMAIL', variablePayload: {}, commandDigest: 'digest', protectedPayload: 'payload', protectedPayloadExpiresAt: job.payloadExpiresAt, idempotencyKey: 'key-3', status: 'QUEUED', createdAt: now, updatedAt: now, acceptedAt: now }
    const prisma: any = {
      notificationProviderOutbox: {
        findMany: jest.fn(async () => [job]), findUnique: jest.fn(async () => job),
        updateMany: jest.fn(async ({ where, data }: any) => { if (data.leaseOwner) { if (job.leaseOwner) return { count: 0 }; Object.assign(job, data); return { count: 1 } }; if (where.leaseOwner !== job.leaseOwner) return { count: 0 }; Object.assign(job, data); return { count: 1 } })
      },
      notificationDispatch: { findUnique: jest.fn(async () => dispatch), update: jest.fn(async ({ data }: any) => { Object.assign(dispatch, data); return dispatch }) },
      notificationDispatchAudit: { create: jest.fn(async () => ({})) }, $transaction: jest.fn(async (callback: any) => callback(prisma))
    }
    const provider = { send: jest.fn((_dispatch: any, _payload: any, signal: AbortSignal) => new Promise<void>((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true }))) }
    const worker = new NotificationProviderOutboxWorker(prisma, { unprotect: jest.fn(() => ({ code: '123456' })) }, provider, provider)
    const delays = [30_000, 60_000, 120_000, 240_000]
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const run = worker.runOnce(now)
      await jest.advanceTimersByTimeAsync(30_000)
      await run
      expect(job.attempts).toBe(attempt)
      if (attempt < 5) {
        expect(job.status).toBe('RETRYING')
        expect(job.nextAttemptAt.valueOf()).toBe(now.valueOf() + delays[attempt - 1])
        now = job.nextAttemptAt
        jest.setSystemTime(now)
      }
    }
    expect(job.status).toBe('TERMINAL')
    expect(job.terminalReason).toBe('PROVIDER_CALL_DEADLINE_EXCEEDED')
    expect(job.encryptedPayload).toBe('')
    expect(dispatch.protectedPayload).toBe('')
    expect(provider.send).toHaveBeenCalledTimes(5)
    jest.useRealTimers()
  })

  it('rejects expired payloads after authenticated encryption', () => {
    const protector = new DeploymentNotificationDeliveryPayloadProtector(Buffer.alloc(32, 1).toString('base64'))
    const payload = protector.protect({ code: '123456' }, new Date(Date.now() - 1))
    expect(() => protector.unprotect(payload, new Date())).toThrow('expired')
  })
})
