import { Controller, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import { GrpcMethod } from '@nestjs/microservices'
import {
  AUTH_MANAGEMENT_PERMISSION_CODES,
  PermissionGuard,
  RequireAuthenticatedOperator,
  RequirePermission
} from '@oes/common/authorization'
import {
  AuthenticatedOperatorGuard,
  AUTH_SESSION_PERMISSION_CODES,
  GrpcRequestContextInterceptor,
  getAuthenticatedGrpcRequestContext,
  InternalServiceGuard,
  OPERATOR_CONTEXT_MISSING
} from '@oes/common/authorization'
import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  GrpcExceptionFilter
} from '../../../../../../common/dist/core/filters'
import {
  AdminListOnlineUsersRequest,
  AdminListOnlineUsersResponse,
  AdminListUserSessionsRequest,
  AdminListUserSessionsResponse,
  AdminDeleteAccountSessionsRequest,
  AdminDeleteAccountSessionsResponse,
  AdminRevokeSessionRequest,
  AdminRevokeSessionResponse,
  AuditEventRecord,
  AuthServiceController,
  AuthServiceControllerMethods,
  ActivateTotpBindingRequest,
  BootstrapUserLoginMethodsRequest,
  BootstrapUserLoginMethodsResponse,
  ChangeOwnPasswordRequest,
  CompletePasswordRecoveryRequest,
  InspectPasswordRecoveryChannelsRequest,
  InspectPasswordRecoveryChannelsResponse,
  PasswordRecoveryChallengeResponse,
  PasswordRecoveryChannel,
  PasswordRecoveryCompletionResponse,
  PasswordRecoveryVerificationResponse,
  ContactBindingVerificationResponse,
  CompleteFirstLoginPasswordSetupRequest,
  CompleteFirstLoginPasswordSetupResponse,
  DisableMfaBindingRequest,
  EmailBindingChallengeRequest,
  EmailOtpChallengeRequest,
  EmailPasswordLoginRequest,
  EmailOtpLoginRequest,
  EnableMfaBindingRequest,
  InitializeRecoveryCodesRequest,
  InitializeTotpBindingRequest,
  InitializeTotpBindingResponse,
  LoginStatus,
  LoginResponse,
  ListAuditEventsRequest,
  ListAuditEventsResponse,
  ListLoginHistoryRequest,
  ListLoginHistoryResponse,
  ListLoginMethodsRequest,
  ListLoginMethodsResponse,
  ListSessionsRequest,
  ListSessionsResponse,
  ListMfaBindingsRequest,
  ListMfaBindingsResponse,
  LoginMethodMutationResponse,
  MfaBindingMutationResponse,
  MfaBindingType,
  MfaScenario,
  GetTenantMfaPolicyRequest,
  RequestLoginMfaFactorChallengeRequest,
  PasswordMutationResponse,
  RequestPasswordRecoveryChallengeRequest,
  RecoveryCodesResponse,
  LogoutAllRequest,
  LogoutAllResponse,
  LogoutSessionRequest,
  LogoutSessionResponse,
  LogoutOtherDevicesRequest,
  LogoutOtherDevicesResponse,
  LogoutRequest,
  LogoutResponse,
  OtpChallengeResponse,
  PhoneBindingChallengeRequest,
  PhoneOtpChallengeRequest,
  PhoneOtpLoginRequest,
  PhonePasswordLoginRequest,
  RefreshSessionRequest,
  RefreshSessionResponse,
  ValidateAccessTokenRequest,
  ValidateAccessTokenResponse,
  RegenerateRecoveryCodesRequest,
  RequirePasswordSetupRequest,
  SelectAccountRequest,
  SelectAccountResponse,
  SetLoginMethodEnabledRequest,
  SubmitMfaChallengeRequest,
  TenantMfaPolicyResponse,
  TenantMfaFactorPolicy,
  UpdateTenantMfaPolicyRequest,
  VerifyPasswordRecoveryChallengeRequest,
  VerifyEmailBindingRequest,
  VerifyPhoneBindingRequest
} from '@oes/common/generated/auth_service'
import {
  AdminDeleteAccountSessionsCommand,
  AdminRevokeSessionCommand,
  ActivateTotpBindingCommand,
  ChangeOwnPasswordCommand,
  CompletePasswordRecoveryCommand,
  DisableMfaBindingCommand,
  EnableMfaBindingCommand,
  InitializeRecoveryCodesCommand,
  InitializeTotpBindingCommand,
  LoginWithEmailPasswordCommand,
  LoginWithEmailOtpCommand,
  LoginWithPhoneOtpCommand,
  LoginWithPhonePasswordCommand,
  BootstrapUserLoginMethodsCommand,
  CompleteFirstLoginPasswordSetupCommand,
  LogoutAllCommand,
  LogoutSessionCommand,
  LogoutOtherDevicesCommand,
  LogoutCommand,
  RefreshSessionCommand,
  RegenerateRecoveryCodesCommand,
  RequestPasswordRecoveryChallengeCommand,
  RequestLoginMfaFactorChallengeCommand,
  RequestEmailBindingChallengeCommand,
  RequestEmailOtpLoginChallengeCommand,
  RequestPhoneBindingChallengeCommand,
  RequestPhoneOtpLoginChallengeCommand,
  RequirePasswordSetupCommand,
  SelectAccountCommand,
  SetLoginMethodEnabledCommand,
  SubmitMfaChallengeCommand,
  UpdateTenantMfaPolicyCommand,
  VerifyPasswordRecoveryChallengeCommand,
  VerifyEmailBindingCommand,
  VerifyPhoneBindingCommand
} from '../../application/commands/auth'
import {
  AdminListOnlineUsersQuery,
  AdminListUserSessionsQuery,
  ListLoginHistoryQuery,
  ListAuditEventsQuery,
  InspectPasswordRecoveryChannelsQuery,
  ListLoginMethodsQuery,
  ListMfaBindingsQuery,
  GetTenantMfaPolicyQuery,
  ListSessionsQuery,
  ValidateAccessTokenQuery
} from '../../application/queries'
import {
  AUTH_LOGIN_FLOW_RESULT_UNSUPPORTED,
  AUTH_MFA_TYPE_NOT_SUPPORTED
} from '../../common/constants/exception-enums'
import { MfaType } from '../../common/constants'
import { AccountInvitationService } from '../../application/services/account-invitation.service'
import { TenantMfaFactor } from '../../domain/entities/tenant-mfa-policy.entity'
import { AuthGrpcPresenter } from './auth-grpc.presenter'
import { getOptionalOperatorScope } from './grpc-request-context'

@Controller()
@UseFilters(GrpcExceptionFilter)
@UseInterceptors(GrpcRequestContextInterceptor)
@AuthServiceControllerMethods()
export class AuthGrpcController implements AuthServiceController {
  constructor(
    private readonly commandBus: ValidatingCommandBus,
    private readonly queryBus: ValidatingQueryBus,
    private readonly accountInvitationService?: AccountInvitationService
  ) {}

  @RequirePermission(AUTH_MANAGEMENT_PERMISSION_CODES.BOOTSTRAP_ACCOUNT_CREDENTIALS)
  @UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard, PermissionGuard)
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

  @RequireAuthenticatedOperator()
  @UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard)
  async completeFirstLoginPasswordSetup(
    request: CompleteFirstLoginPasswordSetupRequest
  ): Promise<CompleteFirstLoginPasswordSetupResponse> {
    const userId = this.getRequiredOperatorId(request)
    return this.commandBus.execute(
      new CompleteFirstLoginPasswordSetupCommand({
        userId,
        newPassword: request.newPassword ?? ''
      })
    )
  }

  async requestPasswordRecoveryChallenge(
    request: RequestPasswordRecoveryChallengeRequest
  ): Promise<PasswordRecoveryChallengeResponse> {
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
  ): Promise<PasswordRecoveryVerificationResponse> {
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
  ): Promise<PasswordRecoveryCompletionResponse> {
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

  @RequirePermission(AUTH_MANAGEMENT_PERMISSION_CODES.VIEW_AUDIT_EVENT)
  @UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard, PermissionGuard)
  async listAuditEvents(request: ListAuditEventsRequest): Promise<ListAuditEventsResponse> {
    this.getRequiredOperatorId(request)

    const result = await this.queryBus.execute(
      new ListAuditEventsQuery({
        service: request.service || undefined,
        module: request.module || undefined,
        eventType: request.eventType || undefined,
        result: request.result || undefined,
        operatorId: request.operatorId || undefined,
        tenantId: request.tenantId || undefined,
        orgId: request.orgId || undefined,
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
      items: result.items.map((event): AuditEventRecord => AuthGrpcPresenter.toAuditEventRecord(event)),
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
  async changeOwnPassword(
    request: ChangeOwnPasswordRequest
  ): Promise<PasswordMutationResponse> {
    return this.commandBus.execute(
      new ChangeOwnPasswordCommand({
        userId: request.userId ?? '',
        currentPassword: request.currentPassword ?? '',
        newPassword: request.newPassword ?? ''
      })
    )
  }

  /**
   * requirePasswordSetup marks one target user as needing to set a new password without accepting plaintext.
   */
  @RequirePermission(AUTH_MANAGEMENT_PERMISSION_CODES.MANAGE_ACCOUNT_LOGIN_METHODS)
  @UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard, PermissionGuard)
  async requirePasswordSetup(
    request: RequirePasswordSetupRequest
  ): Promise<PasswordMutationResponse> {
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
   * setLoginMethodEnabled toggles a target login method under admin security management.
   */
  @RequirePermission(AUTH_MANAGEMENT_PERMISSION_CODES.MANAGE_ACCOUNT_LOGIN_METHODS)
  @UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard, PermissionGuard)
  async setLoginMethodEnabled(
    request: SetLoginMethodEnabledRequest
  ): Promise<LoginMethodMutationResponse> {
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

  @RequirePermission(AUTH_SESSION_PERMISSION_CODES.ADMIN_VIEW_USER_SESSIONS)
  @UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard, PermissionGuard)
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

  @RequirePermission(AUTH_SESSION_PERMISSION_CODES.ADMIN_VIEW_USER_SESSIONS)
  @UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard, PermissionGuard)
  async adminListUserSessions(
    request: AdminListUserSessionsRequest
  ): Promise<AdminListUserSessionsResponse> {
    this.getRequiredOperatorId(request)
    const sessions = await this.queryBus.execute(
      new AdminListUserSessionsQuery(
        request.userId ?? '',
        getOptionalOperatorScope(request)
      )
    )

    return {
      sessions: sessions.map((session) => ({
        sessionId: session.sessionId,
        userId: session.userId,
        accountId: session.accountId,
        tenantId: session.tenantId,
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
      }))
    }
  }

  async listSessions(request: ListSessionsRequest): Promise<ListSessionsResponse> {
    const sessions = await this.queryBus.execute(
      new ListSessionsQuery(
        request.userId ?? '',
        request.currentSessionId ?? undefined,
        undefined
      )
    )

    return {
      sessions: sessions.map((session) => ({
        sessionId: session.sessionId,
        userId: session.userId,
        accountId: session.accountId,
        tenantId: session.tenantId,
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

  @RequirePermission(AUTH_SESSION_PERMISSION_CODES.ADMIN_REVOKE_SESSION)
  @UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard, PermissionGuard)
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

  @RequireAuthenticatedOperator()
  @UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard)
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
      new LogoutOtherDevicesCommand(
        request.userId ?? '',
        request.currentSessionId ?? '',
        undefined
      )
    )

    return {
      success: result.success,
      sessionCount: String(result.sessionCount)
    }
  }

  async logoutAll(request: LogoutAllRequest): Promise<LogoutAllResponse> {
    const result = await this.commandBus.execute(
      new LogoutAllCommand(
        request.userId ?? '',
        request.currentSessionId ?? undefined,
        undefined
      )
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

  async enableMfaBinding(request: EnableMfaBindingRequest): Promise<MfaBindingMutationResponse> {
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

  async disableMfaBinding(request: DisableMfaBindingRequest): Promise<MfaBindingMutationResponse> {
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
  ): Promise<MfaBindingMutationResponse> {
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
  ): Promise<RecoveryCodesResponse> {
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
  ): Promise<RecoveryCodesResponse> {
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
  ): Promise<OtpChallengeResponse> {
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

  async submitMfaChallenge(request: SubmitMfaChallengeRequest): Promise<LoginResponse> {
    const result = await this.commandBus.execute(
      new SubmitMfaChallengeCommand(
        request.challengeId ?? '',
        this.toDomainMfaType(request.factor),
        request.code ?? '',
        (request.loginMethod as any) ?? '',
        request.factorChallengeId ?? undefined
      )
    )

    return {
      status: LoginStatus.LOGIN_STATUS_SUCCESS,
      userId: result.userId,
      challengeId: '',
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: String(result.expiresIn),
      loginMethod: result.loginMethod,
      accounts: [],
      passwordSetupRequired: result.passwordSetupRequired
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
      expiresIn: String(result.expiresIn)
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
      passwordSetupRequired: result.passwordSetupRequired,
      roleIds: result.roleIds
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
          ipAddress: request.ipAddress ?? ''
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
          label: factor.label
        })),
        factorChallengeId: result.factorChallengeId ?? '',
        challengeDestination: result.destination ?? '',
        challengeExpiresAt: result.expiresAt ?? ''
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
      challengeExpiresAt: ''
    }
  }

  @RequireAuthenticatedOperator()
  @UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard)
  async getTenantMfaPolicy(
    request: GetTenantMfaPolicyRequest
  ): Promise<TenantMfaPolicyResponse> {
    this.getRequiredOperatorId(request)
    const result = await this.queryBus.execute(
      new GetTenantMfaPolicyQuery(request.tenantId ?? '')
    )

    return {
      tenantId: result.tenantId,
      loginRequired: result.loginRequired,
      factors: result.factors.map((factor): TenantMfaFactorPolicy => ({
        factor: this.toProtoMfaBindingType(factor.factor),
        enabled: factor.enabled,
        priority: factor.priority
      }))
    }
  }

  @RequireAuthenticatedOperator()
  @UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard)
  async updateTenantMfaPolicy(
    request: UpdateTenantMfaPolicyRequest
  ): Promise<TenantMfaPolicyResponse> {
    const operatorId = this.getRequiredOperatorId(request)
    const result = await this.commandBus.execute(
      new UpdateTenantMfaPolicyCommand({
        tenantId: request.tenantId ?? '',
        loginRequired: Boolean(request.loginRequired),
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
      factors: result.factors.map((factor): TenantMfaFactorPolicy => ({
        factor: this.toProtoMfaBindingType(factor.factor),
        enabled: factor.enabled,
        priority: factor.priority
      }))
    }
  }

  async loginWithEmailPassword(request: EmailPasswordLoginRequest): Promise<LoginResponse> {
    const result = await this.commandBus.execute(
      new LoginWithEmailPasswordCommand(request.email ?? '', request.password ?? '', {
        deviceName: request.deviceName ?? '',
        userAgent: request.userAgent ?? '',
        ipAddress: request.ipAddress ?? ''
      })
    )

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
        passwordSetupRequired: false
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
          tenantName: account.tenantName ?? '',
          displayName: account.displayName ?? '',
          scopeLevel: account.scopeLevel
        })),
        passwordSetupRequired: false
      }
    }

    throw ExceptionFactory.application(AUTH_LOGIN_FLOW_RESULT_UNSUPPORTED)
  }

  async requestEmailOtpLoginChallenge(
    request: EmailOtpChallengeRequest
  ): Promise<OtpChallengeResponse> {
    const result = await this.commandBus.execute(
      new RequestEmailOtpLoginChallengeCommand(request.email ?? '')
    )

    return {
      challengeId: result.challengeId,
      expiresAt: result.expiresAt.toISOString(),
      destination: result.destination
    }
  }

  @RequireAuthenticatedOperator()
  @UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard)
  async requestEmailBindingChallenge(
    request: EmailBindingChallengeRequest
  ): Promise<OtpChallengeResponse> {
    const userId = this.getRequiredOperatorId(request)
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

  @RequireAuthenticatedOperator()
  @UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard)
  async verifyEmailBinding(
    request: VerifyEmailBindingRequest
  ): Promise<ContactBindingVerificationResponse> {
    const userId = this.getRequiredOperatorId(request)
    const result = await this.commandBus.execute(
      new VerifyEmailBindingCommand({
        userId,
        email: request.email ?? '',
        otp: request.otp ?? ''
      })
    )

    return {
      success: result.success,
      type: result.type,
      identifier: result.identifier
    }
  }

  async loginWithEmailOtp(request: EmailOtpLoginRequest): Promise<LoginResponse> {
    const result = await this.commandBus.execute(
      new LoginWithEmailOtpCommand(request.email ?? '', request.otp ?? '')
    )

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
        passwordSetupRequired: false
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
          tenantName: account.tenantName ?? '',
          displayName: account.displayName ?? '',
          scopeLevel: account.scopeLevel
        })),
        passwordSetupRequired: false
      }
    }

    throw ExceptionFactory.application(AUTH_LOGIN_FLOW_RESULT_UNSUPPORTED)
  }

  async loginWithPhonePassword(request: PhonePasswordLoginRequest): Promise<LoginResponse> {
    const result = await this.commandBus.execute(
      new LoginWithPhonePasswordCommand(request.phone ?? '', request.password ?? '', {
        deviceName: request.deviceName ?? '',
        userAgent: request.userAgent ?? '',
        ipAddress: request.ipAddress ?? ''
      })
    )

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
        passwordSetupRequired: false
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
          tenantName: account.tenantName ?? '',
          displayName: account.displayName ?? '',
          scopeLevel: account.scopeLevel
        })),
        passwordSetupRequired: false
      }
    }

    throw ExceptionFactory.application(AUTH_LOGIN_FLOW_RESULT_UNSUPPORTED)
  }

  async requestPhoneOtpLoginChallenge(
    request: PhoneOtpChallengeRequest
  ): Promise<OtpChallengeResponse> {
    const result = await this.commandBus.execute(
      new RequestPhoneOtpLoginChallengeCommand(request.phone ?? '')
    )

    return {
      challengeId: result.challengeId,
      expiresAt: result.expiresAt.toISOString(),
      destination: result.destination
    }
  }

  @RequireAuthenticatedOperator()
  @UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard)
  async requestPhoneBindingChallenge(
    request: PhoneBindingChallengeRequest
  ): Promise<OtpChallengeResponse> {
    const userId = this.getRequiredOperatorId(request)
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

  @RequireAuthenticatedOperator()
  @UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard)
  async verifyPhoneBinding(
    request: VerifyPhoneBindingRequest
  ): Promise<ContactBindingVerificationResponse> {
    const userId = this.getRequiredOperatorId(request)
    const result = await this.commandBus.execute(
      new VerifyPhoneBindingCommand({
        userId,
        phone: request.phone ?? '',
        otp: request.otp ?? ''
      })
    )

    return {
      success: result.success,
      type: result.type,
      identifier: result.identifier
    }
  }

  async loginWithPhoneOtp(request: PhoneOtpLoginRequest): Promise<LoginResponse> {
    const result = await this.commandBus.execute(
      new LoginWithPhoneOtpCommand(request.phone ?? '', request.otp ?? '')
    )

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
        passwordSetupRequired: false
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
          tenantName: account.tenantName ?? '',
          displayName: account.displayName ?? '',
          scopeLevel: account.scopeLevel
        })),
        passwordSetupRequired: false
      }
    }

    throw ExceptionFactory.application(AUTH_LOGIN_FLOW_RESULT_UNSUPPORTED)
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

  private toProtoMfaScenario(scenario: 'LOGIN'): MfaScenario {
    if (scenario === 'LOGIN') {
      return MfaScenario.MFA_SCENARIO_LOGIN
    }

    return MfaScenario.MFA_SCENARIO_UNSPECIFIED
  }
}
