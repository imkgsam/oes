import { Test } from '@nestjs/testing'
import { REPO } from '../../common/constants'
import { BootstrapUserLoginMethodsHandler } from '../commands/auth/bootstrap-user-login-methods.handler'
import { CompleteFirstLoginPasswordSetupHandler } from '../commands/auth/complete-first-login-password-setup.handler'
import { PasswordSetupRequirementService } from './password-setup-requirement.service'

describe('account lifecycle DI wiring', () => {
  it('resolves login method repository through the auth repository token', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: REPO.LOGIN_METHOD,
          useValue: {
            findByUserIdAndType: jest.fn(),
            save: jest.fn()
          }
        },
        {
          provide: REPO.MFA_BINDING,
          useValue: {
            findByUserIdAndType: jest.fn(),
            save: jest.fn()
          }
        },
        {
          provide: REPO.PASSWORD_SETUP_REQUIREMENT,
          useValue: {
            findActiveByUserId: jest.fn(),
            markCompleted: jest.fn(),
            save: jest.fn()
          }
        },
        BootstrapUserLoginMethodsHandler,
        CompleteFirstLoginPasswordSetupHandler,
        PasswordSetupRequirementService
      ]
    }).compile()

    expect(moduleRef.get(BootstrapUserLoginMethodsHandler)).toBeInstanceOf(
      BootstrapUserLoginMethodsHandler
    )
    expect(moduleRef.get(CompleteFirstLoginPasswordSetupHandler)).toBeInstanceOf(
      CompleteFirstLoginPasswordSetupHandler
    )
    expect(moduleRef.get(PasswordSetupRequirementService)).toBeInstanceOf(
      PasswordSetupRequirementService
    )

    await moduleRef.close()
  })
})
