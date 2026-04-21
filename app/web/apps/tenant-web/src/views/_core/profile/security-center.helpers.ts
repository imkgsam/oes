import type { SelfSecurityApi } from '#/api';

export type ContactBindingKind = 'email' | 'phone';
export type LoginMethodGroupKind = 'email' | 'phone';

export interface LoginMethodCapabilityItem {
  enabled: boolean;
  hasPassword: boolean;
  hint: string;
  label: string;
  methodId: string;
  type: string;
  verified: boolean;
}

export interface LoginMethodGroup {
  boundValue: string;
  capabilities: LoginMethodCapabilityItem[];
  kind: LoginMethodGroupKind;
  statusColor: 'blue' | 'default' | 'orange';
  statusText: string;
  title: string;
}

interface LoginMethodGroupDefinition {
  supportedTypes: Set<string>;
  kind: LoginMethodGroupKind;
  passwordType: string;
  otpType: string;
  title: string;
}

const LOGIN_METHOD_GROUP_DEFINITIONS: LoginMethodGroupDefinition[] = [
  {
    supportedTypes: new Set(['EMAIL', 'EMAIL_OTP', 'EMAIL_PASSWORD']),
    kind: 'email',
    passwordType: 'EMAIL_PASSWORD',
    otpType: 'EMAIL_OTP',
    title: '邮箱登录',
  },
  {
    supportedTypes: new Set(['PHONE', 'PHONE_OTP', 'PHONE_PASSWORD']),
    kind: 'phone',
    passwordType: 'PHONE_PASSWORD',
    otpType: 'PHONE_OTP',
    title: '手机登录',
  },
];

// Resolves the current bound email or phone label from verified login methods.
export function resolveBoundContact(
  loginMethods: SelfSecurityApi.LoginMethod[],
  kind: ContactBindingKind,
) {
  const supportedTypes = resolveGroupDefinition(kind).supportedTypes;

  const method = loginMethods.find(
    (item) => item.verified && supportedTypes.has(item.type),
  );

  return method?.maskedIdentifier || method?.identifier || '';
}

// Returns the CTA label for the current binding state.
export function getContactBindingActionLabel(boundValue?: string) {
  return boundValue ? '更换绑定' : '立即绑定';
}

// Validates one email or phone value before the binding challenge is requested.
export function validateContactBindingValue(
  kind: ContactBindingKind,
  value: string,
) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return kind === 'email' ? '请输入邮箱地址' : '请输入手机号';
  }

  if (kind === 'email') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)
      ? ''
      : '请输入有效的邮箱地址';
  }

  return /^\+\d{6,20}$/.test(trimmedValue) ? '' : '请输入有效的手机号';
}

// Validates one OTP value before the binding verification is submitted.
export function validateContactBindingOtp(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return '请输入验证码';
  }

  return /^\d{6}$/.test(trimmedValue) ? '' : '请输入 6 位验证码';
}

// Decides whether the UI can request a new binding challenge.
export function canRequestContactBindingChallenge(input: {
  captchaVerified: boolean;
  value: string;
}) {
  return input.captchaVerified && input.value.trim().length > 0;
}

// Builds email and phone login-capability groups for the compact security-center card layout.
export function buildLoginMethodGroups(
  loginMethods: SelfSecurityApi.LoginMethod[],
): LoginMethodGroup[] {
  return LOGIN_METHOD_GROUP_DEFINITIONS.map((definition) =>
    buildLoginMethodGroup(loginMethods, definition),
  );
}

// Explains why one MFA factor is currently unavailable in self-service security management.
export function getMfaAvailabilityHint(binding: SelfSecurityApi.MfaBinding) {
  if (binding.available) {
    return binding.enabled ? '当前可用于二次验证' : '满足启用条件，可按需开启';
  }

  switch (binding.type) {
    case 'EMAIL_OTP': {
      return '需要先绑定并验证邮箱';
    }
    case 'SMS_OTP': {
      return '需要先绑定并验证手机号';
    }
    case 'BACKUP_CODE': {
      return '需要先启用认证器 App';
    }
    case 'TOTP':
    default: {
      return '当前方式暂不可用';
    }
  }
}

// Returns a clearer fallback destination label for MFA rows whose target is implicit.
export function getMfaDisplayDestination(binding: SelfSecurityApi.MfaBinding) {
  if (binding.destination) {
    return binding.destination;
  }

  switch (binding.type) {
    case 'TOTP': {
      return binding.enabled ? '已绑定认证器 App' : '尚未绑定认证器 App';
    }
    case 'BACKUP_CODE': {
      return binding.enabled ? '已生成恢复码' : '尚未生成恢复码';
    }
    default: {
      return '未提供绑定目标';
    }
  }
}

// Summarizes the TOTP card state so the panel does not keep showing initialization copy after binding.
export function getTotpPanelMeta(input: {
  hasPendingSetup: boolean;
  totpBinding?: null | SelfSecurityApi.MfaBinding;
}) {
  if (input.hasPendingSetup) {
    return '请使用认证器扫码并输入验证码完成绑定';
  }

  if (input.totpBinding?.enabled) {
    return '当前已完成绑定，可直接用于 MFA 验证';
  }

  return '支持 Google Authenticator 等标准认证器应用';
}

// Summarizes the recovery-code card state from the TOTP prerequisite and existing recovery-code binding.
export function getRecoveryCodePanelMeta(input: {
  recoveryCodeBinding?: null | SelfSecurityApi.MfaBinding;
  recoveryCodes: string[];
  totpBinding?: null | SelfSecurityApi.MfaBinding;
}) {
  if (!input.totpBinding?.enabled) {
    return '需要先完成认证器 App 绑定';
  }

  if (input.recoveryCodes.length > 0) {
    return '当前页已展示最新恢复码';
  }

  if (input.recoveryCodeBinding?.enabled) {
    return '已启用恢复码，可按需重新生成一组新恢复码';
  }

  return '建议生成一组恢复码作为应急登录备用';
}

function buildLoginMethodGroup(
  loginMethods: SelfSecurityApi.LoginMethod[],
  definition: LoginMethodGroupDefinition,
): LoginMethodGroup {
  const passwordMethod = loginMethods.find(
    (item) => item.type === definition.passwordType,
  );
  const otpMethod = loginMethods.find((item) => item.type === definition.otpType);
  const representativeMethod = passwordMethod ?? otpMethod ?? null;
  const verified = Boolean(passwordMethod?.verified || otpMethod?.verified);

  return {
    boundValue:
      representativeMethod?.maskedIdentifier ||
      representativeMethod?.identifier ||
      '',
    capabilities: [
      {
        enabled: Boolean(passwordMethod?.enabled),
        hasPassword: Boolean(passwordMethod?.hasPassword),
        hint: '',
        label: '密码登录',
        methodId: passwordMethod?.methodId ?? '',
        type: definition.passwordType,
        verified: Boolean(passwordMethod?.verified),
      },
      {
        enabled: Boolean(otpMethod?.enabled),
        hasPassword: false,
        hint: '',
        label: '验证码登录',
        methodId: otpMethod?.methodId ?? '',
        type: definition.otpType,
        verified: Boolean(otpMethod?.verified),
      },
    ],
    kind: definition.kind,
    statusColor: representativeMethod ? (verified ? 'blue' : 'orange') : 'default',
    statusText: representativeMethod ? (verified ? '已验证' : '待验证') : '未绑定',
    title: definition.title,
  };
}

function resolveGroupDefinition(kind: LoginMethodGroupKind): LoginMethodGroupDefinition {
  return LOGIN_METHOD_GROUP_DEFINITIONS.find((definition) => definition.kind === kind)!;
}
