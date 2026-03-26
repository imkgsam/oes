export type AuthAuditEventType =
  | 'ADMIN_SESSION_REVOKED'
  | 'LOGIN_FAILED'
  | 'MFA_CHALLENGE_CREATED'
  | 'LOGIN_SUCCEEDED'
  | 'SESSION_REFRESHED'
  | 'SESSION_DEVICE_RENAMED'
  | 'LOGOUT_SUCCEEDED'
  | 'LOGOUT_OTHER_DEVICES_SUCCEEDED'
  | 'LOGOUT_ALL_SUCCEEDED'

export class AuthAuditEvent<TDetails extends Record<string, unknown> = Record<string, unknown>> {
  constructor(
    public readonly type: AuthAuditEventType,
    public readonly details: TDetails,
    public readonly occurredAt: Date = new Date()
  ) {}
}
