import { SERVICE_NAMES } from '@oes/common/constants'
import { basename } from 'path'
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

  it('loads permission access-summary proto for operator RBAC resolution', () => {
    const configs = buildGrpcServiceConfigs()
    const protoPaths = configs[SERVICE_NAMES.PERMISSION].protoPath

    expect(Array.isArray(protoPaths)).toBe(true)
    expect((protoPaths as string[]).map((protoPath) => basename(protoPath))).toEqual(
      expect.arrayContaining(['permission_management.proto', 'permission_access_summary.proto'])
    )
  })
})
