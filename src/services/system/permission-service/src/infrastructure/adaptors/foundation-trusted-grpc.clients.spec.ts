import { Test } from '@nestjs/testing'
import { IdentityAccountReferenceGrpcAdaptor } from './identity-account-reference.grpc.adaptor'
import { PermissionTrustedExecutionModule } from '../../modules/authorization/permission-trusted-execution.module'
import {
  PERMISSION_FOUNDATION_TARGETS,
  PermissionIdentityTrustedGrpcClient,
  requirePermissionFoundationTarget
} from './foundation-trusted-grpc.clients'

/** Proves Permission's target-bound profiles are exact, immutable and wildcard-free. */
describe('Permission foundation trusted gRPC targets', () => {
  it('contains only the frozen target set', () => {
    expect(Object.keys(PERMISSION_FOUNDATION_TARGETS)).toEqual(['identity-service'])
    for (const target of Object.keys(PERMISSION_FOUNDATION_TARGETS) as Array<
      keyof typeof PERMISSION_FOUNDATION_TARGETS
    >) {
      const profile = requirePermissionFoundationTarget(target)
      expect(profile.audience).toBe(`urn:oes:service:${target}`)
      expect(profile.audience).not.toContain('*')
      expect(Object.isFrozen(profile)).toBe(true)
    }
  })

  it("resolves Identity's target-bound provider and adapter through runtime DI", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PermissionTrustedExecutionModule],
      providers: [IdentityAccountReferenceGrpcAdaptor]
    }).compile()
    expect(moduleRef.get(PermissionIdentityTrustedGrpcClient)).toBeDefined()
    expect(moduleRef.get(IdentityAccountReferenceGrpcAdaptor)).toBeDefined()
    await moduleRef.close()
  })
})
