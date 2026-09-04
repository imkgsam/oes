import { Test } from '@nestjs/testing'
import { HR_SERVICE, IDENTITY_SERVICE, PERMISSION_SERVICE } from '@oes/common/constants'
import { TENANT_LIFECYCLE_ACCESS_PORT } from '../../../../src/common/constants/injection-tokens'
import { ExternalServicesModule } from '../../../../src/infrastructure/modules/external-services.module'
import { HrServiceAdaptor } from '../../../../src/infrastructure/adaptors/hr-service.adaptor'
import { IdentityServiceAdaptor } from '../../../../src/infrastructure/adaptors/identity-service.adaptor'
import { PermissionServiceAdaptor } from '../../../../src/infrastructure/adaptors/permission-service.adaptor'
import { TenantOrgLifecycleGrpcAdaptor } from '../../../../src/infrastructure/adaptors/tenant-org-lifecycle.grpc.adaptor'
import {
  AUTH_FOUNDATION_TARGETS,
  AuthHrTrustedGrpcClient,
  AuthIdentityTrustedGrpcClient,
  AuthPermissionTrustedGrpcClient,
  AuthTenantOrgTrustedGrpcClient,
  requireAuthFoundationTarget
} from '../../../../src/infrastructure/adaptors/foundation-trusted-grpc.clients'

/** Proves Auth's target-bound profiles are exact, immutable and wildcard-free. */
describe('Auth foundation trusted gRPC targets', () => {
  it('contains only the frozen target set', () => {
    expect(Object.keys(AUTH_FOUNDATION_TARGETS)).toEqual([
      'identity-service',
      'permission-service',
      'hr-service',
      'tenant-org-service'
    ])
    for (const target of Object.keys(AUTH_FOUNDATION_TARGETS) as Array<
      keyof typeof AUTH_FOUNDATION_TARGETS
    >) {
      const profile = requireAuthFoundationTarget(target)
      expect(profile.audience).toBe(`urn:oes:service:${target}`)
      expect(profile.audience).not.toContain('*')
      expect(Object.isFrozen(profile)).toBe(true)
    }
  })

  it('resolves all four target-bound client providers from Auth runtime DI', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ExternalServicesModule]
    }).compile()
    for (const token of [
      AuthIdentityTrustedGrpcClient,
      AuthPermissionTrustedGrpcClient,
      AuthHrTrustedGrpcClient,
      AuthTenantOrgTrustedGrpcClient
    ]) {
      expect(moduleRef.get(token, { strict: false })).toBeDefined()
    }
    expect(moduleRef.get(IDENTITY_SERVICE)).toBeInstanceOf(IdentityServiceAdaptor)
    expect(moduleRef.get(PERMISSION_SERVICE)).toBeInstanceOf(PermissionServiceAdaptor)
    expect(moduleRef.get(HR_SERVICE)).toBeInstanceOf(HrServiceAdaptor)
    expect(moduleRef.get(TENANT_LIFECYCLE_ACCESS_PORT)).toBeInstanceOf(
      TenantOrgLifecycleGrpcAdaptor
    )
    await moduleRef.close()
  })
})
