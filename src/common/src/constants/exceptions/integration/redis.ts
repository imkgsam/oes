import { RawError } from '../../../core/interfaces/exceptions.interface'

// Redis 相关错误
// 2xxx

export const REDIS_EXCEPTIONS: Record<string, RawError> = {
  REDIS_CONNECTION_FAILED: {
    subCode: '2001',
    message: 'Redis 连接失败',
    messageKey: 'system.redis_connection_failed',
    httpStatus: 500
  },

  REDIS_OPERATION_FAILED: {
    subCode: '2001',
    message: 'Redis 操作失败',
    messageKey: 'system.redis_operation_failed',
    httpStatus: 500
  }
}
