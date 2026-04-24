import { MfaType } from '../../common/constants'
import { TenantMfaPolicyEntity } from './tenant-mfa-policy.entity'

describe('TenantMfaPolicyEntity', () => {
  it('tracks scenario requirements independently while preserving the managed factor ordering', () => {
    const policy = TenantMfaPolicyEntity.defaults('tenant-1')

    policy.setScenarioRequired('LOGIN', true)
    policy.setScenarioRequired('CHANGE_PASSWORD', true)
    policy.setScenarioRequired('CHANGE_CONTACT', true)

    expect(policy.isScenarioRequired('LOGIN')).toBe(true)
    expect(policy.isScenarioRequired('CHANGE_PASSWORD')).toBe(true)
    expect(policy.isScenarioRequired('CHANGE_CONTACT')).toBe(true)
    expect(policy.isScenarioRequired('NEW_DEVICE_LOGIN')).toBe(false)
    expect(policy.getFactors().map((factor) => factor.factor)).toEqual([
      MfaType.EMAIL_OTP,
      MfaType.SMS_OTP,
      MfaType.TOTP,
      MfaType.BACKUP_CODE
    ])
  })
})
