import { Injectable } from '@nestjs/common'
import { TerminalDeviceHeartbeatRecordEntity } from '../../../domain/entities/terminal-device-heartbeat-record.entity'
import { TerminalDeviceDiagnosticLogEntity } from '../../../domain/entities/terminal-device-diagnostic-log.entity'
import { TerminalDeviceRuntimeSnapshotEntity } from '../../../domain/entities/terminal-device-runtime-snapshot.entity'
import {
  TerminalDeviceHeartbeatRecordPage,
  TerminalDeviceRuntimeSnapshotRepository
} from '../../../domain/repositories/terminal-device-runtime-snapshot.repository'
import { PrismaService } from '../../prisma/prisma.service'
import { PrismaTerminalDeviceMapper } from './prisma-terminal-device.mapper'

// PrismaTerminalDeviceRuntimeSnapshotRepository persists the latest runtime diagnostics per terminal device.
@Injectable()
export class PrismaTerminalDeviceRuntimeSnapshotRepository implements TerminalDeviceRuntimeSnapshotRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Creates or replaces the current runtime snapshot for one terminal device.
  async upsert(entity: TerminalDeviceRuntimeSnapshotEntity): Promise<TerminalDeviceRuntimeSnapshotEntity> {
    const data = PrismaTerminalDeviceMapper.toRuntimeSnapshotData(entity) as any
    const record = await this.prisma.terminalDeviceRuntimeSnapshot.upsert({
      where: { terminalDeviceId: entity.terminalDeviceId },
      update: data,
      create: data
    })
    return PrismaTerminalDeviceMapper.toRuntimeSnapshotEntity(record)
  }

  // Appends one immutable heartbeat diagnostic record for admin history queries.
  async appendHeartbeatRecord(entity: TerminalDeviceHeartbeatRecordEntity): Promise<TerminalDeviceHeartbeatRecordEntity> {
    const record = await this.prisma.terminalDeviceHeartbeatRecord.create({
      data: PrismaTerminalDeviceMapper.toHeartbeatRecordData(entity) as any
    })
    return PrismaTerminalDeviceMapper.toHeartbeatRecordEntity(record)
  }

  // Appends sanitized manual PDA diagnostic logs for admin history queries.
  async appendDiagnosticLogs(entities: TerminalDeviceDiagnosticLogEntity[]): Promise<TerminalDeviceDiagnosticLogEntity[]> {
    if (entities.length === 0) {
      return []
    }

    await this.prisma.terminalDeviceDiagnosticLog.createMany({
      data: entities.map((entity) => PrismaTerminalDeviceMapper.toDiagnosticLogData(entity) as any)
    })
    return entities
  }

  // Loads the current runtime snapshot for one terminal device.
  async findByTerminalDeviceId(terminalDeviceId: string): Promise<TerminalDeviceRuntimeSnapshotEntity | null> {
    const record = await this.prisma.terminalDeviceRuntimeSnapshot.findUnique({
      where: { terminalDeviceId }
    })
    return record ? PrismaTerminalDeviceMapper.toRuntimeSnapshotEntity(record) : null
  }

  // Lists immutable heartbeat records newest first for one terminal device.
  async listHeartbeatRecords(input: {
    tenantId: string
    terminalDeviceId: string
    page?: number
    pageSize?: number
  }): Promise<TerminalDeviceHeartbeatRecordPage> {
    const page = Math.max(1, input.page ?? 1)
    const pageSize = Math.max(1, input.pageSize ?? 20)
    const where = {
      tenantId: input.tenantId,
      terminalDeviceId: input.terminalDeviceId
    }
    const [items, total] = await Promise.all([
      this.prisma.terminalDeviceHeartbeatRecord.findMany({
        where,
        orderBy: { receivedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      this.prisma.terminalDeviceHeartbeatRecord.count({ where })
    ])

    return {
      items: items.map((item) => PrismaTerminalDeviceMapper.toHeartbeatRecordEntity(item)),
      page,
      pageSize,
      total
    }
  }

  // Lists sanitized diagnostic logs newest first for one terminal device.
  async listDiagnosticLogs(input: {
    tenantId: string
    terminalDeviceId: string
    page?: number
    pageSize?: number
  }) {
    const page = Math.max(1, input.page ?? 1)
    const pageSize = Math.max(1, input.pageSize ?? 20)
    const where = {
      tenantId: input.tenantId,
      terminalDeviceId: input.terminalDeviceId
    }
    const [items, total] = await Promise.all([
      this.prisma.terminalDeviceDiagnosticLog.findMany({
        where,
        orderBy: { receivedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      this.prisma.terminalDeviceDiagnosticLog.count({ where })
    ])

    return {
      items: items.map((item) => PrismaTerminalDeviceMapper.toDiagnosticLogEntity(item)),
      page,
      pageSize,
      total
    }
  }
}
