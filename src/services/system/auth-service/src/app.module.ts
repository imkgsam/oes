import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { authKeyConfig, tokenConfig } from '@oes/common/auth'
import { SERVICE_NAMES } from '@oes/common/constants'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { LoggingModule } from '@oes/common/logging'
import { RegistryModule } from '@oes/common/registry'
import { GrpcTransportModule } from '@oes/common/transport'
import { AuthModule } from './modules/auth/auth.module'

function resolveGrpcUrl(envKey: string, fallbackUrl: string): string | undefined {
  const configured = process.env[envKey]?.trim()
  if (configured) {
    return configured
  }

  if ((process.env.NODE_ENV ?? 'development') !== 'production') {
    return fallbackUrl
  }

  return undefined
}

@Module({
  imports: [
    RegistryModule,
    LoggingModule.forRoot({ serviceName: 'auth-service' }),
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      load: [tokenConfig, authKeyConfig]
    }),
    GrpcTransportModule.forRoot({
      services: {
        [SERVICE_NAMES.IDENTITY]: {
          serviceName: SERVICE_NAMES.IDENTITY,
          protoPath: resolveCommonProtoPath('identity_service/identity_query.proto'),
          packageName: 'identity_service',
          url: resolveGrpcUrl('IDENTITY_SERVICE_GRPC_URL', '127.0.0.1:50052')
        },
        [SERVICE_NAMES.PERMISSION]: {
          serviceName: SERVICE_NAMES.PERMISSION,
          protoPath: [
            resolveCommonProtoPath('permission_service/permission_check.proto'),
            resolveCommonProtoPath('permission_service/permission_management.proto'),
            resolveCommonProtoPath('permission_service/permission_access_summary.proto')
          ],
          packageName: 'permission_service',
          url: resolveGrpcUrl('PERMISSION_SERVICE_GRPC_URL', '127.0.0.1:50051')
        },
        [SERVICE_NAMES.NOTIFICATION]: {
          serviceName: SERVICE_NAMES.NOTIFICATION,
          protoPath: resolveCommonProtoPath('notification_service/notification.proto'),
          packageName: 'notification_service',
          url: resolveGrpcUrl('NOTIFICATION_SERVICE_GRPC_URL', '127.0.0.1:50053')
        }
      }
    }),
    AuthModule
  ]
})
/**
 * AppModule wires auth-service infrastructure and enables service-scoped logging metadata.
 */
export class AppModule {}
