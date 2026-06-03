import { AuditQueryHandlers } from './audit'
import { LoginMethodQueryHandlers } from './login-method'
import { LoginPreflightQueryHandlers } from './login-preflight'
import { MfaQueryHandlers } from './mfa'
import { SelfSecurityQueryHandlers } from './self-security'
import { SessionQueryHandlers } from './session'

export * from './audit'
export * from './login-method'
export * from './login-preflight'
export * from './session'
export * from './mfa'
export * from './self-security'

export const AuthQueryHandlers = [
  ...AuditQueryHandlers,
  ...SessionQueryHandlers,
  ...MfaQueryHandlers,
  ...LoginMethodQueryHandlers,
  ...LoginPreflightQueryHandlers,
  ...SelfSecurityQueryHandlers
]
