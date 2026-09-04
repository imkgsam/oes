import { NacosRegistryService, resolveRegistryPort } from './nacos-registry.service'

describe('resolveRegistryPort', () => {
  it('uses the exact explicit override before the configured listener', () => {
    expect(resolveRegistryPort({ SERVICE_REGISTRY_PORT: '51000', GRPC_LISTEN_PORT: '50051' })).toBe(51000)
  })

  it('registers gRPC and Gateway listeners without a duplicate port setting', () => {
    expect(resolveRegistryPort({ GRPC_LISTEN_PORT: '50052' })).toBe(50052)
    expect(resolveRegistryPort({ SERVICE_PORT: '9101' })).toBe(9101)
  })

  it.each([{}, { GRPC_LISTEN_PORT: 'NaN' }, { SERVICE_PORT: '0' }, { SERVICE_PORT: '70000' }])(
    'fails closed for an absent or invalid listener %#',
    (environment) => expect(() => resolveRegistryPort(environment)).toThrow('exact service listener port')
  )
})

describe('NacosRegistryService startup logging', () => {
  const originalIp = process.env.SERVICE_REGISTRY_IP
  const originalPort = process.env.SERVICE_REGISTRY_PORT

  afterEach(() => {
    if (originalIp === undefined) delete process.env.SERVICE_REGISTRY_IP
    else process.env.SERVICE_REGISTRY_IP = originalIp

    if (originalPort === undefined) delete process.env.SERVICE_REGISTRY_PORT
    else process.env.SERVICE_REGISTRY_PORT = originalPort
  })

  it('records normal registry initialization at info rather than warning level', () => {
    process.env.SERVICE_REGISTRY_IP = '127.0.0.1'
    process.env.SERVICE_REGISTRY_PORT = '52066'
    const logger = {
      log: jest.fn(),
      warn: jest.fn()
    }

    new NacosRegistryService({} as never, logger as never)

    expect(logger.log).toHaveBeenCalledWith(
      'Initializing NacosRegistryService with IP: 127.0.0.1, Port: 52066'
    )
    expect(logger.warn).not.toHaveBeenCalled()
  })
})
