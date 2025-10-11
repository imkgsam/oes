/**
 * 依赖注入 Token 常量
 *
 * 功能：定义所有依赖注入的 token
 *
 * 使用场景：
 * - 统一管理依赖注入 token
 * - 避免字符串硬编码
 * - 提供类型安全
 * - 便于重构和维护
 */

// Repository Tokens
export const SESSION_REPOSITORY = 'ISessionRepository'
export const MFA_BINDING_REPOSITORY = 'IMfaBindingRepository'
export const OTP_REPOSITORY = 'IOtpRepository'
export const LOGIN_METHOD_REPOSITORY = 'ILoginMethodRepository'
export const USER_REPOSITORY = 'IUserRepository'

// Service Tokens
export const SESSION_SERVICE = 'SessionService'
export const MFA_SERVICE = 'MfaService'
export const AUTH_SERVICE = 'AuthService'
export const HASHING_SERVICE = 'HashingService'

// Configuration Tokens
export const TOKEN_CONFIG = 'TokenConfig'
export const AUTH_CONFIG = 'AuthConfig'
