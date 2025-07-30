import { OneTimeToken as PrismaOneTimeToken } from '../../../prisma/generated/prisma'
import { OTP_TYPES, OTP_USAGES } from '@oes/common/constants/enums/auth-relative.enums'
import { createBusinessException } from '@oes/common/helpers/exception.factory'
import { AUTH_SERVICE_ERRORS } from '@oes/common/constants/res-codes/auth-service.errors'

export class OneTimeToken {
  constructor(
    private props: {
      id: string,
      type: OTP_TYPES,
      usage: OTP_USAGES,
      identifier: string,
      code: string,
      expiredAt: Date,
      consumed: boolean,
      attemptCount: number,
      maxAttempt: number,
      valid: boolean,
      createdAt: Date,
      updatedAt: Date
    }
  ) { }

  static fromPrisma(prismaOneTimeToken: PrismaOneTimeToken): OneTimeToken {
    return new OneTimeToken(
      {
        id: prismaOneTimeToken.id,
        type: prismaOneTimeToken.type as OTP_TYPES,
        usage: prismaOneTimeToken.usage as OTP_USAGES,
        identifier: prismaOneTimeToken.identifier,
        code: prismaOneTimeToken.code,
        expiredAt: prismaOneTimeToken.expiredAt,
        consumed: prismaOneTimeToken.consumed,
        attemptCount: prismaOneTimeToken.attemptCount,
        createdAt: prismaOneTimeToken.createdAt,
        updatedAt: prismaOneTimeToken.updatedAt,
      }
    )
  }

  static createNew(params: { type: OTP_TYPES, usage: OTP_USAGES, identifier: string, code: string, expiredAt: Date }): OneTimeToken {
    return new OneTimeToken({
      id: crypto.randomUUID(),
      type: params.type,
      usage: params.usage,
      identifier: params.identifier,
      code: params.code,
      expiredAt: params.expiredAt,
      consumed: false,
      attemptCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  verify(inputCode: string): boolean {
    if (!this.isValid()) throw createBusinessException(AUTH_SERVICE_ERRORS.OTP_INVALID)
    if (this.isExpired()) throw createBusinessException(AUTH_SERVICE_ERRORS.OTP_EXPIRED)
    if (this.props.attemptCount >= this.props.maxAttempt) throw createBusinessException(AUTH_SERVICE_ERRORS.OTP_REACH_LIMIT)
    if (this.props.code === inputCode) {
      this.markConsumed()
      return true
    } else {
      this.recordFailAttempt()
      return false
    }
  }
  touch() { this.props.updatedAt = new Date() }
  getProps(): Readonly<typeof this.props> { return { ...this.props } }
  isConsumed(): boolean { return this.props.consumed }
  isValid(): boolean { return this.props.valid }
  isExpired(): Boolean { return new Date() > this.props.expiredAt }
  markConsumed() {
    this.props.consumed = true
    if (this.props.type === OTP_TYPES.EMAIL || this.props.type === OTP_TYPES.PHONE) this.props.valid = false
    this.touch()
  }
  recordFailAttempt() {
    this.props.attemptCount += 1;
    if (this.props.type === OTP_TYPES.EMAIL || this.props.type === OTP_TYPES.PHONE) this.props.valid = false
    this.touch()
  }
}
