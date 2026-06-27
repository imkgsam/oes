import { ExtensionAuthApi } from './api'
import type { AuthStorage } from './storage'

export interface ExtensionAccessTokenRefreshOptions {
  api?: Pick<ExtensionAuthApi, 'getSessionContext' | 'refreshSession'>
  storage: Pick<AuthStorage, 'load' | 'save'>
}

// Refreshes the stored extension session and returns the fresh access token for retryable API calls.
export async function refreshStoredExtensionAccessToken(
  options: ExtensionAccessTokenRefreshOptions
): Promise<string | undefined> {
  const stored = await options.storage.load()
  if (!stored?.refreshToken) {
    return undefined
  }

  const api = options.api ?? new ExtensionAuthApi()
  const refreshed = await api.refreshSession(stored.refreshToken)
  const context = await api.getSessionContext(refreshed.accessToken)
  await options.storage.save({
    accessToken: refreshed.accessToken,
    context,
    refreshToken: refreshed.refreshToken
  })

  return refreshed.accessToken
}
