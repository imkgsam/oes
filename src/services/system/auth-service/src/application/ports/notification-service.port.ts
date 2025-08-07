/**
 * Notification Service 端口接口
 *
 * Auth Service 依赖 Notification Service 来发送验证码、安全通知等
 */

export interface NotificationTemplate {
  id: string
  name: string
  type: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP'
  subject?: string
  content: string
  variables: string[]
}

export interface NotificationRequest {
  userId?: string
  email?: string
  phone?: string
  templateId: string
  variables: Record<string, any>
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  scheduledAt?: Date
}

export interface NotificationResponse {
  id: string
  status: 'PENDING' | 'SENT' | 'FAILED' | 'DELIVERED'
  sentAt?: Date
  errorMessage?: string
}

/**
 * Notification Service 端口接口
 */
export interface INotificationServicePort {
  /**
   * 发送邮件通知
   * @param request 通知请求
   * @returns 通知响应
   */
  sendEmailNotification(
    request: NotificationRequest
  ): Promise<NotificationResponse>

  /**
   * 发送短信通知
   * @param request 通知请求
   * @returns 通知响应
   */
  sendSmsNotification(
    request: NotificationRequest
  ): Promise<NotificationResponse>

  /**
   * 发送推送通知
   * @param request 通知请求
   * @returns 通知响应
   */
  sendPushNotification(
    request: NotificationRequest
  ): Promise<NotificationResponse>

  /**
   * 发送应用内通知
   * @param request 通知请求
   * @returns 通知响应
   */
  sendInAppNotification(
    request: NotificationRequest
  ): Promise<NotificationResponse>

  /**
   * 发送验证码邮件
   * @param email 邮箱地址
   * @param code 验证码
   * @param templateId 模板ID
   * @returns 通知响应
   */
  sendVerificationEmail(
    email: string,
    code: string,
    templateId?: string
  ): Promise<NotificationResponse>

  /**
   * 发送验证码短信
   * @param phone 手机号
   * @param code 验证码
   * @param templateId 模板ID
   * @returns 通知响应
   */
  sendVerificationSms(
    phone: string,
    code: string,
    templateId?: string
  ): Promise<NotificationResponse>

  /**
   * 发送安全通知
   * @param userId 用户ID
   * @param type 通知类型
   * @param details 详细信息
   * @returns 通知响应
   */
  sendSecurityNotification(
    userId: string,
    type: string,
    details: Record<string, any>
  ): Promise<NotificationResponse>

  /**
   * 发送登录成功通知
   * @param userId 用户ID
   * @param deviceInfo 设备信息
   * @param locationInfo 位置信息
   * @returns 通知响应
   */
  sendLoginSuccessNotification(
    userId: string,
    deviceInfo: Record<string, any>,
    locationInfo?: Record<string, any>
  ): Promise<NotificationResponse>

  /**
   * 发送登录失败通知
   * @param userId 用户ID
   * @param deviceInfo 设备信息
   * @param locationInfo 位置信息
   * @param reason 失败原因
   * @returns 通知响应
   */
  sendLoginFailureNotification(
    userId: string,
    deviceInfo: Record<string, any>,
    locationInfo?: Record<string, any>,
    reason?: string
  ): Promise<NotificationResponse>

  /**
   * 发送异地登录通知
   * @param userId 用户ID
   * @param deviceInfo 设备信息
   * @param locationInfo 位置信息
   * @returns 通知响应
   */
  sendRemoteLoginNotification(
    userId: string,
    deviceInfo: Record<string, any>,
    locationInfo: Record<string, any>
  ): Promise<NotificationResponse>

  /**
   * 发送账户锁定通知
   * @param userId 用户ID
   * @param reason 锁定原因
   * @param duration 锁定时长
   * @returns 通知响应
   */
  sendAccountLockedNotification(
    userId: string,
    reason: string,
    duration?: string
  ): Promise<NotificationResponse>

  /**
   * 发送密码重置通知
   * @param userId 用户ID
   * @param resetToken 重置令牌
   * @param expiresAt 过期时间
   * @returns 通知响应
   */
  sendPasswordResetNotification(
    userId: string,
    resetToken: string,
    expiresAt: Date
  ): Promise<NotificationResponse>

  /**
   * 获取通知模板
   * @param templateId 模板ID
   * @returns 通知模板
   */
  getNotificationTemplate(templateId: string): Promise<NotificationTemplate>

  /**
   * 验证通知是否发送成功
   * @param notificationId 通知ID
   * @returns 是否成功
   */
  verifyNotificationSent(notificationId: string): Promise<boolean>
}
