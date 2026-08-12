import { Metadata } from '@grpc/grpc-js'
import {
  AsyncLocalTrustedExecutionContextAccessor,
  createTrustedExecutionContext,
  TrustedGrpcMetadataProvider
} from '@oes/common/authorization'
import { GatewayMachineWorkloadSourceCredentialProvider } from './gateway-machine-workload-source-credential.provider'

export type VerifiedMachineTrace = Readonly<{ requestId: string; traceparent: string; tracestate?: string }>

/** GatewayMachineTrustedGrpcExecutionProducer exchanges a private MACHINE root for exact INTERNAL Site tokens. */
export class GatewayMachineTrustedGrpcExecutionProducer {
  constructor(
    private readonly source: GatewayMachineWorkloadSourceCredentialProvider,
    private readonly metadata: TrustedGrpcMetadataProvider,
    private readonly context: AsyncLocalTrustedExecutionContextAccessor
  ) {}

  /** Creates the machine-root context and source scope before Common exchanges a target-bound INTERNAL token. */
  async forInternalCall<T>(targetAudience: string, code: string, trace: VerifiedMachineTrace, callback: (metadata: Metadata) => Promise<T>): Promise<T> {
    const subject = process.env.GATEWAY_MACHINE_PRINCIPAL_ID?.trim()
    if (!subject) throw new Error('MACHINE_WORKLOAD_SOURCE_CONFIGURATION_REQUIRED')
    if (!trace.requestId.trim() || !isTraceparent(trace.traceparent)) throw new Error('MACHINE_TRACE_CONTEXT_REQUIRED')
    const trusted = createTrustedExecutionContext({ subject, principalType: 'MACHINE', requestId: trace.requestId, traceparent: trace.traceparent, tracestate: trace.tracestate })
    return this.context.run(trusted, () => this.source.run(async () => callback(await this.metadata.forInternalCall(targetAudience, [code]))))
  }

  /** Produces an exact BUSINESS MACHINE token for the three anonymous Public Entry routes. */
  async forBusinessCall<T>(targetAudience: string, code: string, trace: VerifiedMachineTrace, callback: (metadata: Metadata) => Promise<T>): Promise<T> {
    const subject = process.env.GATEWAY_MACHINE_PRINCIPAL_ID?.trim()
    if (!subject) throw new Error('MACHINE_WORKLOAD_SOURCE_CONFIGURATION_REQUIRED')
    if (!trace.requestId.trim() || !isTraceparent(trace.traceparent)) throw new Error('MACHINE_TRACE_CONTEXT_REQUIRED')
    const trusted = createTrustedExecutionContext({ subject, principalType: 'MACHINE', requestId: trace.requestId, traceparent: trace.traceparent, tracestate: trace.tracestate })
    return this.context.run(trusted, () => this.source.run(async () => callback(await this.metadata.forBusinessCall(targetAudience, [code]))))
  }
}

/** isTraceparent accepts only an active W3C trace context supplied by verified ingress. */
function isTraceparent(value: string): boolean {
  const match = /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/u.exec(value.trim())
  return !!match && !/^0+$/u.test(match[1]) && !/^0+$/u.test(match[2])
}
