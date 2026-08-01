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
      verifiedGatewayExchange: false
    }))

  it('recognizes trusted HUMAN management context and signed gateway exchange context', () => {
    const adapter = new ExternalApiKeyRequestContextAdapter({
      getContext: jest.fn().mockReturnValue({
        internalServiceName: 'api-gateway',
        operatorContext: {
          operator_type: 'MACHINE',
          tenant_id: 'tenant-1',
          operator_id: 'api-gateway',
          operator_roles: ['auth.internal.external_api_key.exchange']
        },
        requestId: 'req-1',
        traceId: 'trace-1'
      })
    } as any)

    expect(
      adapter.resolve()
    ).toEqual({
      trustedHuman: false,
      tenantId: 'tenant-1',
      operatorId: 'api-gateway',
      verifiedGatewayExchange: true,
      requestId: 'req-1',
      traceId: 'trace-1'
    })
  })
})
