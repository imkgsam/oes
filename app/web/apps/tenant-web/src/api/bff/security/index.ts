import { requestClient } from '#/api/request';

export namespace SelfSecurityApi {
  export type LoginHistoryOutcome = 'FAILED' | 'SUCCESS';
  export type MfaBindingType =
    | 'BACKUP_CODE'
    | 'EMAIL_OTP'
    | 'SMS_OTP'
    | 'TOTP';
  export type StepUpMfaScenario =
    | 'CHANGE_CONTACT'
    | 'CHANGE_PASSWORD'
    | 'NEW_DEVICE_LOGIN';

  export interface Session {
    accessRemainingSeconds: number;
    accountId?: string;
    browser?: string;
    createdAt: string;
    deviceId?: string;
    deviceName?: string;
    expiresAt: string;
    idleSeconds: number;
    ipAddress?: string;
    isAccessExpired: boolean;
    isAdminControlled: boolean;
    isCurrent: boolean;
    isRefreshExpired: boolean;
    isRevoked: boolean;
    lastActiveAt: string;
    loginMethod: string;
    platform?: string;
    refreshExpiresAt: string;
    refreshRemainingSeconds: number;
    sessionAgeSeconds: number;
    sessionId: string;
    status: string;
    terminal?: string;
    terminalDeviceId?: string;
    tenantId?: string;
    userAgent?: string;
  }

  export interface SessionListResult {
    sessions: Session[];
  }

  export interface SessionMutationResult {
    sessionCount?: number;
    success: boolean;
  }

  export interface TrustedDevice {
    browser?: string;
    deviceId: string;
    deviceName?: string;
    expiresAt: string;
    id: string;
    isCurrentDevice: boolean;
    lastActiveAt: string;
    platform?: string;
    trustedAt: string;
  }

  export interface TrustedDeviceListResult {
    devices: TrustedDevice[];
  }

  export interface TrustedDeviceMutationResult {
    deviceCount?: number;
    success: boolean;
  }

  export interface LoginHistoryItem {
    browser?: string;
    deviceName?: string;
    failureReason?: string;
    ipAddress?: string;
    loginFlow?: string;
    loginMethod?: string;
    occurredAt: string;
    outcome: LoginHistoryOutcome;
    platform?: string;
    terminal?: string;
    traceId?: string;
  }

  export interface LoginHistoryListResult {
    items: LoginHistoryItem[];
    nextCursor?: string;
  }

  export interface LoginHistoryQuery {
    cursor?: string;
    occurredAtFrom?: string;
    occurredAtTo?: string;
    pageSize?: number;
    result?: LoginHistoryOutcome;
  }

  export interface LoginMethod {
    createdAt?: string;
    enabled: boolean;
    hasPassword: boolean;
    identifier?: string;
    maskedIdentifier?: string;
    methodId: string;
    type: string;
    updatedAt?: string;
    userId: string;
    verified: boolean;
  }

  export interface LoginMethodListResult {
    loginMethods: LoginMethod[];
    passwordSetupRequired: boolean;
  }

  export interface LoginMethodMutationResult {
    loginMethod: LoginMethod;
    success: boolean;
  }

  export interface PasswordMutationResult {
    passwordSetupRequired: boolean;
    success: boolean;
  }

  export interface TerminalPinMutationResult {
    success: boolean;
  }

  export interface StepUpMfaChallenge {
    availableFactors?: Array<{
      label: string;
      priority: number;
      type: MfaBindingType;
    }>;
    challengeId: string;
    defaultFactor?: MfaBindingType;
    destination?: string;
    expiresAt?: string;
    factorChallengeId?: string;
    scenario?: StepUpMfaScenario;
  }

  export interface StepUpMfaChallengeResult {
    challenge?: null | StepUpMfaChallenge;
    required: boolean;
  }

  export interface StepUpMfaGrantResult {
    expiresAt?: string;
    mfaGrantToken?: string;
    scenario?: StepUpMfaScenario;
    success: boolean;
  }

  export interface ContactBindingChallengePayload {
    email?: string;
    phone?: string;
  }

  export interface ContactBindingChallengeResponse {
    challengeId: string;
    destination: string;
    expiresAt: string;
  }

  export interface ContactBindingVerificationPayload {
    email?: string;
    otp: string;
    phone?: string;
  }

  export interface ContactBindingVerificationResponse {
    identifier: string;
    success: boolean;
    type: string;
  }

  export interface MfaBinding {
    available: boolean;
    bindingId: string;
    destination?: string;
    enabled: boolean;
    type: MfaBindingType;
    updatedAt?: string;
  }

  export interface MfaBindingListResult {
    bindings: MfaBinding[];
  }

  export interface MfaBindingMutationResult {
    binding: MfaBinding;
    success: boolean;
  }

  export interface InitializeTotpResult {
    binding: MfaBinding;
    qrCodeUrl: string;
    secret: string;
  }

  export interface RecoveryCodesResult {
    binding: MfaBinding;
    recoveryCodes: string[];
  }
}

// Lists the signed-in user's sessions for the current account context.
export async function listSelfSessionsApi() {
  return requestClient.get<SelfSecurityApi.SessionListResult>('/auth/sessions');
}

// Lists the signed-in user's own login attempt history from auth-service audit records.
export async function listSelfLoginHistoryApi(
  query: SelfSecurityApi.LoginHistoryQuery = {},
) {
  const params = new URLSearchParams();

  if (query.result) {
    params.set('result', query.result);
  }
  if (query.occurredAtFrom) {
    params.set('occurredAtFrom', query.occurredAtFrom);
  }
  if (query.occurredAtTo) {
    params.set('occurredAtTo', query.occurredAtTo);
  }
  if (query.cursor) {
    params.set('cursor', query.cursor);
  }
  if (query.pageSize !== undefined) {
    params.set('pageSize', String(query.pageSize));
  }

  const suffix = params.toString();
  return requestClient.get<SelfSecurityApi.LoginHistoryListResult>(
    suffix ? `/auth/login-history?${suffix}` : '/auth/login-history',
  );
}

// Lists the signed-in user's login methods and password setup state.
export async function listSelfLoginMethodsApi() {
  return requestClient.get<SelfSecurityApi.LoginMethodListResult>(
    '/auth/login-methods',
  );
}

// Changes the signed-in user's own password after backend current-password verification.
export async function changeOwnPasswordApi(data: {
  currentPassword: string;
  mfaGrantToken?: string;
  newPassword: string;
}) {
  return requestClient.post<SelfSecurityApi.PasswordMutationResult>(
    '/auth/password/change',
    data,
  );
}

export async function setOwnTerminalPinApi(data: {
  currentPassword?: string;
  mfaGrantToken?: string;
  newPin: string;
}) {
  return requestClient.post<SelfSecurityApi.TerminalPinMutationResult>(
    '/auth/terminal-pin/set',
    data,
  );
}

export async function resetOwnTerminalPinApi(data: {
  currentPassword?: string;
  mfaGrantToken?: string;
  newPin: string;
}) {
  return requestClient.post<SelfSecurityApi.TerminalPinMutationResult>(
    '/auth/terminal-pin/reset',
    data,
  );
}

export async function setOwnTerminalPinEnabledApi(data: { enabled: boolean }) {
  return requestClient.post<SelfSecurityApi.TerminalPinMutationResult>(
    '/auth/terminal-pin/enabled',
    data,
  );
}

// Sends a verification code to the requested email before the user confirms a new binding.
export async function requestEmailBindingChallengeApi(
  payload: Required<Pick<SelfSecurityApi.ContactBindingChallengePayload, 'email'>>,
) {
  return requestClient.post<SelfSecurityApi.ContactBindingChallengeResponse>(
    '/auth/contact-bindings/email/challenge',
    payload,
  );
}

// Verifies the submitted email OTP and persists the signed-in user's email binding.
export async function verifyEmailBindingApi(
  payload: Required<
    Pick<SelfSecurityApi.ContactBindingVerificationPayload, 'email' | 'otp'>
  > & { mfaGrantToken?: string },
) {
  return requestClient.post<SelfSecurityApi.ContactBindingVerificationResponse>(
    '/auth/contact-bindings/email/verify',
    payload,
  );
}

// Sends a verification code to the requested phone before the user confirms a new binding.
export async function requestPhoneBindingChallengeApi(
  payload: Required<Pick<SelfSecurityApi.ContactBindingChallengePayload, 'phone'>>,
) {
  return requestClient.post<SelfSecurityApi.ContactBindingChallengeResponse>(
    '/auth/contact-bindings/phone/challenge',
    payload,
  );
}

// Verifies the submitted phone OTP and persists the signed-in user's phone binding.
export async function verifyPhoneBindingApi(
  payload: Required<
    Pick<SelfSecurityApi.ContactBindingVerificationPayload, 'otp' | 'phone'>
  > & { mfaGrantToken?: string },
) {
  return requestClient.post<SelfSecurityApi.ContactBindingVerificationResponse>(
    '/auth/contact-bindings/phone/verify',
    payload,
  );
}

// Enables one login method owned by the signed-in user.
export async function enableSelfLoginMethodApi(methodId: string) {
  return requestClient.post<SelfSecurityApi.LoginMethodMutationResult>(
    `/auth/login-methods/${encodeURIComponent(methodId)}/enable`,
  );
}

// Disables one login method owned by the signed-in user.
export async function disableSelfLoginMethodApi(methodId: string) {
  return requestClient.post<SelfSecurityApi.LoginMethodMutationResult>(
    `/auth/login-methods/${encodeURIComponent(methodId)}/disable`,
  );
}

// Revokes every other session in the current account context except the current one.
export async function logoutOtherDevicesApi() {
  return requestClient.post<SelfSecurityApi.SessionMutationResult>(
    '/auth/logout-other-devices',
  );
}

// Revokes one other active session in the current account context.
export async function logoutSelfSessionApi(sessionId: string) {
  return requestClient.post<SelfSecurityApi.SessionMutationResult>(
    `/auth/sessions/${encodeURIComponent(sessionId)}/logout`,
  );
}

// Revokes every session in the current account context, including the current one.
export async function logoutAllDevicesApi() {
  return requestClient.post<SelfSecurityApi.SessionMutationResult>(
    '/auth/logout-all',
  );
}

// Lists the signed-in user's trusted devices for the current tenant security scope.
export async function listTrustedDevicesApi() {
  return requestClient.get<SelfSecurityApi.TrustedDeviceListResult>(
    '/auth/security/trusted-devices',
  );
}

// Revokes one trusted device without changing the current active session set.
export async function revokeTrustedDeviceApi(trustedDeviceId: string) {
  return requestClient.delete<SelfSecurityApi.TrustedDeviceMutationResult>(
    `/auth/security/trusted-devices/${encodeURIComponent(trustedDeviceId)}`,
  );
}

// Revokes every other trusted device while keeping the current device trust untouched.
export async function revokeOtherTrustedDevicesApi() {
  return requestClient.post<SelfSecurityApi.TrustedDeviceMutationResult>(
    '/auth/security/trusted-devices/revoke-others',
  );
}

// Lists the signed-in user's MFA binding state.
export async function listMfaBindingsApi() {
  return requestClient.get<SelfSecurityApi.MfaBindingListResult>(
    '/auth/mfa-bindings',
  );
}

// Enables one self-service MFA binding type for the signed-in user.
export async function enableMfaBindingApi(type: SelfSecurityApi.MfaBindingType) {
  return requestClient.post<SelfSecurityApi.MfaBindingMutationResult>(
    '/auth/mfa/bindings/enable',
    { type },
  );
}

// Disables one self-service MFA binding type for the signed-in user.
export async function disableMfaBindingApi(
  type: SelfSecurityApi.MfaBindingType,
) {
  return requestClient.post<SelfSecurityApi.MfaBindingMutationResult>(
    '/auth/mfa/bindings/disable',
    { type },
  );
}

// Starts one authenticated step-up MFA challenge for a protected self-service scenario.
export async function startStepUpMfaChallengeApi(
  data: { scenario: SelfSecurityApi.StepUpMfaScenario },
) {
  return requestClient.post<SelfSecurityApi.StepUpMfaChallengeResult>(
    '/auth/security/mfa/challenges',
    data,
  );
}

// Completes one authenticated step-up MFA challenge and returns a short-lived grant token.
export async function completeStepUpMfaChallengeApi(data: {
  challengeId: string;
  code: string;
  factor: SelfSecurityApi.MfaBindingType;
  factorChallengeId?: string;
}) {
  return requestClient.post<SelfSecurityApi.StepUpMfaGrantResult>(
    '/auth/security/mfa/complete',
    data,
  );
}

// Starts TOTP enrollment and returns the authenticator secret / QR payload.
export async function initializeTotpBindingApi() {
  return requestClient.post<SelfSecurityApi.InitializeTotpResult>(
    '/auth/mfa/totp/initialize',
  );
}

// Confirms a TOTP enrollment with the verification code from the authenticator app.
export async function activateTotpBindingApi(params: {
  bindingId: string;
  code: string;
}) {
  return requestClient.post<SelfSecurityApi.MfaBindingMutationResult>(
    '/auth/mfa/totp/activate',
    params,
  );
}

// Initializes the signed-in user's recovery codes.
export async function initializeRecoveryCodesApi() {
  return requestClient.post<SelfSecurityApi.RecoveryCodesResult>(
    '/auth/mfa/recovery-codes/initialize',
  );
}

// Regenerates the signed-in user's recovery codes.
export async function regenerateRecoveryCodesApi() {
  return requestClient.post<SelfSecurityApi.RecoveryCodesResult>(
    '/auth/mfa/recovery-codes/regenerate',
  );
}
