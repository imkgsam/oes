/**
 * Application层端口导出文件
 *
 * 职责：
 * 1. 统一导出所有外部服务端口接口
 * 2. 提供清晰的依赖边界
 * 3. 简化其他层的导入
 */

export { IIdentityServicePort } from './identity-service.port'
export { IPermissionServicePort } from './permission-service.port'
