/**
 * Authentication Providers Module
 *
 * 这个模块包含所有认证提供者的统一导出入口
 * 提供以下功能：
 * - 邮箱密码认证
 * - 邮箱验证码认证
 * - 手机验证码认证
 * - Google OAuth 认证
 * - 微信 OAuth 认证
 * - 认证提供者工厂
 */

// ==================== Authentication Providers ====================
// 具体的认证提供者实现
export { EmailPasswordAuthProvider } from './email-password.provider'
export { GoogleAuthProvider } from './google.provider'
export { WechatAuthProvider } from './wechat.provider'
export { EmailOtpProvider, PhoneOtpProvider } from './otp.provider'

// ==================== Base Classes ====================
// 基础类和抽象类
export { BaseAuthProvider } from './base-auth.provider'

// ==================== Factory ====================
// 认证提供者工厂
export { AuthProviderFactory } from './auth-provider.factory'

// ==================== Interfaces ====================
// 接口定义
export { IAuthProvider, AuthResult } from './interfaces/auth-provider.interface'

// ==================== Types ====================
// 类型定义（如果有的话）
// export type { AuthProviderType } from './types/auth-provider.types'
