import { GatewaySrmGrpcClient, SRM_TARGET_AUDIENCE } from '../../../../src/common/grpc/gateway-srm-grpc.client'

/** Verifies the dedicated SRM channel remains deployment-owned and audience-stable. */
describe('GatewaySrmGrpcClient', () => {
  it('is constructible without accepting a caller-controlled endpoint', () => {
    expect(new GatewaySrmGrpcClient()).toBeInstanceOf(GatewaySrmGrpcClient)
    expect(SRM_TARGET_AUDIENCE).toBe('urn:oes:service:srm-service')
  })
})
