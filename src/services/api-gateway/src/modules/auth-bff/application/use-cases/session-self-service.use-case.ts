import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import { AuthGrpcAdapter } from '../../infrastructure/downstream/auth-service/auth-grpc.adapter'
import {
  LoginMethodListViewModel,
  LoginMethodMutationViewModel,
  LoginMethodViewModel,
  PasswordMutationViewModel,
  SelfLoginHistoryListViewModel,
  SelfSessionListViewModel,
  SelfSessionViewModel,
  SessionMutationViewModel
} from '../../interfaces/http/view-models/self-security.view-model'
import {
  ChangeOwnPasswordDto,
  SelfLoginHistoryQueryDto
} from '../../interfaces/http/dtos/self-security.dto'
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

  async listLoginHistory(
    query: SelfLoginHistoryQueryDto,
    source: DownstreamRequestSource
  ): Promise<SelfLoginHistoryListViewModel> {
    const self = getAuthenticatedSelfContext(source)
    const result = await this.authAdapter.listLoginHistory(
      {
        userId: self.userId,
        result: query.result,
        occurredAtFrom: query.occurredAtFrom,
        occurredAtTo: query.occurredAtTo,
        cursor: query.cursor,
        pageSize: query.pageSize
      },
      source
    )

    return {
      items: (result.items ?? []).map((item) => ({
        occurredAt: item.occurredAt ?? '',
        outcome: item.outcome ?? '',
        loginMethod: item.loginMethod ?? undefined,
        ipAddress: item.ipAddress ?? undefined,
        deviceName: item.deviceName ?? undefined,
        platform: item.platform ?? undefined,
        browser: item.browser ?? undefined,
        failureReason: item.failureReason ?? undefined,
        traceId: item.traceId ?? undefined
      })),
      nextCursor: result.nextCursor ?? undefined
    }
  }

  async listLoginMethods(source: DownstreamRequestSource): Promise<LoginMethodListViewModel> {
    const self = getAuthenticatedSelfContext(source)
    const result = await this.authAdapter.listLoginMethods(self.userId, source)

    return {
      loginMethods: (result.loginMethods ?? []).map(toLoginMethodViewModel),
      passwordSetupRequired: Boolean(result.passwordSetupRequired)
    }
  }

  async changeOwnPassword(
    dto: ChangeOwnPasswordDto,
    source: DownstreamRequestSource
  ): Promise<PasswordMutationViewModel> {
    const self = getAuthenticatedSelfContext(source)
    const result = await this.authAdapter.changeOwnPassword(
      {
        userId: self.userId,
        currentPassword: dto.currentPassword,
        newPassword: dto.newPassword
      },
      source
    )

    return {
      success: Boolean(result.success),
      passwordSetupRequired: Boolean(result.passwordSetupRequired)
    }
  }

  async setLoginMethodEnabled(
    methodId: string,
    enabled: boolean,
    source: DownstreamRequestSource
  ): Promise<LoginMethodMutationViewModel> {
    const self = getAuthenticatedSelfContext(source)
    const result = await this.authAdapter.setLoginMethodEnabled(
      {
        userId: self.userId,
        methodId: methodId.trim(),
        enabled
      },
      source
    )

    return {
      success: Boolean(result.success),
      loginMethod: toLoginMethodViewModel(result.loginMethod)
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

  async logoutSession(
    targetSessionId: string,
    source: DownstreamRequestSource
  ): Promise<SessionMutationViewModel> {
    const self = getAuthenticatedSelfContext(source)
    if (!self.sessionId) {
      throw new UnauthorizedException('authenticated session context is missing session id')
    }
    if (targetSessionId === self.sessionId) {
      throw new BadRequestException('current session cannot be revoked through this endpoint')
    }

    const result = await this.authAdapter.logoutSession(self.userId, self.sessionId, targetSessionId, source)
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
    if (!self.sessionId) {
      throw new UnauthorizedException('authenticated session context is missing session id')
    }

    const result = await this.authAdapter.logoutAll(self.userId, self.sessionId, source)
    return {
      success: Boolean(result.success),
      sessionCount: Number(result.sessionCount ?? '0')
    }
  }
}

function toLoginMethodViewModel(method?: {
  methodId?: string
  userId?: string
  type?: string
  identifier?: string
  maskedIdentifier?: string
  verified?: boolean
  enabled?: boolean
  hasPassword?: boolean
  createdAt?: string
  updatedAt?: string
}): LoginMethodViewModel {
  return {
    methodId: method?.methodId ?? '',
    userId: method?.userId ?? '',
    type: method?.type ?? '',
    identifier: method?.identifier ?? undefined,
    maskedIdentifier: method?.maskedIdentifier ?? undefined,
    verified: Boolean(method?.verified),
    enabled: Boolean(method?.enabled),
    hasPassword: Boolean(method?.hasPassword),
    createdAt: method?.createdAt ?? undefined,
    updatedAt: method?.updatedAt ?? undefined
  }
}
