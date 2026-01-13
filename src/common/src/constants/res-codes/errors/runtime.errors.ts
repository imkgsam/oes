import { RawError } from '../../../interfaces/exceptions.interface'

export const GLOBAL_RUNTIME_ERRORS: Record<string, RawError> = {
  UNKNOWN_ERROR: {
    subCode: '9999',
    message: '未知系统错误',
    messageKey: 'runtime.unknown_error',
    httpStatus: 500
  },
  INVALID_RPC_STRUCTURE: {
    subCode: '0002',
    message: '无效的 RPC 响应结构',
    messageKey: 'runtime.invalid_rpc_structure',
    httpStatus: 500
  },
  ENV_VARIABLE_NOT_SET: {
    subCode: '0003',
    message: '环境变量未设置',
    messageKey: 'runtime.env_variable_not_set',
    httpStatus: 500
  },
  VALIDATION_ERROR: {
    subCode: '0004',
    message: '数据验证失败',
    messageKey: 'runtime.validation_error',
    httpStatus: 400
  }
}
