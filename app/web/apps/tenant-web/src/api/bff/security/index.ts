import { requestClient } from '#/api/request';

export namespace SelfSecurityApi {
  export type MfaBindingType =
    | 'BACKUP_CODE'
    | 'EMAIL_OTP'
    | 'SMS_OTP'
    | 'TOTP';

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

// Lists the signed-in user's own active and historical auth sessions.
export async function listSelfSessionsApi() {
  return requestClient.get<SelfSecurityApi.SessionListResult>('/auth/sessions');
}

// Revokes every session owned by the signed-in user except the current one.
export async function logoutOtherDevicesApi() {
  return requestClient.post<SelfSecurityApi.SessionMutationResult>(
    '/auth/logout-other-devices',
  );
}

// Revokes every session owned by the signed-in user, including the current one.
export async function logoutAllDevicesApi() {
  return requestClient.post<SelfSecurityApi.SessionMutationResult>(
    '/auth/logout-all',
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
