import type { SiteCredential, ResourceType, PublicViewEnvelope } from '../types'
import {
  buildCanonicalRequest,
  createNonce,
  createRequestId,
  signCanonicalRequest
} from '../security/canonical-request'
import { isRetryableRuntimeError, SiteRuntimeError } from './errors'

export interface SignedOesClientRoutes {
  getLatestPublishState: string
  listChangedResources: string
  batchGetPublicViews: string
  getSnapshot: string
  reportSyncResult: string
  getPreviewView: string
}

export interface SignedOesClientRetryOptions {
  maxAttempts?: number
  baseDelayMs?: number
}

export interface SignedOesClientOptions {
  credential: SiteCredential
  routes?: Partial<SignedOesClientRoutes>
  retry?: SignedOesClientRetryOptions
  fetch?: (url: string, init: RequestInit) => Promise<Response>
  now?: () => number
  nonceFactory?: () => string
  requestIdFactory?: () => string
  traceIdFactory?: () => string
}

export interface ChangedResourceRef {
  resource_type: ResourceType
  resource_id: string
  locale: string
}

export interface ListChangedResourcesInput {
  from_publish_version: number
  to_publish_version?: number
  resource_types?: ResourceType[]
}

export interface ReportSyncResultInput {
  sync_id?: string
  local_publish_version: number
  status: 'completed' | 'failed' | 'degraded' | 'blocked'
  started_at?: string
  completed_at?: string
  error_code?: string
  error_message?: string
}

export interface GetPreviewViewInput {
  preview_token: string
  resource_type: 'product' | 'blog' | 'news'
  resource_id: string
  locale: string
}

export const DEFAULT_SITE_API_ROUTES: SignedOesClientRoutes = {
  getLatestPublishState: '/sync/latest',
  listChangedResources: '/sync/changed-resources',
  batchGetPublicViews: '/sync/public-views:batchGet',
  getSnapshot: '/sync/snapshot',
  reportSyncResult: '/sync/report-result',
  getPreviewView: '/preview/view'
}

// SignedOesClient is the only runtime channel for signed OES Site-facing API calls.
export class SignedOesClient {
  private readonly routes: SignedOesClientRoutes
  private readonly maxAttempts: number
  private readonly baseDelayMs: number
  private readonly fetchImpl: (url: string, init: RequestInit) => Promise<Response>
  private readonly now: () => number
  private readonly nonceFactory: () => string
  private readonly requestIdFactory: () => string
  private readonly traceIdFactory: () => string

  constructor(private readonly options: SignedOesClientOptions) {
    this.routes = { ...DEFAULT_SITE_API_ROUTES, ...options.routes }
    this.maxAttempts = options.retry?.maxAttempts ?? 3
    this.baseDelayMs = options.retry?.baseDelayMs ?? 250
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis)
    this.now = options.now ?? Date.now
    this.nonceFactory = options.nonceFactory ?? createNonce
    this.requestIdFactory = options.requestIdFactory ?? createRequestId
    this.traceIdFactory = options.traceIdFactory ?? createRequestId
  }

  // getLatestPublishState fetches the remote site's latest published version.
  async getLatestPublishState(localPublishVersion?: number): Promise<Record<string, unknown>> {
    const response = await this.post<Record<string, unknown>>(this.routes.getLatestPublishState, {
      local_publish_version: localPublishVersion
    })
    return {
      site_id: field(response, 'site_id', 'siteId'),
      latest_publish_version: numberField(response, 'latest_publish_version', 'latestPublishVersion'),
      latest_sync_id: field(response, 'latest_sync_id', 'latestSyncId'),
      has_updates: booleanField(response, 'has_updates', 'hasUpdates'),
      server_time: field(response, 'server_time', 'serverTime')
    }
  }

  // listChangedResources loads the aggregate delta resource list from local to remote version.
  async listChangedResources(input: ListChangedResourcesInput): Promise<Record<string, unknown>> {
    const response = await this.post<Record<string, unknown>>(this.routes.listChangedResources, input)
    const changedResources = arrayField(response, 'changed_resources', 'changedResources')
    return {
      site_id: field(response, 'site_id', 'siteId'),
      from_publish_version: numberField(response, 'from_publish_version', 'fromPublishVersion'),
      to_publish_version: numberField(response, 'to_publish_version', 'toPublishVersion'),
      requires_snapshot: booleanField(response, 'requires_snapshot', 'requiresSnapshot'),
      changed_resources: changedResources.map((resource) => ({
        resource_type: field(resource, 'resource_type', 'resourceType'),
        resource_id: field(resource, 'resource_id', 'resourceId'),
        locale: field(resource, 'locale'),
        latest_publish_version: numberField(resource, 'latest_publish_version', 'latestPublishVersion'),
        change_type: field(resource, 'change_type', 'changeType')
      }))
    }
  }

  // batchGetPublicViews loads latest public view envelopes for changed resource references.
  async batchGetPublicViews(resources: ChangedResourceRef[]): Promise<{
    public_views: PublicViewEnvelope[]
    missing_resources: ChangedResourceRef[]
    server_publish_version: number
  }> {
    const response = await this.post<Record<string, unknown>>(this.routes.batchGetPublicViews, { resources })
    return {
      public_views: arrayField(response, 'public_views', 'publicViews').map(toPublicViewEnvelope),
      missing_resources: arrayField(response, 'missing_resources', 'missingResources').map((resource) => ({
        resource_type: String(field(resource, 'resource_type', 'resourceType') ?? ''),
        resource_id: String(field(resource, 'resource_id', 'resourceId') ?? ''),
        locale: String(field(resource, 'locale') ?? '')
      })) as ChangedResourceRef[],
      server_publish_version: numberField(response, 'server_publish_version', 'serverPublishVersion')
    }
  }

  // getSnapshot loads a complete published snapshot page for the current site.
  async getSnapshot(input: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    const response = await this.post<Record<string, unknown>>(this.routes.getSnapshot, input)
    return {
      site_id: field(response, 'site_id', 'siteId'),
      snapshot_publish_version: numberField(response, 'snapshot_publish_version', 'snapshotPublishVersion'),
      public_views: arrayField(response, 'public_views', 'publicViews').map(toPublicViewEnvelope),
      next_page_token: field(response, 'next_page_token', 'nextPageToken'),
      is_complete: booleanField(response, 'is_complete', 'isComplete')
    }
  }

  // reportSyncResult reports a completed or failed runtime sync attempt back to OES.
  async reportSyncResult(input: ReportSyncResultInput): Promise<Record<string, unknown>> {
    const response = await this.post<Record<string, unknown>>(this.routes.reportSyncResult, input)
    return {
      accepted: booleanField(response, 'accepted'),
      server_time: field(response, 'server_time', 'serverTime')
    }
  }

  // getPreviewView fetches a draft preview view without writing it to the published store.
  async getPreviewView(input: GetPreviewViewInput): Promise<Record<string, unknown>> {
    const response = await this.post<Record<string, unknown>>(this.routes.getPreviewView, input)
    return {
      preview_view: toPublicViewEnvelope((field(response, 'preview_view', 'previewView') ?? {}) as Record<string, unknown>),
      expires_at: field(response, 'expires_at', 'expiresAt'),
      noindex: booleanField(response, 'noindex'),
      cache_policy: field(response, 'cache_policy', 'cachePolicy')
    }
  }

  // post signs and executes one JSON Site-facing API operation with P1 retry semantics.
  private async post<TResponse>(path: string, payload: unknown): Promise<TResponse> {
    const body = JSON.stringify(payload)
    const url = joinUrl(this.options.credential.oesBaseUrl, path)
    let lastError: unknown
    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      try {
        const response = await this.fetchImpl(url, {
          method: 'POST',
          headers: this.buildSignedHeaders(url, body),
          body
        })
        if (!response.ok) {
          throw await this.mapErrorResponse(response)
        }
        return unwrapResponseEnvelope((await response.json()) as Record<string, unknown>) as TResponse
      } catch (error) {
        lastError = error instanceof TypeError ? networkError(error) : error
        if (attempt >= this.maxAttempts || !isRetryableRuntimeError(lastError)) {
          throw lastError
        }
        await sleep(resolveRetryDelayMs(lastError, this.baseDelayMs))
      }
    }
    throw lastError
  }

  // buildSignedHeaders creates all required OES request identity and HMAC headers.
  private buildSignedHeaders(url: string, body: string): Record<string, string> {
    const timestamp = String(this.now())
    const nonce = this.nonceFactory()
    const requestId = this.requestIdFactory()
    const traceId = this.traceIdFactory()
    const canonical = buildCanonicalRequest({
      method: 'POST',
      url,
      body,
      siteId: this.options.credential.siteId,
      clientId: this.options.credential.clientId,
      credentialId: this.options.credential.credentialId,
      timestamp,
      nonce
    })

    return {
      'content-type': 'application/json',
      'x-oes-site-id': this.options.credential.siteId,
      'x-oes-client-id': this.options.credential.clientId,
      'x-oes-credential-id': this.options.credential.credentialId,
      'x-oes-timestamp': timestamp,
      'x-oes-nonce': nonce,
      'x-oes-signature': signCanonicalRequest(canonical, this.options.credential.clientSecret),
      'x-oes-request-id': requestId,
      'x-oes-trace-id': traceId
    }
  }

  // mapErrorResponse converts OES error response bodies into package runtime errors.
  private async mapErrorResponse(response: Response): Promise<SiteRuntimeError> {
    const text = await response.text()
    let payload: Record<string, unknown> = {}
    try {
      payload = text ? (JSON.parse(text) as Record<string, unknown>) : {}
    } catch {
      payload = {}
    }
    const error = (payload.error ?? {}) as Record<string, unknown>
    const retryAfterHeader = response.headers.get('retry-after')
    const retryAfterSeconds =
      retryAfterHeader && /^\d+$/.test(retryAfterHeader) ? Number(retryAfterHeader) : undefined
    return new SiteRuntimeError({
      code: String(error.code ?? statusCodeToErrorCode(response.status)),
      message: String(error.message ?? `OES Site API request failed with ${response.status}`),
      httpStatus: response.status,
      requestId: typeof payload.request_id === 'string' ? payload.request_id : undefined,
      traceId: typeof payload.trace_id === 'string' ? payload.trace_id : undefined,
      retryAfterSeconds
    })
  }
}

// unwrapResponseEnvelope accepts the api-gateway success envelope while preserving direct Site API responses.
function unwrapResponseEnvelope(payload: Record<string, unknown>): Record<string, unknown> {
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    ('code' in payload || 'message' in payload || 'meta' in payload)
  ) {
    return (payload.data ?? {}) as Record<string, unknown>
  }
  return payload
}

// toPublicViewEnvelope normalizes generated DTO casing and parses payloadJson when crossing api-gateway.
function toPublicViewEnvelope(view: Record<string, unknown>): PublicViewEnvelope {
  return {
    siteId: String(field(view, 'site_id', 'siteId') ?? ''),
    resourceType: String(field(view, 'resource_type', 'resourceType') ?? '') as ResourceType,
    resourceId: String(field(view, 'resource_id', 'resourceId') ?? ''),
    locale: String(field(view, 'locale') ?? ''),
    slug: String(field(view, 'slug') ?? ''),
    status: String(field(view, 'status') ?? '') as PublicViewEnvelope['status'],
    publishVersion: numberField(view, 'publish_version', 'publishVersion'),
    updatedAt: String(field(view, 'updated_at', 'updatedAt') ?? ''),
    payload: payloadField(view)
  }
}

// payloadField returns structured public payload whether OES responds with payload or payloadJson.
function payloadField(view: Record<string, unknown>): unknown {
  const payload = field(view, 'payload')
  if (payload !== undefined) {
    return payload
  }
  const payloadJson = field(view, 'payload_json', 'payloadJson')
  if (typeof payloadJson !== 'string') {
    return {}
  }
  try {
    return JSON.parse(payloadJson) as unknown
  } catch {
    return {}
  }
}

// field reads the first matching snake_case or generated camelCase response field.
function field(object: Record<string, unknown>, ...names: string[]): unknown {
  for (const name of names) {
    if (object[name] !== undefined) {
      return object[name]
    }
  }
  return undefined
}

// numberField reads a numeric field while keeping missing values as zero for P1 sync defaults.
function numberField(object: Record<string, unknown>, ...names: string[]): number {
  const value = field(object, ...names)
  return typeof value === 'number' && Number.isFinite(value) ? value : Number(value ?? 0)
}

// booleanField reads a boolean field without trusting string truthiness.
function booleanField(object: Record<string, unknown>, ...names: string[]): boolean {
  return field(object, ...names) === true
}

// arrayField reads an array response field and drops malformed values at the boundary.
function arrayField(object: Record<string, unknown>, ...names: string[]): Array<Record<string, unknown>> {
  const value = field(object, ...names)
  return Array.isArray(value) ? (value as Array<Record<string, unknown>>) : []
}

// joinUrl appends a route path to the OES base URL without changing the base path.
function joinUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}

// networkError maps fetch transport failures into a retryable runtime network error.
function networkError(error: TypeError): SiteRuntimeError {
  return new SiteRuntimeError({
    code: 'NETWORK_ERROR',
    message: error.message,
    runtimeStatus: 'degraded'
  })
}

// resolveRetryDelayMs honors Retry-After for rate limits and otherwise uses a small linear delay.
function resolveRetryDelayMs(error: unknown, baseDelayMs: number): number {
  if (error instanceof SiteRuntimeError && error.retryAfterSeconds !== undefined) {
    return error.retryAfterSeconds * 1000
  }
  return baseDelayMs
}

// sleep waits between retry attempts without blocking the event loop.
function sleep(delayMs: number): Promise<void> {
  if (delayMs <= 0) {
    return Promise.resolve()
  }
  return new Promise((resolve) => setTimeout(resolve, delayMs))
}

// statusCodeToErrorCode provides deterministic categories for non-contract HTTP failures.
function statusCodeToErrorCode(status: number): string {
  if (status === 400) return 'VALIDATION_FAILED'
  if (status === 401) return 'AUTH_MISSING'
  if (status === 403) return 'SCOPE_INSUFFICIENT'
  if (status === 404) return 'NOT_FOUND'
  if (status === 409) return 'CONFLICT'
  if (status === 429) return 'RATE_LIMITED'
  return 'SERVER_ERROR'
}
