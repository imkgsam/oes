import { TerminalDeviceAuditEventEntity } from '../../../domain/entities/terminal-device-audit-event.entity'
import { TerminalDeviceError } from '../../../domain/errors/terminal-device.error'
import { TerminalDeviceAuditEventRepository } from '../../../domain/repositories/terminal-device-audit-event.repository'
import { InMemoryTerminalDeviceStore } from './in-memory-terminal-device-store'

// InMemoryTerminalDeviceAuditEventRepository stores audit events for module smoke tests without external persistence.
export class InMemoryTerminalDeviceAuditEventRepository implements TerminalDeviceAuditEventRepository {
  constructor(private readonly store = new InMemoryTerminalDeviceStore()) {}

  // Appends an audit event to the in-memory audit log while mirroring primary-key uniqueness.
  async create(entity: TerminalDeviceAuditEventEntity): Promise<TerminalDeviceAuditEventEntity> {
    if (this.store.auditEventIds.has(entity.auditEventId)) {
      throw new TerminalDeviceError('AUDIT_EVENT_ALREADY_EXISTS', 'Terminal device audit event already exists')
    }
    this.store.auditEvents.push(entity)
    this.store.auditEventIds.add(entity.auditEventId)
    return entity
  }

  // Lists audit events for one tenant and terminal device from the in-memory audit log.
  async listByTerminalDeviceId(tenantId: string, terminalDeviceId: string): Promise<TerminalDeviceAuditEventEntity[]> {
    return this.store.auditEvents.filter(
      (event) => event.tenantId === tenantId && event.targetTerminalDeviceId === terminalDeviceId
    )
  }
}
