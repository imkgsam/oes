import { ExceptionFactory, OESExceptionBase } from '@oes/common/exceptions'
import { TenantMfaPolicyEntity } from '../../../domain/entities/tenant-mfa-policy.entity'
import { VerifyPhoneBindingCommand } from './verify-phone-binding.command'
import { VerifyPhoneBindingHandler } from './verify-phone-binding.handler'

describe('VerifyPhoneBindingHandler', () => {
  it('requires a step-up MFA grant when the tenant policy marks contact change as protected', async () => {
    const contactBindingVerificationService = {
      verifyPhoneChallenge: jest.fn()
    }
    const tenantMfaPolicyRepository = {
      getTenantPolicy: jest.fn().mockResolvedValue(
        (() => {
          const policy = TenantMfaPolicyEntity.defaults('tenant-1')
          policy.setScenarioRequired('CHANGE_CONTACT', true)
          return policy
        })()
      )
    }
    const platformMfaPolicyRepository = { getPlatformPolicy: jest.fn() }
    const stepUpMfaGrantService = {
      assertGrant: jest.fn(() => {
        throw ExceptionFactory.domain(
          {
            code: 'AUTH_MFA_STEP_UP_REQUIRED',
            message: 'Step-up MFA is required',
            messageKey: 'auth.mfa_step_up_required'
          } as any,
          { scenario: 'CHANGE_CONTACT' }
        )
      })
    }
    const handler = new VerifyPhoneBindingHandler(
      contactBindingVerificationService as any,
      platformMfaPolicyRepository as any,
      tenantMfaPolicyRepository as any,
      stepUpMfaGrantService as any
    )

    await expect(
      handler.execute(
        new VerifyPhoneBindingCommand({
          userId: 'user-1',
          accountId: 'account-1',
          tenantId: 'tenant-1',
          scopeLevel: 'TENANT',
          phone: '+8613900000001',
          otp: '123456'
        })
      )
    ).rejects.toBeInstanceOf(OESExceptionBase)

    expect(stepUpMfaGrantService.assertGrant).toHaveBeenCalledWith({
      userId: 'user-1',
      accountId: 'account-1',
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT',
      scenario: 'CHANGE_CONTACT',
      mfaGrantToken: undefined
    })
    expect(contactBindingVerificationService.verifyPhoneChallenge).not.toHaveBeenCalled()
  })
})
