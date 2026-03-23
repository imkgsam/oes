export type AuthAuditEventType =
  | 'LOGIN_FAILED'
  | 'MFA_CHALLENGE_CREATED'
  | 'LOGIN_SUCCEEDED'
  | 'SESSION_REFRESHED'

export class AuthAuditEvent<TDetails extends Record<string, unknown> = Record<string, unknown>> {
  constructor(
    public readonly type: AuthAuditEventType,
    public readonly details: TDetails,
    public readonly occurredAt: Date = new Date()
  ) {}
}
