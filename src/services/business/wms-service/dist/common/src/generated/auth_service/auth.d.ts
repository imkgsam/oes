import { Observable } from "rxjs";
export declare enum PasswordRecoveryChannel {
    PASSWORD_RECOVERY_CHANNEL_UNSPECIFIED = 0,
    PASSWORD_RECOVERY_CHANNEL_EMAIL = 1,
    PASSWORD_RECOVERY_CHANNEL_PHONE = 2
}
export declare enum MfaBindingType {
    MFA_BINDING_TYPE_UNSPECIFIED = 0,
    MFA_BINDING_TYPE_EMAIL_OTP = 1,
    MFA_BINDING_TYPE_SMS_OTP = 2,
    MFA_BINDING_TYPE_TOTP = 3,
    MFA_BINDING_TYPE_BACKUP_CODE = 4
}
export declare enum MfaScenario {
    MFA_SCENARIO_UNSPECIFIED = 0,
    MFA_SCENARIO_LOGIN = 1,
    MFA_SCENARIO_NEW_DEVICE_LOGIN = 2,
    MFA_SCENARIO_CHANGE_PASSWORD = 3,
    MFA_SCENARIO_CHANGE_CONTACT = 4
}
export declare enum LoginStatus {
    LOGIN_STATUS_UNSPECIFIED = 0,
    LOGIN_STATUS_SUCCESS = 1,
    LOGIN_STATUS_MFA_REQUIRED = 2,
    LOGIN_STATUS_ACCOUNT_SELECTION_REQUIRED = 3,
    LOGIN_STATUS_DENIED = 4
}
export interface LoginWithEmailPasswordRequest {
    email?: string | undefined;
    password?: string | undefined;
    deviceName?: string | undefined;
    userAgent?: string | undefined;
    ipAddress?: string | undefined;
}
export interface EmailPasswordLoginRequest {
    email?: string | undefined;
    password?: string | undefined;
    deviceName?: string | undefined;
    userAgent?: string | undefined;
    ipAddress?: string | undefined;
}
export interface RequestEmailOtpLoginChallengeRequest {
    email?: string | undefined;
}
export interface EmailOtpChallengeRequest {
    email?: string | undefined;
}
export interface RequestEmailBindingChallengeRequest {
    userId?: string | undefined;
    email?: string | undefined;
}
export interface EmailBindingChallengeRequest {
    userId?: string | undefined;
    email?: string | undefined;
}
export interface LoginWithEmailOtpRequest {
    email?: string | undefined;
    otp?: string | undefined;
}
export interface EmailOtpLoginRequest {
    email?: string | undefined;
    otp?: string | undefined;
}
export interface LoginWithPhonePasswordRequest {
    phone?: string | undefined;
    password?: string | undefined;
    deviceName?: string | undefined;
    userAgent?: string | undefined;
    ipAddress?: string | undefined;
}
export interface PhonePasswordLoginRequest {
    phone?: string | undefined;
    password?: string | undefined;
    deviceName?: string | undefined;
    userAgent?: string | undefined;
    ipAddress?: string | undefined;
}
export interface RequestPhoneOtpLoginChallengeRequest {
    phone?: string | undefined;
}
export interface PhoneOtpChallengeRequest {
    phone?: string | undefined;
}
export interface RequestPhoneBindingChallengeRequest {
    userId?: string | undefined;
    phone?: string | undefined;
}
export interface PhoneBindingChallengeRequest {
    userId?: string | undefined;
    phone?: string | undefined;
}
export interface RequestEmailOtpLoginChallengeResponse {
    challengeId?: string | undefined;
    expiresAt?: string | undefined;
    destination?: string | undefined;
}
export interface RequestEmailBindingChallengeResponse {
    challengeId?: string | undefined;
    expiresAt?: string | undefined;
    destination?: string | undefined;
}
export interface RequestPhoneOtpLoginChallengeResponse {
    challengeId?: string | undefined;
    expiresAt?: string | undefined;
    destination?: string | undefined;
}
export interface RequestPhoneBindingChallengeResponse {
    challengeId?: string | undefined;
    expiresAt?: string | undefined;
    destination?: string | undefined;
}
export interface OtpChallengeResponse {
    challengeId?: string | undefined;
    expiresAt?: string | undefined;
    destination?: string | undefined;
}
export interface InspectPasswordRecoveryChannelsRequest {
    identifier?: string | undefined;
}
export interface PasswordRecoveryChannelOption {
    channel?: PasswordRecoveryChannel | undefined;
    maskedDestination?: string | undefined;
}
export interface InspectPasswordRecoveryChannelsResponse {
    channels?: PasswordRecoveryChannelOption[] | undefined;
    defaultChannel?: PasswordRecoveryChannel | undefined;
}
export interface RequestPasswordRecoveryChallengeRequest {
    channel?: PasswordRecoveryChannel | undefined;
    identifier?: string | undefined;
}
export interface PasswordRecoveryChallengeResponse {
    accepted?: boolean | undefined;
    challengeId?: string | undefined;
    expiresAt?: string | undefined;
    maskedDestination?: string | undefined;
}
export interface RequestPasswordRecoveryChallengeResponse {
    accepted?: boolean | undefined;
    challengeId?: string | undefined;
    expiresAt?: string | undefined;
    maskedDestination?: string | undefined;
}
export interface VerifyPasswordRecoveryChallengeRequest {
    challengeId?: string | undefined;
    otp?: string | undefined;
}
export interface PasswordRecoveryVerificationResponse {
    verified?: boolean | undefined;
    resetToken?: string | undefined;
}
export interface VerifyPasswordRecoveryChallengeResponse {
    verified?: boolean | undefined;
    resetToken?: string | undefined;
}
export interface CompletePasswordRecoveryRequest {
    resetToken?: string | undefined;
    newPassword?: string | undefined;
}
export interface PasswordRecoveryCompletionResponse {
    success?: boolean | undefined;
    sessionsRevoked?: boolean | undefined;
}
export interface CompletePasswordRecoveryResponse {
    success?: boolean | undefined;
    sessionsRevoked?: boolean | undefined;
}
export interface LoginMethodView {
    methodId?: string | undefined;
    userId?: string | undefined;
    type?: string | undefined;
    identifier?: string | undefined;
    maskedIdentifier?: string | undefined;
    verified?: boolean | undefined;
    enabled?: boolean | undefined;
    hasPassword?: boolean | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}
export interface ListLoginMethodsRequest {
    userId?: string | undefined;
}
export interface ListLoginMethodsResponse {
    loginMethods?: LoginMethodView[] | undefined;
    passwordSetupRequired?: boolean | undefined;
}
export interface BootstrapOwnLoginMethodsRequest {
    userId?: string | undefined;
    accountId?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
}
export interface BootstrapOwnLoginMethodsResponse {
    emailBootstrapped?: boolean | undefined;
    phoneBootstrapped?: boolean | undefined;
    passwordBootstrapped?: boolean | undefined;
}
export interface ChangeOwnPasswordRequest {
    userId?: string | undefined;
    currentPassword?: string | undefined;
    newPassword?: string | undefined;
    accountId?: string | undefined;
    tenantId?: string | undefined;
    mfaGrantToken?: string | undefined;
    scopeLevel?: string | undefined;
}
export interface RequirePasswordSetupRequest {
    userId?: string | undefined;
    requiredBy?: string | undefined;
    reason?: string | undefined;
    revokeSessions?: boolean | undefined;
}
export interface SetLoginMethodEnabledRequest {
    userId?: string | undefined;
    methodId?: string | undefined;
    enabled?: boolean | undefined;
    operatorId?: string | undefined;
    reason?: string | undefined;
}
export interface SetOwnLoginMethodEnabledRequest {
    userId?: string | undefined;
    methodId?: string | undefined;
    enabled?: boolean | undefined;
    operatorId?: string | undefined;
    reason?: string | undefined;
}
export interface PasswordMutationResponse {
    success?: boolean | undefined;
    passwordSetupRequired?: boolean | undefined;
}
export interface ChangeOwnPasswordResponse {
    success?: boolean | undefined;
    passwordSetupRequired?: boolean | undefined;
}
export interface RequirePasswordSetupResponse {
    success?: boolean | undefined;
    passwordSetupRequired?: boolean | undefined;
}
export interface VerifyEmailBindingRequest {
    userId?: string | undefined;
    email?: string | undefined;
    otp?: string | undefined;
    accountId?: string | undefined;
    tenantId?: string | undefined;
    mfaGrantToken?: string | undefined;
    scopeLevel?: string | undefined;
}
export interface VerifyPhoneBindingRequest {
    userId?: string | undefined;
    phone?: string | undefined;
    otp?: string | undefined;
    accountId?: string | undefined;
    tenantId?: string | undefined;
    mfaGrantToken?: string | undefined;
    scopeLevel?: string | undefined;
}
export interface ContactBindingVerificationResponse {
    success?: boolean | undefined;
    type?: string | undefined;
    identifier?: string | undefined;
}
export interface VerifyEmailBindingResponse {
    success?: boolean | undefined;
    type?: string | undefined;
    identifier?: string | undefined;
}
export interface VerifyPhoneBindingResponse {
    success?: boolean | undefined;
    type?: string | undefined;
    identifier?: string | undefined;
}
export interface LoginMethodMutationResponse {
    success?: boolean | undefined;
    loginMethod?: LoginMethodView | undefined;
}
export interface SetOwnLoginMethodEnabledResponse {
    success?: boolean | undefined;
    loginMethod?: LoginMethodView | undefined;
}
export interface SetLoginMethodEnabledResponse {
    success?: boolean | undefined;
    loginMethod?: LoginMethodView | undefined;
}
export interface LoginWithPhoneOtpRequest {
    phone?: string | undefined;
    otp?: string | undefined;
}
export interface PhoneOtpLoginRequest {
    phone?: string | undefined;
    otp?: string | undefined;
}
export interface LoginMfaFactorOption {
    type?: MfaBindingType | undefined;
    label?: string | undefined;
    priority?: number | undefined;
}
export interface ListMfaBindingsRequest {
    userId?: string | undefined;
}
export interface MfaBindingView {
    bindingId?: string | undefined;
    type?: MfaBindingType | undefined;
    enabled?: boolean | undefined;
    available?: boolean | undefined;
    destination?: string | undefined;
    updatedAt?: string | undefined;
}
export interface ListMfaBindingsResponse {
    bindings?: MfaBindingView[] | undefined;
}
export interface EnableMfaBindingRequest {
    userId?: string | undefined;
    type?: MfaBindingType | undefined;
}
export interface DisableMfaBindingRequest {
    userId?: string | undefined;
    type?: MfaBindingType | undefined;
}
export interface MfaBindingMutationResponse {
    success?: boolean | undefined;
    binding?: MfaBindingView | undefined;
}
export interface EnableMfaBindingResponse {
    success?: boolean | undefined;
    binding?: MfaBindingView | undefined;
}
export interface DisableMfaBindingResponse {
    success?: boolean | undefined;
    binding?: MfaBindingView | undefined;
}
export interface ActivateTotpBindingResponse {
    success?: boolean | undefined;
    binding?: MfaBindingView | undefined;
}
export interface InitializeTotpBindingRequest {
    userId?: string | undefined;
}
export interface InitializeTotpBindingResponse {
    binding?: MfaBindingView | undefined;
    secret?: string | undefined;
    qrCodeUrl?: string | undefined;
}
export interface ActivateTotpBindingRequest {
    userId?: string | undefined;
    bindingId?: string | undefined;
    code?: string | undefined;
}
export interface InitializeRecoveryCodesRequest {
    userId?: string | undefined;
}
export interface RegenerateRecoveryCodesRequest {
    userId?: string | undefined;
}
export interface RecoveryCodesResponse {
    binding?: MfaBindingView | undefined;
    recoveryCodes?: string[] | undefined;
}
export interface InitializeRecoveryCodesResponse {
    binding?: MfaBindingView | undefined;
    recoveryCodes?: string[] | undefined;
}
export interface RegenerateRecoveryCodesResponse {
    binding?: MfaBindingView | undefined;
    recoveryCodes?: string[] | undefined;
}
export interface AccountCandidate {
    accountId?: string | undefined;
    tenantId?: string | undefined;
    displayName?: string | undefined;
    scopeLevel?: string | undefined;
}
export interface SelectAccountRequest {
    userId?: string | undefined;
    accountId?: string | undefined;
    loginMethod?: string | undefined;
    deviceId?: string | undefined;
    deviceName?: string | undefined;
    userAgent?: string | undefined;
    ipAddress?: string | undefined;
    currentSessionId?: string | undefined;
}
export interface SubmitMfaChallengeRequest {
    challengeId?: string | undefined;
    factor?: MfaBindingType | undefined;
    code?: string | undefined;
    loginMethod?: string | undefined;
    factorChallengeId?: string | undefined;
    trustCurrentDevice?: boolean | undefined;
}
export interface RequestLoginMfaFactorChallengeRequest {
    challengeId?: string | undefined;
    factor?: MfaBindingType | undefined;
}
export interface RequestLoginMfaFactorChallengeResponse {
    challengeId?: string | undefined;
    expiresAt?: string | undefined;
    destination?: string | undefined;
}
export interface StartStepUpMfaChallengeRequest {
    userId?: string | undefined;
    accountId?: string | undefined;
    tenantId?: string | undefined;
    scenario?: MfaScenario | undefined;
    scopeLevel?: string | undefined;
}
export interface StepUpMfaChallengeResponse {
    required?: boolean | undefined;
    challengeId?: string | undefined;
    scenario?: MfaScenario | undefined;
    defaultMfaFactor?: MfaBindingType | undefined;
    availableFactors?: LoginMfaFactorOption[] | undefined;
    factorChallengeId?: string | undefined;
    challengeDestination?: string | undefined;
    challengeExpiresAt?: string | undefined;
}
export interface StartStepUpMfaChallengeResponse {
    required?: boolean | undefined;
    challengeId?: string | undefined;
    scenario?: MfaScenario | undefined;
    defaultMfaFactor?: MfaBindingType | undefined;
    availableFactors?: LoginMfaFactorOption[] | undefined;
    factorChallengeId?: string | undefined;
    challengeDestination?: string | undefined;
    challengeExpiresAt?: string | undefined;
}
export interface CompleteStepUpMfaChallengeRequest {
    challengeId?: string | undefined;
    factor?: MfaBindingType | undefined;
    code?: string | undefined;
    factorChallengeId?: string | undefined;
}
export interface StepUpMfaGrantResponse {
    success?: boolean | undefined;
    scenario?: MfaScenario | undefined;
    mfaGrantToken?: string | undefined;
    expiresAt?: string | undefined;
}
export interface CompleteStepUpMfaChallengeResponse {
    success?: boolean | undefined;
    scenario?: MfaScenario | undefined;
    mfaGrantToken?: string | undefined;
    expiresAt?: string | undefined;
}
export interface RefreshSessionRequest {
    refreshToken?: string | undefined;
}
export interface RefreshSessionResponse {
    sessionId?: string | undefined;
    accessToken?: string | undefined;
    refreshToken?: string | undefined;
    expiresIn?: string | undefined;
}
export interface ValidateAccessTokenRequest {
    accessToken?: string | undefined;
}
export interface ValidateAccessTokenResponse {
    userId?: string | undefined;
    accountId?: string | undefined;
    tenantId?: string | undefined;
    sessionId?: string | undefined;
    scopeLevel?: string | undefined;
    roleIds?: string[] | undefined;
    passwordSetupRequired?: boolean | undefined;
}
export interface ListSessionsRequest {
    userId?: string | undefined;
    currentSessionId?: string | undefined;
}
export interface SessionView {
    sessionId?: string | undefined;
    userId?: string | undefined;
    accountId?: string | undefined;
    tenantId?: string | undefined;
    status?: string | undefined;
    loginMethod?: string | undefined;
    deviceId?: string | undefined;
    deviceName?: string | undefined;
    userAgent?: string | undefined;
    ipAddress?: string | undefined;
    createdAt?: string | undefined;
    lastActiveAt?: string | undefined;
    expiresAt?: string | undefined;
    refreshExpiresAt?: string | undefined;
    isCurrent?: boolean | undefined;
    isAdminControlled?: boolean | undefined;
    platform?: string | undefined;
    browser?: string | undefined;
    accessRemainingSeconds?: string | undefined;
    refreshRemainingSeconds?: string | undefined;
    sessionAgeSeconds?: string | undefined;
    idleSeconds?: string | undefined;
    isAccessExpired?: boolean | undefined;
    isRefreshExpired?: boolean | undefined;
    isRevoked?: boolean | undefined;
}
export interface ListSessionsResponse {
    sessions?: SessionView[] | undefined;
}
export interface TrustedDeviceView {
    id?: string | undefined;
    deviceId?: string | undefined;
    deviceName?: string | undefined;
    browser?: string | undefined;
    platform?: string | undefined;
    trustedAt?: string | undefined;
    lastActiveAt?: string | undefined;
    expiresAt?: string | undefined;
    isCurrentDevice?: boolean | undefined;
}
export interface ListTrustedDevicesRequest {
    userId?: string | undefined;
    tenantId?: string | undefined;
    currentDeviceId?: string | undefined;
    scopeLevel?: string | undefined;
}
export interface ListTrustedDevicesResponse {
    devices?: TrustedDeviceView[] | undefined;
}
export interface RevokeTrustedDeviceRequest {
    userId?: string | undefined;
    tenantId?: string | undefined;
    trustedDeviceId?: string | undefined;
    scopeLevel?: string | undefined;
}
export interface RevokeOtherTrustedDevicesRequest {
    userId?: string | undefined;
    tenantId?: string | undefined;
    currentDeviceId?: string | undefined;
    scopeLevel?: string | undefined;
}
export interface TrustedDeviceMutationResponse {
    success?: boolean | undefined;
    deviceCount?: string | undefined;
}
export interface RevokeTrustedDeviceResponse {
    success?: boolean | undefined;
    deviceCount?: string | undefined;
}
export interface RevokeOtherTrustedDevicesResponse {
    success?: boolean | undefined;
    deviceCount?: string | undefined;
}
export interface AdminListOnlineUsersRequest {
    tenantId?: string | undefined;
}
export interface AdminOnlineUserView {
    userId?: string | undefined;
    tenantId?: string | undefined;
    activeSessionCount?: string | undefined;
    lastActiveAt?: string | undefined;
}
export interface AdminListOnlineUsersResponse {
    items?: AdminOnlineUserView[] | undefined;
    nextCursor?: string | undefined;
}
export interface AdminListUserSessionsRequest {
    userId?: string | undefined;
}
export interface AdminSessionView {
    sessionId?: string | undefined;
    userId?: string | undefined;
    accountId?: string | undefined;
    tenantId?: string | undefined;
    status?: string | undefined;
    loginMethod?: string | undefined;
    deviceId?: string | undefined;
    deviceName?: string | undefined;
    userAgent?: string | undefined;
    ipAddress?: string | undefined;
    createdAt?: string | undefined;
    lastActiveAt?: string | undefined;
    expiresAt?: string | undefined;
    refreshExpiresAt?: string | undefined;
    isAdminControlled?: boolean | undefined;
    adminRevokeReason?: string | undefined;
    adminRevokeAt?: string | undefined;
    adminRevokeBy?: string | undefined;
    platform?: string | undefined;
    browser?: string | undefined;
    accessRemainingSeconds?: string | undefined;
    refreshRemainingSeconds?: string | undefined;
    sessionAgeSeconds?: string | undefined;
    idleSeconds?: string | undefined;
    isAccessExpired?: boolean | undefined;
    isRefreshExpired?: boolean | undefined;
    isRevoked?: boolean | undefined;
}
export interface AdminListUserSessionsResponse {
    sessions?: AdminSessionView[] | undefined;
}
export interface AdminRevokeSessionRequest {
    sessionId?: string | undefined;
    reason?: string | undefined;
}
export interface AdminRevokeSessionResponse {
    success?: boolean | undefined;
    sessionId?: string | undefined;
}
export interface AdminDeleteAccountSessionsRequest {
    userId?: string | undefined;
    accountId?: string | undefined;
    reason?: string | undefined;
}
export interface AdminDeleteAccountSessionsResponse {
    success?: boolean | undefined;
    deletedSessionCount?: string | undefined;
}
export interface LogoutRequest {
    sessionId?: string | undefined;
}
export interface LogoutResponse {
    success?: boolean | undefined;
}
export interface LogoutSessionRequest {
    userId?: string | undefined;
    currentSessionId?: string | undefined;
    targetSessionId?: string | undefined;
}
export interface LogoutSessionResponse {
    success?: boolean | undefined;
}
export interface LogoutOtherDevicesRequest {
    userId?: string | undefined;
    currentSessionId?: string | undefined;
}
export interface LogoutOtherDevicesResponse {
    success?: boolean | undefined;
    sessionCount?: string | undefined;
}
export interface LogoutAllRequest {
    userId?: string | undefined;
    currentSessionId?: string | undefined;
}
export interface LogoutAllResponse {
    success?: boolean | undefined;
    sessionCount?: string | undefined;
}
export interface ListAuditEventsRequest {
    service?: string | undefined;
    module?: string | undefined;
    eventType?: string | undefined;
    result?: string | undefined;
    operatorId?: string | undefined;
    tenantId?: string | undefined;
    orgId?: string | undefined;
    resourceType?: string | undefined;
    resourceId?: string | undefined;
    occurredAtFrom?: string | undefined;
    occurredAtTo?: string | undefined;
    cursor?: string | undefined;
    pageSize?: number | undefined;
}
export interface AuditEventRecord {
    eventId?: string | undefined;
    service?: string | undefined;
    module?: string | undefined;
    eventType?: string | undefined;
    occurredAt?: string | undefined;
    result?: string | undefined;
    operatorId?: string | undefined;
    operatorType?: string | undefined;
    tenantId?: string | undefined;
    orgId?: string | undefined;
    traceId?: string | undefined;
    resourceType?: string | undefined;
    resourceId?: string | undefined;
    detailsJson?: string | undefined;
}
export interface ListAuditEventsResponse {
    items?: AuditEventRecord[] | undefined;
    nextCursor?: string | undefined;
}
export interface ListLoginHistoryRequest {
    userId?: string | undefined;
    result?: string | undefined;
    occurredAtFrom?: string | undefined;
    occurredAtTo?: string | undefined;
    cursor?: string | undefined;
    pageSize?: number | undefined;
}
export interface LoginHistoryRecord {
    occurredAt?: string | undefined;
    outcome?: string | undefined;
    loginMethod?: string | undefined;
    ipAddress?: string | undefined;
    deviceName?: string | undefined;
    platform?: string | undefined;
    browser?: string | undefined;
    failureReason?: string | undefined;
    traceId?: string | undefined;
}
export interface ListLoginHistoryResponse {
    items?: LoginHistoryRecord[] | undefined;
    nextCursor?: string | undefined;
}
export interface SelectAccountResponse {
    status?: LoginStatus | undefined;
    userId?: string | undefined;
    accountId?: string | undefined;
    tenantId?: string | undefined;
    displayName?: string | undefined;
    sessionId?: string | undefined;
    accessToken?: string | undefined;
    refreshToken?: string | undefined;
    expiresIn?: string | undefined;
    nextStep?: string | undefined;
    scopeLevel?: string | undefined;
    passwordSetupRequired?: boolean | undefined;
    challengeId?: string | undefined;
    mfaScenario?: MfaScenario | undefined;
    defaultMfaFactor?: MfaBindingType | undefined;
    availableFactors?: LoginMfaFactorOption[] | undefined;
    factorChallengeId?: string | undefined;
    challengeDestination?: string | undefined;
    challengeExpiresAt?: string | undefined;
}
export interface TenantMfaFactorPolicy {
    factor?: MfaBindingType | undefined;
    enabled?: boolean | undefined;
    priority?: number | undefined;
}
export interface TenantMfaScenarioRequirement {
    scenario?: MfaScenario | undefined;
    required?: boolean | undefined;
}
export interface GetTenantMfaPolicyRequest {
    tenantId?: string | undefined;
}
export interface GetPlatformMfaPolicyRequest {
}
export interface UpdateTenantMfaPolicyRequest {
    tenantId?: string | undefined;
    loginRequired?: boolean | undefined;
    factors?: TenantMfaFactorPolicy[] | undefined;
    scenarioRequirements?: TenantMfaScenarioRequirement[] | undefined;
}
export interface UpdatePlatformMfaPolicyRequest {
    loginRequired?: boolean | undefined;
    factors?: TenantMfaFactorPolicy[] | undefined;
    scenarioRequirements?: TenantMfaScenarioRequirement[] | undefined;
}
export interface TenantMfaPolicyResponse {
    tenantId?: string | undefined;
    loginRequired?: boolean | undefined;
    factors?: TenantMfaFactorPolicy[] | undefined;
    scenarioRequirements?: TenantMfaScenarioRequirement[] | undefined;
}
export interface GetTenantMfaPolicyResponse {
    tenantId?: string | undefined;
    loginRequired?: boolean | undefined;
    factors?: TenantMfaFactorPolicy[] | undefined;
    scenarioRequirements?: TenantMfaScenarioRequirement[] | undefined;
}
export interface UpdateTenantMfaPolicyResponse {
    tenantId?: string | undefined;
    loginRequired?: boolean | undefined;
    factors?: TenantMfaFactorPolicy[] | undefined;
    scenarioRequirements?: TenantMfaScenarioRequirement[] | undefined;
}
export interface PlatformMfaPolicyResponse {
    loginRequired?: boolean | undefined;
    factors?: TenantMfaFactorPolicy[] | undefined;
    scenarioRequirements?: TenantMfaScenarioRequirement[] | undefined;
}
export interface GetPlatformMfaPolicyResponse {
    loginRequired?: boolean | undefined;
    factors?: TenantMfaFactorPolicy[] | undefined;
    scenarioRequirements?: TenantMfaScenarioRequirement[] | undefined;
}
export interface UpdatePlatformMfaPolicyResponse {
    loginRequired?: boolean | undefined;
    factors?: TenantMfaFactorPolicy[] | undefined;
    scenarioRequirements?: TenantMfaScenarioRequirement[] | undefined;
}
export interface LoginResponse {
    status?: LoginStatus | undefined;
    userId?: string | undefined;
    challengeId?: string | undefined;
    accessToken?: string | undefined;
    refreshToken?: string | undefined;
    expiresIn?: string | undefined;
    accounts?: AccountCandidate[] | undefined;
    loginMethod?: string | undefined;
    passwordSetupRequired?: boolean | undefined;
}
export interface LoginWithEmailPasswordResponse {
    status?: LoginStatus | undefined;
    userId?: string | undefined;
    challengeId?: string | undefined;
    accessToken?: string | undefined;
    refreshToken?: string | undefined;
    expiresIn?: string | undefined;
    accounts?: AccountCandidate[] | undefined;
    loginMethod?: string | undefined;
    passwordSetupRequired?: boolean | undefined;
}
export interface LoginWithEmailOtpResponse {
    status?: LoginStatus | undefined;
    userId?: string | undefined;
    challengeId?: string | undefined;
    accessToken?: string | undefined;
    refreshToken?: string | undefined;
    expiresIn?: string | undefined;
    accounts?: AccountCandidate[] | undefined;
    loginMethod?: string | undefined;
    passwordSetupRequired?: boolean | undefined;
}
export interface LoginWithPhonePasswordResponse {
    status?: LoginStatus | undefined;
    userId?: string | undefined;
    challengeId?: string | undefined;
    accessToken?: string | undefined;
    refreshToken?: string | undefined;
    expiresIn?: string | undefined;
    accounts?: AccountCandidate[] | undefined;
    loginMethod?: string | undefined;
    passwordSetupRequired?: boolean | undefined;
}
export interface LoginWithPhoneOtpResponse {
    status?: LoginStatus | undefined;
    userId?: string | undefined;
    challengeId?: string | undefined;
    accessToken?: string | undefined;
    refreshToken?: string | undefined;
    expiresIn?: string | undefined;
    accounts?: AccountCandidate[] | undefined;
    loginMethod?: string | undefined;
    passwordSetupRequired?: boolean | undefined;
}
export interface SubmitMfaChallengeResponse {
    status?: LoginStatus | undefined;
    userId?: string | undefined;
    challengeId?: string | undefined;
    accessToken?: string | undefined;
    refreshToken?: string | undefined;
    expiresIn?: string | undefined;
    accounts?: AccountCandidate[] | undefined;
    loginMethod?: string | undefined;
    passwordSetupRequired?: boolean | undefined;
}
export interface BootstrapUserLoginMethodsRequest {
    userId?: string | undefined;
    accountId?: string | undefined;
    displayName?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
}
export interface BootstrapUserLoginMethodsResponse {
    phoneBootstrapped?: boolean | undefined;
    emailBootstrapped?: boolean | undefined;
    passwordBootstrapped?: boolean | undefined;
}
export interface CompleteFirstLoginPasswordSetupRequest {
    userId?: string | undefined;
    newPassword?: string | undefined;
}
export interface CompleteFirstLoginPasswordSetupResponse {
    completed?: boolean | undefined;
}
export interface AuthServiceClient {
    listAuditEvents(request: ListAuditEventsRequest, ...rest: any): Observable<ListAuditEventsResponse>;
    listLoginHistory(request: ListLoginHistoryRequest, ...rest: any): Observable<ListLoginHistoryResponse>;
    bootstrapOwnLoginMethods(request: BootstrapOwnLoginMethodsRequest, ...rest: any): Observable<BootstrapOwnLoginMethodsResponse>;
    bootstrapUserLoginMethods(request: BootstrapUserLoginMethodsRequest, ...rest: any): Observable<BootstrapUserLoginMethodsResponse>;
    completeFirstLoginPasswordSetup(request: CompleteFirstLoginPasswordSetupRequest, ...rest: any): Observable<CompleteFirstLoginPasswordSetupResponse>;
    loginWithEmailPassword(request: LoginWithEmailPasswordRequest, ...rest: any): Observable<LoginWithEmailPasswordResponse>;
    requestEmailOtpLoginChallenge(request: RequestEmailOtpLoginChallengeRequest, ...rest: any): Observable<RequestEmailOtpLoginChallengeResponse>;
    requestEmailBindingChallenge(request: RequestEmailBindingChallengeRequest, ...rest: any): Observable<RequestEmailBindingChallengeResponse>;
    loginWithEmailOtp(request: LoginWithEmailOtpRequest, ...rest: any): Observable<LoginWithEmailOtpResponse>;
    loginWithPhonePassword(request: LoginWithPhonePasswordRequest, ...rest: any): Observable<LoginWithPhonePasswordResponse>;
    requestPhoneOtpLoginChallenge(request: RequestPhoneOtpLoginChallengeRequest, ...rest: any): Observable<RequestPhoneOtpLoginChallengeResponse>;
    requestPhoneBindingChallenge(request: RequestPhoneBindingChallengeRequest, ...rest: any): Observable<RequestPhoneBindingChallengeResponse>;
    loginWithPhoneOtp(request: LoginWithPhoneOtpRequest, ...rest: any): Observable<LoginWithPhoneOtpResponse>;
    inspectPasswordRecoveryChannels(request: InspectPasswordRecoveryChannelsRequest, ...rest: any): Observable<InspectPasswordRecoveryChannelsResponse>;
    requestPasswordRecoveryChallenge(request: RequestPasswordRecoveryChallengeRequest, ...rest: any): Observable<RequestPasswordRecoveryChallengeResponse>;
    verifyPasswordRecoveryChallenge(request: VerifyPasswordRecoveryChallengeRequest, ...rest: any): Observable<VerifyPasswordRecoveryChallengeResponse>;
    completePasswordRecovery(request: CompletePasswordRecoveryRequest, ...rest: any): Observable<CompletePasswordRecoveryResponse>;
    listLoginMethods(request: ListLoginMethodsRequest, ...rest: any): Observable<ListLoginMethodsResponse>;
    changeOwnPassword(request: ChangeOwnPasswordRequest, ...rest: any): Observable<ChangeOwnPasswordResponse>;
    setOwnLoginMethodEnabled(request: SetOwnLoginMethodEnabledRequest, ...rest: any): Observable<SetOwnLoginMethodEnabledResponse>;
    verifyEmailBinding(request: VerifyEmailBindingRequest, ...rest: any): Observable<VerifyEmailBindingResponse>;
    verifyPhoneBinding(request: VerifyPhoneBindingRequest, ...rest: any): Observable<VerifyPhoneBindingResponse>;
    requirePasswordSetup(request: RequirePasswordSetupRequest, ...rest: any): Observable<RequirePasswordSetupResponse>;
    setLoginMethodEnabled(request: SetLoginMethodEnabledRequest, ...rest: any): Observable<SetLoginMethodEnabledResponse>;
    listMfaBindings(request: ListMfaBindingsRequest, ...rest: any): Observable<ListMfaBindingsResponse>;
    enableMfaBinding(request: EnableMfaBindingRequest, ...rest: any): Observable<EnableMfaBindingResponse>;
    disableMfaBinding(request: DisableMfaBindingRequest, ...rest: any): Observable<DisableMfaBindingResponse>;
    initializeTotpBinding(request: InitializeTotpBindingRequest, ...rest: any): Observable<InitializeTotpBindingResponse>;
    activateTotpBinding(request: ActivateTotpBindingRequest, ...rest: any): Observable<ActivateTotpBindingResponse>;
    initializeRecoveryCodes(request: InitializeRecoveryCodesRequest, ...rest: any): Observable<InitializeRecoveryCodesResponse>;
    regenerateRecoveryCodes(request: RegenerateRecoveryCodesRequest, ...rest: any): Observable<RegenerateRecoveryCodesResponse>;
    requestLoginMfaFactorChallenge(request: RequestLoginMfaFactorChallengeRequest, ...rest: any): Observable<RequestLoginMfaFactorChallengeResponse>;
    submitMfaChallenge(request: SubmitMfaChallengeRequest, ...rest: any): Observable<SubmitMfaChallengeResponse>;
    startStepUpMfaChallenge(request: StartStepUpMfaChallengeRequest, ...rest: any): Observable<StartStepUpMfaChallengeResponse>;
    completeStepUpMfaChallenge(request: CompleteStepUpMfaChallengeRequest, ...rest: any): Observable<CompleteStepUpMfaChallengeResponse>;
    refreshSession(request: RefreshSessionRequest, ...rest: any): Observable<RefreshSessionResponse>;
    validateAccessToken(request: ValidateAccessTokenRequest, ...rest: any): Observable<ValidateAccessTokenResponse>;
    selectAccount(request: SelectAccountRequest, ...rest: any): Observable<SelectAccountResponse>;
    getTenantMfaPolicy(request: GetTenantMfaPolicyRequest, ...rest: any): Observable<GetTenantMfaPolicyResponse>;
    updateTenantMfaPolicy(request: UpdateTenantMfaPolicyRequest, ...rest: any): Observable<UpdateTenantMfaPolicyResponse>;
    getPlatformMfaPolicy(request: GetPlatformMfaPolicyRequest, ...rest: any): Observable<GetPlatformMfaPolicyResponse>;
    updatePlatformMfaPolicy(request: UpdatePlatformMfaPolicyRequest, ...rest: any): Observable<UpdatePlatformMfaPolicyResponse>;
    listSessions(request: ListSessionsRequest, ...rest: any): Observable<ListSessionsResponse>;
    listTrustedDevices(request: ListTrustedDevicesRequest, ...rest: any): Observable<ListTrustedDevicesResponse>;
    revokeTrustedDevice(request: RevokeTrustedDeviceRequest, ...rest: any): Observable<RevokeTrustedDeviceResponse>;
    revokeOtherTrustedDevices(request: RevokeOtherTrustedDevicesRequest, ...rest: any): Observable<RevokeOtherTrustedDevicesResponse>;
    adminListOnlineUsers(request: AdminListOnlineUsersRequest, ...rest: any): Observable<AdminListOnlineUsersResponse>;
    adminListUserSessions(request: AdminListUserSessionsRequest, ...rest: any): Observable<AdminListUserSessionsResponse>;
    adminRevokeSession(request: AdminRevokeSessionRequest, ...rest: any): Observable<AdminRevokeSessionResponse>;
    adminDeleteAccountSessions(request: AdminDeleteAccountSessionsRequest, ...rest: any): Observable<AdminDeleteAccountSessionsResponse>;
    logout(request: LogoutRequest, ...rest: any): Observable<LogoutResponse>;
    logoutSession(request: LogoutSessionRequest, ...rest: any): Observable<LogoutSessionResponse>;
    logoutOtherDevices(request: LogoutOtherDevicesRequest, ...rest: any): Observable<LogoutOtherDevicesResponse>;
    logoutAll(request: LogoutAllRequest, ...rest: any): Observable<LogoutAllResponse>;
}
export interface AuthServiceController {
    listAuditEvents(request: ListAuditEventsRequest, ...rest: any): Promise<ListAuditEventsResponse> | Observable<ListAuditEventsResponse> | ListAuditEventsResponse;
    listLoginHistory(request: ListLoginHistoryRequest, ...rest: any): Promise<ListLoginHistoryResponse> | Observable<ListLoginHistoryResponse> | ListLoginHistoryResponse;
    bootstrapOwnLoginMethods(request: BootstrapOwnLoginMethodsRequest, ...rest: any): Promise<BootstrapOwnLoginMethodsResponse> | Observable<BootstrapOwnLoginMethodsResponse> | BootstrapOwnLoginMethodsResponse;
    bootstrapUserLoginMethods(request: BootstrapUserLoginMethodsRequest, ...rest: any): Promise<BootstrapUserLoginMethodsResponse> | Observable<BootstrapUserLoginMethodsResponse> | BootstrapUserLoginMethodsResponse;
    completeFirstLoginPasswordSetup(request: CompleteFirstLoginPasswordSetupRequest, ...rest: any): Promise<CompleteFirstLoginPasswordSetupResponse> | Observable<CompleteFirstLoginPasswordSetupResponse> | CompleteFirstLoginPasswordSetupResponse;
    loginWithEmailPassword(request: LoginWithEmailPasswordRequest, ...rest: any): Promise<LoginWithEmailPasswordResponse> | Observable<LoginWithEmailPasswordResponse> | LoginWithEmailPasswordResponse;
    requestEmailOtpLoginChallenge(request: RequestEmailOtpLoginChallengeRequest, ...rest: any): Promise<RequestEmailOtpLoginChallengeResponse> | Observable<RequestEmailOtpLoginChallengeResponse> | RequestEmailOtpLoginChallengeResponse;
    requestEmailBindingChallenge(request: RequestEmailBindingChallengeRequest, ...rest: any): Promise<RequestEmailBindingChallengeResponse> | Observable<RequestEmailBindingChallengeResponse> | RequestEmailBindingChallengeResponse;
    loginWithEmailOtp(request: LoginWithEmailOtpRequest, ...rest: any): Promise<LoginWithEmailOtpResponse> | Observable<LoginWithEmailOtpResponse> | LoginWithEmailOtpResponse;
    loginWithPhonePassword(request: LoginWithPhonePasswordRequest, ...rest: any): Promise<LoginWithPhonePasswordResponse> | Observable<LoginWithPhonePasswordResponse> | LoginWithPhonePasswordResponse;
    requestPhoneOtpLoginChallenge(request: RequestPhoneOtpLoginChallengeRequest, ...rest: any): Promise<RequestPhoneOtpLoginChallengeResponse> | Observable<RequestPhoneOtpLoginChallengeResponse> | RequestPhoneOtpLoginChallengeResponse;
    requestPhoneBindingChallenge(request: RequestPhoneBindingChallengeRequest, ...rest: any): Promise<RequestPhoneBindingChallengeResponse> | Observable<RequestPhoneBindingChallengeResponse> | RequestPhoneBindingChallengeResponse;
    loginWithPhoneOtp(request: LoginWithPhoneOtpRequest, ...rest: any): Promise<LoginWithPhoneOtpResponse> | Observable<LoginWithPhoneOtpResponse> | LoginWithPhoneOtpResponse;
    inspectPasswordRecoveryChannels(request: InspectPasswordRecoveryChannelsRequest, ...rest: any): Promise<InspectPasswordRecoveryChannelsResponse> | Observable<InspectPasswordRecoveryChannelsResponse> | InspectPasswordRecoveryChannelsResponse;
    requestPasswordRecoveryChallenge(request: RequestPasswordRecoveryChallengeRequest, ...rest: any): Promise<RequestPasswordRecoveryChallengeResponse> | Observable<RequestPasswordRecoveryChallengeResponse> | RequestPasswordRecoveryChallengeResponse;
    verifyPasswordRecoveryChallenge(request: VerifyPasswordRecoveryChallengeRequest, ...rest: any): Promise<VerifyPasswordRecoveryChallengeResponse> | Observable<VerifyPasswordRecoveryChallengeResponse> | VerifyPasswordRecoveryChallengeResponse;
    completePasswordRecovery(request: CompletePasswordRecoveryRequest, ...rest: any): Promise<CompletePasswordRecoveryResponse> | Observable<CompletePasswordRecoveryResponse> | CompletePasswordRecoveryResponse;
    listLoginMethods(request: ListLoginMethodsRequest, ...rest: any): Promise<ListLoginMethodsResponse> | Observable<ListLoginMethodsResponse> | ListLoginMethodsResponse;
    changeOwnPassword(request: ChangeOwnPasswordRequest, ...rest: any): Promise<ChangeOwnPasswordResponse> | Observable<ChangeOwnPasswordResponse> | ChangeOwnPasswordResponse;
    setOwnLoginMethodEnabled(request: SetOwnLoginMethodEnabledRequest, ...rest: any): Promise<SetOwnLoginMethodEnabledResponse> | Observable<SetOwnLoginMethodEnabledResponse> | SetOwnLoginMethodEnabledResponse;
    verifyEmailBinding(request: VerifyEmailBindingRequest, ...rest: any): Promise<VerifyEmailBindingResponse> | Observable<VerifyEmailBindingResponse> | VerifyEmailBindingResponse;
    verifyPhoneBinding(request: VerifyPhoneBindingRequest, ...rest: any): Promise<VerifyPhoneBindingResponse> | Observable<VerifyPhoneBindingResponse> | VerifyPhoneBindingResponse;
    requirePasswordSetup(request: RequirePasswordSetupRequest, ...rest: any): Promise<RequirePasswordSetupResponse> | Observable<RequirePasswordSetupResponse> | RequirePasswordSetupResponse;
    setLoginMethodEnabled(request: SetLoginMethodEnabledRequest, ...rest: any): Promise<SetLoginMethodEnabledResponse> | Observable<SetLoginMethodEnabledResponse> | SetLoginMethodEnabledResponse;
    listMfaBindings(request: ListMfaBindingsRequest, ...rest: any): Promise<ListMfaBindingsResponse> | Observable<ListMfaBindingsResponse> | ListMfaBindingsResponse;
    enableMfaBinding(request: EnableMfaBindingRequest, ...rest: any): Promise<EnableMfaBindingResponse> | Observable<EnableMfaBindingResponse> | EnableMfaBindingResponse;
    disableMfaBinding(request: DisableMfaBindingRequest, ...rest: any): Promise<DisableMfaBindingResponse> | Observable<DisableMfaBindingResponse> | DisableMfaBindingResponse;
    initializeTotpBinding(request: InitializeTotpBindingRequest, ...rest: any): Promise<InitializeTotpBindingResponse> | Observable<InitializeTotpBindingResponse> | InitializeTotpBindingResponse;
    activateTotpBinding(request: ActivateTotpBindingRequest, ...rest: any): Promise<ActivateTotpBindingResponse> | Observable<ActivateTotpBindingResponse> | ActivateTotpBindingResponse;
    initializeRecoveryCodes(request: InitializeRecoveryCodesRequest, ...rest: any): Promise<InitializeRecoveryCodesResponse> | Observable<InitializeRecoveryCodesResponse> | InitializeRecoveryCodesResponse;
    regenerateRecoveryCodes(request: RegenerateRecoveryCodesRequest, ...rest: any): Promise<RegenerateRecoveryCodesResponse> | Observable<RegenerateRecoveryCodesResponse> | RegenerateRecoveryCodesResponse;
    requestLoginMfaFactorChallenge(request: RequestLoginMfaFactorChallengeRequest, ...rest: any): Promise<RequestLoginMfaFactorChallengeResponse> | Observable<RequestLoginMfaFactorChallengeResponse> | RequestLoginMfaFactorChallengeResponse;
    submitMfaChallenge(request: SubmitMfaChallengeRequest, ...rest: any): Promise<SubmitMfaChallengeResponse> | Observable<SubmitMfaChallengeResponse> | SubmitMfaChallengeResponse;
    startStepUpMfaChallenge(request: StartStepUpMfaChallengeRequest, ...rest: any): Promise<StartStepUpMfaChallengeResponse> | Observable<StartStepUpMfaChallengeResponse> | StartStepUpMfaChallengeResponse;
    completeStepUpMfaChallenge(request: CompleteStepUpMfaChallengeRequest, ...rest: any): Promise<CompleteStepUpMfaChallengeResponse> | Observable<CompleteStepUpMfaChallengeResponse> | CompleteStepUpMfaChallengeResponse;
    refreshSession(request: RefreshSessionRequest, ...rest: any): Promise<RefreshSessionResponse> | Observable<RefreshSessionResponse> | RefreshSessionResponse;
    validateAccessToken(request: ValidateAccessTokenRequest, ...rest: any): Promise<ValidateAccessTokenResponse> | Observable<ValidateAccessTokenResponse> | ValidateAccessTokenResponse;
    selectAccount(request: SelectAccountRequest, ...rest: any): Promise<SelectAccountResponse> | Observable<SelectAccountResponse> | SelectAccountResponse;
    getTenantMfaPolicy(request: GetTenantMfaPolicyRequest, ...rest: any): Promise<GetTenantMfaPolicyResponse> | Observable<GetTenantMfaPolicyResponse> | GetTenantMfaPolicyResponse;
    updateTenantMfaPolicy(request: UpdateTenantMfaPolicyRequest, ...rest: any): Promise<UpdateTenantMfaPolicyResponse> | Observable<UpdateTenantMfaPolicyResponse> | UpdateTenantMfaPolicyResponse;
    getPlatformMfaPolicy(request: GetPlatformMfaPolicyRequest, ...rest: any): Promise<GetPlatformMfaPolicyResponse> | Observable<GetPlatformMfaPolicyResponse> | GetPlatformMfaPolicyResponse;
    updatePlatformMfaPolicy(request: UpdatePlatformMfaPolicyRequest, ...rest: any): Promise<UpdatePlatformMfaPolicyResponse> | Observable<UpdatePlatformMfaPolicyResponse> | UpdatePlatformMfaPolicyResponse;
    listSessions(request: ListSessionsRequest, ...rest: any): Promise<ListSessionsResponse> | Observable<ListSessionsResponse> | ListSessionsResponse;
    listTrustedDevices(request: ListTrustedDevicesRequest, ...rest: any): Promise<ListTrustedDevicesResponse> | Observable<ListTrustedDevicesResponse> | ListTrustedDevicesResponse;
    revokeTrustedDevice(request: RevokeTrustedDeviceRequest, ...rest: any): Promise<RevokeTrustedDeviceResponse> | Observable<RevokeTrustedDeviceResponse> | RevokeTrustedDeviceResponse;
    revokeOtherTrustedDevices(request: RevokeOtherTrustedDevicesRequest, ...rest: any): Promise<RevokeOtherTrustedDevicesResponse> | Observable<RevokeOtherTrustedDevicesResponse> | RevokeOtherTrustedDevicesResponse;
    adminListOnlineUsers(request: AdminListOnlineUsersRequest, ...rest: any): Promise<AdminListOnlineUsersResponse> | Observable<AdminListOnlineUsersResponse> | AdminListOnlineUsersResponse;
    adminListUserSessions(request: AdminListUserSessionsRequest, ...rest: any): Promise<AdminListUserSessionsResponse> | Observable<AdminListUserSessionsResponse> | AdminListUserSessionsResponse;
    adminRevokeSession(request: AdminRevokeSessionRequest, ...rest: any): Promise<AdminRevokeSessionResponse> | Observable<AdminRevokeSessionResponse> | AdminRevokeSessionResponse;
    adminDeleteAccountSessions(request: AdminDeleteAccountSessionsRequest, ...rest: any): Promise<AdminDeleteAccountSessionsResponse> | Observable<AdminDeleteAccountSessionsResponse> | AdminDeleteAccountSessionsResponse;
    logout(request: LogoutRequest, ...rest: any): Promise<LogoutResponse> | Observable<LogoutResponse> | LogoutResponse;
    logoutSession(request: LogoutSessionRequest, ...rest: any): Promise<LogoutSessionResponse> | Observable<LogoutSessionResponse> | LogoutSessionResponse;
    logoutOtherDevices(request: LogoutOtherDevicesRequest, ...rest: any): Promise<LogoutOtherDevicesResponse> | Observable<LogoutOtherDevicesResponse> | LogoutOtherDevicesResponse;
    logoutAll(request: LogoutAllRequest, ...rest: any): Promise<LogoutAllResponse> | Observable<LogoutAllResponse> | LogoutAllResponse;
}
export declare function AuthServiceControllerMethods(): (constructor: Function) => void;
export declare const AUTH_SERVICE_NAME = "AuthService";
