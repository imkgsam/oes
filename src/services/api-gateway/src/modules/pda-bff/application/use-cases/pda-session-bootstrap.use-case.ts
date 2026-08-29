import { Injectable, UnauthorizedException } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import { SessionAccessSummaryUseCase } from '../../../auth-bff/application/use-cases/session-access-summary.use-case'
import { getAuthenticatedSelfContext } from '../../../auth-bff/application/use-cases/self-security-context'
import { PdaTerminalDeviceAdapter } from '../../infrastructure/downstream/terminal-device-service/pda-terminal-device.adapter'
import { PdaBootstrapViewModel } from '../../interfaces/http/view-models/pda-bootstrap.view-model'

const PDA_IDLE_TIMEOUT_SECONDS = 900

@Injectable()
// Builds the PDA bootstrap payload from authenticated session context and managed device decision.
export class PdaSessionBootstrapUseCase {
  constructor(
    private readonly sessionAccessSummaryUseCase: SessionAccessSummaryUseCase,
    private readonly terminalDeviceAdapter: PdaTerminalDeviceAdapter
  ) {}

  /** Returns PDA bootstrap data without owning auth, identity, permission, or device-management truth. */
  async execute(
    source: DownstreamRequestSource,
    terminalDeviceId: string,
    deviceCredential: string
  ): Promise<PdaBootstrapViewModel> {
    if (source.user?.terminal !== 'PDA') {
      throw new UnauthorizedException('PDA bootstrap requires a PDA terminal session')
    }

    const self = getAuthenticatedSelfContext(source)
    if (!self.accountId || !self.tenantId || self.scopeLevel !== 'TENANT') {
      throw new UnauthorizedException('PDA bootstrap requires a tenant account session')
    }

    const decision = await this.terminalDeviceAdapter.resolveDeviceAccessDecision({
      tenantId: self.tenantId,
      terminalDeviceId,
      requestPurpose: 'BOOTSTRAP',
      session: {
        accountId: self.accountId,
        sessionId: source.user?.sid
      },
      traceId: source.traceId,
      source: {
        requestId: source.requestId,
        traceparent: source.traceparent,
        tracestate: source.tracestate
      },
      deviceCredential
    })

    if (!decision.allowed || decision.resolvedTenantId !== self.tenantId) {
      throw new UnauthorizedException('PDA bootstrap device access denied')
    }
    const access = await this.sessionAccessSummaryUseCase.execute(source)

    return {
      account: {
        accountId: self.accountId,
        tenantId: self.tenantId,
        scopeLevel: self.scopeLevel,
        displayName: source.user?.displayName
      },
      session: {
        sessionId: source.user?.sid,
        terminal: 'PDA',
        terminalDeviceId,
        idleTimeoutSeconds: PDA_IDLE_TIMEOUT_SECONDS
      },
      access: {
        roles: access.roles.map((role) => role.code).filter(Boolean),
        actionCodes: access.actionCodes
      },
      device: {
        terminalDeviceId,
        terminalDeviceType: 'PDA',
        tenantId: decision.resolvedTenantId,
        displayName: null,
        deviceStatus: decision.deviceStatus ?? 'UNKNOWN'
      },
      decision,
      workbench: {
        mode: 'FOUNDATION_ACCEPTANCE',
        enabledCards: ['SESSION', 'DEVICE', 'NETWORK', 'SCAN', 'CAMERA', 'LOGS']
      },
      serverTime: new Date().toISOString()
    }
  }
}
