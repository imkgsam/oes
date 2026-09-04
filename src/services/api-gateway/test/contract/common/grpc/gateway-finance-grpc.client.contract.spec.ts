import { ClientProxyFactory } from '@nestjs/microservices'
import { GatewayFinanceGrpcClient } from '../../../../src/common/grpc/gateway-finance-grpc.client'

jest.mock('@oes/common/transport', () => ({
  ...jest.requireActual('@oes/common/transport'),
  createGrpcClientCredentials: jest.fn(() => ({}))
}))

/** Verifies Gateway creates one Finance-only mTLS channel and keeps its destination deployment-owned. */
describe('GatewayFinanceGrpcClient', () => {
  const saved = {
    host: process.env.FINANCE_SERVICE_HOST,
    port: process.env.FINANCE_SERVICE_PORT,
    environment: process.env.NODE_ENV
  }

  afterEach(() => {
    if (saved.host === undefined) delete process.env.FINANCE_SERVICE_HOST
    else process.env.FINANCE_SERVICE_HOST = saved.host
    if (saved.port === undefined) delete process.env.FINANCE_SERVICE_PORT
    else process.env.FINANCE_SERVICE_PORT = saved.port
    if (saved.environment === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = saved.environment
    jest.restoreAllMocks()
  })

  it('creates and caches a Finance protocol client on the exact configured destination', () => {
    process.env.FINANCE_SERVICE_HOST = 'finance.internal'
    process.env.FINANCE_SERVICE_PORT = '50063'
    const client = { getService: jest.fn() }
    const create = jest.spyOn(ClientProxyFactory, 'create').mockReturnValue(client as never)
    const gatewayClient = new GatewayFinanceGrpcClient()

    expect(gatewayClient.getClient()).toBe(client)
    expect(gatewayClient.getClient()).toBe(client)
    expect(create).toHaveBeenCalledTimes(1)
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          package: 'finance_service',
          url: 'finance.internal:50063'
        })
      })
    )
  })

  it('does not allow production startup to manufacture an unconfigured Finance endpoint', () => {
    delete process.env.FINANCE_SERVICE_HOST
    delete process.env.FINANCE_SERVICE_PORT
    process.env.NODE_ENV = 'production'
    expect(() => new GatewayFinanceGrpcClient().getClient()).toThrow(
      'FINANCE_SERVICE_HOST and FINANCE_SERVICE_PORT are required'
    )
  })
})
