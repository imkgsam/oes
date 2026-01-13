import { RawError } from '../../../interfaces/exceptions.interface'

export const GLOBAL_SYSTEM_ERRORS: Record<string, RawError> = {
  DATABASE_CONNECTION_FAILED: {
    subCode: '1002',
    message: '数据库连接失败',
    messageKey: 'system.database_connection_failed',
    httpStatus: 500
  },

  DATABASE_QUERY_FAILED: {
    subCode: '1003',
    message: '数据库查询失败',
    messageKey: 'system.database_query_failed',
    httpStatus: 500
  },

  DATABASE_TIMEOUT: {
    subCode: '1004',
    message: '数据库请求超时',
    messageKey: 'system.database_timeout',
    httpStatus: 504
  },

  REDIS_CONNECTION_FAILED: {
    subCode: '1005',
    message: 'Redis 连接失败',
    messageKey: 'system.redis_connection_failed',
    httpStatus: 500
  },

  REDIS_OPERATION_FAILED: {
    subCode: '1006',
    message: 'Redis 操作失败',
    messageKey: 'system.redis_operation_failed',
    httpStatus: 500
  },

  RPC_CONNECTION_FAILED: {
    subCode: '1007',
    message: 'RPC 服务连接失败',
    messageKey: 'system.rpc_connection_failed',
    httpStatus: 503
  },

  RPC_TIMEOUT: {
    subCode: '1008',
    message: 'RPC 请求超时',
    messageKey: 'system.rpc_timeout',
    httpStatus: 504
  },

  RPC_RESPONSE_INVALID: {
    subCode: '1009',
    message: 'RPC 响应格式错误',
    messageKey: 'system.rpc_response_invalid',
    httpStatus: 502
  },

  FILE_UPLOAD_FAILED: {
    subCode: '1010',
    message: '文件上传失败',
    messageKey: 'system.file_upload_failed',
    httpStatus: 500
  },

  FILE_NOT_FOUND: {
    subCode: '1011',
    message: '文件未找到',
    messageKey: 'system.file_not_found',
    httpStatus: 404
  },

  MFA_METADATA_PARSE_ERROR: {
    subCode: '0005',
    message: '解析 MFA 绑定元数据失败',
    messageKey: 'system.mfa_metadata_parse_error',
    httpStatus: 500
  },
  MFA_DEVICE_INFO_PARSE_ERROR: {
    subCode: '0006',
    message: '解析 MFA 绑定设备信息失败',
    messageKey: 'system.mfa_device_info_parse_error',
    httpStatus: 500
  }
}

export const SUCCESS = {
  subCode: '0x0',
  message: '操作成功',
  messageKey: 'system.success',
  HttpStatus: 200
}
