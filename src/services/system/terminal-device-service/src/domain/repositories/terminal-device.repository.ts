import { TerminalDeviceEntity } from '../entities/terminal-device.entity'

// TerminalDeviceRepository defines persistence operations for managed terminal device registry records.
export interface TerminalDeviceRepository {
  create(entity: TerminalDeviceEntity): Promise<TerminalDeviceEntity>
  findById(terminalDeviceId: string): Promise<TerminalDeviceEntity | null>
}
