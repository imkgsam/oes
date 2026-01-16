import { Module } from '@nestjs/common'
import { CommonJwtModule } from '@oes/common/modules/jwt/jwt.module'
import { ConfigModule } from '@nestjs/config'
import { AuthServiceModule } from './modules/auth-service/auth-service.module'
import { TraceModule } from '@oes/common/modules/tracing/trace.module'
import { PermissionServiceModule } from 'src/modules/permission-service/permission-service.module'
import { IdentityServiceModule } from './modules/identity-service/identity-service.module'
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonJwtModule,
    // 链路追踪模块 获取traceid, spanid 等信息
    TraceModule.forHttp(),
    // 系统模块
    AuthServiceModule
    // PermissionServiceModule,
    // IdentityServiceModule
    // 业务模块
  ],
  controllers: [],
  providers: []
})
export class AppModule {}
