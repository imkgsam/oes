import { assertGrpcServerWorkloadIdentity } from '@oes/common/transport'
import {
  GatewayTerminalDeviceGrpcClient,
  resolveTerminalDeviceGrpcChannelOptions,
  resolveTerminalDeviceGrpcUrl,
  resolveTerminalDevicePeerSpiffeId,
  TERMINAL_DEVICE_PEER_SPIFFE_ENV
} from '../../../../src/common/grpc/gateway-terminal-device-grpc.client'

/** Verifies the Terminal Device channel remains a Gateway-owned mTLS transport seam. */
describe('GatewayTerminalDeviceGrpcClient', () => {
  it('is constructible without accepting a caller-controlled endpoint', () => {
    expect(new GatewayTerminalDeviceGrpcClient()).toBeInstanceOf(GatewayTerminalDeviceGrpcClient)
  })

  it.each([
    'spiffe://local.oes.internal/ns/oes/sa/terminal-device-service',
    'spiffe://prod.example.internal/ns/platform/sa/terminal-device-service'
  ])('accepts one exact deployment-projected Terminal Device peer: %s', (expectedPeer) => {
    expect(
      resolveTerminalDevicePeerSpiffeId({
        [TERMINAL_DEVICE_PEER_SPIFFE_ENV]: expectedPeer
      })
    ).toBe(expectedPeer)
    expect(() =>
      assertGrpcServerWorkloadIdentity(`DNS:terminal-device, URI:${expectedPeer}`, expectedPeer)
    ).not.toThrow()
  })

  it.each([
    undefined,
    '',
    'https://prod.example.internal/terminal-device-service',
    'spiffe://*/ns/oes/sa/terminal-device-service',
    'spiffe://prod.example.internal/ns/oes/sa/*',
    'spiffe://prod.example.internal'
  ])('fails closed for an absent, malformed, or wildcard peer value: %s', (value) => {
    expect(() =>
      resolveTerminalDevicePeerSpiffeId({
        ...(value === undefined ? {} : { [TERMINAL_DEVICE_PEER_SPIFFE_ENV]: value })
      })
    ).toThrow(`${TERMINAL_DEVICE_PEER_SPIFFE_ENV} must be an exact SPIFFE ID`)
  })

  it('fails closed when the authenticated peer does not match the projected non-local value', () => {
    const expectedPeer = resolveTerminalDevicePeerSpiffeId({
      [TERMINAL_DEVICE_PEER_SPIFFE_ENV]:
        'spiffe://prod.example.internal/ns/platform/sa/terminal-device-service'
    })
    expect(() =>
      assertGrpcServerWorkloadIdentity(
        'URI:spiffe://local.oes.internal/ns/oes/sa/terminal-device-service',
        expectedPeer
      )
    ).toThrow('gRPC TLS server SPIFFE identity does not match the expected workload')
  })

  it('keeps task-owned service.localhost recovery channels on IPv4 loopback', () => {
    const originalHost = process.env.TERMINAL_DEVICE_SERVICE_HOST
    const originalPort = process.env.TERMINAL_DEVICE_SERVICE_PORT
    try {
      process.env.TERMINAL_DEVICE_SERVICE_HOST = 'terminal-device-service.localhost'
      process.env.TERMINAL_DEVICE_SERVICE_PORT = '52057'

      expect(resolveTerminalDeviceGrpcUrl()).toBe('127.0.0.1:52057')
      expect(resolveTerminalDeviceGrpcChannelOptions()).toEqual({
        'grpc.ssl_target_name_override': 'terminal-device-service.localhost',
        'grpc.default_authority': 'terminal-device-service.localhost'
      })
    } finally {
      if (originalHost === undefined) delete process.env.TERMINAL_DEVICE_SERVICE_HOST
      else process.env.TERMINAL_DEVICE_SERVICE_HOST = originalHost
      if (originalPort === undefined) delete process.env.TERMINAL_DEVICE_SERVICE_PORT
      else process.env.TERMINAL_DEVICE_SERVICE_PORT = originalPort
    }
  })
})
