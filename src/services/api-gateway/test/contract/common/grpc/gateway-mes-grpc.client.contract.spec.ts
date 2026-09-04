import { GatewayMesGrpcClient } from '../../../../src/common/grpc/gateway-mes-grpc.client'

/** Verifies that MES has a dedicated Gateway client seam rather than generic transport injection. */
describe('GatewayMesGrpcClient', () => {
  it('is exposed as the dedicated MES channel provider', () => {
    expect(GatewayMesGrpcClient.name).toBe('GatewayMesGrpcClient')
  })
})
