import { MfaType } from '../../common/constants'
import { ManagedMfaFactor } from './mfa-policy.shared'
import { TerminalMfaPolicyEntity } from './terminal-mfa-policy.entity'

describe('TerminalMfaPolicyEntity', () => {
  it('keeps PDA and KIOSK platform MFA defaults disabled', () => {
    const defaults = TerminalMfaPolicyEntity.platformDefaults()

    expect(defaults.find((policy) => policy.terminal === 'PDA')?.requiresLoginMfa()).toBe(false)
    expect(defaults.find((policy) => policy.terminal === 'KIOSK')?.requiresLoginMfa()).toBe(false)
  })

  it('treats platform terminal MFA defaults as defaults instead of a minimum baseline', () => {
    const platformWebDefault = new TerminalMfaPolicyEntity({
      terminal: 'WEB',
      loginMfaRequired: true,
      newDeviceMfaRequired: true,
      allowedFactors: [MfaType.EMAIL_OTP],
      factorPriority: [MfaType.EMAIL_OTP]
    })

    const tenantWebOverride = TerminalMfaPolicyEntity.tenantOverride('tenant-1', 'WEB', {
      loginMfaRequired: false,
      newDeviceMfaRequired: false,
      allowedFactors: [MfaType.EMAIL_OTP],
      factorPriority: [MfaType.EMAIL_OTP]
    })

    expect(platformWebDefault.requiresLoginMfa()).toBe(true)
    expect(tenantWebOverride.requiresLoginMfa()).toBe(false)
  })

  it('lets tenant terminal MFA policy override platform defaults', () => {
    const tenantPdaOverride = TerminalMfaPolicyEntity.tenantOverride('tenant-1', 'PDA', {
      loginMfaRequired: true,
      newDeviceMfaRequired: true,
      allowedFactors: [MfaType.TOTP],
      factorPriority: [MfaType.TOTP]
    })

    expect(tenantPdaOverride.tenantId).toBe('tenant-1')
    expect(tenantPdaOverride.terminal).toBe('PDA')
    expect(tenantPdaOverride.requiresLoginMfa()).toBe(true)
    expect(tenantPdaOverride.getAllowedFactors()).toEqual([MfaType.TOTP])
  })

  it('rejects unmanaged terminal MFA factors', () => {
    expect(
      () =>
        new TerminalMfaPolicyEntity({
          terminal: 'WEB',
          loginMfaRequired: false,
          newDeviceMfaRequired: false,
          allowedFactors: [MfaType.PUSH_NOTIFICATION as unknown as ManagedMfaFactor],
          factorPriority: [MfaType.PUSH_NOTIFICATION as unknown as ManagedMfaFactor]
        })
    ).toThrow('Terminal MFA policy can only use managed factors')
  })

  it('rejects unknown JSON-cast terminal MFA factors', () => {
    const unknownFactor = 'UNKNOWN_FACTOR' as unknown as ManagedMfaFactor

    expect(
      () =>
        new TerminalMfaPolicyEntity({
          terminal: 'WEB',
          loginMfaRequired: false,
          newDeviceMfaRequired: false,
          allowedFactors: [unknownFactor],
          factorPriority: [unknownFactor]
        })
    ).toThrow('Terminal MFA policy can only use managed factors')
  })

  it('rejects duplicate MFA factors', () => {
    expect(
      () =>
        new TerminalMfaPolicyEntity({
          terminal: 'WEB',
          loginMfaRequired: false,
          newDeviceMfaRequired: false,
          allowedFactors: [MfaType.EMAIL_OTP, MfaType.EMAIL_OTP],
          factorPriority: [MfaType.EMAIL_OTP, MfaType.EMAIL_OTP]
        })
    ).toThrow('Terminal MFA policy factors must be unique')
  })

  it('rejects factor priority that does not match allowed factors', () => {
    expect(
      () =>
        new TerminalMfaPolicyEntity({
          terminal: 'WEB',
          loginMfaRequired: false,
          newDeviceMfaRequired: false,
          allowedFactors: [MfaType.EMAIL_OTP, MfaType.TOTP],
          factorPriority: [MfaType.EMAIL_OTP, MfaType.SMS_OTP]
        })
    ).toThrow('Terminal MFA policy factor priority must match allowed factors')
  })

  it('defensively copies factor arrays from constructor input', () => {
    const allowedFactors: ManagedMfaFactor[] = [MfaType.EMAIL_OTP]
    const factorPriority: ManagedMfaFactor[] = [MfaType.EMAIL_OTP]
    const policy = new TerminalMfaPolicyEntity({
      terminal: 'WEB',
      loginMfaRequired: false,
      newDeviceMfaRequired: false,
      allowedFactors,
      factorPriority
    })

    allowedFactors.push(MfaType.TOTP)
    factorPriority.push(MfaType.TOTP)

    expect(policy.getAllowedFactors()).toEqual([MfaType.EMAIL_OTP])
    expect(policy.getFactorPriority()).toEqual([MfaType.EMAIL_OTP])
  })
})
