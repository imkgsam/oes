import { Injectable } from '@nestjs/common'
import { TerminalDeviceAuditEventEntity } from '../../../domain/entities/terminal-device-audit-event.entity'
import { TerminalDeviceError } from '../../../domain/errors/terminal-device.error'
import { TerminalDeviceAuditEventRepository } from '../../../domain/repositories/terminal-device-audit-event.repository'
import { PrismaService } from '../../prisma/prisma.service'
import { PrismaTerminalDeviceMapper } from './prisma-terminal-device.mapper'

// PrismaTerminalDeviceAuditEventRepository persists terminal device governance audit events.
@Injectable()
export class PrismaTerminalDeviceAuditEventRepository implements TerminalDeviceAuditEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Appends one audit event to the service-owned audit log.
  async create(entity: TerminalDeviceAuditEventEntity): Promise<TerminalDeviceAuditEventEntity> {
    try {
      const record = await this.prisma.terminalDeviceAuditEvent.create({
        data: PrismaTerminalDeviceMapper.toAuditEventData(entity) as any
      })
      return PrismaTerminalDeviceMapper.toAuditEventEntity(record)
    } catch (error) {
      const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code: string }).code) : null
      if (code === 'P2002') {
        throw new TerminalDeviceError('AUDIT_EVENT_ALREADY_EXISTS', 'Terminal device audit event already exists')
      }
      throw error
    }
  }

  // Lists audit events for one tenant and device target in chronological order.
  async listByTerminalDeviceId(tenantId: string, terminalDeviceId: string): Promise<TerminalDeviceAuditEventEntity[]> {
    const records = await this.prisma.terminalDeviceAuditEvent.findMany({
      where: {
        tenantId,
        targetTerminalDeviceId: terminalDeviceId
      },
      orderBy: { occurredAt: 'asc' }
    })
    return records.map((record) => PrismaTerminalDeviceMapper.toAuditEventEntity(record))
  }
}
