import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthorizationModule } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { LoggingModule } from '@oes/common/logging'
import { RegistryModule } from '@oes/common/registry'
import { GrpcTransportModule } from '@oes/common/transport'
import { WmsInfrastructureModule } from './modules/wms-infrastructure.module'
import { WmsManagementModule } from './modules/wms-management.module'
import { WmsQueryModule } from './modules/wms-query.module'

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

/** AppModule wires the wms-service phase 1 runtime modules and downstream procurement and item-master clients. */
@Module({
  imports: [
    LoggingModule.forRoot({ serviceName: 'wms-service' }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env']
    }),
    GrpcTransportModule.forRoot({
      services: {
        [SERVICE_NAMES.PROCUREMENT]: {
          serviceName: SERVICE_NAMES.PROCUREMENT,
          protoPath: [resolveCommonProtoPath('procurement_service/procurement.proto')],
          packageName: 'procurement_service',
          url: resolveGrpcUrl('GRPC_SERVICE_PROCUREMENT_URL', '127.0.0.1:50062')
        }
      }
    }),
    AuthorizationModule,
    RegistryModule,
    WmsInfrastructureModule,
    WmsQueryModule,
    WmsManagementModule
  ]
})
export class AppModule {}
