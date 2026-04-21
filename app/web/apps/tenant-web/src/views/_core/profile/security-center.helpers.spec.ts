import { describe, expect, it } from 'vitest';

import {
  buildLoginMethodGroups,
  canRequestContactBindingChallenge,
  getContactBindingActionLabel,
  getMfaAvailabilityHint,
  getMfaDisplayDestination,
  getRecoveryCodePanelMeta,
  getTotpPanelMeta,
  resolveBoundContact,
  validateContactBindingOtp,
  validateContactBindingValue,
} from './security-center.helpers';

describe('security center contact binding helpers', () => {
  it('resolves the current bound contact from verified login methods', () => {
    expect(
      resolveBoundContact(
        [
          {
            enabled: true,
            hasPassword: false,
            identifier: 'user@example.com',
            maskedIdentifier: 'u***@example.com',
            methodId: 'method-email',
            type: 'EMAIL_PASSWORD',
            userId: 'user-1',
            verified: true,
          },
          {
            enabled: true,
            hasPassword: false,
            identifier: '+8613811112222',
            maskedIdentifier: '+86 138****2222',
            methodId: 'method-phone',
            type: 'PHONE_OTP',
            userId: 'user-1',
            verified: true,
          },
        ],
        'email',
      ),
    ).toBe('u***@example.com');

    expect(
      resolveBoundContact(
        [
          {
            enabled: true,
            hasPassword: false,
            identifier: 'user@example.com',
            maskedIdentifier: 'u***@example.com',
            methodId: 'method-email',
            type: 'EMAIL_PASSWORD',
            userId: 'user-1',
            verified: true,
          },
          {
            enabled: true,
            hasPassword: false,
            identifier: '+8613811112222',
            maskedIdentifier: '+86 138****2222',
            methodId: 'method-phone',
            type: 'PHONE_OTP',
            userId: 'user-1',
            verified: true,
          },
        ],
        'phone',
      ),
    ).toBe('+86 138****2222');
  });

  it('returns context-aware action labels for first binding and replacement binding', () => {
    expect(getContactBindingActionLabel(undefined)).toBe('立即绑定');
    expect(getContactBindingActionLabel('u***@example.com')).toBe('更换绑定');
  });

  it('validates email and phone values before requesting a challenge', () => {
    expect(validateContactBindingValue('email', '')).toBe('请输入邮箱地址');
    expect(validateContactBindingValue('email', 'invalid')).toBe('请输入有效的邮箱地址');
    expect(validateContactBindingValue('email', 'user@example.com')).toBe('');

    expect(validateContactBindingValue('phone', '')).toBe('请输入手机号');
    expect(validateContactBindingValue('phone', '1234')).toBe('请输入有效的手机号');
    expect(validateContactBindingValue('phone', '+8613811112222')).toBe('');
  });

  it('validates OTP format and request preconditions', () => {
    expect(validateContactBindingOtp('')).toBe('请输入验证码');
    expect(validateContactBindingOtp('123')).toBe('请输入 6 位验证码');
    expect(validateContactBindingOtp('123456')).toBe('');

    expect(
      canRequestContactBindingChallenge({
        captchaVerified: false,
        value: 'user@example.com',
      }),
    ).toBe(false);

    expect(
      canRequestContactBindingChallenge({
        captchaVerified: true,
        value: '',
      }),
    ).toBe(false);

    expect(
      canRequestContactBindingChallenge({
        captchaVerified: true,
        value: 'user@example.com',
      }),
    ).toBe(true);
  });

  it('groups login capabilities by channel for card-based rendering', () => {
    const groups = buildLoginMethodGroups([
      {
        enabled: true,
        hasPassword: true,
        identifier: 'user@example.com',
        maskedIdentifier: 'u***@example.com',
        methodId: 'email-method:PASSWORD',
        type: 'EMAIL_PASSWORD',
        userId: 'user-1',
        verified: true,
      },
      {
        enabled: false,
        hasPassword: false,
        identifier: 'user@example.com',
        maskedIdentifier: 'u***@example.com',
        methodId: 'email-method:OTP',
        type: 'EMAIL_OTP',
        userId: 'user-1',
        verified: true,
      },
      {
        enabled: false,
        hasPassword: false,
        identifier: '+8613811112222',
        maskedIdentifier: '+86 138****2222',
        methodId: 'phone-method:PASSWORD',
        type: 'PHONE_PASSWORD',
        userId: 'user-1',
        verified: false,
      },
      {
        enabled: true,
        hasPassword: false,
        identifier: '+8613811112222',
        maskedIdentifier: '+86 138****2222',
        methodId: 'phone-method:OTP',
        type: 'PHONE_OTP',
        userId: 'user-1',
        verified: false,
      },
    ]);

    expect(groups).toEqual([
      expect.objectContaining({
        boundValue: 'u***@example.com',
        kind: 'email',
        statusColor: 'blue',
        statusText: '已验证',
        title: '邮箱登录',
      }),
      expect.objectContaining({
        boundValue: '+86 138****2222',
        kind: 'phone',
        statusColor: 'orange',
        statusText: '待验证',
        title: '手机登录',
      }),
    ]);

    expect(groups[0]?.capabilities).toEqual([
      expect.objectContaining({
        enabled: true,
        hint: '',
        label: '密码登录',
      }),
      expect.objectContaining({
        enabled: false,
        hint: '',
        label: '验证码登录',
      }),
    ]);
  });

  it('explains why some mfa methods are currently unavailable', () => {
    expect(
      getMfaAvailabilityHint({
        available: false,
        bindingId: '',
        enabled: false,
        type: 'EMAIL_OTP',
      }),
    ).toBe('需要先绑定并验证邮箱');

    expect(
      getMfaAvailabilityHint({
        available: false,
        bindingId: '',
        enabled: false,
        type: 'SMS_OTP',
      }),
    ).toBe('需要先绑定并验证手机号');

    expect(
      getMfaAvailabilityHint({
        available: false,
        bindingId: '',
        enabled: false,
        type: 'BACKUP_CODE',
      }),
    ).toBe('需要先启用认证器 App');
  });

  it('returns clearer mfa destination labels for totp and recovery-code rows', () => {
    expect(
      getMfaDisplayDestination({
        available: true,
        bindingId: 'totp-1',
        enabled: true,
        type: 'TOTP',
      }),
    ).toBe('已绑定认证器 App');

    expect(
      getMfaDisplayDestination({
        available: true,
        bindingId: 'backup-1',
        enabled: false,
        type: 'BACKUP_CODE',
      }),
    ).toBe('尚未生成恢复码');
  });

  it('derives stable panel summaries for totp and recovery code cards', () => {
    expect(
      getTotpPanelMeta({
        hasPendingSetup: false,
        totpBinding: {
          available: true,
          bindingId: 'totp-1',
          enabled: true,
          type: 'TOTP',
        },
      }),
    ).toBe('当前已完成绑定，可直接用于 MFA 验证');

    expect(
      getTotpPanelMeta({
        hasPendingSetup: true,
        totpBinding: {
          available: true,
          bindingId: 'totp-1',
          enabled: false,
          type: 'TOTP',
        },
      }),
    ).toBe('请使用认证器扫码并输入验证码完成绑定');

    expect(
      getRecoveryCodePanelMeta({
        recoveryCodeBinding: {
          available: true,
          bindingId: 'backup-1',
          enabled: true,
          type: 'BACKUP_CODE',
        },
        recoveryCodes: [],
        totpBinding: {
          available: true,
          bindingId: 'totp-1',
          enabled: true,
          type: 'TOTP',
        },
      }),
    ).toBe('已启用恢复码，可按需重新生成一组新恢复码');

    expect(
      getRecoveryCodePanelMeta({
        recoveryCodeBinding: {
          available: false,
          bindingId: 'backup-1',
          enabled: false,
          type: 'BACKUP_CODE',
        },
        recoveryCodes: [],
        totpBinding: {
          available: true,
          bindingId: 'totp-1',
          enabled: false,
          type: 'TOTP',
        },
      }),
    ).toBe('需要先完成认证器 App 绑定');
  });
});
