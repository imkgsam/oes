import { BadRequestException } from '@nestjs/common'
import { LoginMethodType } from '@oes/common/constants'
import { LoginMethod } from '../../../domain/aggregates/loginmethod.aggregate'
import { Credential } from '../../../domain/entities/credential.entity'
import { SetLoginMethodEnabledCommand } from './set-login-method-enabled.command'
import { SetLoginMethodEnabledHandler } from './set-login-method-enabled.handler'

async function createMethod(input: {
  enabled: boolean
  id: string
  passwordEnabled?: boolean
  type: LoginMethodType
}) {
  const credentials = [];
  if (input.passwordEnabled !== undefined) {
    const password = await Credential.createPasswordCredential('Secret123!');
    if (!input.passwordEnabled) {
      password.disable();
    }
    credentials.push(password);
  }

  return new LoginMethod(
    input.id,
    'user-1',
    input.type,
    input.type === LoginMethodType.EMAIL ? 'user@example.com' : '+15555550100',
    true,
    input.enabled,
    new Date('2026-04-20T00:00:00.000Z'),
    new Date('2026-04-20T00:00:00.000Z'),
    credentials
  )
}

describe('SetLoginMethodEnabledHandler', () => {
  it('rejects disabling the final available login method', async () => {
    const method = await createMethod({
      enabled: true,
      id: 'method-email',
      passwordEnabled: false,
      type: LoginMethodType.EMAIL
    })
    const repo = {
      findByUserIdAndId: jest.fn().mockResolvedValue(method),
      findByUserId: jest.fn().mockResolvedValue([method]),
      save: jest.fn()
    }
    const handler = new SetLoginMethodEnabledHandler(repo as any, { emitLoginMethodEnabledChanged: jest.fn() } as any)

    await expect(
      handler.execute(
        new SetLoginMethodEnabledCommand({
          enabled: false,
          methodId: 'method-email:OTP',
          operatorId: 'admin-1',
          userId: 'user-1'
        })
      )
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(repo.save).not.toHaveBeenCalled()
  })

  it('disables one otp capability without disabling the sibling password capability', async () => {
    const emailMethod = await createMethod({
      enabled: true,
      id: 'method-email',
      passwordEnabled: true,
      type: LoginMethodType.EMAIL
    })
    const phoneMethod = await createMethod({
      enabled: true,
      id: 'method-phone',
      passwordEnabled: true,
      type: LoginMethodType.PHONE
    })
    const repo = {
      findByUserIdAndId: jest.fn().mockResolvedValue(emailMethod),
      findByUserId: jest.fn().mockResolvedValue([emailMethod, phoneMethod]),
      save: jest.fn(async (value) => value)
    }
    const audit = { emitLoginMethodEnabledChanged: jest.fn() }
    const handler = new SetLoginMethodEnabledHandler(repo as any, audit as any)

    const result = await handler.execute(
      new SetLoginMethodEnabledCommand({
        enabled: false,
        methodId: 'method-email:OTP',
        operatorId: 'admin-1',
        reason: '管理员停用',
        userId: 'user-1'
      })
    )

    expect(result.success).toBe(true)
    expect(result.loginMethod.enabled).toBe(false)
    expect(result.loginMethod.type).toBe('EMAIL_OTP')
    expect(emailMethod.getPasswordCredential()?.isEnabled()).toBe(true)
    expect(repo.save).toHaveBeenCalledWith(emailMethod)
    expect(audit.emitLoginMethodEnabledChanged).toHaveBeenCalledWith(
      'admin-1',
      'user-1',
      'method-email:OTP',
      false,
      '管理员停用'
    )
  })
})
