import {
  MfaBindingType,
  MfaScenario
} from '@oes/common/generated/auth_service'
import { StepUpMfaUseCase } from './step-up-mfa.use-case'

describe('StepUpMfaUseCase', () => {
  it('starts one authenticated step-up MFA challenge inside the current account context', async () => {
    const authAdapter = {
      startStepUpMfaChallenge: jest.fn().mockResolvedValue({
        required: true,
        challengeId: 'step-up-flow-token',
        scenario: MfaScenario.MFA_SCENARIO_CHANGE_PASSWORD,
        defaultMfaFactor: MfaBindingType.MFA_BINDING_TYPE_TOTP,
        availableFactors: [
          {
            type: MfaBindingType.MFA_BINDING_TYPE_TOTP,
            label: '认证器 App',
            priority: 1
          }
        ],
        factorChallengeId: '',
        challengeDestination: '',
        challengeExpiresAt: ''
      })
    }

    const useCase = new StepUpMfaUseCase(authAdapter as any)
    const result = await useCase.startChallenge(
      { scenario: 'CHANGE_PASSWORD' } as any,
      {
        user: {
          sub: 'user-1',
          aid: 'account-1',
          tid: 'tenant-1'
        }
      } as any
    )

    expect(authAdapter.startStepUpMfaChallenge).toHaveBeenCalledWith(
      {
        userId: 'user-1',
        accountId: 'account-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        scenario: 'CHANGE_PASSWORD'
      },
      expect.objectContaining({
        user: expect.objectContaining({
          sub: 'user-1',
          aid: 'account-1',
          tid: 'tenant-1'
        })
      })
    )
    expect(result).toEqual({
      required: true,
      challenge: {
        challengeId: 'step-up-flow-token',
        scenario: 'CHANGE_PASSWORD',
        defaultFactor: 'TOTP',
        availableFactors: [
          { type: 'TOTP', label: '认证器 App', priority: 1 }
        ],
        factorChallengeId: undefined,
        destination: undefined,
        expiresAt: undefined
      }
    })
  })

  it('completes one authenticated step-up challenge and returns the short-lived grant token', async () => {
    const authAdapter = {
      completeStepUpMfaChallenge: jest.fn().mockResolvedValue({
        success: true,
        scenario: MfaScenario.MFA_SCENARIO_CHANGE_CONTACT,
        mfaGrantToken: 'step-up-grant-token',
        expiresAt: '2026-04-22T10:00:00.000Z'
      })
    }

    const useCase = new StepUpMfaUseCase(authAdapter as any)
    const result = await useCase.completeChallenge(
      {
        challengeId: 'step-up-flow-token',
        factor: 'EMAIL_OTP',
        code: '123456',
        factorChallengeId: 'otp-factor-1'
      } as any,
      {
        user: {
          sub: 'user-1',
          aid: 'account-1',
          tid: 'tenant-1'
        }
      } as any
    )

    expect(authAdapter.completeStepUpMfaChallenge).toHaveBeenCalledWith(
      {
        challengeId: 'step-up-flow-token',
        factor: 'EMAIL_OTP',
        code: '123456',
        factorChallengeId: 'otp-factor-1'
      },
      expect.anything()
    )
    expect(result).toEqual({
      success: true,
      scenario: 'CHANGE_CONTACT',
      mfaGrantToken: 'step-up-grant-token',
      expiresAt: '2026-04-22T10:00:00.000Z'
    })
  })
})
