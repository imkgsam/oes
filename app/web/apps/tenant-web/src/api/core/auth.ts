import { baseRequestClient, requestClient } from '#/api/request';

export namespace AuthApi {
  export type AuthNextStep =
    | 'COMPLETE_CHALLENGE'
    | 'COMPLETE_MFA'
    | 'NONE'
    | 'SELECT_ACCOUNT'
    | 'SET_PASSWORD_REQUIRED';

  export type AuthResultStatus =
    | 'ACCOUNT_SELECTION_REQUIRED'
    | 'CHALLENGE_REQUIRED'
    | 'DENIED'
    | 'MFA_REQUIRED'
    | 'SUCCESS';

  export type LoginMethod =
    | 'EMAIL_OTP'
    | 'EMAIL_PASSWORD'
    | 'PHONE_OTP'
    | 'PHONE_PASSWORD';

  export type MfaFactor =
    | 'BACKUP_CODE'
    | 'EMAIL_OTP'
    | 'SMS_OTP'
    | 'TOTP';

  export interface LoginParams {
    credential: string;
    device?: {
      deviceId?: string;
      deviceName?: string;
    };
    identifier: string;
    method: LoginMethod;
    tenantHint?: string;
  }

  export interface AccountOptionPayload {
    accountId: string;
    displayName?: string;
    scopeLevel?: 'SYSTEM' | 'TENANT';
    tenantId?: null | string;
    tenantName?: null | string;
  }

  export interface ChallengePayload {
    challengeId: string;
    scenario?: 'LOGIN' | 'NEW_DEVICE_LOGIN';
    defaultFactor?: MfaFactor;
    availableFactors?: Array<{
      label: string;
      priority: number;
      type: MfaFactor;
    }>;
    factorChallengeId?: string;
    destination?: string;
    expiresAt?: string;
  }

  export interface OperatorPayload {
    accountId?: string;
    displayName?: string;
    scopeLevel?: 'SYSTEM' | 'TENANT';
    tenantId?: string;
    userId?: string;
  }

  export interface SessionPayload {
    accessToken: string;
    expiresIn: number;
    refreshToken: string;
  }

  export interface LoginResult {
    accountOptions: AccountOptionPayload[];
    challenge?: ChallengePayload | null;
    loginMethod?: string;
    nextStep: AuthNextStep;
    operator?: null | OperatorPayload;
    passwordSetupRequired?: boolean;
    session?: null | SessionPayload;
    status: AuthResultStatus;
  }

  export interface RefreshSessionResult {
    data: {
      accessToken: string;
      expiresIn: number;
      refreshToken: string;
      sessionId: string;
    };
  }

  export interface OtpChallengeResult {
    challengeId: string;
    destination?: string;
    expiresAt?: string;
  }

  export interface CompleteMfaParams {
    challengeId: string;
    factor: MfaFactor;
    code: string;
    factorChallengeId?: string;
    loginMethod: LoginMethod;
    trustCurrentDevice?: boolean;
  }

  export interface RequestMfaFactorChallengeParams {
    challengeId: string;
    factor: MfaFactor;
  }

  export interface SelectAccountParams {
    accountId: string;
    device?: LoginParams['device'];
    loginMethod: LoginMethod;
    userId: string;
  }

  export interface FirstLoginPasswordSetupParams {
    confirmPassword: string;
    newPassword: string;
  }

  export type PasswordRecoveryChannel = 'EMAIL' | 'PHONE';

  export interface PasswordRecoveryChannelOption {
    channel: PasswordRecoveryChannel;
    maskedDestination: string;
  }

  export interface PasswordRecoveryInspectParams {
    identifier: string;
  }

  export interface PasswordRecoveryInspectResult {
    channels: PasswordRecoveryChannelOption[];
    defaultChannel?: PasswordRecoveryChannel;
  }

  export interface PasswordRecoveryChallengeParams {
    channel: PasswordRecoveryChannel;
    identifier: string;
  }

  export interface PasswordRecoveryChallengeResult {
    accepted: boolean;
    challengeId: string;
    expiresAt?: string;
    maskedDestination?: string;
  }

  export interface PasswordRecoveryVerifyParams {
    challengeId: string;
    otp: string;
  }

  export interface PasswordRecoveryVerifyResult {
    resetToken: string;
    verified: boolean;
  }

  export interface PasswordRecoveryCompleteParams {
    confirmPassword: string;
    newPassword: string;
    resetToken: string;
  }

  export interface PasswordRecoveryCompleteResult {
    sessionsRevoked: boolean;
    success: boolean;
  }
}

/**
 * 登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/auth/login', data);
}

/**
 * 刷新accessToken
 */
export async function refreshTokenApi(refreshToken: string) {
  return baseRequestClient.post<AuthApi.RefreshSessionResult>(
    '/auth/session/refresh',
    { refreshToken },
  );
}

/**
 * 退出登录
 */
export async function logoutApi() {
  return requestClient.post('/auth/logout');
}

export async function requestPhoneOtpChallengeApi(phone: string) {
  return requestClient.post<AuthApi.OtpChallengeResult>(
    '/auth/challenges/phone-otp',
    { phone },
  );
}

export async function requestEmailOtpChallengeApi(email: string) {
  return requestClient.post<AuthApi.OtpChallengeResult>(
    '/auth/challenges/email-otp',
    { email },
  );
}

export async function completeMfaApi(data: AuthApi.CompleteMfaParams) {
  return requestClient.post<AuthApi.LoginResult>('/auth/mfa/complete', data);
}

export async function requestMfaFactorChallengeApi(
  data: AuthApi.RequestMfaFactorChallengeParams,
) {
  return requestClient.post<AuthApi.OtpChallengeResult>('/auth/mfa/challenges', data);
}

export async function selectAccountApi(data: AuthApi.SelectAccountParams) {
  return requestClient.post<AuthApi.LoginResult>('/auth/account-selection', data);
}

export async function completeFirstLoginPasswordSetupApi(
  data: AuthApi.FirstLoginPasswordSetupParams,
) {
  return requestClient.post<{ completed: boolean }>(
    '/auth/first-login/password',
    data,
  );
}

export async function requestPasswordRecoveryChallengeApi(
  data: AuthApi.PasswordRecoveryChallengeParams,
) {
  return requestClient.post<AuthApi.PasswordRecoveryChallengeResult>(
    '/auth/password-recovery/challenges',
    data,
  );
}

export async function inspectPasswordRecoveryChannelsApi(
  data: AuthApi.PasswordRecoveryInspectParams,
) {
  return requestClient.post<AuthApi.PasswordRecoveryInspectResult>(
    '/auth/password-recovery/options',
    data,
  );
}

export async function verifyPasswordRecoveryChallengeApi(
  data: AuthApi.PasswordRecoveryVerifyParams,
) {
  return requestClient.post<AuthApi.PasswordRecoveryVerifyResult>(
    `/auth/password-recovery/challenges/${data.challengeId}/verify`,
    { otp: data.otp },
  );
}

export async function completePasswordRecoveryApi(
  data: AuthApi.PasswordRecoveryCompleteParams,
) {
  return requestClient.post<AuthApi.PasswordRecoveryCompleteResult>(
    '/auth/password-recovery/complete',
    data,
  );
}
