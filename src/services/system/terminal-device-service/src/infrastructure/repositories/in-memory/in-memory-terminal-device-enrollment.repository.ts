import { TerminalDeviceEnrollmentEntity } from '../../../domain/entities/terminal-device-enrollment.entity'
import { TerminalDeviceError } from '../../../domain/errors/terminal-device.error'
import { TerminalDeviceEnrollmentRepository } from '../../../domain/repositories/terminal-device-enrollment.repository'
import { InMemoryTerminalDeviceStore } from './in-memory-terminal-device-store'

// InMemoryTerminalDeviceEnrollmentRepository stores enrollment entities for module smoke tests without external persistence.
export class InMemoryTerminalDeviceEnrollmentRepository implements TerminalDeviceEnrollmentRepository {
  constructor(private readonly store = new InMemoryTerminalDeviceStore()) {}

  // Persists an enrollment entity in memory while mirroring Prisma uniqueness constraints.
  async create(entity: TerminalDeviceEnrollmentEntity): Promise<TerminalDeviceEnrollmentEntity> {
    if (this.store.enrollments.has(entity.enrollmentId)) {
      throw new TerminalDeviceError('ENROLLMENT_ACTIVATION_CONFLICT', 'Terminal device enrollment already exists')
    }
    if (this.store.enrollmentIdsByCodeHash.has(entity.codeHash)) {
      throw new TerminalDeviceError('ENROLLMENT_ACTIVATION_CONFLICT', 'Terminal device enrollment code hash already exists')
    }
    this.store.enrollments.set(entity.enrollmentId, entity)
    this.store.enrollmentIdsByCodeHash.set(entity.codeHash, entity.enrollmentId)
    return entity
  }

  // Replaces an existing enrollment entity while preserving its code-hash uniqueness.
  async update(entity: TerminalDeviceEnrollmentEntity): Promise<TerminalDeviceEnrollmentEntity> {
    const existing = this.store.enrollments.get(entity.enrollmentId)
    if (!existing) {
      throw new TerminalDeviceError('ENROLLMENT_NOT_FOUND', 'Terminal device enrollment does not exist')
    }
    if (existing.codeHash !== entity.codeHash && this.store.enrollmentIdsByCodeHash.has(entity.codeHash)) {
      throw new TerminalDeviceError('ENROLLMENT_ACTIVATION_CONFLICT', 'Terminal device enrollment code hash already exists')
    }
    this.store.enrollmentIdsByCodeHash.delete(existing.codeHash)
    this.store.enrollments.set(entity.enrollmentId, entity)
    this.store.enrollmentIdsByCodeHash.set(entity.codeHash, entity.enrollmentId)
    return entity
  }

  // Loads an enrollment entity from memory by its enrollment identifier.
  async findById(enrollmentId: string): Promise<TerminalDeviceEnrollmentEntity | null> {
    return this.store.enrollments.get(enrollmentId) ?? null
  }

  // Loads an enrollment entity from memory by its hashed one-time code.
  async findByCodeHash(codeHash: string): Promise<TerminalDeviceEnrollmentEntity | null> {
    const enrollmentId = this.store.enrollmentIdsByCodeHash.get(codeHash)
    return enrollmentId ? this.findById(enrollmentId) : null
  }

  // Lists enrollment entities owned by one tenant in creation order.
  async listByTenant(tenantId: string): Promise<TerminalDeviceEnrollmentEntity[]> {
    return [...this.store.enrollments.values()].filter((enrollment) => enrollment.tenantId === tenantId)
  }
}
