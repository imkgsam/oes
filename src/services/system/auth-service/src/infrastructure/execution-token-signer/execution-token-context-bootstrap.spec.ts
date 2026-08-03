import {
  AsyncLocalTrustedExecutionContextAccessor,
  createTrustedExecutionContext
} from '@oes/common/authorization'
import { createVerifiedExecutionTokenContext } from './execution-token-context-bootstrap'

/** Proves the STS startup binding admits only Common's direct execution root plus verified mTLS identity. */
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
    const accessor = new AsyncLocalTrustedExecutionContextAccessor()
    const context = createVerifiedExecutionTokenContext(configuration, accessor)
    const result = await accessor.run(
      createTrustedExecutionContext({
        subject: 'account-1',
        principalType: 'HUMAN',
        tenantId: 'tenant-1',
        requestId: 'request-1',
        traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'
      }),
      () =>
        context.resolve(
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
    )

    expect(result).toEqual(
      expect.objectContaining({
        workloadIdentity: expect.objectContaining({
          spiffeId: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway'
        }),
        execution: expect.objectContaining({
          subject: 'account-1',
          tenantId: 'tenant-1',
          permissionCodes: ['AUTH.READ']
        })
      })
    )
  })

  it('fails closed when the call has no mTLS-authenticated peer facts', async () => {
    const accessor = new AsyncLocalTrustedExecutionContextAccessor()
    const context = createVerifiedExecutionTokenContext(configuration, accessor)
    await expect(
      accessor.run(
        createTrustedExecutionContext({
          subject: 'account-1',
          principalType: 'HUMAN',
          tenantId: 'tenant-1',
          requestId: 'request-1',
          traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'
        }),
        () =>
          context.resolve(
            { request: {} },
            {
              targetAudience: 'urn:oes:service:permission-service',
              requestedPermissionCodes: ['AUTH.READ']
            }
          )
      )
    ).rejects.toThrow('transport boundary')
  })
})
