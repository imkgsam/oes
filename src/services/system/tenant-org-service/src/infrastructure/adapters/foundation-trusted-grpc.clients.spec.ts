import {
  TENANTORG_FOUNDATION_TARGETS,
  requireTenantOrgFoundationTarget
} from './foundation-trusted-grpc.clients'

/** Proves TenantOrg's target-bound profiles are exact, immutable and wildcard-free. */
describe('TenantOrg foundation trusted gRPC targets', () => {
  it('contains only the frozen target set', () => {
    expect(Object.keys(TENANTORG_FOUNDATION_TARGETS)).toEqual([
      'auth-service',
      'identity-service',
      'permission-service',
      'hr-service'
    ])
    for (const target of Object.keys(TENANTORG_FOUNDATION_TARGETS) as Array<
      keyof typeof TENANTORG_FOUNDATION_TARGETS
    >) {
      const profile = requireTenantOrgFoundationTarget(target)
      expect(profile.audience).toBe(`urn:oes:service:${target}`)
      expect(profile.audience).not.toContain('*')
      expect(Object.isFrozen(profile)).toBe(true)
    }
  })
})
