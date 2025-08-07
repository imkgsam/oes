/**
 * Audit Service 端口接口
 *
 * Auth Service 依赖 Audit Service 来记录安全事件、操作日志等
 */

export interface AuditEvent {
  id: string
  userId?: string
  accountId?: string
  tenantId?: string
  eventType: string
  eventCategory:
    | 'AUTHENTICATION'
    | 'AUTHORIZATION'
    | 'SECURITY'
    | 'ADMIN'
    | 'SYSTEM'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  details: Record<string, any>
  ipAddress?: string
  userAgent?: string
  deviceInfo?: Record<string, any>
  locationInfo?: Record<string, any>
  timestamp: Date
  sessionId?: string
  correlationId?: string
}

export interface AuditRequest {
  userId?: string
  accountId?: string
  tenantId?: string
  eventType: string
  eventCategory:
    | 'AUTHENTICATION'
    | 'AUTHORIZATION'
    | 'SECURITY'
    | 'ADMIN'
    | 'SYSTEM'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  details: Record<string, any>
  ipAddress?: string
  userAgent?: string
  deviceInfo?: Record<string, any>
  locationInfo?: Record<string, any>
  sessionId?: string
  correlationId?: string
}

export interface AuditResponse {
  id: string
  status: 'SUCCESS' | 'FAILED'
  errorMessage?: string
}

/**
 * Audit Service 端口接口
 */
export interface IAuditServicePort {
  /**
   * 记录审计事件
   * @param request 审计请求
   * @returns 审计响应
   */
  recordAuditEvent(request: AuditRequest): Promise<AuditResponse>

  /**
   * 记录登录成功事件
   * @param userId 用户ID
   * @param loginMethod 登录方式
   * @param deviceInfo 设备信息
   * @param locationInfo 位置信息
   * @param sessionId 会话ID
   * @returns 审计响应
   */
  recordLoginSuccess(
    userId: string,
    loginMethod: string,
    deviceInfo: Record<string, any>,
    locationInfo?: Record<string, any>,
    sessionId?: string
  ): Promise<AuditResponse>

  /**
   * 记录登录失败事件
   * @param identifier 用户标识（邮箱、手机号等）
   * @param loginMethod 登录方式
   * @param reason 失败原因
   * @param deviceInfo 设备信息
   * @param locationInfo 位置信息
   * @returns 审计响应
   */
  recordLoginFailure(
    identifier: string,
    loginMethod: string,
    reason: string,
    deviceInfo: Record<string, any>,
    locationInfo?: Record<string, any>
  ): Promise<AuditResponse>

  /**
   * 记录登出事件
   * @param userId 用户ID
   * @param sessionId 会话ID
   * @param reason 登出原因
   * @returns 审计响应
   */
  recordLogout(
    userId: string,
    sessionId: string,
    reason?: string
  ): Promise<AuditResponse>

  /**
   * 记录密码重置事件
   * @param userId 用户ID
   * @param resetMethod 重置方式
   * @param deviceInfo 设备信息
   * @returns 审计响应
   */
  recordPasswordReset(
    userId: string,
    resetMethod: string,
    deviceInfo: Record<string, any>
  ): Promise<AuditResponse>

  /**
   * 记录账户锁定事件
   * @param userId 用户ID
   * @param reason 锁定原因
   * @param duration 锁定时长
   * @param deviceInfo 设备信息
   * @returns 审计响应
   */
  recordAccountLocked(
    userId: string,
    reason: string,
    duration?: string,
    deviceInfo?: Record<string, any>
  ): Promise<AuditResponse>

  /**
   * 记录权限检查事件
   * @param userId 用户ID
   * @param resource 资源
   * @param action 操作
   * @param granted 是否授权
   * @param reason 拒绝原因
   * @returns 审计响应
   */
  recordPermissionCheck(
    userId: string,
    resource: string,
    action: string,
    granted: boolean,
    reason?: string
  ): Promise<AuditResponse>

  /**
   * 记录安全事件
   * @param userId 用户ID
   * @param eventType 事件类型
   * @param description 事件描述
   * @param details 详细信息
   * @param severity 严重程度
   * @returns 审计响应
   */
  recordSecurityEvent(
    userId: string,
    eventType: string,
    description: string,
    details: Record<string, any>,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ): Promise<AuditResponse>

  /**
   * 记录 MFA 事件
   * @param userId 用户ID
   * @param eventType 事件类型
   * @param mfaType MFA 类型
   * @param success 是否成功
   * @param details 详细信息
   * @returns 审计响应
   */
  recordMfaEvent(
    userId: string,
    eventType: string,
    mfaType: string,
    success: boolean,
    details: Record<string, any>
  ): Promise<AuditResponse>

  /**
   * 记录会话事件
   * @param userId 用户ID
   * @param sessionId 会话ID
   * @param eventType 事件类型
   * @param details 详细信息
   * @returns 审计响应
   */
  recordSessionEvent(
    userId: string,
    sessionId: string,
    eventType: string,
    details: Record<string, any>
  ): Promise<AuditResponse>

  /**
   * 记录管理员操作事件
   * @param adminUserId 管理员用户ID
   * @param targetUserId 目标用户ID
   * @param action 操作类型
   * @param details 详细信息
   * @returns 审计响应
   */
  recordAdminAction(
    adminUserId: string,
    targetUserId: string,
    action: string,
    details: Record<string, any>
  ): Promise<AuditResponse>

  /**
   * 批量记录审计事件
   * @param requests 审计请求列表
   * @returns 审计响应列表
   */
  batchRecordAuditEvents(requests: AuditRequest[]): Promise<AuditResponse[]>

  /**
   * 获取用户的审计事件
   * @param userId 用户ID
   * @param startDate 开始时间
   * @param endDate 结束时间
   * @param limit 限制数量
   * @returns 审计事件列表
   */
  getUserAuditEvents(
    userId: string,
    startDate: Date,
    endDate: Date,
    limit?: number
  ): Promise<AuditEvent[]>

  /**
   * 获取账户的审计事件
   * @param accountId 账户ID
   * @param startDate 开始时间
   * @param endDate 结束时间
   * @param limit 限制数量
   * @returns 审计事件列表
   */
  getAccountAuditEvents(
    accountId: string,
    startDate: Date,
    endDate: Date,
    limit?: number
  ): Promise<AuditEvent[]>
}
