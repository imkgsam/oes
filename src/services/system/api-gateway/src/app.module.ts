import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { CommonJwtModule } from '@oes/common/auth/jwt/jwt.module'
import { LoggingModule } from '@oes/common/logging/logging.module'
import { RegistryModule } from '@oes/common/registry/index'
import { GatewayJwtAuthGuard } from '@oes/common/auth/guards/gateway-jwt-auth.guard'
import { GrpcTransportModule } from '@oes/common/transport/grpc/grpc-transport.module'
import { GrpcModuleOptions } from '@oes/common/transport/grpc/grpc.interfaces'
import { gatewayConfig } from './config/gateway.config'
import { HealthModule } from './health/health.module'
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware'
// import { AuthServiceProxyModule } from './modules/auth-service/auth-service.module'
import { PermissionServiceProxyModule } from './modules/permission-service/permission-service.module'
import { GatewayExceptionFilter } from './common/filters/gateway-exception.filter'
import { OtelExceptionFilter } from '@oes/common/core/filters/otel-exception.filter'
import { ResponseTransformInterceptor } from './common/interceptors/response.interceptor'
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor'

@Module({
  imports: [
    RegistryModule,
    // ── Infrastructure ──
    ConfigModule.forRoot({ isGlobal: true, load: [gatewayConfig] }),
    LoggingModule.forRoot({ serviceName: 'api-gateway' }),
    CommonJwtModule,

    // ── gRPC transport (global — must come before any forFeature modules) ──
    GrpcTransportModule.forRoot({
      services: {
        'permission-service': {
          serviceName: 'permission-service',
          protoPath: 'protos/permission_check.proto',
          packageName: 'permission_service'
        }
      },
      defaultPoolConfig: { minSize: 3, maxSize: 3 }
    }),

    // ── Rate limiting (pluggable — remove when migrating to APISIX) ──
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
          limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10)
        }
      ]
    }),

    // ── Core ──
    HealthModule,

    // ── System service proxies ──
    PermissionServiceProxyModule
    // AuthServiceProxyModule,  // enable after auth-service gRPC migration
    // IdentityProxyModule,     // enable after gRPC migration
  ],
  // 执行顺序是： 先注册先执行，所以为了避免jwtguard被滥用，我们把它放在后面注册
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // ── Guards (pluggable — JWT/throttle move to APISIX later) ──
    { provide: APP_GUARD, useClass: GatewayJwtAuthGuard },

    GatewayExceptionFilter,
    OtelExceptionFilter,
    ResponseTransformInterceptor,
    TimeoutInterceptor
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*')
  }
}
