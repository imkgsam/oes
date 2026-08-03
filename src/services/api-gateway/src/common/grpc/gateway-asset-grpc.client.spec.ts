import { GatewayAssetGrpcClient } from './gateway-asset-grpc.client'

/** Verifies migrated Asset adapters resolve their service through the dedicated mTLS channel. */
describe('GatewayAssetGrpcClient', () => {
  it('lazily creates and reuses one Asset gRPC client', () => {
    const assetService = { uploadAccountAvatar: jest.fn() }
    const grpcClient = { getService: jest.fn(() => assetService) }
    const factory = jest.fn(() => grpcClient)
    const client = new GatewayAssetGrpcClient(factory as never)

    expect(client.getService()).toBe(assetService)
    expect(client.getService()).toBe(assetService)
    expect(factory).toHaveBeenCalledTimes(1)
    expect(grpcClient.getService).toHaveBeenCalledTimes(1)
  })
})
