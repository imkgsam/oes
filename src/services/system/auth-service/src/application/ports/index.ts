/**
 * Auth Service 端口接口导出
 *
 * 定义 Auth Service 依赖的其他服务的接口
 */

// Identity Service 端口
export { IIdentityServicePort } from './identity-service.port'

// HR Service 端口
export { IHrServicePort } from './hr-service.port'

// Permission Service 端口
export { IPermissionServicePort } from './permission-service.port'

// Tenant lifecycle 端口
export { TenantLifecycleAccessPort, TenantLifecycleStatus } from './tenant-lifecycle-access.port'
