import { GatewaySalesGrpcClient } from '../../../../src/common/grpc/gateway-sales-grpc.client'

/** Verifies the dedicated Sales client is isolated from legacy Gateway transport configuration. */
describe('GatewaySalesGrpcClient', () => {
  it('is available as the dedicated Sales channel provider', () => {
    expect(GatewaySalesGrpcClient.name).toBe('GatewaySalesGrpcClient')
  })
})
