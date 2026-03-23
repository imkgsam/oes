// File: src/services/system/api-gateway/src/app.module.ts
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { CommonJwtModule } from '@oes/common/auth'
import { LoggingModule } from '@oes/common/logging'
import { RegistryModule } from '@oes/common/registry'
import { GatewayJwtAuthGuard } from '@oes/common/auth'
import { GrpcTransportModule } from '@oes/common/transport'
import { GrpcModuleOptions } from '@oes/common/transport'
import { gatewayConfig } from './config/gateway.config'
import { HealthModule } from './health/health.module'
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware'
// import { AuthServiceProxyModule } from './modules/auth-service/auth-service.module'
import { PermissionServiceProxyModule } from './modules/permission-service/permission-service.module'
import { GatewayExceptionFilter } from './common/filters/gateway-exception.filter'
import { OtelExceptionFilter } from '@oes/common/filters'
import { ResponseTransformInterceptor } from './common/interceptors/response.interceptor'
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor'

@Module({
  imports: [
    RegistryModule,
    // 鈹€鈹€ Infrastructure 鈹€鈹€
    ConfigModule.forRoot({ isGlobal: true, load: [gatewayConfig] }),
    LoggingModule.forRoot({ serviceName: 'api-gateway' }),
    CommonJwtModule,

    // 鈹€鈹€ gRPC transport (global 鈥?must come before any forFeature modules) 鈹€鈹€
    GrpcTransportModule.forRoot({
      services: {
        'permission-service': {
          serviceName: 'permission-service',
          protoPath: 'protos/permission_management.proto',
          packageName: 'permission_service'
        }
      },
      defaultPoolConfig: { minSize: 3, maxSize: 3 }
    }),

    // 鈹€鈹€ Rate limiting (pluggable 鈥?remove when migrating to APISIX) 鈹€鈹€
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
          limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10)
        }
      ]
    }),

    // 鈹€鈹€ Core 鈹€鈹€
    HealthModule,

    // 鈹€鈹€ System service proxies 鈹€鈹€
    PermissionServiceProxyModule,
    // AuthServiceProxyModule,  // enable after auth-service gRPC migration
    // IdentityProxyModule,     // enable after gRPC migration
  ],
  // 鎵ц椤哄簭鏄細 鍏堟敞鍐屽厛鎵ц锛屾墍浠ヤ负浜嗛伩鍏峧wtguard琚互鐢紝鎴戜滑鎶婂畠鏀惧湪鍚庨潰娉ㄥ唽
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // 鈹€鈹€ Guards (pluggable 鈥?JWT/throttle move to APISIX later) 鈹€鈹€
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
