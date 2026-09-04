import { ExecutionTokenRegistry } from './execution-token-registry'

const policy = {
  spiffeId: 'spiffe://oes/mes-service',
  audiences: ['urn:oes:service:item-master-service'],
  humanObo: {
    selfAudience: 'urn:oes:service:mes-service',
    actorMachinePrincipalId: 'machine-mes',
    actorBindingId: 'binding-mes',
    actorBindingVersion: '1',
    targetAudiences: ['urn:oes:service:item-master-service']
  }
}

describe('ExecutionTokenRegistry HUMAN OBO policy', () => {
  it('resolves only the exact SPIFFE/self/target tuple', () => {
    const registry = new ExecutionTokenRegistry({
      issuer: 'https://auth.example',
      workloadPolicies: [policy]
    })
    expect(
      registry.resolveHumanOboActor(
        policy.spiffeId,
        policy.humanObo.selfAudience,
        policy.humanObo.targetAudiences[0]
      )
    ).toMatchObject({ actorBindingVersion: '1' })
    expect(() =>
      registry.resolveHumanOboActor(
        policy.spiffeId,
        'urn:oes:service:wms-service',
        policy.humanObo.targetAudiences[0]
      )
    ).toThrow('not permitted')
  })
  it('rejects non-canonical binding versions and duplicate self audiences at startup', () => {
    expect(
      () =>
        new ExecutionTokenRegistry({
          issuer: 'https://auth.example',
          workloadPolicies: [
            { ...policy, humanObo: { ...policy.humanObo, actorBindingVersion: '01' } }
          ]
        })
    ).toThrow('invalid')
    expect(
      () =>
        new ExecutionTokenRegistry({
          issuer: 'https://auth.example',
          workloadPolicies: [policy, { ...policy, spiffeId: 'spiffe://oes/other' }]
        })
    ).toThrow('invalid')
    expect(
      () =>
        new ExecutionTokenRegistry({
          issuer: 'https://auth.example',
          workloadPolicies: [{ ...policy, spiffeId: 'spiffe://*/mes-service' }]
        })
    ).toThrow('invalid')
  })

  it.each([
    ['empty target set', { targetAudiences: [] }],
    ['duplicate target', { targetAudiences: [policy.audiences[0], policy.audiences[0]] }],
    ['wildcard target', { targetAudiences: ['urn:oes:service:*'] }],
    ['target outside workload audiences', { targetAudiences: ['urn:oes:service:wms-service'] }],
    ['blank actor principal', { actorMachinePrincipalId: '' }],
    ['blank actor binding', { actorBindingId: ' binding-mes' }],
    ['unknown selector field', { callerActor: 'spoofed' }]
  ])('rejects %s at startup', (_label, override) => {
    expect(
      () =>
        new ExecutionTokenRegistry({
          issuer: 'https://auth.example',
          workloadPolicies: [{ ...policy, humanObo: { ...policy.humanObo, ...override } }]
        })
    ).toThrow('invalid')
  })
})
