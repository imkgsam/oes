import { RawError } from '../../interfaces/exceptions.interface'

/**
 * 认证服务错误码定义
 *
 * 错误码分类：
 * - 0001-0099: 通用认证错误
 * - 0100-0199: 登录认证错误
 * - 0200-0299: MFA 相关错误
 * - 0300-0399: Session 相关错误
 * - 0400-0499: 设备相关错误
 */

// ==================== Code-based Errors (RawError) ====================
// 这些错误用于内部业务逻辑，不直接返回给客户端

export const AUTH_SERVICE_CODE_ERRORS: Record<string, RawError> = {
  // ==================== 通用认证错误 (0001-0099) ====================

  /**
   * OTP 验证码已过期
   *
   * 使用场景：
   * - 邮箱验证码超过有效期
   * - 短信验证码超过有效期
   * - TOTP 时间窗口已过期
   * - 用户输入验证码时已超时
   */
  OTP_EXPIRED: {
    subCode: '0002',
    message: '验证码已过期',
    messageKey: 'auth.otp_expired'
  },

  /**
   * OTP 验证尝试次数已达上限
   *
   * 使用场景：
   * - 用户连续输入错误验证码超过限制
   * - 防止暴力破解验证码
   * - 需要用户重新获取验证码
   */
  OTP_REACH_LIMIT: {
    subCode: '0003',
    message: '验证码尝试次数已达上限',
    messageKey: 'auth.otp_reach_limit'
  },

  /**
   * OTP 验证码无效
   *
   * 使用场景：
   * - 用户输入错误的验证码
   * - 验证码格式不正确
   * - 验证码已被使用
   * - 验证码与用户不匹配
   */
  OTP_INVALID: {
    subCode: '0004',
    message: '验证码无效',
    messageKey: 'auth.otp_invalid'
  },

  // ==================== MFA 相关错误 (0200-0299) ====================

  /**
   * MFA 类型不匹配
   *
   * 使用场景：
   * - 用户尝试使用错误的 MFA 类型进行验证
   * - 前端传递的 MFA 类型与后端期望不符
   * - 用户绑定类型与验证类型不一致
   */
  MFA_TYPE_MISMATCH: {
    subCode: '0200',
    message: 'MFA 类型不匹配',
    messageKey: 'auth.mfa_type_mismatch'
  },

  /**
   * MFA 绑定已禁用
   *
   * 使用场景：
   * - 用户禁用了某种 MFA 方式
   * - 管理员禁用了用户的 MFA 绑定
   * - 系统维护时临时禁用 MFA
   */
  MFA_DISABLED: {
    subCode: '0201',
    message: 'MFA 绑定已禁用',
    messageKey: 'auth.mfa_disabled'
  },

  /**
   * MFA 类型不支持
   *
   * 使用场景：
   * - 用户尝试绑定不支持的 MFA 类型
   * - 系统不支持某种 MFA 方式
   * - 配置错误导致类型不支持
   */
  MFA_TYPE_NOT_SUPPORTED: {
    subCode: '0202',
    message: 'MFA 类型不支持',
    messageKey: 'auth.mfa_type_not_supported'
  },

  /**
   * MFA 验证需要 OTP 令牌
   *
   * 使用场景：
   * - 验证邮箱或短信 MFA 时缺少 OTP 令牌
   * - 前端未正确传递 OTP 令牌
   * - 令牌已过期或无效
   */
  MFA_OTP_TOKEN_REQUIRED: {
    subCode: '0203',
    message: 'MFA 验证需要 OTP 令牌',
    messageKey: 'auth.mfa_otp_token_required'
  },

  /**
   * MFA 绑定不存在
   *
   * 使用场景：
   * - 用户尝试验证未绑定的 MFA 方式
   * - 绑定 ID 不存在或已删除
   * - 用户未设置 MFA
   * - 绑定数据损坏或丢失
   */
  MFA_BINDING_NOT_FOUND: {
    subCode: '0204',
    message: 'MFA 绑定不存在',
    messageKey: 'auth.mfa_binding_not_found'
  },

  /**
   * MFA 绑定已存在
   *
   * 使用场景：
   * - 用户尝试重复绑定同类型的 MFA
   * - 用户已绑定该类型的 MFA
   * - 防止重复绑定同一设备或账号
   */
  MFA_BINDING_ALREADY_EXISTS: {
    subCode: '0206',
    message: 'MFA 绑定已存在',
    messageKey: 'auth.mfa_binding_already_exists'
  }
}

// ==================== Exception-based Errors (RawError) ====================
// 这些错误会直接返回给客户端，包含 HTTP 状态码

export const AUTH_SERVICE_EXCEPTION_ERRORS: Record<string, RawError> = {
  // ==================== 登录认证错误 (0100-0199) ====================

  /**
   * 认证失败
   *
   * 使用场景：
   * - 通用认证失败
   * - 认证过程中发生未知错误
   * - 系统无法完成认证流程
   */
  AUTHENTICATION_FAILED: {
    subCode: '0100',
    message: '认证失败',
    messageKey: 'auth.authentication_failed',
    httpStatus: 401
  },

  /**
   * 无效凭证
   *
   * 使用场景：
   * - 用户名或密码错误
   * - 邮箱或密码不匹配
   * - 手机号或密码不匹配
   */
  INVALID_CREDENTIALS: {
    subCode: '0101',
    message: '用户名或密码错误',
    messageKey: 'auth.invalid_credentials',
    httpStatus: 401
  },

  /**
   * 账户被禁用
   *
   * 使用场景：
   * - 用户账户被管理员禁用
   * - 用户账户因违规被封禁
   * - 账户状态异常
   */
  ACCOUNT_DISABLED: {
    subCode: '0102',
    message: '账户已被禁用',
    messageKey: 'auth.account_disabled',
    httpStatus: 403
  },

  /**
   * 登录方法未验证
   *
   * 使用场景：
   * - 邮箱登录方法未验证
   * - 手机号登录方法未验证
   * - 需要先验证登录方法才能使用
   */
  LOGIN_METHOD_NOT_VERIFIED: {
    subCode: '0103',
    message: '登录方法未验证',
    messageKey: 'auth.login_method_not_verified',
    httpStatus: 403
  },

  /**
   * 密码凭证未找到
   *
   * 使用场景：
   * - 用户没有设置密码
   * - 密码凭证被删除
   * - 密码凭证配置错误
   */
  PASSWORD_CREDENTIAL_NOT_FOUND: {
    subCode: '0106',
    message: '密码凭证未找到',
    messageKey: 'auth.password_credential_not_found',
    httpStatus: 404
  },

  /**
   * 密码凭证被禁用
   *
   * 使用场景：
   * - 密码登录被禁用
   * - 管理员禁用了密码登录
   * - 密码凭证状态异常
   */
  PASSWORD_CREDENTIAL_DISABLED: {
    subCode: '0107',
    message: '密码登录被禁用',
    messageKey: 'auth.password_credential_disabled',
    httpStatus: 403
  },

  /**
   * OAuth 凭证未找到
   *
   * 使用场景：
   * - 用户没有 OAuth 凭证
   * - OAuth 凭证被删除
   * - OAuth 配置缺失
   */
  OAUTH_CREDENTIAL_NOT_FOUND: {
    subCode: '0108',
    message: 'OAuth 凭证未找到',
    messageKey: 'auth.oauth_credential_not_found',
    httpStatus: 404
  },

  /**
   * OAuth 凭证被禁用
   *
   * 使用场景：
   * - OAuth 登录被禁用
   * - 管理员禁用了 OAuth 登录
   * - OAuth 凭证状态异常
   */
  OAUTH_CREDENTIAL_DISABLED: {
    subCode: '0109',
    message: 'OAuth 登录被禁用',
    messageKey: 'auth.oauth_credential_disabled',
    httpStatus: 403
  }
}

// ==================== 兼容性导出 ====================
// 为了保持向后兼容，合并所有错误到一个对象中

export const AUTH_SERVICE_ERRORS: Record<string, RawError> = {
  ...AUTH_SERVICE_CODE_ERRORS,
  ...AUTH_SERVICE_EXCEPTION_ERRORS
}
