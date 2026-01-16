/**
 * 登录方法类型枚举
 *
 * 功能：定义登录方法的基础类型分类
 *
 * 使用场景：
 * - 数据库存储登录方法类型
 * - Prisma schema 中的枚举映射
 * - 登录方法的基础分类
 *
 * 技术特点：
 * - 与 Prisma schema 中的 LoginMethodType 枚举对应
 * - 字符串枚举，便于序列化
 */
export enum LoginMethodType {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  OAUTH_OPENID = 'OAUTH_OPENID'
}

/**
 * 认证方式枚举
 *
 * 功能：定义具体的认证方式
 *
 * 使用场景：
 * - 登录方式管理
 * - 认证方法分类
 * - 跨模块的认证功能
 * - 统一的认证方式标识
 * - RPC 契约中的登录方式参数
 *
 * 技术特点：
 * - 字符串枚举，便于序列化
 * - 语义化命名（kebab-case）
 * - 跨模块共享
 */
export enum LoginMethodEnum {
  EmailPassword = 'email-password',
  EmailOtp = 'email-otp',
  PhoneOtp = 'phone-otp',
  PhonePassword = 'phone-password',
  Google = 'google',
  Wechat = 'wechat'
}
