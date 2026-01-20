// common/constants/warnings/validation.warnings.ts

import { WarningDescriptor } from '../../core/interfaces/warnings.interface'

export const VALIDATION_WARNINGS: Record<string, WarningDescriptor> = {
  PARTIAL_PERMISSION_GRANTED: {
    code: 'VAL_001',
    message: '仅授予了部分权限',
    messageKey: 'warning.validation.partial_permission_granted',
    category: 'VALIDATION',
    severity: 'WARN'
  },

  TENANT_SCOPE_PARTIAL: {
    code: 'VAL_002',
    message: '租户权限范围不完整',
    messageKey: 'warning.validation.tenant_scope_partial',
    category: 'VALIDATION',
    severity: 'WARN'
  },

  DEFAULT_VALUE_APPLIED: {
    code: 'VAL_003',
    message: '部分字段已使用默认值',
    messageKey: 'warning.validation.default_value_applied',
    category: 'VALIDATION',
    severity: 'INFO'
  }
}
