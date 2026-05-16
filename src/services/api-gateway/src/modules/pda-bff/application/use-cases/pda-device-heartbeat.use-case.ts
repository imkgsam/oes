import { Injectable } from '@nestjs/common'
import { PdaHeartbeatDto } from '../../interfaces/http/dtos/pda-device.dto'
import { PdaHeartbeatViewModel } from '../../interfaces/http/view-models/pda-device.view-model'
import { InMemoryPdaDeviceHeartbeatStore } from '../../infrastructure/in-memory-pda-device-heartbeat.store'

const PDA_IDLE_TIMEOUT_SECONDS = 900
const PDA_HEARTBEAT_INTERVAL_SECONDS = 300
const PDA_APP_VERSION = '0.1.0'

@Injectable()
// Records Phase 1 PDA heartbeat diagnostics and returns fixed device policy defaults.
export class PdaDeviceHeartbeatUseCase {
  constructor(private readonly store: InMemoryPdaDeviceHeartbeatStore) {}

  execute(dto: PdaHeartbeatDto): PdaHeartbeatViewModel {
    const serverTime = new Date().toISOString()
    this.store.save({
      deviceId: dto.device.deviceId,
      idSource: dto.device.idSource,
      fallbackAppDeviceId: normalizeNullable(dto.device.fallbackAppDeviceId),
      manufacturer: normalizeNullable(dto.device.manufacturer),
      deviceModel: normalizeNullable(dto.device.deviceModel),
      androidVersion: normalizeNullable(dto.device.androidVersion),
      appVersion: dto.device.appVersion,
      networkStatus: dto.runtime.networkStatus,
      batteryLevel: dto.runtime.batteryLevel ?? null,
      appState: dto.runtime.appState,
      accountId: normalizeNullable(dto.session?.accountId),
      tenantId: normalizeNullable(dto.session?.tenantId ?? undefined),
      sessionId: normalizeNullable(dto.session?.sessionId),
      lastHeartbeatAt: serverTime,
      lastClientTime: dto.clientTime
    })

    return {
      accepted: true,
      deviceStatus: 'ACTIVE',
      devicePolicy: {
        heartbeatIntervalSeconds: PDA_HEARTBEAT_INTERVAL_SECONDS,
        idleTimeoutSeconds: PDA_IDLE_TIMEOUT_SECONDS,
        minSupportedAppVersion: PDA_APP_VERSION,
        latestAppVersion: PDA_APP_VERSION,
        upgradeRequired: false
      },
      serverTime
    }
  }
}

function normalizeNullable(value?: string | null): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}
