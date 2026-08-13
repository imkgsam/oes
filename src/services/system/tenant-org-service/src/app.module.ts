import { Module } from '@nestjs/common'
import { AuthorizationModule } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { ConfigModule } from '@nestjs/config'
import { LoggingModule } from '@oes/common/logging'
import { GrpcTransportModule } from '@oes/common/transport'
import { PrismaModule } from './infrastructure/prisma/prisma.module'
import { TenantOrgManagementModule } from './modules/tenant-org-management/tenant-org-management.module'
import { TenantOrgQueryModule } from './modules/tenant-org-query/tenant-org-query.module'

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

/** buildGrpcServiceConfigs declares every downstream gRPC client used by tenant-org modules. */
export function buildGrpcServiceConfigs() {
  return {
    [SERVICE_NAMES.AUTH]: {
      serviceName: SERVICE_NAMES.AUTH,
      protoPath: [resolveCommonProtoPath('auth_service/auth.proto')],
      packageName: 'auth_service',
      url: resolveGrpcUrl('GRPC_SERVICE_AUTH_URL', '127.0.0.1:50050')
    },
    [SERVICE_NAMES.HR]: {
      serviceName: SERVICE_NAMES.HR,
      protoPath: [resolveCommonProtoPath('hr_service/hr.proto')],
      packageName: 'hr_service',
      url: resolveGrpcUrl('GRPC_SERVICE_HR_URL', '127.0.0.1:50055')
    },
    [SERVICE_NAMES.IDENTITY]: {
      serviceName: SERVICE_NAMES.IDENTITY,
      protoPath: [resolveCommonProtoPath('identity_service/identity_query.proto')],
      packageName: 'identity_service',
      url: resolveGrpcUrl('GRPC_SERVICE_IDENTITY_URL', '127.0.0.1:50052')
    },
    [SERVICE_NAMES.PERMISSION]: {
      serviceName: SERVICE_NAMES.PERMISSION,
      protoPath: [
        resolveCommonProtoPath('permission_service/permission_management.proto'),
        resolveCommonProtoPath('permission_service/permission_access_summary.proto')
      ],
      packageName: 'permission_service',
      url: resolveGrpcUrl('GRPC_SERVICE_PERMISSION_URL', '127.0.0.1:50051')
    }
  }
}

/** AppModule wires tenant-org-service modules and enables service-scoped logging metadata. */
@Module({
  imports: [
    LoggingModule.forRoot({ serviceName: 'tenant-org-service' }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env']
    }),
    GrpcTransportModule.forRoot({
      services: buildGrpcServiceConfigs()
    }),
    AuthorizationModule,
    PrismaModule,
    TenantOrgQueryModule,
    TenantOrgManagementModule
  ]
})
export class AppModule {}
