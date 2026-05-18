import { AppState, NetworkStatus, NetworkType, PresenceStatus } from '../enums/terminal-device.enums'

export interface TerminalDeviceHeartbeatRecordProps {
  heartbeatId: string
  terminalDeviceId: string
  tenantId: string
  presenceStatus: PresenceStatus
  receivedAt: Date
  clientTime: Date | null
  appVersion: string | null
  androidVersion: string | null
  webViewVersion: string | null
  networkStatus: NetworkStatus
  networkType: NetworkType
  batteryLevel: number | null
  appState: AppState
  reportedAccountId: string | null
  reportedSessionId: string | null
  traceId: string | null
}

// TerminalDeviceHeartbeatRecordEntity represents one immutable heartbeat diagnostic event.
export class TerminalDeviceHeartbeatRecordEntity {
  readonly heartbeatId: string
  readonly terminalDeviceId: string
  readonly tenantId: string
  readonly presenceStatus: PresenceStatus
  readonly receivedAt: Date
  readonly clientTime: Date | null
  readonly appVersion: string | null
  readonly androidVersion: string | null
  readonly webViewVersion: string | null
  readonly networkStatus: NetworkStatus
  readonly networkType: NetworkType
  readonly batteryLevel: number | null
  readonly appState: AppState
  readonly reportedAccountId: string | null
  readonly reportedSessionId: string | null
  readonly traceId: string | null

  // Constructs an immutable heartbeat diagnostic record from server-received runtime facts.
  constructor(props: TerminalDeviceHeartbeatRecordProps) {
    this.heartbeatId = props.heartbeatId
    this.terminalDeviceId = props.terminalDeviceId
    this.tenantId = props.tenantId
    this.presenceStatus = props.presenceStatus
    this.receivedAt = props.receivedAt
    this.clientTime = props.clientTime
    this.appVersion = props.appVersion
    this.androidVersion = props.androidVersion
    this.webViewVersion = props.webViewVersion
    this.networkStatus = props.networkStatus
    this.networkType = props.networkType
    this.batteryLevel = props.batteryLevel
    this.appState = props.appState
    this.reportedAccountId = props.reportedAccountId
    this.reportedSessionId = props.reportedSessionId
    this.traceId = props.traceId
  }
}
