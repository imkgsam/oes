/**
 * 令牌类型枚举
 *
 * 功能：定义 JWT 令牌的类型
 *
 * 使用场景：
 * - JWT 令牌类型区分
 * - 访问令牌和刷新令牌管理
 * - 令牌验证和刷新机制
 * - 安全策略应用
 * - API Gateway 令牌验证
 *
 * 技术特点：
 * - 字符串枚举，便于序列化
 * - 语义化命名
 * - 跨模块共享
 */
export enum TokenType {
  ACCESS = 'ACCESS',
  REFRESH = 'REFRESH'
}
