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
  AdminListUserSessionsResponse,
  AdminRevokeSessionResponse,
  AuditEventRecord,
  AuthServiceClient,
  DisableMfaBindingRequest,
  EmailOtpLoginRequest,
  EmailPasswordLoginRequest,
  EnableMfaBindingRequest,
  InitializeRecoveryCodesRequest,
  InitializeTotpBindingRequest,
  InitializeTotpBindingResponse,
  LoginResponse,
  ListMfaBindingsResponse,
  ListSessionsResponse,
  LogoutAllResponse,
  LogoutOtherDevicesResponse,
  LogoutResponse,
  MfaBindingMutationResponse,
  MfaBindingType,
  OtpChallengeResponse,
  PhoneOtpLoginRequest,
  PhonePasswordLoginRequest,
  RefreshSessionResponse,
  RecoveryCodesResponse,
  RegenerateRecoveryCodesRequest,
  SelectAccountResponse
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
    email: string,
    password: string,
    source: DownstreamRequestSource
  ): Promise<LoginResponse> {
    const request: EmailPasswordLoginRequest = { email, password }

    return this.call('loginWithEmailPassword', this.svc.loginWithEmailPassword(request, this.metadata(source)))
  }

  loginWithEmailOtp(email: string, otp: string, source: DownstreamRequestSource): Promise<LoginResponse> {
    const request: EmailOtpLoginRequest = { email, otp }

    return this.call('loginWithEmailOtp', this.svc.loginWithEmailOtp(request, this.metadata(source)))
  }

  requestEmailOtpLoginChallenge(
    email: string,
    source: DownstreamRequestSource
  ): Promise<OtpChallengeResponse> {
    return this.call(
      'requestEmailOtpLoginChallenge',
      this.svc.requestEmailOtpLoginChallenge({ email }, this.metadata(source))
    )
  }

  loginWithPhonePassword(
    phone: string,
    password: string,
    source: DownstreamRequestSource
  ): Promise<LoginResponse> {
    const request: PhonePasswordLoginRequest = { phone, password }

    return this.call('loginWithPhonePassword', this.svc.loginWithPhonePassword(request, this.metadata(source)))
  }

  loginWithPhoneOtp(phone: string, otp: string, source: DownstreamRequestSource): Promise<LoginResponse> {
    const request: PhoneOtpLoginRequest = { phone, otp }

    return this.call('loginWithPhoneOtp', this.svc.loginWithPhoneOtp(request, this.metadata(source)))
  }

  requestPhoneOtpLoginChallenge(
    phone: string,
    source: DownstreamRequestSource
  ): Promise<OtpChallengeResponse> {
    return this.call(
      'requestPhoneOtpLoginChallenge',
      this.svc.requestPhoneOtpLoginChallenge({ phone }, this.metadata(source))
    )
  }

  submitMfaChallenge(
    challengeId: string,
    code: string,
    loginMethod: string,
    source: DownstreamRequestSource
  ): Promise<LoginResponse> {
    return this.call(
      'submitMfaChallenge',
      this.svc.submitMfaChallenge({ challengeId, code, loginMethod }, this.metadata(source))
    )
  }

  selectAccount(
    request: {
      userId: string
      accountId: string
      loginMethod: string
      deviceId?: string
      deviceName?: string
      userAgent?: string
      ipAddress?: string
    },
    source: DownstreamRequestSource
  ): Promise<SelectAccountResponse> {
    return this.call('selectAccount', this.svc.selectAccount(request, this.metadata(source)))
  }

  refreshSession(
    refreshToken: string,
    source: DownstreamRequestSource
  ): Promise<RefreshSessionResponse> {
    return this.call('refreshSession', this.svc.refreshSession({ refreshToken }, this.metadata(source)))
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

  logout(sessionId: string, source: DownstreamRequestSource): Promise<LogoutResponse> {
    return this.call('logout', this.svc.logout({ sessionId }, this.metadata(source)))
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

  logoutAll(userId: string, source: DownstreamRequestSource): Promise<LogoutAllResponse> {
    return this.call('logoutAll', this.svc.logoutAll({ userId }, this.metadata(source)))
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

  private call<T>(method: string, call$: any): Promise<T> {
    return safeGrpcCall(call$, this.opts(method))
  }

  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
