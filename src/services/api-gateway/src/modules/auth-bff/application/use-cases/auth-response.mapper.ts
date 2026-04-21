import {
  LoginResponse,
  LoginStatus,
  MfaBindingType,
  MfaScenario,
  RefreshSessionResponse,
  SelectAccountResponse
} from '@oes/common/generated/auth_service'
import {
  AccountOptionViewModel,
  AuthNextStep,
  AuthResponseViewModel,
  AuthResultStatus,
  ChallengeViewModel,
  MfaFactorOptionViewModel,
  MfaFactorTypeViewModel,
  MfaScenarioViewModel,
  OperatorViewModel,
  RefreshSessionViewModel,
  SessionViewModel
} from '../../interfaces/http/view-models/auth-response.view-model'

type AuthFlowResult = LoginResponse | SelectAccountResponse

// Maps downstream auth service flow responses into the normalized auth-bff response model.
export function toAuthResponseViewModel(result: AuthFlowResult): AuthResponseViewModel {
  return {
    status: mapStatus(result.status),
    nextStep: mapNextStep(result.status, result.passwordSetupRequired),
    loginMethod: hasLoginMethod(result) ? result.loginMethod ?? undefined : undefined,
    session: mapSession(result),
    operator: mapOperator(result),
    challenge: hasChallenge(result) ? mapChallenge(result) : null,
    accountOptions: hasAccountOptions(result) ? mapAccountOptions(result) : [],
    passwordSetupRequired: Boolean(result.passwordSetupRequired)
  }
}

// Maps refresh token responses into the HTTP view model consumed by front-end clients.
export function toRefreshSessionViewModel(result: RefreshSessionResponse): RefreshSessionViewModel {
  return {
    sessionId: result.sessionId ?? '',
    accessToken: result.accessToken ?? '',
    refreshToken: result.refreshToken ?? '',
    expiresIn: Number(result.expiresIn ?? '0')
  }
}

// Maps downstream login status values into stable HTTP result statuses.
function mapStatus(status?: LoginStatus): AuthResultStatus {
  switch (status) {
    case LoginStatus.LOGIN_STATUS_MFA_REQUIRED:
      return AuthResultStatus.MFA_REQUIRED
    case LoginStatus.LOGIN_STATUS_ACCOUNT_SELECTION_REQUIRED:
      return AuthResultStatus.ACCOUNT_SELECTION_REQUIRED
    case LoginStatus.LOGIN_STATUS_SUCCESS:
      return AuthResultStatus.SUCCESS
    case LoginStatus.LOGIN_STATUS_DENIED:
      return AuthResultStatus.DENIED
    default:
      return AuthResultStatus.CHALLENGE_REQUIRED
  }
}

// Maps downstream login status values into the next client action expected by the BFF.
function mapNextStep(status?: LoginStatus, passwordSetupRequired?: boolean): AuthNextStep {
  switch (status) {
    case LoginStatus.LOGIN_STATUS_MFA_REQUIRED:
      return AuthNextStep.COMPLETE_MFA
    case LoginStatus.LOGIN_STATUS_ACCOUNT_SELECTION_REQUIRED:
      return AuthNextStep.SELECT_ACCOUNT
    case LoginStatus.LOGIN_STATUS_SUCCESS:
      return passwordSetupRequired ? AuthNextStep.SET_PASSWORD_REQUIRED : AuthNextStep.NONE
    case LoginStatus.LOGIN_STATUS_DENIED:
      return AuthNextStep.NONE
    default:
      return AuthNextStep.COMPLETE_CHALLENGE
  }
}

// Maps final token material when the auth flow returns a completed session.
function mapSession(result: {
  accessToken?: string
  refreshToken?: string
  expiresIn?: string
}): SessionViewModel | null {
  if (!result.accessToken || !result.refreshToken) {
    return null
  }

  return {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    expiresIn: Number(result.expiresIn ?? '0')
  }
}

// Maps authenticated operator context that becomes available during the auth flow.
function mapOperator(result: {
  userId?: string
  accountId?: string
  tenantId?: string
  scopeLevel?: string
  displayName?: string
}): OperatorViewModel | null {
  const tenantId = normalizeOptional(result.tenantId)
  const scopeLevel = result.scopeLevel ? normalizeScopeLevel(result.scopeLevel) : undefined

  if (
    !result.userId &&
    !result.accountId &&
    !tenantId &&
    !scopeLevel &&
    !result.displayName
  ) {
    return null
  }

  return {
    userId: result.userId ?? undefined,
    accountId: result.accountId ?? undefined,
    tenantId,
    scopeLevel,
    displayName: result.displayName ?? undefined
  }
}

// Maps challenge context required to continue MFA or OTP-driven login flows.
function mapChallenge(result: {
  availableFactors?: Array<{ label?: string; type?: MfaBindingType }>
  challengeDestination?: string
  challengeExpiresAt?: string
  challengeId?: string
  defaultMfaFactor?: MfaBindingType
  factorChallengeId?: string
  mfaScenario?: MfaScenario
}): ChallengeViewModel | null {
  if (!result.challengeId) {
    return null
  }

  return {
    challengeId: result.challengeId,
    scenario: mapMfaScenario(result.mfaScenario),
    defaultFactor: mapMfaFactor(result.defaultMfaFactor),
    availableFactors: mapMfaFactorOptions(result.availableFactors),
    factorChallengeId: normalizeOptional(result.factorChallengeId),
    destination: normalizeOptional(result.challengeDestination),
    expiresAt: normalizeOptional(result.challengeExpiresAt)
  }
}

// Maps downstream account candidates into the BFF account selection payload.
function mapAccountOptions(result: {
  accounts?: Array<{
    accountId?: string
    tenantId?: string
    tenantName?: string
    displayName?: string
    scopeLevel?: string
  }>
}): AccountOptionViewModel[] {
  return (result.accounts ?? [])
    .filter((account) => account.accountId)
    .map((account) => ({
      accountId: account.accountId!,
      tenantId: normalizeOptional(account.tenantId),
      tenantName: normalizeOptional(account.tenantName),
      scopeLevel: normalizeScopeLevel(account.scopeLevel),
      displayName: account.displayName ?? undefined
    }))
}

// Normalizes nullable tenant identifiers so system-scope accounts do not leak blank strings.
function normalizeOptional(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

// Normalizes the account scope carried over gRPC while keeping old TENANT payloads compatible.
function normalizeScopeLevel(scopeLevel?: string): 'SYSTEM' | 'TENANT' {
  return scopeLevel === 'SYSTEM' ? 'SYSTEM' : 'TENANT'
}

function mapMfaScenario(scenario?: MfaScenario): MfaScenarioViewModel | undefined {
  if (scenario === MfaScenario.MFA_SCENARIO_LOGIN) {
    return MfaScenarioViewModel.LOGIN
  }

  return undefined
}

function mapMfaFactor(type?: MfaBindingType): MfaFactorTypeViewModel | undefined {
  switch (type) {
    case MfaBindingType.MFA_BINDING_TYPE_EMAIL_OTP:
      return MfaFactorTypeViewModel.EMAIL_OTP
    case MfaBindingType.MFA_BINDING_TYPE_SMS_OTP:
      return MfaFactorTypeViewModel.SMS_OTP
    case MfaBindingType.MFA_BINDING_TYPE_TOTP:
      return MfaFactorTypeViewModel.TOTP
    case MfaBindingType.MFA_BINDING_TYPE_BACKUP_CODE:
      return MfaFactorTypeViewModel.BACKUP_CODE
    default:
      return undefined
  }
}

function mapMfaFactorOptions(
  factors?: Array<{ label?: string; type?: MfaBindingType }>
): MfaFactorOptionViewModel[] | undefined {
  const items = (factors ?? [])
    .map((factor) => {
      const type = mapMfaFactor(factor.type)
      if (!type) {
        return null
      }

      return {
        type,
        label: factor.label ?? ''
      }
    })
    .filter((value): value is MfaFactorOptionViewModel => Boolean(value))

  return items.length > 0 ? items : undefined
}

// Detects whether the downstream response carries the originating login method.
function hasLoginMethod(result: AuthFlowResult): result is LoginResponse {
  return 'loginMethod' in result
}

// Detects whether the downstream response carries a resumable challenge identifier.
function hasChallenge(result: AuthFlowResult): result is LoginResponse {
  return 'challengeId' in result
}

// Detects whether the downstream response carries account candidates for selection.
function hasAccountOptions(result: AuthFlowResult): result is LoginResponse {
  return 'accounts' in result
}
