export type TerminalCode = 'BROWSER_EXTENSION' | 'KIOSK' | 'PDA' | 'WEB';

export type TerminalMfaFactorCode =
  | 'BACKUP_CODE'
  | 'EMAIL_OTP'
  | 'SMS_OTP'
  | 'TOTP';

const TERMINAL_ORDER: TerminalCode[] = ['WEB', 'BROWSER_EXTENSION', 'PDA', 'KIOSK'];

const TERMINAL_LOGIN_FLOW_LABELS: Record<string, string> = {
  BADGE_PIN: '工牌扫码 + PIN',
  EMAIL_OTP: '邮箱 OTP',
  EMAIL_PASSWORD: '邮箱 + 密码',
  EMPLOYEE_CODE_PIN: '员工工号 + PIN',
  PASSWORD: '账号密码',
  PHONE_OTP: '手机 OTP',
  PHONE_PASSWORD: '手机 + 密码',
};

// Maps one terminal code into the stable label used by terminal-aware security settings pages.
export function getTerminalLabel(terminal: string) {
  switch (terminal) {
    case 'BROWSER_EXTENSION': {
      return 'Browser Extension / 浏览器插件';
    }
    case 'KIOSK': {
      return 'Kiosk / 触控终端';
    }
    case 'PDA': {
      return 'PDA';
    }
    default: {
      return 'Web';
    }
  }
}

// Maps one terminal login flow code into the stable label shown in platform security settings.
export function getTerminalLoginFlowLabel(flow: string) {
  return TERMINAL_LOGIN_FLOW_LABELS[flow] ?? flow;
}

// Maps one terminal MFA policy source into the stable label shown in tenant security settings.
export function getTerminalMfaSourceLabel(source?: string) {
  switch (source) {
    case 'PLATFORM_DEFAULT': {
      return '平台默认';
    }
    case 'TENANT_OVERRIDE': {
      return '租户覆盖';
    }
    default: {
      return '默认';
    }
  }
}

// Sorts terminal rows into a predictable Web, browser-extension, PDA, Kiosk order while preserving unknown terminals last.
export function orderTerminalEntries<T extends { terminal: string }>(entries: T[]) {
  return entries.toSorted((left, right) => {
    const leftIndex = TERMINAL_ORDER.indexOf(left.terminal as TerminalCode);
    const rightIndex = TERMINAL_ORDER.indexOf(right.terminal as TerminalCode);
    return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex);
  });
}

// Detects whether a terminal MFA change needs explicit operational-impact confirmation.
export function requiresTerminalMfaOperationalConfirmation(
  entries: Array<{
    loginMfaRequired: boolean;
    newDeviceMfaRequired: boolean;
    terminal: string;
  }>,
) {
  return entries.some(
    (entry) =>
      (entry.terminal === 'PDA' || entry.terminal === 'KIOSK') &&
      (entry.loginMfaRequired || entry.newDeviceMfaRequired),
  );
}
