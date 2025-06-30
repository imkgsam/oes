import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { HttpAuthController } from './interfaces/http/controllers/auth/auth-local.controller';
import { TestController } from './interfaces/http/controllers/test.controller';
import { AdminController } from './interfaces/http/controllers/admin/admin-user.controller';
import { ConfigModule } from '@nestjs/config';
import tokenConfig from './infrastructure/config/token.config';
import authKeyConfig from './infrastructure/config/authKey.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      // envFilePath: getEnvFilePath(),
      load: [
        tokenConfig,
        authKeyConfig
      ]
    }),
    AuthModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }

function getEnvFilePath() {
  return process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
}