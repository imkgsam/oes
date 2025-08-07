import { Injectable, UnauthorizedException } from '@nestjs/common'
import { AuthResult } from './interfaces/auth-provider.interface'
import { GoogleLoginDto } from '../dtos/login.dto'
import { BaseAuthProvider } from './base-auth.provider'
import {
  LOGIN_METHOD_TYPES,
  CREDENTIAL_TYPES
} from '@oes/common/constants/enums/auth-relative.enums'
import { LoginMethodEnum } from '@oes/common/constants/enums/auth-relative.enums'

@Injectable()
export class GoogleAuthProvider extends BaseAuthProvider<GoogleLoginDto> {
  constructor(loginMethodRepository: any) {
    super(loginMethodRepository, LoginMethodEnum.Google)
  }

  async authenticate(dto: GoogleLoginDto): Promise<AuthResult> {
    try {
      // 验证 Google ID Token
      const googleUserInfo = await this.verifyGoogleIdToken(dto.idToken)

      // 查找或创建 Google 登录方法
      const loginMethod =
        await this.loginMethodRepository.findByTypeAndIdentifier(
          LOGIN_METHOD_TYPES.OAUTH_OPENID,
          googleUserInfo.email
        )

      if (!loginMethod) {
        throw new UnauthorizedException('Google account not linked to any user')
      }

      // 检查登录方法是否启用和已验证
      if (!loginMethod.isEnabled() || !loginMethod.isVerified()) {
        throw new UnauthorizedException(
          'Google login method not enabled or verified'
        )
      }

      // 验证 OAuth 凭证
      const credentials = loginMethod.getCredentials()
      const oauthCredential = credentials.find(
        (cred) => cred.secretType === CREDENTIAL_TYPES.OAUTH
      )

      if (!oauthCredential || !oauthCredential.isEnabled()) {
        throw new UnauthorizedException('Invalid OAuth credentials')
      }

      return this.createAuthResult(loginMethod, {
        googleUserInfo,
        provider: 'google'
      })
    } catch (error) {
      return this.handleAuthError(error, 'Invalid Google ID token')
    }
  }

  /**
   * 验证 Google ID Token
   * @param idToken Google ID Token
   * @returns Google 用户信息
   */
  private async verifyGoogleIdToken(idToken: string): Promise<{
    email: string
    name: string
    picture: string
    sub: string
  }> {
    // TODO: 实现 Google ID Token 验证
    // 这里应该使用 Google OAuth2 API 验证 token
    // 开发阶段可以返回模拟数据

    // 示例实现：
    // const ticket = await this.googleOAuth2Client.verifyIdToken({
    //   idToken,
    //   audience: process.env.GOOGLE_CLIENT_ID,
    // })
    // const payload = ticket.getPayload()

    // 开发阶段返回模拟数据
    return {
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg',
      sub: '123456789'
    }
  }
}
