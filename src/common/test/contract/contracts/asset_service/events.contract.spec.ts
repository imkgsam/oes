import { decodeCloudEvent } from '../../../../src/events/cloud-events/codec'
import { ASSET_SITE_MEDIA_AVAILABILITY_CHANGED, ASSET_SITE_MEDIA_EVENT_VERSION, createAssetSiteMediaAvailabilityEvent } from '../../../../src/contracts/asset_service/events'

const data = { assetId: 'asset-1', mediaKind: 'IMAGE', lifecycleStatus: 'ACTIVE', deliveryStatus: 'REMOTE_ACTIVE', availabilityVersion: 2, changeReasonCode: 'REMOTE_ACTIVATED', operationId: 'operation-1' }

/** Verifies the canonical immutable Asset availability fact persisted and relayed by the Site Media outbox. */
describe('Asset Site Media availability event contract', () => {
  it('builds the exact v1 CloudEvent identity and immutable payload snapshot', () => {
    const event = createAssetSiteMediaAvailabilityEvent({ id: 'event-1', time: '2026-08-09T00:00:00.000Z', oestenantid: 'tenant-1', traceId: 'operation-1', data })
    expect(event).toMatchObject({ specversion: '1.0', id: 'event-1', source: 'urn:oes:service:asset-service', type: ASSET_SITE_MEDIA_AVAILABILITY_CHANGED, oeseventversion: ASSET_SITE_MEDIA_EVENT_VERSION, oestenantid: 'tenant-1', subject: 'asset-1', oesaggregateid: 'asset-1', data })
    expect(Object.isFrozen(event)).toBe(true)
    expect(Object.isFrozen(event.data)).toBe(true)
    expect(() => { (event.data as { assetId: string }).assetId = 'mutated' }).toThrow()
  })

  it('requires canonical id, tenant, and the minimal validated payload identity', () => {
    expect(() => createAssetSiteMediaAvailabilityEvent({ id: '', time: '2026-08-09T00:00:00.000Z', oestenantid: 'tenant-1', traceId: 'operation-1', data })).toThrow('EVENT_ID_REQUIRED')
    expect(() => createAssetSiteMediaAvailabilityEvent({ id: 'event-1', time: '2026-08-09T00:00:00.000Z', oestenantid: '', traceId: 'operation-1', data })).toThrow('EVENT_TENANT_REQUIRED')
    expect(() => createAssetSiteMediaAvailabilityEvent({ id: 'event-1', time: '2026-08-09T00:00:00.000Z', oestenantid: 'tenant-1', traceId: 'operation-1', data: { ...data, availabilityVersion: '2' as unknown as number } })).toThrow('EVENT_DATA_INVALID')
  })

  it('round-trips only the frozen type/version through the immutable CloudEvent validator', () => {
    const event = createAssetSiteMediaAvailabilityEvent({ id: 'event-1', time: '2026-08-09T00:00:00.000Z', oestenantid: 'tenant-1', traceId: 'operation-1', data })
    const contract = { eventType: ASSET_SITE_MEDIA_AVAILABILITY_CHANGED, eventVersion: ASSET_SITE_MEDIA_EVENT_VERSION, ownerService: 'asset-service', validateData: (value: unknown): value is typeof data => typeof value === 'object' && value !== null && typeof (value as { assetId?: unknown }).assetId === 'string' && typeof (value as { availabilityVersion?: unknown }).availabilityVersion === 'number' }
    expect(decodeCloudEvent(Buffer.from(JSON.stringify(event)), contract)).toEqual(event)
    expect(() => decodeCloudEvent(Buffer.from(JSON.stringify({ ...event, oeseventversion: 2 })), contract)).toThrow('EVENT_VERSION_UNSUPPORTED')
  })
})
