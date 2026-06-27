import type {
  AuthResponse,
  CompleteMfaParams,
  LoginParams,
  RefreshSessionResult,
  SelectAccountParams,
  SessionAccessSummary,
  SessionContext
} from './types'

const DEFAULT_API_BASE_URL = 'http://localhost:9101/api/v1'

export interface ExtensionAuthApiOptions {
  baseUrl?: string
  fetchImpl?: typeof fetch
}

// Calls the terminal-scoped extension auth BFF without allowing clients to choose terminal identity.
export class ExtensionAuthApi {
  private readonly baseUrl: string
  private readonly fetchImpl: typeof fetch

  constructor(options: ExtensionAuthApiOptions = {}) {
    this.baseUrl = normalizeBaseUrl(
      options.baseUrl ?? import.meta.env.VITE_OES_EXTENSION_API_BASE_URL ?? DEFAULT_API_BASE_URL
    )
    this.fetchImpl = options.fetchImpl ?? ((input, init) => globalThis.fetch(input, init))
  }

  login(params: LoginParams): Promise<AuthResponse> {
    return this.post<AuthResponse>('/extension/auth/login', params)
  }

  selectAccount(params: SelectAccountParams): Promise<AuthResponse> {
    return this.post<AuthResponse>('/extension/auth/account-selection', params)
  }

  completeMfa(params: CompleteMfaParams): Promise<AuthResponse> {
    return this.post<AuthResponse>('/extension/auth/mfa/complete', params)
  }

  refreshSession(refreshToken: string): Promise<RefreshSessionResult> {
    return this.post<RefreshSessionResult>('/extension/auth/session/refresh', { refreshToken })
  }

  getSessionContext(accessToken: string): Promise<SessionContext> {
    return this.get<SessionContext>('/extension/auth/session/context', accessToken)
  }

  getSessionAccessSummary(accessToken: string): Promise<SessionAccessSummary> {
    return this.get<SessionAccessSummary>('/extension/auth/session/access-summary', accessToken)
  }

  logout(accessToken?: string): Promise<void> {
    return this.post<void>('/extension/auth/logout', {}, accessToken)
  }

  private async get<T>(path: string, accessToken?: string): Promise<T> {
    return this.request<T>(path, {
      headers: this.headers(accessToken),
      method: 'GET'
    })
  }

  private async post<T>(path: string, body: unknown, accessToken?: string): Promise<T> {
    return this.request<T>(path, {
      body: JSON.stringify(body),
      headers: this.headers(accessToken),
      method: 'POST'
    })
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, init)
    const payload = await parseJson(response)

    if (!response.ok) {
      throw new ExtensionAuthApiError(resolveErrorMessage(payload, response.statusText), response.status, payload)
    }

    return unwrapGatewayPayload<T>(payload)
  }

  private headers(accessToken?: string): Record<string, string> {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    }
  }
}

export class ExtensionAuthApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown
  ) {
    super(message)
  }
}

// Removes trailing slashes so endpoint paths can be joined deterministically.
function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '')
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) {
    return undefined
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function unwrapGatewayPayload<T>(payload: unknown): T {
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    ('code' in payload || 'success' in payload)
  ) {
    return (payload as { data: T }).data
  }

  return payload as T
}

function resolveErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    return String(record.message ?? record.error ?? record.reasonCode ?? fallback)
  }

  return fallback || 'Request failed'
}
