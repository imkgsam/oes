import { Metadata } from '@grpc/grpc-js'
import { Test } from '@nestjs/testing'
import { AsyncLocalTransportPrivateSourceCredentialAccessor, AsyncLocalTrustedExecutionContextAccessor, CertificateBoundExecutionTokenCache, createTrustedExecutionContext, TransportPrivateSourceCredentialIssuer, TrustedExecutionRegistry, TrustedGrpcMetadataProvider } from '@oes/common/authorization'
import { CrmTrustedExecutionModule } from '../../src/modules/crm-trusted-execution.module'
import { PartyTrustedGrpcClient } from '../../src/infrastructure/adapters/party-trusted-grpc.client'
import { CrmPartyTrustedGrpcExecutionProducer } from '../../src/infrastructure/adapters/crm-party-trusted-grpc-execution.producer'

const audience = 'urn:oes:service:party-service'
const code = 'party.internal.get_tenant_party_by_id'
const traceparent = '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01'

describe('CRM Party trusted execution', () => {
  const originalEnv = process.env
  beforeEach(() => { process.env = { ...originalEnv, AUTH_EXECUTION_ISSUER: 'https://issuer.example', OES_WORKLOAD_SPIFFE_ID: 'spiffe://oes/crm-service', CRM_PARTY_MACHINE_PRINCIPAL_ID: 'machine-crm' } })
  afterAll(() => { process.env = originalEnv })

  it('resolves package-local DI providers through TestingModule', async () => {
    const module = await Test.createTestingModule({ imports: [CrmTrustedExecutionModule] }).compile()
    expect(module.get(PartyTrustedGrpcClient)).toBeInstanceOf(PartyTrustedGrpcClient)
    expect(module.get(CrmPartyTrustedGrpcExecutionProducer)).toBeInstanceOf(CrmPartyTrustedGrpcExecutionProducer)
    await module.close()
  })

  it.each([undefined, 'invalid-traceparent'])('fails closed when correlation is invalid', async (value) => {
    const producer = new CrmPartyTrustedGrpcExecutionProducer({ accessor: {} } as never, {} as never)
    await expect(producer.createMetadata(code, 'request-1', value)).rejects.toThrow('PARTY_CALLER_EXECUTION_CONTEXT_REQUIRED')
  })

  it('fails closed when deployment configuration is absent', async () => {
    delete process.env.AUTH_EXECUTION_ISSUER
    const producer = new CrmPartyTrustedGrpcExecutionProducer({ accessor: {}, run: async (callback: () => Promise<unknown>) => callback() } as never, {} as never)
    await expect(producer.createMetadata(code, 'request-1', traceparent)).rejects.toThrow('PARTY_CALLER_FOUNDATION_UNAVAILABLE')
  })

  it('accepts only a target-bound Bearer ET and rejects malformed exchange results', async () => {
    const context = new AsyncLocalTrustedExecutionContextAccessor()
    const credential = new AsyncLocalTransportPrivateSourceCredentialAccessor()
    const issuer = new TransportPrivateSourceCredentialIssuer()
    const exchange = { exchange: jest.fn(async () => ({ accessToken: 'eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJtYWNoaW5lIn0.signature', tokenType: 'Bearer', expiresAtUnixSeconds: 1_300, expiresInSeconds: 300, kid: 'kid', grantedPermissionCodes: [code], grantedAudience: audience })) }
    const provider = new TrustedGrpcMetadataProvider({ contextAccessor: context, registry: new TrustedExecutionRegistry({ issuer: 'https://issuer.example', audiences: [audience], workloadIdentities: ['spiffe://oes/crm-service'] }), tokenCache: new CertificateBoundExecutionTokenCache({ refreshMarginSeconds: 15, now: () => 1_000 }), exchangeClient: exchange, sourceCredentialAccessor: credential, localWorkloadIdentity: { getVerifiedWorkloadIdentity: async () => ({ spiffeId: 'spiffe://oes/crm-service', certificateThumbprint: 'A'.repeat(43) }) }, now: () => 1_000 })
    const root = createTrustedExecutionContext({ subject: 'machine-crm', principalType: 'MACHINE', requestId: 'request-1', traceparent })
    const metadata = await context.run(root, () => credential.run(issuer.issueVerifiedMachineOrDelegationCredential('source'), () => provider.forInternalCall(audience, [code])))
    expect(metadata.get('authorization')).toEqual(['Bearer eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJtYWNoaW5lIn0.signature'])
    expect(exchange.exchange).toHaveBeenCalledWith({ targetAudience: audience, requestedPermissionCodes: [code] }, expect.any(Metadata))
  })
})
