import { ClientProxyFactory, Transport } from '@nestjs/microservices'
import { GatewayCollaborationGrpcClient } from '../../../../src/common/grpc/gateway-collaboration-grpc.client'

jest.mock('@oes/common/transport', () => ({
  ...jest.requireActual('@oes/common/transport'),
  createGrpcClientCredentials: jest.fn(() => ({ mtls: true }))
}))

/** Verifies the Collaboration client is a cached deployment-owned mTLS channel. */
describe('GatewayCollaborationGrpcClient', () => {
  const saved = { host: process.env.COLLABORATION_SERVICE_HOST, port: process.env.COLLABORATION_SERVICE_PORT, environment: process.env.NODE_ENV }
  afterEach(() => {
    if (saved.host === undefined) delete process.env.COLLABORATION_SERVICE_HOST; else process.env.COLLABORATION_SERVICE_HOST = saved.host
    if (saved.port === undefined) delete process.env.COLLABORATION_SERVICE_PORT; else process.env.COLLABORATION_SERVICE_PORT = saved.port
    if (saved.environment === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = saved.environment
    jest.restoreAllMocks()
  })

  it('creates one mTLS Collaboration channel on the exact contract and configured target', () => {
    process.env.COLLABORATION_SERVICE_HOST = 'collaboration.internal'
    process.env.COLLABORATION_SERVICE_PORT = '50068'
    const channel = { getService: jest.fn() }
    const create = jest.spyOn(ClientProxyFactory, 'create').mockReturnValue(channel as never)
    const client = new GatewayCollaborationGrpcClient()
    expect(client.getClient()).toBe(channel)
    expect(client.getClient()).toBe(channel)
    expect(create).toHaveBeenCalledTimes(1)
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      transport: Transport.GRPC,
      options: expect.objectContaining({ package: 'collaboration_service', url: 'collaboration.internal:50068', credentials: { mtls: true } })
    }))
  })

  it('fails closed in production without a deployment endpoint', () => {
    delete process.env.COLLABORATION_SERVICE_HOST
    delete process.env.COLLABORATION_SERVICE_PORT
    process.env.NODE_ENV = 'production'
    expect(() => new GatewayCollaborationGrpcClient().getClient()).toThrow('COLLABORATION_SERVICE_HOST and COLLABORATION_SERVICE_PORT are required')
  })
})
