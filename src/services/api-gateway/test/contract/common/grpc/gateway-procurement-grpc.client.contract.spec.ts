import {
  GatewayProcurementGrpcClient,
  PROCUREMENT_TARGET_AUDIENCE
} from '../../../../src/common/grpc/gateway-procurement-grpc.client'

/** Verifies the dedicated Procurement channel and target audience are caller-independent. */
describe('GatewayProcurementGrpcClient', () => {
  it('is constructible without accepting a caller-controlled endpoint', () => {
    expect(new GatewayProcurementGrpcClient()).toBeInstanceOf(GatewayProcurementGrpcClient)
    expect(PROCUREMENT_TARGET_AUDIENCE).toBe('urn:oes:service:procurement-service')
  })
})
