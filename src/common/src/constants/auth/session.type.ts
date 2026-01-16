/**
 * Session 相关枚举
 *
 * 功能：定义会话管理相关的枚举类型
 *
 * 使用场景：
 * - 会话状态管理
 * - 跨模块的会话相关功能
 * - 统一的会话状态标识
 * - API Gateway 会话验证
 * - 审计服务会话状态记录
 *
 * 技术特点：
 * - 字符串枚举，便于序列化
 * - 语义化命名
 * - 跨模块共享
 */
export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
  SUSPENDED = 'SUSPENDED'
}
