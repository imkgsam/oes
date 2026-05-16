import { TerminalDeviceAuditEventEntity } from '../../../domain/entities/terminal-device-audit-event.entity'
import { TerminalDeviceEnrollmentEntity } from '../../../domain/entities/terminal-device-enrollment.entity'
import { TerminalDeviceEntity } from '../../../domain/entities/terminal-device.entity'

// InMemoryTerminalDeviceStore keeps repository test state in one consistency boundary.
export class InMemoryTerminalDeviceStore {
  readonly enrollments = new Map<string, TerminalDeviceEnrollmentEntity>()
  readonly enrollmentIdsByCodeHash = new Map<string, string>()
  readonly devices = new Map<string, TerminalDeviceEntity>()
  readonly terminalDeviceIdsByEnrollmentId = new Map<string, string>()
  readonly auditEvents: TerminalDeviceAuditEventEntity[] = []
  readonly auditEventIds = new Set<string>()
}
