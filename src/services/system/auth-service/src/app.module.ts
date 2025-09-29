import { Module } from '@nestjs/common'
import { AuthModule } from './modules/auth/auth.module'
import { ConfigModule } from '@nestjs/config'
import tokenConfig from '@oes/common/configs/token.config'
import authKeyConfig from '@oes/common/configs/authKey.config'
import { ClientModule } from '@oes/common/modules/clients/client.module'
import { TraceModule } from '@oes/common/modules/trace/trace.module'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'
import { CommonJwtModule } from '@oes/common/modules/jwt/jwt.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      load: [tokenConfig, authKeyConfig] // 从common中加载配置
    }),
    CommonJwtModule,
    // 链路追踪模块
    TraceModule.forRpc(),
    AuthModule,
    ClientModule.register([ServiceKeys.PERMI_TCP])
  ],
  controllers: [],
  providers: []
})
export class AppModule {}
