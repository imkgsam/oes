import { AuditQueryHandlers } from './audit'
import { MfaQueryHandlers } from './mfa'
import { SessionQueryHandlers } from './session'

export * from './audit'
export * from './session'
export * from './mfa'

export const AuthQueryHandlers = [...AuditQueryHandlers, ...SessionQueryHandlers, ...MfaQueryHandlers]
