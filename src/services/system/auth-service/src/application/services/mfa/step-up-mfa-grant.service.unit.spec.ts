import { CommonJwtService } from '@oes/common/auth'
import { OESExceptionBase } from '@oes/common/exceptions'
import { StepUpMfaGrantService } from './step-up-mfa-grant.service'

describe('StepUpMfaGrantService', () => {
  it('issues a short-lived scenario-bound step-up grant token', () => {
    const signAccessToken = jest.fn().mockReturnValue('signed-step-up-grant')
    const service = new StepUpMfaGrantService({
      signAccessToken,
      verify: jest.fn()
    } as unknown as CommonJwtService)

    const result = service.issueGrant({
      userId: 'user-1',
      accountId: 'account-1',
      scopeLevel: 'TENANT',
      tenantId: 'tenant-1',
      scenario: 'CHANGE_PASSWORD'
    })

    expect(result).toEqual({
      mfaGrantToken: 'signed-step-up-grant'
    })
    expect(signAccessToken).toHaveBeenCalledWith(
      {
        sub: 'user-1',
        aid: 'account-1',
        tid: 'tenant-1',
        scopeLevel: 'TENANT',
        scenario: 'CHANGE_PASSWORD',
        tokenType: 'mfa_step_up_grant'
      },
      { expiresIn: '3m' }
    )
  })

  it('rejects a step-up grant when the token payload does not match the required scenario context', () => {
    const service = new StepUpMfaGrantService({
      signAccessToken: jest.fn(),
      verify: jest.fn().mockReturnValue({
        sub: 'user-1',
        aid: 'account-1',
        tid: 'tenant-1',
        scenario: 'CHANGE_CONTACT',
        tokenType: 'mfa_step_up_grant'
      })
    } as unknown as CommonJwtService)

    try {
      service.assertGrant({
        userId: 'user-1',
        accountId: 'account-1',
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        scenario: 'CHANGE_PASSWORD',
        mfaGrantToken: 'signed-step-up-grant'
      })
    } catch (error) {
      expect(error).toBeInstanceOf(OESExceptionBase)
      expect((error as OESExceptionBase).getCode()).toBe('AUTH_MFA_STEP_UP_REQUIRED')
    }
  })
})
