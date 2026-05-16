import { TerminalDeviceEntity } from '../../../domain/entities/terminal-device.entity'
import { TerminalDeviceError } from '../../../domain/errors/terminal-device.error'
import {
  TerminalDeviceIdentityMatchInput,
  TerminalDeviceRepository
} from '../../../domain/repositories/terminal-device.repository'
import { InMemoryTerminalDeviceStore } from './in-memory-terminal-device-store'

// InMemoryTerminalDeviceRepository stores terminal device entities for module smoke tests without external persistence.
export class InMemoryTerminalDeviceRepository implements TerminalDeviceRepository {
  constructor(private readonly store = new InMemoryTerminalDeviceStore()) {}

  // Persists a terminal device entity in memory while mirroring Prisma uniqueness constraints.
  async create(entity: TerminalDeviceEntity): Promise<TerminalDeviceEntity> {
    if (this.store.devices.has(entity.terminalDeviceId)) {
      throw new TerminalDeviceError('TERMINAL_DEVICE_ALREADY_EXISTS', 'Terminal device already exists')
    }
    if (entity.enrollmentId && this.store.terminalDeviceIdsByEnrollmentId.has(entity.enrollmentId)) {
      throw new TerminalDeviceError('TERMINAL_DEVICE_ENROLLMENT_ALREADY_LINKED', 'Terminal device enrollment is already linked')
    }
    this.store.devices.set(entity.terminalDeviceId, entity)
    if (entity.enrollmentId) {
      this.store.terminalDeviceIdsByEnrollmentId.set(entity.enrollmentId, entity.terminalDeviceId)
    }
    return entity
  }

  // Replaces an existing terminal device entity while preserving uniqueness indexes.
  async update(entity: TerminalDeviceEntity): Promise<TerminalDeviceEntity> {
    const current = this.store.devices.get(entity.terminalDeviceId)
    if (!current) {
      throw new TerminalDeviceError('TERMINAL_DEVICE_NOT_FOUND', 'Terminal device not found')
    }

    if (current.enrollmentId !== entity.enrollmentId) {
      const linkedDeviceId = entity.enrollmentId ? this.store.terminalDeviceIdsByEnrollmentId.get(entity.enrollmentId) : null
      if (linkedDeviceId && linkedDeviceId !== entity.terminalDeviceId) {
        throw new TerminalDeviceError('TERMINAL_DEVICE_ENROLLMENT_ALREADY_LINKED', 'Terminal device enrollment is already linked')
      }
      if (current.enrollmentId) {
        this.store.terminalDeviceIdsByEnrollmentId.delete(current.enrollmentId)
      }
      if (entity.enrollmentId) {
        this.store.terminalDeviceIdsByEnrollmentId.set(entity.enrollmentId, entity.terminalDeviceId)
      }
    }

    this.store.devices.set(entity.terminalDeviceId, entity)
    return entity
  }

  // Loads a terminal device entity from memory by its service-owned identifier.
  async findById(terminalDeviceId: string): Promise<TerminalDeviceEntity | null> {
    return this.store.devices.get(terminalDeviceId) ?? null
  }

  // Lists terminal devices owned by one tenant in registration order.
  async listByTenant(tenantId: string): Promise<TerminalDeviceEntity[]> {
    return [...this.store.devices.values()].filter((device) => device.tenantId === tenantId)
  }

  // Finds any existing device sharing a strong or auxiliary identity signal with a new activation.
  async findPossibleIdentityMatch(input: TerminalDeviceIdentityMatchInput): Promise<TerminalDeviceEntity | null> {
    for (const device of this.store.devices.values()) {
      if (device.terminalDeviceType !== input.terminalDeviceType) {
        continue
      }

      if (input.manufacturerSerial && device.manufacturerSerial === input.manufacturerSerial) {
        return device
      }

      if (input.androidId && device.androidId === input.androidId) {
        return device
      }

      if (input.appInstallationId && device.appInstallationId === input.appInstallationId) {
        return device
      }
    }

    return null
  }
}
