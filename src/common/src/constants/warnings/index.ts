// common/constants/warnings/index.ts

import { WarningConst } from '../../core/interfaces/warnings.interface'

export const WARNING_CONST: Record<string, WarningConst> = {
  FALLBACK_USED: {
    subCode: 'INT_001',
    message: '已使用降级逻辑返回结果',
    messageKey: 'warning.integration.fallback_used',
    category: 'INTEGRATION',
    severity: 'WARN'
  },

  PARTIAL_DOWNSTREAM_FAILURE: {
    subCode: 'INT_002',
    message: '部分非关键下游服务调用失败',
    messageKey: 'warning.integration.partial_downstream_failure',
    category: 'INTEGRATION',
    severity: 'WARN'
  },

  THIRD_PARTY_TIMEOUT_FALLBACK: {
    subCode: 'INT_003',
    message: '第三方服务超时，已使用兜底数据',
    messageKey: 'warning.integration.third_party_timeout_fallback',
    category: 'INTEGRATION',
    severity: 'WARN'
  },

  THIRD_PARTY_RATE_LIMITED_FALLBACK: {
    subCode: 'INT_004',
    message: '第三方服务限流，已使用兜底策略',
    messageKey: 'warning.integration.third_party_rate_limited_fallback',
    category: 'INTEGRATION',
    severity: 'WARN'
  },
  OPERATION_PARTIALLY_APPLIED: {
    subCode: 'BUS_001',
    message: '部分业务操作未生效',
    messageKey: 'warning.business.partial_operation',
    category: 'BUSINESS',
    severity: 'WARN'
  },

  REQUEST_AUTO_ADJUSTED: {
    subCode: 'BUS_002',
    message: '请求参数已自动调整',
    messageKey: 'warning.business.request_auto_adjusted',
    category: 'BUSINESS',
    severity: 'INFO'
  },
  DEFAULT_VALUE_USED: {
    subCode: 'DATA_001',
    message: '部分字段使用默认值',
    messageKey: 'warning.data.default_value_used',
    category: 'VALIDATION',
    severity: 'INFO'
  },

  PRECISION_TRUNCATED: {
    subCode: 'DATA_002',
    message: '数值精度已被截断',
    messageKey: 'warning.data.precision_truncated',
    category: 'VALIDATION',
    severity: 'INFO'
  },

  OPTIONAL_FIELD_OMITTED: {
    subCode: 'DATA_003',
    message: '部分可选字段未返回',
    messageKey: 'warning.data.optional_field_omitted',
    category: 'VALIDATION',
    severity: 'INFO'
  }
}
