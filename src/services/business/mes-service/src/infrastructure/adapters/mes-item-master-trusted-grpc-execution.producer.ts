import { Metadata } from '@grpc/grpc-js'
import {
  AsyncLocalTrustedExecutionContextAccessor,
  CertificateBoundExecutionTokenCache,
  createTrustedExecutionContext,
  InternalTrustedGrpcCaller,
  ITEM_MASTER_CALLER_ERRORS,
  inboundExecutionTokenCredentialScope,
  TrustedExecutionRegistry,
  TrustedGrpcMetadataProvider
} from '@oes/common/authorization'
import { readLocalVerifiedWorkloadIdentity } from '@oes/common/transport'
import { MesItemMasterExecutionTokenExchangeClient } from './mes-item-master-execution-token-exchange.client'

const ITEM_MASTER_AUDIENCE = 'urn:oes:service:item-master-service'

/** Produces exact INTERNAL Item Master metadata from MES's SYSTEM MACHINE identity. */
export class MesItemMasterTrustedGrpcExecutionProducer {
  private readonly context = new AsyncLocalTrustedExecutionContextAccessor()
  private metadata?: TrustedGrpcMetadataProvider
  private caller?: InternalTrustedGrpcCaller

  constructor(private readonly exchange: MesItemMasterExecutionTokenExchangeClient) {}

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
      throw new Error(ITEM_MASTER_CALLER_ERRORS.CONTEXT_REQUIRED)
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

  private getCaller(): InternalTrustedGrpcCaller {
    return (this.caller ??= new InternalTrustedGrpcCaller(
      this.context,
      this.getMetadata(),
      inboundExecutionTokenCredentialScope,
      {
        executionSource: 'HUMAN_OBO',
        targetAudience: ITEM_MASTER_AUDIENCE,
        errors: ITEM_MASTER_CALLER_ERRORS
      }
    ))
  }

  private getMetadata(): TrustedGrpcMetadataProvider {
    return (this.metadata ??= new TrustedGrpcMetadataProvider({
      contextAccessor: this.context,
      registry: new TrustedExecutionRegistry({
        issuer: required('AUTH_EXECUTION_ISSUER'),
        audiences: [ITEM_MASTER_AUDIENCE],
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

/** Reads only verified inbound HUMAN facts while keeping the current-hop bearer opaque. */
function requireInbound() {
  try {
    return inboundExecutionTokenCredentialScope.requireVerifiedExecution()
  } catch {
    throw new Error(ITEM_MASTER_CALLER_ERRORS.CONTEXT_REQUIRED)
  }
}

/** Requires MES's deployment-owned trust facts and fails before transport on gaps. */
function required(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(ITEM_MASTER_CALLER_ERRORS.FOUNDATION_UNAVAILABLE)
  return value
}
