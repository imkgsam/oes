import { Metadata } from '@grpc/grpc-js'
import {
  AsyncLocalTrustedExecutionContextAccessor,
  createTrustedExecutionContext,
  TrustedGrpcMetadataProvider
} from '@oes/common/authorization'
import { randomUUID } from 'node:crypto'
import { GatewayMachineWorkloadSourceCredentialProvider } from './gateway-machine-workload-source-credential.provider'

/** GatewayMachineTrustedGrpcExecutionProducer exchanges a private MACHINE root for exact INTERNAL Site tokens. */
export class GatewayMachineTrustedGrpcExecutionProducer {
  constructor(
    private readonly source: GatewayMachineWorkloadSourceCredentialProvider,
    private readonly metadata: TrustedGrpcMetadataProvider,
    private readonly context: AsyncLocalTrustedExecutionContextAccessor
  ) {}

  /** Creates the machine-root context and source scope before Common exchanges a target-bound INTERNAL token. */
  async forInternalCall<T>(targetAudience: string, code: string, callback: (metadata: Metadata) => Promise<T>): Promise<T> {
    const subject = process.env.GATEWAY_MACHINE_PRINCIPAL_ID?.trim()
    if (!subject) throw new Error('MACHINE_WORKLOAD_SOURCE_CONFIGURATION_REQUIRED')
    const requestId = randomUUID()
    const traceId = randomUUID().replace(/-/g, '')
    const parentId = randomUUID().replace(/-/g, '').slice(0, 16)
    const traceparent = `00-${traceId}-${parentId}-01`
    const trusted = createTrustedExecutionContext({ subject, principalType: 'MACHINE', requestId, traceparent })
    return this.context.run(trusted, () => this.source.run(async () => callback(await this.metadata.forInternalCall(targetAudience, [code]))))
  }
}
