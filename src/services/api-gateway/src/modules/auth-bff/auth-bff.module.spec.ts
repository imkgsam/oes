import { MODULE_METADATA } from '@nestjs/common/constants'
import { AuthBffModule } from './auth-bff.module'
import { TerminalDeviceAccessAdapter } from './infrastructure/downstream/terminal-device-service/terminal-device-access.adapter'
import { GatewayTrustedGrpcExecutionModule } from '../../common/grpc'
import { TrustedAuthApiKeyGrpcClient } from './infrastructure/downstream/auth-service/trusted-auth-api-key.grpc.client'

describe('AuthBffModule', () => {
  it('registers the terminal-device access adapter for PDA login runtime DI', () => {
    const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, AuthBffModule) ?? []

    expect(providers).toContain(TerminalDeviceAccessAdapter)
    expect(providers).toContain(TrustedAuthApiKeyGrpcClient)
  })

  it('imports the trusted gRPC execution composition for Asset callers', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, AuthBffModule) ?? []

    expect(imports).toContain(GatewayTrustedGrpcExecutionModule)
  })
})
