import { EnvironmentWorkloadIssuancePolicyRepository } from '../infrastructure/repositories/config/environment-workload-issuance-policy.repository'

describe('EnvironmentWorkloadIssuancePolicyRepository', () => {
  it('returns the one exact immutable workload, audience and scope policy', async () => {
    const repository = new EnvironmentWorkloadIssuancePolicyRepository(
      JSON.stringify([
        {
          originalWorkloadSpiffeId: 'spiffe://local.test/site-service',
          targetAudience: 'urn:oes:service:asset-service',
          permissionCodes: ['asset.internal.resolve'],
          scopeLevel: 'TENANT',
          tenantIds: ['tenant-1'],
          policyVersion: 'policy-v1'
        }
      ])
    )

    await expect(
      repository.findPolicy({
        originalWorkloadSpiffeId: 'spiffe://local.test/site-service',
        targetAudience: 'urn:oes:service:asset-service',
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1'
      })
    ).resolves.toEqual({
      originalWorkloadSpiffeId: 'spiffe://local.test/site-service',
      targetAudience: 'urn:oes:service:asset-service',
      permissionCodes: ['asset.internal.resolve'],
      scopeLevel: 'TENANT',
      tenantIds: ['tenant-1'],
      policyVersion: 'policy-v1'
    })
  })

  it.each([
    ['missing configuration', undefined],
    ['empty configuration', ''],
    ['invalid JSON', '{'],
    [
      'wildcard workload',
      policyConfiguration({ originalWorkloadSpiffeId: 'spiffe://local.test/*' })
    ],
    ['invalid audience', policyConfiguration({ targetAudience: 'https://asset.local.test' })],
    ['non-INTERNAL Code', policyConfiguration({ permissionCodes: ['asset.read'] })],
    [
      'non-canonical Codes',
      policyConfiguration({ permissionCodes: ['z.internal.resolve', 'a.internal.resolve'] })
    ],
    ['missing tenant binding', policyConfiguration({ tenantIds: undefined })],
    [
      'tenant binding on SYSTEM scope',
      policyConfiguration({ scopeLevel: 'SYSTEM', tenantIds: ['tenant-1'] })
    ],
    ['unsupported org binding', policyConfiguration({ orgId: 'org-1' })],
    [
      'ambiguous tenant tuple',
      JSON.stringify([
        policyRecord({ tenantIds: ['tenant-1'], policyVersion: 'policy-v1' }),
        policyRecord({ tenantIds: ['tenant-1', 'tenant-2'], policyVersion: 'policy-v2' })
      ])
    ]
  ])('fails during construction for %s', (_scenario, raw) => {
    expect(() => new EnvironmentWorkloadIssuancePolicyRepository(raw)).toThrow(
      'PERMISSION_WORKLOAD_ISSUANCE_POLICIES'
    )
  })
})

/** Builds one exact deployment policy with focused invalid-field overrides. */
function policyConfiguration(override: Record<string, unknown>): string {
  return JSON.stringify([policyRecord(override)])
}

/** Builds one exact workload policy record before serializing deployment configuration. */
function policyRecord(override: Record<string, unknown>): Record<string, unknown> {
  return {
    originalWorkloadSpiffeId: 'spiffe://local.test/site-service',
    targetAudience: 'urn:oes:service:asset-service',
    permissionCodes: ['asset.internal.resolve'],
    scopeLevel: 'TENANT',
    tenantIds: ['tenant-1'],
    policyVersion: 'policy-v1',
    ...override
  }
}
