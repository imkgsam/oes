import { LoginMethodType } from '@oes/common/constants'
import { LoginMethod } from '../../domain/aggregates/loginmethod.aggregate'
import { Credential } from '../../domain/entities/credential.entity'
import { PasswordSetupRequirementService } from './password-setup-requirement.service'

describe('PasswordSetupRequirementService', () => {
  it('requires setup when an explicit admin reset requirement is active', async () => {
    const password = await Credential.createPasswordCredential('OldSecret123!')
    const loginRepository = {
      findByUserIdAndType: jest.fn().mockResolvedValue(
        new LoginMethod(
          'method-1',
          'user-1',
          LoginMethodType.EMAIL,
          'u@example.com',
          true,
          true,
          new Date(),
          new Date(),
          [password]
        )
      )
    }
    const requirementRepository = {
      findActiveByUserId: jest.fn().mockResolvedValue({ userId: 'user-1', required: true })
    }
    const service = new PasswordSetupRequirementService(
      loginRepository as any,
      requirementRepository as any
    )

    await expect(service.userRequiresPasswordSetup('user-1')).resolves.toBe(true)
    await expect(service.userNeedsInitialPasswordSetup('user-1')).resolves.toBe(false)
  })

  it('does not require setup when a disabled password credential still exists on one login method', async () => {
    const disabledPassword = await Credential.createPasswordCredential('OldSecret123!')
    disabledPassword.disable()
    const emailMethod = new LoginMethod(
      'method-email',
      'user-1',
      LoginMethodType.EMAIL,
      'u@example.com',
      true,
      true,
      new Date(),
      new Date(),
      [disabledPassword]
    )
    const loginRepository = {
      findByUserIdAndType: jest.fn().mockImplementation(async (_userId: string, type: LoginMethodType) => {
        return type === LoginMethodType.EMAIL ? emailMethod : null
      })
    }
    const requirementRepository = {
      findActiveByUserId: jest.fn().mockResolvedValue(null)
    }
    const service = new PasswordSetupRequirementService(
      loginRepository as any,
      requirementRepository as any
    )

    await expect(service.userRequiresPasswordSetup('user-1')).resolves.toBe(false)
  })
})
