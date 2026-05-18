import { TerminalDeviceRuntimeSnapshotEntity } from '../entities/terminal-device-runtime-snapshot.entity'
import { TerminalDeviceHeartbeatRecordEntity } from '../entities/terminal-device-heartbeat-record.entity'
import { TerminalDeviceDiagnosticLogEntity } from '../entities/terminal-device-diagnostic-log.entity'

export interface TerminalDeviceHeartbeatRecordPage {
  items: TerminalDeviceHeartbeatRecordEntity[]
  page: number
  pageSize: number
  total: number
}

export interface TerminalDeviceDiagnosticLogPage {
  items: TerminalDeviceDiagnosticLogEntity[]
  page: number
  pageSize: number
  total: number
}

// TerminalDeviceRuntimeSnapshotRepository defines persistence operations for the current runtime snapshot per terminal device.
export interface TerminalDeviceRuntimeSnapshotRepository {
  upsert(entity: TerminalDeviceRuntimeSnapshotEntity): Promise<TerminalDeviceRuntimeSnapshotEntity>
  appendHeartbeatRecord(entity: TerminalDeviceHeartbeatRecordEntity): Promise<TerminalDeviceHeartbeatRecordEntity>
  appendDiagnosticLogs(entities: TerminalDeviceDiagnosticLogEntity[]): Promise<TerminalDeviceDiagnosticLogEntity[]>
  findByTerminalDeviceId(terminalDeviceId: string): Promise<TerminalDeviceRuntimeSnapshotEntity | null>
  listHeartbeatRecords(input: {
    tenantId: string
    terminalDeviceId: string
    page?: number
    pageSize?: number
  }): Promise<TerminalDeviceHeartbeatRecordPage>
  listDiagnosticLogs(input: {
    tenantId: string
    terminalDeviceId: string
    page?: number
    pageSize?: number
  }): Promise<TerminalDeviceDiagnosticLogPage>
}
