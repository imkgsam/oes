import type {
  ExtensionCrmAccountSummary,
  ExtensionCrmAccountPage,
  ExtensionLeadRequest,
  ResolvePageContextRequest,
  ResolveSearchResultsRequest
} from './crm-types'
import type { CrmDraftLeadUpdateRequest, CrmLeadDuplicateCheckResult } from '../workspaces/crm-lead-drafts'

const DEFAULT_API_BASE_URL = 'http://localhost:9101/api/v1'

export interface ExtensionCrmApiOptions {
  accessTokenProvider: () => Promise<string | undefined>
  baseUrl?: string
  fetchImpl?: typeof fetch
  refreshAccessTokenProvider?: () => Promise<string | undefined>
  workspaceEnabledProvider: () => Promise<boolean>
}

// Calls the terminal-scoped extension CRM BFF only when the local workspace is enabled.
export class ExtensionCrmApi {
  private readonly baseUrl: string
  private readonly fetchImpl: typeof fetch

  constructor(private readonly options: ExtensionCrmApiOptions) {
    this.baseUrl = normalizeBaseUrl(
      options.baseUrl ?? import.meta.env.VITE_OES_EXTENSION_API_BASE_URL ?? DEFAULT_API_BASE_URL
    )
    this.fetchImpl = options.fetchImpl ?? ((input, init) => globalThis.fetch(input, init))
  }

  resolvePageContext(input: ResolvePageContextRequest) {
    return this.post('/extension/crm/page-context/resolve', input)
  }

  resolveSearchResults(input: ResolveSearchResultsRequest) {
    return this.post('/extension/crm/search-results/resolve', input)
  }

  checkDuplicate(input: ExtensionLeadRequest): Promise<CrmLeadDuplicateCheckResult> {
    return this.post('/extension/crm/leads/check-duplicate', input)
  }

  createDraftLead(input: ExtensionLeadRequest): Promise<{ crmAccount?: ExtensionCrmAccountSummary }> {
    return this.post('/extension/crm/draft-leads', input)
  }

  listDraftLeads(identity: { accountId?: string; tenantId?: string | null }): Promise<ExtensionCrmAccountPage> {
    if (!identity.tenantId) {
      throw new Error('CRM tenant context is missing')
    }

    const params = new URLSearchParams()
    if (identity.accountId) {
      params.set('createdBy', identity.accountId)
    }
    params.set('page', '1')
    params.set('pageSize', '50')
    params.set('recordStatus', 'DRAFT')

    return this.get(`/customer-management/tenants/${encodeURIComponent(identity.tenantId)}/crm-accounts?${params.toString()}`)
  }

  updateDraftLead(tenantId: string, crmAccountId: string, input: CrmDraftLeadUpdateRequest) {
    return this.patch(
      `/customer-management/tenants/${encodeURIComponent(tenantId)}/draft-leads/${encodeURIComponent(crmAccountId)}`,
      input
    )
  }

  submitDraftLead(tenantId: string, crmAccountId: string, input: {
    assignmentIntent?: string
    duplicateWarningAcknowledged?: boolean
  }) {
    return this.post(
      `/customer-management/tenants/${encodeURIComponent(tenantId)}/draft-leads/${encodeURIComponent(crmAccountId)}/submit`,
      input
    )
  }

  deleteDraftLead(tenantId: string, crmAccountId: string) {
    return this.delete(`/customer-management/tenants/${encodeURIComponent(tenantId)}/draft-leads/${encodeURIComponent(crmAccountId)}`)
  }

  createActiveLead(input: ExtensionLeadRequest) {
    return this.post('/extension/crm/leads', input)
  }

  claimPoolLead(crmAccountId: string) {
    return this.post(`/extension/crm/accounts/${encodeURIComponent(crmAccountId)}/claim`, {})
  }

  getAccountSummary(crmAccountId: string) {
    return this.get(`/extension/crm/accounts/${encodeURIComponent(crmAccountId)}`)
  }

  private async get<T = unknown>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' })
  }

  private async post<T = unknown>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      body: JSON.stringify(body),
      method: 'POST'
    })
  }

  private async patch<T = unknown>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      body: JSON.stringify(body),
      method: 'PATCH'
    })
  }

  private async delete<T = unknown>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' })
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    if (!(await this.options.workspaceEnabledProvider())) {
      throw new Error('CRM workspace is disabled')
    }

    const accessToken = await this.options.accessTokenProvider()
    if (!accessToken) {
      throw new Error('Extension session is missing')
    }

    const first = await this.requestWithToken<T>(path, init, accessToken)
    if (first.response.ok) {
      return unwrapGatewayPayload<T>(first.payload)
    }

    if (this.options.refreshAccessTokenProvider && isRecoverableAuthResponse(first.response, first.payload)) {
      const freshToken = await this.options.refreshAccessTokenProvider()
      if (freshToken && freshToken !== accessToken) {
        const retry = await this.requestWithToken<T>(path, init, freshToken)
        if (retry.response.ok) {
          return unwrapGatewayPayload<T>(retry.payload)
        }
        throw new Error(resolveErrorMessage(retry.payload, retry.response.statusText))
      }
    }

    throw new Error(resolveErrorMessage(first.payload, first.response.statusText))
  }

  private async requestWithToken<T>(
    path: string,
    init: RequestInit,
    accessToken: string
  ): Promise<{ payload: unknown; response: Response }> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        ...(init.headers as Record<string, string> | undefined)
      }
    })
    return {
      payload: await parseJson(response),
      response
    }
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '')
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text()
  return text ? JSON.parse(text) : undefined
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

function isRecoverableAuthResponse(response: Response, payload: unknown): boolean {
  if (response.status === 401 || response.status === 403) {
    return true
  }

  return /invalid or expired|token.*expired|unauthorized/i.test(resolveErrorMessage(payload, response.statusText))
}
