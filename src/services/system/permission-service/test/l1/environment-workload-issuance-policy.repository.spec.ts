import { EnvironmentWorkloadIssuancePolicyRepository } from '../../src/infrastructure/repositories/config/environment-workload-issuance-policy.repository'

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

  it('fails closed when deployment policy contains wildcard or non-canonical Codes', async () => {
    const repository = new EnvironmentWorkloadIssuancePolicyRepository(
      JSON.stringify([
        {
          originalWorkloadSpiffeId: 'spiffe://local.test/*',
          targetAudience: 'urn:oes:service:asset-service',
          permissionCodes: ['z.internal.resolve', 'a.internal.resolve'],
          scopeLevel: 'SYSTEM',
          policyVersion: 'policy-v1'
        }
      ])
    )

    await expect(
      repository.findPolicy({
        originalWorkloadSpiffeId: 'spiffe://local.test/site-service',
        targetAudience: 'urn:oes:service:asset-service',
        scopeLevel: 'SYSTEM'
      })
    ).rejects.toThrow('PERMISSION_WORKLOAD_ISSUANCE_POLICIES')
  })
})
