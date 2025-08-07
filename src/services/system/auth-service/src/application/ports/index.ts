/**
 * Auth Service 端口接口导出
 *
 * 定义 Auth Service 依赖的其他服务的接口
 */

// Identity Service 端口
export {
  IIdentityServicePort,
  UserInfo,
  AccountInfo,
  TenantInfo,
  UserAccountRelation,
  AccountTenantRelation
} from './identity-service.port'

// Permission Service 端口
export {
  IPermissionServicePort,
  Permission,
  Role,
  UserPermission,
  UserRole,
  AccountPermission,
  AccountRole
} from './permission-service.port'

// Notification Service 端口
export {
  INotificationServicePort,
  NotificationTemplate,
  NotificationRequest,
  NotificationResponse
} from './notification-service.port'

// Audit Service 端口
export {
  IAuditServicePort,
  AuditEvent,
  AuditRequest,
  AuditResponse
} from './audit-service.port'
