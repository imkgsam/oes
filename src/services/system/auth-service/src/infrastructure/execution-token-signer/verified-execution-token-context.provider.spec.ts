import { VerifiedExecutionTokenContextProvider } from './verified-execution-token-context.provider'

/** Proves STS context is composed from Common's verified mTLS identity and signed operator facts, never from the proto body. */
describe('VerifiedExecutionTokenContextProvider', () => {
  const workload = {
    getVerifiedWorkloadIdentity: jest.fn().mockResolvedValue({
      spiffeId: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway',
      certificateThumbprint: 'A'.repeat(43)
    })
  }

  it('resolves only Common-attached verified operator facts and a verified workload identity', async () => {
    const provider = new VerifiedExecutionTokenContextProvider(workload)
    const result = await provider.resolve(
      {
        request: {
          __oesOperatorContext: {
            operatorContext: {
              operator_id: 'account-1',
              operator_type: 'HUMAN',
              tenant_id: 'tenant-1',
              org_id: 'org-1',
              operator_roles: ['AUTH.READ'],
              issued_at: '2026-07-29T00:00:00Z',
              expires_at: '2026-07-30T00:00:00Z',
              issuer: 'identity-service',
              signature: 'verified-by-common'
            }
          }
        }
      },
      {
        targetAudience: 'urn:oes:service:permission-service',
        requestedPermissionCodes: ['AUTH.READ']
      }
    )

    expect(result).toEqual({
      workloadIdentity: expect.objectContaining({
        spiffeId: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway'
      }),
      execution: {
        subject: 'account-1',
        principalType: 'HUMAN',
        tenantId: 'tenant-1',
        orgId: 'org-1',
        permissionCodes: ['AUTH.READ']
      }
    })
  })

  it('fails closed when Common did not attach a verified operator context', async () => {
    await expect(
      new VerifiedExecutionTokenContextProvider(workload).resolve(
        { request: {} },
        {
          targetAudience: 'urn:oes:service:permission-service',
          requestedPermissionCodes: ['AUTH.READ']
        }
      )
    ).rejects.toThrow('verified execution context is unavailable')
  })

  it('fails closed when trusted operator roles cannot bound requested permissions', async () => {
    await expect(
      new VerifiedExecutionTokenContextProvider(workload).resolve(
        {
          request: {
            __oesOperatorContext: {
              operatorContext: {
                operator_id: 'account-1',
                operator_type: 'HUMAN',
                tenant_id: 'tenant-1',
                operator_roles: [],
                issued_at: '2026-07-29T00:00:00Z',
                expires_at: '2026-07-30T00:00:00Z',
                issuer: 'identity-service',
                signature: 'verified-by-common'
              }
            }
          }
        },
        {
          targetAudience: 'urn:oes:service:permission-service',
          requestedPermissionCodes: ['AUTH.READ']
        }
      )
    ).rejects.toThrow('verified execution permission context is unavailable')
  })

  it('derives the frozen API-KEY root MACHINE execution context without signed operator metadata', async () => {
    await expect(
      new VerifiedExecutionTokenContextProvider(workload).resolve(
        { request: {} },
        {
          targetAudience: 'urn:oes:service:auth-service',
          requestedPermissionCodes: ['auth.internal.external_api_key.exchange']
        }
      )
    ).resolves.toEqual({
      workloadIdentity: expect.objectContaining({
        spiffeId: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway'
      }),
      execution: {
        subject: 'api-gateway',
        principalType: 'MACHINE',
        tenantId: 'SYSTEM',
        permissionCodes: ['auth.internal.external_api_key.exchange']
      }
    })
  })
})
