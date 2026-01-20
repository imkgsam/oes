// common/constants/warnings/security.warnings.ts

import { WarningDescriptor } from '../../core/interfaces/warnings.interface'

export const SECURITY_WARNINGS: Record<string, WarningDescriptor> = {
  MFA_NOT_BOUND: {
    code: 'SEC_001',
    message: '当前账号尚未绑定 MFA',
    messageKey: 'warning.security.mfa_not_bound',
    category: 'SECURITY',
    severity: 'INFO'
  },

  PASSWORD_EXPIRING: {
    code: 'SEC_002',
    message: '密码即将过期',
    messageKey: 'warning.security.password_expiring',
    category: 'SECURITY',
    severity: 'WARN'
  },

  LOGIN_FROM_NEW_DEVICE: {
    code: 'SEC_003',
    message: '检测到来自新设备的登录',
    messageKey: 'warning.security.login_new_device',
    category: 'SECURITY',
    severity: 'INFO'
  },

  TOKEN_NEAR_EXPIRY: {
    code: 'SEC_004',
    message: '访问令牌即将过期',
    messageKey: 'warning.security.token_near_expiry',
    category: 'SECURITY',
    severity: 'INFO'
  }
}
