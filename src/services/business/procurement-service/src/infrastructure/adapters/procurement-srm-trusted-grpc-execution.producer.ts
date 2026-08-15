import { Metadata } from '@grpc/grpc-js'
import {
  AsyncLocalTrustedExecutionContextAccessor,
  CertificateBoundExecutionTokenCache,
  createTrustedExecutionContext,
  inboundExecutionTokenCredentialScope,
  InternalTrustedGrpcCaller,
  TrustedExecutionRegistry,
  TrustedGrpcMetadataProvider
} from '@oes/common/authorization'
import { readLocalVerifiedWorkloadIdentity } from '@oes/common/transport'
import { ProcurementSrmExecutionTokenExchangeClient } from './procurement-srm-execution-token-exchange.client'

export const SRM_CALLER_ERRORS = Object.freeze({
  CONTEXT_REQUIRED: 'SRM_CALLER_EXECUTION_CONTEXT_REQUIRED',
  FOUNDATION_UNAVAILABLE: 'SRM_CALLER_FOUNDATION_UNAVAILABLE',
  SOURCE_CREDENTIAL_INVALID: 'SRM_CALLER_SOURCE_CREDENTIAL_INVALID'
} as const)
const SRM_AUDIENCE = 'urn:oes:service:srm-service'

/** Prepares exact SRM HUMAN_OBO metadata for the Procurement production DI registration. */
export class ProcurementSrmTrustedGrpcExecutionProducer {
  private readonly context = new AsyncLocalTrustedExecutionContextAccessor()
  private metadata?: TrustedGrpcMetadataProvider
  private caller?: InternalTrustedGrpcCaller

  constructor(private readonly exchange: ProcurementSrmExecutionTokenExchangeClient) {}

  async createMetadata(
    code: string,
    tenantId: string,
    requestId?: string,
    traceparent?: string
  ): Promise<Metadata> {
    const inbound = requireInbound()
    if (
      !tenantId ||
      tenantId.trim() !== tenantId ||
      tenantId === 'SYSTEM' ||
      inbound.principalType !== 'HUMAN' ||
      inbound.tenantId !== tenantId ||
      !requestId ||
      requestId.trim() !== requestId ||
      !traceparent ||
      !/^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/u.test(traceparent)
    ) {
      throw new Error(SRM_CALLER_ERRORS.CONTEXT_REQUIRED)
    }
    const root = createTrustedExecutionContext({
      subject: inbound.subject,
      principalType: 'HUMAN',
      tenantId: inbound.tenantId,
      orgId: inbound.orgId,
      sessionId: inbound.sessionId,
      sessionTerminal: inbound.sessionTerminal,
      authzVersion: inbound.authzVersion,
      requestId,
      traceparent
    })
    return this.context.run(root, () =>
      this.getCaller().forInternalCall(code, async (metadata) => metadata)
    )
  }

  /** Composes Common's HUMAN_OBO caller with the SRM target profile. */
  private getCaller(): InternalTrustedGrpcCaller {
    return (this.caller ??= new InternalTrustedGrpcCaller(
      this.context,
      this.getMetadata(),
      inboundExecutionTokenCredentialScope,
      {
        executionSource: 'HUMAN_OBO',
        targetAudience: SRM_AUDIENCE,
        errors: SRM_CALLER_ERRORS
      }
    ))
  }

  /** Builds the deployment-owned SRM audience/certificate binding registry lazily. */
  private getMetadata(): TrustedGrpcMetadataProvider {
    return (this.metadata ??= new TrustedGrpcMetadataProvider({
      contextAccessor: this.context,
      registry: new TrustedExecutionRegistry({
        issuer: required('AUTH_EXECUTION_ISSUER'),
        audiences: [SRM_AUDIENCE],
        workloadIdentities: [required('OES_WORKLOAD_SPIFFE_ID')]
      }),
      tokenCache: new CertificateBoundExecutionTokenCache({ refreshMarginSeconds: 15 }),
      exchangeClient: this.exchange,
      sourceCredentialAccessor: inboundExecutionTokenCredentialScope.accessor,
      localWorkloadIdentity: {
        getVerifiedWorkloadIdentity: async () => readLocalVerifiedWorkloadIdentity()
      }
    }))
  }
}

/** Reads only guard-verified inbound HUMAN facts and keeps the bearer transport-private. */
function requireInbound() {
  try {
    return inboundExecutionTokenCredentialScope.requireVerifiedExecution()
  } catch {
    throw new Error(SRM_CALLER_ERRORS.CONTEXT_REQUIRED)
  }
}

/** Requires deployment-owned trust configuration without manufacturing defaults. */
function required(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(SRM_CALLER_ERRORS.FOUNDATION_UNAVAILABLE)
  return value
}
