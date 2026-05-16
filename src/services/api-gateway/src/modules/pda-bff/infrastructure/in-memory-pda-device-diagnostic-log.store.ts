export type PdaDeviceDiagnosticLogRecord = {
  deviceId: string
  idSource: string
  accountId: string | null
  tenantId: string | null
  sessionId: string | null
  clientTime: string
  receivedAt: string
  level: 'INFO' | 'WARN' | 'ERROR'
  eventType: string
  message: string
  traceId: string | null
  requestId: string | null
  errorCode: string | null
  diagnosticMode: boolean
  details: Record<string, unknown>
}

const MAX_RECENT_LOGS_PER_DEVICE = 100

// Keeps the latest manually uploaded PDA diagnostic logs in memory for Phase 1 field debugging.
export class InMemoryPdaDeviceDiagnosticLogStore {
  private readonly recordsByDeviceId = new Map<string, PdaDeviceDiagnosticLogRecord[]>()

  saveBatch(deviceId: string, records: PdaDeviceDiagnosticLogRecord[]): void {
    const current = this.recordsByDeviceId.get(deviceId) ?? []
    this.recordsByDeviceId.set(deviceId, [...records, ...current].slice(0, MAX_RECENT_LOGS_PER_DEVICE))
  }

  getRecent(deviceId: string): PdaDeviceDiagnosticLogRecord[] {
    return [...(this.recordsByDeviceId.get(deviceId) ?? [])]
  }
}
