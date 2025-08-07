import { RawException } from '../../interfaces/exceptions.interface'

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

export const AUTH_SERVICE_ERRORS: Record<string, RawException> = {
  // ==================== 通用认证错误 (0001-0099) ====================

  /**
   * 用户不允许登录
   *
   * 使用场景：
   * - 用户账户被禁用或封禁
   * - 用户权限不足
   * - 登录时间限制
   * - 地理位置限制
   */
  NOT_ALLOW_LOGIN: {
    subCode: '0001',
    message: '不允许登录',
    messageKey: 'auth.not_allow_login',
    httpStatus: 403
  },

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
    messageKey: 'auth.otp_expired',
    httpStatus: 400
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
    messageKey: 'auth.otp_reach_limit',
    httpStatus: 400
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
    messageKey: 'auth.otp_invalid',
    httpStatus: 400
  },

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
   * OAuth 凭证无效
   *
   * 使用场景：
   * - Google OAuth 凭证无效
   * - 微信 OAuth 凭证无效
   * - OAuth 配置错误
   */
  OAUTH_INVALID: {
    subCode: '0104',
    message: 'OAuth 凭证无效',
    messageKey: 'auth.oauth_invalid',
    httpStatus: 401
  },

  /**
   * 账户未关联
   *
   * 使用场景：
   * - Google 账户未关联到用户
   * - 微信账户未关联到用户
   * - 第三方账户未绑定
   */
  ACCOUNT_NOT_LINKED: {
    subCode: '0105',
    message: '账户未关联',
    messageKey: 'auth.account_not_linked',
    httpStatus: 404
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
    messageKey: 'auth.mfa_type_mismatch',
    httpStatus: 400
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
    messageKey: 'auth.mfa_disabled',
    httpStatus: 403
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
    messageKey: 'auth.mfa_type_not_supported',
    httpStatus: 400
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
    messageKey: 'auth.mfa_otp_token_required',
    httpStatus: 400
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
    messageKey: 'auth.mfa_binding_not_found',
    httpStatus: 404
  },

  /**
   * MFA 验证失败
   *
   * 使用场景：
   * - 用户输入的验证码错误
   * - TOTP 时间同步问题
   * - 验证过程中发生系统错误
   * - 验证逻辑执行失败
   */
  MFA_VERIFICATION_FAILED: {
    subCode: '0205',
    message: 'MFA 验证失败',
    messageKey: 'auth.mfa_verification_failed',
    httpStatus: 400
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
    messageKey: 'auth.mfa_binding_already_exists',
    httpStatus: 409
  },

  /**
   * 用户没有活跃的 MFA 绑定
   *
   * 使用场景：
   * - 用户尝试生成 MFA 令牌但未绑定任何 MFA
   * - 用户的所有 MFA 绑定都已禁用
   * - 用户需要先设置 MFA 才能进行验证
   */
  MFA_NO_ACTIVE_BINDINGS: {
    subCode: '0207',
    message: '用户没有活跃的 MFA 绑定',
    messageKey: 'auth.mfa_no_active_bindings',
    httpStatus: 404
  },

  /**
   * 邮箱未验证，无法绑定 MFA
   *
   * 使用场景：
   * - 用户尝试绑定邮箱 MFA 但邮箱未验证
   * - 需要先验证邮箱才能启用邮箱 MFA
   * - 邮箱验证流程未完成
   */
  MFA_EMAIL_NOT_VERIFIED: {
    subCode: '0208',
    message: '邮箱未验证，无法绑定 MFA',
    messageKey: 'auth.mfa_email_not_verified',
    httpStatus: 400
  },

  /**
   * 手机号未验证，无法绑定 MFA
   *
   * 使用场景：
   * - 用户尝试绑定手机 MFA 但手机号未验证
   * - 需要先验证手机号才能启用手机 MFA
   * - 手机号验证流程未完成
   */
  MFA_PHONE_NOT_VERIFIED: {
    subCode: '0209',
    message: '手机号未验证，无法绑定 MFA',
    messageKey: 'auth.mfa_phone_not_verified',
    httpStatus: 400
  },

  /**
   * MFA 绑定类型无效
   *
   * 使用场景：
   * - 用户尝试对不支持的绑定类型进行操作
   * - 绑定类型与操作不匹配
   * - 系统配置错误导致类型无效
   */
  MFA_INVALID_BINDING_TYPE: {
    subCode: '0210',
    message: 'MFA 绑定类型无效',
    messageKey: 'auth.mfa_invalid_binding_type',
    httpStatus: 400
  },

  /**
   * MFA 验证码已过期
   *
   * 使用场景：
   * - 用户输入的验证码已超过有效期
   * - 验证码生成时间过长
   * - 需要用户重新获取验证码
   */
  MFA_VERIFICATION_CODE_EXPIRED: {
    subCode: '0211',
    message: 'MFA 验证码已过期',
    messageKey: 'auth.mfa_verification_code_expired',
    httpStatus: 400
  },

  /**
   * MFA 验证尝试次数过多
   *
   * 使用场景：
   * - 用户连续验证失败超过限制
   * - 防止暴力破解 MFA
   * - 需要用户等待一段时间后重试
   */
  MFA_TOO_MANY_ATTEMPTS: {
    subCode: '0212',
    message: 'MFA 验证尝试次数过多',
    messageKey: 'auth.mfa_too_many_attempts',
    httpStatus: 429
  },

  /**
   * MFA 绑定已停用
   *
   * 使用场景：
   * - 用户主动停用了 MFA 绑定
   * - 管理员停用了用户的 MFA
   * - 系统检测到安全问题自动停用
   */
  MFA_BINDING_DEACTIVATED: {
    subCode: '0213',
    message: 'MFA 绑定已停用',
    messageKey: 'auth.mfa_binding_deactivated',
    httpStatus: 403
  },

  /**
   * 此操作需要 MFA 验证
   *
   * 使用场景：
   * - 敏感操作需要额外的安全验证
   * - 用户尝试访问高权限功能
   * - 系统要求强制 MFA 验证
   */
  MFA_REQUIRED_FOR_OPERATION: {
    subCode: '0214',
    message: '此操作需要 MFA 验证',
    messageKey: 'auth.mfa_required_for_operation',
    httpStatus: 403
  },

  /**
   * TOTP 二维码生成失败
   *
   * 使用场景：
   * - 生成 TOTP 二维码时发生错误
   * - 二维码库出现问题
   * - 系统资源不足
   */
  MFA_QR_CODE_GENERATION_FAILED: {
    subCode: '0215',
    message: 'TOTP 二维码生成失败',
    messageKey: 'auth.mfa_qr_code_generation_failed',
    httpStatus: 500
  },

  /**
   * MFA 密钥生成失败
   *
   * 使用场景：
   * - 生成 TOTP 密钥时发生错误
   * - 加密算法出现问题
   * - 系统随机数生成器故障
   */
  MFA_SECRET_GENERATION_FAILED: {
    subCode: '0216',
    message: 'MFA 密钥生成失败',
    messageKey: 'auth.mfa_secret_generation_failed',
    httpStatus: 500
  },

  // ==================== Session 相关错误 (0300-0399) ====================

  /**
   * Session 不存在
   *
   * 使用场景：
   * - 访问令牌对应的 Session 已被删除
   * - 刷新令牌对应的 Session 不存在
   * - Session 数据损坏或丢失
   */
  SESSION_NOT_FOUND: {
    subCode: '0300',
    message: 'Session 不存在',
    messageKey: 'auth.session_not_found',
    httpStatus: 401
  },

  /**
   * Session 无效
   *
   * 使用场景：
   * - 访问令牌已过期
   * - 刷新令牌已过期
   * - Session 状态异常
   * - 令牌格式错误
   */
  SESSION_INVALID: {
    subCode: '0301',
    message: 'Session 无效',
    messageKey: 'auth.session_invalid',
    httpStatus: 401
  },

  /**
   * Session 被撤销
   *
   * 使用场景：
   * - 管理员强制撤销用户 Session
   * - 用户主动登出
   * - 安全事件导致的 Session 撤销
   * - 设备丢失处理
   */
  SESSION_REVOKED: {
    subCode: '0302',
    message: 'Session 已被撤销',
    messageKey: 'auth.session_revoked',
    httpStatus: 401
  },

  /**
   * Session 被暂停
   *
   * 使用场景：
   * - 管理员临时暂停用户 Session
   * - 调查期间的临时措施
   * - 可恢复的处罚措施
   */
  SESSION_SUSPENDED: {
    subCode: '0303',
    message: 'Session 已被暂停',
    messageKey: 'auth.session_suspended',
    httpStatus: 403
  },

  /**
   * Session 数量超限
   *
   * 使用场景：
   * - 用户同时登录设备数量超过限制
   * - 安全策略限制多设备登录
   * - 资源控制措施
   */
  SESSION_LIMIT_EXCEEDED: {
    subCode: '0304',
    message: 'Session 数量超限',
    messageKey: 'auth.session_limit_exceeded',
    httpStatus: 403
  },

  /**
   * 刷新令牌无效
   *
   * 使用场景：
   * - 刷新令牌已过期
   * - 刷新令牌被撤销
   * - 刷新令牌格式错误
   */
  REFRESH_TOKEN_INVALID: {
    subCode: '0305',
    message: '刷新令牌无效',
    messageKey: 'auth.refresh_token_invalid',
    httpStatus: 401
  },

  /**
   * 访问令牌即将过期
   *
   * 使用场景：
   * - 自动续期提醒
   * - 客户端需要主动刷新令牌
   * - 用户体验优化
   */
  ACCESS_TOKEN_EXPIRING_SOON: {
    subCode: '0306',
    message: '访问令牌即将过期',
    messageKey: 'auth.access_token_expiring_soon',
    httpStatus: 200
  },

  // ==================== 设备相关错误 (0400-0499) ====================

  /**
   * 设备被踢出
   *
   * 使用场景：
   * - 新设备登录时踢出旧设备
   * - 管理员强制踢出设备
   * - 可疑设备处理
   */
  DEVICE_KICKED: {
    subCode: '0400',
    message: '设备已被踢出',
    messageKey: 'auth.device_kicked',
    httpStatus: 401
  },

  /**
   * 设备信息无效
   *
   * 使用场景：
   * - 设备信息缺失或格式错误
   * - 设备指纹验证失败
   * - 安全策略检查失败
   */
  DEVICE_INFO_INVALID: {
    subCode: '0401',
    message: '设备信息无效',
    messageKey: 'auth.device_info_invalid',
    httpStatus: 400
  },

  /**
   * 异地登录检测
   *
   * 使用场景：
   * - 检测到用户在新地点登录
   * - 安全风险提醒
   * - 用户确认登录
   */
  REMOTE_LOGIN_DETECTED: {
    subCode: '0402',
    message: '检测到异地登录',
    messageKey: 'auth.remote_login_detected',
    httpStatus: 200
  },

  /**
   * 跨端登录限制
   *
   * 使用场景：
   * - 用户尝试在不同类型设备上登录
   * - 安全策略限制跨端登录
   * - 设备类型验证失败
   */
  CROSS_DEVICE_LOGIN_RESTRICTED: {
    subCode: '0403',
    message: '跨端登录受限',
    messageKey: 'auth.cross_device_login_restricted',
    httpStatus: 403
  }
}
