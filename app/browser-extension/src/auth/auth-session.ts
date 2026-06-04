import type {
  AccountOption,
  AuthResponse,
  AuthScreen,
  CompleteMfaParams,
  LoginParams,
  LoginMethod,
  SessionContext,
  StoredAuthSession
} from './types'
import type { AuthStorage } from './storage'
import { ExtensionAuthApi, ExtensionAuthApiError } from './api'

export interface AuthSessionControllerOptions {
  api?: ExtensionAuthApi
  storage: AuthStorage
}

// Coordinates popup auth state transitions across login, MFA, account selection, refresh, and logout.
export class AuthSessionController {
  private readonly api: ExtensionAuthApi
  private readonly storage: AuthStorage

  constructor(options: AuthSessionControllerOptions) {
    this.api = options.api ?? new ExtensionAuthApi()
    this.storage = options.storage
  }

  async restore(): Promise<AuthScreen> {
    const stored = await this.storage.load()
    if (!stored) {
      return { kind: 'login' }
    }

    try {
      return await this.withFreshContext(stored)
    } catch {
      await this.storage.clear()
      return { error: '登录已过期，请重新登录。', kind: 'login' }
    }
  }

  async login(params: LoginParams): Promise<AuthScreen> {
    try {
      return await this.resolveAuthResponse(await this.api.login(params), params.method)
    } catch (error) {
      return { error: toUserFacingError(error), kind: 'login' }
    }
  }

  async completeMfa(params: CompleteMfaParams): Promise<AuthScreen> {
    try {
      return await this.resolveAuthResponse(await this.api.completeMfa(params), params.loginMethod)
    } catch (error) {
      return {
        challenge: {
          challengeId: params.challengeId,
          factorChallengeId: params.factorChallengeId
        },
        kind: 'mfa',
        loginMethod: params.loginMethod,
        message: toUserFacingError(error)
      }
    }
  }

  async selectAccount(
    option: AccountOption,
    pending: { loginMethod: LoginMethod; userId: string }
  ): Promise<AuthScreen> {
    try {
      return await this.resolveAuthResponse(
        await this.api.selectAccount({
          accountId: option.accountId,
          loginMethod: pending.loginMethod,
          userId: pending.userId
        }),
        pending.loginMethod
      )
    } catch (error) {
      return {
        kind: 'account-selection',
        loginMethod: pending.loginMethod,
        message: toUserFacingError(error),
        options: [option],
        userId: pending.userId
      }
    }
  }

  async logout(): Promise<AuthScreen> {
    const stored = await this.storage.load()
    try {
      await this.api.logout(stored?.accessToken)
    } catch {
      // Local logout must complete even when the remote session is already expired.
    }

    await this.storage.clear()
    return { kind: 'login' }
  }

  private async resolveAuthResponse(result: AuthResponse, loginMethod: LoginMethod): Promise<AuthScreen> {
    if (result.status === 'SUCCESS' && result.session) {
      return this.saveSuccessfulSession(result.session)
    }

    if (result.status === 'ACCOUNT_SELECTION_REQUIRED') {
      return {
        kind: 'account-selection',
        loginMethod,
        message: result.message,
        options: result.accountOptions ?? [],
        userId: resolvePendingUserId(result)
      }
    }

    if (result.status === 'MFA_REQUIRED' && result.challenge) {
      return {
        challenge: result.challenge,
        kind: 'mfa',
        loginMethod,
        message: result.message
      }
    }

    return {
      error: result.message ?? result.reasonCode ?? '登录未完成，请检查账号状态。',
      kind: 'login'
    }
  }

  private async saveSuccessfulSession(session: {
    accessToken: string
    refreshToken: string
  }): Promise<AuthScreen> {
    const context = await this.api.getSessionContext(session.accessToken)
    const stored = {
      accessToken: session.accessToken,
      context,
      refreshToken: session.refreshToken
    }
    await this.storage.save(stored)

    return {
      context,
      kind: 'authenticated',
      session: stored
    }
  }

  private async withFreshContext(stored: StoredAuthSession): Promise<AuthScreen> {
    try {
      const context = await this.api.getSessionContext(stored.accessToken)
      const next = { ...stored, context }
      await this.storage.save(next)
      return toAuthenticatedScreen(next, context)
    } catch (error) {
      if (!isRecoverableAuthError(error)) {
        throw error
      }
    }

    const refreshed = await this.api.refreshSession(stored.refreshToken)
    const next = {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      context: await this.api.getSessionContext(refreshed.accessToken)
    }
    await this.storage.save(next)
    return toAuthenticatedScreen(next, next.context)
  }
}

function toAuthenticatedScreen(session: StoredAuthSession, context: SessionContext): AuthScreen {
  return {
    context,
    kind: 'authenticated',
    session
  }
}

function resolvePendingUserId(result: AuthResponse): string {
  const userId = result.operator?.userId?.trim()
  if (!userId) {
    throw new Error('Account selection response is missing userId')
  }

  return userId
}

function toUserFacingError(error: unknown): string {
  if (error instanceof ExtensionAuthApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return '请求失败，请稍后重试。'
}

function isRecoverableAuthError(error: unknown): boolean {
  if (error instanceof ExtensionAuthApiError) {
    return error.status === 401 || error.status === 403
  }

  if (error && typeof error === 'object' && 'status' in error) {
    const status = Number((error as { status?: unknown }).status)
    return status === 401 || status === 403
  }

  return false
}
