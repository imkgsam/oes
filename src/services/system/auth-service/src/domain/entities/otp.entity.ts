import { OneTimeToken as PrismaOneTimeToken } from '../../../prisma/generated/prisma'
import { OTP_TYPES, OTP_USAGES } from '@oes/common/constants/enums/auth-relative.enums'
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

  isExpired(): Boolean { return new Date() > this.props.expiredAt }
  verify() { }
  touch() { this.props.updatedAt = new Date() }
  getProps(): Readonly<typeof this.props> { return { ...this.props } }


}
