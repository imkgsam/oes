/**
 * Notification Service 消息定义
 *
 * 用于 TCP 通信的消息模式定义
 * 每个消息都包含详细的使用场景说明
 */

export const NOTIFICATION_MESSAGES = {
  // ==================== 邮件通知相关消息 ====================

  /**
   * 发送邮件通知
   * 使用场景：发送各种类型的邮件通知
   * 参数：{ to: string, subject: string, content: string, templateId?: string, variables?: any }
   */
  SEND_EMAIL: 'notification.send_email',

  /**
   * 发送验证码邮件
   * 使用场景：发送邮箱验证码
   * 参数：{ email: string, code: string, templateId?: string }
   */
  SEND_VERIFICATION_EMAIL: 'notification.send_verification_email',

  /**
   * 发送密码重置邮件
   * 使用场景：发送密码重置链接
   * 参数：{ email: string, resetToken: string, expiresAt: Date }
   */
  SEND_PASSWORD_RESET_EMAIL: 'notification.send_password_reset_email',

  /**
   * 发送欢迎邮件
   * 使用场景：新用户注册后发送欢迎邮件
   * 参数：{ email: string, username: string }
   */
  SEND_WELCOME_EMAIL: 'notification.send_welcome_email',

  // ==================== 短信通知相关消息 ====================

  /**
   * 发送短信通知
   * 使用场景：发送各种类型的短信通知
   * 参数：{ phone: string, content: string, templateId?: string, variables?: any }
   */
  SEND_SMS: 'notification.send_sms',

  /**
   * 发送验证码短信
   * 使用场景：发送短信验证码
   * 参数：{ phone: string, code: string, templateId?: string }
   */
  SEND_VERIFICATION_SMS: 'notification.send_verification_sms',

  /**
   * 发送密码重置短信
   * 使用场景：发送密码重置验证码
   * 参数：{ phone: string, code: string }
   */
  SEND_PASSWORD_RESET_SMS: 'notification.send_password_reset_sms',

  // ==================== 推送通知相关消息 ====================

  /**
   * 发送推送通知
   * 使用场景：发送移动端推送通知
   * 参数：{ userId: string, title: string, body: string, data?: any }
   */
  SEND_PUSH: 'notification.send_push',

  /**
   * 发送应用内通知
   * 使用场景：发送应用内消息通知
   * 参数：{ userId: string, title: string, content: string, type: string }
   */
  SEND_IN_APP: 'notification.send_in_app',

  // ==================== 安全通知相关消息 ====================

  /**
   * 发送安全通知
   * 使用场景：发送安全相关的重要通知
   * 参数：{ userId: string, type: string, details: any }
   */
  SEND_SECURITY_NOTIFICATION: 'notification.send_security_notification',

  /**
   * 发送登录成功通知
   * 使用场景：用户登录成功后发送通知
   * 参数：{ userId: string, deviceInfo: any, locationInfo?: any }
   */
  SEND_LOGIN_SUCCESS: 'notification.send_login_success',

  /**
   * 发送登录失败通知
   * 使用场景：检测到异常登录时发送通知
   * 参数：{ userId: string, deviceInfo: any, locationInfo?: any, reason?: string }
   */
  SEND_LOGIN_FAILURE: 'notification.send_login_failure',

  /**
   * 发送异地登录通知
   * 使用场景：检测到异地登录时发送通知
   * 参数：{ userId: string, deviceInfo: any, locationInfo: any }
   */
  SEND_REMOTE_LOGIN: 'notification.send_remote_login',

  /**
   * 发送账户锁定通知
   * 使用场景：账户被锁定时发送通知
   * 参数：{ userId: string, reason: string, duration?: string }
   */
  SEND_ACCOUNT_LOCKED: 'notification.send_account_locked',

  /**
   * 发送密码重置通知
   * 使用场景：用户请求密码重置时发送通知
   * 参数：{ userId: string, resetToken: string, expiresAt: Date }
   */
  SEND_PASSWORD_RESET: 'notification.send_password_reset',

  // ==================== 模板管理相关消息 ====================

  /**
   * 获取通知模板
   * 使用场景：获取通知模板信息
   * 参数：{ templateId: string }
   */
  GET_TEMPLATE: 'notification.get_template',

  /**
   * 创建通知模板
   * 使用场景：创建新的通知模板
   * 参数：{ name: string, type: string, subject?: string, content: string, variables: string[] }
   */
  CREATE_TEMPLATE: 'notification.create_template',

  /**
   * 更新通知模板
   * 使用场景：更新现有通知模板
   * 参数：{ id: string, name?: string, subject?: string, content?: string, variables?: string[] }
   */
  UPDATE_TEMPLATE: 'notification.update_template',

  /**
   * 删除通知模板
   * 使用场景：删除通知模板
   * 参数：{ id: string }
   */
  DELETE_TEMPLATE: 'notification.delete_template',

  /**
   * 获取模板列表
   * 使用场景：获取所有通知模板
   * 参数：{ page?: number, limit?: number, type?: string }
   */
  LIST_TEMPLATES: 'notification.list_templates',

  // ==================== 通知状态相关消息 ====================

  /**
   * 验证通知发送状态
   * 使用场景：验证通知是否发送成功
   * 参数：{ notificationId: string }
   */
  VERIFY_SENT: 'notification.verify_sent',

  /**
   * 获取通知状态
   * 使用场景：获取通知的发送状态
   * 参数：{ notificationId: string }
   */
  GET_NOTIFICATION_STATUS: 'notification.get_status',

  /**
   * 获取用户通知历史
   * 使用场景：获取用户的通知历史记录
   * 参数：{ userId: string, startDate?: Date, endDate?: Date, limit?: number }
   */
  GET_USER_NOTIFICATIONS: 'notification.get_user_notifications',

  // ==================== 批量通知相关消息 ====================

  /**
   * 批量发送邮件
   * 使用场景：批量发送邮件通知
   * 参数：{ emails: string[], subject: string, content: string, templateId?: string, variables?: any }
   */
  BATCH_SEND_EMAIL: 'notification.batch_send_email',

  /**
   * 批量发送短信
   * 使用场景：批量发送短信通知
   * 参数：{ phones: string[], content: string, templateId?: string, variables?: any }
   */
  BATCH_SEND_SMS: 'notification.batch_send_sms',

  /**
   * 批量发送推送
   * 使用场景：批量发送推送通知
   * 参数：{ userIds: string[], title: string, body: string, data?: any }
   */
  BATCH_SEND_PUSH: 'notification.batch_send_push',

  // ==================== 健康检查消息 ====================

  /**
   * 健康检查
   * 使用场景：检查通知服务的健康状态
   * 参数：{}
   */
  HEALTH_CHECK: 'notification.health_check',

  /**
   * 获取服务状态
   * 使用场景：获取通知服务的详细状态信息
   * 参数：{}
   */
  GET_SERVICE_STATUS: 'notification.get_service_status'
}
