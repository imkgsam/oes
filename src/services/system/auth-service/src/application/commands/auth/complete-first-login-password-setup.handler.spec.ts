import { LoginMethodType } from '@oes/common/constants'
import { CredentialType } from '../../../../prisma/generated/prisma'
import { LoginMethod } from '../../../domain/aggregates/loginmethod.aggregate'
import { CompleteFirstLoginPasswordSetupCommand } from './complete-first-login-password-setup.command'
import { CompleteFirstLoginPasswordSetupHandler } from './complete-first-login-password-setup.handler'

function createLoginMethodFixture(input: {
  id: string
  identifier: string
  type: LoginMethodType
  userId: string
}) {
  return new LoginMethod(
    input.id,
    input.userId,
    input.type,
    input.identifier,
    true,
    true,
    new Date('2026-04-19T00:00:00.000Z'),
    new Date('2026-04-19T00:00:00.000Z'),
    []
  )
}

describe('CompleteFirstLoginPasswordSetupHandler', () => {
  it('creates the first enabled password credential on every verified bound login method', async () => {
    const phoneMethod = createLoginMethodFixture({
      id: 'login-phone-1',
      identifier: '13800138000',
      type: LoginMethodType.PHONE,
      userId: 'user-1'
    })
    const emailMethod = createLoginMethodFixture({
      id: 'login-email-1',
      identifier: 'user@example.com',
      type: LoginMethodType.EMAIL,
      userId: 'user-1'
    })
    const loginMethodRepository = {
      findByUserIdAndType: jest
        .fn()
        .mockResolvedValueOnce(phoneMethod)
        .mockResolvedValueOnce(emailMethod),
      save: jest.fn().mockImplementation(async (value: LoginMethod) => value)
    }
    const passwordSetupRequirementRepository = {
      complete: jest.fn().mockResolvedValue(undefined)
    }

    const handler = new CompleteFirstLoginPasswordSetupHandler(
      loginMethodRepository as any,
      passwordSetupRequirementRepository as any
    )

    await expect(
      handler.execute(
        new CompleteFirstLoginPasswordSetupCommand({
          newPassword: 'TempPass123!',
          userId: 'user-1'
        })
      )
    ).resolves.toEqual({ completed: true })

    expect(loginMethodRepository.save).toHaveBeenCalledTimes(2)
    const savedPhone = loginMethodRepository.save.mock.calls[0][0] as LoginMethod
    const savedEmail = loginMethodRepository.save.mock.calls[1][0] as LoginMethod
    expect(savedPhone.getPasswordCredential()?.type).toBe(CredentialType.PASSWORD)
    expect(savedPhone.getPasswordCredential()?.isEnabled()).toBe(true)
    expect(savedEmail.getPasswordCredential()?.type).toBe(CredentialType.PASSWORD)
    expect(savedEmail.getPasswordCredential()?.isEnabled()).toBe(true)
    expect(passwordSetupRequirementRepository.complete).toHaveBeenCalledWith('user-1')
  })
})
