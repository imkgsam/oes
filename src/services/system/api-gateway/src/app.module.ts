import { Module } from '@nestjs/common'
import { CommonJwtModule } from '@oes/common/modules/jwt/jwt.module'
import { ConfigModule } from '@nestjs/config'
import { LoggingModule } from '@oes/common/logging/logging.module'
import { AuthServiceModule } from './modules/auth-service/auth-service.module'
import { PermissionServiceModule } from 'src/modules/permission-service/permission-service.module'
import { IdentityServiceModule } from './modules/identity-service/identity-service.module'
import { GatewayJwtAuthGuard } from '@oes/common/auth/guards/gateway-jwt-auth.guard'
import { APP_GUARD } from '@nestjs/core'

@Module({
  imports: [
    LoggingModule,
    ConfigModule.forRoot({ isGlobal: true }),
    CommonJwtModule,
    // 系统模块
    AuthServiceModule
    // PermissionServiceModule,
    // IdentityServiceModule
    // 业务模块
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: GatewayJwtAuthGuard
    }
  ]
})
export class AppModule {}
