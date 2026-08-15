import { IDENTITY_FOUNDATION_TARGETS, requireIdentityFoundationTarget } from './foundation-trusted-grpc.clients'

/** Proves Identity's target-bound profiles are exact, immutable and wildcard-free. */
describe('Identity foundation trusted gRPC targets', () => {
  it('contains only the frozen target set', () => {
    expect(Object.keys(IDENTITY_FOUNDATION_TARGETS)).toEqual(['hr-service','tenant-org-service'])
    for (const target of Object.keys(IDENTITY_FOUNDATION_TARGETS) as Array<keyof typeof IDENTITY_FOUNDATION_TARGETS>) {
      const profile = requireIdentityFoundationTarget(target)
      expect(profile.audience).toBe(`urn:oes:service:${target}`)
      expect(profile.audience).not.toContain('*')
      expect(Object.isFrozen(profile)).toBe(true)
    }
  })
})
