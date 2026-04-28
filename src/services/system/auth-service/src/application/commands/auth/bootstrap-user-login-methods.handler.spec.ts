import { LoginMethodType } from '@oes/common/constants'
import { CredentialType } from '../../../../prisma/generated/prisma'
import { LoginMethod } from '../../../domain/aggregates/loginmethod.aggregate'
import { Credential } from '../../../domain/entities/credential.entity'
import { BootstrapUserLoginMethodsCommand } from './bootstrap-user-login-methods.command'
import { BootstrapUserLoginMethodsHandler } from './bootstrap-user-login-methods.handler'

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

describe('BootstrapUserLoginMethodsHandler', () => {
  it('creates phone-first OTP-ready login methods without silently seeding a fake TOTP binding', async () => {
    const loginMethodRepository = {
      findByUserId: jest.fn().mockResolvedValue([]),
      findByUserIdAndType: jest.fn().mockResolvedValue(null),
      findByTypeAndIdentifier: jest.fn().mockResolvedValue(null),
      save: jest
        .fn()
        .mockResolvedValueOnce(
          createLoginMethodFixture({
            id: 'login-phone-1',
            identifier: '13800138000',
            type: LoginMethodType.PHONE,
            userId: 'user-1'
          })
        )
        .mockResolvedValueOnce(
          createLoginMethodFixture({
            id: 'login-email-1',
            identifier: 'janny@example.com',
            type: LoginMethodType.EMAIL,
            userId: 'user-1'
          })
        )
    }
    const mfaBindingRepository = {
      findByUserIdAndType: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation(async (binding) => binding)
    }

    const handler = new BootstrapUserLoginMethodsHandler(loginMethodRepository as any)

    await expect(
      handler.execute(
        new BootstrapUserLoginMethodsCommand({
          userId: 'user-1',
          phone: '13800138000',
          email: 'janny@example.com'
        })
      )
    ).resolves.toEqual({
      emailBootstrapped: true,
      passwordBootstrapped: false,
      phoneBootstrapped: true
    })

    const savedPhoneMethod = (loginMethodRepository.save as jest.Mock).mock.calls[0][0]
    const savedEmailMethod = (loginMethodRepository.save as jest.Mock).mock.calls[1][0]
    expect(savedPhoneMethod.getCredentialByType(CredentialType.PHONE_OTP)?.isEnabled()).toBe(true)
    expect(savedEmailMethod.getCredentialByType(CredentialType.EMAIL_OTP)?.isEnabled()).toBe(true)
    expect(mfaBindingRepository.findByUserIdAndType).not.toHaveBeenCalled()
    expect(mfaBindingRepository.save).not.toHaveBeenCalled()
  })

  it('updates existing phone and email identifiers and inherits the current shared password when refreshing one user login entry point', async () => {
    const password = await Credential.createPasswordCredential('Secret123!')
    const loginMethodRepository = {
      findByUserId: jest.fn().mockResolvedValue([
        createLoginMethodFixture({
          id: 'login-email-0',
          identifier: 'seed@example.com',
          type: LoginMethodType.EMAIL,
          userId: 'user-1'
        })
      ]),
      findByUserIdAndType: jest
        .fn()
        .mockResolvedValueOnce(
          createLoginMethodFixture({
            id: 'login-phone-1',
            identifier: '+8613800138000',
            type: LoginMethodType.PHONE,
            userId: 'user-1'
          })
        )
        .mockResolvedValueOnce(
          createLoginMethodFixture({
            id: 'login-email-1',
            identifier: 'old@example.com',
            type: LoginMethodType.EMAIL,
            userId: 'user-1'
          })
        ),
      findByTypeAndIdentifier: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation(async (loginMethod) => loginMethod)
    }
    ;(loginMethodRepository.findByUserId as jest.Mock).mockResolvedValue([
      new LoginMethod(
        'login-email-0',
        'user-1',
        LoginMethodType.EMAIL,
        'seed@example.com',
        true,
        true,
        new Date('2026-04-18T00:00:00.000Z'),
        new Date('2026-04-18T00:00:00.000Z'),
        [password]
      )
    ])
    const mfaBindingRepository = {
      findByUserIdAndType: jest.fn(),
      save: jest.fn()
    }

    const handler = new BootstrapUserLoginMethodsHandler(loginMethodRepository as any)

    await expect(
      handler.execute(
        new BootstrapUserLoginMethodsCommand({
          userId: 'user-1',
          phone: '+8613900139000',
          email: 'new@example.com'
        })
      )
    ).resolves.toEqual({
      emailBootstrapped: true,
      passwordBootstrapped: false,
      phoneBootstrapped: true
    })

    expect(loginMethodRepository.findByTypeAndIdentifier).toHaveBeenCalledWith(
      LoginMethodType.PHONE,
      '+8613900139000'
    )
    expect(loginMethodRepository.findByTypeAndIdentifier).toHaveBeenCalledWith(
      LoginMethodType.EMAIL,
      'new@example.com'
    )
    expect(loginMethodRepository.save).toHaveBeenCalledTimes(2)
    const savedPhoneMethod = (loginMethodRepository.save as jest.Mock).mock.calls[0][0]
    const savedEmailMethod = (loginMethodRepository.save as jest.Mock).mock.calls[1][0]
    expect(savedPhoneMethod.identifier).toBe('+8613900139000')
    expect(savedEmailMethod.identifier).toBe('new@example.com')
    expect(savedPhoneMethod.getPasswordCredential()).not.toBeNull()
    expect(savedEmailMethod.getPasswordCredential()).not.toBeNull()
    await expect(savedPhoneMethod.getPasswordCredential()?.validate('Secret123!')).resolves.toBe(true)
    await expect(savedEmailMethod.getPasswordCredential()?.validate('Secret123!')).resolves.toBe(true)
  })
})
