import type { BrowserActivityVisitSummary } from './browser-activity-collector'

const DEFAULT_API_BASE_URL = 'http://localhost:9101/api/v1'

export interface BrowserActivityApiOptions {
  baseUrl?: string
  fetchImpl?: typeof fetch
}

export interface AppendVisitSessionsPayload {
  sessions: BrowserActivityVisitSummary[]
}

export interface AppendVisitSessionsResult {
  acceptedCount: number
  policyEnabled: boolean
  rejectedCount: number
  serverReceivedAt: string
}

export interface HeartbeatPayload {
  extensionSessionId: string
  observedAt: string
}

export interface HeartbeatResult {
  accepted: boolean
  nextHeartbeatAfterSeconds: number
  policyEnabled: boolean
}

export interface DisconnectResult {
  accepted: boolean
}

export interface AuditControlResult {
  enabled: boolean
  nextPollAfterSeconds: number
  reasonCode: 'EMPLOYEE_AUDIT_DISABLED' | 'ENABLED' | string
}

// BrowserActivityApi calls the authenticated extension-only Browser Activity BFF endpoints.
export class BrowserActivityApi {
  private readonly baseUrl: string
  private readonly fetchImpl: typeof fetch

  constructor(options: BrowserActivityApiOptions = {}) {
    this.baseUrl = normalizeBaseUrl(
      options.baseUrl ?? import.meta.env.VITE_OES_EXTENSION_API_BASE_URL ?? DEFAULT_API_BASE_URL
    )
    this.fetchImpl = options.fetchImpl ?? ((input, init) => globalThis.fetch(input, init))
  }

  appendVisitSessions(
    accessToken: string,
    payload: AppendVisitSessionsPayload
  ): Promise<AppendVisitSessionsResult> {
    return this.post('/extension/browser-activity/visit-sessions', accessToken, payload)
  }

  heartbeat(accessToken: string, payload: HeartbeatPayload): Promise<HeartbeatResult> {
    return this.post('/extension/browser-activity/heartbeat', accessToken, payload)
  }

  disconnect(accessToken: string, payload: HeartbeatPayload): Promise<DisconnectResult> {
    return this.post('/extension/browser-activity/disconnect', accessToken, payload)
  }

  getAuditControl(accessToken: string): Promise<AuditControlResult> {
    return this.get('/extension/browser-activity/audit-control', accessToken)
  }

  private async get<T>(path: string, accessToken: string): Promise<T> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      headers: {
        'Accept': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      method: 'GET'
    })
    const payload = await parseJson(response)

    if (!response.ok) {
      throw new BrowserActivityApiError(resolveErrorMessage(payload, response.statusText), response.status, payload)
    }

    return unwrapGatewayPayload<T>(payload)
  }

  private async post<T>(path: string, accessToken: string, body: unknown): Promise<T> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      body: JSON.stringify(body),
      headers: {
        'Accept': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      method: 'POST'
    })
    const payload = await parseJson(response)

    if (!response.ok) {
      throw new BrowserActivityApiError(resolveErrorMessage(payload, response.statusText), response.status, payload)
    }

    return unwrapGatewayPayload<T>(payload)
  }
}

export class BrowserActivityApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown
  ) {
    super(message)
  }
}

// normalizeBaseUrl removes trailing slashes so extension endpoint paths join predictably.
function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '')
}

// parseJson tolerates empty responses from gateway endpoints.
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

// unwrapGatewayPayload supports both legacy and current gateway response envelopes.
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

// resolveErrorMessage extracts stable gateway error copy for extension runtime handling.
function resolveErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    return String(record.message ?? record.error ?? record.reasonCode ?? fallback)
  }

  return fallback || 'Request failed'
}
