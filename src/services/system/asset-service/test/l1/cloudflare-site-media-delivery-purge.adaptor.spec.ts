import { CloudflareSiteMediaDeliveryPurgeAdaptor } from '../../src/infrastructure/adaptors/delivery/cloudflare-site-media-delivery-purge.adaptor'

/** Verifies precise Cloudflare purge request and fail-closed target validation. */
describe('CloudflareSiteMediaDeliveryPurgeAdaptor', () => {
  const original = { ...process.env }
  beforeEach(() => { process.env.SITE_MEDIA_PROVIDER_PROFILE = 'oes-managed-cloudflare'; process.env.CLOUDFLARE_ZONE_ID = 'zone'; process.env.CLOUDFLARE_API_TOKEN = 'secret'; process.env.SITE_MEDIA_ALLOWED_HOST = 'media.example.test' })
  afterEach(() => { process.env = { ...original } })
  it('sends one exact immutable file', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, result: { id: 'req-1' } }) }) as any
    await expect(new CloudflareSiteMediaDeliveryPurgeAdaptor().purge({ url: 'https://media.example.test/v1/site-media/a-1/c.jpg' })).resolves.toEqual({ acknowledged: true, providerRequestId: 'req-1' })
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/purge_cache'), expect.objectContaining({ body: JSON.stringify({ files: ['https://media.example.test/v1/site-media/a-1/c.jpg'] }) }))
  })
  it('rejects non-allowlisted targets', async () => { await expect(new CloudflareSiteMediaDeliveryPurgeAdaptor().purge({ url: 'https://origin.example.test/a' })).rejects.toThrow('CLOUDFLARE_PURGE_TARGET_INVALID') })
})
