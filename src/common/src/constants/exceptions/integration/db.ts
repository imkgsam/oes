import { RawError } from '../../../core/interfaces/exceptions.interface'

// 数据库相关错误
// 1xxx

export const DB_EXCEPTIONS: Record<string, RawError> = {
  DATABASE_CONNECTION_FAILED: {
    subCode: '1001',
    message: '数据库连接失败',
    messageKey: 'system.database_connection_failed',
    httpStatus: 500
  },

  DATABASE_QUERY_FAILED: {
    subCode: '1002',
    message: '数据库查询失败',
    messageKey: 'system.database_query_failed',
    httpStatus: 500
  },

  DATABASE_TIMEOUT: {
    subCode: '1003',
    message: '数据库请求超时',
    messageKey: 'system.database_timeout',
    httpStatus: 504
  }
}
