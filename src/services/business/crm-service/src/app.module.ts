import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthorizationModule } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { LoggingModule } from '@oes/common/logging'
import { RegistryModule } from '@oes/common/registry'
import { GrpcTransportModule } from '@oes/common/transport'
import { CrmInfrastructureModule } from './modules/crm-infrastructure.module'
import { CrmManagementModule } from './modules/crm-management.module'
import { CrmQueryModule } from './modules/crm-query.module'

function resolveGrpcUrl(envKey: string, fallbackUrl: string): string | undefined {
  const explicitUrl = process.env[envKey]?.trim()
  if (explicitUrl) {
    return explicitUrl
  }

  if ((process.env.NODE_ENV ?? 'development') !== 'production') {
    return fallbackUrl
  }

  return undefined
}

/** AppModule wires the crm-service phase 1 runtime modules and downstream party-service client metadata. */
@Module({
  imports: [
    LoggingModule.forRoot({ serviceName: 'crm-service' }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env']
    }),
    GrpcTransportModule.forRoot({
      services: {
        [SERVICE_NAMES.PARTY]: {
          serviceName: SERVICE_NAMES.PARTY,
          protoPath: [resolveCommonProtoPath('party_service/party.proto')],
          packageName: 'party_service',
          url: resolveGrpcUrl('GRPC_SERVICE_PARTY_URL', '127.0.0.1:50053')
        }
      }
    }),
    AuthorizationModule,
    RegistryModule,
    CrmInfrastructureModule,
    CrmQueryModule,
    CrmManagementModule
  ]
})
export class AppModule {}
