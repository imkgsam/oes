import { AppState, NetworkStatus, NetworkType, PresenceStatus } from '../enums/terminal-device.enums'

export interface TerminalDeviceRuntimeSnapshotProps {
  terminalDeviceId: string
  tenantId: string
  presenceStatus: PresenceStatus
  lastHeartbeatAt: Date
  lastClientTime: Date | null
  appVersion: string | null
  androidVersion: string | null
  webViewVersion: string | null
  networkStatus: NetworkStatus
  networkType: NetworkType
  batteryLevel: number | null
  appState: AppState
  lastReportedAccountId: string | null
  lastReportedSessionId: string | null
}

// TerminalDeviceRuntimeSnapshotEntity represents the latest diagnostic runtime facts for one terminal device.
export class TerminalDeviceRuntimeSnapshotEntity {
  readonly terminalDeviceId: string
  readonly tenantId: string
  readonly presenceStatus: PresenceStatus
  readonly lastHeartbeatAt: Date
  readonly lastClientTime: Date | null
  readonly appVersion: string | null
  readonly androidVersion: string | null
  readonly webViewVersion: string | null
  readonly networkStatus: NetworkStatus
  readonly networkType: NetworkType
  readonly batteryLevel: number | null
  readonly appState: AppState
  readonly lastReportedAccountId: string | null
  readonly lastReportedSessionId: string | null

  // Constructs an immutable runtime snapshot entity from heartbeat diagnostic facts.
  constructor(props: TerminalDeviceRuntimeSnapshotProps) {
    this.terminalDeviceId = props.terminalDeviceId
    this.tenantId = props.tenantId
    this.presenceStatus = props.presenceStatus
    this.lastHeartbeatAt = props.lastHeartbeatAt
    this.lastClientTime = props.lastClientTime
    this.appVersion = props.appVersion
    this.androidVersion = props.androidVersion
    this.webViewVersion = props.webViewVersion
    this.networkStatus = props.networkStatus
    this.networkType = props.networkType
    this.batteryLevel = props.batteryLevel
    this.appState = props.appState
    this.lastReportedAccountId = props.lastReportedAccountId
    this.lastReportedSessionId = props.lastReportedSessionId
  }
}
