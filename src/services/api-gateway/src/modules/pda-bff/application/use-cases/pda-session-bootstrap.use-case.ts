import { Injectable, UnauthorizedException } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import { SessionContextUseCase } from '../../../auth-bff/application/use-cases/session-context.use-case'
import { PdaTerminalDeviceAdapter } from '../../infrastructure/downstream/terminal-device-service/pda-terminal-device.adapter'
import { PdaBootstrapViewModel } from '../../interfaces/http/view-models/pda-bootstrap.view-model'

const PDA_IDLE_TIMEOUT_SECONDS = 900

@Injectable()
// Builds the PDA bootstrap payload from authenticated session context and managed device decision.
export class PdaSessionBootstrapUseCase {
  constructor(
    private readonly sessionContextUseCase: SessionContextUseCase,
    private readonly terminalDeviceAdapter: PdaTerminalDeviceAdapter
  ) {}

  /** Returns PDA bootstrap data without owning auth, identity, permission, or device-management truth. */
  async execute(source: DownstreamRequestSource, terminalDeviceId: string): Promise<PdaBootstrapViewModel> {
    const terminal = source.user?.terminal
    if (terminal && terminal !== 'PDA') {
      throw new UnauthorizedException('PDA bootstrap requires a PDA terminal session')
    }

    const context = await this.sessionContextUseCase.execute(source)
    const tenantId = context.tenant?.tenantId ?? null
    const decision = await this.terminalDeviceAdapter.resolveDeviceAccessDecision({
      tenantId,
      terminalDeviceId,
      requestPurpose: 'BOOTSTRAP',
      session: {
        accountId: context.account.accountId,
        sessionId: source.user?.sid
      },
      traceId: source.traceId
    })

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
        terminalDeviceId,
        idleTimeoutSeconds: PDA_IDLE_TIMEOUT_SECONDS
      },
      access: {
        roles: source.user?.roles ?? [],
        actionCodes: context.access.actionCodes ?? []
      },
      device: {
        terminalDeviceId,
        terminalDeviceType: 'PDA',
        tenantId: decision.resolvedTenantId ?? tenantId,
        displayName: null,
        deviceStatus: decision.deviceStatus ?? 'UNKNOWN'
      },
      decision,
      workbench: {
        mode: 'PDA_MANAGED_DEVICE',
        enabledCards: ['SESSION', 'DEVICE', 'NETWORK', 'SCAN', 'CAMERA', 'LOGS']
      },
      serverTime: new Date().toISOString()
    }
  }
}
