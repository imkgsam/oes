import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule as NestJwtModule } from "@nestjs/jwt";
import { readFileSync } from 'fs';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule,
    NestJwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const publicKeyPath = configService.getOrThrow<string>('AUTH_PUBLIC_KEY_PATH')
        const publicKey = await readFileSync(join(__dirname, '../../../../..', publicKeyPath), 'utf8')
        return {
          publicKey,
          signOptions: {
            algorithm: 'RS256',
          },
        }
      }
    })
  ]
})
export class JwtModule { }
