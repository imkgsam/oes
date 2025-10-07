import { ConfigService } from '@nestjs/config'
import { JwtModuleOptions, JwtOptionsFactory } from '@nestjs/jwt'
import { AuthKeyConfigName, IAuthKeyConfig } from '../../configs/authKey.config'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { Injectable } from '@nestjs/common'

//自定义jwt配置工厂函数，用于生成jwt配置
@Injectable()
export class OptionsFactory implements JwtOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  async createJwtOptions(): Promise<JwtModuleOptions> {
    const keys = this.configService.getOrThrow<IAuthKeyConfig>(AuthKeyConfigName)
    console.log(keys)
    const publicKey = await readFile(join(__dirname, '../../..', keys.publicKeyPath), 'utf8')
    const privateKey = await readFile(join(__dirname, '../../..', keys.privateKeyPath), 'utf8')
    return {
      publicKey,
      privateKey,
      signOptions: {
        algorithm: 'RS256'
      }
    }
  }
}
