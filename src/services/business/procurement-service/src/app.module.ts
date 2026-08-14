import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthorizationModule } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { LoggingModule } from '@oes/common/logging'
import { RegistryModule } from '@oes/common/registry'
import { GrpcTransportModule } from '@oes/common/transport'
import { ProcurementInfrastructureModule } from './modules/procurement-infrastructure.module'
import { ProcurementManagementModule } from './modules/procurement-management.module'
import { ProcurementQueryModule } from './modules/procurement-query.module'

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

/** AppModule wires the procurement-service phase 1 runtime modules and downstream item SRM client metadata. */
@Module({
  imports: [
    LoggingModule.forRoot({ serviceName: 'procurement-service' }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env']
    }),
    GrpcTransportModule.forRoot({
      services: {
        [SERVICE_NAMES.SRM]: {
          serviceName: SERVICE_NAMES.SRM,
          protoPath: [resolveCommonProtoPath('srm_service/srm.proto')],
          packageName: 'srm_service',
          url: resolveGrpcUrl('GRPC_SERVICE_SRM_URL', '127.0.0.1:50061')
        }
      }
    }),
    AuthorizationModule,
    RegistryModule,
    ProcurementInfrastructureModule,
    ProcurementQueryModule,
    ProcurementManagementModule
  ]
})
export class AppModule {}
