import { CommonJwtService } from '@oes/common/auth'
import { LoginMethodEnum, MfaType } from '../../../common/constants'
import { TenantMfaPolicyEntity } from '../../../domain/entities/tenant-mfa-policy.entity'
import { LoginMfaOrchestrationService } from './login-mfa-orchestration.service'

describe('LoginMfaOrchestrationService', () => {
  it('returns null for non-tenant accounts because login-scene MFA is tenant-scoped in v1', async () => {
    const service = new LoginMfaOrchestrationService(
      {
        getTenantPolicy: jest.fn(),
        saveTenantPolicy: jest.fn()
      } as any,
      {
        listBindings: jest.fn()
      } as any,
      {
        createChallenge: jest.fn()
      } as any,
      {
        createChallenge: jest.fn()
      } as any,
      {
        verifySelectedFactor: jest.fn()
      } as any,
      {
        signAccessToken: jest.fn()
      } as unknown as CommonJwtService
    )

    await expect(
      service.resolveChallengeForSelectedAccount({
        userId: 'user-1',
        accountId: 'account-1',
        tenantId: null,
        scopeLevel: 'SYSTEM',
        loginMethod: LoginMethodEnum.EmailPassword
      })
    ).resolves.toBeNull()
  })

  it('returns the highest-priority available tenant factor after account selection', async () => {
    const signAccessToken = jest.fn().mockReturnValue('login-mfa-flow-token')
    const verify = jest.fn().mockReturnValue({
      sub: 'user-1',
      aid: 'account-1',
      tid: 'tenant-1',
      scopeLevel: 'TENANT',
      loginMethod: LoginMethodEnum.EmailPassword,
      scenario: 'LOGIN',
      tokenType: 'mfa_flow',
      userAgent: 'Mozilla/5.0',
      ipAddress: '127.0.0.1'
    })
    const service = new LoginMfaOrchestrationService(
      {
        getTenantPolicy: jest.fn().mockResolvedValue(
          (() => {
            const policy = TenantMfaPolicyEntity.defaults('tenant-1')
            policy.setLoginRequired(true)
            policy.replaceFactors([
              { factor: MfaType.TOTP, enabled: true, priority: 1 },
              { factor: MfaType.EMAIL_OTP, enabled: true, priority: 2 },
              { factor: MfaType.SMS_OTP, enabled: true, priority: 3 },
              { factor: MfaType.BACKUP_CODE, enabled: true, priority: 4 }
            ])
            return policy
          })()
        ),
        saveTenantPolicy: jest.fn()
      } as any,
      {
        listBindings: jest.fn().mockResolvedValue([
          {
            bindingId: 'email-binding',
            type: MfaType.EMAIL_OTP,
            enabled: true,
            available: true,
            destination: 'user@example.com'
          },
          {
            bindingId: 'sms-binding',
            type: MfaType.SMS_OTP,
            enabled: true,
            available: false,
            destination: '+8613800138000'
          },
          {
            bindingId: 'totp-binding',
            type: MfaType.TOTP,
            enabled: true,
            available: true,
            destination: ''
          },
          {
            bindingId: 'backup-binding',
            type: MfaType.BACKUP_CODE,
            enabled: true,
            available: true,
            destination: ''
          }
        ])
      } as any,
      {
        createChallenge: jest.fn()
      } as any,
      {
        createChallenge: jest.fn()
      } as any,
      {
        verifySelectedFactor: jest.fn()
      } as any,
      {
        signAccessToken,
        verify
      } as unknown as CommonJwtService
    )

    const result = await service.resolveChallengeForSelectedAccount({
      userId: 'user-1',
      accountId: 'account-1',
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT',
      loginMethod: LoginMethodEnum.EmailPassword,
      userAgent: 'Mozilla/5.0',
      ipAddress: '127.0.0.1'
    })

    expect(result).toEqual({
      challengeId: 'login-mfa-flow-token',
      scenario: 'LOGIN',
      defaultFactor: MfaType.TOTP,
      availableFactors: [
        { type: MfaType.TOTP, label: '认证器 App' },
        { type: MfaType.EMAIL_OTP, label: '邮箱验证码' },
        { type: MfaType.BACKUP_CODE, label: '恢复码' }
      ]
    })
    expect(signAccessToken).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: 'user-1',
        aid: 'account-1',
        tid: 'tenant-1',
        scenario: 'LOGIN',
        tokenType: 'mfa_flow'
      }),
      expect.objectContaining({ expiresIn: '10m' })
    )
  })
})
