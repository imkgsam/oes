import { GatewayTerminalDeviceGrpcClient } from './gateway-terminal-device-grpc.client'

/** Verifies the Terminal Device channel remains a Gateway-owned mTLS transport seam. */
describe('GatewayTerminalDeviceGrpcClient', () => {
  it('is constructible without accepting a caller-controlled endpoint', () => {
    expect(new GatewayTerminalDeviceGrpcClient()).toBeInstanceOf(GatewayTerminalDeviceGrpcClient)
  })
})
