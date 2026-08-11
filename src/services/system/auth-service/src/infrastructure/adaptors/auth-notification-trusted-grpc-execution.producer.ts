import { Metadata } from '@grpc/grpc-js'
import {
  AsyncLocalTrustedExecutionContextAccessor,
  CertificateBoundExecutionTokenCache,
  createTrustedExecutionContext,
  TrustedExecutionRegistry,
  TrustedGrpcMetadataProvider
} from '@oes/common/authorization'
import { readLocalVerifiedWorkloadIdentity } from '@oes/common/transport'
import { AuthNotificationExecutionTokenExchangeClient } from './auth-notification-execution-token-exchange.client'
import { AuthNotificationMachineSourceCredentialProvider } from './auth-notification-machine-source-credential.provider'

const NOTIFICATION_AUDIENCE = 'urn:oes:service:notification-service'
const NOTIFICATION_AUTH_DISPATCH_CODE = 'notification.internal.auth.dispatch'

/** Produces exact SYSTEM MACHINE Notification metadata through the shared certificate-bound STS/cache path. */
export class AuthNotificationTrustedGrpcExecutionProducer {
  private readonly context = new AsyncLocalTrustedExecutionContextAccessor()
  private readonly metadata: TrustedGrpcMetadataProvider

  constructor(
    private readonly source: AuthNotificationMachineSourceCredentialProvider,
    private readonly exchange: AuthNotificationExecutionTokenExchangeClient
  ) {
    const issuer = required('AUTH_EXECUTION_ISSUER')
    const workloadIdentity = required('OES_WORKLOAD_SPIFFE_ID')
    this.metadata = new TrustedGrpcMetadataProvider({
      contextAccessor: this.context,
      registry: new TrustedExecutionRegistry({
        issuer,
        audiences: [NOTIFICATION_AUDIENCE],
        workloadIdentities: [workloadIdentity]
      }),
      tokenCache: new CertificateBoundExecutionTokenCache({ refreshMarginSeconds: 15 }),
      exchangeClient: exchange,
      sourceCredentialAccessor: source.accessor,
      localWorkloadIdentity: { getVerifiedWorkloadIdentity: async () => readLocalVerifiedWorkloadIdentity() }
    })
  }

  async createMetadata(requestId?: string, traceId?: string): Promise<Metadata> {
    const subject = required('AUTH_NOTIFICATION_MACHINE_PRINCIPAL_ID')
    const correlation = requireCorrelation(requestId, traceId)
    const context = createTrustedExecutionContext({
      subject,
      principalType: 'MACHINE',
      requestId: correlation.requestId,
      traceparent: correlation.traceparent
    })
    return this.context.run(context, () =>
      this.source.run(() => this.metadata.forInternalCall(NOTIFICATION_AUDIENCE, [NOTIFICATION_AUTH_DISPATCH_CODE]))
    )
  }
}

/** Requires deployment facts instead of silently substituting a local bearer or authority. */
function required(name: string): string {
  const value = process.env[name]
  if (!value || value.trim() !== value) throw new Error(`${name} is required`)
  return value
}

/** Converts the verified request trace into the canonical W3C form required by the shared provider. */
function requireCorrelation(requestId?: string, traceId?: string): { requestId: string; traceparent: string } {
  if (!requestId || requestId.trim() !== requestId) throw new Error('AUTH_NOTIFICATION_REQUEST_ID_REQUIRED')
  const normalizedTrace = traceId?.trim().toLowerCase()
  if (normalizedTrace && /^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/u.test(normalizedTrace)) {
    return { requestId, traceparent: normalizedTrace }
  }
  throw new Error('AUTH_NOTIFICATION_TRACEPARENT_REQUIRED')
}
