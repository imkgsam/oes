import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule as NestJwtModule } from '@nestjs/jwt'
import { OptionsFactory } from './jwtOptions.factory'
import { CommonJwtService } from './jwt.service'
import authKeyConfig from '../configs/authKey.config'
import tokenConfig from '../configs/token.config'

//自定义jwt模块
@Module({
  imports: [
    ConfigModule.forFeature(authKeyConfig),
    ConfigModule.forFeature(tokenConfig),
    NestJwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useClass: OptionsFactory
    })
  ],
  providers: [CommonJwtService],
  exports: [CommonJwtService, NestJwtModule]
})
export class CommonJwtModule {}
