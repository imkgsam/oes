import {
  COLLABORATION_FOUNDATION_TARGETS,
  requireCollaborationFoundationTarget
} from './foundation-trusted-grpc.clients'

/** Proves Collaboration's target-bound profiles are exact, immutable and wildcard-free. */
describe('Collaboration foundation trusted gRPC targets', () => {
  it('contains only the frozen target set', () => {
    expect(Object.keys(COLLABORATION_FOUNDATION_TARGETS)).toEqual([
      'identity-service',
      'permission-service'
    ])
    for (const target of Object.keys(COLLABORATION_FOUNDATION_TARGETS) as Array<
      keyof typeof COLLABORATION_FOUNDATION_TARGETS
    >) {
      const profile = requireCollaborationFoundationTarget(target)
      expect(profile.audience).toBe(`urn:oes:service:${target}`)
      expect(profile.audience).not.toContain('*')
      expect(Object.isFrozen(profile)).toBe(true)
    }
  })
})
