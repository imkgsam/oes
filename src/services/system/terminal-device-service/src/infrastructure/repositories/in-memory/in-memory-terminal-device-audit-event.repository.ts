import { TerminalDeviceAuditEventEntity } from '../../../domain/entities/terminal-device-audit-event.entity'
import { TerminalDeviceAuditEventRepository } from '../../../domain/repositories/terminal-device-audit-event.repository'

// InMemoryTerminalDeviceAuditEventRepository stores audit events for module smoke tests without external persistence.
export class InMemoryTerminalDeviceAuditEventRepository implements TerminalDeviceAuditEventRepository {
  private readonly events: TerminalDeviceAuditEventEntity[] = []
  private readonly auditEventIds = new Set<string>()

  // Appends an audit event to the in-memory audit log while mirroring primary-key uniqueness.
  async create(entity: TerminalDeviceAuditEventEntity): Promise<TerminalDeviceAuditEventEntity> {
    if (this.auditEventIds.has(entity.auditEventId)) {
      throw new Error(`Terminal device audit event already exists: ${entity.auditEventId}`)
    }
    this.events.push(entity)
    this.auditEventIds.add(entity.auditEventId)
    return entity
  }

  // Lists audit events for one tenant and terminal device from the in-memory audit log.
  async listByTerminalDeviceId(tenantId: string, terminalDeviceId: string): Promise<TerminalDeviceAuditEventEntity[]> {
    return this.events.filter((event) => event.tenantId === tenantId && event.targetTerminalDeviceId === terminalDeviceId)
  }
}
