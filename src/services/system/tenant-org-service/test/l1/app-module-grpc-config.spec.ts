import { SERVICE_NAMES } from '@oes/common/constants'
import { buildGrpcServiceConfigs } from '../../src/app.module'

describe('tenant-org AppModule gRPC config', () => {
  it('includes hr-service because tenant onboarding injects the HR employee onboarding adapter', () => {
    const configs = buildGrpcServiceConfigs()

    expect(configs[SERVICE_NAMES.HR]).toMatchObject({
      packageName: 'hr_service',
      serviceName: SERVICE_NAMES.HR,
      url: '127.0.0.1:50055'
    })
  })
})
