import { AUTH_FOUNDATION_TARGETS, requireAuthFoundationTarget } from './foundation-trusted-grpc.clients'

/** Proves Auth's target-bound profiles are exact, immutable and wildcard-free. */
describe('Auth foundation trusted gRPC targets', () => {
  it('contains only the frozen target set', () => {
    expect(Object.keys(AUTH_FOUNDATION_TARGETS)).toEqual(['identity-service','permission-service','hr-service','tenant-org-service'])
    for (const target of Object.keys(AUTH_FOUNDATION_TARGETS) as Array<keyof typeof AUTH_FOUNDATION_TARGETS>) {
      const profile = requireAuthFoundationTarget(target)
      expect(profile.audience).toBe(`urn:oes:service:${target}`)
      expect(profile.audience).not.toContain('*')
      expect(Object.isFrozen(profile)).toBe(true)
    }
  })
})
