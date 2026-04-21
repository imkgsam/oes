import { LoginMethodType } from '../../common/constants'
import { OESExceptionBase } from '@oes/common/exceptions'
import { Credential } from '../../domain/entities/credential.entity'
import { LoginMethod } from '../../domain/aggregates/loginmethod.aggregate'
import { EmailOtpLoginService } from './email-otp-login.service'
import { CredentialType } from '../../../prisma/generated/prisma'

describe('EmailOtpLoginService', () => {
  it('rejects otp login when the email otp capability has been disabled', async () => {
    const otpCredential = new Credential(
      'cred-email-otp',
      CredentialType.EMAIL_OTP,
      '',
      false,
      new Date('2026-04-20T00:00:00.000Z'),
      new Date('2026-04-20T00:00:00.000Z')
    )
    const loginMethod = new LoginMethod(
      'method-email',
      'user-1',
      LoginMethodType.EMAIL,
      'user@example.com',
      true,
      true,
      new Date('2026-04-20T00:00:00.000Z'),
      new Date('2026-04-20T00:00:00.000Z'),
      [otpCredential]
    )
    const service = new EmailOtpLoginService(
      {
        findValidOneByTypeAndIdentifier: jest.fn().mockResolvedValue(loginMethod)
      } as any,
      { save: jest.fn() } as any,
      { sendAuthOtpEmail: jest.fn() } as any,
      { assertCanSend: jest.fn(), recordSend: jest.fn() } as any
    )

    await expect(service.createChallenge('user@example.com')).rejects.toMatchObject({
      getCode: expect.any(Function)
    })

    await service.createChallenge('user@example.com').catch((error) => {
      expect((error as OESExceptionBase).getCode()).toBe('AUTH_INVALID_CREDENTIALS')
    })
  })
})
