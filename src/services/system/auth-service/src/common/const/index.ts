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

export enum LoginMethodType {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  OAUTH_OPENID = 'OAUTH_OPENID'
}

export enum MfaType {
  // 时间动态密码，典型 MFA 方式
  TOTP = 'TOTP',
  // 邮箱验证码，作为第二因素
  EMAIL_OTP = 'EMAIL_OTP',
  // 短信验证码
  SMS_OTP = 'SMS_OTP',
  // 备用码
  BACKUP_CODE = 'BACKUP_CODE',
  // 推送通知
  PUSH_NOTIFICATION = 'PUSH_NOTIFICATION',
  // 硬件令牌
  HARDWARE_TOKEN = 'HARDWARE_TOKEN',
  // 生物识别
  BIOMETRIC = 'BIOMETRIC'
}

/**
 * 认证相关枚举
 *
 * 功能：定义认证相关的枚举类型
 *
 * 使用场景：
 * - 登录方式管理
 * - 认证方法分类
 * - 跨模块的认证功能
 * - 统一的认证方式标识
 *
 * 技术特点：
 * - 字符串枚举，便于序列化
 * - 语义化命名
 * - 跨模块共享
 */
export enum LoginMethodEnum {
  EmailPassword = 'email-password',
  EmailOtp = 'email-otp',
  PhoneOtp = 'phone-otp',
  PhonePassword = 'phone-password',
  Google = 'google',
  Wechat = 'wechat'
}

/**
 * Session 相关枚举
 *
 * 功能：定义会话管理相关的枚举类型
 *
 * 使用场景：
 * - 会话状态管理
 * - 令牌类型定义
 * - 跨模块的会话相关功能
 * - 统一的会话状态标识
 *
 * 技术特点：
 * - 字符串枚举，便于序列化
 * - 语义化命名
 * - 跨模块共享
 */
export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
  SUSPENDED = 'SUSPENDED'
}

/**
 * 令牌类型枚举
 *
 * 使用场景：
 * - JWT 令牌类型区分
 * - 访问令牌和刷新令牌管理
 * - 令牌验证和刷新机制
 * - 安全策略应用
 */
export enum TokenType {
  ACCESS = 'ACCESS',
  REFRESH = 'REFRESH'
}
