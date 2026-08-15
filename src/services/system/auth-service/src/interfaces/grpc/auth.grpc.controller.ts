import { Controller, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import { AuthorizeBusinessRpc, AuthorizeSelfServiceRpc } from '@oes/common/authorization'
import { AuthTrustedExecutionGuard, AuthorizeAuthPublicAdmission } from '../../modules/auth/auth-trusted-execution.module'
import { GrpcMethod } from '@nestjs/microservices'
import {
  RequirePermissions,
  AUTH_MANAGEMENT_PERMISSION_CODES,
  PermissionGuard,
  RequireAuthenticatedOperator,
  AuthenticatedOperatorGuard,
  AUTH_SESSION_PERMISSION_CODES,
  GrpcRequestContextInterceptor,
  getAuthenticatedGrpcRequestContext,
  InternalServiceGuard,
  OPERATOR_CONTEXT_MISSING
} from '@oes/common/authorization'
import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs'
import { ACCESS_DENIED, ExceptionFactory } from '@oes/common/exceptions'
import { GrpcExceptionFilter } from '../../../../../../common/dist/core/filters'
import {
  AdminListOnlineUsersRequest,
  AdminListOnlineUsersResponse,
  AdminListTerminalDeviceSessionsRequest,
  AdminListTerminalDeviceSessionsResponse,
  AdminListUserSessionsRequest,
  AdminListUserSessionsResponse,
  AdminSessionView,
  AdminDeleteAccountSessionsRequest,
  AdminDeleteAccountSessionsResponse,
  AdminRevokeSessionRequest,
  AdminRevokeSessionResponse,
  RevokeTenantSessionsRequest,
  RevokeTenantSessionsResponse,
  AuditEventRecord,
  AuthServiceController,
  AuthServiceControllerMethods,
  ActivateTotpBindingRequest,
  ActivateTotpBindingResponse,
  BootstrapOwnLoginMethodsRequest,
  BootstrapOwnLoginMethodsResponse,
  BootstrapUserLoginMethodsRequest,
  BootstrapUserLoginMethodsResponse,
  ChangeOwnPasswordRequest,
  ChangeOwnPasswordResponse,
  CompletePasswordRecoveryResponse,
  CompleteStepUpMfaChallengeRequest,
  CompleteStepUpMfaChallengeResponse,
  CompletePasswordRecoveryRequest,
  InspectPasswordRecoveryChannelsRequest,
  InspectPasswordRecoveryChannelsResponse,
  RequestPasswordRecoveryChallengeResponse,
  PasswordRecoveryChannel,
  VerifyPasswordRecoveryChallengeResponse,
  CompleteFirstLoginPasswordSetupRequest,
  CompleteFirstLoginPasswordSetupResponse,
  DisableMfaBindingRequest,
  DisableMfaBindingResponse,
  RequestEmailBindingChallengeRequest,
  RequestEmailBindingChallengeResponse,
  RequestEmailOtpLoginChallengeRequest,
  RequestEmailOtpLoginChallengeResponse,
  LoginWithEmailPasswordRequest,
  LoginWithEmailPasswordResponse,
  LoginWithEmailOtpRequest,
  LoginWithEmailOtpResponse,
  EnableMfaBindingRequest,
  EnableMfaBindingResponse,
  InitializeRecoveryCodesRequest,
  InitializeRecoveryCodesResponse,
  InitializeTotpBindingRequest,
  InitializeTotpBindingResponse,
  LoginStatus,
  ListAuditEventsRequest,
  ListAuditEventsResponse,
  ListLoginHistoryRequest,
  ListLoginHistoryResponse,
  ListLoginMethodsRequest,
  ListLoginMethodsResponse,
  ListSessionsRequest,
  ListSessionsResponse,
  ListTrustedDevicesRequest,
  ListTrustedDevicesResponse,
  ListMfaBindingsRequest,
  ListMfaBindingsResponse,
  MfaBindingType,
  MfaScenario,
  GetTenantMfaPolicyRequest,
  GetTenantMfaPolicyResponse,
  GetPlatformMfaPolicyRequest,
  GetPlatformMfaPolicyResponse,
  RequestLoginMfaFactorChallengeRequest,
  RequestLoginMfaFactorChallengeResponse,
  RequestPasswordRecoveryChallengeRequest,
  LogoutAllRequest,
  LogoutAllResponse,
  LogoutSessionRequest,
  LogoutSessionResponse,
  LogoutOtherDevicesRequest,
  LogoutOtherDevicesResponse,
  LogoutRequest,
  LogoutResponse,
  RequestPhoneBindingChallengeRequest,
  RequestPhoneBindingChallengeResponse,
  RequestPhoneOtpLoginChallengeRequest,
  RequestPhoneOtpLoginChallengeResponse,
  LoginWithPhoneOtpRequest,
  LoginWithPhoneOtpResponse,
  LoginWithEmployeeCodePinRequest,
  LoginWithEmployeeCodePinResponse,
  PreflightEmployeeCodePinLoginRequest,
  PreflightEmployeeCodePinLoginResponse,
  LoginWithPhonePasswordRequest,
  LoginWithPhonePasswordResponse,
  RefreshSessionRequest,
  RefreshSessionResponse,
  ValidateAccessTokenRequest,
  ValidateAccessTokenResponse,
  RegenerateRecoveryCodesRequest,
  RegenerateRecoveryCodesResponse,
  RevokeOtherTrustedDevicesRequest,
  RevokeOtherTrustedDevicesResponse,
  RevokeTrustedDeviceRequest,
  RevokeTrustedDeviceResponse,
  RequirePasswordSetupRequest,
  RequirePasswordSetupResponse,
  RequireTerminalPinResetRequest,
  SelectAccountRequest,
  SelectAccountResponse,
  SetLoginMethodEnabledRequest,
  SetLoginMethodEnabledResponse,
  SetOwnLoginMethodEnabledRequest,
  SetOwnLoginMethodEnabledResponse,
  StartStepUpMfaChallengeRequest,
  StartStepUpMfaChallengeResponse,
  SubmitMfaChallengeResponse,
  SubmitMfaChallengeRequest,
  TenantMfaFactorPolicy,
  TenantMfaScenarioRequirement,
  TerminalLoginPolicyEntry,
  TerminalMfaPolicyEntry,
  TrustedDeviceView,
  GetPlatformDefaultTerminalMfaPolicyRequest,
  GetPlatformDefaultTerminalMfaPolicyResponse,
  UpdatePlatformMfaPolicyRequest,
  UpdatePlatformMfaPolicyResponse,
  UpdatePlatformDefaultTerminalMfaPolicyRequest,
  UpdatePlatformDefaultTerminalMfaPolicyResponse,
  GetPlatformTerminalLoginPolicyRequest,
  GetPlatformTerminalLoginPolicyResponse,
  UpdatePlatformTerminalLoginPolicyRequest,
  UpdatePlatformTerminalLoginPolicyResponse,
  GetTenantTerminalMfaPolicyRequest,
  GetTenantTerminalMfaPolicyResponse,
  UpdateTenantTerminalMfaPolicyRequest,
  UpdateTenantTerminalMfaPolicyResponse,
  HandleTerminalDeviceUnavailableRequest,
  HandleTerminalDeviceUnavailableResponse,
  UpdateTenantMfaPolicyRequest,
  UpdateTenantMfaPolicyResponse,
  VerifyPasswordRecoveryChallengeRequest,
  VerifyEmailBindingResponse,
  VerifyEmailBindingRequest,
  VerifyPhoneBindingResponse,
  VerifyPhoneBindingRequest,
  DisableUserTerminalPinRequest,
  ResetOwnTerminalPinRequest,
  ResetOwnTerminalPinResponse,
  SetOwnTerminalPinEnabledRequest,
  SetOwnTerminalPinEnabledResponse,
  SetOwnTerminalPinRequest,
  SetOwnTerminalPinResponse,
  DisableUserTerminalPinResponse,
  RequireTerminalPinResetResponse
} from '@oes/common/generated/auth_service'
import {
  AdminDeleteAccountSessionsCommand,
  AdminRevokeSessionCommand,
  ActivateTotpBindingCommand,
  ChangeOwnPasswordCommand,
  CompletePasswordRecoveryCommand,
  DisableMfaBindingCommand,
  DisableUserTerminalPinCommand,
  EnableMfaBindingCommand,
  HandleTerminalDeviceUnavailableCommand,
  InitializeRecoveryCodesCommand,
  InitializeTotpBindingCommand,
  LoginWithEmailPasswordCommand,
  LoginWithEmailOtpCommand,
  LoginWithEmployeeCodePinCommand,
  LoginWithPhoneOtpCommand,
  LoginWithPhonePasswordCommand,
  BootstrapUserLoginMethodsCommand,
  CompleteFirstLoginPasswordSetupCommand,
  CompleteStepUpMfaChallengeCommand,
  LogoutAllCommand,
  LogoutSessionCommand,
  LogoutOtherDevicesCommand,
  LogoutCommand,
  RefreshSessionCommand,
  RegenerateRecoveryCodesCommand,
  RevokeOtherTrustedDevicesCommand,
  RevokeTenantSessionsCommand,
  RevokeTrustedDeviceCommand,
  RequestPasswordRecoveryChallengeCommand,
  RequestLoginMfaFactorChallengeCommand,
  RequestEmailBindingChallengeCommand,
  RequestEmailOtpLoginChallengeCommand,
  RequestPhoneBindingChallengeCommand,
  RequestPhoneOtpLoginChallengeCommand,
  RequirePasswordSetupCommand,
  RequireTerminalPinResetCommand,
  ResetOwnTerminalPinCommand,
  SelectAccountCommand,
  SetLoginMethodEnabledCommand,
  SetOwnTerminalPinCommand,
  SetOwnTerminalPinEnabledCommand,
  StartStepUpMfaChallengeCommand,
  SubmitMfaChallengeCommand,
  UpdatePlatformMfaPolicyCommand,
  UpdateTenantMfaPolicyCommand,
  VerifyPasswordRecoveryChallengeCommand,
  VerifyEmailBindingCommand,
  VerifyPhoneBindingCommand
} from '../../application/commands/auth'
import {
  AdminListOnlineUsersQuery,
  AdminListTerminalDeviceSessionsQuery,
  AdminListUserSessionsQuery,
  ListLoginHistoryQuery,
  ListAuditEventsQuery,
  InspectPasswordRecoveryChannelsQuery,
  PreflightEmployeeCodePinLoginQuery,
  ListLoginMethodsQuery,
  ListMfaBindingsQuery,
  GetPlatformMfaPolicyQuery,
  GetTenantMfaPolicyQuery,
  ListSessionsQuery,
  ListTrustedDevicesQuery,
  ValidateAccessTokenQuery
} from '../../application/queries'
import { TerminalLoginFlow } from '@oes/common/auth'
import {
  AUTH_LOGIN_FLOW_RESULT_UNSUPPORTED,
  AUTH_MFA_TYPE_NOT_SUPPORTED
} from '../../common/constants/exception-enums'
import { LoginMethodEnum, MfaType } from '../../common/constants'
import { AccountInvitationService } from '../../application/services/account-invitation.service'
import { TerminalLoginPolicyService } from '../../application/services/terminal-login-policy.service'
import {
  TerminalMfaPolicyResolution,
  TerminalMfaPolicyService
} from '../../application/services/terminal-mfa-policy.service'
import { TerminalLoginPolicyEntity } from '../../domain/entities/terminal-login-policy.entity'
import {
  TerminalMfaPolicyEntity,
  MfaBindingType as DomainTerminalMfaBindingType
} from '../../domain/entities/terminal-mfa-policy.entity'
import { TenantMfaFactor } from '../../domain/entities/tenant-mfa-policy.entity'
import { AuthGrpcPresenter } from './auth-grpc.presenter'
import { getOptionalOperatorScope } from './grpc-request-context'

@Controller()
@UseFilters(GrpcExceptionFilter)
@UseGuards(AuthTrustedExecutionGuard)
@UseInterceptors(GrpcRequestContextInterceptor)
@AuthServiceControllerMethods()
export class AuthGrpcController implements AuthServiceController {
  constructor(
    private readonly commandBus: ValidatingCommandBus,
    private readonly queryBus: ValidatingQueryBus,
    private readonly terminalLoginPolicyService?: TerminalLoginPolicyService,
    private readonly terminalMfaPolicyService?: TerminalMfaPolicyService,
    private readonly accountInvitationService?: AccountInvitationService
  ) {}

  async bootstrapUserLoginMethods(
    request: BootstrapUserLoginMethodsRequest
  ): Promise<BootstrapUserLoginMethodsResponse> {
    this.getRequiredOperatorId(request)

    const result = await this.commandBus.execute(
      new BootstrapUserLoginMethodsCommand({
        userId: request.userId ?? '',
        email: request.email || undefined,
        phone: request.phone || undefined
      })
    )

    await this.accountInvitationService?.sendInvitation({
      accountId: request.accountId ?? '',
      displayName: request.displayName || undefined,
      email: request.email || undefined,
      phone: request.phone || undefined
    })

    return {
      emailBootstrapped: result.emailBootstrapped,
      phoneBootstrapped: result.phoneBootstrapped,
      passwordBootstrapped: result.passwordBootstrapped
    }
  }

  async bootstrapOwnLoginMethods(
    request: BootstrapOwnLoginMethodsRequest
  ): Promise<BootstrapOwnLoginMethodsResponse> {
    const operatorId = this.getRequiredOperatorId(request)
    const accountId = request.accountId?.trim()

    if (!accountId || accountId !== operatorId) {
      throw ExceptionFactory.application(ACCESS_DENIED, {
        accountId,
        operatorId
      })
    }

    const result = await this.commandBus.execute(
      new BootstrapUserLoginMethodsCommand({
        userId: request.userId ?? '',
        email: request.email || undefined,
        phone: request.phone || undefined
      })
    )

    return {
      emailBootstrapped: result.emailBootstrapped,
      phoneBootstrapped: result.phoneBootstrapped,
      passwordBootstrapped: result.passwordBootstrapped
    }
  }

  async completeFirstLoginPasswordSetup(
    request: CompleteFirstLoginPasswordSetupRequest
  ): Promise<CompleteFirstLoginPasswordSetupResponse> {
    this.getRequiredOperatorId(request)
    const userId = request.userId ?? ''
    return this.commandBus.execute(
      new CompleteFirstLoginPasswordSetupCommand({
        userId,
        newPassword: request.newPassword ?? ''
      })
    )
  }

  async requestPasswordRecoveryChallenge(
    request: RequestPasswordRecoveryChallengeRequest
  ): Promise<RequestPasswordRecoveryChallengeResponse> {
    const result = await this.commandBus.execute(
      new RequestPasswordRecoveryChallengeCommand({
        channel:
          request.channel === PasswordRecoveryChannel.PASSWORD_RECOVERY_CHANNEL_PHONE
            ? 'PHONE'
            : 'EMAIL',
        identifier: request.identifier ?? ''
      })
    )

    return {
      accepted: result.accepted,
      challengeId: result.challengeId,
      expiresAt: result.expiresAt.toISOString(),
      maskedDestination: result.maskedDestination
    }
  }

  async inspectPasswordRecoveryChannels(
    request: InspectPasswordRecoveryChannelsRequest
  ): Promise<InspectPasswordRecoveryChannelsResponse> {
    const result = await this.queryBus.execute(
      new InspectPasswordRecoveryChannelsQuery(request.identifier ?? '')
    )

    return {
      channels: result.channels.map((channel) => ({
        channel:
          channel.channel === 'PHONE'
            ? PasswordRecoveryChannel.PASSWORD_RECOVERY_CHANNEL_PHONE
            : PasswordRecoveryChannel.PASSWORD_RECOVERY_CHANNEL_EMAIL,
        maskedDestination: channel.maskedDestination
      })),
      defaultChannel:
        result.defaultChannel === 'PHONE'
          ? PasswordRecoveryChannel.PASSWORD_RECOVERY_CHANNEL_PHONE
          : result.defaultChannel === 'EMAIL'
            ? PasswordRecoveryChannel.PASSWORD_RECOVERY_CHANNEL_EMAIL
            : PasswordRecoveryChannel.PASSWORD_RECOVERY_CHANNEL_UNSPECIFIED
    }
  }

  async verifyPasswordRecoveryChallenge(
    request: VerifyPasswordRecoveryChallengeRequest
  ): Promise<VerifyPasswordRecoveryChallengeResponse> {
    const result = await this.commandBus.execute(
      new VerifyPasswordRecoveryChallengeCommand({
        challengeId: request.challengeId ?? '',
        otp: request.otp ?? ''
      })
    )

    return {
      verified: result.verified,
      resetToken: result.resetToken
    }
  }

  async completePasswordRecovery(
    request: CompletePasswordRecoveryRequest
  ): Promise<CompletePasswordRecoveryResponse> {
    const result = await this.commandBus.execute(
      new CompletePasswordRecoveryCommand({
        resetToken: request.resetToken ?? '',
        newPassword: request.newPassword ?? ''
      })
    )

    return {
      success: result.success,
      sessionsRevoked: result.sessionsRevoked
    }
  }

  async listAuditEvents(request: ListAuditEventsRequest): Promise<ListAuditEventsResponse> {
    this.getRequiredOperatorId(request)

    const result = await this.queryBus.execute(
      new ListAuditEventsQuery({
        service: request.service || undefined,
        module: request.module || undefined,
        eventType: request.eventType || undefined,
        result: request.result || undefined,
        operatorId: undefined,
        tenantId: undefined,
        orgId: undefined,
        resourceType: request.resourceType || undefined,
        resourceId: request.resourceId || undefined,
        occurredAtFrom: request.occurredAtFrom || undefined,
        occurredAtTo: request.occurredAtTo || undefined,
        cursor: request.cursor || undefined,
        pageSize: request.pageSize || undefined,
        operatorScope: getOptionalOperatorScope(request)
      })
    )

    return {
      items: result.items.map(
        (event): AuditEventRecord => AuthGrpcPresenter.toAuditEventRecord(event)
      ),
      nextCursor: result.nextCursor ?? ''
    }
  }

  /**
   * listLoginHistory exposes self-service login-attempt history for one authenticated user id.
   */
  async listLoginHistory(request: ListLoginHistoryRequest): Promise<ListLoginHistoryResponse> {
    const result = await this.queryBus.execute(
      new ListLoginHistoryQuery({
        userId: request.userId ?? '',
        result: (request.result || undefined) as 'FAILED' | 'SUCCESS' | undefined,
        occurredAtFrom: request.occurredAtFrom || undefined,
        occurredAtTo: request.occurredAtTo || undefined,
        cursor: request.cursor || undefined,
        pageSize: request.pageSize || undefined
      })
    )

    return {
      items: result.items.map((item) => ({
        occurredAt: item.occurredAt.toISOString(),
        outcome: item.outcome,
        loginMethod: item.loginMethod ?? '',
        terminal: item.terminal ?? '',
        loginFlow: item.loginFlow ?? '',
        ipAddress: item.ipAddress ?? '',
        deviceName: item.deviceName ?? '',
        platform: item.platform ?? '',
        browser: item.browser ?? '',
        failureReason: item.failureReason ?? '',
        traceId: item.traceId ?? ''
      })),
      nextCursor: result.nextCursor ?? ''
    }
  }

  /**
   * listLoginMethods exposes safe login-method status for self-service and admin account security pages.
   */
  async listLoginMethods(request: ListLoginMethodsRequest): Promise<ListLoginMethodsResponse> {
    const result = await this.queryBus.execute(new ListLoginMethodsQuery(request.userId ?? ''))

    return {
      loginMethods: result.loginMethods,
      passwordSetupRequired: result.passwordSetupRequired
    }
  }

  /**
   * changeOwnPassword updates the user's password after the application handler verifies the current password.
   */
  async changeOwnPassword(request: ChangeOwnPasswordRequest): Promise<ChangeOwnPasswordResponse> {
    return this.commandBus.execute(
      new ChangeOwnPasswordCommand({
        userId: request.userId ?? '',
        accountId: request.accountId || undefined,
        tenantId: getOptionalOperatorScope(request)?.tenantId,
        scopeLevel: this.normalizeScopeLevel(request.scopeLevel),
        currentPassword: request.currentPassword ?? '',
        newPassword: request.newPassword ?? '',
        mfaGrantToken: request.mfaGrantToken || undefined
      })
    )
  }

  /**
   * setOwnTerminalPin sets the authenticated user's terminal PIN without returning credential material.
   */
  async setOwnTerminalPin(
    request: SetOwnTerminalPinRequest
  ): Promise<SetOwnTerminalPinResponse> {
    return this.commandBus.execute(
      new SetOwnTerminalPinCommand({
        userId: request.userId ?? '',
        currentPassword: request.currentPassword || undefined,
        newPin: request.newPin ?? '',
        mfaGrantToken: request.mfaGrantToken || undefined
      })
    )
  }

  /**
   * resetOwnTerminalPin replaces the authenticated user's forgotten terminal PIN from account security.
   */
  async resetOwnTerminalPin(
    request: ResetOwnTerminalPinRequest
  ): Promise<ResetOwnTerminalPinResponse> {
    return this.commandBus.execute(
      new ResetOwnTerminalPinCommand({
        userId: request.userId ?? '',
        currentPassword: request.currentPassword || undefined,
        newPin: request.newPin ?? '',
        mfaGrantToken: request.mfaGrantToken || undefined
      })
    )
  }

  /**
   * setOwnTerminalPinEnabled toggles the authenticated user's terminal PIN login method.
   */
  async setOwnTerminalPinEnabled(
    request: SetOwnTerminalPinEnabledRequest
  ): Promise<SetOwnTerminalPinEnabledResponse> {
    return this.commandBus.execute(
      new SetOwnTerminalPinEnabledCommand(request.userId ?? '', Boolean(request.enabled))
    )
  }

  /**
   * setOwnLoginMethodEnabled toggles one authenticated user's own login method through the self-service path.
   */
  async setOwnLoginMethodEnabled(
    request: SetOwnLoginMethodEnabledRequest
  ): Promise<SetOwnLoginMethodEnabledResponse> {
    const operatorId = this.getRequiredOperatorId(request)

    return this.commandBus.execute(
      new SetLoginMethodEnabledCommand({
        userId: request.userId ?? '',
        methodId: request.methodId ?? '',
        enabled: Boolean(request.enabled),
        operatorId,
        reason: request.reason || undefined
      })
    )
  }

  /**
   * requirePasswordSetup marks one target user as needing to set a new password without accepting plaintext.
   */
  async requirePasswordSetup(
    request: RequirePasswordSetupRequest
  ): Promise<RequirePasswordSetupResponse> {
    const requiredBy = this.getRequiredOperatorId(request)

    return this.commandBus.execute(
      new RequirePasswordSetupCommand({
        userId: request.userId ?? '',
        requiredBy,
        reason: request.reason ?? '',
        revokeSessions: request.revokeSessions ?? false
      })
    )
  }

  /**
   * requireTerminalPinReset marks a target user as needing to reset their own terminal PIN.
   */
  async requireTerminalPinReset(
    request: RequireTerminalPinResetRequest
  ): Promise<RequireTerminalPinResetResponse> {
    const requiredBy = this.getRequiredOperatorId(request)

    return this.commandBus.execute(
      new RequireTerminalPinResetCommand(requiredBy, request.userId ?? '')
    )
  }

  /**
   * disableUserTerminalPin disables a target user's terminal PIN login method without plaintext access.
   */
  async disableUserTerminalPin(
    request: DisableUserTerminalPinRequest
  ): Promise<DisableUserTerminalPinResponse> {
    const disabledBy = this.getRequiredOperatorId(request)

    return this.commandBus.execute(
      new DisableUserTerminalPinCommand(disabledBy, request.userId ?? '')
    )
  }

  /**
   * setLoginMethodEnabled toggles a target login method under admin security management.
   */
  async setLoginMethodEnabled(
    request: SetLoginMethodEnabledRequest
  ): Promise<SetLoginMethodEnabledResponse> {
    const operatorId = this.getRequiredOperatorId(request)

    return this.commandBus.execute(
      new SetLoginMethodEnabledCommand({
        userId: request.userId ?? '',
        methodId: request.methodId ?? '',
        enabled: Boolean(request.enabled),
        operatorId,
        reason: request.reason || undefined
      })
    )
  }

  async adminListOnlineUsers(
    request: AdminListOnlineUsersRequest
  ): Promise<AdminListOnlineUsersResponse> {
    this.getRequiredOperatorId(request)
    const result = await this.queryBus.execute(
      new AdminListOnlineUsersQuery(
        {
          tenantId: request.tenantId || undefined
        },
        getOptionalOperatorScope(request)
      )
    )

    return {
      items: result.items.map((item) => ({
        userId: item.userId,
        tenantId: item.tenantId,
        activeSessionCount: String(item.activeSessionCount),
        lastActiveAt: item.lastActiveAt.toISOString()
      })),
      nextCursor: result.nextCursor ?? ''
    }
  }

  async adminListUserSessions(
    request: AdminListUserSessionsRequest
  ): Promise<AdminListUserSessionsResponse> {
    this.getRequiredOperatorId(request)
    const sessions = await this.queryBus.execute(
      new AdminListUserSessionsQuery(request.userId ?? '', getOptionalOperatorScope(request))
    )

    return {
      sessions: sessions.map((session) => this.toProtoAdminSessionView(session))
    }
  }

  async adminListTerminalDeviceSessions(
    request: AdminListTerminalDeviceSessionsRequest
  ): Promise<AdminListTerminalDeviceSessionsResponse> {
    this.getRequiredOperatorId(request)
    const sessions = await this.queryBus.execute(
      new AdminListTerminalDeviceSessionsQuery(
        request.terminalDeviceId ?? '',
        getOptionalOperatorScope(request),
        request.terminal ?? ''
      )
    )

    return {
      sessions: sessions.map((session) => this.toProtoAdminSessionView(session))
    }
  }

  async listSessions(request: ListSessionsRequest): Promise<ListSessionsResponse> {
    const sessions = await this.queryBus.execute(
      new ListSessionsQuery(request.userId ?? '', request.currentSessionId ?? undefined, undefined)
    )

    return {
      sessions: sessions.map((session) => ({
        sessionId: session.sessionId,
        userId: session.userId,
        accountId: session.accountId,
        tenantId: session.tenantId,
        terminal: session.terminal,
        terminalDeviceId: session.terminalDeviceId,
        deviceBoundTenantId: session.deviceBoundTenantId,
        loginFlow: session.loginFlow,
        status: session.status,
        loginMethod: session.loginMethod,
        deviceId: session.deviceId,
        deviceName: session.deviceName,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        platform: session.platform,
        browser: session.browser,
        createdAt: session.createdAt.toISOString(),
        lastActiveAt: session.lastActiveAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
        refreshExpiresAt: session.refreshExpiresAt.toISOString(),
        accessRemainingSeconds: String(session.accessRemainingSeconds),
        refreshRemainingSeconds: String(session.refreshRemainingSeconds),
        sessionAgeSeconds: String(session.sessionAgeSeconds),
        idleSeconds: String(session.idleSeconds),
        isAccessExpired: session.isAccessExpired,
        isRefreshExpired: session.isRefreshExpired,
        isRevoked: session.isRevoked,
        isCurrent: session.isCurrent,
        isAdminControlled: session.isAdminControlled
      }))
    }
  }

  async listTrustedDevices(
    request: ListTrustedDevicesRequest
  ): Promise<ListTrustedDevicesResponse> {
    const devices = await this.queryBus.execute(
      new ListTrustedDevicesQuery(
        request.userId ?? '',
        getOptionalOperatorScope(request)?.tenantId,
        this.normalizeScopeLevel(request.scopeLevel)
      )
    )
    const currentDeviceId = request.currentDeviceId ?? ''

    return {
      devices: devices.map(
        (device): TrustedDeviceView => ({
          id: device.id,
          deviceId: device.deviceId,
          deviceName: device.deviceName ?? '',
          browser: device.browser ?? '',
          platform: device.platform ?? '',
          trustedAt: device.trustedAt.toISOString(),
          lastActiveAt: device.lastSeenAt.toISOString(),
          expiresAt: device.expiresAt.toISOString(),
          isCurrentDevice: Boolean(currentDeviceId) && device.deviceId === currentDeviceId
        })
      )
    }
  }

  async revokeTrustedDevice(
    request: RevokeTrustedDeviceRequest
  ): Promise<RevokeTrustedDeviceResponse> {
    const result = await this.commandBus.execute(
      new RevokeTrustedDeviceCommand(
        request.userId ?? '',
        getOptionalOperatorScope(request)?.tenantId,
        this.normalizeScopeLevel(request.scopeLevel),
        request.trustedDeviceId ?? ''
      )
    )

    return {
      success: result.success,
      deviceCount: String(result.deviceCount)
    }
  }

  async revokeOtherTrustedDevices(
    request: RevokeOtherTrustedDevicesRequest
  ): Promise<RevokeOtherTrustedDevicesResponse> {
    const result = await this.commandBus.execute(
      new RevokeOtherTrustedDevicesCommand(
        request.userId ?? '',
        getOptionalOperatorScope(request)?.tenantId,
        this.normalizeScopeLevel(request.scopeLevel),
        request.currentDeviceId ?? undefined
      )
    )

    return {
      success: result.success,
      deviceCount: String(result.deviceCount)
    }
  }

  async adminRevokeSession(
    request: AdminRevokeSessionRequest
  ): Promise<AdminRevokeSessionResponse> {
    const operatorId = this.getRequiredOperatorId(request)
    const result = await this.commandBus.execute(
      new AdminRevokeSessionCommand(
        operatorId,
        request.sessionId ?? '',
        request.reason ?? '',
        getOptionalOperatorScope(request)
      )
    )

    return {
      success: result.success,
      sessionId: result.sessionId
    }
  }

  async adminDeleteAccountSessions(
    request: AdminDeleteAccountSessionsRequest
  ): Promise<AdminDeleteAccountSessionsResponse> {
    const operatorId = this.getRequiredOperatorId(request)
    const result = await this.commandBus.execute(
      new AdminDeleteAccountSessionsCommand(
        operatorId,
        request.userId ?? '',
        request.accountId ?? '',
        request.reason ?? 'ACCOUNT_DISABLED',
        getOptionalOperatorScope(request)
      )
    )

    return {
      success: result.success,
      deletedSessionCount: result.deletedSessionCount
    }
  }

  async revokeTenantSessions(
    request: RevokeTenantSessionsRequest
  ): Promise<RevokeTenantSessionsResponse> {
    const result = await this.commandBus.execute(
      new RevokeTenantSessionsCommand(request.tenantId ?? '', request.reason || undefined)
    )

    return {
      success: result.success,
      revokedSessionCount: result.revokedSessionCount
    }
  }

  async logout(request: LogoutRequest): Promise<LogoutResponse> {
    const result = await this.commandBus.execute(new LogoutCommand(request.sessionId ?? ''))

    return {
      success: result.success
    }
  }

  @GrpcMethod('AuthService', 'LogoutSession')
  async logoutSession(request: LogoutSessionRequest): Promise<LogoutSessionResponse> {
    const result = await this.commandBus.execute(
      new LogoutSessionCommand(
        request.userId ?? '',
        request.currentSessionId ?? '',
        request.targetSessionId ?? ''
      )
    )

    return {
      success: result.success
    }
  }

  async logoutOtherDevices(
    request: LogoutOtherDevicesRequest
  ): Promise<LogoutOtherDevicesResponse> {
    const result = await this.commandBus.execute(
      new LogoutOtherDevicesCommand(request.userId ?? '', request.currentSessionId ?? '', undefined)
    )

    return {
      success: result.success,
      sessionCount: String(result.sessionCount)
    }
  }

  async logoutAll(request: LogoutAllRequest): Promise<LogoutAllResponse> {
    const result = await this.commandBus.execute(
      new LogoutAllCommand(request.userId ?? '', request.currentSessionId ?? undefined, undefined)
    )

    return {
      success: result.success,
      sessionCount: String(result.sessionCount)
    }
  }

  async listMfaBindings(request: ListMfaBindingsRequest): Promise<ListMfaBindingsResponse> {
    const bindings = await this.queryBus.execute(new ListMfaBindingsQuery(request.userId ?? ''))

    return {
      bindings: bindings.map((binding) => ({
        bindingId: binding.bindingId,
        type: this.toProtoMfaBindingType(binding.type),
        enabled: binding.enabled,
        available: binding.available,
        destination: binding.destination,
        updatedAt: binding.updatedAt?.toISOString() ?? ''
      }))
    }
  }

  async enableMfaBinding(request: EnableMfaBindingRequest): Promise<EnableMfaBindingResponse> {
    const binding = await this.commandBus.execute(
      new EnableMfaBindingCommand(request.userId ?? '', this.toDomainMfaType(request.type))
    )

    return {
      success: true,
      binding: {
        bindingId: binding.bindingId,
        type: this.toProtoMfaBindingType(binding.type),
        enabled: binding.enabled,
        available: binding.available,
        destination: binding.destination,
        updatedAt: binding.updatedAt?.toISOString() ?? ''
      }
    }
  }

  async disableMfaBinding(request: DisableMfaBindingRequest): Promise<DisableMfaBindingResponse> {
    const binding = await this.commandBus.execute(
      new DisableMfaBindingCommand(request.userId ?? '', this.toDomainMfaType(request.type))
    )

    return {
      success: true,
      binding: {
        bindingId: binding.bindingId,
        type: this.toProtoMfaBindingType(binding.type),
        enabled: binding.enabled,
        available: binding.available,
        destination: binding.destination,
        updatedAt: binding.updatedAt?.toISOString() ?? ''
      }
    }
  }

  async initializeTotpBinding(
    request: InitializeTotpBindingRequest
  ): Promise<InitializeTotpBindingResponse> {
    const result = await this.commandBus.execute(
      new InitializeTotpBindingCommand(request.userId ?? '')
    )

    return {
      binding: {
        bindingId: result.binding.bindingId,
        type: this.toProtoMfaBindingType(result.binding.type),
        enabled: result.binding.enabled,
        available: result.binding.available,
        destination: result.binding.destination,
        updatedAt: result.binding.updatedAt?.toISOString() ?? ''
      },
      secret: result.secret,
      qrCodeUrl: result.qrCodeUrl
    }
  }

  async activateTotpBinding(
    request: ActivateTotpBindingRequest
  ): Promise<ActivateTotpBindingResponse> {
    const binding = await this.commandBus.execute(
      new ActivateTotpBindingCommand(
        request.userId ?? '',
        request.bindingId ?? '',
        request.code ?? ''
      )
    )

    return {
      success: true,
      binding: {
        bindingId: binding.bindingId,
        type: this.toProtoMfaBindingType(binding.type),
        enabled: binding.enabled,
        available: binding.available,
        destination: binding.destination,
        updatedAt: binding.updatedAt?.toISOString() ?? ''
      }
    }
  }

  async initializeRecoveryCodes(
    request: InitializeRecoveryCodesRequest
  ): Promise<InitializeRecoveryCodesResponse> {
    const result = await this.commandBus.execute(
      new InitializeRecoveryCodesCommand(request.userId ?? '')
    )

    return {
      binding: {
        bindingId: result.binding.bindingId,
        type: this.toProtoMfaBindingType(result.binding.type),
        enabled: result.binding.enabled,
        available: result.binding.available,
        destination: result.binding.destination,
        updatedAt: result.binding.updatedAt?.toISOString() ?? ''
      },
      recoveryCodes: result.recoveryCodes
    }
  }

  async regenerateRecoveryCodes(
    request: RegenerateRecoveryCodesRequest
  ): Promise<RegenerateRecoveryCodesResponse> {
    const result = await this.commandBus.execute(
      new RegenerateRecoveryCodesCommand(request.userId ?? '')
    )

    return {
      binding: {
        bindingId: result.binding.bindingId,
        type: this.toProtoMfaBindingType(result.binding.type),
        enabled: result.binding.enabled,
        available: result.binding.available,
        destination: result.binding.destination,
        updatedAt: result.binding.updatedAt?.toISOString() ?? ''
      },
      recoveryCodes: result.recoveryCodes
    }
  }

  async requestLoginMfaFactorChallenge(
    request: RequestLoginMfaFactorChallengeRequest
  ): Promise<RequestLoginMfaFactorChallengeResponse> {
    const result = await this.commandBus.execute(
      new RequestLoginMfaFactorChallengeCommand(
        request.challengeId ?? '',
        this.toDomainMfaType(request.factor)
      )
    )

    return {
      challengeId: result.factorChallengeId ?? '',
      destination: result.destination ?? '',
      expiresAt: result.expiresAt ?? ''
    }
  }

  async submitMfaChallenge(
    request: SubmitMfaChallengeRequest
  ): Promise<SubmitMfaChallengeResponse> {
    const result = await this.commandBus.execute(
      new SubmitMfaChallengeCommand(
        request.challengeId ?? '',
        this.toDomainMfaType(request.factor),
        request.code ?? '',
        (request.loginMethod as any) ?? '',
        request.factorChallengeId ?? undefined,
        request.trustCurrentDevice === true
      )
    )

    return {
      status: LoginStatus.LOGIN_STATUS_SUCCESS,
      userId: result.userId,
      challengeId: '',
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: String(result.expiresIn),
      terminal: result.terminal,
      allowedTerminals: result.allowedTerminals,
      loginMethod: result.loginMethod,
      accounts: [],
      passwordSetupRequired: result.passwordSetupRequired,
      terminalDeviceId: result.terminalDeviceId ?? '',
      deviceBoundTenantId: result.deviceBoundTenantId ?? '',
      loginFlow: result.loginFlow ?? ''
    }
  }

  async startStepUpMfaChallenge(
    request: StartStepUpMfaChallengeRequest
  ): Promise<StartStepUpMfaChallengeResponse> {
    const result = await this.commandBus.execute(
      new StartStepUpMfaChallengeCommand(
        request.userId ?? '',
        request.accountId ?? '',
        getOptionalOperatorScope(request)?.tenantId,
        this.normalizeScopeLevel(request.scopeLevel),
        this.toDomainProtectedMfaScenario(request.scenario)
      )
    )

    return {
      required: Boolean(result.required),
      challengeId: result.challengeId ?? '',
      scenario: result.scenario
        ? this.toProtoMfaScenario(result.scenario)
        : MfaScenario.MFA_SCENARIO_UNSPECIFIED,
      defaultMfaFactor: result.defaultFactor
        ? this.toProtoMfaBindingType(result.defaultFactor)
        : MfaBindingType.MFA_BINDING_TYPE_UNSPECIFIED,
      availableFactors: (result.availableFactors ?? []).map((factor) => ({
        type: this.toProtoMfaBindingType(factor.type),
        label: factor.label,
        priority: factor.priority
      })),
      factorChallengeId: result.factorChallengeId ?? '',
      challengeDestination: result.destination ?? '',
      challengeExpiresAt: result.expiresAt ?? ''
    }
  }

  async completeStepUpMfaChallenge(
    request: CompleteStepUpMfaChallengeRequest
  ): Promise<CompleteStepUpMfaChallengeResponse> {
    const result = await this.commandBus.execute(
      new CompleteStepUpMfaChallengeCommand(
        request.challengeId ?? '',
        this.toDomainMfaType(request.factor),
        request.code ?? '',
        request.factorChallengeId ?? undefined
      )
    )

    return {
      success: Boolean(result.success),
      scenario: this.toProtoMfaScenario(result.scenario),
      mfaGrantToken: result.mfaGrantToken,
      expiresAt: result.expiresAt ?? ''
    }
  }

  async refreshSession(request: RefreshSessionRequest): Promise<RefreshSessionResponse> {
    const result = await this.commandBus.execute(
      new RefreshSessionCommand(request.refreshToken ?? '')
    )

    return {
      sessionId: result.sessionId,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: String(result.expiresIn),
      terminal: result.terminal,
      allowedTerminals: result.allowedTerminals
    }
  }

  @GrpcMethod('AuthService', 'ValidateAccessToken')
  async validateAccessToken(
    request: ValidateAccessTokenRequest
  ): Promise<ValidateAccessTokenResponse> {
    const result = await this.queryBus.execute(
      new ValidateAccessTokenQuery(request.accessToken ?? '')
    )

    return {
      userId: result.userId,
      accountId: result.accountId,
      tenantId: result.tenantId ?? '',
      sessionId: result.sessionId,
      scopeLevel: result.scopeLevel,
      terminal: result.terminal,
      allowedTerminals: result.allowedTerminals,
      passwordSetupRequired: result.passwordSetupRequired,
      roleIds: result.roleIds,
      displayName: result.displayName ?? '',
      terminalDeviceId: result.terminalDeviceId ?? '',
      deviceBoundTenantId: result.deviceBoundTenantId ?? '',
      loginFlow: result.loginFlow ?? ''
    } as ValidateAccessTokenResponse
  }

  async selectAccount(request: SelectAccountRequest): Promise<SelectAccountResponse> {
    const result = await this.commandBus.execute(
      new SelectAccountCommand(
        request.userId ?? '',
        request.accountId ?? '',
        (request.loginMethod as any) ?? '',
        {
          currentSessionId: request.currentSessionId ?? '',
          deviceId: request.deviceId ?? '',
          deviceName: request.deviceName ?? '',
          userAgent: request.userAgent ?? '',
          ipAddress: request.ipAddress ?? '',
          terminal: request.terminal ?? 'WEB',
          terminalDeviceId: request.terminalDeviceId || undefined,
          deviceBoundTenantId: request.deviceBoundTenantId || undefined,
          loginFlow: request.loginFlow || undefined
        }
      )
    )

    if (result.status === 'MFA_REQUIRED') {
      return {
        status: LoginStatus.LOGIN_STATUS_MFA_REQUIRED,
        userId: result.userId,
        accountId: result.accountId,
        tenantId: result.tenantId ?? '',
        displayName: result.displayName ?? '',
        sessionId: '',
        accessToken: '',
        refreshToken: '',
        expiresIn: '0',
        nextStep: '',
        scopeLevel: result.scopeLevel,
        passwordSetupRequired: false,
        challengeId: result.challengeId,
        mfaScenario: this.toProtoMfaScenario(result.scenario),
        defaultMfaFactor: this.toProtoMfaBindingType(result.defaultFactor),
        availableFactors: result.availableFactors.map((factor) => ({
          type: this.toProtoMfaBindingType(factor.type),
          label: factor.label,
          priority: factor.priority
        })),
        factorChallengeId: result.factorChallengeId ?? '',
        challengeDestination: result.destination ?? '',
        challengeExpiresAt: result.expiresAt ?? '',
        terminal: result.terminal,
        allowedTerminals: result.allowedTerminals,
        terminalDeviceId: request.terminalDeviceId ?? '',
        deviceBoundTenantId: request.deviceBoundTenantId ?? '',
        loginFlow: request.loginFlow ?? ''
      }
    }

    return {
      status: LoginStatus.LOGIN_STATUS_SUCCESS,
      userId: result.userId,
      accountId: result.accountId,
      tenantId: result.tenantId ?? '',
      sessionId: result.sessionId,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: String(result.expiresIn),
      displayName: result.displayName ?? '',
      nextStep: '',
      scopeLevel: result.scopeLevel,
      passwordSetupRequired: result.passwordSetupRequired,
      challengeId: '',
      mfaScenario: MfaScenario.MFA_SCENARIO_UNSPECIFIED,
      defaultMfaFactor: MfaBindingType.MFA_BINDING_TYPE_UNSPECIFIED,
      availableFactors: [],
      factorChallengeId: '',
      challengeDestination: '',
      challengeExpiresAt: '',
      terminal: result.terminal,
      allowedTerminals: result.allowedTerminals,
      terminalDeviceId: request.terminalDeviceId ?? '',
      deviceBoundTenantId: request.deviceBoundTenantId ?? '',
      loginFlow: request.loginFlow ?? ''
    }
  }

  async getTenantMfaPolicy(
    request: GetTenantMfaPolicyRequest
  ): Promise<GetTenantMfaPolicyResponse> {
    this.getRequiredOperatorId(request)
    const result = await this.queryBus.execute(new GetTenantMfaPolicyQuery(request.tenantId ?? ''))

    return {
      tenantId: result.tenantId,
      loginRequired: result.loginRequired,
      scenarioRequirements: this.toProtoScenarioRequirements(result.scenarioRequirements),
      factors: result.factors.map(
        (factor): TenantMfaFactorPolicy => ({
          factor: this.toProtoMfaBindingType(factor.factor),
          enabled: factor.enabled,
          priority: factor.priority
        })
      )
    }
  }

  async getPlatformMfaPolicy(
    request: GetPlatformMfaPolicyRequest
  ): Promise<GetPlatformMfaPolicyResponse> {
    this.getRequiredOperatorId(request)
    const result = await this.queryBus.execute(new GetPlatformMfaPolicyQuery())

    return {
      loginRequired: result.loginRequired,
      scenarioRequirements: this.toProtoScenarioRequirements(result.scenarioRequirements),
      factors: result.factors.map(
        (factor): TenantMfaFactorPolicy => ({
          factor: this.toProtoMfaBindingType(factor.factor),
          enabled: factor.enabled,
          priority: factor.priority
        })
      )
    }
  }

  async updateTenantMfaPolicy(
    request: UpdateTenantMfaPolicyRequest
  ): Promise<UpdateTenantMfaPolicyResponse> {
    const operatorId = this.getRequiredOperatorId(request)
    const result = await this.commandBus.execute(
      new UpdateTenantMfaPolicyCommand({
        tenantId: request.tenantId ?? '',
        loginRequired: Boolean(request.loginRequired),
        scenarioRequirements: this.toDomainScenarioRequirements(
          request.scenarioRequirements,
          Boolean(request.loginRequired)
        ),
        factors: (request.factors ?? []).map((factor) => ({
          factor: this.toDomainMfaType(factor.factor),
          enabled: Boolean(factor.enabled),
          priority: Number(factor.priority ?? 0)
        })),
        updatedBy: operatorId
      })
    )

    return {
      tenantId: result.tenantId,
      loginRequired: result.loginRequired,
      scenarioRequirements: this.toProtoScenarioRequirements(result.scenarioRequirements),
      factors: result.factors.map(
        (factor): TenantMfaFactorPolicy => ({
          factor: this.toProtoMfaBindingType(factor.factor),
          enabled: factor.enabled,
          priority: factor.priority
        })
      )
    }
  }

  async updatePlatformMfaPolicy(
    request: UpdatePlatformMfaPolicyRequest
  ): Promise<UpdatePlatformMfaPolicyResponse> {
    const operatorId = this.getRequiredOperatorId(request)
    const result = await this.commandBus.execute(
      new UpdatePlatformMfaPolicyCommand({
        loginRequired: Boolean(request.loginRequired),
        scenarioRequirements: this.toDomainScenarioRequirements(
          request.scenarioRequirements,
          Boolean(request.loginRequired)
        ),
        factors: (request.factors ?? []).map((factor) => ({
          factor: this.toDomainMfaType(factor.factor),
          enabled: Boolean(factor.enabled),
          priority: Number(factor.priority ?? 0)
        })),
        updatedBy: operatorId
      })
    )

    return {
      loginRequired: result.loginRequired,
      scenarioRequirements: this.toProtoScenarioRequirements(result.scenarioRequirements),
      factors: result.factors.map(
        (factor): TenantMfaFactorPolicy => ({
          factor: this.toProtoMfaBindingType(factor.factor),
          enabled: factor.enabled,
          priority: factor.priority
        })
      )
    }
  }

  async getPlatformTerminalLoginPolicy(
    request: GetPlatformTerminalLoginPolicyRequest
  ): Promise<GetPlatformTerminalLoginPolicyResponse> {
    this.getRequiredOperatorId(request)
    const policies = await this.requireTerminalLoginPolicyService().getPlatformPolicy()

    return {
      entries: policies.map((policy) => this.toProtoTerminalLoginPolicyEntry(policy))
    }
  }

  async updatePlatformTerminalLoginPolicy(
    request: UpdatePlatformTerminalLoginPolicyRequest
  ): Promise<UpdatePlatformTerminalLoginPolicyResponse> {
    const operatorId = this.getRequiredOperatorId(request)
    const service = this.requireTerminalLoginPolicyService()

    for (const entry of request.entries ?? []) {
      await service.updatePlatformPolicy({
        terminal: entry.terminal ?? '',
        enabledLoginFlows: entry.enabledLoginFlows ?? [],
        supportedLoginFlows: this.supportedTerminalLoginFlows(entry.terminal ?? ''),
        updatedBy: operatorId
      })
    }

    const policies = await service.getPlatformPolicy()
    return {
      entries: policies.map((policy) => this.toProtoTerminalLoginPolicyEntry(policy))
    }
  }

  async getPlatformDefaultTerminalMfaPolicy(
    request: GetPlatformDefaultTerminalMfaPolicyRequest
  ): Promise<GetPlatformDefaultTerminalMfaPolicyResponse> {
    this.getRequiredOperatorId(request)
    const policies = await this.requireTerminalMfaPolicyService().getPlatformDefaults()

    return {
      entries: policies.map((policy) => this.toProtoTerminalMfaPolicyEntry(policy, 'PLATFORM_DEFAULT'))
    }
  }

  async updatePlatformDefaultTerminalMfaPolicy(
    request: UpdatePlatformDefaultTerminalMfaPolicyRequest
  ): Promise<UpdatePlatformDefaultTerminalMfaPolicyResponse> {
    const operatorId = this.getRequiredOperatorId(request)
    const service = this.requireTerminalMfaPolicyService()

    for (const entry of request.entries ?? []) {
      await service.updatePlatformDefault({
        terminal: entry.terminal ?? '',
        loginMfaRequired: Boolean(entry.loginMfaRequired),
        newDeviceMfaRequired: Boolean(entry.newDeviceMfaRequired),
        allowedFactors: this.toDomainTerminalMfaFactors(entry.allowedFactors),
        factorPriority: this.toDomainTerminalMfaFactors(entry.factorPriority),
        updatedBy: operatorId
      })
    }

    const policies = await service.getPlatformDefaults()
    return {
      entries: policies.map((policy) => this.toProtoTerminalMfaPolicyEntry(policy, 'PLATFORM_DEFAULT'))
    }
  }

  async getTenantTerminalMfaPolicy(
    request: GetTenantTerminalMfaPolicyRequest
  ): Promise<GetTenantTerminalMfaPolicyResponse> {
    this.getRequiredOperatorId(request)
    const tenantId = request.tenantId ?? ''
    const policies = await this.requireTerminalMfaPolicyService().getTenantPolicy(tenantId)

    return {
      tenantId,
      entries: policies.map((policy) => this.toProtoTerminalMfaPolicyResolution(policy))
    }
  }

  async updateTenantTerminalMfaPolicy(
    request: UpdateTenantTerminalMfaPolicyRequest
  ): Promise<UpdateTenantTerminalMfaPolicyResponse> {
    const operatorId = this.getRequiredOperatorId(request)
    const tenantId = request.tenantId ?? ''
    const service = this.requireTerminalMfaPolicyService()

    for (const entry of request.entries ?? []) {
      await service.updateTenantPolicy({
        tenantId,
        terminal: entry.terminal ?? '',
        loginMfaRequired: Boolean(entry.loginMfaRequired),
        newDeviceMfaRequired: Boolean(entry.newDeviceMfaRequired),
        allowedFactors: this.toDomainTerminalMfaFactors(entry.allowedFactors),
        factorPriority: this.toDomainTerminalMfaFactors(entry.factorPriority),
        updatedBy: operatorId
      })
    }

    const policies = await service.getTenantPolicy(tenantId)
    return {
      tenantId,
      entries: policies.map((policy) => this.toProtoTerminalMfaPolicyResolution(policy))
    }
  }

  async handleTerminalDeviceUnavailable(
    request: HandleTerminalDeviceUnavailableRequest
  ): Promise<HandleTerminalDeviceUnavailableResponse> {
    const result = await this.commandBus.execute(
      new HandleTerminalDeviceUnavailableCommand({
        tenantId: request.deviceBoundTenantId ?? '',
        terminalDeviceId: request.terminalDeviceId ?? '',
        previousStatus: '',
        newStatus: request.reasonCode || 'UNAVAILABLE',
        reason: request.reasonCode || undefined
      })
    )

    return {
      handled: true,
      action: 'SESSIONS_REVOKED',
      message: `Revoked ${result.revokedCount ?? 0} session(s) for terminal device`
    }
  }

  async loginWithEmailPassword(
    request: LoginWithEmailPasswordRequest
  ): Promise<LoginWithEmailPasswordResponse> {
    const result = await this.commandBus.execute(
      new LoginWithEmailPasswordCommand(request.email ?? '', request.password ?? '', {
        deviceName: request.deviceName ?? '',
        userAgent: request.userAgent ?? '',
        ipAddress: request.ipAddress ?? '',
        terminal: request.terminal || undefined,
        terminalDeviceId: request.terminalDeviceId || undefined,
        deviceBoundTenantId: request.deviceBoundTenantId || undefined,
        loginFlow: request.loginFlow || undefined
      })
    )

    if ('status' in result && result.status === 'SUCCESS') {
      return {
        status: LoginStatus.LOGIN_STATUS_SUCCESS,
        userId: result.userId,
        challengeId: '',
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
        loginMethod: LoginMethodEnum.EmailPassword,
        accounts: [],
        passwordSetupRequired: result.passwordSetupRequired,
        terminal: result.terminal,
        allowedTerminals: result.allowedTerminals,
        terminalDeviceId: request.terminalDeviceId ?? '',
        deviceBoundTenantId: request.deviceBoundTenantId ?? '',
        loginFlow: request.loginFlow ?? ''
      }
    }

    if (result.nextStep === 'MFA_REQUIRED') {
      return {
        status: LoginStatus.LOGIN_STATUS_MFA_REQUIRED,
        userId: result.userId,
        challengeId: result.challengeId ?? '',
        accessToken: '',
        refreshToken: '',
        expiresIn: '0',
        loginMethod: result.method,
        accounts: [],
        passwordSetupRequired: false,
        terminal: result.terminal ?? request.terminal ?? '',
        allowedTerminals: result.allowedTerminals ?? [],
        terminalDeviceId: request.terminalDeviceId ?? '',
        deviceBoundTenantId: request.deviceBoundTenantId ?? '',
        loginFlow: request.loginFlow ?? ''
      }
    }

    if (result.nextStep === 'ACCOUNT_SELECTION_REQUIRED') {
      return {
        status: LoginStatus.LOGIN_STATUS_ACCOUNT_SELECTION_REQUIRED,
        userId: result.userId,
        challengeId: '',
        accessToken: '',
        refreshToken: '',
        expiresIn: '0',
        loginMethod: result.method,
        accounts: result.accounts.map((account) => ({
          accountId: account.accountId,
          tenantId: account.tenantId ?? '',
          displayName: account.displayName ?? '',
          scopeLevel: account.scopeLevel
        })),
        passwordSetupRequired: false
      }
    }

    throw ExceptionFactory.application(AUTH_LOGIN_FLOW_RESULT_UNSUPPORTED)
  }

  async requestEmailOtpLoginChallenge(
    request: RequestEmailOtpLoginChallengeRequest
  ): Promise<RequestEmailOtpLoginChallengeResponse> {
    const result = await this.commandBus.execute(
      new RequestEmailOtpLoginChallengeCommand(request.email ?? '', request.terminal || undefined)
    )

    return {
      challengeId: result.challengeId,
      expiresAt: result.expiresAt.toISOString(),
      destination: result.destination
    }
  }

  async requestEmailBindingChallenge(
    request: RequestEmailBindingChallengeRequest
  ): Promise<RequestEmailBindingChallengeResponse> {
    this.getRequiredOperatorId(request)
    const userId = request.userId ?? ''
    const result = await this.commandBus.execute(
      new RequestEmailBindingChallengeCommand({
        userId,
        email: request.email ?? ''
      })
    )

    return {
      challengeId: result.challengeId,
      expiresAt: result.expiresAt.toISOString(),
      destination: result.destination
    }
  }

  async verifyEmailBinding(
    request: VerifyEmailBindingRequest
  ): Promise<VerifyEmailBindingResponse> {
    this.getRequiredOperatorId(request)
    const userId = request.userId ?? ''
    const result = await this.commandBus.execute(
      new VerifyEmailBindingCommand({
        userId,
        accountId: request.accountId || undefined,
        tenantId: getOptionalOperatorScope(request)?.tenantId,
        scopeLevel: this.normalizeScopeLevel(request.scopeLevel),
        email: request.email ?? '',
        otp: request.otp ?? '',
        mfaGrantToken: request.mfaGrantToken || undefined
      })
    )

    return {
      success: result.success,
      type: result.type,
      identifier: result.identifier
    }
  }

  async loginWithEmailOtp(request: LoginWithEmailOtpRequest): Promise<LoginWithEmailOtpResponse> {
    const result = await this.commandBus.execute(
      new LoginWithEmailOtpCommand(
        request.email ?? '',
        request.otp ?? '',
        {
          terminal: request.terminal || undefined,
          terminalDeviceId: request.terminalDeviceId || undefined,
          deviceBoundTenantId: request.deviceBoundTenantId || undefined,
          loginFlow: request.loginFlow || undefined
        }
      )
    )

    if ('status' in result && result.status === 'SUCCESS') {
      return {
        status: LoginStatus.LOGIN_STATUS_SUCCESS,
        userId: result.userId,
        challengeId: '',
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
        loginMethod: LoginMethodEnum.EmailOtp,
        accounts: [],
        passwordSetupRequired: result.passwordSetupRequired,
        terminal: result.terminal,
        allowedTerminals: result.allowedTerminals,
        terminalDeviceId: request.terminalDeviceId ?? '',
        deviceBoundTenantId: request.deviceBoundTenantId ?? '',
        loginFlow: request.loginFlow ?? ''
      }
    }

    if (result.nextStep === 'MFA_REQUIRED') {
      return {
        status: LoginStatus.LOGIN_STATUS_MFA_REQUIRED,
        userId: result.userId,
        challengeId: result.challengeId ?? '',
        accessToken: '',
        refreshToken: '',
        expiresIn: '0',
        loginMethod: result.method,
        accounts: [],
        passwordSetupRequired: false,
        terminal: result.terminal ?? request.terminal ?? '',
        allowedTerminals: result.allowedTerminals ?? [],
        terminalDeviceId: request.terminalDeviceId ?? '',
        deviceBoundTenantId: request.deviceBoundTenantId ?? '',
        loginFlow: request.loginFlow ?? ''
      }
    }

    if (result.nextStep === 'ACCOUNT_SELECTION_REQUIRED') {
      return {
        status: LoginStatus.LOGIN_STATUS_ACCOUNT_SELECTION_REQUIRED,
        userId: result.userId,
        challengeId: '',
        accessToken: '',
        refreshToken: '',
        expiresIn: '0',
        loginMethod: result.method,
        accounts: result.accounts.map((account) => ({
          accountId: account.accountId,
          tenantId: account.tenantId ?? '',
          displayName: account.displayName ?? '',
          scopeLevel: account.scopeLevel
        })),
        passwordSetupRequired: false
      }
    }

    throw ExceptionFactory.application(AUTH_LOGIN_FLOW_RESULT_UNSUPPORTED)
  }

  async loginWithPhonePassword(
    request: LoginWithPhonePasswordRequest
  ): Promise<LoginWithPhonePasswordResponse> {
    const result = await this.commandBus.execute(
      new LoginWithPhonePasswordCommand(request.phone ?? '', request.password ?? '', {
        deviceName: request.deviceName ?? '',
        userAgent: request.userAgent ?? '',
        ipAddress: request.ipAddress ?? '',
        terminal: request.terminal || undefined,
        terminalDeviceId: request.terminalDeviceId || undefined,
        deviceBoundTenantId: request.deviceBoundTenantId || undefined,
        loginFlow: request.loginFlow || undefined
      })
    )

    if ('status' in result && result.status === 'SUCCESS') {
      return {
        status: LoginStatus.LOGIN_STATUS_SUCCESS,
        userId: result.userId,
        challengeId: '',
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
        loginMethod: LoginMethodEnum.PhonePassword,
        accounts: [],
        passwordSetupRequired: result.passwordSetupRequired,
        terminal: result.terminal,
        allowedTerminals: result.allowedTerminals,
        terminalDeviceId: request.terminalDeviceId ?? '',
        deviceBoundTenantId: request.deviceBoundTenantId ?? '',
        loginFlow: request.loginFlow ?? ''
      }
    }

    if (result.nextStep === 'MFA_REQUIRED') {
      return {
        status: LoginStatus.LOGIN_STATUS_MFA_REQUIRED,
        userId: result.userId,
        challengeId: result.challengeId ?? '',
        accessToken: '',
        refreshToken: '',
        expiresIn: '0',
        loginMethod: result.method,
        accounts: [],
        passwordSetupRequired: false,
        terminal: result.terminal ?? request.terminal ?? '',
        allowedTerminals: result.allowedTerminals ?? [],
        terminalDeviceId: request.terminalDeviceId ?? '',
        deviceBoundTenantId: request.deviceBoundTenantId ?? '',
        loginFlow: request.loginFlow ?? ''
      }
    }

    if (result.nextStep === 'ACCOUNT_SELECTION_REQUIRED') {
      return {
        status: LoginStatus.LOGIN_STATUS_ACCOUNT_SELECTION_REQUIRED,
        userId: result.userId,
        challengeId: '',
        accessToken: '',
        refreshToken: '',
        expiresIn: '0',
        loginMethod: result.method,
        accounts: result.accounts.map((account) => ({
          accountId: account.accountId,
          tenantId: account.tenantId ?? '',
          displayName: account.displayName ?? '',
          scopeLevel: account.scopeLevel
        })),
        passwordSetupRequired: false
      }
    }

    throw ExceptionFactory.application(AUTH_LOGIN_FLOW_RESULT_UNSUPPORTED)
  }

  async loginWithEmployeeCodePin(
    request: LoginWithEmployeeCodePinRequest
  ): Promise<LoginWithEmployeeCodePinResponse> {
    const result = await this.commandBus.execute(
      new LoginWithEmployeeCodePinCommand(request.employeeCode ?? '', request.pin ?? '', {
        deviceName: request.deviceName ?? '',
        userAgent: request.userAgent ?? '',
        ipAddress: request.ipAddress ?? '',
        terminal: request.terminal || 'PDA',
        terminalDeviceId: request.terminalDeviceId || undefined,
        deviceBoundTenantId: request.deviceBoundTenantId || undefined,
        loginFlow: request.loginFlow || TerminalLoginFlow.EmployeeCodePin
      })
    )

    if ('status' in result && result.status === 'SUCCESS') {
      return {
        status: LoginStatus.LOGIN_STATUS_SUCCESS,
        userId: result.userId,
        challengeId: '',
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
        loginMethod: LoginMethodEnum.EmployeeCodePin,
        accounts: [],
        passwordSetupRequired: result.passwordSetupRequired,
        terminal: result.terminal,
        allowedTerminals: result.allowedTerminals,
        terminalDeviceId: request.terminalDeviceId ?? '',
        deviceBoundTenantId: request.deviceBoundTenantId ?? '',
        loginFlow: request.loginFlow || TerminalLoginFlow.EmployeeCodePin
      }
    }

    if (result.nextStep === 'MFA_REQUIRED') {
      return {
        status: LoginStatus.LOGIN_STATUS_MFA_REQUIRED,
        userId: result.userId,
        challengeId: result.challengeId ?? '',
        accessToken: '',
        refreshToken: '',
        expiresIn: '0',
        loginMethod: result.method,
        accounts: [],
        passwordSetupRequired: false,
        terminal: result.terminal ?? request.terminal ?? 'PDA',
        allowedTerminals: result.allowedTerminals ?? [],
        terminalDeviceId: request.terminalDeviceId ?? '',
        deviceBoundTenantId: request.deviceBoundTenantId ?? '',
        loginFlow: request.loginFlow || TerminalLoginFlow.EmployeeCodePin
      }
    }

    throw ExceptionFactory.application(AUTH_LOGIN_FLOW_RESULT_UNSUPPORTED)
  }

  async preflightEmployeeCodePinLogin(
    request: PreflightEmployeeCodePinLoginRequest
  ): Promise<PreflightEmployeeCodePinLoginResponse> {
    const result = await this.queryBus.execute(
      new PreflightEmployeeCodePinLoginQuery(request.employeeCode ?? '', {
        terminal: request.terminal || 'PDA',
        terminalDeviceId: request.terminalDeviceId || undefined,
        deviceBoundTenantId: request.deviceBoundTenantId || undefined,
        loginFlow: request.loginFlow || TerminalLoginFlow.EmployeeCodePin
      })
    )

    return {
      allowed: result.allowed,
      reasonCode: result.reasonCode,
      message: result.message
    }
  }

  async requestPhoneOtpLoginChallenge(
    request: RequestPhoneOtpLoginChallengeRequest
  ): Promise<RequestPhoneOtpLoginChallengeResponse> {
    const result = await this.commandBus.execute(
      new RequestPhoneOtpLoginChallengeCommand(request.phone ?? '', request.terminal || undefined)
    )

    return {
      challengeId: result.challengeId,
      expiresAt: result.expiresAt.toISOString(),
      destination: result.destination
    }
  }

  async requestPhoneBindingChallenge(
    request: RequestPhoneBindingChallengeRequest
  ): Promise<RequestPhoneBindingChallengeResponse> {
    this.getRequiredOperatorId(request)
    const userId = request.userId ?? ''
    const result = await this.commandBus.execute(
      new RequestPhoneBindingChallengeCommand({
        userId,
        phone: request.phone ?? ''
      })
    )

    return {
      challengeId: result.challengeId,
      expiresAt: result.expiresAt.toISOString(),
      destination: result.destination
    }
  }

  async verifyPhoneBinding(
    request: VerifyPhoneBindingRequest
  ): Promise<VerifyPhoneBindingResponse> {
    this.getRequiredOperatorId(request)
    const userId = request.userId ?? ''
    const result = await this.commandBus.execute(
      new VerifyPhoneBindingCommand({
        userId,
        accountId: request.accountId || undefined,
        tenantId: getOptionalOperatorScope(request)?.tenantId,
        scopeLevel: this.normalizeScopeLevel(request.scopeLevel),
        phone: request.phone ?? '',
        otp: request.otp ?? '',
        mfaGrantToken: request.mfaGrantToken || undefined
      })
    )

    return {
      success: result.success,
      type: result.type,
      identifier: result.identifier
    }
  }

  async loginWithPhoneOtp(request: LoginWithPhoneOtpRequest): Promise<LoginWithPhoneOtpResponse> {
    const result = await this.commandBus.execute(
      new LoginWithPhoneOtpCommand(
        request.phone ?? '',
        request.otp ?? '',
        {
          terminal: request.terminal || undefined,
          terminalDeviceId: request.terminalDeviceId || undefined,
          deviceBoundTenantId: request.deviceBoundTenantId || undefined,
          loginFlow: request.loginFlow || undefined
        }
      )
    )

    if ('status' in result && result.status === 'SUCCESS') {
      return {
        status: LoginStatus.LOGIN_STATUS_SUCCESS,
        userId: result.userId,
        challengeId: '',
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
        loginMethod: LoginMethodEnum.PhoneOtp,
        accounts: [],
        passwordSetupRequired: result.passwordSetupRequired,
        terminal: result.terminal,
        allowedTerminals: result.allowedTerminals,
        terminalDeviceId: request.terminalDeviceId ?? '',
        deviceBoundTenantId: request.deviceBoundTenantId ?? '',
        loginFlow: request.loginFlow ?? ''
      }
    }

    if (result.nextStep === 'MFA_REQUIRED') {
      return {
        status: LoginStatus.LOGIN_STATUS_MFA_REQUIRED,
        userId: result.userId,
        challengeId: result.challengeId ?? '',
        accessToken: '',
        refreshToken: '',
        expiresIn: '0',
        loginMethod: result.method,
        accounts: [],
        passwordSetupRequired: false,
        terminal: result.terminal ?? request.terminal ?? '',
        allowedTerminals: result.allowedTerminals ?? [],
        terminalDeviceId: request.terminalDeviceId ?? '',
        deviceBoundTenantId: request.deviceBoundTenantId ?? '',
        loginFlow: request.loginFlow ?? ''
      }
    }

    if (result.nextStep === 'ACCOUNT_SELECTION_REQUIRED') {
      return {
        status: LoginStatus.LOGIN_STATUS_ACCOUNT_SELECTION_REQUIRED,
        userId: result.userId,
        challengeId: '',
        accessToken: '',
        refreshToken: '',
        expiresIn: '0',
        loginMethod: result.method,
        accounts: result.accounts.map((account) => ({
          accountId: account.accountId,
          tenantId: account.tenantId ?? '',
          displayName: account.displayName ?? '',
          scopeLevel: account.scopeLevel
        })),
        passwordSetupRequired: false
      }
    }

    throw ExceptionFactory.application(AUTH_LOGIN_FLOW_RESULT_UNSUPPORTED)
  }

  private requireTerminalLoginPolicyService(): TerminalLoginPolicyService {
    if (!this.terminalLoginPolicyService) {
      throw new Error('TerminalLoginPolicyService is not configured')
    }

    return this.terminalLoginPolicyService
  }

  private requireTerminalMfaPolicyService(): TerminalMfaPolicyService {
    if (!this.terminalMfaPolicyService) {
      throw new Error('TerminalMfaPolicyService is not configured')
    }

    return this.terminalMfaPolicyService
  }

  private toProtoTerminalLoginPolicyEntry(
    policy: TerminalLoginPolicyEntity
  ): TerminalLoginPolicyEntry {
    return {
      terminal: policy.terminal,
      enabledLoginFlows: policy.getEnabledFlows(),
      supportedLoginFlows: this.supportedTerminalLoginFlows(policy.terminal),
      updatedAt: '',
      updatedBy: ''
    }
  }

  private supportedTerminalLoginFlows(terminal: string): TerminalLoginFlow[] {
    switch (terminal.trim().toUpperCase()) {
      case 'WEB':
      case 'TENANT_WEB':
        return [
          TerminalLoginFlow.EmailPassword,
          TerminalLoginFlow.EmailOtp,
          TerminalLoginFlow.PhonePassword,
          TerminalLoginFlow.PhoneOtp
        ]
      case 'PDA':
        return [TerminalLoginFlow.Password, TerminalLoginFlow.EmployeeCodePin]
      case 'BROWSER_EXTENSION':
        return [TerminalLoginFlow.Password]
      case 'KIOSK':
        return []
      default:
        return []
    }
  }

  private toProtoTerminalMfaPolicyEntry(
    policy: TerminalMfaPolicyEntity,
    source: string
  ): TerminalMfaPolicyEntry {
    const snapshot = policy.toSnapshot()
    return {
      terminal: snapshot.terminal,
      loginMfaRequired: snapshot.loginMfaRequired,
      newDeviceMfaRequired: snapshot.newDeviceMfaRequired,
      allowedFactors: snapshot.allowedFactors.map((factor) => this.toProtoMfaBindingType(factor)),
      factorPriority: snapshot.factorPriority.map((factor) => this.toProtoMfaBindingType(factor)),
      source
    }
  }

  private toProtoTerminalMfaPolicyResolution(
    policy: TerminalMfaPolicyResolution
  ): TerminalMfaPolicyEntry {
    return {
      terminal: policy.terminal,
      loginMfaRequired: policy.loginMfaRequired,
      newDeviceMfaRequired: policy.newDeviceMfaRequired,
      allowedFactors: policy.allowedFactors.map((factor) => this.toProtoMfaBindingType(factor)),
      factorPriority: policy.factorPriority.map((factor) => this.toProtoMfaBindingType(factor)),
      source: policy.source
    }
  }

  private toDomainTerminalMfaFactors(
    factors: MfaBindingType[] | undefined
  ): DomainTerminalMfaBindingType[] {
    return (factors ?? []).map((factor) => this.toDomainMfaType(factor))
  }

  private getRequiredOperatorId(rpcData: unknown): string {
    const operatorId =
      getAuthenticatedGrpcRequestContext(rpcData)?.operatorContext?.operator_id?.trim()

    if (!operatorId) {
      throw ExceptionFactory.application(OPERATOR_CONTEXT_MISSING)
    }

    return operatorId
  }

  private toDomainMfaType(type: MfaBindingType | undefined): TenantMfaFactor {
    if (type === MfaBindingType.MFA_BINDING_TYPE_EMAIL_OTP) {
      return MfaType.EMAIL_OTP
    }

    if (type === MfaBindingType.MFA_BINDING_TYPE_SMS_OTP) {
      return MfaType.SMS_OTP
    }

    if (type === MfaBindingType.MFA_BINDING_TYPE_TOTP) {
      return MfaType.TOTP
    }

    if (type === MfaBindingType.MFA_BINDING_TYPE_BACKUP_CODE) {
      return MfaType.BACKUP_CODE
    }

    throw ExceptionFactory.domain(AUTH_MFA_TYPE_NOT_SUPPORTED, {
      type
    })
  }

  private toProtoMfaBindingType(type: MfaType): MfaBindingType {
    if (type === MfaType.EMAIL_OTP) {
      return MfaBindingType.MFA_BINDING_TYPE_EMAIL_OTP
    }

    if (type === MfaType.SMS_OTP) {
      return MfaBindingType.MFA_BINDING_TYPE_SMS_OTP
    }

    if (type === MfaType.TOTP) {
      return MfaBindingType.MFA_BINDING_TYPE_TOTP
    }

    if (type === MfaType.BACKUP_CODE) {
      return MfaBindingType.MFA_BINDING_TYPE_BACKUP_CODE
    }

    return MfaBindingType.MFA_BINDING_TYPE_UNSPECIFIED
  }

  private toProtoMfaScenario(
    scenario: 'CHANGE_CONTACT' | 'CHANGE_PASSWORD' | 'LOGIN' | 'NEW_DEVICE_LOGIN'
  ): MfaScenario {
    switch (scenario) {
      case 'LOGIN':
        return MfaScenario.MFA_SCENARIO_LOGIN
      case 'NEW_DEVICE_LOGIN':
        return MfaScenario.MFA_SCENARIO_NEW_DEVICE_LOGIN
      case 'CHANGE_PASSWORD':
        return MfaScenario.MFA_SCENARIO_CHANGE_PASSWORD
      case 'CHANGE_CONTACT':
        return MfaScenario.MFA_SCENARIO_CHANGE_CONTACT
      default:
        return MfaScenario.MFA_SCENARIO_UNSPECIFIED
    }
  }

  private toDomainMfaScenario(
    scenario: MfaScenario | undefined,
    fallback: 'CHANGE_CONTACT' | 'CHANGE_PASSWORD' | 'NEW_DEVICE_LOGIN' | 'LOGIN' = 'LOGIN'
  ): 'CHANGE_CONTACT' | 'CHANGE_PASSWORD' | 'LOGIN' | 'NEW_DEVICE_LOGIN' {
    switch (scenario) {
      case MfaScenario.MFA_SCENARIO_LOGIN:
        return 'LOGIN'
      case MfaScenario.MFA_SCENARIO_NEW_DEVICE_LOGIN:
        return 'NEW_DEVICE_LOGIN'
      case MfaScenario.MFA_SCENARIO_CHANGE_PASSWORD:
        return 'CHANGE_PASSWORD'
      case MfaScenario.MFA_SCENARIO_CHANGE_CONTACT:
        return 'CHANGE_CONTACT'
      default:
        return fallback
    }
  }

  private toDomainProtectedMfaScenario(
    scenario: MfaScenario | undefined
  ): 'CHANGE_CONTACT' | 'CHANGE_PASSWORD' | 'NEW_DEVICE_LOGIN' {
    const mapped = this.toDomainMfaScenario(scenario, 'CHANGE_PASSWORD')
    return mapped === 'LOGIN' ? 'CHANGE_PASSWORD' : mapped
  }

  private normalizeScopeLevel(scopeLevel?: string): 'SYSTEM' | 'TENANT' {
    return scopeLevel === 'SYSTEM' ? 'SYSTEM' : 'TENANT'
  }

  // Converts an auth-service admin session projection into the generated gRPC session view.
  private toProtoAdminSessionView(session: {
    sessionId: string
    userId: string
    accountId: string
    tenantId: string
    terminal: string
    terminalDeviceId: string
    deviceBoundTenantId: string
    loginFlow: string
    status: string
    loginMethod: string
    deviceId: string
    deviceName: string
    userAgent: string
    ipAddress: string
    platform: string
    browser: string
    createdAt: Date
    lastActiveAt: Date
    expiresAt: Date
    refreshExpiresAt: Date
    accessRemainingSeconds: number
    refreshRemainingSeconds: number
    sessionAgeSeconds: number
    idleSeconds: number
    isAccessExpired: boolean
    isRefreshExpired: boolean
    isRevoked: boolean
    isAdminControlled: boolean
    adminRevokeReason: string
    adminRevokeAt: Date | null
    adminRevokeBy: string
  }): AdminSessionView {
    return {
      sessionId: session.sessionId,
      userId: session.userId,
      accountId: session.accountId,
      tenantId: session.tenantId,
      terminal: session.terminal,
      terminalDeviceId: session.terminalDeviceId,
      deviceBoundTenantId: session.deviceBoundTenantId,
      loginFlow: session.loginFlow,
      status: session.status,
      loginMethod: session.loginMethod,
      deviceId: session.deviceId,
      deviceName: session.deviceName,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      platform: session.platform,
      browser: session.browser,
      createdAt: session.createdAt.toISOString(),
      lastActiveAt: session.lastActiveAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      refreshExpiresAt: session.refreshExpiresAt.toISOString(),
      accessRemainingSeconds: String(session.accessRemainingSeconds),
      refreshRemainingSeconds: String(session.refreshRemainingSeconds),
      sessionAgeSeconds: String(session.sessionAgeSeconds),
      idleSeconds: String(session.idleSeconds),
      isAccessExpired: session.isAccessExpired,
      isRefreshExpired: session.isRefreshExpired,
      isRevoked: session.isRevoked,
      isAdminControlled: session.isAdminControlled,
      adminRevokeReason: session.adminRevokeReason,
      adminRevokeAt: session.adminRevokeAt?.toISOString() ?? '',
      adminRevokeBy: session.adminRevokeBy
    }
  }

  private toProtoScenarioRequirements(
    requirements: Record<
      'CHANGE_CONTACT' | 'CHANGE_PASSWORD' | 'LOGIN' | 'NEW_DEVICE_LOGIN',
      boolean
    >
  ): TenantMfaScenarioRequirement[] {
    return (['LOGIN', 'CHANGE_PASSWORD', 'CHANGE_CONTACT', 'NEW_DEVICE_LOGIN'] as const).map(
      (scenario) => ({
        scenario: this.toProtoMfaScenario(scenario),
        required: Boolean(requirements[scenario])
      })
    )
  }

  private toDomainScenarioRequirements(
    requirements: TenantMfaScenarioRequirement[] | undefined,
    loginRequired: boolean
  ): Record<'CHANGE_CONTACT' | 'CHANGE_PASSWORD' | 'LOGIN' | 'NEW_DEVICE_LOGIN', boolean> {
    const mapped: Record<
      'CHANGE_CONTACT' | 'CHANGE_PASSWORD' | 'LOGIN' | 'NEW_DEVICE_LOGIN',
      boolean
    > = {
      LOGIN: loginRequired,
      CHANGE_PASSWORD: false,
      CHANGE_CONTACT: false,
      NEW_DEVICE_LOGIN: false
    }

    for (const requirement of requirements ?? []) {
      const scenario = this.toDomainMfaScenario(requirement.scenario, 'LOGIN')
      mapped[scenario] = Boolean(requirement.required)
    }

    mapped.LOGIN = Boolean(
      requirements?.some((requirement) => requirement.scenario === MfaScenario.MFA_SCENARIO_LOGIN)
        ? mapped.LOGIN
        : loginRequired
    )

    return mapped
  }
}


/** Applies one immutable frozen admission declaration to each of Auth's 70 baseline RPC handlers. */
function applyAuthAdmission(method: string, decorator: MethodDecorator): void {
  const descriptor = Object.getOwnPropertyDescriptor(AuthGrpcController.prototype, method)
  if (!descriptor) throw new Error(`Auth frozen RPC handler is missing: ${method}`)
  decorator(AuthGrpcController.prototype, method, descriptor)
}
applyAuthAdmission('loginWithEmailPassword', AuthorizeAuthPublicAdmission('PUBLIC_CREDENTIAL'))
applyAuthAdmission('requestEmailOtpLoginChallenge', AuthorizeAuthPublicAdmission('PUBLIC_CREDENTIAL'))
applyAuthAdmission('loginWithEmailOtp', AuthorizeAuthPublicAdmission('PUBLIC_CREDENTIAL'))
applyAuthAdmission('loginWithEmployeeCodePin', AuthorizeAuthPublicAdmission('PUBLIC_CREDENTIAL'))
applyAuthAdmission('preflightEmployeeCodePinLogin', AuthorizeAuthPublicAdmission('PUBLIC_CREDENTIAL'))
applyAuthAdmission('loginWithPhonePassword', AuthorizeAuthPublicAdmission('PUBLIC_CREDENTIAL'))
applyAuthAdmission('requestPhoneOtpLoginChallenge', AuthorizeAuthPublicAdmission('PUBLIC_CREDENTIAL'))
applyAuthAdmission('loginWithPhoneOtp', AuthorizeAuthPublicAdmission('PUBLIC_CREDENTIAL'))
applyAuthAdmission('inspectPasswordRecoveryChannels', AuthorizeAuthPublicAdmission('PUBLIC_CREDENTIAL'))
applyAuthAdmission('requestPasswordRecoveryChallenge', AuthorizeAuthPublicAdmission('PUBLIC_CREDENTIAL'))
applyAuthAdmission('verifyPasswordRecoveryChallenge', AuthorizeAuthPublicAdmission('PUBLIC_CREDENTIAL'))
applyAuthAdmission('completePasswordRecovery', AuthorizeAuthPublicAdmission('PUBLIC_CREDENTIAL'))
applyAuthAdmission('completeFirstLoginPasswordSetup', AuthorizeAuthPublicAdmission('PUBLIC_CONTINUATION'))
applyAuthAdmission('requestLoginMfaFactorChallenge', AuthorizeAuthPublicAdmission('PUBLIC_CONTINUATION'))
applyAuthAdmission('submitMfaChallenge', AuthorizeAuthPublicAdmission('PUBLIC_CONTINUATION'))
applyAuthAdmission('refreshSession', AuthorizeAuthPublicAdmission('PUBLIC_CONTINUATION'))
applyAuthAdmission('selectAccount', AuthorizeAuthPublicAdmission('PUBLIC_CONTINUATION'))
applyAuthAdmission('validateAccessToken', AuthorizeAuthPublicAdmission('PUBLIC_SESSION_SOURCE_VALIDATION'))
applyAuthAdmission('listLoginHistory', AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminal: 'WEB' }))
applyAuthAdmission('bootstrapOwnLoginMethods', AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminal: 'WEB' }))
applyAuthAdmission('requestEmailBindingChallenge', AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminal: 'WEB' }))
applyAuthAdmission('requestPhoneBindingChallenge', AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminal: 'WEB' }))
applyAuthAdmission('listLoginMethods', AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminal: 'WEB' }))
applyAuthAdmission('changeOwnPassword', AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminal: 'WEB' }))
applyAuthAdmission('setOwnTerminalPin', AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminal: 'WEB' }))
applyAuthAdmission('resetOwnTerminalPin', AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminal: 'WEB' }))
applyAuthAdmission('setOwnTerminalPinEnabled', AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminal: 'WEB' }))
applyAuthAdmission('setOwnLoginMethodEnabled', AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminal: 'WEB' }))
applyAuthAdmission('verifyEmailBinding', AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminal: 'WEB' }))
applyAuthAdmission('verifyPhoneBinding', AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminal: 'WEB' }))
applyAuthAdmission('listMfaBindings', AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminal: 'WEB' }))
applyAuthAdmission('enableMfaBinding', AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminal: 'WEB' }))
applyAuthAdmission('disableMfaBinding', AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminal: 'WEB' }))
applyAuthAdmission('initializeTotpBinding', AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminal: 'WEB' }))
applyAuthAdmission('activateTotpBinding', AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminal: 'WEB' }))
applyAuthAdmission('initializeRecoveryCodes', AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminal: 'WEB' }))
applyAuthAdmission('regenerateRecoveryCodes', AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminal: 'WEB' }))
applyAuthAdmission('startStepUpMfaChallenge', AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminal: 'WEB' }))
applyAuthAdmission('completeStepUpMfaChallenge', AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminal: 'WEB' }))
applyAuthAdmission('listSessions', AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminal: 'WEB' }))
applyAuthAdmission('listTrustedDevices', AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminal: 'WEB' }))
applyAuthAdmission('revokeTrustedDevice', AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminal: 'WEB' }))
applyAuthAdmission('revokeOtherTrustedDevices', AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminal: 'WEB' }))
applyAuthAdmission('logout', AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminal: 'WEB' }))
applyAuthAdmission('logoutSession', AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminal: 'WEB' }))
applyAuthAdmission('logoutOtherDevices', AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminal: 'WEB' }))
applyAuthAdmission('logoutAll', AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminal: 'WEB' }))
applyAuthAdmission('listAuditEvents', AuthorizeBusinessRpc({ all: ['auth.audit.list'] }))
applyAuthAdmission('bootstrapUserLoginMethods', AuthorizeBusinessRpc({ all: ['auth.account_credentials.bootstrap'] }))
applyAuthAdmission('requirePasswordSetup', AuthorizeBusinessRpc({ all: ['auth.account_credentials.bootstrap'] }))
applyAuthAdmission('requireTerminalPinReset', AuthorizeBusinessRpc({ all: ['auth.account_credentials.bootstrap'] }))
applyAuthAdmission('disableUserTerminalPin', AuthorizeBusinessRpc({ all: ['auth.account_credentials.bootstrap'] }))
applyAuthAdmission('setLoginMethodEnabled', AuthorizeBusinessRpc({ all: ['auth.account_login_methods.manage'] }))
applyAuthAdmission('getTenantMfaPolicy', AuthorizeBusinessRpc({ all: ['auth.mfa_policy.manage'] }))
applyAuthAdmission('updateTenantMfaPolicy', AuthorizeBusinessRpc({ all: ['auth.mfa_policy.manage'] }))
applyAuthAdmission('getTenantTerminalMfaPolicy', AuthorizeBusinessRpc({ all: ['auth.mfa_policy.manage'] }))
applyAuthAdmission('updateTenantTerminalMfaPolicy', AuthorizeBusinessRpc({ all: ['auth.mfa_policy.manage'] }))
applyAuthAdmission('getPlatformMfaPolicy', AuthorizeBusinessRpc({ all: ['auth.platform_mfa_policy.manage'] }))
applyAuthAdmission('updatePlatformMfaPolicy', AuthorizeBusinessRpc({ all: ['auth.platform_mfa_policy.manage'] }))
applyAuthAdmission('getPlatformTerminalLoginPolicy', AuthorizeBusinessRpc({ all: ['auth.platform_mfa_policy.manage'] }))
applyAuthAdmission('updatePlatformTerminalLoginPolicy', AuthorizeBusinessRpc({ all: ['auth.platform_mfa_policy.manage'] }))
applyAuthAdmission('getPlatformDefaultTerminalMfaPolicy', AuthorizeBusinessRpc({ all: ['auth.platform_mfa_policy.manage'] }))
applyAuthAdmission('updatePlatformDefaultTerminalMfaPolicy', AuthorizeBusinessRpc({ all: ['auth.platform_mfa_policy.manage'] }))
applyAuthAdmission('handleTerminalDeviceUnavailable', AuthorizeBusinessRpc({ all: ['auth.session.admin.view'] }))
applyAuthAdmission('adminListOnlineUsers', AuthorizeBusinessRpc({ all: ['auth.session.admin.view'] }))
applyAuthAdmission('adminListUserSessions', AuthorizeBusinessRpc({ all: ['auth.session.admin.view'] }))
applyAuthAdmission('adminListTerminalDeviceSessions', AuthorizeBusinessRpc({ all: ['auth.session.admin.view'] }))
applyAuthAdmission('adminRevokeSession', AuthorizeBusinessRpc({ all: ['auth.session.admin.revoke'] }))
applyAuthAdmission('adminDeleteAccountSessions', AuthorizeBusinessRpc({ all: ['auth.session.admin.revoke'] }))
applyAuthAdmission('revokeTenantSessions', AuthorizeBusinessRpc({ all: ['auth.session.admin.revoke'] }))
