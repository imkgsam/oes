/**
 * Audit Service 消息定义
 *
 * 用于 TCP 通信的消息模式定义
 * 每个消息都包含详细的使用场景说明
 */

export const AUDIT_MESSAGES = {
  // ==================== 审计事件记录相关消息 ====================

  /**
   * 记录审计事件
   * 使用场景：记录各种类型的审计事件
   * 参数：{ userId?: string, eventType: string, eventCategory: string, severity: string, description: string, details: any }
   */
  RECORD_EVENT: 'audit.record_event',

  /**
   * 记录登录成功事件
   * 使用场景：用户登录成功后记录审计事件
   * 参数：{ userId: string, loginMethod: string, deviceInfo: any, locationInfo?: any, sessionId?: string }
   */
  RECORD_LOGIN_SUCCESS: 'audit.record_login_success',

  /**
   * 记录登录失败事件
   * 使用场景：用户登录失败后记录审计事件
   * 参数：{ identifier: string, loginMethod: string, reason: string, deviceInfo: any, locationInfo?: any }
   */
  RECORD_LOGIN_FAILURE: 'audit.record_login_failure',

  /**
   * 记录登出事件
   * 使用场景：用户登出后记录审计事件
   * 参数：{ userId: string, sessionId: string, reason?: string }
   */
  RECORD_LOGOUT: 'audit.record_logout',

  /**
   * 记录密码重置事件
   * 使用场景：用户重置密码后记录审计事件
   * 参数：{ userId: string, resetMethod: string, deviceInfo: any }
   */
  RECORD_PASSWORD_RESET: 'audit.record_password_reset',

  /**
   * 记录账户锁定事件
   * 使用场景：账户被锁定时记录审计事件
   * 参数：{ userId: string, reason: string, duration?: string, deviceInfo?: any }
   */
  RECORD_ACCOUNT_LOCKED: 'audit.record_account_locked',

  /**
   * 记录权限检查事件
   * 使用场景：检查用户权限时记录审计事件
   * 参数：{ userId: string, resource: string, action: string, granted: boolean, reason?: string }
   */
  RECORD_PERMISSION_CHECK: 'audit.record_permission_check',

  /**
   * 记录安全事件
   * 使用场景：记录各种安全相关事件
   * 参数：{ userId: string, eventType: string, description: string, details: any, severity: string }
   */
  RECORD_SECURITY_EVENT: 'audit.record_security_event',

  /**
   * 记录 MFA 事件
   * 使用场景：记录多因素认证相关事件
   * 参数：{ userId: string, eventType: string, mfaType: string, success: boolean, details: any }
   */
  RECORD_MFA_EVENT: 'audit.record_mfa_event',

  /**
   * 记录会话事件
   * 使用场景：记录会话相关事件
   * 参数：{ userId: string, sessionId: string, eventType: string, details: any }
   */
  RECORD_SESSION_EVENT: 'audit.record_session_event',

  /**
   * 记录管理员操作事件
   * 使用场景：记录管理员的操作事件
   * 参数：{ adminUserId: string, targetUserId: string, action: string, details: any }
   */
  RECORD_ADMIN_ACTION: 'audit.record_admin_action',

  // ==================== 批量操作相关消息 ====================

  /**
   * 批量记录审计事件
   * 使用场景：批量记录多个审计事件
   * 参数：{ requests: AuditRequest[] }
   */
  BATCH_RECORD_EVENTS: 'audit.batch_record_events',

  // ==================== 审计事件查询相关消息 ====================

  /**
   * 获取用户审计事件
   * 使用场景：获取用户的审计事件历史
   * 参数：{ userId: string, startDate: Date, endDate: Date, limit?: number }
   */
  GET_USER_EVENTS: 'audit.get_user_events',

  /**
   * 获取账户审计事件
   * 使用场景：获取账户的审计事件历史
   * 参数：{ accountId: string, startDate: Date, endDate: Date, limit?: number }
   */
  GET_ACCOUNT_EVENTS: 'audit.get_account_events',

  /**
   * 获取租户审计事件
   * 使用场景：获取租户的审计事件历史
   * 参数：{ tenantId: string, startDate: Date, endDate: Date, limit?: number }
   */
  GET_TENANT_EVENTS: 'audit.get_tenant_events',

  /**
   * 获取审计事件详情
   * 使用场景：获取特定审计事件的详细信息
   * 参数：{ eventId: string }
   */
  GET_EVENT_DETAILS: 'audit.get_event_details',

  /**
   * 搜索审计事件
   * 使用场景：根据条件搜索审计事件
   * 参数：{ filters: any, page?: number, limit?: number, sortBy?: string, sortOrder?: string }
   */
  SEARCH_EVENTS: 'audit.search_events',

  // ==================== 审计报告相关消息 ====================

  /**
   * 生成审计报告
   * 使用场景：生成特定时间段的审计报告
   * 参数：{ startDate: Date, endDate: Date, type: string, filters?: any }
   */
  GENERATE_REPORT: 'audit.generate_report',

  /**
   * 获取审计统计
   * 使用场景：获取审计事件的统计数据
   * 参数：{ startDate: Date, endDate: Date, groupBy?: string }
   */
  GET_AUDIT_STATS: 'audit.get_stats',

  /**
   * 获取安全事件统计
   * 使用场景：获取安全事件的统计数据
   * 参数：{ startDate: Date, endDate: Date, severity?: string }
   */
  GET_SECURITY_STATS: 'audit.get_security_stats',

  // ==================== 审计配置相关消息 ====================

  /**
   * 获取审计配置
   * 使用场景：获取审计服务的配置信息
   * 参数：{}
   */
  GET_AUDIT_CONFIG: 'audit.get_config',

  /**
   * 更新审计配置
   * 使用场景：更新审计服务的配置
   * 参数：{ config: any }
   */
  UPDATE_AUDIT_CONFIG: 'audit.update_config',

  /**
   * 设置审计级别
   * 使用场景：设置审计事件的记录级别
   * 参数：{ level: string }
   */
  SET_AUDIT_LEVEL: 'audit.set_level',

  /**
   * 获取审计级别
   * 使用场景：获取当前的审计级别
   * 参数：{}
   */
  GET_AUDIT_LEVEL: 'audit.get_level',

  // ==================== 数据管理相关消息 ====================

  /**
   * 清理过期审计数据
   * 使用场景：清理过期的审计事件数据
   * 参数：{ retentionDays: number }
   */
  CLEANUP_EXPIRED_DATA: 'audit.cleanup_expired_data',

  /**
   * 导出审计数据
   * 使用场景：导出审计事件数据
   * 参数：{ startDate: Date, endDate: Date, format: string, filters?: any }
   */
  EXPORT_AUDIT_DATA: 'audit.export_data',

  /**
   * 备份审计数据
   * 使用场景：备份审计事件数据
   * 参数：{ backupPath: string, includeEvents: boolean }
   */
  BACKUP_AUDIT_DATA: 'audit.backup_data',

  /**
   * 恢复审计数据
   * 使用场景：从备份恢复审计事件数据
   * 参数：{ backupPath: string }
   */
  RESTORE_AUDIT_DATA: 'audit.restore_data',

  // ==================== 健康检查消息 ====================

  /**
   * 健康检查
   * 使用场景：检查审计服务的健康状态
   * 参数：{}
   */
  HEALTH_CHECK: 'audit.health_check',

  /**
   * 获取服务状态
   * 使用场景：获取审计服务的详细状态信息
   * 参数：{}
   */
  GET_SERVICE_STATUS: 'audit.get_service_status',

  /**
   * 获取存储状态
   * 使用场景：获取审计数据存储的状态信息
   * 参数：{}
   */
  GET_STORAGE_STATUS: 'audit.get_storage_status',
}
