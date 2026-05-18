import { Injectable } from '@nestjs/common'
import { TerminalDeviceEntity } from '../../../domain/entities/terminal-device.entity'
import { TerminalDeviceError } from '../../../domain/errors/terminal-device.error'
import {
  TerminalDeviceIdentityMatchInput,
  TerminalDeviceRepository
} from '../../../domain/repositories/terminal-device.repository'
import { PrismaService } from '../../prisma/prisma.service'
import { PrismaTerminalDeviceMapper } from './prisma-terminal-device.mapper'

// PrismaTerminalDeviceRepository persists managed terminal device registry records.
@Injectable()
export class PrismaTerminalDeviceRepository implements TerminalDeviceRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Creates a terminal device registry record in the service-owned database.
  async create(entity: TerminalDeviceEntity): Promise<TerminalDeviceEntity> {
    try {
      const record = await this.prisma.terminalDevice.create({
        data: PrismaTerminalDeviceMapper.toDeviceData(entity) as any
      })
      return PrismaTerminalDeviceMapper.toDeviceEntity(record)
    } catch (error) {
      throw mapDeviceWriteError(error)
    }
  }

  // Replaces a terminal device registry record while preserving database uniqueness checks.
  async update(entity: TerminalDeviceEntity): Promise<TerminalDeviceEntity> {
    try {
      const record = await this.prisma.terminalDevice.update({
        where: { terminalDeviceId: entity.terminalDeviceId },
        data: PrismaTerminalDeviceMapper.toDeviceData(entity) as any
      })
      return PrismaTerminalDeviceMapper.toDeviceEntity(record)
    } catch (error) {
      throw mapDeviceWriteError(error)
    }
  }

  // Loads one terminal device registry record by its service-owned identifier.
  async findById(terminalDeviceId: string): Promise<TerminalDeviceEntity | null> {
    const record = await this.prisma.terminalDevice.findUnique({
      where: { terminalDeviceId }
    })
    return record ? PrismaTerminalDeviceMapper.toDeviceEntity(record) : null
  }

  // Lists terminal devices owned by one tenant in stable registration order.
  async listByTenant(tenantId: string): Promise<TerminalDeviceEntity[]> {
    const records = await this.prisma.terminalDevice.findMany({
      where: { tenantId },
      orderBy: { registeredAt: 'asc' }
    })
    return records.map((record) => PrismaTerminalDeviceMapper.toDeviceEntity(record))
  }

  // Finds an existing device that shares any strong or auxiliary identity signal.
  async findPossibleIdentityMatch(input: TerminalDeviceIdentityMatchInput): Promise<TerminalDeviceEntity | null> {
    const identityFilters = [
      input.manufacturerSerial ? { manufacturerSerial: input.manufacturerSerial } : null,
      input.androidId ? { androidId: input.androidId } : null,
      input.appInstallationId ? { appInstallationId: input.appInstallationId } : null
    ].filter(Boolean) as Record<string, string>[]

    if (identityFilters.length === 0) {
      return null
    }

    const record = await this.prisma.terminalDevice.findFirst({
      where: {
        terminalDeviceType: input.terminalDeviceType,
        OR: identityFilters
      },
      orderBy: { registeredAt: 'asc' }
    })
    return record ? PrismaTerminalDeviceMapper.toDeviceEntity(record) : null
  }
}

// mapDeviceWriteError converts Prisma constraint failures into terminal-device domain errors.
function mapDeviceWriteError(error: unknown): TerminalDeviceError {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code: string }).code) : null
  const target = typeof error === 'object' && error !== null && 'meta' in error ? (error as any).meta?.target : null
  if (code === 'P2025') {
    return new TerminalDeviceError('TERMINAL_DEVICE_NOT_FOUND', 'Terminal device not found')
  }
  if (code === 'P2002' && Array.isArray(target) && target.includes('enrollmentId')) {
    return new TerminalDeviceError(
      'TERMINAL_DEVICE_ENROLLMENT_ALREADY_LINKED',
      'Terminal device enrollment is already linked'
    )
  }
  if (code === 'P2002') {
    return new TerminalDeviceError('TERMINAL_DEVICE_ALREADY_EXISTS', 'Terminal device already exists')
  }
  return error instanceof TerminalDeviceError
    ? error
    : new TerminalDeviceError('TERMINAL_DEVICE_PERSISTENCE_ERROR', 'Terminal device persistence failed')
}
