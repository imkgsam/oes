import { Injectable } from '@nestjs/common'
import { PdaHeartbeatDto } from '../../interfaces/http/dtos/pda-device.dto'
import { PdaHeartbeatViewModel } from '../../interfaces/http/view-models/pda-device.view-model'
import { PdaTerminalDeviceAdapter } from '../../infrastructure/downstream/terminal-device-service/pda-terminal-device.adapter'

@Injectable()
// Records PDA heartbeat diagnostics through terminal-device-service and returns the managed device decision.
export class PdaDeviceHeartbeatUseCase {
  constructor(private readonly terminalDeviceAdapter: PdaTerminalDeviceAdapter) {}

  async execute(dto: PdaHeartbeatDto): Promise<PdaHeartbeatViewModel> {
    const serverTime = new Date().toISOString()
    const terminalDeviceId = requireTerminalDeviceId(dto.device.terminalDeviceId)
    const reportedSession = dto.session
      ? {
          accountId: normalizeNullable(dto.session.accountId),
          sessionId: normalizeNullable(dto.session.sessionId)
        }
      : null

    const heartbeat = await this.terminalDeviceAdapter.recordHeartbeat({
      tenantId: normalizeNullable(dto.session?.tenantId ?? undefined),
      terminalDeviceId,
      device: dto.device,
      runtime: dto.runtime,
      session: reportedSession,
      clientTime: dto.clientTime
    })
    const decision = await this.terminalDeviceAdapter.resolveDeviceAccessDecision({
      tenantId: normalizeNullable(dto.session?.tenantId ?? undefined),
      terminalDeviceId,
      requestPurpose: 'HEARTBEAT',
      device: dto.device,
      session: reportedSession
    })

    return {
      accepted: true,
      decision,
      heartbeatIntervalSeconds: heartbeat.heartbeatIntervalSeconds,
      serverTime
    }
  }
}

function normalizeNullable(value?: string | null): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function requireTerminalDeviceId(value?: string | null): string {
  const terminalDeviceId = value?.trim()
  if (!terminalDeviceId) {
    throw new Error('PDA heartbeat requires terminalDeviceId')
  }
  return terminalDeviceId
}
