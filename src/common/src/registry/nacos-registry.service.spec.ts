import { resolveRegistryPort } from './nacos-registry.service'

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
