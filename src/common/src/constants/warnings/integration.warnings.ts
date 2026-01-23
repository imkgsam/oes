// common/constants/warnings/integration.warnings.ts

import { WarningConst } from '../../core/interfaces/warnings.interface'

export const INTEGRATION_WARNINGS: Record<string, WarningConst> = {
  RPC_PARTIAL_FAILURE: {
    code: 'INT_001',
    message: '部分下游服务调用失败',
    messageKey: 'warning.integration.rpc_partial_failure',
    category: 'INTEGRATION',
    severity: 'WARN',
    degraded: true
  },

  RPC_FALLBACK_USED: {
    code: 'INT_002',
    message: 'RPC 调用已启用降级逻辑',
    messageKey: 'warning.integration.rpc_fallback_used',
    category: 'INTEGRATION',
    severity: 'WARN',
    degraded: true
  },

  SERVICE_RESPONSE_DELAYED: {
    code: 'INT_003',
    message: '下游服务响应延迟',
    messageKey: 'warning.integration.service_response_delayed',
    category: 'INTEGRATION',
    severity: 'INFO'
  },

  THIRD_PARTY_RATE_LIMITED: {
    code: 'INT_004',
    message: '第三方服务触发限流',
    messageKey: 'warning.integration.third_party_rate_limited',
    category: 'INTEGRATION',
    severity: 'WARN',
    retriable: true
  },

  EVENT_PUBLISH_DELAYED: {
    code: 'INT_005',
    message: '事件发布延迟',
    messageKey: 'warning.integration.event_publish_delayed',
    category: 'INTEGRATION',
    severity: 'INFO'
  }
}
