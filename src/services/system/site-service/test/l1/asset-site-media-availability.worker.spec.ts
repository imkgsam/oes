import { createOesCloudEvent, encodeCloudEvent } from '@oes/common'
import { AssetSiteMediaAvailabilityWorker } from '../../src/infrastructure/events/asset-site-media-availability.worker'

/** Verifies Site's JetStream worker validates and settles Asset availability deliveries after inbox processing. */
describe('AssetSiteMediaAvailabilityWorker', () => {
  const contract = { eventType: 'asset.site-media.availability.changed', eventVersion: 1, ownerService: 'asset-service', validateData: (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null }
  it('ACKs an applied event from the exact subject', async () => {
    let options: { handle: (delivery: any) => Promise<void> } | undefined
    const runner = { start: jest.fn((value) => { options = value; return { stop: jest.fn() } }) }
    const consumer = { consume: jest.fn().mockResolvedValue('APPLIED') }
    const inbox = { recordTerminalFailure: jest.fn() }
    const event = createOesCloudEvent({ contract, eventId: 'event-1', occurredAt: '2026-08-09T00:00:00.000Z', tenantId: 'tenant-1', aggregateType: 'SITE_MEDIA_ASSET', aggregateId: 'asset-1', traceId: 'trace-1', data: { assetId: 'asset-1', availabilityVersion: 2, lifecycleStatus: 'ACTIVE', deliveryStatus: 'REMOTE_ACTIVE' } })
    const encoded = encodeCloudEvent(event)
    const delivery = { subject: 'oes.events.asset.site-media.availability.changed', headers: encoded.headers, body: encoded.body, deliveryAttempt: 1, ack: jest.fn(), nak: jest.fn(), term: jest.fn() }
    const worker = new AssetSiteMediaAvailabilityWorker(runner as never, consumer as never, inbox as never)
    worker.onModuleInit(); await options?.handle(delivery)
    expect(consumer.consume).toHaveBeenCalled(); expect(delivery.ack).toHaveBeenCalled(); expect(delivery.nak).not.toHaveBeenCalled()
  })
  it('NAKs malformed or failed deliveries for bounded retry', async () => {
    let options: { handle: (delivery: any) => Promise<void> } | undefined
    const runner = { start: jest.fn((value) => { options = value; return { stop: jest.fn() } }) }
    const consumer = { consume: jest.fn().mockRejectedValue(new Error('inbox unavailable')) }
    const inbox = { recordTerminalFailure: jest.fn() }
    const worker = new AssetSiteMediaAvailabilityWorker(runner as never, consumer as never, inbox as never)
    worker.onModuleInit(); const delivery = { subject: 'oes.events.asset.site-media.availability.changed', headers: [], body: Buffer.from('{}'), deliveryAttempt: 2, ack: jest.fn(), nak: jest.fn(), term: jest.fn() }
    await options?.handle(delivery)
    expect(delivery.nak).toHaveBeenCalledWith(expect.any(Number)); expect(delivery.ack).not.toHaveBeenCalled()
  })
  it('persists a terminal conflict into the Site DLQ before acknowledging the source delivery', async () => {
    let options: { handle: (delivery: any) => Promise<void> } | undefined
    const runner = { start: jest.fn((value) => { options = value; return { stop: jest.fn() } }) }
    const consumer = { consume: jest.fn().mockRejectedValue(new Error('EVENT_ID_CONFLICT')) }
    const inbox = { recordTerminalFailure: jest.fn().mockResolvedValue(undefined) }
    const worker = new AssetSiteMediaAvailabilityWorker(runner as never, consumer as never, inbox as never)
    const event = createOesCloudEvent({ contract, eventId: 'event-conflict', occurredAt: '2026-08-09T00:00:00.000Z', tenantId: 'tenant-1', aggregateType: 'SITE_MEDIA_ASSET', aggregateId: 'asset-1', traceId: 'trace-1', data: { assetId: 'asset-1', availabilityVersion: 2, lifecycleStatus: 'ACTIVE', deliveryStatus: 'REMOTE_ACTIVE' } })
    const encoded = encodeCloudEvent(event)
    worker.onModuleInit(); const delivery = { subject: 'oes.events.asset.site-media.availability.changed', headers: encoded.headers, body: encoded.body, deliveryAttempt: 8, ack: jest.fn(), nak: jest.fn(), term: jest.fn() }
    await options?.handle(delivery)
    expect(inbox.recordTerminalFailure).toHaveBeenCalledWith(expect.objectContaining({ eventId: 'event-conflict', retryCount: 8, safeError: 'EVENT_ID_CONFLICT' }))
    expect(delivery.ack).toHaveBeenCalled(); expect(delivery.nak).not.toHaveBeenCalled()
  })
})
