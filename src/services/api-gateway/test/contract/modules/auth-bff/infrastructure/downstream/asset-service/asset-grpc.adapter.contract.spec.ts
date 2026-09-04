import { of } from 'rxjs'
import { AssetGrpcAdapter } from '../../../../../../../src/modules/auth-bff/infrastructure/downstream/asset-service/asset-grpc.adapter'

/** Verifies each account-avatar method fixes its target-token mode and permission declaration at the adapter boundary. */
describe('AssetGrpcAdapter', () => {
  it('uses SELF_SERVICE for avatar writes and exact INTERNAL code for URL resolution', async () => {
    const service = {
      uploadAccountAvatar: jest.fn(() => of({})),
      bindAccountAvatar: jest.fn(() => of({})),
      resolveAssetPublicUrl: jest.fn(() => of({}))
    }
    const producer = {
      forSelfServiceCall: jest.fn(async () => ({})),
      forInternalCall: jest.fn(async () => ({}))
    }
    const adapter = new AssetGrpcAdapter({ getService: () => service } as never, producer as never)
    adapter.onModuleInit()
    const source = { user: { holderId: 'account-1', sid: 'session-1' }, requestId: 'request-1', traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01' }
    await adapter.uploadAccountAvatar({}, source)
    await adapter.bindAccountAvatar({}, source)
    await adapter.resolveAssetPublicUrl({ assetId: 'asset-1' }, source)
    expect(producer.forSelfServiceCall).toHaveBeenCalledWith(source, 'urn:oes:service:asset-service')
    expect(producer.forInternalCall).toHaveBeenCalledWith(source, 'urn:oes:service:asset-service', ['asset.internal.avatar.resolve_public_url'])
  })
})
