import { LoginMethodType } from '@oes/common/constants'
import { LoginMethod } from '../../../domain/aggregates/loginmethod.aggregate'
import { Credential } from '../../../domain/entities/credential.entity'
import { ListLoginMethodsHandler } from './list-login-methods.handler'
import { ListLoginMethodsQuery } from './list-login-methods.query'

describe('ListLoginMethodsHandler', () => {
  it('expands bound contacts into password and otp login capabilities without exposing credential secrets', async () => {
    const password = await Credential.createPasswordCredential('Secret123!')
    const emailMethod = new LoginMethod(
      'method-email',
      'user-1',
      LoginMethodType.EMAIL,
      'user@example.com',
      true,
      true,
      new Date('2026-04-20T00:00:00.000Z'),
      new Date('2026-04-20T00:00:00.000Z'),
      [password]
    )
    const phoneMethod = new LoginMethod(
      'method-phone',
      'user-1',
      LoginMethodType.PHONE,
      '+8613800138000',
      true,
      true,
      new Date('2026-04-20T00:00:00.000Z'),
      new Date('2026-04-20T00:00:00.000Z'),
      []
    )
    const repo = {
      findByUserId: jest.fn().mockResolvedValue([
        emailMethod,
        phoneMethod,
      ])
    }
    const requirementService = { userRequiresPasswordSetup: jest.fn().mockResolvedValue(false) }
    const handler = new ListLoginMethodsHandler(repo as any, requirementService as any)

    const result = await handler.execute(new ListLoginMethodsQuery('user-1'))

    expect(result.passwordSetupRequired).toBe(false)
    expect(result.loginMethods).toEqual([
      expect.objectContaining({
        methodId: 'method-email:PASSWORD',
        userId: 'user-1',
        type: 'EMAIL_PASSWORD',
        identifier: 'user@example.com',
        maskedIdentifier: 'u***@example.com',
        verified: true,
        enabled: true,
        hasPassword: true
      }),
      expect.objectContaining({
        methodId: 'method-email:OTP',
        userId: 'user-1',
        type: 'EMAIL_OTP',
        identifier: 'user@example.com',
        maskedIdentifier: 'u***@example.com',
        verified: true,
        enabled: true,
        hasPassword: false
      }),
      expect.objectContaining({
        methodId: 'method-phone:PASSWORD',
        userId: 'user-1',
        type: 'PHONE_PASSWORD',
        identifier: '+8613800138000',
        maskedIdentifier: '+86****8000',
        verified: true,
        enabled: false,
        hasPassword: false
      }),
      expect.objectContaining({
        methodId: 'method-phone:OTP',
        userId: 'user-1',
        type: 'PHONE_OTP',
        identifier: '+8613800138000',
        maskedIdentifier: '+86****8000',
        verified: true,
        enabled: true,
        hasPassword: false
      })
    ])
    expect(JSON.stringify(result)).not.toContain(password.getSecret())
  })
})
