import { Module } from '@nestjs/common'
import { AuthModule } from './modules/auth/auth.module'
import { ConfigModule } from '@nestjs/config'
import tokenConfig from '@oes/common/configs/token.config'
import authKeyConfig from '@oes/common/configs/authKey.config'
import { ClientModule } from '@oes/common/modules/clients/client.module'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'
import { LoggingModule } from '@oes/common/logging/logging.module'
@Module({
  imports: [
    LoggingModule,
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      load: [tokenConfig, authKeyConfig] // 从common中加载配置
    }),
    AuthModule,
    // 注册微服务客户端
    ClientModule.register([ServiceKeys.PERMISSION_TCP])
  ],
  controllers: [],
  providers: []
})
export class AppModule {}
