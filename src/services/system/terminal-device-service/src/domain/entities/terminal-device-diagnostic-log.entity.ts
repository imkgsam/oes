export interface TerminalDeviceDiagnosticLogProps {
  diagnosticLogId: string
  terminalDeviceId: string
  tenantId: string
  accountId: string | null
  sessionId: string | null
  clientTime: Date
  receivedAt: Date
  level: string
  eventType: string
  message: string
  traceId: string | null
  requestId: string | null
  errorCode: string | null
  diagnosticMode: boolean
  details: Record<string, unknown>
}

// TerminalDeviceDiagnosticLogEntity represents one sanitized manual PDA diagnostic upload entry.
export class TerminalDeviceDiagnosticLogEntity {
  readonly diagnosticLogId: string
  readonly terminalDeviceId: string
  readonly tenantId: string
  readonly accountId: string | null
  readonly sessionId: string | null
  readonly clientTime: Date
  readonly receivedAt: Date
  readonly level: string
  readonly eventType: string
  readonly message: string
  readonly traceId: string | null
  readonly requestId: string | null
  readonly errorCode: string | null
  readonly diagnosticMode: boolean
  readonly details: Record<string, unknown>

  // Constructs an immutable diagnostic log from sanitized client facts.
  constructor(props: TerminalDeviceDiagnosticLogProps) {
    this.diagnosticLogId = props.diagnosticLogId
    this.terminalDeviceId = props.terminalDeviceId
    this.tenantId = props.tenantId
    this.accountId = props.accountId
    this.sessionId = props.sessionId
    this.clientTime = props.clientTime
    this.receivedAt = props.receivedAt
    this.level = props.level
    this.eventType = props.eventType
    this.message = props.message
    this.traceId = props.traceId
    this.requestId = props.requestId
    this.errorCode = props.errorCode
    this.diagnosticMode = props.diagnosticMode
    this.details = props.details
  }
}
