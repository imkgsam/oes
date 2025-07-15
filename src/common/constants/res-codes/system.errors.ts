import { RawException } from '../../interfaces/exceptions.interface'

export const GLOBAL_SYSTEM_ERRORS: Record<string, RawException> = {
  UNKNOWN_ERROR: {
    code: '1001',
    message: '未知系统错误',
    messageKey: 'system.unknown_error',
    httpStatus: 500,
  },

  DATABASE_CONNECTION_FAILED: {
    code: '1002',
    message: '数据库连接失败',
    messageKey: 'system.database_connection_failed',
    httpStatus: 500,
  },

  DATABASE_QUERY_FAILED: {
    code: '1003',
    message: '数据库查询失败',
    messageKey: 'system.database_query_failed',
    httpStatus: 500,
  },

  DATABASE_TIMEOUT: {
    code: '1004',
    message: '数据库请求超时',
    messageKey: 'system.database_timeout',
    httpStatus: 504,
  },

  REDIS_CONNECTION_FAILED: {
    code: '1005',
    message: 'Redis 连接失败',
    messageKey: 'system.redis_connection_failed',
    httpStatus: 500,
  },

  REDIS_OPERATION_FAILED: {
    code: '1006',
    message: 'Redis 操作失败',
    messageKey: 'system.redis_operation_failed',
    httpStatus: 500,
  },

  RPC_CONNECTION_FAILED: {
    code: '1007',
    message: 'RPC 服务连接失败',
    messageKey: 'system.rpc_connection_failed',
    httpStatus: 503,
  },

  RPC_TIMEOUT: {
    code: '1008',
    message: 'RPC 请求超时',
    messageKey: 'system.rpc_timeout',
    httpStatus: 504,
  },

  RPC_RESPONSE_INVALID: {
    code: '1009',
    message: 'RPC 响应格式错误',
    messageKey: 'system.rpc_response_invalid',
    httpStatus: 502,
  },

  FILE_UPLOAD_FAILED: {
    code: '1010',
    message: '文件上传失败',
    messageKey: 'system.file_upload_failed',
    httpStatus: 500,
  },

  FILE_NOT_FOUND: {
    code: '1011',
    message: '文件未找到',
    messageKey: 'system.file_not_found',
    httpStatus: 404,
  },

  INTERNAL_SERVER_ERROR: {
    code: '1012',
    message: '服务器内部错误',
    messageKey: 'system.internal_server_error',
    httpStatus: 500,
  },
}

export const SUCCESS = {
  code: '0x0',
  message: '操作成功',
  messageKey: 'system.success',
  HttpStatus: 200,
}
