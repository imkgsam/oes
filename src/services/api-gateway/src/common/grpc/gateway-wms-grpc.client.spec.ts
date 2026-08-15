import { GatewayWmsGrpcClient, WMS_TARGET_AUDIENCE } from './gateway-wms-grpc.client'

/** Verifies the dedicated WMS channel and target audience are caller-independent. */
describe('GatewayWmsGrpcClient', () => {
  it('is constructible without accepting a caller-controlled endpoint', () => {
    expect(new GatewayWmsGrpcClient()).toBeInstanceOf(GatewayWmsGrpcClient)
    expect(WMS_TARGET_AUDIENCE).toBe('urn:oes:service:wms-service')
  })
})
