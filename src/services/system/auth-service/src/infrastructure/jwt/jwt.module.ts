import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule as NestJwtModule } from '@nestjs/jwt'
import { OptionsFactory } from './jwtOptions.factory'
import { JwtService } from './jwt.service'

@Module({
  imports: [
    ConfigModule,
    NestJwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useClass: OptionsFactory,
    }),
  ],
  providers: [JwtService],
  exports: [JwtService],
})
export class JwtModule {}
