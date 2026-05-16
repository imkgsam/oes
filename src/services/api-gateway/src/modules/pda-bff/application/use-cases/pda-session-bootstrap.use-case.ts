import { Injectable, UnauthorizedException } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import { SessionContextUseCase } from '../../../auth-bff/application/use-cases/session-context.use-case'
import { PdaBootstrapViewModel } from '../../interfaces/http/view-models/pda-bootstrap.view-model'

const PDA_IDLE_TIMEOUT_SECONDS = 900
const PDA_HEARTBEAT_INTERVAL_SECONDS = 300
const PDA_APP_VERSION = '0.1.0'

@Injectable()
// Builds the PDA Phase 1 bootstrap payload from authenticated session context and fixed device defaults.
export class PdaSessionBootstrapUseCase {
  constructor(private readonly sessionContextUseCase: SessionContextUseCase) {}

  /** Returns PDA bootstrap data without owning auth, identity, permission, or device-management truth. */
  async execute(source: DownstreamRequestSource): Promise<PdaBootstrapViewModel> {
    const terminal = source.user?.terminal
    if (terminal && terminal !== 'PDA') {
      throw new UnauthorizedException('PDA bootstrap requires a PDA terminal session')
    }

    const context = await this.sessionContextUseCase.execute(source)
    const tenantId = context.tenant?.tenantId ?? null

    return {
      account: {
        accountId: context.account.accountId,
        tenantId,
        scopeLevel: context.account.scopeLevel,
        displayName: context.account.name ?? context.operator.displayName
      },
      session: {
        sessionId: source.user?.sid,
        terminal: 'PDA',
        idleTimeoutSeconds: PDA_IDLE_TIMEOUT_SECONDS
      },
      access: {
        roles: source.user?.roles ?? [],
        actionCodes: context.access.actionCodes ?? []
      },
      device: {
        deviceStatus: 'ACTIVE'
      },
      devicePolicy: {
        heartbeatIntervalSeconds: PDA_HEARTBEAT_INTERVAL_SECONDS,
        idleTimeoutSeconds: PDA_IDLE_TIMEOUT_SECONDS,
        minSupportedAppVersion: PDA_APP_VERSION,
        latestAppVersion: PDA_APP_VERSION,
        upgradeRequired: false
      },
      workbench: {
        mode: 'FOUNDATION_ACCEPTANCE',
        enabledCards: ['SESSION', 'DEVICE', 'NETWORK', 'SCAN', 'CAMERA', 'LOGS']
      },
      serverTime: new Date().toISOString()
    }
  }
}
