describe('HrEmployeeReferenceGrpcAdaptor wiring', () => {
  const originalHrUrl = process.env.GRPC_SERVICE_HR_URL

  afterEach(() => {
    if (originalHrUrl === undefined) {
      delete process.env.GRPC_SERVICE_HR_URL
    } else {
      process.env.GRPC_SERVICE_HR_URL = originalHrUrl
    }

    jest.resetModules()
  })

  it('defaults identity-to-hr gRPC wiring to the hr-service local port', () => {
    delete process.env.GRPC_SERVICE_HR_URL

    const { HR_GRPC_CLIENT_OPTIONS } = require('../../src/infrastructure/adaptors/hr-employee-reference.grpc.adaptor')

    expect(HR_GRPC_CLIENT_OPTIONS.url).toBe('127.0.0.1:50055')
  })

  it('allows overriding the hr-service gRPC target through environment config', () => {
    process.env.GRPC_SERVICE_HR_URL = '127.0.0.1:65055'

    const { HR_GRPC_CLIENT_OPTIONS } = require('../../src/infrastructure/adaptors/hr-employee-reference.grpc.adaptor')

    expect(HR_GRPC_CLIENT_OPTIONS.url).toBe('127.0.0.1:65055')
  })
})
