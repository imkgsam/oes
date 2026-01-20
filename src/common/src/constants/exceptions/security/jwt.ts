import { RawError } from '../../../core/interfaces/exceptions.interface'

//token 相关
// 0xxx

export const JWT_EXCEPTIONS: Record<string, RawError> = {
  JWT_MISSING: {
    subCode: '0001',
    message: '缺少 JWT 访问令牌',
    messageKey: 'system.jwt_missing',
    httpStatus: 401
  },
  JWT_INVALID: {
    subCode: '0002',
    message: 'JWT 无效',
    messageKey: 'system.jwt_invalid',
    httpStatus: 401
  },
  JWT_EXPIRED: {
    subCode: '0003',
    message: 'JWT 已过期',
    messageKey: 'system.jwt_expired',
    httpStatus: 401
  }
}
