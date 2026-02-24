import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'

import { CommonJwtModule } from '@oes/common/auth/jwt/jwt.module'
import { LoggingModule } from '@oes/common/logging/logging.module'
import { GatewayJwtAuthGuard } from '@oes/common/auth/guards/gateway-jwt-auth.guard'

import { gatewayConfig } from './config/gateway.config'
import { HealthModule } from './health/health.module'
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware'
import { AuthServiceModule } from './modules/auth-service/auth-service.module'

@Module({
  imports: [
    // ── Infrastructure ──
    ConfigModule.forRoot({ isGlobal: true, load: [gatewayConfig] }),
    LoggingModule,
    CommonJwtModule,

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
    AuthServiceModule
    // PermissionProxyModule,   // enable after gRPC migration
    // IdentityProxyModule,     // enable after gRPC migration
  ],
  providers: [
    // ── Guards (pluggable — JWT/throttle move to APISIX later) ──
    { provide: APP_GUARD, useClass: GatewayJwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard }
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*')
  }
}
