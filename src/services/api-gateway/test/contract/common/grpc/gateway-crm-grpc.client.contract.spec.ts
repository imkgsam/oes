import { CRM_TARGET_AUDIENCE, GatewayCrmGrpcClient } from '../../../../src/common/grpc/gateway-crm-grpc.client'

/** Verifies the dedicated CRM channel and target audience are caller-independent. */
describe('GatewayCrmGrpcClient', () => {
  it('is constructible without accepting a caller-controlled endpoint', () => {
    expect(new GatewayCrmGrpcClient()).toBeInstanceOf(GatewayCrmGrpcClient)
    expect(CRM_TARGET_AUDIENCE).toBe('urn:oes:service:crm-service')
  })
})
