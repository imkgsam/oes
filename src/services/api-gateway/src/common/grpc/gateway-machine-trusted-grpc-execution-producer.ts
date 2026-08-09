import { Metadata } from '@grpc/grpc-js'
import { TrustedGrpcMetadataProvider } from '@oes/common/authorization'
import { GatewayMachineWorkloadSourceCredentialProvider } from './gateway-machine-workload-source-credential.provider'

/** GatewayMachineTrustedGrpcExecutionProducer exchanges a private MACHINE root for exact INTERNAL Site tokens. */
export class GatewayMachineTrustedGrpcExecutionProducer {
  constructor(private readonly source: GatewayMachineWorkloadSourceCredentialProvider, private readonly metadata: TrustedGrpcMetadataProvider) {}
  async forInternalCall<T>(targetAudience: string, code: string, callback: (metadata: Metadata) => Promise<T>): Promise<T> { return this.source.run(async () => callback(await this.metadata.forInternalCall(targetAudience, [code]))) }
}
