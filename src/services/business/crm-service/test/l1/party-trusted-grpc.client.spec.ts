import { CrmPartyTrustedGrpcExecutionProducer } from '../../src/infrastructure/adapters/crm-party-trusted-grpc-execution.producer'

describe('CRM Party trusted execution', () => {
  const originalEnv = process.env
  beforeEach(() => { process.env = { ...originalEnv, AUTH_EXECUTION_ISSUER: 'https://issuer.example', OES_WORKLOAD_SPIFFE_ID: 'spiffe://oes/crm-service', CRM_PARTY_MACHINE_PRINCIPAL_ID: 'machine-crm' } })
  afterAll(() => { process.env = originalEnv })
  it.each([undefined, 'invalid-traceparent'])('fails closed when correlation is invalid', async (traceparent) => {
    process.env.AUTH_EXECUTION_ISSUER = 'https://issuer.example'
    process.env.OES_WORKLOAD_SPIFFE_ID = 'spiffe://oes/crm-service'
    process.env.CRM_PARTY_MACHINE_PRINCIPAL_ID = 'machine-crm'
    const producer = new CrmPartyTrustedGrpcExecutionProducer({ accessor: {} } as never, {} as never)
    await expect(producer.createMetadata('party.internal.get_tenant_party_by_id', 'request-1', traceparent)).rejects.toThrow('PARTY_CALLER_EXECUTION_CONTEXT_REQUIRED')
  })
  it('fails closed when deployment configuration is absent', async () => { delete process.env.AUTH_EXECUTION_ISSUER; const producer = new CrmPartyTrustedGrpcExecutionProducer({ accessor: {}, run: async (callback: () => Promise<unknown>) => callback() } as never, {} as never); await expect(producer.createMetadata('party.internal.get_tenant_party_by_id', 'request-1', '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01')).rejects.toThrow('PARTY_CALLER_FOUNDATION_UNAVAILABLE') })
})
