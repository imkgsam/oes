import { baseRequestClient, requestClient } from '#/api/request';

export namespace AuthApi {
  export type AuthNextStep =
    | 'COMPLETE_CHALLENGE'
    | 'COMPLETE_MFA'
    | 'NONE'
    | 'SELECT_ACCOUNT';

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
  }

  export interface ChallengePayload {
    challengeId: string;
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
    operator?: OperatorPayload | null;
    session?: SessionPayload | null;
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
    code: string;
    loginMethod: LoginMethod;
  }

  export interface SelectAccountParams {
    accountId: string;
    device?: LoginParams['device'];
    loginMethod: LoginMethod;
    userId: string;
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

export async function selectAccountApi(data: AuthApi.SelectAccountParams) {
  return requestClient.post<AuthApi.LoginResult>('/auth/account-selection', data);
}
