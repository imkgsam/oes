import { Injectable } from '@nestjs/common'
import { AuthResult } from './interfaces/auth-provider.interface'
import { EmailPasswordLoginDto } from '../dtos/login.dto'
import { BaseAuthProvider } from './base-auth.provider'
import { LOGIN_METHOD_TYPES } from '@oes/common/constants/enums/auth-relative.enums'
import { LoginMethodEnum } from '@oes/common/constants/enums/auth-relative.enums'
import { createBusinessException } from '@oes/common/helpers/exception.factory'
import { AUTH_SERVICE_ERRORS } from '@oes/common/constants/res-codes/auth-service.errors'

@Injectable()
export class EmailPasswordAuthProvider extends BaseAuthProvider<EmailPasswordLoginDto> {
  constructor(loginMethodRepository: any) {
    super(loginMethodRepository, LoginMethodEnum.EmailPassword)
  }

  async authenticate(dto: EmailPasswordLoginDto): Promise<AuthResult> {
    // 验证输入参数
    if (!this.validateInput(dto) || !dto.email || !dto.password) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.INVALID_CREDENTIALS, {
        reason: 'MISSING_EMAIL_OR_PASSWORD',
        email: dto.email ? 'provided' : 'missing',
        password: dto.password ? 'provided' : 'missing'
      })
    }

    try {
      // 查找并验证登录方法
      const loginMethod = await this.findAndValidateLoginMethod(
        LOGIN_METHOD_TYPES.EMAIL,
        dto.email
      )

      // 验证密码
      const isValidPassword = await this.validatePasswordCredential(
        loginMethod,
        dto.password
      )
      if (!isValidPassword) {
        throw createBusinessException(AUTH_SERVICE_ERRORS.INVALID_CREDENTIALS, {
          reason: 'INVALID_PASSWORD',
          email: dto.email
        })
      }

      return this.createAuthResult(loginMethod)
    } catch (error) {
      return this.handleAuthError(error, 'Email password authentication failed')
    }
  }

  override validateInput(dto: EmailPasswordLoginDto): boolean {
    return (
      super.validateInput(dto) &&
      typeof dto.email === 'string' &&
      typeof dto.password === 'string' &&
      dto.email.length > 0 &&
      dto.password.length >= 6
    )
  }
}
