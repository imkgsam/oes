import { Metadata } from '@grpc/grpc-js'
import { createVerifiedExecutionTokenContext } from './execution-token-context-bootstrap'

/** Builds the current source-credential carrier metadata for the STS bootstrap boundary. */
function carrierMetadata(): Metadata {
  const metadata = new Metadata()
  metadata.set('authorization', 'Bearer verified.session.access-token')
  return metadata
}

/** Proves STS startup binds Common mTLS verification to explicit source and Permission dependencies. */
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
  const sourceCredentialVerifier = {
    verify: jest.fn().mockResolvedValue({
      subject: 'account-1',
      principalType: 'HUMAN' as const,
      scopeLevel: 'TENANT' as const,
      tenantId: 'tenant-1',
      sessionId: 'session-1'
    })
  }
  const permissionDecisionResolver = {
    resolve: jest.fn().mockResolvedValue({
      allowed: true,
      kind: 'BUSINESS' as const,
      grantedPermissionCodes: ['AUTH.READ'],
      deniedPermissionCodes: [],
      principalType: 'HUMAN' as const,
      principalId: 'account-1',
      scopeLevel: 'TENANT' as const,
      tenantId: 'tenant-1',
      targetAudience: 'urn:oes:service:permission-service',
      requestedPermissionCodes: ['AUTH.READ'],
      decisionReference: 'decision-1',
      authzVersion: 'authz-1'
    })
  }

  it('boots a usable STS context only for a configured mTLS workload and carrier credential', async () => {
    const context = createVerifiedExecutionTokenContext(
      configuration,
      sourceCredentialVerifier,
      permissionDecisionResolver
    )
    const result = await context.resolve(
      {
        metadata: carrierMetadata(),
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
              operator_id: 'legacy-account',
              tenant_id: 'legacy-tenant',
              operator_roles: ['legacy.permission']
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
        }),
        execution: expect.objectContaining({
          subject: 'account-1',
          tenantId: 'tenant-1'
        }),
        authorizationDecision: expect.objectContaining({
          grantedPermissionCodes: ['AUTH.READ']
        })
      })
    )
  })

  it('fails closed when the call has no mTLS-authenticated peer facts', async () => {
    const context = createVerifiedExecutionTokenContext(
      configuration,
      sourceCredentialVerifier,
      permissionDecisionResolver
    )
    await expect(
      context.resolve(
        { metadata: carrierMetadata(), request: {} },
        {
          targetAudience: 'urn:oes:service:permission-service',
          requestedPermissionCodes: ['AUTH.READ']
        }
      )
    ).rejects.toThrow('transport boundary')
  })
})
