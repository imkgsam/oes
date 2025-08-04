import { Injectable, UnauthorizedException } from '@nestjs/common'
import { AuthResult } from './interfaces/auth-provider.interface'
import { WechatLoginDto } from '../dtos/login.dto'
import { BaseAuthProvider } from './base-auth.provider'
import {
  LOGIN_METHOD_TYPES,
  CREDENTIAL_TYPES,
} from '@oes/common/constants/enums/auth-relative.enums'
import { LoginMethodEnum } from '@oes/common/constants/enums/auth-relative.enums'

@Injectable()
export class WechatAuthProvider extends BaseAuthProvider<WechatLoginDto> {
  constructor(loginMethodRepository: any) {
    super(loginMethodRepository, LoginMethodEnum.Wechat)
  }

  async authenticate(dto: WechatLoginDto): Promise<AuthResult> {
    try {
      // 验证微信授权码并获取用户信息
      const wechatUserInfo = await this.verifyWechatCode(dto.code)

      // 查找微信登录方法
      const loginMethod = await this.loginMethodRepository.findByTypeAndIdentifier(
        LOGIN_METHOD_TYPES.OAUTH_OPENID,
        wechatUserInfo.openid,
      )

      if (!loginMethod) {
        throw new UnauthorizedException('WeChat account not linked to any user')
      }

      // 检查登录方法是否启用和已验证
      if (!loginMethod.isEnabled() || !loginMethod.isVerified()) {
        throw new UnauthorizedException('WeChat login method not enabled or verified')
      }

      // 验证 OAuth 凭证
      const credentials = loginMethod.getCredentials()
      const oauthCredential = credentials.find((cred) => cred.secretType === CREDENTIAL_TYPES.OAUTH)

      if (!oauthCredential || !oauthCredential.isEnabled()) {
        throw new UnauthorizedException('Invalid OAuth credentials')
      }

      return this.createAuthResult(loginMethod, {
        wechatUserInfo,
        provider: 'wechat',
      })
    } catch (error) {
      return this.handleAuthError(error, 'Invalid WeChat authorization code')
    }
  }

  /**
   * 验证微信授权码并获取用户信息
   * @param code 微信授权码
   * @returns 微信用户信息
   */
  private async verifyWechatCode(code: string): Promise<{
    openid: string
    unionid: string
    nickname: string
    headimgurl: string
  }> {
    // TODO: 实现微信授权码验证
    // 这里应该使用微信 OAuth2 API 验证 code 并获取用户信息
    // 开发阶段可以返回模拟数据

    // 示例实现：
    // const response = await this.httpService.get('https://api.weixin.qq.com/sns/oauth2/access_token', {
    //   params: {
    //     appid: process.env.WECHAT_APP_ID,
    //     secret: process.env.WECHAT_APP_SECRET,
    //     code,
    //     grant_type: 'authorization_code'
    //   }
    // }).toPromise()

    // const { access_token, openid } = response.data

    // const userInfoResponse = await this.httpService.get('https://api.weixin.qq.com/sns/userinfo', {
    //   params: {
    //     access_token,
    //     openid,
    //     lang: 'zh_CN'
    //   }
    // }).toPromise()

    // 开发阶段返回模拟数据
    return {
      openid: 'test_openid_123',
      unionid: 'test_unionid_456',
      nickname: 'Test WeChat User',
      headimgurl: 'https://example.com/wechat_avatar.jpg',
    }
  }
}
