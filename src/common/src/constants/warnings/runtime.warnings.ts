// common/constants/warnings/runtime.warnings.ts
import { WarningConst } from '../../core/interfaces/warnings.interface'

export const RUNTIME_WARNINGS: Record<string, WarningConst> = {
  SLOW_RESPONSE: {
    code: 'RUN_001',
    message: '请求响应时间较慢',
    messageKey: 'warning.runtime.slow_response',
    category: 'RUNTIME',
    severity: 'INFO'
  },

  RETRY_EXECUTED: {
    code: 'RUN_002',
    message: '操作已执行重试',
    messageKey: 'warning.runtime.retry_executed',
    category: 'RUNTIME',
    severity: 'INFO',
    retriable: true
  },

  RETRY_SUCCEEDED: {
    code: 'RUN_003',
    message: '重试后操作成功',
    messageKey: 'warning.runtime.retry_succeeded',
    category: 'RUNTIME',
    severity: 'INFO'
  },

  FALLBACK_EXECUTED: {
    code: 'RUN_004',
    message: '已执行降级逻辑',
    messageKey: 'warning.runtime.fallback_executed',
    category: 'RUNTIME',
    severity: 'WARN',
    degraded: true
  },

  PARTIAL_EXECUTION: {
    code: 'RUN_005',
    message: '操作仅部分完成',
    messageKey: 'warning.runtime.partial_execution',
    category: 'RUNTIME',
    severity: 'WARN'
  }
}
