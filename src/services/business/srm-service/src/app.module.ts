import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthorizationModule } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { LoggingModule } from '@oes/common/logging'
import { RegistryModule } from '@oes/common/registry'
import { GrpcTransportModule } from '@oes/common/transport'
import { SrmInfrastructureModule } from './modules/srm-infrastructure.module'
import { SrmManagementModule } from './modules/srm-management.module'
import { SrmQueryModule } from './modules/srm-query.module'

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

/** AppModule wires the srm-service phase 1 runtime modules and downstream party-service client metadata. */
@Module({
  imports: [
    LoggingModule.forRoot({ serviceName: 'srm-service' }),
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
        },
        [SERVICE_NAMES.ITEM_MASTER]: {
          serviceName: SERVICE_NAMES.ITEM_MASTER,
          protoPath: [resolveCommonProtoPath('item_master_service/item_master.proto')],
          packageName: 'item_master_service',
          url: resolveGrpcUrl('GRPC_SERVICE_ITEM_MASTER_URL', '127.0.0.1:50058')
        }
      }
    }),
    AuthorizationModule,
    RegistryModule,
    SrmInfrastructureModule,
    SrmQueryModule,
    SrmManagementModule
  ]
})
export class AppModule {}
