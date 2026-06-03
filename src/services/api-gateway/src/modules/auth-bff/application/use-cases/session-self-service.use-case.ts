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
  SessionMutationViewModel,
  TerminalPinMutationViewModel,
  TrustedDeviceListViewModel,
  TrustedDeviceMutationViewModel,
  TrustedDeviceViewModel
} from '../../interfaces/http/view-models/self-security.view-model'
import {
  ChangeOwnPasswordDto,
  OwnTerminalPinDto,
  SetOwnTerminalPinEnabledDto,
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
          accountSummary: session.accountId
            ? {
                accountId: session.accountId
              }
            : undefined,
          tenantSummary: session.tenantId
            ? {
                tenantId: session.tenantId
              }
            : undefined,
          status: session.status ?? '',
          loginMethod: session.loginMethod ?? '',
          terminal: session.terminal ?? 'WEB',
          loginFlow: session.loginFlow ?? session.loginMethod ?? '',
          terminalDeviceId: session.terminalDeviceId ?? undefined,
          deviceBoundTenantId: session.deviceBoundTenantId ?? undefined,
          terminalDeviceSummary: session.terminalDeviceId
            ? {
                terminalDeviceId: session.terminalDeviceId,
                deviceBoundTenantId: session.deviceBoundTenantId ?? undefined
              }
            : undefined,
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

  async listTrustedDevices(source: DownstreamRequestSource): Promise<TrustedDeviceListViewModel> {
    const self = getAuthenticatedSelfContext(source)
    const result = await this.authAdapter.listTrustedDevices(
      self.userId,
      self.scopeLevel,
      self.tenantId,
      undefined,
      source
    )

    return {
      devices: (result.devices ?? []).map(
        (device): TrustedDeviceViewModel => ({
          id: device.id ?? '',
          deviceId: device.deviceId ?? '',
          deviceName: device.deviceName ?? undefined,
          browser: device.browser ?? undefined,
          platform: device.platform ?? undefined,
          trustedAt: device.trustedAt ?? '',
          lastActiveAt: device.lastActiveAt ?? '',
          expiresAt: device.expiresAt ?? '',
          isCurrentDevice: Boolean(device.isCurrentDevice)
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
        terminal: item.terminal ?? undefined,
        loginFlow: item.loginFlow ?? undefined,
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
        accountId: self.accountId,
        tenantId: self.tenantId,
        scopeLevel: self.scopeLevel,
        currentPassword: dto.currentPassword,
        newPassword: dto.newPassword,
        mfaGrantToken: dto.mfaGrantToken
      },
      source
    )

    return {
      success: Boolean(result.success),
      passwordSetupRequired: Boolean(result.passwordSetupRequired)
    }
  }

  async setOwnTerminalPin(
    dto: OwnTerminalPinDto,
    source: DownstreamRequestSource
  ): Promise<TerminalPinMutationViewModel> {
    const self = getAuthenticatedSelfContext(source)
    const result = await this.authAdapter.setOwnTerminalPin(
      {
        userId: self.userId,
        currentPassword: dto.currentPassword,
        newPin: dto.newPin,
        mfaGrantToken: dto.mfaGrantToken
      },
      source
    )

    return { success: Boolean(result.success) }
  }

  async resetOwnTerminalPin(
    dto: OwnTerminalPinDto,
    source: DownstreamRequestSource
  ): Promise<TerminalPinMutationViewModel> {
    const self = getAuthenticatedSelfContext(source)
    const result = await this.authAdapter.resetOwnTerminalPin(
      {
        userId: self.userId,
        currentPassword: dto.currentPassword,
        newPin: dto.newPin,
        mfaGrantToken: dto.mfaGrantToken
      },
      source
    )

    return { success: Boolean(result.success) }
  }

  async setOwnTerminalPinEnabled(
    dto: SetOwnTerminalPinEnabledDto,
    source: DownstreamRequestSource
  ): Promise<TerminalPinMutationViewModel> {
    const self = getAuthenticatedSelfContext(source)
    const result = await this.authAdapter.setOwnTerminalPinEnabled(
      {
        userId: self.userId,
        enabled: Boolean(dto.enabled)
      },
      source
    )

    return { success: Boolean(result.success) }
  }

  async setLoginMethodEnabled(
    methodId: string,
    enabled: boolean,
    source: DownstreamRequestSource
  ): Promise<LoginMethodMutationViewModel> {
    const self = getAuthenticatedSelfContext(source)
    const result = await this.authAdapter.setOwnLoginMethodEnabled(
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

  async revokeTrustedDevice(
    trustedDeviceId: string,
    source: DownstreamRequestSource
  ): Promise<TrustedDeviceMutationViewModel> {
    const self = getAuthenticatedSelfContext(source)
    const result = await this.authAdapter.revokeTrustedDevice(
      self.userId,
      self.scopeLevel,
      self.tenantId,
      trustedDeviceId.trim(),
      source
    )

    return {
      success: Boolean(result.success),
      deviceCount: Number(result.deviceCount ?? '0')
    }
  }

  async revokeOtherTrustedDevices(
    source: DownstreamRequestSource
  ): Promise<TrustedDeviceMutationViewModel> {
    const self = getAuthenticatedSelfContext(source)
    const result = await this.authAdapter.revokeOtherTrustedDevices(
      self.userId,
      self.scopeLevel,
      self.tenantId,
      undefined,
      source
    )

    return {
      success: Boolean(result.success),
      deviceCount: Number(result.deviceCount ?? '0')
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
