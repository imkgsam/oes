import { readFileSync } from 'node:fs'
import {
  GatewayTerminalDeviceGrpcClient,
  resolveTerminalDeviceGrpcChannelOptions,
  resolveTerminalDeviceGrpcUrl
} from './gateway-terminal-device-grpc.client'

/** Verifies the Terminal Device channel remains a Gateway-owned mTLS transport seam. */
describe('GatewayTerminalDeviceGrpcClient', () => {
  it('is constructible without accepting a caller-controlled endpoint', () => {
    expect(new GatewayTerminalDeviceGrpcClient()).toBeInstanceOf(GatewayTerminalDeviceGrpcClient)
  })

  it('pins the dedicated mTLS channel to the exact Terminal Device SPIFFE peer', () => {
    const source = readFileSync(__filename.replace(/\.spec\.ts$/u, '.ts'), 'utf8')
    expect(source).toContain('createGrpcClientCredentials(process.env, TERMINAL_DEVICE_SPIFFE_ID)')
    expect(source).toContain('spiffe://local.oes.internal/ns/oes/sa/terminal-device-service')
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
