import { Metadata } from '@grpc/grpc-js'
import { of } from 'rxjs'
import { AssetGrpcAdapter } from './asset-grpc.adapter'

const SOURCE = {
  user: {
    aid: 'account-1',
    tid: 'tenant-1',
    sid: 'session-1'
  },
  requestId: 'request-1',
  traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'
}

/** Verifies that every Auth-BFF Asset call uses target-bound trusted metadata and authority-free DTOs. */
describe('AssetGrpcAdapter trusted execution', () => {
  it('uses SELF_SERVICE metadata for account upload and bind without legacy body identity', async () => {
    const metadata = new Metadata()
    const service = {
      uploadAccountAvatar: jest.fn(() => of({ asset: { assetId: 'asset-1' } })),
      bindAccountAvatar: jest.fn(() => of({ activeAsset: { assetId: 'asset-1' } })),
      resolveAssetPublicUrl: jest.fn()
    }
    const producer = {
      forSelfServiceCall: jest.fn().mockResolvedValue(metadata),
      forInternalCall: jest.fn()
    }
    const adapter = new AssetGrpcAdapter(
      { getService: jest.fn(() => service) } as never,
      producer as never
    )
    adapter.onModuleInit()

    await adapter.uploadAccountAvatar(
      { file: Buffer.from('avatar'), fileName: 'avatar.webp', contentType: 'image/webp' },
      SOURCE
    )
    await adapter.bindAccountAvatar({ newAssetId: 'asset-1' }, SOURCE)

    expect(producer.forSelfServiceCall).toHaveBeenCalledTimes(2)
    expect(producer.forSelfServiceCall).toHaveBeenCalledWith(
      SOURCE,
      'urn:oes:service:asset-service'
    )
    expect(service.uploadAccountAvatar).toHaveBeenCalledWith(
      {
        file: Buffer.from('avatar'),
        fileName: 'avatar.webp',
        contentType: 'image/webp'
      },
      metadata
    )
    expect(service.bindAccountAvatar).toHaveBeenCalledWith({ newAssetId: 'asset-1' }, metadata)
  })

  it('uses the exact INTERNAL grant for public URL resolution', async () => {
    const metadata = new Metadata()
    const service = {
      uploadAccountAvatar: jest.fn(),
      bindAccountAvatar: jest.fn(),
      resolveAssetPublicUrl: jest.fn(() =>
        of({ assetId: 'asset-1', publicUrl: 'https://assets.example/asset-1', status: 'ACTIVE' })
      )
    }
    const producer = {
      forSelfServiceCall: jest.fn(),
      forInternalCall: jest.fn().mockResolvedValue(metadata)
    }
    const adapter = new AssetGrpcAdapter(
      { getService: jest.fn(() => service) } as never,
      producer as never
    )
    adapter.onModuleInit()

    await adapter.resolveAssetPublicUrl({ assetId: 'asset-1' }, SOURCE)

    expect(producer.forInternalCall).toHaveBeenCalledWith(SOURCE, 'urn:oes:service:asset-service', [
      'asset.internal.avatar.resolve_public_url'
    ])
    expect(service.resolveAssetPublicUrl).toHaveBeenCalledWith({ assetId: 'asset-1' }, metadata)
  })
})
