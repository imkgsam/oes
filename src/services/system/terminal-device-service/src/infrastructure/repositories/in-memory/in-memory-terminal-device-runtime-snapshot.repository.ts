import { TerminalDeviceRuntimeSnapshotEntity } from '../../../domain/entities/terminal-device-runtime-snapshot.entity'
import { TerminalDeviceRuntimeSnapshotRepository } from '../../../domain/repositories/terminal-device-runtime-snapshot.repository'

// InMemoryTerminalDeviceRuntimeSnapshotRepository stores one current runtime snapshot per terminal device for tests.
export class InMemoryTerminalDeviceRuntimeSnapshotRepository implements TerminalDeviceRuntimeSnapshotRepository {
  private readonly snapshots = new Map<string, TerminalDeviceRuntimeSnapshotEntity>()

  // Creates or replaces the current runtime snapshot for one terminal device.
  async upsert(entity: TerminalDeviceRuntimeSnapshotEntity): Promise<TerminalDeviceRuntimeSnapshotEntity> {
    this.snapshots.set(entity.terminalDeviceId, entity)
    return entity
  }

  // Loads the current runtime snapshot for one terminal device.
  async findByTerminalDeviceId(terminalDeviceId: string): Promise<TerminalDeviceRuntimeSnapshotEntity | null> {
    return this.snapshots.get(terminalDeviceId) ?? null
  }
}
