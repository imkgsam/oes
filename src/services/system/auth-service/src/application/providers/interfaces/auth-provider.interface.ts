import { LoginMethod } from 'src/domain/entities/loginmethod.entity'

export interface AuthResult {
  loginMethod: LoginMethod
  metadata?: Record<string, any>
}

export interface IAuthProvider<T = any> {
  authenticate(dto: T): Promise<AuthResult>

  /**
   * 验证输入参数
   * @param dto 输入参数
   * @returns 是否有效
   */
  validateInput?(dto: T): boolean

  /**
   * 获取支持的登录方式
   * @returns 登录方式标识
   */
  getSupportedMethod(): string
}
