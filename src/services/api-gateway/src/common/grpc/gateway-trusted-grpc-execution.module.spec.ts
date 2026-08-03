import { MODULE_METADATA } from '@nestjs/common/constants'
import { GatewayTrustedGrpcExecutionProducer } from './gateway-trusted-grpc-execution-producer'
import { GatewayTrustedGrpcExecutionModule } from './gateway-trusted-grpc-execution.module'

/** Verifies the shared Gateway composition exports the single producer consumed by Asset callers. */
describe('GatewayTrustedGrpcExecutionModule', () => {
  it('provides and exports the target-bound execution producer', () => {
    const providers = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      GatewayTrustedGrpcExecutionModule
    )
    const exports = Reflect.getMetadata(MODULE_METADATA.EXPORTS, GatewayTrustedGrpcExecutionModule)

    expect(providers).toContainEqual(
      expect.objectContaining({ provide: GatewayTrustedGrpcExecutionProducer })
    )
    expect(exports).toContain(GatewayTrustedGrpcExecutionProducer)
  })
})
