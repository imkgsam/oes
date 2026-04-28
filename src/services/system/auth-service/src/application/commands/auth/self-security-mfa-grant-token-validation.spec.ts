import { validate } from 'class-validator'
import { ChangeOwnPasswordCommand } from './change-own-password.command'
import { VerifyEmailBindingCommand } from './verify-email-binding.command'
import { VerifyPhoneBindingCommand } from './verify-phone-binding.command'

describe('Self-service MFA grant token validation', () => {
  it('allows omitted mfaGrantToken when verifying an email binding', async () => {
    const errors = await validate(
      new VerifyEmailBindingCommand({
        userId: 'user-1',
        accountId: 'account-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        email: 'user@example.com',
        otp: '123456',
        mfaGrantToken: undefined
      }),
      {
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: false
      }
    )

    expect(errors).toEqual([])
  })

  it('allows omitted mfaGrantToken when verifying a phone binding', async () => {
    const errors = await validate(
      new VerifyPhoneBindingCommand({
        userId: 'user-1',
        accountId: 'account-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        phone: '+8613800138000',
        otp: '123456',
        mfaGrantToken: undefined
      }),
      {
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: false
      }
    )

    expect(errors).toEqual([])
  })

  it('allows omitted mfaGrantToken when changing the current password', async () => {
    const errors = await validate(
      new ChangeOwnPasswordCommand({
        userId: 'user-1',
        accountId: 'account-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        currentPassword: 'current-password',
        newPassword: 'new-password-1',
        mfaGrantToken: undefined
      }),
      {
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: false
      }
    )

    expect(errors).toEqual([])
  })
})
