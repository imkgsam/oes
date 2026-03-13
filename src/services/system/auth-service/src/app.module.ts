import { Module } from '@nestjs/common'
import { AuthModule } from './modules/auth/auth.module'
import { ConfigModule } from '@nestjs/config'
import { tokenConfig, authKeyConfig } from '@oes/common/auth'
import { ClientModule, ServiceKeys } from '@oes/common/clients'
import { LoggingModule } from '@oes/common/logging'
@Module({
  imports: [
    LoggingModule,
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      load: [tokenConfig, authKeyConfig] // 浠巆ommon涓姞杞介厤缃?    }),
    AuthModule,
    // 娉ㄥ唽寰湇鍔″鎴风
    ClientModule.register([ServiceKeys.PERMISSION_TCP])
  ],
  controllers: [],
  providers: []
})
export class AppModule {}
