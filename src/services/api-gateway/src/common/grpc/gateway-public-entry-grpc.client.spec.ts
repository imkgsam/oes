import { ClientProxyFactory, Transport } from '@nestjs/microservices'
import { GatewayPublicEntryGrpcClient } from './gateway-public-entry-grpc.client'

jest.mock('@oes/common/transport', () => ({
  ...jest.requireActual('@oes/common/transport'),
  createGrpcClientCredentials: jest.fn(() => ({ mtls: true }))
}))

/** Verifies the Public Entry client is a cached deployment-owned mTLS channel, never a legacy registry channel. */
describe('GatewayPublicEntryGrpcClient', () => {
  const saved = { host: process.env.PUBLIC_ENTRY_SERVICE_HOST, port: process.env.PUBLIC_ENTRY_SERVICE_PORT, environment: process.env.NODE_ENV }
  afterEach(() => {
    if (saved.host === undefined) delete process.env.PUBLIC_ENTRY_SERVICE_HOST; else process.env.PUBLIC_ENTRY_SERVICE_HOST = saved.host
    if (saved.port === undefined) delete process.env.PUBLIC_ENTRY_SERVICE_PORT; else process.env.PUBLIC_ENTRY_SERVICE_PORT = saved.port
    if (saved.environment === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = saved.environment
    jest.restoreAllMocks()
  })

  it('creates one mTLS Public Entry channel on the exact contract and configured target', () => {
    process.env.PUBLIC_ENTRY_SERVICE_HOST = 'public-entry.internal'
    process.env.PUBLIC_ENTRY_SERVICE_PORT = '50067'
    const channel = { getService: jest.fn() }
    const create = jest.spyOn(ClientProxyFactory, 'create').mockReturnValue(channel as never)
    const client = new GatewayPublicEntryGrpcClient()
    expect(client.getClient()).toBe(channel)
    expect(client.getClient()).toBe(channel)
    expect(create).toHaveBeenCalledTimes(1)
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      transport: Transport.GRPC,
      options: expect.objectContaining({ package: 'public_entry_service', url: 'public-entry.internal:50067', credentials: { mtls: true } })
    }))
  })

  it('fails closed in production without a deployment endpoint', () => {
    delete process.env.PUBLIC_ENTRY_SERVICE_HOST
    delete process.env.PUBLIC_ENTRY_SERVICE_PORT
    process.env.NODE_ENV = 'production'
    expect(() => new GatewayPublicEntryGrpcClient().getClient()).toThrow('PUBLIC_ENTRY_SERVICE_HOST and PUBLIC_ENTRY_SERVICE_PORT are required')
  })
})
