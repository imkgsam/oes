import { Injectable } from '@nestjs/common'
import { IAuthProvider, AuthResult } from './interfaces/auth-provider.interface'
import { EmailPasswordAuthProvider } from './email-password.provider'
import { GoogleAuthProvider } from './google.provider'
import { WechatAuthProvider } from './wechat.provider'
import { EmailOtpProvider, PhoneOtpProvider } from './otp.provider'
import { LoginMethodEnum } from '@oes/common/constants/enums/auth-service.enums'

@Injectable()
export class AuthProviderFactory {
  constructor(
    private readonly emailPasswordProvider: EmailPasswordAuthProvider,
    private readonly googleProvider: GoogleAuthProvider,
    private readonly wechatProvider: WechatAuthProvider,
    private readonly emailOtpProvider: EmailOtpProvider,
    private readonly phoneOtpProvider: PhoneOtpProvider
  ) {}

  /**
   * 根据登录方式获取对应的认证提供者
   * @param loginMethodType 登录方式类型
   * @returns 认证提供者实例
   */
  getProvider(loginMethodType: LoginMethodEnum): IAuthProvider {
    switch (loginMethodType) {
      case LoginMethodEnum.EmailPassword:
        return this.emailPasswordProvider
      case LoginMethodEnum.EmailOtp:
        return this.emailOtpProvider
      case LoginMethodEnum.PhoneOtp:
        return this.phoneOtpProvider
      case LoginMethodEnum.Google:
        return this.googleProvider
      case LoginMethodEnum.Wechat:
        return this.wechatProvider
      default:
        throw new Error(`Unsupported login method type: ${String(loginMethodType)}`)
    }
  }

  /**
   * 执行认证
   * @param loginMethodType 登录方式类型
   * @param loginDto 登录数据
   * @returns 认证结果
   */
  async authenticate(loginMethodType: LoginMethodEnum, loginDto: any): Promise<AuthResult> {
    const provider = this.getProvider(loginMethodType)
    return await provider.authenticate(loginDto)
  }

  /**
   * 获取所有支持的登录方式
   * @returns 登录方式枚举数组
   */
  getSupportedLoginMethods(): LoginMethodEnum[] {
    return [
      LoginMethodEnum.EmailPassword,
      LoginMethodEnum.EmailOtp,
      LoginMethodEnum.PhoneOtp,
      LoginMethodEnum.Google,
      LoginMethodEnum.Wechat
    ]
  }

  /**
   * 检查是否支持指定的登录方式
   * @param loginMethodType 登录方式类型
   * @returns 是否支持
   */
  isSupported(loginMethodType: LoginMethodEnum): boolean {
    return this.getSupportedLoginMethods().includes(loginMethodType)
  }
}
