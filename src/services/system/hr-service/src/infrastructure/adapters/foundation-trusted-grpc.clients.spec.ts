import { HR_FOUNDATION_TARGETS, requireHrFoundationTarget } from './foundation-trusted-grpc.clients'

/** Proves Hr's target-bound profiles are exact, immutable and wildcard-free. */
describe('Hr foundation trusted gRPC targets', () => {
  it('contains only the frozen target set', () => {
    expect(Object.keys(HR_FOUNDATION_TARGETS)).toEqual(['auth-service','identity-service','permission-service','tenant-org-service'])
    for (const target of Object.keys(HR_FOUNDATION_TARGETS) as Array<keyof typeof HR_FOUNDATION_TARGETS>) {
      const profile = requireHrFoundationTarget(target)
      expect(profile.audience).toBe(`urn:oes:service:${target}`)
      expect(profile.audience).not.toContain('*')
      expect(Object.isFrozen(profile)).toBe(true)
    }
  })
})
