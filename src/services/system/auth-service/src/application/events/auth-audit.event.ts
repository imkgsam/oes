import {
  AuditEnvelope,
  AuditOperator,
  AuditResource,
  AuditResult,
  AuditScope,
  AuditTrace
} from '@oes/common'
import { EventTraceContext } from '@oes/common/tracing'

export type AuthAuditEventType =
  | 'ADMIN_SESSION_REVOKED'
  | 'LOGIN_BLOCKED'
  | 'LOGIN_FAILED'
  | 'TERMINAL_ACCESS_DENIED'
  | 'MFA_CHALLENGE_CREATED'
  | 'MFA_BINDING_ENABLED'
  | 'MFA_BINDING_DISABLED'
  | 'MFA_BINDING_INITIALIZED'
  | 'MFA_BINDING_ROTATED'
  | 'LOGIN_METHOD_ENABLED_CHANGED'
  | 'LOGIN_SUCCEEDED'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RECOVERY_CHALLENGE_CREATED'
  | 'PASSWORD_RECOVERY_CHALLENGE_VERIFIED'
  | 'PASSWORD_RECOVERY_COMPLETED'
  | 'PASSWORD_SETUP_REQUIRED'
  | 'REFRESH_TOKEN_REPLAY_DETECTED'
  | 'SESSION_REFRESH_DENIED_TERMINAL_ACCESS'
  | 'SESSION_REFRESHED'
  | 'SESSION_DEVICE_RENAMED'
  | 'LOGOUT_SUCCEEDED'
  | 'LOGOUT_OTHER_DEVICES_SUCCEEDED'
  | 'LOGOUT_ALL_SUCCEEDED'
  | 'TERMINAL_DEVICE_SESSIONS_REVOKED'

export type AuthAuditModule = 'auth' | 'session' | 'mfa'
export type AuthAuditResult = AuditResult
export type AuthAuditOperator = AuditOperator
export type AuthAuditScope = AuditScope
export type AuthAuditTrace = AuditTrace & EventTraceContext
export type AuthAuditResource = AuditResource

/**
 * AuthAuditEvent carries auth-domain audit details in the shared audit envelope shape.
 */
export class AuthAuditEvent<TDetails extends Record<string, unknown> = Record<string, unknown>>
  implements AuditEnvelope<'auth-service', AuthAuditModule, AuthAuditEventType, TDetails>
{
  readonly service = 'auth-service' as const

  constructor(
    public readonly eventId: string,
    public readonly module: AuthAuditModule,
    public readonly eventType: AuthAuditEventType,
    public readonly occurredAt: Date,
    public readonly result: AuthAuditResult,
    public readonly operator: AuthAuditOperator,
    public readonly scope: AuthAuditScope,
    public readonly trace: AuthAuditTrace,
    public readonly resource: AuthAuditResource,
    public readonly details: TDetails
  ) {}

  /**
   * type exposes the legacy event name alias so existing listeners and tests remain readable.
   */
  get type(): AuthAuditEventType {
    return this.eventType
  }
}
