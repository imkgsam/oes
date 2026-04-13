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
import { GatewayJwtAuthGuard } from '@oes/common/auth'
import { GrpcTransportModule } from '@oes/common/transport'
import { gatewayConfig } from './config/gateway.config'
import { HealthModule } from './health/health.module'
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware'
import { AuthBffModule } from './modules/auth-bff/auth-bff.module'
import { PermissionServiceProxyModule } from './modules/permission-service/permission-service.module'
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
        [SERVICE_NAMES.PERMISSION]: {
          serviceName: SERVICE_NAMES.PERMISSION,
          protoPath: [
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
        [SERVICE_NAMES.IDENTITY]: {
          serviceName: SERVICE_NAMES.IDENTITY,
          protoPath: resolveCommonProtoPath('identity_service/identity_query.proto'),
          packageName: 'identity_service',
          url:
            process.env.IDENTITY_SERVICE_HOST && process.env.IDENTITY_SERVICE_PORT
              ? `${process.env.IDENTITY_SERVICE_HOST}:${process.env.IDENTITY_SERVICE_PORT}`
              : 'localhost:50052'
        }
      },
      defaultPoolConfig: { minSize: 3, maxSize: 3 }
    }),
    GrpcTransportModule.forFeature([SERVICE_NAMES.PERMISSION]),

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
    PermissionServiceProxyModule
  ],
  providers: [
    GatewayPermissionGuard,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: GatewayJwtAuthGuard },
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
