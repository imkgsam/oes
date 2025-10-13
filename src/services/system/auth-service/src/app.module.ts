import { Module } from '@nestjs/common'
import { AuthModule } from './modules/auth/auth.module'
import { ConfigModule } from '@nestjs/config'
import tokenConfig from '@oes/common/configs/token.config'
import authKeyConfig from '@oes/common/configs/authKey.config'
import { ClientModule } from '@oes/common/modules/clients/client.module'
import { TraceModule } from '@oes/common/modules/trace/trace.module'
import { HttpModule } from '@oes/common/modules/http/http.module'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      load: [tokenConfig, authKeyConfig] // 从common中加载配置
    }),
    // 链路追踪模块
    TraceModule.forRpc(),
    // HTTP 模块
    HttpModule,
    AuthModule,
    ClientModule.register([ServiceKeys.PERMISSION_TCP])
  ],
  controllers: [],
  providers: []
})
export class AppModule {}
