import { VerifiedExecutionTokenContextProvider } from './verified-execution-token-context.provider'

/** Proves STS context is composed from Common's verified execution root and mTLS identity without legacy reconstruction. */
describe('VerifiedExecutionTokenContextProvider', () => {
  const workload = {
    getVerifiedWorkloadIdentity: jest.fn().mockResolvedValue({
      spiffeId: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway',
      certificateThumbprint: 'A'.repeat(43)
    })
  }

  const executionContext = {
    requireCurrent: jest.fn(() =>
      Object.freeze({
        subject: 'account-1',
        principalType: 'HUMAN' as const,
        tenantId: 'tenant-1',
        orgId: 'org-1',
        sessionId: 'session-1',
        authzVersion: 7,
        requestId: 'request-1',
        traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'
      })
    )
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('consumes Common verified execution facts directly and ignores hostile signed-operator reconstruction inputs', async () => {
    const provider = new VerifiedExecutionTokenContextProvider(workload, executionContext)
    const result = await provider.resolve(
      {
        request: {
          subject: 'body-account',
          tenantId: 'body-tenant',
          permissionCodes: ['body.permission'],
          __oesOperatorContext: {
            operatorContext: {
              operator_id: 'legacy-account',
              operator_type: 'MACHINE',
              tenant_id: 'legacy-tenant',
              org_id: 'legacy-org',
              operator_roles: ['legacy.permission'],
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
        permissionCodes: ['AUTH.READ'],
        sessionId: 'session-1',
        authzVersion: 7
      }
    })
    expect(executionContext.requireCurrent).toHaveBeenCalledTimes(1)
  })

  it('fails closed when Common has no verified execution context even if legacy operator facts are attached', async () => {
    const unavailableContext = {
      requireCurrent: jest.fn(() => {
        throw new Error('Trusted execution context is required')
      })
    }
    await expect(
      new VerifiedExecutionTokenContextProvider(workload, unavailableContext).resolve(
        {
          request: {
            __oesOperatorContext: {
              operatorContext: {
                operator_id: 'legacy-account',
                operator_type: 'HUMAN',
                tenant_id: 'legacy-tenant',
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
    ).rejects.toThrow('verified execution context is unavailable')
  })

  it('derives the frozen API-KEY root MACHINE execution context without signed operator metadata', async () => {
    const unavailableContext = {
      requireCurrent: jest.fn(() => {
        throw new Error('Trusted execution context is required')
      })
    }
    await expect(
      new VerifiedExecutionTokenContextProvider(workload, unavailableContext).resolve(
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
