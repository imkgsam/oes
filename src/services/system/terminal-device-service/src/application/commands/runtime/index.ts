import { RecordDiagnosticLogsHandler } from './record-diagnostic-logs.command'
import { RecordHeartbeatHandler } from './record-heartbeat.command'

export * from './record-diagnostic-logs.command'
export * from './record-heartbeat.command'

export const RuntimeCommandHandlers = [RecordHeartbeatHandler, RecordDiagnosticLogsHandler]
