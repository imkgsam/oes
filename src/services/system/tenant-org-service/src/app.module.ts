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

/** AppModule wires tenant-org-service modules and enables service-scoped logging metadata. */
@Module({
  imports: [
    LoggingModule.forRoot({ serviceName: 'tenant-org-service' }),
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
    PrismaModule,
    TenantOrgQueryModule,
    TenantOrgManagementModule
  ]
})
export class AppModule {}
