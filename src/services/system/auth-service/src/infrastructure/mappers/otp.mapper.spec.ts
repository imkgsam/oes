import { OTP_TYPES, OTP_USAGES } from '../../common/constants'
import { OtpMapper } from './otp.mapper'

describe('OtpMapper', () => {
  it('restores the persisted OTP channel type instead of defaulting every MFA token to email', () => {
    const otp = OtpMapper.toDomain({
      id: 'otp-1',
      type: OTP_TYPES.PHONE,
      usage: OTP_USAGES.MFA_VERIFY,
      identifier: '+8613912345678',
      hashedValue: '654321',
      consumed: false,
      attemptCount: 0,
      maxAttempt: 3,
      valid: true,
      expiredAt: new Date('2026-04-22T13:30:00.000Z'),
      createdAt: new Date('2026-04-22T13:25:00.000Z'),
      updatedAt: new Date('2026-04-22T13:25:00.000Z')
    } as any)

    expect(otp.getType()).toBe(OTP_TYPES.PHONE)
    expect(otp.getIdentifier()).toBe('+8613912345678')
  })
})
