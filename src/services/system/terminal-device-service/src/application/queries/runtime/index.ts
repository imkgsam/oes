import { GetRuntimeSnapshotHandler } from './get-runtime-snapshot.query'
import { ListDiagnosticLogsHandler } from './list-diagnostic-logs.query'
import { ListHeartbeatRecordsHandler } from './list-heartbeat-records.query'

export * from './get-runtime-snapshot.query'
export * from './list-diagnostic-logs.query'
export * from './list-heartbeat-records.query'

export const RuntimeQueryHandlers = [GetRuntimeSnapshotHandler, ListHeartbeatRecordsHandler, ListDiagnosticLogsHandler]
