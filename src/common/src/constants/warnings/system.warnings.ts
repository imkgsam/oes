// common/constants/warnings/index.ts

import { WarningDescriptor } from '../../core/interfaces/warnings.interface'

export const SYSTEM_WARNINGS: Record<string, WarningDescriptor> = {
  CONFIG_MISSING: {
    code: 'SYS_001',
    message: '系统配置缺失，已使用默认配置',
    messageKey: 'warning.system.config_missing',
    category: 'SYSTEM',
    severity: 'WARN'
  },

  CONFIG_DEFAULT_USED: {
    code: 'SYS_002',
    message: '系统使用了默认配置',
    messageKey: 'warning.system.config_default_used',
    category: 'SYSTEM',
    severity: 'INFO'
  },

  CACHE_CONNECTION_FAILED: {
    code: 'SYS_003',
    message: '缓存服务连接失败，已降级',
    messageKey: 'warning.system.cache_connection_failed',
    category: 'SYSTEM',
    severity: 'WARN',
    degraded: true,
    retriable: true
  },

  CACHE_PARTIAL_HIT: {
    code: 'SYS_004',
    message: '部分缓存未命中',
    messageKey: 'warning.system.cache_partial_hit',
    category: 'SYSTEM',
    severity: 'INFO'
  },

  RESOURCE_SOFT_LIMIT_REACHED: {
    code: 'SYS_005',
    message: '系统资源接近上限',
    messageKey: 'warning.system.resource_soft_limit_reached',
    category: 'SYSTEM',
    severity: 'WARN'
  },

  FEATURE_FLAG_DISABLED: {
    code: 'SYS_006',
    message: '功能开关已关闭',
    messageKey: 'warning.system.feature_flag_disabled',
    category: 'SYSTEM',
    severity: 'INFO'
  }
}
