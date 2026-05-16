import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory
} from '@oes/common/authorization'
import { toOperatorScopedMetadataInput } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import {
  AUTH_SERVICE_NAME,
  ActivateTotpBindingRequest,
  AdminListOnlineUsersResponse,
  AdminListUserSessionsResponse,
  AdminDeleteAccountSessionsRequest,
  AdminDeleteAccountSessionsResponse,
  AdminRevokeSessionResponse,
  AuditEventRecord,
  AuthServiceClient,
  BootstrapOwnLoginMethodsRequest,
  BootstrapOwnLoginMethodsResponse,
  BootstrapUserLoginMethodsRequest,
  BootstrapUserLoginMethodsResponse,
  ChangeOwnPasswordRequest,
  CompleteStepUpMfaChallengeRequest,
  ContactBindingVerificationResponse,
  CompleteFirstLoginPasswordSetupRequest,
  CompleteFirstLoginPasswordSetupResponse,
  CompletePasswordRecoveryRequest,
  DisableMfaBindingRequest,
  EnableMfaBindingRequest,
  InitializeRecoveryCodesRequest,
  InitializeTotpBindingRequest,
  InitializeTotpBindingResponse,
  InspectPasswordRecoveryChannelsRequest,
  InspectPasswordRecoveryChannelsResponse,
  LoginWithEmailOtpRequest,
  LoginWithEmailPasswordRequest,
  LoginWithPhoneOtpRequest,
  LoginWithPhonePasswordRequest,
  LoginResponse,
  GetPlatformDefaultTerminalMfaPolicyResponse,
  GetPlatformTerminalLoginPolicyResponse,
  GetTenantTerminalMfaPolicyResponse,
  HandleTerminalDeviceUnavailableResponse,
  ListLoginMethodsResponse,
  ListMfaBindingsResponse,
  ListLoginHistoryResponse,
  ListSessionsResponse,
  ListTrustedDevicesRequest,
  ListTrustedDevicesResponse,
  LoginMethodMutationResponse,
  LogoutAllResponse,
  LogoutOtherDevicesResponse,
  LogoutSessionRequest,
  LogoutSessionResponse,
  LogoutResponse,
  MfaBindingMutationResponse,
  MfaBindingType,
  MfaScenario,
  OtpChallengeResponse,
  PlatformMfaPolicyResponse,
  PasswordRecoveryChallengeResponse,
  PasswordRecoveryChannel,
  PasswordRecoveryCompletionResponse,
  PasswordRecoveryVerificationResponse,
  RefreshSessionResponse,
  RequestEmailBindingChallengeRequest,
  RequestEmailOtpLoginChallengeRequest,
  RequestPhoneBindingChallengeRequest,
  RequestPhoneOtpLoginChallengeRequest,
  ValidateAccessTokenRequest,
  ValidateAccessTokenResponse,
  RecoveryCodesResponse,
  RegenerateRecoveryCodesRequest,
  RevokeOtherTrustedDevicesRequest,
  RevokeTrustedDeviceRequest,
  RequestPasswordRecoveryChallengeRequest,
  RequirePasswordSetupRequest,
  SelectAccountResponse,
  SetOwnLoginMethodEnabledRequest,
  StepUpMfaChallengeResponse,
  StepUpMfaGrantResponse,
  TenantMfaPolicyResponse,
  TerminalLoginPolicyEntry,
  TerminalMfaPolicyEntry,
  UpdatePlatformDefaultTerminalMfaPolicyResponse,
  UpdatePlatformTerminalLoginPolicyResponse,
  UpdateTenantTerminalMfaPolicyResponse,
  VerifyPasswordRecoveryChallengeRequest,
  VerifyEmailBindingRequest,
  VerifyPhoneBindingRequest
} from '@oes/common/generated/auth_service'
import {
  DownstreamRequestSource,
  toInternalCallMetadataInput
} from '../../../../../common/grpc/gateway-downstream-source.mapper'

const CALLER = 'api-gateway'

@Injectable()
// Bridges auth-bff HTTP use cases to the downstream auth-service gRPC contract.
export class AuthGrpcAdapter implements OnModuleInit {
  private svc!: AuthServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.AUTH)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService<AuthServiceClient>(AUTH_SERVICE_NAME)
  }

  loginWithEmailPassword(
    request: {
      email: string
      password: string
      deviceName?: string
      userAgent?: string
      ipAddress?: string
      terminal?: string
      terminalDeviceId?: string
      deviceBoundTenantId?: string
      loginFlow?: string
    },
    source: DownstreamRequestSource
  ): Promise<LoginResponse> {
    const grpcRequest: LoginWithEmailPasswordRequest = request

    return this.call(
      'loginWithEmailPassword',
      this.svc.loginWithEmailPassword(grpcRequest, this.metadata(source))
    )
  }

  loginWithEmailOtp(
    email: string,
    otp: string,
    terminal: string | undefined,
    source: DownstreamRequestSource,
    deviceContext?: {
      terminalDeviceId?: string
      deviceBoundTenantId?: string
      loginFlow?: string
    }
  ): Promise<LoginResponse> {
    const request: LoginWithEmailOtpRequest = { email, otp, terminal, ...deviceContext }

    return this.call('loginWithEmailOtp', this.svc.loginWithEmailOtp(request, this.metadata(source)))
  }

  requestEmailOtpLoginChallenge(
    email: string,
    source: DownstreamRequestSource
  ): Promise<OtpChallengeResponse> {
    const grpcRequest: RequestEmailOtpLoginChallengeRequest = { email }

    return this.call(
      'requestEmailOtpLoginChallenge',
      this.svc.requestEmailOtpLoginChallenge(grpcRequest, this.metadata(source))
    )
  }

  requestEmailBindingChallenge(
    request: { email: string; userId: string },
    source: DownstreamRequestSource
  ): Promise<OtpChallengeResponse> {
    const grpcRequest: RequestEmailBindingChallengeRequest = {
      userId: request.userId,
      email: request.email
    }

    return this.call(
      'requestEmailBindingChallenge',
      this.svc.requestEmailBindingChallenge(grpcRequest, this.operatorMetadata(source))
    )
  }

  loginWithPhonePassword(
    request: {
      phone: string
      password: string
      deviceName?: string
      userAgent?: string
      ipAddress?: string
      terminal?: string
      terminalDeviceId?: string
      deviceBoundTenantId?: string
      loginFlow?: string
    },
    source: DownstreamRequestSource
  ): Promise<LoginResponse> {
    const grpcRequest: LoginWithPhonePasswordRequest = request

    return this.call(
      'loginWithPhonePassword',
      this.svc.loginWithPhonePassword(grpcRequest, this.metadata(source))
    )
  }

  loginWithPhoneOtp(
    phone: string,
    otp: string,
    terminal: string | undefined,
    source: DownstreamRequestSource,
    deviceContext?: {
      terminalDeviceId?: string
      deviceBoundTenantId?: string
      loginFlow?: string
    }
  ): Promise<LoginResponse> {
    const request: LoginWithPhoneOtpRequest = { phone, otp, terminal, ...deviceContext }

    return this.call('loginWithPhoneOtp', this.svc.loginWithPhoneOtp(request, this.metadata(source)))
  }

  requestPhoneOtpLoginChallenge(
    phone: string,
    source: DownstreamRequestSource
  ): Promise<OtpChallengeResponse> {
    const grpcRequest: RequestPhoneOtpLoginChallengeRequest = { phone }

    return this.call(
      'requestPhoneOtpLoginChallenge',
      this.svc.requestPhoneOtpLoginChallenge(grpcRequest, this.metadata(source))
    )
  }

  requestPhoneBindingChallenge(
    request: { phone: string; userId: string },
    source: DownstreamRequestSource
  ): Promise<OtpChallengeResponse> {
    const grpcRequest: RequestPhoneBindingChallengeRequest = {
      userId: request.userId,
      phone: request.phone
    }

    return this.call(
      'requestPhoneBindingChallenge',
      this.svc.requestPhoneBindingChallenge(grpcRequest, this.operatorMetadata(source))
    )
  }

  requestLoginMfaFactorChallenge(
    challengeId: string,
    factor: 'BACKUP_CODE' | 'EMAIL_OTP' | 'SMS_OTP' | 'TOTP',
    source: DownstreamRequestSource
  ): Promise<OtpChallengeResponse> {
    return this.call(
      'requestLoginMfaFactorChallenge',
      this.svc.requestLoginMfaFactorChallenge(
        {
          challengeId,
          factor: this.toGrpcMfaBindingType(factor)
        },
        this.metadata(source)
      )
    )
  }

  startStepUpMfaChallenge(
    request: {
      accountId: string
      scenario: 'CHANGE_CONTACT' | 'CHANGE_PASSWORD' | 'NEW_DEVICE_LOGIN'
      scopeLevel: 'SYSTEM' | 'TENANT'
      tenantId?: string
      userId: string
    },
    source: DownstreamRequestSource
  ): Promise<StepUpMfaChallengeResponse> {
    return this.call(
      'startStepUpMfaChallenge',
      this.svc.startStepUpMfaChallenge(
        {
          userId: request.userId,
          accountId: request.accountId,
          tenantId: request.tenantId,
          scenario: this.toGrpcMfaScenario(request.scenario),
          scopeLevel: request.scopeLevel
        },
        this.operatorMetadata(source)
      )
    )
  }

  completeStepUpMfaChallenge(
    request: {
      challengeId: string
      factor: 'BACKUP_CODE' | 'EMAIL_OTP' | 'SMS_OTP' | 'TOTP'
      code: string
      factorChallengeId?: string
    },
    source: DownstreamRequestSource
  ): Promise<StepUpMfaGrantResponse> {
    const grpcRequest: CompleteStepUpMfaChallengeRequest = {
      challengeId: request.challengeId,
      factor: this.toGrpcMfaBindingType(request.factor),
      code: request.code,
      factorChallengeId: request.factorChallengeId
    }

    return this.call(
      'completeStepUpMfaChallenge',
      this.svc.completeStepUpMfaChallenge(grpcRequest, this.operatorMetadata(source))
    )
  }

  submitMfaChallenge(
    challengeId: string,
    factor: 'BACKUP_CODE' | 'EMAIL_OTP' | 'SMS_OTP' | 'TOTP',
    code: string,
    loginMethod: string,
    factorChallengeId: string | undefined,
    trustCurrentDevice: boolean | undefined,
    source: DownstreamRequestSource
  ): Promise<LoginResponse> {
    return this.call(
      'submitMfaChallenge',
      this.svc.submitMfaChallenge(
        {
          challengeId,
          factor: this.toGrpcMfaBindingType(factor),
          code,
          loginMethod,
          factorChallengeId,
          trustCurrentDevice
        },
        this.metadata(source)
      )
    )
  }

  selectAccount(
    request: {
      userId: string
      accountId: string
      loginMethod: string
      currentSessionId?: string
      deviceId?: string
      deviceName?: string
      userAgent?: string
      ipAddress?: string
      terminal?: string
    },
    source: DownstreamRequestSource
  ): Promise<SelectAccountResponse> {
    return this.call('selectAccount', this.svc.selectAccount(request, this.metadata(source)))
  }

  bootstrapUserLoginMethods(
    request: {
      userId: string
      accountId: string
      displayName?: string
      email?: string
      phone?: string
    },
    source: DownstreamRequestSource
  ): Promise<BootstrapUserLoginMethodsResponse> {
    const grpcRequest: BootstrapUserLoginMethodsRequest = {
      userId: request.userId,
      accountId: request.accountId,
      displayName: request.displayName,
      email: request.email,
      phone: request.phone
    }

    return this.call(
      'bootstrapUserLoginMethods',
      this.svc.bootstrapUserLoginMethods(grpcRequest, this.operatorMetadata(source))
    )
  }

  bootstrapOwnLoginMethods(
    request: {
      userId: string
      accountId: string
      email?: string
      phone?: string
    },
    source: DownstreamRequestSource
  ): Promise<BootstrapOwnLoginMethodsResponse> {
    const grpcRequest: BootstrapOwnLoginMethodsRequest = {
      userId: request.userId,
      accountId: request.accountId,
      email: request.email,
      phone: request.phone
    }

    return this.call(
      'bootstrapOwnLoginMethods',
      this.svc.bootstrapOwnLoginMethods(grpcRequest, this.operatorMetadata(source))
    )
  }

  completeFirstLoginPasswordSetup(
    request: { newPassword: string; userId: string },
    source: DownstreamRequestSource
  ): Promise<CompleteFirstLoginPasswordSetupResponse> {
    const grpcRequest: CompleteFirstLoginPasswordSetupRequest = {
      userId: request.userId,
      newPassword: request.newPassword
    }

    return this.call(
      'completeFirstLoginPasswordSetup',
      this.svc.completeFirstLoginPasswordSetup(grpcRequest, this.operatorMetadata(source))
    )
  }

  inspectPasswordRecoveryChannels(
    request: { identifier: string },
    source: DownstreamRequestSource
  ): Promise<InspectPasswordRecoveryChannelsResponse> {
    const grpcRequest: InspectPasswordRecoveryChannelsRequest = {
      identifier: request.identifier
    }

    return this.call(
      'inspectPasswordRecoveryChannels',
      this.svc.inspectPasswordRecoveryChannels(grpcRequest, this.metadata(source))
    )
  }

  requestPasswordRecoveryChallenge(
    request: { channel: 'EMAIL' | 'PHONE'; identifier: string },
    source: DownstreamRequestSource
  ): Promise<PasswordRecoveryChallengeResponse> {
    const grpcRequest: RequestPasswordRecoveryChallengeRequest = {
      channel:
        request.channel === 'PHONE'
          ? PasswordRecoveryChannel.PASSWORD_RECOVERY_CHANNEL_PHONE
          : PasswordRecoveryChannel.PASSWORD_RECOVERY_CHANNEL_EMAIL,
      identifier: request.identifier
    }

    return this.call(
      'requestPasswordRecoveryChallenge',
      this.svc.requestPasswordRecoveryChallenge(grpcRequest, this.metadata(source))
    )
  }

  verifyPasswordRecoveryChallenge(
    request: { challengeId: string; otp: string },
    source: DownstreamRequestSource
  ): Promise<PasswordRecoveryVerificationResponse> {
    const grpcRequest: VerifyPasswordRecoveryChallengeRequest = {
      challengeId: request.challengeId,
      otp: request.otp
    }

    return this.call(
      'verifyPasswordRecoveryChallenge',
      this.svc.verifyPasswordRecoveryChallenge(grpcRequest, this.metadata(source))
    )
  }

  completePasswordRecovery(
    request: { resetToken: string; newPassword: string },
    source: DownstreamRequestSource
  ): Promise<PasswordRecoveryCompletionResponse> {
    const grpcRequest: CompletePasswordRecoveryRequest = {
      resetToken: request.resetToken,
      newPassword: request.newPassword
    }

    return this.call(
      'completePasswordRecovery',
      this.svc.completePasswordRecovery(grpcRequest, this.metadata(source))
    )
  }

  refreshSession(
    refreshToken: string,
    source: DownstreamRequestSource
  ): Promise<RefreshSessionResponse> {
    return this.call('refreshSession', this.svc.refreshSession({ refreshToken }, this.metadata(source)))
  }

  validateAccessToken(
    accessToken: string,
    source: DownstreamRequestSource
  ): Promise<ValidateAccessTokenResponse> {
    const request: ValidateAccessTokenRequest = { accessToken }
    return this.call(
      'validateAccessToken',
      this.svc.validateAccessToken(request, this.metadata(source))
    )
  }

  listSessions(
    userId: string,
    currentSessionId: string | undefined,
    source: DownstreamRequestSource
  ): Promise<ListSessionsResponse> {
    return this.call(
      'listSessions',
      this.svc.listSessions({ userId, currentSessionId }, this.metadata(source))
    )
  }

  listLoginHistory(
    request: {
      userId: string
      result?: string
      occurredAtFrom?: string
      occurredAtTo?: string
      cursor?: string
      pageSize?: number
    },
    source: DownstreamRequestSource
  ): Promise<ListLoginHistoryResponse> {
    return this.call(
      'listLoginHistory',
      this.svc.listLoginHistory(request, this.metadata(source))
    )
  }

  listLoginMethods(
    userId: string,
    source: DownstreamRequestSource
  ): Promise<ListLoginMethodsResponse> {
    return this.call(
      'listLoginMethods',
      this.svc.listLoginMethods({ userId }, this.metadata(source))
    )
  }

  changeOwnPassword(
    request: {
      accountId?: string
      currentPassword: string
      mfaGrantToken?: string
      newPassword: string
      scopeLevel: 'SYSTEM' | 'TENANT'
      tenantId?: string
      userId: string
    },
    source: DownstreamRequestSource
  ): Promise<{ success?: boolean; passwordSetupRequired?: boolean }> {
    const grpcRequest: ChangeOwnPasswordRequest = {
      userId: request.userId,
      accountId: request.accountId,
      tenantId: request.tenantId,
      scopeLevel: request.scopeLevel,
      currentPassword: request.currentPassword,
      newPassword: request.newPassword,
      mfaGrantToken: request.mfaGrantToken
    }

    return this.call(
      'changeOwnPassword',
      this.svc.changeOwnPassword(grpcRequest, this.metadata(source))
    )
  }

  verifyEmailBinding(
    request: {
      accountId?: string
      email: string
      mfaGrantToken?: string
      otp: string
      scopeLevel: 'SYSTEM' | 'TENANT'
      tenantId?: string
      userId: string
    },
    source: DownstreamRequestSource
  ): Promise<ContactBindingVerificationResponse> {
    const grpcRequest: VerifyEmailBindingRequest = {
      userId: request.userId,
      accountId: request.accountId,
      tenantId: request.tenantId,
      scopeLevel: request.scopeLevel,
      email: request.email,
      otp: request.otp,
      mfaGrantToken: request.mfaGrantToken
    }

    return this.call(
      'verifyEmailBinding',
      this.svc.verifyEmailBinding(grpcRequest, this.operatorMetadata(source))
    )
  }

  verifyPhoneBinding(
    request: {
      accountId?: string
      mfaGrantToken?: string
      otp: string
      phone: string
      scopeLevel: 'SYSTEM' | 'TENANT'
      tenantId?: string
      userId: string
    },
    source: DownstreamRequestSource
  ): Promise<ContactBindingVerificationResponse> {
    const grpcRequest: VerifyPhoneBindingRequest = {
      userId: request.userId,
      accountId: request.accountId,
      tenantId: request.tenantId,
      scopeLevel: request.scopeLevel,
      phone: request.phone,
      otp: request.otp,
      mfaGrantToken: request.mfaGrantToken
    }

    return this.call(
      'verifyPhoneBinding',
      this.svc.verifyPhoneBinding(grpcRequest, this.operatorMetadata(source))
    )
  }

  logout(sessionId: string, source: DownstreamRequestSource): Promise<LogoutResponse> {
    return this.call('logout', this.svc.logout({ sessionId }, this.metadata(source)))
  }

  listTrustedDevices(
    userId: string,
    scopeLevel: 'SYSTEM' | 'TENANT',
    tenantId: string | undefined,
    currentDeviceId: string | undefined,
    source: DownstreamRequestSource
  ): Promise<ListTrustedDevicesResponse> {
    const request: ListTrustedDevicesRequest = {
      userId,
      tenantId,
      currentDeviceId,
      scopeLevel
    }

    return this.call(
      'listTrustedDevices',
      this.svc.listTrustedDevices(request, this.metadata(source))
    )
  }

  revokeTrustedDevice(
    userId: string,
    scopeLevel: 'SYSTEM' | 'TENANT',
    tenantId: string | undefined,
    trustedDeviceId: string,
    source: DownstreamRequestSource
  ): Promise<{ deviceCount?: string; success?: boolean }> {
    const request: RevokeTrustedDeviceRequest = {
      userId,
      tenantId,
      trustedDeviceId,
      scopeLevel
    }

    return this.call(
      'revokeTrustedDevice',
      this.svc.revokeTrustedDevice(request, this.metadata(source))
    )
  }

  revokeOtherTrustedDevices(
    userId: string,
    scopeLevel: 'SYSTEM' | 'TENANT',
    tenantId: string | undefined,
    currentDeviceId: string | undefined,
    source: DownstreamRequestSource
  ): Promise<{ deviceCount?: string; success?: boolean }> {
    const request: RevokeOtherTrustedDevicesRequest = {
      userId,
      tenantId,
      currentDeviceId,
      scopeLevel
    }

    return this.call(
      'revokeOtherTrustedDevices',
      this.svc.revokeOtherTrustedDevices(request, this.metadata(source))
    )
  }

  logoutOtherDevices(
    userId: string,
    currentSessionId: string,
    source: DownstreamRequestSource
  ): Promise<LogoutOtherDevicesResponse> {
    return this.call(
      'logoutOtherDevices',
      this.svc.logoutOtherDevices({ userId, currentSessionId }, this.metadata(source))
    )
  }

  logoutAll(
    userId: string,
    currentSessionId: string,
    source: DownstreamRequestSource
  ): Promise<LogoutAllResponse> {
    return this.call(
      'logoutAll',
      this.svc.logoutAll({ userId, currentSessionId }, this.metadata(source))
    )
  }

  logoutSession(
    userId: string,
    currentSessionId: string,
    targetSessionId: string,
    source: DownstreamRequestSource
  ): Promise<LogoutSessionResponse> {
    const request: LogoutSessionRequest = { userId, currentSessionId, targetSessionId }
    return this.call(
      'logoutSession',
      this.svc.logoutSession(request, this.metadata(source))
    )
  }

  listMfaBindings(userId: string, source: DownstreamRequestSource): Promise<ListMfaBindingsResponse> {
    return this.call('listMfaBindings', this.svc.listMfaBindings({ userId }, this.metadata(source)))
  }

  enableMfaBinding(
    userId: string,
    type: MfaBindingType,
    source: DownstreamRequestSource
  ): Promise<MfaBindingMutationResponse> {
    const request: EnableMfaBindingRequest = { userId, type }
    return this.call('enableMfaBinding', this.svc.enableMfaBinding(request, this.metadata(source)))
  }

  disableMfaBinding(
    userId: string,
    type: MfaBindingType,
    source: DownstreamRequestSource
  ): Promise<MfaBindingMutationResponse> {
    const request: DisableMfaBindingRequest = { userId, type }
    return this.call('disableMfaBinding', this.svc.disableMfaBinding(request, this.metadata(source)))
  }

  initializeTotpBinding(
    userId: string,
    source: DownstreamRequestSource
  ): Promise<InitializeTotpBindingResponse> {
    const request: InitializeTotpBindingRequest = { userId }
    return this.call(
      'initializeTotpBinding',
      this.svc.initializeTotpBinding(request, this.metadata(source))
    )
  }

  activateTotpBinding(
    userId: string,
    bindingId: string,
    code: string,
    source: DownstreamRequestSource
  ): Promise<MfaBindingMutationResponse> {
    const request: ActivateTotpBindingRequest = { userId, bindingId, code }
    return this.call('activateTotpBinding', this.svc.activateTotpBinding(request, this.metadata(source)))
  }

  initializeRecoveryCodes(
    userId: string,
    source: DownstreamRequestSource
  ): Promise<RecoveryCodesResponse> {
    const request: InitializeRecoveryCodesRequest = { userId }
    return this.call(
      'initializeRecoveryCodes',
      this.svc.initializeRecoveryCodes(request, this.metadata(source))
    )
  }

  regenerateRecoveryCodes(
    userId: string,
    source: DownstreamRequestSource
  ): Promise<RecoveryCodesResponse> {
    const request: RegenerateRecoveryCodesRequest = { userId }
    return this.call(
      'regenerateRecoveryCodes',
      this.svc.regenerateRecoveryCodes(request, this.metadata(source))
    )
  }

  adminListUserSessions(
    userId: string,
    source: DownstreamRequestSource
  ): Promise<AdminListUserSessionsResponse> {
    return this.call(
      'adminListUserSessions',
      this.svc.adminListUserSessions({ userId }, this.operatorMetadata(source))
    )
  }

  adminListOnlineUsers(
    request: { tenantId?: string },
    source: DownstreamRequestSource
  ): Promise<AdminListOnlineUsersResponse> {
    return this.call(
      'adminListOnlineUsers',
      this.svc.adminListOnlineUsers(
        { tenantId: request.tenantId },
        this.operatorMetadata(source)
      )
    )
  }

  adminRevokeSession(
    sessionId: string,
    reason: string,
    source: DownstreamRequestSource
  ): Promise<AdminRevokeSessionResponse> {
    return this.call(
      'adminRevokeSession',
      this.svc.adminRevokeSession({ sessionId, reason }, this.operatorMetadata(source))
    )
  }

  handleTerminalDeviceUnavailable(
    request: {
      terminal: string
      terminalDeviceId: string
      deviceBoundTenantId: string
      reasonCode: string
    },
    source: DownstreamRequestSource
  ): Promise<HandleTerminalDeviceUnavailableResponse> {
    return this.call(
      'handleTerminalDeviceUnavailable',
      this.svc.handleTerminalDeviceUnavailable(
        {
          terminal: request.terminal,
          terminalDeviceId: request.terminalDeviceId,
          deviceBoundTenantId: request.deviceBoundTenantId,
          reasonCode: request.reasonCode
        },
        this.metadata(source)
      )
    )
  }

  adminDeleteAccountSessions(
    request: {
      userId: string
      accountId: string
      reason: string
    },
    source: DownstreamRequestSource
  ): Promise<AdminDeleteAccountSessionsResponse> {
    const grpcRequest: AdminDeleteAccountSessionsRequest = {
      userId: request.userId,
      accountId: request.accountId,
      reason: request.reason
    }

    return this.call(
      'adminDeleteAccountSessions',
      this.svc.adminDeleteAccountSessions(grpcRequest, this.operatorMetadata(source))
    )
  }

  requirePasswordSetup(
    request: {
      userId: string
      reason?: string
      revokeSessions?: boolean
    },
    source: DownstreamRequestSource
  ): Promise<{ success?: boolean; passwordSetupRequired?: boolean }> {
    const grpcRequest: RequirePasswordSetupRequest = {
      userId: request.userId,
      reason: request.reason,
      revokeSessions: request.revokeSessions
    }

    return this.call(
      'requirePasswordSetup',
      this.svc.requirePasswordSetup(grpcRequest, this.operatorMetadata(source))
    )
  }

  setLoginMethodEnabled(
    request: {
      userId: string
      methodId: string
      enabled: boolean
      reason?: string
    },
    source: DownstreamRequestSource
  ): Promise<LoginMethodMutationResponse> {
    return this.call(
      'setLoginMethodEnabled',
      this.svc.setLoginMethodEnabled(request, this.operatorMetadata(source))
    )
  }

  setOwnLoginMethodEnabled(
    request: {
      userId: string
      methodId: string
      enabled: boolean
      reason?: string
    },
    source: DownstreamRequestSource
  ): Promise<LoginMethodMutationResponse> {
    const grpcRequest: SetOwnLoginMethodEnabledRequest = request

    return this.call(
      'setOwnLoginMethodEnabled',
      this.svc.setOwnLoginMethodEnabled(grpcRequest, this.operatorMetadata(source))
    )
  }

  getTenantMfaPolicy(
    tenantId: string,
    source: DownstreamRequestSource
  ): Promise<TenantMfaPolicyResponse> {
    return this.call(
      'getTenantMfaPolicy',
      this.svc.getTenantMfaPolicy({ tenantId }, this.operatorMetadata(source))
    )
  }

  getPlatformMfaPolicy(source: DownstreamRequestSource): Promise<PlatformMfaPolicyResponse> {
    return this.call(
      'getPlatformMfaPolicy',
      this.svc.getPlatformMfaPolicy({}, this.operatorMetadata(source))
    )
  }

  updateTenantMfaPolicy(
    request: {
      factors: Array<{
        enabled: boolean
        factor: 'BACKUP_CODE' | 'EMAIL_OTP' | 'SMS_OTP' | 'TOTP'
        priority: number
      }>
      loginRequired: boolean
      scenarioRequirements?: Array<{
        required: boolean
        scenario: 'CHANGE_CONTACT' | 'CHANGE_PASSWORD' | 'LOGIN' | 'NEW_DEVICE_LOGIN'
      }>
      tenantId: string
    },
    source: DownstreamRequestSource
  ): Promise<TenantMfaPolicyResponse> {
    return this.call(
      'updateTenantMfaPolicy',
      this.svc.updateTenantMfaPolicy(
        {
          tenantId: request.tenantId,
          loginRequired: request.loginRequired,
          scenarioRequirements: (request.scenarioRequirements ?? []).map((item) => ({
            scenario: this.toGrpcMfaScenario(item.scenario),
            required: item.required
          })),
          factors: request.factors.map((factor) => ({
            factor: this.toGrpcMfaBindingType(factor.factor),
            enabled: factor.enabled,
            priority: factor.priority
          }))
        },
        this.operatorMetadata(source)
      )
    )
  }

  updatePlatformMfaPolicy(
    request: {
      factors: Array<{
        enabled: boolean
        factor: 'BACKUP_CODE' | 'EMAIL_OTP' | 'SMS_OTP' | 'TOTP'
        priority: number
      }>
      loginRequired: boolean
      scenarioRequirements?: Array<{
        required: boolean
        scenario: 'CHANGE_CONTACT' | 'CHANGE_PASSWORD' | 'LOGIN' | 'NEW_DEVICE_LOGIN'
      }>
    },
    source: DownstreamRequestSource
  ): Promise<PlatformMfaPolicyResponse> {
    return this.call(
      'updatePlatformMfaPolicy',
      this.svc.updatePlatformMfaPolicy(
        {
          loginRequired: request.loginRequired,
          scenarioRequirements: (request.scenarioRequirements ?? []).map((item) => ({
            scenario: this.toGrpcMfaScenario(item.scenario),
            required: item.required
          })),
          factors: request.factors.map((factor) => ({
            factor: this.toGrpcMfaBindingType(factor.factor),
            enabled: factor.enabled,
            priority: factor.priority
          }))
        },
        this.operatorMetadata(source)
      )
    )
  }

  getPlatformTerminalLoginPolicy(
    source: DownstreamRequestSource
  ): Promise<GetPlatformTerminalLoginPolicyResponse> {
    return this.call(
      'getPlatformTerminalLoginPolicy',
      this.svc.getPlatformTerminalLoginPolicy({}, this.operatorMetadata(source))
    )
  }

  updatePlatformTerminalLoginPolicy(
    request: {
      entries: Array<{
        enabledLoginFlows: string[]
        terminal: string
      }>
    },
    source: DownstreamRequestSource
  ): Promise<UpdatePlatformTerminalLoginPolicyResponse> {
    return this.call(
      'updatePlatformTerminalLoginPolicy',
      this.svc.updatePlatformTerminalLoginPolicy(
        {
          entries: request.entries.map(
            (entry): TerminalLoginPolicyEntry => ({
              terminal: entry.terminal,
              enabledLoginFlows: entry.enabledLoginFlows
            })
          )
        },
        this.operatorMetadata(source)
      )
    )
  }

  getPlatformDefaultTerminalMfaPolicy(
    source: DownstreamRequestSource
  ): Promise<GetPlatformDefaultTerminalMfaPolicyResponse> {
    return this.call(
      'getPlatformDefaultTerminalMfaPolicy',
      this.svc.getPlatformDefaultTerminalMfaPolicy({}, this.operatorMetadata(source))
    )
  }

  updatePlatformDefaultTerminalMfaPolicy(
    request: {
      entries: Array<{
        allowedFactors: Array<'BACKUP_CODE' | 'EMAIL_OTP' | 'SMS_OTP' | 'TOTP'>
        factorPriority: Array<'BACKUP_CODE' | 'EMAIL_OTP' | 'SMS_OTP' | 'TOTP'>
        loginMfaRequired: boolean
        newDeviceMfaRequired: boolean
        terminal: string
      }>
    },
    source: DownstreamRequestSource
  ): Promise<UpdatePlatformDefaultTerminalMfaPolicyResponse> {
    return this.call(
      'updatePlatformDefaultTerminalMfaPolicy',
      this.svc.updatePlatformDefaultTerminalMfaPolicy(
        {
          entries: request.entries.map((entry) => this.toGrpcTerminalMfaPolicyEntry(entry))
        },
        this.operatorMetadata(source)
      )
    )
  }

  getTenantTerminalMfaPolicy(
    tenantId: string,
    source: DownstreamRequestSource
  ): Promise<GetTenantTerminalMfaPolicyResponse> {
    return this.call(
      'getTenantTerminalMfaPolicy',
      this.svc.getTenantTerminalMfaPolicy({ tenantId }, this.operatorMetadata(source))
    )
  }

  updateTenantTerminalMfaPolicy(
    request: {
      entries: Array<{
        allowedFactors: Array<'BACKUP_CODE' | 'EMAIL_OTP' | 'SMS_OTP' | 'TOTP'>
        factorPriority: Array<'BACKUP_CODE' | 'EMAIL_OTP' | 'SMS_OTP' | 'TOTP'>
        loginMfaRequired: boolean
        newDeviceMfaRequired: boolean
        terminal: string
      }>
      tenantId: string
    },
    source: DownstreamRequestSource
  ): Promise<UpdateTenantTerminalMfaPolicyResponse> {
    return this.call(
      'updateTenantTerminalMfaPolicy',
      this.svc.updateTenantTerminalMfaPolicy(
        {
          tenantId: request.tenantId,
          entries: request.entries.map((entry) => this.toGrpcTerminalMfaPolicyEntry(entry))
        },
        this.operatorMetadata(source)
      )
    )
  }

  listAuditEvents(
    request: {
      service?: string
      module?: string
      eventType?: string
      result?: string
      operatorId?: string
      tenantId?: string
      orgId?: string
      resourceType?: string
      resourceId?: string
      occurredAtFrom?: string
      occurredAtTo?: string
      cursor?: string
      pageSize?: number
    },
    source: DownstreamRequestSource
  ): Promise<{ items?: AuditEventRecord[]; nextCursor?: string }> {
    return this.call(
      'listAuditEvents',
      this.svc.listAuditEvents(request, this.operatorMetadata(source))
    )
  }

  private metadata(source: DownstreamRequestSource) {
    return this.metadataFactory.createInternalCallMetadata(toInternalCallMetadataInput(source))
  }

  private operatorMetadata(source: DownstreamRequestSource) {
    return this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
  }

  private toGrpcMfaBindingType(
    factor: 'BACKUP_CODE' | 'EMAIL_OTP' | 'SMS_OTP' | 'TOTP'
  ): MfaBindingType {
    switch (factor) {
      case 'EMAIL_OTP':
        return MfaBindingType.MFA_BINDING_TYPE_EMAIL_OTP
      case 'SMS_OTP':
        return MfaBindingType.MFA_BINDING_TYPE_SMS_OTP
      case 'TOTP':
        return MfaBindingType.MFA_BINDING_TYPE_TOTP
      case 'BACKUP_CODE':
        return MfaBindingType.MFA_BINDING_TYPE_BACKUP_CODE
    }
  }

  private toGrpcMfaScenario(
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

  private toGrpcTerminalMfaPolicyEntry(entry: {
    allowedFactors: Array<'BACKUP_CODE' | 'EMAIL_OTP' | 'SMS_OTP' | 'TOTP'>
    factorPriority: Array<'BACKUP_CODE' | 'EMAIL_OTP' | 'SMS_OTP' | 'TOTP'>
    loginMfaRequired: boolean
    newDeviceMfaRequired: boolean
    terminal: string
  }): TerminalMfaPolicyEntry {
    return {
      terminal: entry.terminal,
      loginMfaRequired: entry.loginMfaRequired,
      newDeviceMfaRequired: entry.newDeviceMfaRequired,
      allowedFactors: entry.allowedFactors.map((factor) => this.toGrpcMfaBindingType(factor)),
      factorPriority: entry.factorPriority.map((factor) => this.toGrpcMfaBindingType(factor))
    }
  }

  private call<T>(method: string, call$: any): Promise<T> {
    return safeGrpcCall(call$, this.opts(method))
  }

  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
