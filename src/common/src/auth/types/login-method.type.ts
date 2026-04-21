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
