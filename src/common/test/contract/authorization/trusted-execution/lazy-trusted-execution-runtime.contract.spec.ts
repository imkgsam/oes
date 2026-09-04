import { GrpcJsVerifiedPeerAdapter } from '../../../../src/transport'
import { createLazyTrustedExecutionRuntime } from '../../../../src/authorization/trusted-execution/lazy-trusted-execution-runtime'

const PUBLIC_ENTRY_SPIFFE_ID = 'spiffe://local.oes.internal/ns/oes/sa/public-entry-service'

describe('createLazyTrustedExecutionRuntime', () => {
  it('preserves both generic and issuance-specific transport identity operations', () => {
    const runtime = createLazyTrustedExecutionRuntime('urn:oes:service:auth-service', {})

    expect(runtime.workloadIdentityProvider.getVerifiedWorkloadIdentity).toEqual(
      expect.any(Function)
    )
    expect(runtime.workloadIdentityProvider.getVerifiedWorkloadIssuanceIdentity).toEqual(
      expect.any(Function)
    )
  })

  it('admits Public Entry to the Auth lazy registry only through the exact Auth audience', async () => {
    jest.spyOn(GrpcJsVerifiedPeerAdapter.prototype, 'resolveVerifiedPeer').mockResolvedValue({
      transportVerified: true,
      spiffeId: PUBLIC_ENTRY_SPIFFE_ID,
      certificateDer: Buffer.from('public-entry-verified-leaf')
    })
    const baseEnvironment = {
      AUTH_EXECUTION_ISSUER: 'https://issuer.local.oes.internal'
    }
    const denied = createLazyTrustedExecutionRuntime('urn:oes:service:auth-service', {
      ...baseEnvironment,
      AUTH_EXECUTION_WORKLOAD_POLICIES: JSON.stringify([
        {
          spiffeId: PUBLIC_ENTRY_SPIFFE_ID,
          audiences: ['urn:oes:service:identity-service']
        }
      ])
    })
    expect(() => denied.workloadIdentityProvider.getVerifiedWorkloadIdentity({})).toThrow(
      'Trusted execution workload identity registry must not be empty'
    )

    const admitted = createLazyTrustedExecutionRuntime('urn:oes:service:auth-service', {
      ...baseEnvironment,
      AUTH_EXECUTION_WORKLOAD_POLICIES: JSON.stringify([
        {
          spiffeId: PUBLIC_ENTRY_SPIFFE_ID,
          audiences: [
            'urn:oes:service:auth-service',
            'urn:oes:service:identity-service',
            'urn:oes:service:permission-service'
          ]
        }
      ])
    })

    await expect(
      admitted.workloadIdentityProvider.getVerifiedWorkloadIdentity({})
    ).resolves.toEqual(expect.objectContaining({ spiffeId: PUBLIC_ENTRY_SPIFFE_ID }))
  })
})
