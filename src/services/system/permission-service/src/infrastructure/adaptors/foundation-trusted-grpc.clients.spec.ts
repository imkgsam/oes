import { PERMISSION_FOUNDATION_TARGETS, requirePermissionFoundationTarget } from './foundation-trusted-grpc.clients'

/** Proves Permission's target-bound profiles are exact, immutable and wildcard-free. */
describe('Permission foundation trusted gRPC targets', () => {
  it('contains only the frozen target set', () => {
    expect(Object.keys(PERMISSION_FOUNDATION_TARGETS)).toEqual(['identity-service'])
    for (const target of Object.keys(PERMISSION_FOUNDATION_TARGETS) as Array<keyof typeof PERMISSION_FOUNDATION_TARGETS>) {
      const profile = requirePermissionFoundationTarget(target)
      expect(profile.audience).toBe(`urn:oes:service:${target}`)
      expect(profile.audience).not.toContain('*')
      expect(Object.isFrozen(profile)).toBe(true)
    }
  })
})
