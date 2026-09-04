import { Metadata } from '@grpc/grpc-js'
import { Test } from '@nestjs/testing'
import { of } from 'rxjs'
import { AsyncLocalTransportPrivateSourceCredentialAccessor, AsyncLocalTrustedExecutionContextAccessor, CertificateBoundExecutionTokenCache, createTrustedExecutionContext, TransportPrivateSourceCredentialIssuer, TrustedExecutionRegistry, TrustedGrpcMetadataProvider } from '@oes/common/authorization'
import { CrmTrustedExecutionModule } from '../../src/modules/crm-trusted-execution.module'
import { PartyTrustedGrpcClient } from '../../src/infrastructure/adapters/party-trusted-grpc.client'
import { CrmPartyTrustedGrpcExecutionProducer } from '../../src/infrastructure/adapters/crm-party-trusted-grpc-execution.producer'
import { CrmPartyMachineSourceCredentialClient } from '../../src/infrastructure/adapters/crm-party-machine-source-credential.client'
import { CrmPartyMachineSourceCredentialProvider } from '../../src/infrastructure/adapters/crm-party-machine-source-credential.provider'
import { CrmPartyExecutionTokenExchangeClient } from '../../src/infrastructure/adapters/crm-party-execution-token-exchange.client'

const audience = 'urn:oes:service:party-service'
const code = 'party.internal.get_tenant_party_by_id'
const traceparent = '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01'

describe('CRM Party trusted execution', () => {
  const originalEnv = process.env
  beforeEach(() => { process.env = { ...originalEnv, AUTH_EXECUTION_ISSUER: 'https://issuer.example', OES_WORKLOAD_SPIFFE_ID: 'spiffe://oes/crm-service', CRM_PARTY_MACHINE_PRINCIPAL_ID: 'machine-crm' } })
  afterAll(() => { process.env = originalEnv })

  it('resolves the package-local dedicated client, source provider, exchange, and producer through TestingModule', async () => {
    const module = await Test.createTestingModule({ imports: [CrmTrustedExecutionModule] }).compile()
    for (const token of [PartyTrustedGrpcClient, CrmPartyMachineSourceCredentialClient, CrmPartyMachineSourceCredentialProvider, CrmPartyExecutionTokenExchangeClient, CrmPartyTrustedGrpcExecutionProducer]) expect(module.get(token)).toBeDefined()
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

  it('executes CRM source client and provider failures without entering a callback', async () => {
    process.env.CRM_PARTY_MACHINE_WORKLOAD_BINDING_ID = 'binding-crm'
    process.env.CRM_PARTY_MACHINE_WORKLOAD_BINDING_VERSION = '1'
    const client = new CrmPartyMachineSourceCredentialClient()
    const rpc = jest.fn(() => of({ tokenType: 'Bearer', sourceCredential: 'source' }))
    ;(client as any).getService = () => ({ issueMachineWorkloadSourceCredential: rpc })
    await expect(client.issue()).resolves.toBe('source')
    expect(rpc).toHaveBeenCalledWith({ machinePrincipalId: 'machine-crm', machineWorkloadBindingId: 'binding-crm', machineWorkloadBindingVersion: '1' }, expect.any(Metadata))
    ;(client as any).getService = () => ({ issueMachineWorkloadSourceCredential: () => of({ tokenType: 'Bearer', sourceCredential: '' }) })
    await expect(client.issue()).rejects.toThrow('PARTY_CALLER_SOURCE_CREDENTIAL_INVALID')
    ;(client as any).getService = () => ({ issueMachineWorkloadSourceCredential: () => { throw new Error('source credential rejected') } })
    const provider = new CrmPartyMachineSourceCredentialProvider(client)
    const callback = jest.fn(async () => undefined)
    await expect(provider.run(callback)).rejects.toThrow('source credential rejected')
    expect(callback).not.toHaveBeenCalled()
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
    const malformed = { exchange: jest.fn(async () => ({ accessToken: 'not.a.valid token', tokenType: 'Bearer', expiresAtUnixSeconds: 1_300, expiresInSeconds: 300, kid: 'kid', grantedPermissionCodes: [code], grantedAudience: audience })) }
    const malformedProvider = new TrustedGrpcMetadataProvider({ contextAccessor: context, registry: new TrustedExecutionRegistry({ issuer: 'https://issuer.example', audiences: [audience], workloadIdentities: ['spiffe://oes/crm-service'] }), tokenCache: new CertificateBoundExecutionTokenCache({ refreshMarginSeconds: 15, now: () => 1_000 }), exchangeClient: malformed, sourceCredentialAccessor: credential, localWorkloadIdentity: { getVerifiedWorkloadIdentity: async () => ({ spiffeId: 'spiffe://oes/crm-service', certificateThumbprint: 'A'.repeat(43) }) }, now: () => 1_000 })
    await expect(context.run(root, () => credential.run(issuer.issueVerifiedMachineOrDelegationCredential('source'), () => malformedProvider.forInternalCall(audience, [code])))).rejects.toThrow('invalid bearer credential')
  })
})
