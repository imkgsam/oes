import { MfaType, LoginMethodType } from '@oes/common/constants'
import { OESExceptionBase } from '@oes/common/exceptions'
import { CredentialType } from '../../../../prisma/generated/prisma'
import { LoginMethod } from '../../../domain/aggregates/loginmethod.aggregate'
import { MfaBindingEntity } from '../../../domain/aggregates/mfabinding.aggregate'
import { Credential } from '../../../domain/entities/credential.entity'
import { MfaBindingManagementService } from './mfa-binding-management.service'

function createLoginMethod(input: {
  enabled?: boolean
  otpEnabled?: boolean
  type: LoginMethodType
  verified?: boolean
}) {
  const credentialType =
    input.type === LoginMethodType.EMAIL
      ? CredentialType.EMAIL_OTP
      : CredentialType.PHONE_OTP

  return new LoginMethod(
    `${input.type.toLowerCase()}-method`,
    'user-1',
    input.type,
    input.type === LoginMethodType.EMAIL ? 'user@example.com' : '+15555550100',
    input.verified ?? true,
    input.enabled ?? true,
    new Date('2026-04-20T00:00:00.000Z'),
    new Date('2026-04-20T00:00:00.000Z'),
    [
      new Credential(
        `${input.type.toLowerCase()}-otp`,
        credentialType,
        '',
        input.otpEnabled ?? true,
        new Date('2026-04-20T00:00:00.000Z'),
        new Date('2026-04-20T00:00:00.000Z')
      ),
    ]
  )
}

describe('MfaBindingManagementService', () => {
  it('uses the verified email as the TOTP authenticator account label while keeping the binding user scoped', async () => {
    const mfaBindingRepo = {
      findByUserIdAndType: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
    }
    const loginMethodRepo = {
      findByUserIdAndType: jest.fn().mockResolvedValue(
        createLoginMethod({
          type: LoginMethodType.EMAIL,
        })
      ),
    }
    const service = new MfaBindingManagementService(
      mfaBindingRepo as any,
      loginMethodRepo as any
    )

    const result = await service.initializeTotpBinding('user-1')

    expect(result.qrCodeUrl).toContain('OES:user%40example.com')
    expect(result.qrCodeUrl).not.toContain('OES:user-1')
    expect(mfaBindingRepo.save.mock.calls[0][0].getUserId()).toBe('user-1')
  })

  it('marks email otp mfa unavailable when the email otp login capability is disabled', async () => {
    const loginMethodRepo = {
      findByUserIdAndType: jest.fn().mockResolvedValue(
        createLoginMethod({
          otpEnabled: false,
          type: LoginMethodType.EMAIL,
        })
      ),
    }
    const service = new MfaBindingManagementService(
      {
        findByUserIdAndType: jest.fn().mockResolvedValue(null),
      } as any,
      loginMethodRepo as any
    )

    const bindings = await service.listBindings('user-1')
    const emailBinding = bindings.find((binding) => binding.type === MfaType.EMAIL_OTP)

    expect(emailBinding).toMatchObject({
      available: false,
      destination: '',
      enabled: false,
      type: MfaType.EMAIL_OTP,
    })
  })

  it('rejects enabling sms otp mfa when the phone otp login capability is disabled', async () => {
    const loginMethodRepo = {
      findByUserIdAndType: jest.fn().mockResolvedValue(
        createLoginMethod({
          otpEnabled: false,
          type: LoginMethodType.PHONE,
        })
      ),
    }
    const service = new MfaBindingManagementService(
      {
        findByUserIdAndType: jest.fn().mockResolvedValue(null),
        save: jest.fn(),
      } as any,
      loginMethodRepo as any
    )

    await expect(service.enableOtpBinding('user-1', MfaType.SMS_OTP)).rejects.toMatchObject({
      getCode: expect.any(Function),
    })

    await service.enableOtpBinding('user-1', MfaType.SMS_OTP).catch((error) => {
      expect((error as OESExceptionBase).getCode()).toBe('AUTH_MFA_LOGIN_METHOD_UNAVAILABLE')
    })
  })

  it('hides a legacy seeded test totp binding from the managed binding list', async () => {
    const seededTotp = MfaBindingEntity.createSeededTestTotpBinding('user-1')
    const service = new MfaBindingManagementService(
      {
        findByUserIdAndType: jest.fn().mockImplementation(async (_userId: string, type: MfaType) => {
          return type === MfaType.TOTP ? seededTotp : null
        })
      } as any,
      {
        findByUserIdAndType: jest.fn().mockResolvedValue(null)
      } as any
    )

    const bindings = await service.listBindings('user-1')
    const totpBinding = bindings.find((binding) => binding.type === MfaType.TOTP)

    expect(totpBinding).toMatchObject({
      bindingId: '',
      type: MfaType.TOTP,
      enabled: false,
      available: true
    })
  })

  it('allows initializing a real totp binding when only a legacy seeded binding exists', async () => {
    const seededTotp = MfaBindingEntity.createSeededTestTotpBinding('user-1')
    const mfaBindingRepo = {
      delete: jest.fn(),
      findByUserIdAndType: jest.fn().mockResolvedValue(seededTotp),
      save: jest.fn()
    }
    const service = new MfaBindingManagementService(
      mfaBindingRepo as any,
      {
        findByUserIdAndType: jest.fn().mockResolvedValue(null)
      } as any
    )

    const result = await service.initializeTotpBinding('user-1')

    expect(result.binding).toMatchObject({
      type: MfaType.TOTP,
      enabled: false,
      available: true
    })
    expect(mfaBindingRepo.save).toHaveBeenCalledTimes(1)
    expect(mfaBindingRepo.save.mock.calls[0][0]).not.toBe(seededTotp)
  })
})
