import { LoginMethodEnum } from '@oes/common/constants'
import { PdaPrimaryLoginCompletionService } from './pda-primary-login-completion.service'

describe('PdaPrimaryLoginCompletionService', () => {
  const account = {
    accountId: 'account-1',
    userId: 'user-1',
    tenantId: 'tenant-bound',
    scopeLevel: 'TENANT' as const,
    displayName: 'PDA Account',
    isEnabled: true
  }

  it('establishes a PDA session for the unique device-bound account when terminal MFA is not required', async () => {
    const pdaAccountResolutionService = {
      resolve: jest.fn().mockResolvedValue({
        account,
        terminalAccess: { allowed: true, effectiveAllowedTerminals: ['PDA'] }
      })
    }
    const accountSessionEstablishmentService = {
      establish: jest.fn().mockResolvedValue({
        status: 'SUCCESS',
        userId: 'user-1',
        accountId: 'account-1',
        tenantId: 'tenant-bound',
        scopeLevel: 'TENANT',
        terminal: 'PDA',
        allowedTerminals: ['PDA'],
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresIn: 900,
        passwordSetupRequired: false
      })
    }
    const service = new PdaPrimaryLoginCompletionService(
      pdaAccountResolutionService as any,
      { resolveChallengeForSelectedAccount: jest.fn().mockResolvedValue(null) } as any,
      accountSessionEstablishmentService as any,
      { assertAccountCanEstablishSession: jest.fn().mockResolvedValue(undefined) } as any
    )

    const result = await service.complete({
      userId: 'user-1',
      loginMethod: LoginMethodEnum.EmailPassword,
      terminalDeviceId: 'terminal-device-1',
      deviceBoundTenantId: 'tenant-bound',
      loginFlow: 'PDA_EMAIL_PASSWORD',
      deviceName: 'PDA-001'
    })

    expect(result).toEqual(expect.objectContaining({ status: 'SUCCESS', terminal: 'PDA' }))
    expect(pdaAccountResolutionService.resolve).toHaveBeenCalledWith({
      userId: 'user-1',
      deviceBoundTenantId: 'tenant-bound'
    })
    expect(accountSessionEstablishmentService.establish).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        account,
        loginMethod: LoginMethodEnum.EmailPassword,
        terminal: 'PDA',
        terminalDeviceId: 'terminal-device-1',
        deviceBoundTenantId: 'tenant-bound',
        loginFlow: 'PDA_EMAIL_PASSWORD',
        deviceName: 'PDA-001'
      })
    )
  })

  it('preserves PDA device context in the MFA challenge path', async () => {
    const pdaAccountResolutionService = {
      resolve: jest.fn().mockResolvedValue({
        account,
        terminalAccess: { allowed: true, effectiveAllowedTerminals: ['PDA'] }
      })
    }
    const loginMfaOrchestrationService = {
      resolveChallengeForSelectedAccount: jest.fn().mockResolvedValue({
        challengeId: 'challenge-1',
        scenario: 'LOGIN',
        defaultFactor: 'EMAIL_OTP',
        availableFactors: [{ type: 'EMAIL_OTP', label: '邮箱验证码', priority: 1 }]
      })
    }
    const service = new PdaPrimaryLoginCompletionService(
      pdaAccountResolutionService as any,
      loginMfaOrchestrationService as any,
      { establish: jest.fn() } as any,
      { assertAccountCanEstablishSession: jest.fn().mockResolvedValue(undefined) } as any
    )

    const result = await service.complete({
      userId: 'user-1',
      loginMethod: LoginMethodEnum.PhonePassword,
      terminalDeviceId: 'terminal-device-1',
      deviceBoundTenantId: 'tenant-bound',
      loginFlow: 'PDA_PHONE_PASSWORD'
    })

    expect(result).toEqual(
      expect.objectContaining({
        nextStep: 'MFA_REQUIRED',
        challengeId: 'challenge-1',
        terminal: 'PDA',
        allowedTerminals: ['PDA']
      })
    )
    expect(loginMfaOrchestrationService.resolveChallengeForSelectedAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        accountId: 'account-1',
        terminal: 'PDA',
        terminalDeviceId: 'terminal-device-1',
        deviceBoundTenantId: 'tenant-bound',
        loginFlow: 'PDA_PHONE_PASSWORD'
      })
    )
  })
})
