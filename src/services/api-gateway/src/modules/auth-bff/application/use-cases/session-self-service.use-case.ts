import { Injectable, UnauthorizedException } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import { AuthGrpcAdapter } from '../../infrastructure/downstream/auth-service/auth-grpc.adapter'
import {
  SelfSessionListViewModel,
  SelfSessionViewModel,
  SessionMutationViewModel
} from '../../interfaces/http/view-models/self-security.view-model'
import { getAuthenticatedSelfContext } from './self-security-context'

@Injectable()
// Executes authenticated self-service session queries and mutations for the current user.
export class SessionSelfServiceUseCase {
  constructor(private readonly authAdapter: AuthGrpcAdapter) {}

  async listSessions(source: DownstreamRequestSource): Promise<SelfSessionListViewModel> {
    const self = getAuthenticatedSelfContext(source)
    const result = await this.authAdapter.listSessions(self.userId, self.sessionId, source)

    return {
      sessions: (result.sessions ?? []).map(
        (session): SelfSessionViewModel => ({
          sessionId: session.sessionId ?? '',
          accountId: session.accountId ?? undefined,
          tenantId: session.tenantId ?? undefined,
          status: session.status ?? '',
          loginMethod: session.loginMethod ?? '',
          deviceId: session.deviceId ?? undefined,
          deviceName: session.deviceName ?? undefined,
          userAgent: session.userAgent ?? undefined,
          ipAddress: session.ipAddress ?? undefined,
          platform: session.platform ?? undefined,
          browser: session.browser ?? undefined,
          createdAt: session.createdAt ?? '',
          lastActiveAt: session.lastActiveAt ?? '',
          expiresAt: session.expiresAt ?? '',
          refreshExpiresAt: session.refreshExpiresAt ?? '',
          accessRemainingSeconds: Number(session.accessRemainingSeconds ?? '0'),
          refreshRemainingSeconds: Number(session.refreshRemainingSeconds ?? '0'),
          sessionAgeSeconds: Number(session.sessionAgeSeconds ?? '0'),
          idleSeconds: Number(session.idleSeconds ?? '0'),
          isAccessExpired: Boolean(session.isAccessExpired),
          isRefreshExpired: Boolean(session.isRefreshExpired),
          isRevoked: Boolean(session.isRevoked),
          isCurrent: Boolean(session.isCurrent),
          isAdminControlled: Boolean(session.isAdminControlled)
        })
      )
    }
  }

  async logout(source: DownstreamRequestSource): Promise<SessionMutationViewModel> {
    const self = getAuthenticatedSelfContext(source)
    if (!self.sessionId) {
      throw new UnauthorizedException('authenticated session context is missing session id')
    }

    const result = await this.authAdapter.logout(self.sessionId, source)
    return { success: Boolean(result.success) }
  }

  async logoutOtherDevices(source: DownstreamRequestSource): Promise<SessionMutationViewModel> {
    const self = getAuthenticatedSelfContext(source)
    if (!self.sessionId) {
      throw new UnauthorizedException('authenticated session context is missing session id')
    }

    const result = await this.authAdapter.logoutOtherDevices(self.userId, self.sessionId, source)
    return {
      success: Boolean(result.success),
      sessionCount: Number(result.sessionCount ?? '0')
    }
  }

  async logoutAll(source: DownstreamRequestSource): Promise<SessionMutationViewModel> {
    const self = getAuthenticatedSelfContext(source)
    const result = await this.authAdapter.logoutAll(self.userId, source)
    return {
      success: Boolean(result.success),
      sessionCount: Number(result.sessionCount ?? '0')
    }
  }
}
