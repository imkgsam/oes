export type TenantMfaFactorCode =
  | 'BACKUP_CODE'
  | 'EMAIL_OTP'
  | 'SMS_OTP'
  | 'TOTP';

export type TenantMfaScenarioCode =
  | 'CHANGE_CONTACT'
  | 'CHANGE_PASSWORD'
  | 'LOGIN'
  | 'NEW_DEVICE_LOGIN';

export interface TenantMfaFactorItem {
  enabled: boolean;
  factor: TenantMfaFactorCode;
  priority: number;
}

export interface TenantMfaScenarioRequirementItem {
  required: boolean;
  scenario: TenantMfaScenarioCode;
}

export const ACCOUNT_SECURITY_MFA_SCENARIOS: TenantMfaScenarioCode[] = [
  'CHANGE_PASSWORD',
  'CHANGE_CONTACT',
];

// Maps one tenant MFA factor code into the stable label shown in the tenant settings page.
export function getTenantMfaFactorLabel(factor: TenantMfaFactorCode) {
  switch (factor) {
    case 'BACKUP_CODE': {
      return '恢复码';
    }
    case 'EMAIL_OTP': {
      return '邮箱 OTP';
    }
    case 'SMS_OTP': {
      return '手机 OTP';
    }
    default: {
      return '认证器';
    }
  }
}

// Maps one tenant MFA scenario code into the stable label shown in the tenant settings page.
export function getTenantMfaScenarioLabel(scenario: TenantMfaScenarioCode) {
  switch (scenario) {
    case 'CHANGE_CONTACT': {
      return '更换邮箱 / 手机';
    }
    case 'CHANGE_PASSWORD': {
      return '修改密码';
    }
    case 'NEW_DEVICE_LOGIN': {
      return '新设备登录';
    }
    default: {
      return '登录';
    }
  }
}

// Maps one tenant MFA scenario code into the concise tooltip copy used by the settings rows.
export function getTenantMfaScenarioTooltip(scenario: TenantMfaScenarioCode) {
  switch (scenario) {
    case 'CHANGE_CONTACT': {
      return '用户更换绑定邮箱或手机号前，需要先完成一次 MFA 验证。';
    }
    case 'CHANGE_PASSWORD': {
      return '用户修改当前账号密码前，需要先完成一次 MFA 验证。';
    }
    case 'NEW_DEVICE_LOGIN': {
      return '用户在未受信设备进入当前租户时，需要先完成 MFA；通过后可选择是否信任当前设备。';
    }
    default: {
      return '用户完成主认证并选择账号后，需要再完成一次 MFA 验证才能进入租户。';
    }
  }
}

// Maps one tenant MFA factor code into the concise tooltip copy used by the priority list.
export function getTenantMfaFactorTooltip(factor: TenantMfaFactorCode) {
  switch (factor) {
    case 'BACKUP_CODE': {
      return '恢复码用于应急兜底，一次性使用后失效。';
    }
    case 'EMAIL_OTP': {
      return '通过已验证邮箱接收一次性验证码。';
    }
    case 'SMS_OTP': {
      return '通过已验证手机号接收一次性验证码。';
    }
    default: {
      return '通过认证器 App 生成动态验证码。';
    }
  }
}

// Normalizes tenant MFA scenario requirements into the stable display order expected by the settings page.
export function orderTenantMfaScenarioRequirements(
  items: TenantMfaScenarioRequirementItem[],
) {
  const order: TenantMfaScenarioCode[] = [
    'LOGIN',
    'CHANGE_PASSWORD',
    'CHANGE_CONTACT',
    'NEW_DEVICE_LOGIN',
  ];
  const itemMap = new Map(items.map((item) => [item.scenario, item]));

  return order.map((scenario) => ({
    scenario,
    required: itemMap.get(scenario)?.required ?? false,
  }));
}

// Narrows MFA scenario rows to account-security operations because terminal login MFA is governed separately.
export function orderAccountSecurityMfaScenarioRequirements(
  items: TenantMfaScenarioRequirementItem[],
) {
  const itemMap = new Map(items.map((item) => [item.scenario, item]));

  return ACCOUNT_SECURITY_MFA_SCENARIOS.map((scenario) => ({
    scenario,
    required: itemMap.get(scenario)?.required ?? false,
  }));
}

// Reorders tenant MFA factors after one drag operation and recomputes contiguous priorities.
export function reorderTenantMfaFactors(
  factors: TenantMfaFactorItem[],
  oldIndex: number,
  newIndex: number,
) {
  const normalized = factors.toSorted((left, right) => left.priority - right.priority);

  if (
    oldIndex < 0 ||
    newIndex < 0 ||
    oldIndex >= normalized.length ||
    newIndex >= normalized.length ||
    oldIndex === newIndex
  ) {
    return normalized.map((factor, index) => ({
      ...factor,
      priority: index + 1,
    }));
  }

  const [movedFactor] = normalized.splice(oldIndex, 1);
  if (!movedFactor) {
    return normalized.map((factor, index) => ({
      ...factor,
      priority: index + 1,
    }));
  }

  normalized.splice(newIndex, 0, movedFactor);

  return normalized.map((factor, index) => ({
    ...factor,
    priority: index + 1,
  }));
}
