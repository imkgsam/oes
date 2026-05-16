import { Injectable } from '@nestjs/common'

export type LatestPdaHeartbeatState = {
  deviceId: string
  idSource: string
  fallbackAppDeviceId: string | null
  manufacturer: string | null
  deviceModel: string | null
  androidVersion: string | null
  appVersion: string
  networkStatus: 'ONLINE' | 'OFFLINE'
  batteryLevel: number | null
  appState: string
  accountId: string | null
  tenantId: string | null
  sessionId: string | null
  lastHeartbeatAt: string
  lastClientTime: string
}

@Injectable()
// Stores the latest PDA heartbeat in memory for Phase 1 diagnostics, not as device registry truth.
export class InMemoryPdaDeviceHeartbeatStore {
  private readonly latestByDeviceId = new Map<string, LatestPdaHeartbeatState>()

  save(state: LatestPdaHeartbeatState): void {
    this.latestByDeviceId.set(state.deviceId, state)
  }

  getLatest(deviceId: string): LatestPdaHeartbeatState | undefined {
    return this.latestByDeviceId.get(deviceId)
  }
}
