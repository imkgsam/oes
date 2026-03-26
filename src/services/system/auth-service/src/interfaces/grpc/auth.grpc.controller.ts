import { Controller, UseFilters, UseGuards } from '@nestjs/common'
import {
  AuthenticatedOperatorGuard,
  AUTH_SESSION_PERMISSION_CODES,
  getAuthenticatedGrpcRequestContext,
  InternalServiceGuard,
  OPERATOR_CONTEXT_MISSING,
  RequireAuthenticatedOperator
} from '@oes/common/security'
import { PermissionGuard, RequirePermission } from '@oes/common/security'
import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { GrpcExceptionFilter, OtelExceptionFilter } from '@oes/common/filters'
import {
  AdminListUserSessionsRequest,
  AdminListUserSessionsResponse,
  AdminRevokeSessionRequest,
  AdminRevokeSessionResponse,
  AuthServiceController,
  AuthServiceControllerMethods,
  EmailOtpChallengeRequest,
  EmailPasswordLoginRequest,
  EmailOtpLoginRequest,
  LoginStatus,
  LoginResponse,
  ListSessionsRequest,
  ListSessionsResponse,
  RenameSessionDeviceRequest,
  RenameSessionDeviceResponse,
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
  SelectAccountRequest,
  SelectAccountResponse,
  SubmitMfaChallengeRequest
} from '@oes/common/generated/auth_service'
import {
  AdminRevokeSessionCommand,
  LoginWithEmailPasswordCommand,
  LoginWithEmailOtpCommand,
  LoginWithPhoneOtpCommand,
  LoginWithPhonePasswordCommand,
  LogoutAllCommand,
  LogoutOtherDevicesCommand,
  LogoutCommand,
  RefreshSessionCommand,
  RenameSessionDeviceCommand,
  RequestEmailOtpLoginChallengeCommand,
  RequestPhoneOtpLoginChallengeCommand,
  SelectAccountCommand,
  SubmitMfaChallengeCommand
} from 'src/application/commands/auth'
import { AdminListUserSessionsQuery, ListSessionsQuery } from 'src/application/queries'
import { AUTH_LOGIN_FLOW_RESULT_UNSUPPORTED } from 'src/common/constants/exception-enums'

@Controller()
@UseFilters(OtelExceptionFilter, GrpcExceptionFilter)
@AuthServiceControllerMethods()
export class AuthGrpcController implements AuthServiceController {
  constructor(
    private readonly commandBus: ValidatingCommandBus,
    private readonly queryBus: ValidatingQueryBus
  ) {}

  @RequirePermission(AUTH_SESSION_PERMISSION_CODES.ADMIN_VIEW_USER_SESSIONS)
  @UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard, PermissionGuard)
  async adminListUserSessions(
    request: AdminListUserSessionsRequest
  ): Promise<AdminListUserSessionsResponse> {
    this.getRequiredOperatorId(request)
    const sessions = await this.queryBus.execute(new AdminListUserSessionsQuery(request.userId ?? ''))

    return {
      sessions: sessions.map((session) => ({
        sessionId: session.sessionId,
        userId: session.userId,
        accountId: session.accountId,
        tenantId: session.tenantId,
        status: session.status,
        deviceId: session.deviceId,
        deviceName: session.deviceName,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        createdAt: session.createdAt.toISOString(),
        lastActiveAt: session.lastActiveAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
        refreshExpiresAt: session.refreshExpiresAt.toISOString(),
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
        deviceId: session.deviceId,
        deviceName: session.deviceName,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        createdAt: session.createdAt.toISOString(),
        lastActiveAt: session.lastActiveAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
        refreshExpiresAt: session.refreshExpiresAt.toISOString(),
        isCurrent: session.isCurrent,
        isAdminControlled: session.isAdminControlled
      }))
    }
  }

  async renameSessionDevice(
    request: RenameSessionDeviceRequest
  ): Promise<RenameSessionDeviceResponse> {
    const result = await this.commandBus.execute(
      new RenameSessionDeviceCommand(
        request.userId ?? '',
        request.sessionId ?? '',
        request.deviceName ?? ''
      )
    )

    return {
      success: result.success,
      sessionId: result.sessionId,
      deviceName: result.deviceName
    }
  }

  @RequirePermission(AUTH_SESSION_PERMISSION_CODES.ADMIN_REVOKE_SESSION)
  @UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard, PermissionGuard)
  async adminRevokeSession(
    request: AdminRevokeSessionRequest
  ): Promise<AdminRevokeSessionResponse> {
    const operatorId = this.getRequiredOperatorId(request)
    const result = await this.commandBus.execute(
      new AdminRevokeSessionCommand(operatorId, request.sessionId ?? '', request.reason ?? '')
    )

    return {
      success: result.success,
      sessionId: result.sessionId
    }
  }

  async logout(request: LogoutRequest): Promise<LogoutResponse> {
    const result = await this.commandBus.execute(
      new LogoutCommand(request.sessionId ?? '')
    )

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
    const result = await this.commandBus.execute(
      new LogoutAllCommand(request.userId ?? '')
    )

    return {
      success: result.success,
      sessionCount: String(result.sessionCount)
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
        tenantId: account.tenantId,
        displayName: account.displayName ?? ''
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
        (request.loginMethod as any) ?? ''
      )
    )

    return {
      status: LoginStatus.LOGIN_STATUS_SUCCESS,
      userId: result.userId,
      accountId: result.accountId,
      tenantId: result.tenantId,
      sessionId: result.sessionId,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: String(result.expiresIn),
      displayName: result.displayName ?? '',
      nextStep: ''
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
          tenantId: account.tenantId,
          displayName: account.displayName ?? ''
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
          tenantId: account.tenantId,
          displayName: account.displayName ?? ''
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
          tenantId: account.tenantId,
          displayName: account.displayName ?? ''
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
          tenantId: account.tenantId,
          displayName: account.displayName ?? ''
        }))
      }
    }

    throw ExceptionFactory.application(AUTH_LOGIN_FLOW_RESULT_UNSUPPORTED)
  }

  private getRequiredOperatorId(rpcData: unknown): string {
    const operatorId = getAuthenticatedGrpcRequestContext(rpcData)?.operatorContext?.operator_id?.trim()

    if (!operatorId) {
      throw ExceptionFactory.application(OPERATOR_CONTEXT_MISSING)
    }

    return operatorId
  }
}
