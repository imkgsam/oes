import { MODULE_METADATA } from '@nestjs/common/constants'
import { GatewayTrustedGrpcExecutionModule } from '../../common/grpc'
import { HrServiceProxyModule } from './hr-service.module'

/** Verifies HR Asset callers share the Gateway trusted-execution provider composition. */
describe('HrServiceProxyModule', () => {
  it('imports the trusted gRPC execution composition', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, HrServiceProxyModule) ?? []

    expect(imports).toContain(GatewayTrustedGrpcExecutionModule)
  })
})
