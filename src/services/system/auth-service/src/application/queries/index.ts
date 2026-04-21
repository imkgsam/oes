import { AuditQueryHandlers } from './audit'
import { LoginMethodQueryHandlers } from './login-method'
import { MfaQueryHandlers } from './mfa'
import { SessionQueryHandlers } from './session'

export * from './audit'
export * from './login-method'
export * from './session'
export * from './mfa'

export const AuthQueryHandlers = [
  ...AuditQueryHandlers,
  ...SessionQueryHandlers,
  ...MfaQueryHandlers,
  ...LoginMethodQueryHandlers
]
