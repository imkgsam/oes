import { Metadata } from '@grpc/grpc-js'
import { AsyncLocalTrustedExecutionContextAccessor, CertificateBoundExecutionTokenCache, createTrustedExecutionContext, TrustedExecutionRegistry, TrustedGrpcMetadataProvider } from '@oes/common/authorization'
import { readLocalVerifiedWorkloadIdentity } from '@oes/common/transport'
import { TenantOrgPartyMachineSourceCredentialProvider } from './tenant-org-party-machine-source-credential.provider'
import { TenantOrgPartyExecutionTokenExchangeClient } from './tenant-org-party-execution-token-exchange.client'
export class TenantOrgPartyTrustedGrpcExecutionProducer {
  private readonly context = new AsyncLocalTrustedExecutionContextAccessor(); private metadata?: TrustedGrpcMetadataProvider
  constructor(private readonly source: TenantOrgPartyMachineSourceCredentialProvider, private readonly exchange: TenantOrgPartyExecutionTokenExchangeClient) {}
  private getMetadata() { return this.metadata ??= new TrustedGrpcMetadataProvider({ contextAccessor: this.context, registry: new TrustedExecutionRegistry({ issuer: req('AUTH_EXECUTION_ISSUER'), audiences: ['urn:oes:service:party-service'], workloadIdentities: [req('OES_WORKLOAD_SPIFFE_ID')] }), tokenCache: new CertificateBoundExecutionTokenCache({ refreshMarginSeconds: 15 }), exchangeClient: this.exchange, sourceCredentialAccessor: this.source.accessor, localWorkloadIdentity: { getVerifiedWorkloadIdentity: async () => readLocalVerifiedWorkloadIdentity() } }) }
  async createMetadata(code: string, requestId?: string, traceparent?: string): Promise<Metadata> { if (!requestId || !traceparent || !/^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/u.test(traceparent)) throw new Error('PARTY_CALLER_EXECUTION_CONTEXT_REQUIRED'); return this.context.run(createTrustedExecutionContext({ subject: req('TENANT_ORG_PARTY_MACHINE_PRINCIPAL_ID'), principalType: 'MACHINE', requestId, traceparent }), () => this.source.run(() => this.getMetadata().forInternalCall('urn:oes:service:party-service', [code]))) }
}
function req(name: string) { const value = process.env[name]?.trim(); if (!value) throw new Error('PARTY_CALLER_FOUNDATION_UNAVAILABLE'); return value }
