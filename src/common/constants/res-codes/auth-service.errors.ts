import { RawException } from '../../interfaces/exceptions.interface'

export const AUTH_SERVICE_ERRORS: Record<string, RawException> = {
  NOT_ALLOW_LOGIN: {
    subCode: '0001',
    message: 'Not allowed to login',
    messageKey: 'auth.not_allow_login',
    httpStatus: 403,
  },
  OTP_EXPIRED: {
    subCode: '0002',
    message: 'OPT expired',
    messageKey: 'auth.otp_expired',
    httpStatus: 200
  },
  OTP_REACH_LIMIT: {
    subCode: '0003',
    message: 'OPT reach limit',
    messageKey: 'auth.otp_reach_limit',
    httpStatus: 200
  },
  OTP_INVALID: {
    subCode: '0004',
    message: 'OPT invalid',
    messageKey: 'auth.otp_invalid',
    httpStatus: 200
  }
}
