/**
 * 登录方法类型枚举
 */
export enum LoginMethodType {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  OAUTH_OPENID = 'OAUTH_OPENID'
}

/**
 * 认证方式枚举
 */
export enum LoginMethodEnum {
  EmailPassword = 'email-password',
  EmailOtp = 'email-otp',
  PhoneOtp = 'phone-otp',
  PhonePassword = 'phone-password',
  ContextSwitch = 'context-switch',
  Google = 'google',
  Wechat = 'wechat'
}

/**
 * 终端入口登录流程枚举
 */
export enum TerminalLoginFlow {
  EmailPassword = 'EMAIL_PASSWORD',
  EmailOtp = 'EMAIL_OTP',
  PhonePassword = 'PHONE_PASSWORD',
  PhoneOtp = 'PHONE_OTP',
  Password = 'PASSWORD',
  EmployeeCodePin = 'EMPLOYEE_CODE_PIN',
  BadgePin = 'BADGE_PIN',
  Sso = 'SSO',
  Passkey = 'PASSKEY'
}
