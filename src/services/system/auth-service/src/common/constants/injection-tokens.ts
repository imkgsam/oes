// Repository Tokens
export const SESSION_REPOSITORY = 'ISessionRepository'
export const MFA_BINDING_REPOSITORY = 'IMfaBindingRepository'
export const OTP_REPOSITORY = 'IOtpRepository'
export const OTP_SEND_THROTTLE_REPOSITORY = 'IOtpSendThrottleRepository'
export const LOGIN_METHOD_REPOSITORY = 'ILoginMethodRepository'
export const LOGIN_RISK_REPOSITORY = 'ILoginRiskRepository'
// OUTDATED: this token name is misleading in auth-service. Use LOGIN_METHOD_REPOSITORY for login method access.
export const USER_REPOSITORY = 'IUserRepository'

// Service Tokens
export const SESSION_SERVICE = 'SessionService'
// OUTDATED: legacy service token from the pre-CQRS application service structure.
export const AUTH_SERVICE = 'AuthService'
export const HASHING_SERVICE = 'HashingService'

// Configuration Tokens
export const TOKEN_CONFIG = 'TokenConfig'
export const AUTH_CONFIG = 'AuthConfig'
