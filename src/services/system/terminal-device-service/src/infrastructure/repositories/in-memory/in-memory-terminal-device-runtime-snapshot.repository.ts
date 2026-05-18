import { TerminalDeviceHeartbeatRecordEntity } from '../../../domain/entities/terminal-device-heartbeat-record.entity'
import { TerminalDeviceDiagnosticLogEntity } from '../../../domain/entities/terminal-device-diagnostic-log.entity'
import { TerminalDeviceRuntimeSnapshotEntity } from '../../../domain/entities/terminal-device-runtime-snapshot.entity'
import {
  TerminalDeviceHeartbeatRecordPage,
  TerminalDeviceDiagnosticLogPage,
  TerminalDeviceRuntimeSnapshotRepository
} from '../../../domain/repositories/terminal-device-runtime-snapshot.repository'

// InMemoryTerminalDeviceRuntimeSnapshotRepository stores one current runtime snapshot per terminal device for tests.
export class InMemoryTerminalDeviceRuntimeSnapshotRepository implements TerminalDeviceRuntimeSnapshotRepository {
  private readonly snapshots = new Map<string, TerminalDeviceRuntimeSnapshotEntity>()
  private readonly heartbeatRecords: TerminalDeviceHeartbeatRecordEntity[] = []
  private readonly diagnosticLogs: TerminalDeviceDiagnosticLogEntity[] = []

  // Creates or replaces the current runtime snapshot for one terminal device.
  async upsert(entity: TerminalDeviceRuntimeSnapshotEntity): Promise<TerminalDeviceRuntimeSnapshotEntity> {
    this.snapshots.set(entity.terminalDeviceId, entity)
    return entity
  }

  // Appends one immutable heartbeat diagnostic record for admin history queries.
  async appendHeartbeatRecord(entity: TerminalDeviceHeartbeatRecordEntity): Promise<TerminalDeviceHeartbeatRecordEntity> {
    this.heartbeatRecords.push(entity)
    return entity
  }

  // Appends sanitized manual PDA diagnostic logs for admin history queries.
  async appendDiagnosticLogs(entities: TerminalDeviceDiagnosticLogEntity[]): Promise<TerminalDeviceDiagnosticLogEntity[]> {
    this.diagnosticLogs.push(...entities)
    return entities
  }

  // Loads the current runtime snapshot for one terminal device.
  async findByTerminalDeviceId(terminalDeviceId: string): Promise<TerminalDeviceRuntimeSnapshotEntity | null> {
    return this.snapshots.get(terminalDeviceId) ?? null
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
    const items = this.heartbeatRecords
      .filter((record) => record.tenantId === input.tenantId && record.terminalDeviceId === input.terminalDeviceId)
      .sort((left, right) => right.receivedAt.getTime() - left.receivedAt.getTime())

    return {
      items: items.slice((page - 1) * pageSize, page * pageSize),
      page,
      pageSize,
      total: items.length
    }
  }

  // Lists sanitized diagnostic logs newest first for one terminal device.
  async listDiagnosticLogs(input: {
    tenantId: string
    terminalDeviceId: string
    page?: number
    pageSize?: number
  }): Promise<TerminalDeviceDiagnosticLogPage> {
    const page = Math.max(1, input.page ?? 1)
    const pageSize = Math.max(1, input.pageSize ?? 20)
    const items = this.diagnosticLogs
      .filter((record) => record.tenantId === input.tenantId && record.terminalDeviceId === input.terminalDeviceId)
      .sort((left, right) => right.receivedAt.getTime() - left.receivedAt.getTime())

    return {
      items: items.slice((page - 1) * pageSize, page * pageSize),
      page,
      pageSize,
      total: items.length
    }
  }
}
