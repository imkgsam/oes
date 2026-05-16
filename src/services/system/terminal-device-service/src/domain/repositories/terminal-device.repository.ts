import { TerminalDeviceEntity } from '../entities/terminal-device.entity'
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
  findById(terminalDeviceId: string): Promise<TerminalDeviceEntity | null>
  findPossibleIdentityMatch(input: TerminalDeviceIdentityMatchInput): Promise<TerminalDeviceEntity | null>
}
