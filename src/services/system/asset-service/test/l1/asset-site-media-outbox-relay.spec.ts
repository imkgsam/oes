import { AssetSiteMediaOutboxRelay } from '../../src/infrastructure/events/asset-site-media-outbox.relay'

/** Verifies outbox acknowledgement follows publication and retry retains the stored envelope. */
describe('AssetSiteMediaOutboxRelay', () => {
  it('acknowledges only after publishing the claimed immutable envelope', async () => {
    const event = { eventId: 'evt-1', eventType: 'asset.site-media.availability.changed', payload: { id: 'evt-1' }, attempts: 0 }
    const store = { claim: jest.fn().mockResolvedValue([event]), acknowledge: jest.fn(), retry: jest.fn() }
    const publisher = { publish: jest.fn().mockResolvedValue(undefined) }
    await new AssetSiteMediaOutboxRelay(store as any, publisher).relay(new Date())
    expect(publisher.publish).toHaveBeenCalledWith(event); expect(store.acknowledge).toHaveBeenCalled(); expect(store.retry).not.toHaveBeenCalled()
  })
  it('schedules retry without acknowledgement after publish failure', async () => {
    const event = { eventId: 'evt-2', eventType: 'asset.site-media.availability.changed', payload: { id: 'evt-2' }, attempts: 1 }
    const store = { claim: jest.fn().mockResolvedValue([event]), acknowledge: jest.fn(), retry: jest.fn() }
    await new AssetSiteMediaOutboxRelay(store as any, { publish: jest.fn().mockRejectedValue(new Error('broker unavailable')) }).relay(new Date())
    expect(store.acknowledge).not.toHaveBeenCalled(); expect(store.retry).toHaveBeenCalledWith('evt-2', 2, expect.any(Date))
  })
})
