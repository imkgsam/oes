import { Test } from '@nestjs/testing'
import { HrEmployeeReferenceGrpcAdaptor } from '../../../../src/infrastructure/adaptors/hr-employee-reference.grpc.adaptor'
import { TenantReferenceGrpcAdaptor } from '../../../../src/infrastructure/adaptors/tenant-reference.grpc.adaptor'
import { IdentityTrustedExecutionModule } from '../../../../src/modules/identity-trusted-execution.module'
import {
  IDENTITY_FOUNDATION_TARGETS,
  IdentityHrTrustedGrpcClient,
  IdentityTenantOrgTrustedGrpcClient,
  requireIdentityFoundationTarget
} from '../../../../src/infrastructure/adaptors/foundation-trusted-grpc.clients'

/** Proves Identity's target-bound profiles are exact, immutable and wildcard-free. */
describe('Identity foundation trusted gRPC targets', () => {
  it('contains only the frozen target set', () => {
    expect(Object.keys(IDENTITY_FOUNDATION_TARGETS)).toEqual(['hr-service', 'tenant-org-service'])
    for (const target of Object.keys(IDENTITY_FOUNDATION_TARGETS) as Array<
      keyof typeof IDENTITY_FOUNDATION_TARGETS
    >) {
      const profile = requireIdentityFoundationTarget(target)
      expect(profile.audience).toBe(`urn:oes:service:${target}`)
      expect(profile.audience).not.toContain('*')
      expect(Object.isFrozen(profile)).toBe(true)
    }
  })

  it('resolves both target-bound client providers from Identity runtime DI', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [IdentityTrustedExecutionModule],
      providers: [HrEmployeeReferenceGrpcAdaptor, TenantReferenceGrpcAdaptor]
    }).compile()
    expect(moduleRef.get(IdentityHrTrustedGrpcClient)).toBeDefined()
    expect(moduleRef.get(IdentityTenantOrgTrustedGrpcClient)).toBeDefined()
    expect(moduleRef.get(HrEmployeeReferenceGrpcAdaptor)).toBeDefined()
    expect(moduleRef.get(TenantReferenceGrpcAdaptor)).toBeDefined()
    await moduleRef.close()
  })
})
