import { TerminalDeviceEnrollmentEntity } from '../../../domain/entities/terminal-device-enrollment.entity'
import { TerminalDeviceEnrollmentRepository } from '../../../domain/repositories/terminal-device-enrollment.repository'

// InMemoryTerminalDeviceEnrollmentRepository stores enrollment entities for module smoke tests without external persistence.
export class InMemoryTerminalDeviceEnrollmentRepository implements TerminalDeviceEnrollmentRepository {
  private readonly enrollments = new Map<string, TerminalDeviceEnrollmentEntity>()
  private readonly enrollmentIdsByCodeHash = new Map<string, string>()

  // Persists an enrollment entity in memory while mirroring Prisma uniqueness constraints.
  async create(entity: TerminalDeviceEnrollmentEntity): Promise<TerminalDeviceEnrollmentEntity> {
    if (this.enrollments.has(entity.enrollmentId)) {
      throw new Error(`Terminal device enrollment already exists: ${entity.enrollmentId}`)
    }
    if (this.enrollmentIdsByCodeHash.has(entity.codeHash)) {
      throw new Error(`Terminal device enrollment code hash already exists: ${entity.codeHash}`)
    }
    this.enrollments.set(entity.enrollmentId, entity)
    this.enrollmentIdsByCodeHash.set(entity.codeHash, entity.enrollmentId)
    return entity
  }

  // Loads an enrollment entity from memory by its enrollment identifier.
  async findById(enrollmentId: string): Promise<TerminalDeviceEnrollmentEntity | null> {
    return this.enrollments.get(enrollmentId) ?? null
  }

  // Loads an enrollment entity from memory by its hashed one-time code.
  async findByCodeHash(codeHash: string): Promise<TerminalDeviceEnrollmentEntity | null> {
    const enrollmentId = this.enrollmentIdsByCodeHash.get(codeHash)
    return enrollmentId ? this.findById(enrollmentId) : null
  }
}
