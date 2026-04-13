import { Controller, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import {
  AUTH_MANAGEMENT_PERMISSION_CODES,
  PermissionGuard,
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
  AdminListUserSessionsRequest,
  AdminListUserSessionsResponse,
  AdminRevokeSessionRequest,
  AdminRevokeSessionResponse,
  AuditEventRecord,
  AuthServiceController,
  AuthServiceControllerMethods,
  ActivateTotpBindingRequest,
  DisableMfaBindingRequest,
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
  ListSessionsRequest,
  ListSessionsResponse,
  ListMfaBindingsRequest,
  ListMfaBindingsResponse,
  MfaBindingMutationResponse,
  MfaBindingType,
  RecoveryCodesResponse,
  LogoutAllRequest,
  LogoutAllResponse,
  LogoutOtherDevicesRequest,
  LogoutOtherDevicesResponse,
  LogoutRequest,
  LogoutResponse,
  OtpChallengeResponse,
  PhoneOtpChallengeRequest,
  PhoneOtpLoginRequest,
  PhonePasswordLoginRequest,
  RefreshSessionRequest,
  RefreshSessionResponse,
  RegenerateRecoveryCodesRequest,
  SelectAccountRequest,
  SelectAccountResponse,
  SubmitMfaChallengeRequest
} from '@oes/common/generated/auth_service'
import {
  AdminRevokeSessionCommand,
  ActivateTotpBindingCommand,
  DisableMfaBindingCommand,
  EnableMfaBindingCommand,
  InitializeRecoveryCodesCommand,
  InitializeTotpBindingCommand,
  LoginWithEmailPasswordCommand,
  LoginWithEmailOtpCommand,
  LoginWithPhoneOtpCommand,
  LoginWithPhonePasswordCommand,
  LogoutAllCommand,
  LogoutOtherDevicesCommand,
  LogoutCommand,
  RefreshSessionCommand,
  RegenerateRecoveryCodesCommand,
  RequestEmailOtpLoginChallengeCommand,
  RequestPhoneOtpLoginChallengeCommand,
  SelectAccountCommand,
  SubmitMfaChallengeCommand
} from '../../application/commands/auth'
import {
  AdminListUserSessionsQuery,
  ListAuditEventsQuery,
  ListMfaBindingsQuery,
  ListSessionsQuery
} from '../../application/queries'
import {
  AUTH_LOGIN_FLOW_RESULT_UNSUPPORTED,
  AUTH_MFA_TYPE_NOT_SUPPORTED
} from '../../common/constants/exception-enums'
import { MfaType } from '../../common/constants'
import { AuthGrpcPresenter } from './auth-grpc.presenter'
import { getOptionalOperatorScope } from './grpc-request-context'

@Controller()
@UseFilters(GrpcExceptionFilter)
@UseInterceptors(GrpcRequestContextInterceptor)
@AuthServiceControllerMethods()
export class AuthGrpcController implements AuthServiceController {
  constructor(
    private readonly commandBus: ValidatingCommandBus,
    private readonly queryBus: ValidatingQueryBus
  ) {}

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
      new ListSessionsQuery(request.userId ?? '', request.currentSessionId ?? undefined)
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

  async logout(request: LogoutRequest): Promise<LogoutResponse> {
    const result = await this.commandBus.execute(new LogoutCommand(request.sessionId ?? ''))

    return {
      success: result.success
    }
  }

  async logoutOtherDevices(
    request: LogoutOtherDevicesRequest
  ): Promise<LogoutOtherDevicesResponse> {
    const result = await this.commandBus.execute(
      new LogoutOtherDevicesCommand(request.userId ?? '', request.currentSessionId ?? '')
    )

    return {
      success: result.success,
      sessionCount: String(result.sessionCount)
    }
  }

  async logoutAll(request: LogoutAllRequest): Promise<LogoutAllResponse> {
    const result = await this.commandBus.execute(new LogoutAllCommand(request.userId ?? ''))

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

  async submitMfaChallenge(request: SubmitMfaChallengeRequest): Promise<LoginResponse> {
    const result = await this.commandBus.execute(
      new SubmitMfaChallengeCommand(
        request.challengeId ?? '',
        request.code ?? '',
        (request.loginMethod as any) ?? ''
      )
    )

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
      }))
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

  async selectAccount(request: SelectAccountRequest): Promise<SelectAccountResponse> {
    const result = await this.commandBus.execute(
      new SelectAccountCommand(
        request.userId ?? '',
        request.accountId ?? '',
        (request.loginMethod as any) ?? '',
        {
          deviceId: request.deviceId ?? '',
          deviceName: request.deviceName ?? '',
          userAgent: request.userAgent ?? '',
          ipAddress: request.ipAddress ?? ''
        }
      )
    )

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
      scopeLevel: result.scopeLevel
    }
  }

  async loginWithEmailPassword(request: EmailPasswordLoginRequest): Promise<LoginResponse> {
    const result = await this.commandBus.execute(
      new LoginWithEmailPasswordCommand(request.email ?? '', request.password ?? '')
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
        accounts: []
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
        }))
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
        accounts: []
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
        }))
      }
    }

    throw ExceptionFactory.application(AUTH_LOGIN_FLOW_RESULT_UNSUPPORTED)
  }

  async loginWithPhonePassword(request: PhonePasswordLoginRequest): Promise<LoginResponse> {
    const result = await this.commandBus.execute(
      new LoginWithPhonePasswordCommand(request.phone ?? '', request.password ?? '')
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
        accounts: []
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
        }))
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
        accounts: []
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
        }))
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

  private toDomainMfaType(type: MfaBindingType | undefined): MfaType {
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
}
