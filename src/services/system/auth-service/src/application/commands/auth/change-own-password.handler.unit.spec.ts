import { LoginMethodType } from '@oes/common/constants'
import { ExceptionFactory, OESExceptionBase } from '@oes/common/exceptions'
import { LoginMethod } from '../../../domain/aggregates/loginmethod.aggregate'
import { Credential } from '../../../domain/entities/credential.entity'
import { ChangeOwnPasswordCommand } from './change-own-password.command'
import { ChangeOwnPasswordHandler } from './change-own-password.handler'
import { TenantMfaPolicyEntity } from '../../../domain/entities/tenant-mfa-policy.entity'

describe('ChangeOwnPasswordHandler', () => {
  it('verifies current password and replaces password credentials for verified login methods', async () => {
    const oldPassword = await Credential.createPasswordCredential('OldSecret123!')
    const emailMethod = new LoginMethod(
      'email-method',
      'user-1',
      LoginMethodType.EMAIL,
      'user@example.com',
      true,
      true,
      new Date(),
      new Date(),
      [oldPassword]
    )
    const phoneMethod = new LoginMethod(
      'phone-method',
      'user-1',
      LoginMethodType.PHONE,
      '+15555550100',
      true,
      true,
      new Date(),
      new Date(),
      []
    )
    const repo = {
      findByUserId: jest.fn().mockResolvedValue([emailMethod, phoneMethod]),
      save: jest.fn(async (method) => method)
    }
    const requirementRepo = { complete: jest.fn().mockResolvedValue(undefined) }
    const audit = { emitPasswordChanged: jest.fn() }
    const platformMfaPolicyRepository = { getPlatformPolicy: jest.fn() }
    const tenantMfaPolicyRepository = { getTenantPolicy: jest.fn() }
    const stepUpMfaGrantService = { assertGrant: jest.fn() }
    const handler = new ChangeOwnPasswordHandler(
      repo as any,
      requirementRepo as any,
      audit as any,
      platformMfaPolicyRepository as any,
      tenantMfaPolicyRepository as any,
      stepUpMfaGrantService as any
    )

    const result = await handler.execute(
      new ChangeOwnPasswordCommand({
        userId: 'user-1',
        currentPassword: 'OldSecret123!',
        newPassword: 'NewSecret123!'
      })
    )

    expect(result).toEqual({ success: true, passwordSetupRequired: false })
    expect(repo.save).toHaveBeenCalledTimes(2)
    await expect(emailMethod.getPasswordCredential()!.validate('NewSecret123!')).resolves.toBe(true)
    await expect(phoneMethod.getPasswordCredential()!.validate('NewSecret123!')).resolves.toBe(true)
    expect(requirementRepo.complete).toHaveBeenCalledWith('user-1')
    expect(audit.emitPasswordChanged).toHaveBeenCalledWith('user-1')
  })

  it('returns a domain invalid-credentials error when the current password does not match', async () => {
    const oldPassword = await Credential.createPasswordCredential('OldSecret123!')
    const emailMethod = new LoginMethod(
      'email-method',
      'user-1',
      LoginMethodType.EMAIL,
      'user@example.com',
      true,
      true,
      new Date(),
      new Date(),
      [oldPassword]
    )
    const repo = {
      findByUserId: jest.fn().mockResolvedValue([emailMethod]),
      save: jest.fn(async (method) => method)
    }
    const requirementRepo = { complete: jest.fn().mockResolvedValue(undefined) }
    const audit = { emitPasswordChanged: jest.fn() }
    const platformMfaPolicyRepository = { getPlatformPolicy: jest.fn() }
    const tenantMfaPolicyRepository = { getTenantPolicy: jest.fn() }
    const stepUpMfaGrantService = { assertGrant: jest.fn() }
    const handler = new ChangeOwnPasswordHandler(
      repo as any,
      requirementRepo as any,
      audit as any,
      platformMfaPolicyRepository as any,
      tenantMfaPolicyRepository as any,
      stepUpMfaGrantService as any
    )

    await expect(
      handler.execute(
        new ChangeOwnPasswordCommand({
          userId: 'user-1',
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewSecret123!'
        })
      )
    ).rejects.toBeInstanceOf(OESExceptionBase)

    try {
      await handler.execute(
        new ChangeOwnPasswordCommand({
          userId: 'user-1',
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewSecret123!'
        })
      )
    } catch (error) {
      expect(error).toBeInstanceOf(OESExceptionBase)
      expect((error as OESExceptionBase).getCode()).toBe('AUTH_INVALID_CREDENTIALS')
    }
    expect(repo.save).not.toHaveBeenCalled()
    expect(requirementRepo.complete).not.toHaveBeenCalled()
    expect(audit.emitPasswordChanged).not.toHaveBeenCalled()
  })

  it('requires a step-up MFA grant when the tenant policy marks change-password as protected', async () => {
    const oldPassword = await Credential.createPasswordCredential('OldSecret123!')
    const emailMethod = new LoginMethod(
      'email-method',
      'user-1',
      LoginMethodType.EMAIL,
      'user@example.com',
      true,
      true,
      new Date(),
      new Date(),
      [oldPassword]
    )
    const repo = {
      findByUserId: jest.fn().mockResolvedValue([emailMethod]),
      save: jest.fn(async (method) => method)
    }
    const requirementRepo = { complete: jest.fn().mockResolvedValue(undefined) }
    const audit = { emitPasswordChanged: jest.fn() }
    const platformMfaPolicyRepository = { getPlatformPolicy: jest.fn() }
    const tenantMfaPolicyRepository = {
      getTenantPolicy: jest.fn().mockResolvedValue(
        (() => {
          const policy = TenantMfaPolicyEntity.defaults('tenant-1')
          policy.setScenarioRequired('CHANGE_PASSWORD', true)
          return policy
        })()
      )
    }
    const stepUpMfaGrantService = {
      assertGrant: jest.fn(() => {
        throw ExceptionFactory.domain(
          {
            code: 'AUTH_MFA_STEP_UP_REQUIRED',
            message: 'Step-up MFA is required',
            messageKey: 'auth.mfa_step_up_required'
          } as any,
          { scenario: 'CHANGE_PASSWORD' }
        )
      })
    }
    const handler = new ChangeOwnPasswordHandler(
      repo as any,
      requirementRepo as any,
      audit as any,
      platformMfaPolicyRepository as any,
      tenantMfaPolicyRepository as any,
      stepUpMfaGrantService as any
    )

    await expect(
      handler.execute(
        new ChangeOwnPasswordCommand({
          userId: 'user-1',
          accountId: 'account-1',
          tenantId: 'tenant-1',
          scopeLevel: 'TENANT',
          currentPassword: 'OldSecret123!',
          newPassword: 'NewSecret123!'
        })
      )
    ).rejects.toBeInstanceOf(OESExceptionBase)

    expect(stepUpMfaGrantService.assertGrant).toHaveBeenCalledWith({
      userId: 'user-1',
      accountId: 'account-1',
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT',
      scenario: 'CHANGE_PASSWORD',
      mfaGrantToken: undefined
    })
    expect(repo.save).not.toHaveBeenCalled()
  })
})
