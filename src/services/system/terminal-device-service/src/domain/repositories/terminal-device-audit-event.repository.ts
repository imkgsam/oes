import { TerminalDeviceAuditEventEntity } from '../entities/terminal-device-audit-event.entity'

// TerminalDeviceAuditEventRepository defines persistence operations for local terminal device governance audit events.
export interface TerminalDeviceAuditEventRepository {
  create(entity: TerminalDeviceAuditEventEntity): Promise<TerminalDeviceAuditEventEntity>
  listByTerminalDeviceId(tenantId: string, terminalDeviceId: string): Promise<TerminalDeviceAuditEventEntity[]>
}
