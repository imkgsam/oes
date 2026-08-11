import { TerminalDeviceEntity } from '../entities/terminal-device.entity'
import { TerminalDeviceAuditEventEntity } from '../entities/terminal-device-audit-event.entity'
import { TerminalDeviceType } from '../enums/terminal-device.enums'

export interface TerminalDeviceIdentityMatchInput {
  terminalDeviceType: TerminalDeviceType
  manufacturerSerial?: string | null
  androidId?: string | null
  appInstallationId?: string | null
}

// TerminalDeviceRepository defines persistence operations for managed terminal device registry records.
export interface TerminalDeviceRepository {
  create(entity: TerminalDeviceEntity): Promise<TerminalDeviceEntity>
  update(entity: TerminalDeviceEntity): Promise<TerminalDeviceEntity>
  compareAndSwapCredential(
    expected: TerminalDeviceEntity,
    replacement: TerminalDeviceEntity
  ): Promise<TerminalDeviceEntity | null>
  commitStatusChange(
    nextDevice: TerminalDeviceEntity,
    auditEvent: TerminalDeviceAuditEventEntity
  ): Promise<TerminalDeviceEntity>
  findById(terminalDeviceId: string): Promise<TerminalDeviceEntity | null>
  listByTenant(tenantId: string): Promise<TerminalDeviceEntity[]>
  findPossibleIdentityMatch(input: TerminalDeviceIdentityMatchInput): Promise<TerminalDeviceEntity | null>
}
