import { Module } from '@nestjs/common'
import { AuthModule } from './modules/auth/auth.module'
import { ConfigModule } from '@nestjs/config'
import tokenConfig from './infrastructure/config/token.config'
import authKeyConfig from './infrastructure/config/authKey.config'
import { ClientModule } from '@oes/common/modules/clients/client.module'
@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      // envFilePath: getEnvFilePath(),
      load: [tokenConfig, authKeyConfig],
    }),
    AuthModule,
    ClientModule.register(['PERMI_TCP']),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

function getEnvFilePath() {
  return process.env.NODE_ENV === 'test' ? '.env.test' : '.env'
}
