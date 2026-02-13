import { status } from '@grpc/grpc-js'
import { ExceptionDefinition } from '../exception.interface'

export const DATABASE_CONNECTION_FAILED: ExceptionDefinition = {
  code: 'INFRA_DB_001',
  message: 'Failed to connect to database',
  messageKey: 'infra.db.connection_failed',
  rpcStatus: status.UNAVAILABLE
}

export const DATABASE_QUERY_TIMEOUT: ExceptionDefinition = {
  code: 'INFRA_DB_002',
  message: 'Database query timed out',
  messageKey: 'infra.db.query_timeout',
  rpcStatus: status.DEADLINE_EXCEEDED
}

// 缓存
export const REDIS_CONNECTION_FAILED: ExceptionDefinition = {
  code: 'INFRA_CACHE_001',
  message: 'Failed to connect to Redis',
  messageKey: 'infra.cache.redis_connection_failed',
  rpcStatus: status.UNAVAILABLE
}

// 第三方服务
export const THIRD_PARTY_SERVICE_UNAVAILABLE: ExceptionDefinition = {
  code: 'INFRA_EXTERNAL_001',
  message: 'Third-party service is unavailable',
  messageKey: 'infra.external.unavailable',
  rpcStatus: status.UNAVAILABLE
}

// 项目内其他服务
export const INTERNAL_SERVICE_UNAVAILABLE: ExceptionDefinition = {
  code: 'INFRA_INTERNAL_DEPENDENCY_UNAVALABLE',
  message: 'Internal service is unavailable',
  messageKey: 'infra.internal.unavailable',
  rpcStatus: status.INTERNAL
}

// 未知异常
export const UNKNOWN_EXCEPTION: ExceptionDefinition = {
  code: 'INFRA_UNKNOWN_EXCEPTION',
  message: 'Unknown exception',
  messageKey: 'infra.unknown_exception',
  rpcStatus: status.INTERNAL
}
