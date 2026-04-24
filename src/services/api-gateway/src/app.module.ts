import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { CommonJwtModule } from '@oes/common/auth'
import { GatewayPermissionGuard } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { LoggingModule } from '@oes/common/logging'
import { RegistryModule } from '@oes/common/registry'
import { GrpcTransportModule } from '@oes/common/transport'
import { gatewayConfig } from './config/gateway.config'
import { HealthModule } from './health/health.module'
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware'
import { GatewaySessionAuthGuard } from './common/guards/gateway-session-auth.guard'
import { AuthBffModule } from './modules/auth-bff/auth-bff.module'
import { HrServiceProxyModule } from './modules/hr-service/hr-service.module'
import { PermissionServiceProxyModule } from './modules/permission-service/permission-service.module'
import { TenantOrgServiceProxyModule } from './modules/tenant-org-service/tenant-org-service.module'
import { GatewayExceptionFilter } from './common/filters/gateway-exception.filter'
import { ResponseTransformInterceptor } from './common/interceptors/response.interceptor'
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor'

@Module({
  imports: [
    RegistryModule,
    ConfigModule.forRoot({ isGlobal: true, load: [gatewayConfig] }),
    LoggingModule.forRoot({ serviceName: 'api-gateway' }),
    CommonJwtModule,

    GrpcTransportModule.forRoot({
      services: {
        [SERVICE_NAMES.AUTH]: {
          serviceName: SERVICE_NAMES.AUTH,
          protoPath: resolveCommonProtoPath('auth_service/auth.proto'),
          packageName: 'auth_service',
          url:
            process.env.AUTH_SERVICE_HOST && process.env.AUTH_SERVICE_PORT
              ? `${process.env.AUTH_SERVICE_HOST}:${process.env.AUTH_SERVICE_PORT}`
              : undefined
        },
        [SERVICE_NAMES.ASSET]: {
          serviceName: SERVICE_NAMES.ASSET,
          protoPath: resolveCommonProtoPath('asset_service/asset.proto'),
          packageName: 'asset_service',
          url:
            process.env.ASSET_SERVICE_HOST && process.env.ASSET_SERVICE_PORT
              ? `${process.env.ASSET_SERVICE_HOST}:${process.env.ASSET_SERVICE_PORT}`
              : 'localhost:50056'
        },
        [SERVICE_NAMES.PERMISSION]: {
          serviceName: SERVICE_NAMES.PERMISSION,
          protoPath: [
            resolveCommonProtoPath('permission_service/policy_management.proto'),
            resolveCommonProtoPath('permission_service/permission_management.proto'),
            resolveCommonProtoPath('permission_service/permission_check.proto'),
            resolveCommonProtoPath('permission_service/permission_access_summary.proto')
          ],
          packageName: 'permission_service',
          url:
            process.env.PERMISSION_SERVICE_HOST && process.env.PERMISSION_SERVICE_PORT
              ? `${process.env.PERMISSION_SERVICE_HOST}:${process.env.PERMISSION_SERVICE_PORT}`
              : undefined
        },
        [SERVICE_NAMES.HR]: {
          serviceName: SERVICE_NAMES.HR,
          protoPath: resolveCommonProtoPath('hr_service/hr.proto'),
          packageName: 'hr_service',
          url:
            process.env.HR_SERVICE_HOST && process.env.HR_SERVICE_PORT
              ? `${process.env.HR_SERVICE_HOST}:${process.env.HR_SERVICE_PORT}`
              : 'localhost:50055'
        },
        [SERVICE_NAMES.IDENTITY]: {
          serviceName: SERVICE_NAMES.IDENTITY,
          protoPath: resolveCommonProtoPath('identity_service/identity_query.proto'),
          packageName: 'identity_service',
          url:
            process.env.IDENTITY_SERVICE_HOST && process.env.IDENTITY_SERVICE_PORT
              ? `${process.env.IDENTITY_SERVICE_HOST}:${process.env.IDENTITY_SERVICE_PORT}`
              : 'localhost:50052'
        },
        [SERVICE_NAMES.PARTY]: {
          serviceName: SERVICE_NAMES.PARTY,
          protoPath: resolveCommonProtoPath('party_service/party.proto'),
          packageName: 'party_service',
          url:
            process.env.PARTY_SERVICE_HOST && process.env.PARTY_SERVICE_PORT
              ? `${process.env.PARTY_SERVICE_HOST}:${process.env.PARTY_SERVICE_PORT}`
              : 'localhost:50053'
        },
        [SERVICE_NAMES.TENANT_ORG]: {
          serviceName: SERVICE_NAMES.TENANT_ORG,
          protoPath: resolveCommonProtoPath('tenant_org_service/tenant_org.proto'),
          packageName: 'tenant_org_service',
          url:
            process.env.TENANT_ORG_SERVICE_HOST && process.env.TENANT_ORG_SERVICE_PORT
              ? `${process.env.TENANT_ORG_SERVICE_HOST}:${process.env.TENANT_ORG_SERVICE_PORT}`
              : 'localhost:50054'
        }
      },
      defaultPoolConfig: { minSize: 3, maxSize: 3 }
    }),
    GrpcTransportModule.forFeature([
      SERVICE_NAMES.PERMISSION,
      SERVICE_NAMES.PARTY,
      SERVICE_NAMES.TENANT_ORG
    ]),

    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
          limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10)
        }
      ]
    }),

    HealthModule,
    AuthBffModule,
    HrServiceProxyModule,
    PermissionServiceProxyModule,
    TenantOrgServiceProxyModule
  ],
  providers: [
    GatewayPermissionGuard,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: GatewaySessionAuthGuard },
    { provide: APP_GUARD, useExisting: GatewayPermissionGuard },

    GatewayExceptionFilter,
    ResponseTransformInterceptor,
    TimeoutInterceptor
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*')
  }
}
