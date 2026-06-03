// File: src/services/system/auth-service/src/infrastructure/adaptors/index.ts
/**
 * Auth Service 适配器实现导出
 *
 * 实现 Auth Service 依赖的其他服务的适配器
 */

// Identity Service 适配器
export { IdentityServiceAdaptor } from './identity-service.adaptor'

// HR Service 适配器
export { HrServiceAdaptor } from './hr-service.adaptor'

// Permission Service 适配器
export { PermissionServiceAdaptor } from './permission-service.adaptor'

// Notification Service 适配器
export { NotificationServiceGrpcAdaptor } from './notification-service.grpc.adaptor'

// Tenant Org lifecycle 适配器
export { TenantOrgLifecycleGrpcAdaptor } from './tenant-org-lifecycle.grpc.adaptor'
