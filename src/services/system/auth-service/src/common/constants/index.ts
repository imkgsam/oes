export { LoginMethodEnum, LoginMethodType, MfaType, SessionStatus } from '@oes/common/constants'

export enum OTP_USAGES {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  RESET_PASSWORD = 'RESET_PASSWORD',
  MFA_VERIFY = 'MFA_VERIFY'
}

export enum OTP_TYPES {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE'
}
