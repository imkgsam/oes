import { SiteMediaLifecycleOperationWorker } from '../../src/infrastructure/workers/site-media-lifecycle-operation.worker'

/** Verifies durable purge confirmation and retry semantics at the worker boundary. */
describe('SiteMediaLifecycleOperationWorker', () => {
  const operation = (status = 'PENDING' as any) => ({ operationId: 'op-1', tenantId: 't-1', assetId: 'a-1', idempotencyKey: 'i-1', requestHash: 'h', kind: 'TAKEDOWN_PURGE', status, immutableTargetUrl: 'https://media.example.test/v1/site-media/a-1/c.jpg', attempts: 0, nextAttemptAt: new Date() })
  it('confirms only after provider acknowledgement', async () => {
    const repo = { claimDuePurgeOperations: jest.fn().mockResolvedValue([operation()]), acknowledgePurge: jest.fn(), schedulePurgeRetry: jest.fn() }
    await new SiteMediaLifecycleOperationWorker(repo as any, { purge: jest.fn().mockResolvedValue({ acknowledged: true, providerRequestId: 'cf-1' }) }).runOnce()
    expect(repo.acknowledgePurge).toHaveBeenCalledWith('op-1', 'cf-1', expect.any(Date)); expect(repo.schedulePurgeRetry).not.toHaveBeenCalled()
  })
  it('schedules bounded retry on provider failure', async () => {
    const repo = { claimDuePurgeOperations: jest.fn().mockResolvedValue([operation()]), acknowledgePurge: jest.fn(), schedulePurgeRetry: jest.fn() }
    await new SiteMediaLifecycleOperationWorker(repo as any, { purge: jest.fn().mockRejectedValue(new Error('timeout')) }).runOnce()
    expect(repo.schedulePurgeRetry).toHaveBeenCalledWith('op-1', 1, expect.any(Date), 'PROVIDER_FAILURE'); expect(repo.acknowledgePurge).not.toHaveBeenCalled()
  })
  it('does not purge confirmed operations because the claim excludes them', async () => {
    const repo = { claimDuePurgeOperations: jest.fn().mockResolvedValue([]) }; const purge = jest.fn()
    await new SiteMediaLifecycleOperationWorker(repo as any, { purge }).runOnce(); expect(purge).not.toHaveBeenCalled()
  })
})
