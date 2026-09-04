import { S3CompatibleObjectStorageAdaptor } from '../../src/infrastructure/adaptors/storage/s3-compatible-object-storage.adaptor'

describe('S3CompatibleObjectStorageAdaptor', () => {
  it('puts avatar objects through the configured S3-compatible client', async () => {
    const client = {
      send: jest.fn().mockResolvedValue({})
    }
    const adaptor = new S3CompatibleObjectStorageAdaptor({
      bucket: 'oes-assets',
      client,
      keyPrefix: 'avatar',
      publicBaseUrl: 'http://localhost:9000/oes-assets'
    })

    const result = await adaptor.putObject({
      body: Buffer.from('avatar'),
      contentType: 'image/webp',
      fileName: 'avatar.webp',
      ownerAccountId: 'account-1',
      scopeLevel: 'TENANT',
      tenantId: 'tenant-1'
    })

    expect(result.storageKey).toMatch(/^avatar\/tenant\/tenant-1\/account-1\/.+\.webp$/)
    expect(result.publicUrl).toBe(`http://localhost:9000/oes-assets/${result.storageKey}`)
    expect(client.send).toHaveBeenCalledTimes(1)
    expect(client.send.mock.calls[0][0].input).toMatchObject({
      Body: Buffer.from('avatar'),
      Bucket: 'oes-assets',
      ContentType: 'image/webp',
      Key: result.storageKey
    })
  })

  it('uses a system path when the avatar belongs to a system-scope account', async () => {
    const client = {
      send: jest.fn().mockResolvedValue({})
    }
    const adaptor = new S3CompatibleObjectStorageAdaptor({
      bucket: 'oes-assets',
      client,
      keyPrefix: 'avatar',
      publicBaseUrl: 'http://localhost:9000/oes-assets'
    })

    const result = await adaptor.putObject({
      body: Buffer.from('avatar'),
      contentType: 'image/webp',
      fileName: 'avatar.webp',
      ownerAccountId: 'account-1',
      scopeLevel: 'SYSTEM',
      tenantId: undefined
    })

    expect(result.storageKey).toMatch(/^avatar\/system\/account-1\/.+\.webp$/)
    expect(client.send).toHaveBeenCalledTimes(1)
  })

  it('deletes objects through the configured S3-compatible client', async () => {
    const client = {
      send: jest.fn().mockResolvedValue({})
    }
    const adaptor = new S3CompatibleObjectStorageAdaptor({
      bucket: 'oes-assets',
      client,
      keyPrefix: 'avatar',
      publicBaseUrl: 'http://localhost:9000/oes-assets'
    })

    await adaptor.deleteObject('avatar/tenant/tenant-1/account-1/asset.webp')

    expect(client.send).toHaveBeenCalledTimes(1)
    expect(client.send.mock.calls[0][0].input).toMatchObject({
      Bucket: 'oes-assets',
      Key: 'avatar/tenant/tenant-1/account-1/asset.webp'
    })
  })
})
