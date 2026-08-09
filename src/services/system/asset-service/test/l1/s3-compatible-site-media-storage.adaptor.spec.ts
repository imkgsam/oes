import { S3CompatibleSiteMediaStorageAdaptor } from '../../src/infrastructure/adaptors/storage/s3-compatible-site-media-storage.adaptor'
import { Readable } from 'node:stream'

const checksum = '3a6eb0790f39ac87c94f3856b2dd2c5d110e6811602261a9a923d3bb23adc8b7'
const streamedData = () => Readable.from([Buffer.from('data')])

/** Verifies Site Media storage persists bytes through PutObject and returns the verified local checksum. */
describe('S3CompatibleSiteMediaStorageAdaptor', () => {
  const original = { ...process.env }

  beforeEach(() => {
    process.env.SITE_MEDIA_S3_ENDPOINT = 'https://r2.example'
    process.env.SITE_MEDIA_S3_BUCKET = 'site-media'
  })

  afterEach(() => {
    process.env = { ...original }
  })

  it('issues a bounded PutObject with the SHA-256 checksum', async () => {
    const client = { send: jest.fn().mockResolvedValue({}) }
    const adaptor = new S3CompatibleSiteMediaStorageAdaptor(client as never)
    await expect(adaptor.put({ key: 'site-media/key', body: streamedData(), size: 4, checksum, contentType: 'image/png' })).resolves.toEqual({ checksum, size: 4 })
    expect(client.send).toHaveBeenCalledTimes(1)
  })

  it('fails closed when the provider checksum disagrees', async () => {
    const client = { send: jest.fn().mockResolvedValue({ ChecksumSHA256: 'wrong' }) }
    const adaptor = new S3CompatibleSiteMediaStorageAdaptor(client as never)
    await expect(adaptor.put({ key: 'site-media/key', body: streamedData(), size: 4, checksum, contentType: 'image/png' })).rejects.toThrow('SITE_MEDIA_STORAGE_CHECKSUM_MISMATCH')
  })
})
