import { MfaType } from '../../common/constants'
import { TerminalMfaPolicyEntity } from '../../domain/entities/terminal-mfa-policy.entity'
import { TerminalMfaPolicyService } from './terminal-mfa-policy.service'

describe('TerminalMfaPolicyService', () => {
  it('resolves the tenant override for WEB', async () => {
    const tenantPolicy = TerminalMfaPolicyEntity.tenantOverride('tenant-1', 'WEB', {
      loginMfaRequired: false,
      newDeviceMfaRequired: false,
      allowedFactors: [MfaType.SMS_OTP],
      factorPriority: [MfaType.SMS_OTP]
    })
    const repository = {
      findTenantOverride: jest.fn().mockResolvedValue(tenantPolicy),
      findPlatformDefaultByTerminal: jest.fn(),
      savePlatformDefault: jest.fn(),
      saveTenantOverride: jest.fn()
    }
    const service = new TerminalMfaPolicyService(repository as any)

    const resolution = await service.resolve({ tenantId: 'tenant-1', terminal: 'WEB' })

    expect(repository.findPlatformDefaultByTerminal).not.toHaveBeenCalled()
    expect(resolution.source).toBe('TENANT_OVERRIDE')
    expect(resolution.loginMfaRequired).toBe(false)
    expect(resolution.allowedFactors).toEqual([MfaType.SMS_OTP])
  })

  it('resolves the platform default when tenant policy is absent', async () => {
    const platformPolicy = new TerminalMfaPolicyEntity({
      terminal: 'WEB',
      loginMfaRequired: true,
      newDeviceMfaRequired: true,
      allowedFactors: [MfaType.EMAIL_OTP],
      factorPriority: [MfaType.EMAIL_OTP]
    })
    const repository = {
      findTenantOverride: jest.fn().mockResolvedValue(null),
      findPlatformDefaultByTerminal: jest.fn().mockResolvedValue(platformPolicy),
      savePlatformDefault: jest.fn(),
      saveTenantOverride: jest.fn()
    }
    const service = new TerminalMfaPolicyService(repository as any)

    const resolution = await service.resolve({ tenantId: 'tenant-1', terminal: 'WEB' })

    expect(resolution.source).toBe('PLATFORM_DEFAULT')
    expect(resolution.loginMfaRequired).toBe(true)
    expect(resolution.newDeviceMfaRequired).toBe(true)
  })

  it('resolves the PDA default with loginMfaRequired=false', async () => {
    const repository = {
      findTenantOverride: jest.fn(),
      findPlatformDefaultByTerminal: jest.fn().mockResolvedValue(null),
      savePlatformDefault: jest.fn(),
      saveTenantOverride: jest.fn()
    }
    const service = new TerminalMfaPolicyService(repository as any)

    const resolution = await service.resolve({ terminal: 'PDA' })

    expect(resolution.source).toBe('PLATFORM_DEFAULT')
    expect(resolution.loginMfaRequired).toBe(false)
  })

  it('rejects invalid platform default MFA factor priority with a stable code', async () => {
    const repository = {
      findTenantOverride: jest.fn(),
      findPlatformDefaultByTerminal: jest.fn(),
      savePlatformDefault: jest.fn(),
      saveTenantOverride: jest.fn()
    }
    const service = new TerminalMfaPolicyService(repository as any)

    await expect(
      service.updatePlatformDefault({
        terminal: 'WEB',
        loginMfaRequired: true,
        newDeviceMfaRequired: false,
        allowedFactors: [MfaType.EMAIL_OTP, MfaType.TOTP],
        factorPriority: [MfaType.EMAIL_OTP, MfaType.SMS_OTP]
      })
    ).rejects.toMatchObject({
      definition: {
        code: 'AUTH_TERMINAL_MFA_POLICY_INVALID'
      }
    })
    expect(repository.savePlatformDefault).not.toHaveBeenCalled()
  })

  it('rejects invalid tenant terminal MFA factors with a stable code', async () => {
    const repository = {
      findTenantOverride: jest.fn(),
      findPlatformDefaultByTerminal: jest.fn(),
      savePlatformDefault: jest.fn(),
      saveTenantOverride: jest.fn()
    }
    const service = new TerminalMfaPolicyService(repository as any)

    await expect(
      service.updateTenantPolicy({
        tenantId: 'tenant-1',
        terminal: 'WEB',
        loginMfaRequired: true,
        newDeviceMfaRequired: false,
        allowedFactors: [MfaType.PUSH_NOTIFICATION as any],
        factorPriority: [MfaType.PUSH_NOTIFICATION as any]
      })
    ).rejects.toMatchObject({
      definition: {
        code: 'AUTH_TERMINAL_MFA_POLICY_INVALID'
      }
    })
    expect(repository.saveTenantOverride).not.toHaveBeenCalled()
  })
})
