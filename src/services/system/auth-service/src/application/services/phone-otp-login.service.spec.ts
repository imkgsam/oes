import { LoginMethodType } from '../../common/constants'
import { OESExceptionBase } from '@oes/common/exceptions'
import { Credential } from '../../domain/entities/credential.entity'
import { LoginMethod } from '../../domain/aggregates/loginmethod.aggregate'
import { PhoneOtpLoginService } from './phone-otp-login.service'
import { CredentialType } from '../../../prisma/generated/prisma'

describe('PhoneOtpLoginService', () => {
  it('rejects otp login when the phone otp capability has been disabled', async () => {
    const otpCredential = new Credential(
      'cred-phone-otp',
      CredentialType.PHONE_OTP,
      '',
      false,
      new Date('2026-04-20T00:00:00.000Z'),
      new Date('2026-04-20T00:00:00.000Z')
    )
    const loginMethod = new LoginMethod(
      'method-phone',
      'user-1',
      LoginMethodType.PHONE,
      '+8613800138000',
      true,
      true,
      new Date('2026-04-20T00:00:00.000Z'),
      new Date('2026-04-20T00:00:00.000Z'),
      [otpCredential]
    )
    const service = new PhoneOtpLoginService(
      {
        findValidOneByTypeAndIdentifier: jest.fn().mockResolvedValue(loginMethod)
      } as any,
      { save: jest.fn() } as any,
      { sendAuthOtpSms: jest.fn() } as any,
      { assertCanSend: jest.fn(), recordSend: jest.fn() } as any
    )

    await expect(service.createChallenge('+8613800138000')).rejects.toMatchObject({
      getCode: expect.any(Function)
    })

    await service.createChallenge('+8613800138000').catch((error) => {
      expect((error as OESExceptionBase).getCode()).toBe('AUTH_INVALID_CREDENTIALS')
    })
  })
})
