import {
  AuditEnvelope,
  AuditOperator,
  AuditResource,
  AuditResult,
  AuditScope,
  AuditTrace
} from '@oes/common'
import { EventTraceContext } from '@oes/common/tracing'

export type PermissionAuditModule = 'role' | 'permission' | 'policy' | 'authorization' | 'navigation'
export type PermissionManagementAuditEventType = string
export type PermissionAuditOperator = AuditOperator
export type PermissionAuditScope = AuditScope
export type PermissionAuditTrace = AuditTrace & EventTraceContext
export type PermissionAuditResource = AuditResource
export type PermissionAuditResult = AuditResult

/**
 * PermissionAuditEvent carries permission-service management audit facts in the shared envelope shape.
 */
export class PermissionAuditEvent<
  TDetails extends Record<string, unknown> = Record<string, unknown>
> implements AuditEnvelope<'permission-service', PermissionAuditModule, PermissionManagementAuditEventType, TDetails>
{
  readonly service = 'permission-service' as const

  constructor(
    public readonly eventId: string,
    public readonly module: PermissionAuditModule,
    public readonly eventType: PermissionManagementAuditEventType,
    public readonly occurredAt: Date,
    public readonly result: PermissionAuditResult,
    public readonly operator: PermissionAuditOperator,
    public readonly scope: PermissionAuditScope,
    public readonly trace: PermissionAuditTrace,
    public readonly resource: PermissionAuditResource,
    public readonly details: TDetails
  ) {}
}
