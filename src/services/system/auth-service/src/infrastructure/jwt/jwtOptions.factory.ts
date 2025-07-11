import { ConfigService } from '@nestjs/config'
import { JwtModuleOptions, JwtOptionsFactory } from '@nestjs/jwt'
import { AuthKeyConfigName, IAuthKeyConfig } from '../config/authKey.config'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { Injectable } from '@nestjs/common'

@Injectable()
export class OptionsFactory implements JwtOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  async createJwtOptions(): Promise<JwtModuleOptions> {
    const keys =
      this.configService.getOrThrow<IAuthKeyConfig>(AuthKeyConfigName)
    const publicKey = await readFile(
      join(__dirname, '../../..', keys.publicKeyPath),
      'utf8',
    )
    const privateKey = await readFile(
      join(__dirname, '../../..', keys.privateKeyPath),
      'utf8',
    )
    return {
      publicKey,
      privateKey,
      signOptions: {
        algorithm: 'RS256',
      },
    }
  }
}
