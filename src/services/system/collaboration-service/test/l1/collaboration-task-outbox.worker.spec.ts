import { CollaborationTaskOutboxRelay } from '../../src/infrastructure/events/collaboration-task-outbox.relay'
import { CollaborationTaskOutboxWorker } from '../../src/infrastructure/events/collaboration-task-outbox.worker'

/** Flushes queued promise reactions while Jest controls only timer progression. */
async function flushPromises(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
}

describe('CollaborationTaskOutboxWorker', () => {
  const originalInterval = process.env.COLLABORATION_OUTBOX_INTERVAL_MS

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-08-25T08:00:00.000Z'))
    process.env.COLLABORATION_OUTBOX_INTERVAL_MS = '100'
  })

  afterEach(() => {
    jest.useRealTimers()
    if (originalInterval === undefined) delete process.env.COLLABORATION_OUTBOX_INTERVAL_MS
    else process.env.COLLABORATION_OUTBOX_INTERVAL_MS = originalInterval
  })

  it('starts immediately, prevents overlap, and waits for the active relay during shutdown', async () => {
    let resolveRelay: (() => void) | undefined
    const relay = {
      relayOnce: jest.fn(() => new Promise<void>((resolve) => (resolveRelay = resolve)))
    } as unknown as CollaborationTaskOutboxRelay
    const worker = new CollaborationTaskOutboxWorker(relay)

    worker.onModuleInit()
    await flushPromises()
    expect(relay.relayOnce).toHaveBeenCalledTimes(1)
    jest.advanceTimersByTime(500)
    await flushPromises()
    expect(relay.relayOnce).toHaveBeenCalledTimes(1)

    let destroyed = false
    const destroy = worker.onModuleDestroy().then(() => (destroyed = true))
    await flushPromises()
    expect(destroyed).toBe(false)
    resolveRelay?.()
    await destroy
    jest.advanceTimersByTime(500)
    await flushPromises()
    expect(relay.relayOnce).toHaveBeenCalledTimes(1)
  })

  it('backs off a failed tick before resuming without a second worker', async () => {
    const relay = {
      relayOnce: jest
        .fn()
        .mockRejectedValueOnce(new Error('database temporarily unavailable'))
        .mockResolvedValue(undefined)
    } as unknown as CollaborationTaskOutboxRelay
    const worker = new CollaborationTaskOutboxWorker(relay)

    worker.onModuleInit()
    await flushPromises()
    expect(relay.relayOnce).toHaveBeenCalledTimes(1)
    jest.advanceTimersByTime(100)
    await flushPromises()
    expect(relay.relayOnce).toHaveBeenCalledTimes(1)
    jest.advanceTimersByTime(100)
    await flushPromises()
    expect(relay.relayOnce).toHaveBeenCalledTimes(2)
    await worker.onModuleDestroy()
  })

  it('fails closed when the scheduling interval is absent or unsafe', () => {
    delete process.env.COLLABORATION_OUTBOX_INTERVAL_MS
    const worker = new CollaborationTaskOutboxWorker({} as CollaborationTaskOutboxRelay)
    expect(() => worker.onModuleInit()).toThrow('COLLABORATION_OUTBOX_INTERVAL_REQUIRED')
    process.env.COLLABORATION_OUTBOX_INTERVAL_MS = '99'
    expect(() => worker.onModuleInit()).toThrow('COLLABORATION_OUTBOX_INTERVAL_REQUIRED')
  })
})
