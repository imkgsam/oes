import { OneTimeToken as PrismaOneTimeToken } from '../../../prisma/generated/prisma'
import { OTP_TYPES, OTP_USAGES } from '@oes/common/constants/enums/auth-relative.enums'
import { createBusinessException } from '@oes/common/exceptions/exception.factory'
import { AUTH_SERVICE_ERRORS } from '@oes/common/constants/res-codes/auth-service.errors'
import { randomUUID } from 'crypto'

export class OneTimeToken {
  constructor(
    private props: {
      id: string
      type: OTP_TYPES
      usage: OTP_USAGES
      identifier: string
      code: string
      expiredAt: Date
      consumed: boolean
      attemptCount: number
      maxAttempt: number
      valid: boolean
      createdAt: Date
      updatedAt: Date
    }
  ) {}

  // 从 Prisma 实体创建 OneTimeToken 实例
  static fromPrisma(prismaOneTimeToken: PrismaOneTimeToken): OneTimeToken {
    return new OneTimeToken({
      id: prismaOneTimeToken.id,
      type: prismaOneTimeToken.type as OTP_TYPES,
      usage: prismaOneTimeToken.usage as OTP_USAGES,
      identifier: prismaOneTimeToken.identifier,
      code: prismaOneTimeToken.code,
      expiredAt: prismaOneTimeToken.expiredAt,
      consumed: prismaOneTimeToken.consumed,
      attemptCount: prismaOneTimeToken.attemptCount,
      maxAttempt: prismaOneTimeToken.maxAttempt,
      valid: prismaOneTimeToken.valid,
      createdAt: prismaOneTimeToken.createdAt,
      updatedAt: prismaOneTimeToken.updatedAt
    })
  }

  // 创建用于 MFA 验证的 OTP
  static createMfaOtp(params: {
    type: OTP_TYPES
    identifier: string
    code: string
    expiredAt: Date
  }): OneTimeToken {
    return new OneTimeToken({
      id: randomUUID(),
      type: params.type,
      usage: OTP_USAGES.MFA_VERIFY,
      identifier: params.identifier,
      code: params.code,
      expiredAt: params.expiredAt,
      consumed: false,
      attemptCount: 0,
      maxAttempt: 3,
      valid: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  // 创建用于登录的 OTP
  static createLoginOtp(params: {
    type: OTP_TYPES
    identifier: string
    code: string
    expiredAt: Date
  }): OneTimeToken {
    return new OneTimeToken({
      id: randomUUID(),
      type: params.type,
      usage: OTP_USAGES.LOGIN,
      identifier: params.identifier,
      code: params.code,
      expiredAt: params.expiredAt,
      consumed: false,
      attemptCount: 0,
      maxAttempt: 3,
      valid: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  // 创建用于注册的 OTP
  static createRegisterOtp(params: {
    type: OTP_TYPES
    identifier: string
    code: string
    expiredAt: Date
  }): OneTimeToken {
    return new OneTimeToken({
      id: randomUUID(),
      type: params.type,
      usage: OTP_USAGES.REGISTER,
      identifier: params.identifier,
      code: params.code,
      expiredAt: params.expiredAt,
      consumed: false,
      attemptCount: 0,
      maxAttempt: 3,
      valid: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  // 创建用于重置密码的 OTP
  static createResetPasswordOtp(params: {
    type: OTP_TYPES
    identifier: string
    code: string
    expiredAt: Date
  }): OneTimeToken {
    return new OneTimeToken({
      id: randomUUID(),
      type: params.type,
      usage: OTP_USAGES.RESET_PASSWORD,
      identifier: params.identifier,
      code: params.code,
      expiredAt: params.expiredAt,
      consumed: false,
      attemptCount: 0,
      maxAttempt: 3,
      valid: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  verify(inputCode: string): boolean {
    if (!this.isValid()) throw createBusinessException(AUTH_SERVICE_ERRORS.OTP_INVALID)
    if (this.isExpired()) throw createBusinessException(AUTH_SERVICE_ERRORS.OTP_EXPIRED)
    if (this.props.attemptCount >= this.props.maxAttempt)
      throw createBusinessException(AUTH_SERVICE_ERRORS.OTP_REACH_LIMIT)
    if (this.props.code === inputCode) {
      this.markConsumed()
      return true
    } else {
      this.recordFailAttempt()
      return false
    }
  }

  // 验证 MFA OTP（不自动标记为已消费）
  verifyMfa(inputCode: string): boolean {
    if (!this.isValid()) throw createBusinessException(AUTH_SERVICE_ERRORS.OTP_INVALID)
    if (this.isExpired()) throw createBusinessException(AUTH_SERVICE_ERRORS.OTP_EXPIRED)
    if (this.props.attemptCount >= this.props.maxAttempt)
      throw createBusinessException(AUTH_SERVICE_ERRORS.OTP_REACH_LIMIT)
    if (this.props.code === inputCode) {
      return true
    } else {
      this.recordFailAttempt()
      return false
    }
  }

  touch() {
    this.props.updatedAt = new Date()
  }

  getProps(): Readonly<typeof this.props> {
    return { ...this.props }
  }

  isConsumed(): boolean {
    return this.props.consumed
  }

  isValid(): boolean {
    return this.props.valid
  }

  isExpired(): boolean {
    return new Date() > this.props.expiredAt
  }

  // 检查是否用于 MFA 验证
  isMfaOtp(): boolean {
    return this.props.usage === OTP_USAGES.MFA_VERIFY
  }

  // 获取标识符（用于识别用户）
  getIdentifier(): string {
    return this.props.identifier
  }

  markConsumed() {
    this.props.consumed = true
    if (this.props.type === OTP_TYPES.EMAIL || this.props.type === OTP_TYPES.PHONE)
      this.props.valid = false
    this.touch()
  }

  recordFailAttempt() {
    this.props.attemptCount += 1
    if (this.props.type === OTP_TYPES.EMAIL || this.props.type === OTP_TYPES.PHONE)
      this.props.valid = false
    this.touch()
  }

  // 获取剩余尝试次数
  getRemainingAttempts(): number {
    return Math.max(0, this.props.maxAttempt - this.props.attemptCount)
  }

  // 检查是否还有剩余尝试次数
  hasRemainingAttempts(): boolean {
    return this.getRemainingAttempts() > 0
  }

  // 获取过期时间（毫秒）
  getExpiresIn(): number {
    return this.props.expiredAt.getTime() - new Date().getTime()
  }

  // 检查是否即将过期（比如 30 秒内）
  isExpiringSoon(seconds: number = 30): boolean {
    return this.getExpiresIn() <= seconds * 1000
  }

  // 更新验证码（用于重新发送）
  updateCode(newCode: string): void {
    this.props.code = newCode
    this.props.attemptCount = 0 // 重置尝试次数
    this.props.consumed = false // 重置消费状态
    this.props.valid = true // 重置有效状态
    this.touch()
  }
}
