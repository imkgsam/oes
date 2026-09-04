import { AssetSiteMediaAvailabilityConsumer } from '../../src/infrastructure/events/asset-site-media-availability.consumer'

/** Exercises frozen envelope validation before the Site-local inbox transaction boundary. */
describe('AssetSiteMediaAvailabilityConsumer', () => {
  const event = () => ({ specversion: '1.0', type: 'asset.site-media.availability.changed', oeseventversion: 1, id: 'evt-1', oestenantid: 'tenant-1', data: { assetId: 'asset-1', availabilityVersion: 1, lifecycleStatus: 'ACTIVE', deliveryStatus: 'REMOTE_ACTIVE' } })
  it('applies a valid frozen event', async () => {
    const inbox = { receive: jest.fn().mockResolvedValue('APPLIED') }; await expect(new AssetSiteMediaAvailabilityConsumer(inbox as any).consume(event())).resolves.toBe('APPLIED')
  })
  it.each([['type', { type: 'wrong' }], ['version', { oeseventversion: 2 }], ['tenant', { oestenantid: '' }], ['asset', { data: { assetId: '', availabilityVersion: 1 } }], ['availability', { data: { assetId: 'asset-1', availabilityVersion: 0 } }]])('fails closed for invalid %s', async (_name, patch) => {
    const candidate: any = { ...event(), ...patch, data: { ...event().data, ...(patch as any).data } }
    await expect(new AssetSiteMediaAvailabilityConsumer({ receive: jest.fn() } as any).consume(candidate)).rejects.toThrow('ASSET_SITE_MEDIA_EVENT_INVALID')
  })
})
