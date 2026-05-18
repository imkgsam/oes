import { Injectable } from '@nestjs/common'
import { TerminalDeviceEnrollmentEntity } from '../../../domain/entities/terminal-device-enrollment.entity'
import { TerminalDeviceError } from '../../../domain/errors/terminal-device.error'
import { TerminalDeviceEnrollmentRepository } from '../../../domain/repositories/terminal-device-enrollment.repository'
import { PrismaService } from '../../prisma/prisma.service'
import { PrismaTerminalDeviceMapper } from './prisma-terminal-device.mapper'

// PrismaTerminalDeviceEnrollmentRepository persists administrator-issued enrollment authorizations.
@Injectable()
export class PrismaTerminalDeviceEnrollmentRepository implements TerminalDeviceEnrollmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Creates one enrollment authorization with code hash uniqueness enforced by the database.
  async create(entity: TerminalDeviceEnrollmentEntity): Promise<TerminalDeviceEnrollmentEntity> {
    try {
      const record = await this.prisma.terminalDeviceEnrollment.create({
        data: PrismaTerminalDeviceMapper.toEnrollmentData(entity) as any
      })
      return PrismaTerminalDeviceMapper.toEnrollmentEntity(record)
    } catch (error) {
      throw mapEnrollmentWriteError(error)
    }
  }

  // Updates one enrollment authorization by replacing its persisted lifecycle facts.
  async update(entity: TerminalDeviceEnrollmentEntity): Promise<TerminalDeviceEnrollmentEntity> {
    try {
      const record = await this.prisma.terminalDeviceEnrollment.update({
        where: { enrollmentId: entity.enrollmentId },
        data: PrismaTerminalDeviceMapper.toEnrollmentData(entity) as any
      })
      return PrismaTerminalDeviceMapper.toEnrollmentEntity(record)
    } catch (error) {
      throw mapEnrollmentWriteError(error)
    }
  }

  // Loads one enrollment authorization by its identifier.
  async findById(enrollmentId: string): Promise<TerminalDeviceEnrollmentEntity | null> {
    const record = await this.prisma.terminalDeviceEnrollment.findUnique({
      where: { enrollmentId }
    })
    return record ? PrismaTerminalDeviceMapper.toEnrollmentEntity(record) : null
  }

  // Loads one enrollment authorization by the one-time code hash.
  async findByCodeHash(codeHash: string): Promise<TerminalDeviceEnrollmentEntity | null> {
    const record = await this.prisma.terminalDeviceEnrollment.findUnique({
      where: { codeHash }
    })
    return record ? PrismaTerminalDeviceMapper.toEnrollmentEntity(record) : null
  }

  // Lists enrollments issued within one tenant in creation order.
  async listByTenant(tenantId: string): Promise<TerminalDeviceEnrollmentEntity[]> {
    const records = await this.prisma.terminalDeviceEnrollment.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' }
    })
    return records.map((record) => PrismaTerminalDeviceMapper.toEnrollmentEntity(record))
  }
}

// mapEnrollmentWriteError converts Prisma constraint failures into enrollment domain errors.
function mapEnrollmentWriteError(error: unknown): TerminalDeviceError {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code: string }).code) : null
  if (code === 'P2025') {
    return new TerminalDeviceError('ENROLLMENT_NOT_FOUND', 'Terminal device enrollment does not exist')
  }
  if (code === 'P2002') {
    return new TerminalDeviceError('ENROLLMENT_ACTIVATION_CONFLICT', 'Terminal device enrollment code hash already exists')
  }
  return error instanceof TerminalDeviceError
    ? error
    : new TerminalDeviceError('TERMINAL_DEVICE_PERSISTENCE_ERROR', 'Terminal device enrollment persistence failed')
}
