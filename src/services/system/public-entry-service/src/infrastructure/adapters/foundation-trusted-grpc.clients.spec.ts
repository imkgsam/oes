import { PUBLICENTRY_FOUNDATION_TARGETS, requirePublicEntryFoundationTarget } from './foundation-trusted-grpc.clients'

/** Proves PublicEntry's target-bound profiles are exact, immutable and wildcard-free. */
describe('PublicEntry foundation trusted gRPC targets', () => {
  it('contains only the frozen target set', () => {
    expect(Object.keys(PUBLICENTRY_FOUNDATION_TARGETS)).toEqual(['identity-service','permission-service','hr-service','tenant-org-service'])
    for (const target of Object.keys(PUBLICENTRY_FOUNDATION_TARGETS) as Array<keyof typeof PUBLICENTRY_FOUNDATION_TARGETS>) {
      const profile = requirePublicEntryFoundationTarget(target)
      expect(profile.audience).toBe(`urn:oes:service:${target}`)
      expect(profile.audience).not.toContain('*')
      expect(Object.isFrozen(profile)).toBe(true)
    }
  })
})
