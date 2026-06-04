export type AuthResultStatus =
  | 'ACCOUNT_SELECTION_REQUIRED'
  | 'CHALLENGE_REQUIRED'
  | 'DENIED'
  | 'MFA_REQUIRED'
  | 'SUCCESS'

export type AuthNextStep =
  | 'COMPLETE_CHALLENGE'
  | 'COMPLETE_MFA'
  | 'NONE'
  | 'SELECT_ACCOUNT'
  | 'SET_PASSWORD_REQUIRED'

export type MfaFactor = 'BACKUP_CODE' | 'EMAIL_OTP' | 'SMS_OTP' | 'TOTP'

export interface AccountOption {
  accountId: string
  displayName?: string
  scopeLevel?: 'SYSTEM' | 'TENANT'
  tenantId?: null | string
  tenantName?: null | string
}

export interface AuthChallenge {
  availableFactors?: Array<{
    label: string
    priority: number
    type: MfaFactor
  }>
  challengeId: string
  defaultFactor?: MfaFactor
  destination?: string
  expiresAt?: string
  factorChallengeId?: string
  scenario?: 'LOGIN' | 'NEW_DEVICE_LOGIN'
}

export interface AuthOperator {
  accountId?: string
  displayName?: string
  scopeLevel?: 'SYSTEM' | 'TENANT'
  tenantId?: string
  userId?: string
}

export interface AuthSession {
  accessToken: string
  allowedTerminals?: string[]
  expiresIn: number
  refreshToken: string
  terminal?: string
}

export interface AuthResponse {
  accountOptions: AccountOption[]
  allowedTerminals?: string[]
  challenge?: AuthChallenge | null
  loginMethod?: LoginMethod
  message?: string
  nextStep: AuthNextStep
  operator?: AuthOperator | null
  passwordSetupRequired?: boolean
  reasonCode?: string
  session?: AuthSession | null
  status: AuthResultStatus
  terminal?: string
}

export type LoginMethod = 'EMAIL_PASSWORD' | 'PHONE_PASSWORD'

export interface LoginParams {
  credential: string
  device?: {
    deviceId?: string
    deviceName?: string
  }
  identifier: string
  method: LoginMethod
}

export interface SelectAccountParams {
  accountId: string
  loginMethod: LoginMethod
  userId: string
}

export interface CompleteMfaParams {
  challengeId: string
  code: string
  factor: MfaFactor
  factorChallengeId?: string
  loginMethod: LoginMethod
}

export interface RefreshSessionResult {
  accessToken: string
  allowedTerminals?: string[]
  expiresIn: number
  refreshToken: string
  sessionId: string
  terminal?: string
}

export interface SessionContext {
  access?: {
    actionCodes?: string[]
  }
  account?: {
    accountId: string
    name?: string
    scopeLevel?: 'SYSTEM' | 'TENANT'
  }
  navigation?: {
    defaultEntry?: string
    defaultHomePath?: string
    visibleEntries?: string[]
  }
  operator?: {
    displayName?: string
    scopeLevel?: 'SYSTEM' | 'TENANT'
    userId?: string
  }
  tenant?: {
    name?: string
    tenantId?: string
  } | null
  terminal?: string
}

export interface StoredAuthSession {
  accessToken: string
  context?: SessionContext | null
  refreshToken: string
}

export type AuthScreen =
  | { kind: 'account-selection'; loginMethod: LoginMethod; message?: string; options: AccountOption[]; userId: string }
  | { challenge: AuthChallenge; kind: 'mfa'; loginMethod: LoginMethod; message?: string }
  | { context: SessionContext; kind: 'authenticated'; session: StoredAuthSession }
  | { error?: string; kind: 'login' }
  | { kind: 'loading'; message: string }
