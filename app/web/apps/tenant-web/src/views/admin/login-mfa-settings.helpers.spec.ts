import { describe, expect, it } from 'vitest';

import {
  getTenantMfaFactorLabel,
  getTenantMfaScenarioLabel,
  getTenantMfaScenarioTooltip,
  orderTenantMfaScenarioRequirements,
  reorderTenantMfaFactors,
} from './login-mfa-settings.helpers';

describe('login mfa settings helpers', () => {
  it('maps one factor code into a stable tenant admin label', () => {
    expect(getTenantMfaFactorLabel('EMAIL_OTP')).toBe('邮箱 OTP');
    expect(getTenantMfaFactorLabel('SMS_OTP')).toBe('手机 OTP');
    expect(getTenantMfaFactorLabel('TOTP')).toBe('认证器');
    expect(getTenantMfaFactorLabel('BACKUP_CODE')).toBe('恢复码');
  });

  it('reorders factors and recomputes stable priorities after a drag move', () => {
    expect(
      reorderTenantMfaFactors(
        [
          { enabled: true, factor: 'EMAIL_OTP', priority: 1 },
          { enabled: true, factor: 'TOTP', priority: 2 },
          { enabled: false, factor: 'BACKUP_CODE', priority: 3 },
        ],
        2,
        0,
      ),
    ).toEqual([
      { enabled: false, factor: 'BACKUP_CODE', priority: 1 },
      { enabled: true, factor: 'EMAIL_OTP', priority: 2 },
      { enabled: true, factor: 'TOTP', priority: 3 },
    ]);
  });

  it('always exposes the new-device login scenario in tenant MFA settings', () => {
    expect(getTenantMfaScenarioLabel('NEW_DEVICE_LOGIN')).toBe('新设备登录');
    expect(getTenantMfaScenarioTooltip('NEW_DEVICE_LOGIN')).toContain('未受信设备');
    expect(orderTenantMfaScenarioRequirements([])).toContainEqual({
      required: false,
      scenario: 'NEW_DEVICE_LOGIN',
    });
  });
});
