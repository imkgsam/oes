import { OTP_TYPES } from 'src/common/constants'
import { OneTimeToken } from 'src/domain/aggregates/otp.aggregate'

type PrismaOtpRecord = {
  id: string
  usage: string
  identifier: string
  hashedValue: string
  consumed: boolean
  attemptCount: number
  maxAttempt: number
  valid: boolean
  expiredAt: Date
  createdAt: Date
  updatedAt: Date
}

export class OtpMapper {
  static toDomain(input: PrismaOtpRecord): OneTimeToken {
    return new OneTimeToken({
      id: input.id,
      type: OTP_TYPES.EMAIL,
      usage: input.usage as any,
      identifier: input.identifier,
      code: input.hashedValue,
      expiredAt: input.expiredAt,
      consumed: input.consumed,
      attemptCount: input.attemptCount,
      maxAttempt: input.maxAttempt,
      valid: input.valid,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt
    })
  }

  static toPersistence(input: OneTimeToken) {
    const props = input.getProps()

    return {
      id: props.id,
      usage: props.usage,
      identifier: props.identifier,
      hashedValue: props.code,
      lastSentAt: new Date(),
      expiredAt: props.expiredAt,
      consumed: props.consumed,
      attemptCount: props.attemptCount,
      maxAttempt: props.maxAttempt,
      valid: props.valid,
      createdAt: props.createdAt,
      updatedAt: new Date()
    }
  }
}
