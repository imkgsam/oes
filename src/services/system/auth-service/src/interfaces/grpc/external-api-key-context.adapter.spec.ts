import { ExternalApiKeyRequestContextAdapter, resolveExternalApiKeyContext } from './external-api-key-context.adapter'

jest.mock('@oes/common/authorization', () => ({
  getAuthenticatedGrpcRequestContext: jest.fn((rpcData: any) => rpcData?.__context)
}))

describe('external API-key context adapter', () => {
  it('fails closed without authenticated runtime context', () =>
    expect(resolveExternalApiKeyContext({})).toEqual({
      trustedHuman: false,
      tenantId: '',
      operatorId: '',
      verifiedGatewayExchange: false,
      verifiedSecurityOperationsCompromise: false
    }))

  it('recognizes trusted HUMAN management context and signed gateway exchange context', () => {
    const adapter = new ExternalApiKeyRequestContextAdapter({
      getContext: jest.fn().mockReturnValue({
        operatorContext: {
          operator_type: 'HUMAN',
          tenant_id: 'tenant-1',
          operator_id: 'operator-1'
        },
        verifiedExecutionToken: {
          audience: 'urn:oes:service:auth-service',
          principalType: 'MACHINE',
          subject: 'api-gateway',
          clientId: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway',
          permissionCodes: ['auth.internal.external_api_key.exchange']
        },
        verifiedWorkloadIdentity: {
          spiffeId: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway'
        },
        requestId: 'req-1',
        traceId: 'trace-1'
      })
    } as any)

    expect(adapter.resolve()).toEqual({
      trustedHuman: true,
      tenantId: 'tenant-1',
      operatorId: 'operator-1',
      verifiedGatewayExchange: true,
      verifiedSecurityOperationsCompromise: false,
      workloadSubject: 'api-gateway',
      workloadClientId: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway',
      requestId: 'req-1',
      traceId: 'trace-1'
    })
  })

  it('recognizes the exact security-operations runner compromise context and rejects widened permissions', () => {
    const trusted = resolveExternalApiKeyContext({
      __context: {
        verifiedExecutionToken: {
          audience: 'urn:oes:service:auth-service',
          principalType: 'MACHINE',
          subject: 'security-operations-runner',
          clientId: 'spiffe://local.oes.internal/ns/oes/sa/security-operations-runner',
          permissionCodes: ['auth.internal.external_api_key.verifier_version.compromise']
        },
        verifiedWorkloadIdentity: {
          spiffeId: 'spiffe://local.oes.internal/ns/oes/sa/security-operations-runner'
        }
      }
    })
    expect(trusted).toEqual({
      trustedHuman: false,
      tenantId: '',
      operatorId: '',
      verifiedGatewayExchange: false,
      verifiedSecurityOperationsCompromise: true,
      workloadSubject: 'security-operations-runner',
      workloadClientId: 'spiffe://local.oes.internal/ns/oes/sa/security-operations-runner'
    })

    expect(
      resolveExternalApiKeyContext({
        __context: {
          verifiedExecutionToken: {
            audience: 'urn:oes:service:auth-service',
            principalType: 'MACHINE',
            subject: 'security-operations-runner',
            clientId: 'spiffe://local.oes.internal/ns/oes/sa/security-operations-runner',
            permissionCodes: [
              'auth.internal.external_api_key.verifier_version.compromise',
              'auth.internal.external_api_key.exchange'
            ]
          },
          verifiedWorkloadIdentity: {
            spiffeId: 'spiffe://local.oes.internal/ns/oes/sa/security-operations-runner'
          }
        }
      }).verifiedSecurityOperationsCompromise
    ).toBe(false)
  })
})
