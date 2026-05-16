import { TerminalDeviceRuntimeSnapshotEntity } from '../entities/terminal-device-runtime-snapshot.entity'

// TerminalDeviceRuntimeSnapshotRepository defines persistence operations for the current runtime snapshot per terminal device.
export interface TerminalDeviceRuntimeSnapshotRepository {
  upsert(entity: TerminalDeviceRuntimeSnapshotEntity): Promise<TerminalDeviceRuntimeSnapshotEntity>
  findByTerminalDeviceId(terminalDeviceId: string): Promise<TerminalDeviceRuntimeSnapshotEntity | null>
}
