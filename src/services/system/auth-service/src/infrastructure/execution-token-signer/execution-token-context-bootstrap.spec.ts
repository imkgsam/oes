jest.mock('@oes/common/authorization', () => ({
  TrustedExecutionRegistry: jest.fn().mockImplementation((options) => ({
    assertWorkloadIdentity: (spiffeId: string) => {
      if (!options.workloadIdentities.includes(spiffeId)) {
        throw new Error('Workload identity is not registered')
      }
    }
  }))
}))

import { createVerifiedExecutionTokenContext } from './execution-token-context-bootstrap'

/** Proves the STS startup binding admits only Common-derived mTLS identity plus attached verified operator facts. */
describe('createVerifiedExecutionTokenContext', () => {
  const configuration = {
    issuer: 'https://issuer.local.oes.internal',
    workloadPolicies: [
      {
        spiffeId: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway',
        audiences: ['urn:oes:service:permission-service']
      }
    ]
  }

  it('boots a usable STS context only for a configured mTLS workload', async () => {
    const context = createVerifiedExecutionTokenContext(configuration)
    const result = await context.resolve(
      {
        getAuthContext: () => ({
          transportSecurityType: 'ssl',
          sslPeerCertificate: {
            raw: Buffer.from('verified-client-leaf'),
            subjectaltname: 'URI:spiffe://local.oes.internal/ns/oes/sa/api-gateway'
          }
        }),
        request: {
          __oesOperatorContext: {
            operatorContext: {
              operator_id: 'account-1',
              operator_type: 'HUMAN',
              tenant_id: 'tenant-1',
              operator_roles: ['AUTH.READ']
            }
          }
        }
      },
      {
        targetAudience: 'urn:oes:service:permission-service',
        requestedPermissionCodes: ['AUTH.READ']
      }
    )

    expect(result).toEqual(
      expect.objectContaining({
        workloadIdentity: expect.objectContaining({
          spiffeId: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway'
        })
      })
    )
  })

  it('fails closed when the call has no mTLS-authenticated peer facts', async () => {
    const context = createVerifiedExecutionTokenContext(configuration)
    await expect(
      context.resolve(
        { request: { __oesOperatorContext: { operatorContext: {} } } },
        {
          targetAudience: 'urn:oes:service:permission-service',
          requestedPermissionCodes: ['AUTH.READ']
        }
      )
    ).rejects.toThrow('transport boundary')
  })
})
