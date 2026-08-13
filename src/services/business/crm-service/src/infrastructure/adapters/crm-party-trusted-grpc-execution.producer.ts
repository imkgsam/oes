import { Metadata } from '@grpc/grpc-js'
import {
  AsyncLocalTrustedExecutionContextAccessor, CertificateBoundExecutionTokenCache,
  createTrustedExecutionContext, InternalTrustedGrpcCaller, TrustedExecutionRegistry, TrustedGrpcMetadataProvider
} from '@oes/common/authorization'
import { readLocalVerifiedWorkloadIdentity } from '@oes/common/transport'
import { CrmPartyExecutionTokenExchangeClient } from './crm-party-execution-token-exchange.client'
import { CrmPartyMachineSourceCredentialProvider } from './crm-party-machine-source-credential.provider'

const PARTY_AUDIENCE = 'urn:oes:service:party-service'
export class CrmPartyTrustedGrpcExecutionProducer {
  private readonly context = new AsyncLocalTrustedExecutionContextAccessor()
  private metadata?: TrustedGrpcMetadataProvider
  private caller?: InternalTrustedGrpcCaller
  constructor(private readonly source: CrmPartyMachineSourceCredentialProvider, private readonly exchange: CrmPartyExecutionTokenExchangeClient) {}
  private getMetadata(): TrustedGrpcMetadataProvider {
    return this.metadata ??= new TrustedGrpcMetadataProvider({
      contextAccessor: this.context,
      registry: new TrustedExecutionRegistry({ issuer: required('AUTH_EXECUTION_ISSUER'), audiences: [PARTY_AUDIENCE], workloadIdentities: [required('OES_WORKLOAD_SPIFFE_ID')] }),
      tokenCache: new CertificateBoundExecutionTokenCache({ refreshMarginSeconds: 15 }), exchangeClient: this.exchange,
      sourceCredentialAccessor: this.source.accessor,
      localWorkloadIdentity: { getVerifiedWorkloadIdentity: async () => readLocalVerifiedWorkloadIdentity() }
    })
  }
  private getCaller(): InternalTrustedGrpcCaller { return this.caller ??= new InternalTrustedGrpcCaller(this.context, this.getMetadata(), this.source) }
  async createMetadata(code: string, requestId?: string, traceparent?: string): Promise<Metadata> {
    const subject = required('CRM_PARTY_MACHINE_PRINCIPAL_ID')
    if (!requestId || requestId.trim() !== requestId || !traceparent || !/^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/u.test(traceparent)) throw new Error('PARTY_CALLER_EXECUTION_CONTEXT_REQUIRED')
    const context = createTrustedExecutionContext({ subject, principalType: 'MACHINE', requestId, traceparent })
    return this.context.run(context, () => this.getCaller().forInternalCall(code, async (metadata) => metadata))
  }
}
function required(name: string): string { const value = process.env[name]?.trim(); if (!value) throw new Error('PARTY_CALLER_FOUNDATION_UNAVAILABLE'); return value }
