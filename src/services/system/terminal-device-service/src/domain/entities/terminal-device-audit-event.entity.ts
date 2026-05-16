export interface TerminalDeviceAuditEventProps {
  auditEventId: string
  tenantId: string
  operatorAccountId: string
  operatorOrgId: string | null
  action: string
  targetTerminalDeviceId: string | null
  beforeJson: Record<string, unknown> | null
  afterJson: Record<string, unknown> | null
  reason: string | null
  traceId: string | null
  occurredAt: Date
}

// TerminalDeviceAuditEventEntity represents an auditable device governance fact owned by this service.
export class TerminalDeviceAuditEventEntity {
  readonly auditEventId: string
  readonly tenantId: string
  readonly operatorAccountId: string
  readonly operatorOrgId: string | null
  readonly action: string
  readonly targetTerminalDeviceId: string | null
  readonly beforeJson: Record<string, unknown> | null
  readonly afterJson: Record<string, unknown> | null
  readonly reason: string | null
  readonly traceId: string | null
  readonly occurredAt: Date

  // Constructs an immutable audit event entity from persisted governance audit facts.
  constructor(props: TerminalDeviceAuditEventProps) {
    this.auditEventId = props.auditEventId
    this.tenantId = props.tenantId
    this.operatorAccountId = props.operatorAccountId
    this.operatorOrgId = props.operatorOrgId
    this.action = props.action
    this.targetTerminalDeviceId = props.targetTerminalDeviceId
    this.beforeJson = props.beforeJson
    this.afterJson = props.afterJson
    this.reason = props.reason
    this.traceId = props.traceId
    this.occurredAt = props.occurredAt
  }
}
