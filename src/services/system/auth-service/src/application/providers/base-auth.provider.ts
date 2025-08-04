import { Injectable } from '@nestjs/common'
import { IAuthProvider, AuthResult } from './interfaces/auth-provider.interface'
import { LoginMethod } from 'src/domain/entities/loginmethod.entity'
import { ILoginMethodRepository } from 'src/domain/repositories/loginmethod.repository'
import {
  LOGIN_METHOD_TYPES,
  CREDENTIAL_TYPES,
} from '@oes/common/constants/enums/auth-relative.enums'
import { createBusinessException } from '@oes/common/helpers/exception.factory'
import { AUTH_SERVICE_ERRORS } from '@oes/common/constants/res-codes/auth-service.errors'

@Injectable()
export abstract class BaseAuthProvider<T = any> implements IAuthProvider<T> {
  constructor(
    protected readonly loginMethodRepository: ILoginMethodRepository,
    protected readonly supportedMethod: string,
  ) {}

  abstract authenticate(dto: T): Promise<AuthResult>

  /**
   * 验证输入参数
   * @param dto 输入参数
   * @returns 是否有效
   */
  validateInput(dto: T): boolean {
    return dto !== null && dto !== undefined
  }

  /**
   * 获取支持的登录方式
   * @returns 登录方式标识
   */
  getSupportedMethod(): string {
    return this.supportedMethod
  }

  /**
   * 查找并验证登录方法
   * @param type 登录方法类型
   * @param identifier 标识符
   * @returns LoginMethod
   */
  protected async findAndValidateLoginMethod(
    type: string,
    identifier: string,
  ): Promise<LoginMethod> {
    const loginMethod = await this.loginMethodRepository.findByTypeAndIdentifier(type, identifier)

    if (!loginMethod) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.INVALID_CREDENTIALS, {
        type,
        identifier,
      })
    }

    if (!loginMethod.isEnabled()) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.ACCOUNT_DISABLED, {
        type,
        identifier,
      })
    }

    if (!loginMethod.isVerified()) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.LOGIN_METHOD_NOT_VERIFIED, {
        type,
        identifier,
      })
    }

    return loginMethod
  }

  /**
   * 验证密码凭证
   * @param loginMethod 登录方法
   * @param password 密码
   * @returns 是否有效
   */
  protected async validatePasswordCredential(
    loginMethod: LoginMethod,
    password: string,
  ): Promise<boolean> {
    const credentials = loginMethod.getCredentials()
    const passwordCredential = credentials.find(
      (cred) => cred.secretType === CREDENTIAL_TYPES.PASSWORD,
    )

    if (!passwordCredential) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.PASSWORD_CREDENTIAL_NOT_FOUND, {
        loginMethodId: loginMethod.id,
      })
    }

    if (!passwordCredential.isEnabled()) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.PASSWORD_CREDENTIAL_DISABLED, {
        loginMethodId: loginMethod.id,
      })
    }

    return await passwordCredential.validate(password)
  }

  /**
   * 验证 OAuth 凭证
   * @param loginMethod 登录方法
   * @returns 是否有效
   */
  protected validateOAuthCredential(loginMethod: LoginMethod): boolean {
    const credentials = loginMethod.getCredentials()
    const oauthCredential = credentials.find((cred) => cred.secretType === CREDENTIAL_TYPES.OAUTH)

    if (!oauthCredential) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.OAUTH_CREDENTIAL_NOT_FOUND, {
        loginMethodId: loginMethod.id,
      })
    }

    if (!oauthCredential.isEnabled()) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.OAUTH_CREDENTIAL_DISABLED, {
        loginMethodId: loginMethod.id,
      })
    }

    return true
  }

  /**
   * 创建认证结果
   * @param loginMethod 登录方法
   * @param metadata 元数据
   * @returns AuthResult
   */
  protected createAuthResult(loginMethod: LoginMethod, metadata?: Record<string, any>): AuthResult {
    return {
      loginMethod,
      metadata,
    }
  }

  /**
   * 处理认证异常
   * @param error 异常
   * @param defaultMessage 默认错误消息
   */
  protected handleAuthError(error: any, defaultMessage: string): never {
    // 如果已经是 BusinessException，直接抛出
    if (error.code && error.messageKey && error.httpStatus) {
      throw error
    }
    // 否则包装为认证失败异常
    throw createBusinessException(AUTH_SERVICE_ERRORS.AUTHENTICATION_FAILED, {
      originalError: error.message,
      defaultMessage,
    })
  }
}
