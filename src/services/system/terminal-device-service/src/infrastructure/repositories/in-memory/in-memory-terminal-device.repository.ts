import { TerminalDeviceEntity } from '../../../domain/entities/terminal-device.entity'
import { TerminalDeviceRepository } from '../../../domain/repositories/terminal-device.repository'

// InMemoryTerminalDeviceRepository stores terminal device entities for module smoke tests without external persistence.
export class InMemoryTerminalDeviceRepository implements TerminalDeviceRepository {
  private readonly devices = new Map<string, TerminalDeviceEntity>()
  private readonly terminalDeviceIdsByEnrollmentId = new Map<string, string>()

  // Persists a terminal device entity in memory while mirroring Prisma uniqueness constraints.
  async create(entity: TerminalDeviceEntity): Promise<TerminalDeviceEntity> {
    if (this.devices.has(entity.terminalDeviceId)) {
      throw new Error(`Terminal device already exists: ${entity.terminalDeviceId}`)
    }
    if (entity.enrollmentId && this.terminalDeviceIdsByEnrollmentId.has(entity.enrollmentId)) {
      throw new Error(`Terminal device enrollment is already linked: ${entity.enrollmentId}`)
    }
    this.devices.set(entity.terminalDeviceId, entity)
    if (entity.enrollmentId) {
      this.terminalDeviceIdsByEnrollmentId.set(entity.enrollmentId, entity.terminalDeviceId)
    }
    return entity
  }

  // Loads a terminal device entity from memory by its service-owned identifier.
  async findById(terminalDeviceId: string): Promise<TerminalDeviceEntity | null> {
    return this.devices.get(terminalDeviceId) ?? null
  }
}
