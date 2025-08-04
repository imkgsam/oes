import { Injectable } from '@nestjs/common'
import { JwtService, JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { TokenConfigName, ITokenConfig } from '../../configs/token.config'

//自定义jwt服务
@Injectable()
export class CommonJwtService {
  private tokenConfig: ITokenConfig
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.tokenConfig =
      this.configService.getOrThrow<ITokenConfig>(TokenConfigName)
  }

  // 生成accesstoken
  signAccessToken(
    payload: Record<string, any>,
    options?: JwtSignOptions,
  ): string {
    return this.jwtService.sign(payload, {
      expiresIn: this.tokenConfig.accessTokenValidity || '15m',
      ...options,
    })
  }

  // 生成refreshtoken
  signRefreshToken(
    payload: Record<string, any>,
    options?: JwtSignOptions,
  ): string {
    return this.jwtService.sign(payload, {
      expiresIn: this.tokenConfig.refreshTokenValidity || '7d',
      ...options,
    })
  }

  // 验证token
  verify<T extends object = any>(token: string, options?: JwtVerifyOptions): T {
    return this.jwtService.verify<T>(token, options)
  }
  // 异步验证token
  async verifyAsync<T extends object = any>(
    token: string,
    options?: JwtVerifyOptions,
  ): Promise<T> {
    return this.jwtService.verifyAsync<T>(token, options)
  }

  // 解码 token
  decode(
    token: string,
    options?: { json?: boolean },
  ): null | { [key: string]: any } | string {
    return this.jwtService.decode(token, options)
  }
}
