/**
 * Auth Service 消息定义
 *
 * 用于 TCP 通信的消息模式定义
 * 每个消息都包含详细的使用场景说明
 */

export const AUTH_MESSAGES = {
  // ==================== 认证相关消息 ====================

  // 不同的登录方式
  LOGIN_WITH_EMAIL_PW: 'auth.login_email_pw',
  LOGIN_WITH_PHONE_PW: 'auth.login_phone_pw',
  LOGIN_WITH_EMAIL_OTP: 'auth.login_email_otp',
  LOGIN_WITH_PHONE_OTP: 'auth.login_phone_otp',
  LOGIN_WITH_GOOGLE: 'auth.login_google',
  LOGIN_WITH_WECHAT: 'auth.login_wechat',

  /**
   * 用户登出
   * 使用场景：用户主动登出或系统强制登出
   * 参数：{ sessionId: string, userId: string }
   */
  LOGOUT: 'auth.logout',

  /**
   * 刷新访问令牌
   * 使用场景：访问令牌即将过期时自动刷新
   * 参数：{ refreshToken: string }
   */
  REFRESH_TOKEN: 'auth.refresh_token',

  /**
   * 验证访问令牌
   * 使用场景：验证用户访问令牌的有效性
   * 参数：{ accessToken: string }
   */
  VERIFY_TOKEN: 'auth.verify_token',

  /**
   * 撤销会话
   * 使用场景：管理员撤销用户会话或用户主动撤销
   * 参数：{ sessionId: string, userId: string }
   */
  REVOKE_SESSION: 'auth.revoke_session',

  // ==================== 密码相关消息 ====================

  /**
   * 重置密码
   * 使用场景：用户忘记密码时通过邮箱或手机重置
   * 参数：{ email?: string, phone?: string, resetMethod: string }
   */
  RESET_PASSWORD: 'auth.reset_password',

  /**
   * 确认密码重置
   * 使用场景：用户确认密码重置并设置新密码
   * 参数：{ resetToken: string, newPassword: string }
   */
  CONFIRM_PASSWORD_RESET: 'auth.confirm_password_reset',

  /**
   * 修改密码
   * 使用场景：用户登录后修改自己的密码
   * 参数：{ userId: string, oldPassword: string, newPassword: string }
   */
  CHANGE_PASSWORD: 'auth.change_password',

  // ==================== 验证码相关消息 ====================

  /**
   * 发送邮箱验证码
   * 使用场景：用户注册、登录、重置密码时发送邮箱验证码
   * 参数：{ email: string, purpose: string }
   */
  SEND_EMAIL_OTP: 'auth.send_email_otp',

  /**
   * 发送短信验证码
   * 使用场景：用户注册、登录、重置密码时发送短信验证码
   * 参数：{ phone: string, purpose: string }
   */
  SEND_SMS_OTP: 'auth.send_sms_otp',

  /**
   * 验证邮箱验证码
   * 使用场景：验证用户输入的邮箱验证码
   * 参数：{ email: string, code: string, purpose: string }
   */
  VERIFY_EMAIL_OTP: 'auth.verify_email_otp',

  /**
   * 验证短信验证码
   * 使用场景：验证用户输入的短信验证码
   * 参数：{ phone: string, code: string, purpose: string }
   */
  VERIFY_SMS_OTP: 'auth.verify_sms_otp',

  // ==================== MFA 相关消息 ====================

  /**
   * 绑定 MFA
   * 使用场景：用户绑定多因素认证（TOTP、邮箱、短信等）
   * 参数：{ userId: string, mfaType: string, credentials: any }
   */
  BIND_MFA: 'auth.bind_mfa',

  /**
   * 解绑 MFA
   * 使用场景：用户解绑多因素认证
   * 参数：{ userId: string, mfaType: string }
   */
  UNBIND_MFA: 'auth.unbind_mfa',

  /**
   * 验证 MFA
   * 使用场景：用户登录时验证多因素认证
   * 参数：{ userId: string, mfaType: string, code: string }
   */
  VERIFY_MFA: 'auth.verify_mfa',

  /**
   * 生成 TOTP 二维码
   * 使用场景：用户绑定 TOTP 时生成二维码
   * 参数：{ userId: string }
   */
  GENERATE_TOTP_QR: 'auth.generate_totp_qr',

  // ==================== 会话管理消息 ====================

  /**
   * 获取用户会话列表
   * 使用场景：用户查看自己的所有活跃会话
   * 参数：{ userId: string }
   */
  GET_USER_SESSIONS: 'auth.get_user_sessions',

  /**
   * 获取会话详情
   * 使用场景：查看特定会话的详细信息
   * 参数：{ sessionId: string }
   */
  GET_SESSION_DETAILS: 'auth.get_session_details',

  /**
   * 踢出设备
   * 使用场景：用户踢出其他设备的会话
   * 参数：{ userId: string, sessionId: string }
   */
  KICK_DEVICE: 'auth.kick_device',

  // ==================== 管理员操作消息 ====================

  /**
   * 锁定用户账户
   * 使用场景：管理员锁定违规用户账户
   * 参数：{ userId: string, reason: string, duration?: number }
   */
  LOCK_USER_ACCOUNT: 'auth.lock_user_account',

  /**
   * 解锁用户账户
   * 使用场景：管理员解锁用户账户
   * 参数：{ userId: string }
   */
  UNLOCK_USER_ACCOUNT: 'auth.unlock_user_account',

  /**
   * 禁用用户登录方法
   * 使用场景：管理员禁用用户的特定登录方式
   * 参数：{ userId: string, loginMethod: string }
   */
  DISABLE_LOGIN_METHOD: 'auth.disable_login_method',

  /**
   * 启用用户登录方法
   * 使用场景：管理员启用用户的登录方式
   * 参数：{ userId: string, loginMethod: string }
   */
  ENABLE_LOGIN_METHOD: 'auth.enable_login_method',

  /**
   * 获取用户认证历史
   * 使用场景：管理员查看用户的认证历史记录
   * 参数：{ userId: string, startDate?: Date, endDate?: Date, limit?: number }
   */
  GET_USER_AUTH_HISTORY: 'auth.get_user_auth_history',

  // ==================== 安全相关消息 ====================

  /**
   * 检测异地登录
   * 使用场景：检测用户是否在新地点登录
   * 参数：{ userId: string, deviceInfo: any, locationInfo: any }
   */
  DETECT_REMOTE_LOGIN: 'auth.detect_remote_login',

  /**
   * 记录安全事件
   * 使用场景：记录各种安全相关事件
   * 参数：{ userId: string, eventType: string, details: any }
   */
  RECORD_SECURITY_EVENT: 'auth.record_security_event',

  /**
   * 获取安全事件列表
   * 使用场景：查看用户的安全事件历史
   * 参数：{ userId: string, startDate?: Date, endDate?: Date, limit?: number }
   */
  GET_SECURITY_EVENTS: 'auth.get_security_events',

  // ==================== 健康检查消息 ====================

  /**
   * 健康检查
   * 使用场景：检查认证服务的健康状态
   * 参数：{}
   */
  HEALTH_CHECK: 'auth.health_check',

  /**
   * 获取服务状态
   * 使用场景：获取认证服务的详细状态信息
   * 参数：{}
   */
  GET_SERVICE_STATUS: 'auth.get_service_status',

  // ==================== developing test 消息 ====================

  LIST_LOGINMETHODS: 'auth.list_loginmethods',
  LIST_CREDENTIALS: 'auth.list_credentials',
  LIST_OTPS: 'auth.list_otps',
  TESTING: 'auth.testing'
}
