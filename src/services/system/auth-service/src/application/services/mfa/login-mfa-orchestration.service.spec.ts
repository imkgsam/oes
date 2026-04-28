import { CommonJwtService } from '@oes/common/auth'
import { OESExceptionBase } from '@oes/common/exceptions'
import { LoginMethodEnum, LoginMethodType, MfaType } from '../../../common/constants'
import { PlatformMfaPolicyEntity } from '../../../domain/entities/platform-mfa-policy.entity'
import { TenantMfaPolicyEntity } from '../../../domain/entities/tenant-mfa-policy.entity'
import { LoginMethod } from '../../../domain/aggregates/loginmethod.aggregate'
import { LoginMfaOrchestrationService } from './login-mfa-orchestration.service'

function createLoginMethodFixture(input: {
  identifier: string
  type: LoginMethodType
  userId: string
}) {
  return new LoginMethod(
    `${input.type}-${input.userId}`,
    input.userId,
    input.type,
    input.identifier,
    true,
    true,
    new Date('2026-04-24T00:00:00.000Z'),
    new Date('2026-04-24T00:00:00.000Z'),
    []
  )
}

describe('LoginMfaOrchestrationService', () => {
  it('returns the highest-priority available platform factor for system accounts', async () => {
    const signAccessToken = jest.fn().mockReturnValue('platform-mfa-flow-token')
    const service = new LoginMfaOrchestrationService(
      {
        getPlatformPolicy: jest.fn().mockResolvedValue(
          (() => {
            const policy = PlatformMfaPolicyEntity.defaults()
            policy.setLoginRequired(true)
            return policy
          })()
        ),
        savePlatformPolicy: jest.fn()
      } as any,
      {
        getTenantPolicy: jest.fn(),
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
            bindingId: 'totp-binding',
            type: MfaType.TOTP,
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
        signAccessToken
      } as unknown as CommonJwtService,
      {
        isTrustedDevice: jest.fn().mockResolvedValue(false)
      } as any,
      {
        findByUserIdAndType: jest.fn().mockResolvedValue(null)
      } as any,
      {
        userNeedsInitialPasswordSetup: jest.fn().mockResolvedValue(false)
      } as any
    )

    await expect(
      service.resolveChallengeForSelectedAccount({
        userId: 'user-1',
        accountId: 'account-1',
        tenantId: null,
        scopeLevel: 'SYSTEM',
        loginMethod: LoginMethodEnum.EmailPassword
      })
    ).resolves.toEqual(
      expect.objectContaining({
        challengeId: 'platform-mfa-flow-token',
        scenario: 'LOGIN',
        defaultFactor: MfaType.EMAIL_OTP
      })
    )
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
        getPlatformPolicy: jest.fn(),
        savePlatformPolicy: jest.fn()
      } as any,
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
      } as unknown as CommonJwtService,
      {
        isTrustedDevice: jest.fn().mockResolvedValue(false)
      } as any,
      {
        findByUserIdAndType: jest.fn().mockResolvedValue(null)
      } as any,
      {
        userNeedsInitialPasswordSetup: jest.fn().mockResolvedValue(false)
      } as any
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

    expect(result).toEqual(
      expect.objectContaining({
      challengeId: 'login-mfa-flow-token',
      scenario: 'LOGIN',
      defaultFactor: MfaType.TOTP,
      availableFactors: [
        { type: MfaType.TOTP, label: '认证器 App', priority: 1 },
        { type: MfaType.EMAIL_OTP, label: '邮箱验证码', priority: 2 },
        { type: MfaType.BACKUP_CODE, label: '恢复码', priority: 4 }
      ]
      })
    )
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

  it('does not auto-issue an email OTP factor challenge when MFA first becomes required', async () => {
    const signAccessToken = jest.fn().mockReturnValue('login-mfa-flow-token')
    const emailChallengeService = {
      createChallenge: jest.fn().mockResolvedValue({
        challengeId: 'email-factor-1',
        destination: 'user@example.com',
        expiresAt: new Date('2026-04-22T10:00:00.000Z')
      })
    }
    const service = new LoginMfaOrchestrationService(
      {
        getPlatformPolicy: jest.fn(),
        savePlatformPolicy: jest.fn()
      } as any,
      {
        getTenantPolicy: jest.fn().mockResolvedValue(
          (() => {
            const policy = TenantMfaPolicyEntity.defaults('tenant-1')
            policy.setLoginRequired(true)
            policy.replaceFactors([
              { factor: MfaType.EMAIL_OTP, enabled: true, priority: 1 },
              { factor: MfaType.TOTP, enabled: true, priority: 2 },
              { factor: MfaType.SMS_OTP, enabled: false, priority: 3 },
              { factor: MfaType.BACKUP_CODE, enabled: false, priority: 4 }
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
            bindingId: 'totp-binding',
            type: MfaType.TOTP,
            enabled: true,
            available: true,
            destination: ''
          }
        ])
      } as any,
      emailChallengeService as any,
      {
        createChallenge: jest.fn()
      } as any,
      {
        verifySelectedFactor: jest.fn()
      } as any,
      {
        signAccessToken,
        verify: jest.fn().mockReturnValue({
          sub: 'user-1',
          aid: 'account-1',
          tid: 'tenant-1',
          scopeLevel: 'TENANT',
          loginMethod: LoginMethodEnum.EmailPassword,
          scenario: 'LOGIN',
          tokenType: 'mfa_flow'
        })
      } as unknown as CommonJwtService,
      {
        isTrustedDevice: jest.fn().mockResolvedValue(false)
      } as any,
      {
        findByUserIdAndType: jest.fn().mockResolvedValue(null)
      } as any,
      {
        userNeedsInitialPasswordSetup: jest.fn().mockResolvedValue(false)
      } as any
    )

    const result = await service.resolveChallengeForSelectedAccount({
      userId: 'user-1',
      accountId: 'account-1',
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT',
      loginMethod: LoginMethodEnum.EmailPassword
    })

    expect(result).toEqual(
      expect.objectContaining({
        challengeId: 'login-mfa-flow-token',
        defaultFactor: MfaType.EMAIL_OTP,
        availableFactors: [
          { type: MfaType.EMAIL_OTP, label: '邮箱验证码', priority: 1 },
          { type: MfaType.TOTP, label: '认证器 App', priority: 2 }
        ]
      })
    )
    expect(result?.factorChallengeId).toBeUndefined()
    expect(result?.destination).toBeUndefined()
    expect(result?.expiresAt).toBeUndefined()
    expect(emailChallengeService.createChallenge).not.toHaveBeenCalled()
  })

  it('does not require login MFA when switching an already authenticated account context', async () => {
    const getTenantPolicy = jest.fn().mockResolvedValue(
      (() => {
        const policy = TenantMfaPolicyEntity.defaults('tenant-1')
        policy.setLoginRequired(true)
        policy.setScenarioRequired('NEW_DEVICE_LOGIN', true)
        return policy
      })()
    )
    const signAccessToken = jest.fn().mockReturnValue('unexpected-mfa-flow-token')
    const trustedDeviceService = {
      isTrustedDevice: jest.fn().mockResolvedValue(false)
    }
    const service = new LoginMfaOrchestrationService(
      {
        getPlatformPolicy: jest.fn(),
        savePlatformPolicy: jest.fn()
      } as any,
      {
        getTenantPolicy,
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
        signAccessToken
      } as unknown as CommonJwtService,
      trustedDeviceService as any
      ,
      {
        findByUserIdAndType: jest.fn().mockResolvedValue(null)
      } as any,
      {
        userNeedsInitialPasswordSetup: jest.fn().mockResolvedValue(false)
      } as any
    )

    await expect(
      service.resolveChallengeForSelectedAccount({
        userId: 'user-1',
        accountId: 'account-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        loginMethod: LoginMethodEnum.ContextSwitch,
        deviceId: undefined,
        userAgent: 'Mozilla/5.0',
        ipAddress: '127.0.0.1'
      })
    ).resolves.toBeNull()
    expect(getTenantPolicy).not.toHaveBeenCalled()
    expect(trustedDeviceService.isTrustedDevice).not.toHaveBeenCalled()
    expect(signAccessToken).not.toHaveBeenCalled()
  })

  it('returns NEW_DEVICE_LOGIN when the tenant requires trusted-device verification and the device is not trusted yet', async () => {
    const signAccessToken = jest.fn().mockReturnValue('new-device-mfa-flow-token')
    const trustedDeviceService = {
      isTrustedDevice: jest.fn().mockResolvedValue(false)
    }
    const service = new LoginMfaOrchestrationService(
      {
        getPlatformPolicy: jest.fn(),
        savePlatformPolicy: jest.fn()
      } as any,
      {
        getTenantPolicy: jest.fn().mockResolvedValue(
          (() => {
            const policy = TenantMfaPolicyEntity.defaults('tenant-1')
            policy.setScenarioRequired('NEW_DEVICE_LOGIN', true)
            policy.replaceFactors([
              { factor: MfaType.EMAIL_OTP, enabled: true, priority: 1 },
              { factor: MfaType.TOTP, enabled: true, priority: 2 },
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
            bindingId: 'totp-binding',
            type: MfaType.TOTP,
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
        signAccessToken
      } as unknown as CommonJwtService,
      trustedDeviceService as any
      ,
      {
        findByUserIdAndType: jest.fn().mockResolvedValue(null)
      } as any,
      {
        userNeedsInitialPasswordSetup: jest.fn().mockResolvedValue(false)
      } as any
    )

    const result = await service.resolveChallengeForSelectedAccount({
      userId: 'user-1',
      accountId: 'account-1',
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT',
      loginMethod: LoginMethodEnum.EmailPassword,
      deviceId: 'browser-1',
      deviceName: 'Firefox on macOS',
      userAgent: 'Mozilla/5.0 Firefox/149.0',
      ipAddress: '127.0.0.1'
    })

    expect(trustedDeviceService.isTrustedDevice).toHaveBeenCalledWith({
      userId: 'user-1',
      scopeLevel: 'TENANT',
      tenantId: 'tenant-1',
      deviceId: 'browser-1'
    })
    expect(result).toEqual(
      expect.objectContaining({
        challengeId: 'new-device-mfa-flow-token',
        scenario: 'NEW_DEVICE_LOGIN',
        defaultFactor: MfaType.EMAIL_OTP
      })
    )
    expect(signAccessToken).toHaveBeenCalledWith(
      expect.objectContaining({
        scenario: 'NEW_DEVICE_LOGIN',
        deviceId: 'browser-1',
        deviceName: 'Firefox on macOS'
      }),
      expect.objectContaining({ expiresIn: '10m' })
    )
  })

  it('surfaces invalid selected-factor verification as an invalid MFA code error', async () => {
    const service = new LoginMfaOrchestrationService(
      {
        getPlatformPolicy: jest.fn(),
        savePlatformPolicy: jest.fn()
      } as any,
      {
        getTenantPolicy: jest.fn().mockResolvedValue(
          (() => {
            const policy = TenantMfaPolicyEntity.defaults('tenant-1')
            policy.setLoginRequired(true)
            policy.replaceFactors([
              { factor: MfaType.SMS_OTP, enabled: true, priority: 1 },
              { factor: MfaType.EMAIL_OTP, enabled: false, priority: 2 },
              { factor: MfaType.TOTP, enabled: false, priority: 3 },
              { factor: MfaType.BACKUP_CODE, enabled: false, priority: 4 }
            ])
            return policy
          })()
        ),
        saveTenantPolicy: jest.fn()
      } as any,
      {
        listBindings: jest.fn().mockResolvedValue([
          {
            bindingId: 'sms-binding',
            type: MfaType.SMS_OTP,
            enabled: true,
            available: true,
            destination: '+8613800138000'
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
        verifySelectedFactor: jest.fn().mockResolvedValue(false)
      } as any,
      {
        signAccessToken: jest.fn(),
        verify: jest.fn().mockReturnValue({
          sub: 'user-1',
          aid: 'account-1',
          tid: 'tenant-1',
          scopeLevel: 'TENANT',
          loginMethod: LoginMethodEnum.EmailPassword,
          scenario: 'LOGIN',
          tokenType: 'mfa_flow'
        })
      } as unknown as CommonJwtService,
      {
        isTrustedDevice: jest.fn().mockResolvedValue(false)
      } as any,
      {
        findByUserIdAndType: jest.fn().mockResolvedValue(null)
      } as any,
      {
        userNeedsInitialPasswordSetup: jest.fn().mockResolvedValue(false)
      } as any
    )

    try {
      await service.verifySelectedFactor({
        challengeId: 'login-mfa-flow-token',
        factor: MfaType.SMS_OTP,
        code: '654321',
        factorChallengeId: 'factor-1'
      })
      fail('expected verifySelectedFactor to throw AUTH_MFA_INVALID_CODE')
    } catch (error) {
      expect((error as OESExceptionBase).getCode()).toBe('AUTH_MFA_INVALID_CODE')
    }
  })

  it('bypasses selected-account login MFA for the first OTP workspace login while initial password setup is still required', async () => {
    const trustedDeviceService = {
      isTrustedDevice: jest.fn().mockResolvedValue(false)
    }
    const service = new LoginMfaOrchestrationService(
      {
        getPlatformPolicy: jest.fn(),
        savePlatformPolicy: jest.fn()
      } as any,
      {
        getTenantPolicy: jest.fn().mockResolvedValue(
          (() => {
            const policy = TenantMfaPolicyEntity.defaults('tenant-1')
            policy.setLoginRequired(true)
            policy.setScenarioRequired('NEW_DEVICE_LOGIN', true)
            return policy
          })()
        ),
        saveTenantPolicy: jest.fn()
      } as any,
      {
        listBindings: jest.fn().mockResolvedValue([])
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
      } as unknown as CommonJwtService,
      trustedDeviceService as any,
      {
        findByUserIdAndType: jest.fn().mockResolvedValue(null)
      } as any,
      {
        userNeedsInitialPasswordSetup: jest.fn().mockResolvedValue(true)
      } as any
    )

    await expect(
      service.resolveChallengeForSelectedAccount({
        userId: 'user-1',
        accountId: 'account-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        loginMethod: LoginMethodEnum.PhoneOtp,
        deviceId: 'browser-1'
      })
    ).resolves.toBeNull()
    expect(trustedDeviceService.isTrustedDevice).not.toHaveBeenCalled()
  })

  it('allows password login to use verified email and phone OTP channels for new-device MFA even before dedicated MFA bindings are configured', async () => {
    const signAccessToken = jest.fn().mockReturnValue('new-device-mfa-flow-token')
    const loginMethodRepository = {
      findByUserIdAndType: jest
        .fn()
        .mockImplementation(async (_userId: string, type: LoginMethodType) => {
          if (type === LoginMethodType.EMAIL) {
            return createLoginMethodFixture({
              userId: 'user-1',
              type,
              identifier: 'user@example.com'
            })
          }

          if (type === LoginMethodType.PHONE) {
            return createLoginMethodFixture({
              userId: 'user-1',
              type,
              identifier: '+8613800138000'
            })
          }

          return null
        })
    }
    const service = new LoginMfaOrchestrationService(
      {
        getPlatformPolicy: jest.fn(),
        savePlatformPolicy: jest.fn()
      } as any,
      {
        getTenantPolicy: jest.fn().mockResolvedValue(
          (() => {
            const policy = TenantMfaPolicyEntity.defaults('tenant-1')
            policy.setScenarioRequired('NEW_DEVICE_LOGIN', true)
            policy.replaceFactors([
              { factor: MfaType.EMAIL_OTP, enabled: true, priority: 1 },
              { factor: MfaType.SMS_OTP, enabled: true, priority: 2 },
              { factor: MfaType.TOTP, enabled: true, priority: 3 },
              { factor: MfaType.BACKUP_CODE, enabled: false, priority: 4 }
            ])
            return policy
          })()
        ),
        saveTenantPolicy: jest.fn()
      } as any,
      {
        listBindings: jest.fn().mockResolvedValue([
          {
            bindingId: '',
            type: MfaType.EMAIL_OTP,
            enabled: false,
            available: true,
            destination: 'user@example.com'
          },
          {
            bindingId: '',
            type: MfaType.SMS_OTP,
            enabled: false,
            available: true,
            destination: '+8613800138000'
          },
          {
            bindingId: '',
            type: MfaType.TOTP,
            enabled: false,
            available: false,
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
        signAccessToken
      } as unknown as CommonJwtService,
      {
        isTrustedDevice: jest.fn().mockResolvedValue(false)
      } as any,
      loginMethodRepository as any,
      {
        userNeedsInitialPasswordSetup: jest.fn().mockResolvedValue(false)
      } as any
    )

    await expect(
      service.resolveChallengeForSelectedAccount({
        userId: 'user-1',
        accountId: 'account-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        loginMethod: LoginMethodEnum.PhonePassword,
        deviceId: 'browser-1'
      })
    ).resolves.toEqual(
      expect.objectContaining({
        challengeId: 'new-device-mfa-flow-token',
        scenario: 'NEW_DEVICE_LOGIN',
        defaultFactor: MfaType.EMAIL_OTP,
        availableFactors: [
          { type: MfaType.EMAIL_OTP, label: '邮箱验证码', priority: 1 },
          { type: MfaType.SMS_OTP, label: '手机验证码', priority: 2 }
        ]
      })
    )
  })

  it('requests an sms factor challenge for password login when the phone login method is available but no sms mfa binding exists yet', async () => {
    const phoneOtpMfaChallengeService = {
      createChallenge: jest.fn().mockResolvedValue({
        challengeId: 'sms-factor-1',
        destination: '+8613800138000',
        expiresAt: new Date('2026-04-24T12:00:00.000Z')
      })
    }
    const loginMethodRepository = {
      findByUserIdAndType: jest
        .fn()
        .mockImplementation(async (_userId: string, type: LoginMethodType) => {
          if (type === LoginMethodType.PHONE) {
            return createLoginMethodFixture({
              userId: 'user-1',
              type,
              identifier: '+8613800138000'
            })
          }

          return null
        })
    }
    const service = new LoginMfaOrchestrationService(
      {
        getPlatformPolicy: jest.fn(),
        savePlatformPolicy: jest.fn()
      } as any,
      {
        getTenantPolicy: jest.fn().mockResolvedValue(
          (() => {
            const policy = TenantMfaPolicyEntity.defaults('tenant-1')
            policy.setScenarioRequired('NEW_DEVICE_LOGIN', true)
            policy.replaceFactors([
              { factor: MfaType.SMS_OTP, enabled: true, priority: 1 },
              { factor: MfaType.EMAIL_OTP, enabled: false, priority: 2 },
              { factor: MfaType.TOTP, enabled: false, priority: 3 },
              { factor: MfaType.BACKUP_CODE, enabled: false, priority: 4 }
            ])
            return policy
          })()
        ),
        saveTenantPolicy: jest.fn()
      } as any,
      {
        listBindings: jest.fn().mockResolvedValue([
          {
            bindingId: '',
            type: MfaType.SMS_OTP,
            enabled: false,
            available: true,
            destination: '+8613800138000'
          }
        ])
      } as any,
      {
        createChallenge: jest.fn()
      } as any,
      phoneOtpMfaChallengeService as any,
      {
        verifySelectedFactor: jest.fn()
      } as any,
      {
        signAccessToken: jest.fn(),
        verify: jest.fn().mockReturnValue({
          sub: 'user-1',
          aid: 'account-1',
          tid: 'tenant-1',
          scopeLevel: 'TENANT',
          loginMethod: LoginMethodEnum.PhonePassword,
          scenario: 'NEW_DEVICE_LOGIN',
          tokenType: 'mfa_flow'
        })
      } as unknown as CommonJwtService,
      {
        isTrustedDevice: jest.fn().mockResolvedValue(false)
      } as any,
      loginMethodRepository as any,
      {
        userNeedsInitialPasswordSetup: jest.fn().mockResolvedValue(false)
      } as any
    )

    await expect(
      service.requestFactorChallenge('new-device-mfa-flow-token', MfaType.SMS_OTP)
    ).resolves.toEqual({
      factorChallengeId: 'sms-factor-1',
      destination: '+8613800138000',
      expiresAt: '2026-04-24T12:00:00.000Z'
    })

    expect(phoneOtpMfaChallengeService.createChallenge).toHaveBeenCalledWith('user-1')
  })

  it('rejects OTP-primary new-device login when no independent MFA factor is available', async () => {
    const service = new LoginMfaOrchestrationService(
      {
        getPlatformPolicy: jest.fn(),
        savePlatformPolicy: jest.fn()
      } as any,
      {
        getTenantPolicy: jest.fn().mockResolvedValue(
          (() => {
            const policy = TenantMfaPolicyEntity.defaults('tenant-1')
            policy.setScenarioRequired('NEW_DEVICE_LOGIN', true)
            policy.replaceFactors([
              { factor: MfaType.SMS_OTP, enabled: true, priority: 1 },
              { factor: MfaType.EMAIL_OTP, enabled: false, priority: 2 },
              { factor: MfaType.TOTP, enabled: true, priority: 3 },
              { factor: MfaType.BACKUP_CODE, enabled: false, priority: 4 }
            ])
            return policy
          })()
        ),
        saveTenantPolicy: jest.fn()
      } as any,
      {
        listBindings: jest.fn().mockResolvedValue([
          {
            bindingId: '',
            type: MfaType.SMS_OTP,
            enabled: false,
            available: true,
            destination: '+8613800138000'
          },
          {
            bindingId: '',
            type: MfaType.TOTP,
            enabled: false,
            available: false,
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
        signAccessToken: jest.fn()
      } as unknown as CommonJwtService,
      {
        isTrustedDevice: jest.fn().mockResolvedValue(false)
      } as any,
      {
        findByUserIdAndType: jest
          .fn()
          .mockImplementation(async (_userId: string, type: LoginMethodType) => {
            if (type === LoginMethodType.PHONE) {
              return createLoginMethodFixture({
                userId: 'user-1',
                type,
                identifier: '+8613800138000'
              })
            }

            return null
          })
      } as any,
      {
        userNeedsInitialPasswordSetup: jest.fn().mockResolvedValue(false)
      } as any
    )

    try {
      await service.resolveChallengeForSelectedAccount({
        userId: 'user-1',
        accountId: 'account-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        loginMethod: LoginMethodEnum.PhoneOtp,
        deviceId: 'browser-1'
      })
      fail('expected resolveChallengeForSelectedAccount to throw AUTH_MFA_FACTOR_UNAVAILABLE')
    } catch (error) {
      expect((error as OESExceptionBase).getCode()).toBe('AUTH_MFA_FACTOR_UNAVAILABLE')
    }
  })
})
