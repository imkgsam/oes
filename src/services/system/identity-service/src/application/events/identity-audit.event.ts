import {
  AuditEnvelope,
  AuditOperator,
  AuditResource,
  AuditResult,
  AuditScope,
  AuditTrace
} from '@oes/common'

export type IdentityAuditModule = 'account' | 'contact' | 'machine'

export type IdentityAuditEventType =
  | 'ACCOUNT_DELETED'
  | 'ACCOUNT_EMPLOYEE_BOUND'
  | 'ACCOUNT_EMPLOYEE_UNBOUND'
  | 'ACCOUNT_PROFILE_UPDATED'
  | 'ACCOUNT_WORK_EMAIL_ASSIGNED'
  | 'ACCOUNT_WORK_PHONE_ASSIGNED'
  | 'ACCOUNT_WORK_EMAIL_REVOKED'
  | 'ACCOUNT_WORK_PHONE_REVOKED'
  | 'ACCOUNT_WORK_EMAIL_STATUS_CHANGED'
  | 'ACCOUNT_WORK_PHONE_STATUS_CHANGED'
  | 'ACCOUNT_PRIMARY_WORK_EMAIL_CHANGED'
  | 'ACCOUNT_PRIMARY_WORK_PHONE_CHANGED'
  | 'SERVICE_ACCOUNT_CREATED'
  | 'SERVICE_ACCOUNT_STATUS_CHANGED'
  | 'API_KEY_CREATED'
  | 'API_KEY_REVOKED'
  | 'API_KEY_ROTATED'
  | 'API_KEY_AUTHENTICATED'

export type IdentityAuditResult = AuditResult
export type IdentityAuditOperator = AuditOperator
export type IdentityAuditScope = AuditScope
export type IdentityAuditTrace = AuditTrace
export type IdentityAuditResource = AuditResource

export type IdentityAuditEnvelope<TDetails extends Record<string, unknown> = Record<string, unknown>> =
  AuditEnvelope<'identity-service', IdentityAuditModule, IdentityAuditEventType, TDetails>

export class IdentityAuditEvent<TDetails extends Record<string, unknown> = Record<string, unknown>>
  implements AuditEnvelope<'identity-service', IdentityAuditModule, IdentityAuditEventType, TDetails>
{
  readonly service = 'identity-service' as const

  constructor(
    public readonly eventId: string,
    public readonly module: IdentityAuditModule,
    public readonly eventType: IdentityAuditEventType,
    public readonly occurredAt: Date,
    public readonly result: IdentityAuditResult,
    public readonly operator: IdentityAuditOperator,
    public readonly scope: IdentityAuditScope,
    public readonly trace: IdentityAuditTrace,
    public readonly resource: IdentityAuditResource,
    public readonly details: TDetails
  ) {}

  get type(): IdentityAuditEventType {
    return this.eventType
  }
}
