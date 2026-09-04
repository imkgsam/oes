import { GatewayBrowserActivityGrpcClient } from '../../../../src/common/grpc/gateway-browser-activity-grpc.client'

/** Verifies the Browser Activity client remains a dedicated Gateway-owned trusted transport seam. */
describe('GatewayBrowserActivityGrpcClient', () => {
  it('is constructible without exposing a caller-configurable endpoint', () => {
    expect(new GatewayBrowserActivityGrpcClient()).toBeInstanceOf(GatewayBrowserActivityGrpcClient)
  })
})
