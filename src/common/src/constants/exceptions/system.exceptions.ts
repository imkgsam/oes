import { RawError } from '../../core/interfaces/exceptions.interface'

export const SYSTEM_EXCEPTIONS: Record<string, RawError> = {
  // 未知兜底错误
  UNKNOWN_ERROR: {
    subCode: '9999',
    message: '未知系统错误',
    messageKey: 'runtime.unknown_error',
    httpStatus: 500
  },

  // 环境变量相关
  ENV_VARIABLE_NOT_SET: {
    subCode: '0001',
    message: '环境变量未设置',
    messageKey: 'runtime.env_variable_not_set',
    httpStatus: 500
  },

  // MFA 解析错误
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
