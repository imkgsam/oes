import { createHash } from 'node:crypto'

import {
  normalizeSiteCapabilityManifest,
  normalizeSiteExposurePublication,
  type SiteCapabilityManifest,
  type SiteCredential,
  type ResourceType,
  type PublicViewEnvelope,
  type SiteExposurePublication
} from '../types'
import {
  buildCanonicalRequest,
  createNonce,
  createRequestId,
  signCanonicalRequest
} from '../security/canonical-request'
import { isRetryableRuntimeError, SiteRuntimeError } from './errors'
import {
  normalizeSyncReportAcknowledgement,
  requireNativeBoolean,
  requireCanonicalUint64Decimal,
  requireNonNegativeSafeInteger,
  requireTimestamp
} from './internal-contract-codec'

export interface SignedOesClientRoutes {
  registerPageCapabilities: string
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
  requestTimeoutMs?: number
  maxResponseBytes?: number
}

export interface ChangedResourceRef {
  resource_type: ResourceType
  resource_id: string
  locale: string
  latest_publish_version?: number
  change_type?: string
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

export interface SiteCapabilityRegistrationResponse {
  readonly accepted: boolean
  readonly idempotent_replay: boolean
  readonly manifest_hash: string
  readonly discovered_count: number
  readonly unavailable_page_keys: readonly string[]
  readonly drift_page_keys: readonly string[]
  readonly recovered_page_keys: readonly string[]
  readonly registration_generation: string
}

export const DEFAULT_SITE_API_ROUTES: SignedOesClientRoutes = {
  registerPageCapabilities: '/capabilities/pages:register',
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
  private readonly requestTimeoutMs: number
  private readonly maxResponseBytes: number

  constructor(private readonly options: SignedOesClientOptions) {
    this.routes = { ...DEFAULT_SITE_API_ROUTES, ...options.routes }
    this.maxAttempts = options.retry?.maxAttempts ?? 3
    this.baseDelayMs = options.retry?.baseDelayMs ?? 250
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis)
    this.now = options.now ?? Date.now
    this.nonceFactory = options.nonceFactory ?? createNonce
    this.requestIdFactory = options.requestIdFactory ?? createRequestId
    this.traceIdFactory = options.traceIdFactory ?? createRequestId
    this.requestTimeoutMs = requirePositiveLimit(options.requestTimeoutMs ?? 10_000, 'requestTimeoutMs')
    this.maxResponseBytes = requirePositiveLimit(options.maxResponseBytes ?? 8 * 1024 * 1024, 'maxResponseBytes')
  }

  // registerPageCapabilities submits one normalized complete manifest with deterministic retry idempotency.
  async registerPageCapabilities(
    manifest: SiteCapabilityManifest,
    runtimeVersion: string,
    idempotencyKey: string,
    expectedRegistrationGeneration: string
  ): Promise<SiteCapabilityRegistrationResponse> {
    const normalized = normalizeSiteCapabilityManifest(manifest)
    const capabilities = normalized.pages.map((page) => ({
      page_key: page.pageKey,
      supported_locales: page.supportedLocales
    }))
    if (idempotencyKey.trim().length === 0) {
      throw new Error('Capability registration idempotency key is required')
    }
    const expectedGeneration = requireCanonicalUint64Decimal(
      expectedRegistrationGeneration,
      'expected_registration_generation'
    )
    const response = await this.post<Record<string, unknown>>(this.routes.registerPageCapabilities, {
      idempotency_key: idempotencyKey,
      capabilities,
      runtime_version: runtimeVersion,
      expected_registration_generation: expectedGeneration
    })
    return normalizeSiteCapabilityRegistrationResponse(response, hashSiteCapabilityManifest(normalized))
  }

  // getLatestPublishState fetches the remote site's latest published version.
  async getLatestPublishState(localPublishVersion?: number): Promise<Record<string, unknown>> {
    const response = await this.post<Record<string, unknown>>(this.routes.getLatestPublishState, {
      local_publish_version: localPublishVersion
    })
    return {
      site_id: requiredStringField(response, 'site_id', 'site_id', 'siteId'),
      latest_publish_version: requiredNonNegativeIntegerField(
        response,
        'latest_publish_version',
        'latest_publish_version',
        'latestPublishVersion'
      ),
      latest_sync_id: optionalNullableStringField(
        response,
        'latest_sync_id',
        'latest_sync_id',
        'latestSyncId'
      ),
      has_updates: requiredBooleanField(response, 'has_updates', 'hasUpdates'),
      server_time: field(response, 'server_time', 'serverTime')
    }
  }

  // listChangedResources loads the aggregate delta resource list from local to remote version.
  async listChangedResources(input: ListChangedResourcesInput): Promise<Record<string, unknown>> {
    const response = await this.post<Record<string, unknown>>(this.routes.listChangedResources, input)
    const changedResources = requiredRecordArrayField(
      response,
      'changed_resources',
      'changed_resources',
      'changedResources'
    )
    return {
      site_id: requiredStringField(response, 'site_id', 'site_id', 'siteId'),
      from_publish_version: requiredNonNegativeIntegerField(
        response,
        'from_publish_version',
        'from_publish_version',
        'fromPublishVersion'
      ),
      to_publish_version: requiredNonNegativeIntegerField(
        response,
        'to_publish_version',
        'to_publish_version',
        'toPublishVersion'
      ),
      requires_snapshot: requiredBooleanField(response, 'requires_snapshot', 'requiresSnapshot'),
      changed_resources: changedResources.map(toChangedResourceRef)
    }
  }

  // batchGetPublicViews loads only the public view envelopes belonging to one fixed committed target.
  async batchGetPublicViews(resources: ChangedResourceRef[], targetPublishVersion: number): Promise<{
    public_views: PublicViewEnvelope[]
    missing_resources: ChangedResourceRef[]
    server_publish_version: number
    exposure_publication: SiteExposurePublication
  }> {
    const response = await this.post<Record<string, unknown>>(this.routes.batchGetPublicViews, {
      resources,
      target_publish_version: targetPublishVersion
    })
    return {
      public_views: requiredRecordArrayField(
        response,
        'public_views',
        'public_views',
        'publicViews'
      ).map(toPublicViewEnvelope),
      missing_resources: requiredRecordArrayField(
        response,
        'missing_resources',
        'missing_resources',
        'missingResources'
      ).map(toPublicViewResourceRef),
      server_publish_version: requiredNonNegativeIntegerField(
        response,
        'server_publish_version',
        'server_publish_version',
        'serverPublishVersion'
      ),
      exposure_publication: requiredExposurePublication(response)
    }
  }

  // getSnapshot loads a complete published snapshot page for the current site.
  async getSnapshot(input: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    const response = await this.post<Record<string, unknown>>(this.routes.getSnapshot, input)
    return {
      site_id: requiredStringField(response, 'site_id', 'site_id', 'siteId'),
      snapshot_publish_version: requiredNonNegativeIntegerField(
        response,
        'snapshot_publish_version',
        'snapshot_publish_version',
        'snapshotPublishVersion'
      ),
      public_views: requiredRecordArrayField(
        response,
        'public_views',
        'public_views',
        'publicViews'
      ).map(toPublicViewEnvelope),
      next_page_token: optionalStringField(response, 'next_page_token', 'nextPageToken'),
      is_complete: requiredBooleanField(response, 'is_complete', 'isComplete'),
      exposure_publication: requiredExposurePublication(response)
    }
  }

  // reportSyncResult reports a completed or failed runtime sync attempt back to OES.
  async reportSyncResult(input: ReportSyncResultInput): Promise<Record<string, unknown>> {
    const response = await this.post<Record<string, unknown>>(this.routes.reportSyncResult, input)
    return normalizeSyncReportAcknowledgement(response)
  }

  // getPreviewView fetches a draft preview view without writing it to the published store.
  async getPreviewView(input: GetPreviewViewInput): Promise<Record<string, unknown>> {
    const response = await this.post<Record<string, unknown>>(this.routes.getPreviewView, input)
    return {
      preview_view: toPublicViewEnvelope(
        requiredRecordField(response, 'preview_view', 'preview_view', 'previewView')
      ),
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
      const abortController = new AbortController()
      let timedOut = false
      const timeout = setTimeout(() => {
        timedOut = true
        abortController.abort()
      }, this.requestTimeoutMs)
      timeout.unref?.()
      try {
        const response = await this.fetchImpl(url, {
          method: 'POST',
          headers: this.buildSignedHeaders(url, body),
          body,
          signal: abortController.signal
        })
        const responseText = await readResponseText(response, this.maxResponseBytes)
        if (!response.ok) {
          throw this.mapErrorResponse(response, responseText)
        }
        return unwrapResponseEnvelope(JSON.parse(responseText) as Record<string, unknown>) as TResponse
      } catch (error) {
        lastError = timedOut
          ? requestTimeoutError(this.requestTimeoutMs)
          : error instanceof TypeError
            ? networkError(error)
            : error
        if (attempt >= this.maxAttempts || !isRetryableRuntimeError(lastError)) {
          throw lastError
        }
        await sleep(resolveRetryDelayMs(lastError, this.baseDelayMs))
      } finally {
        clearTimeout(timeout)
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
  private mapErrorResponse(response: Response, text: string): SiteRuntimeError {
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

// hashSiteCapabilityManifest returns the canonical content hash used to detect local manifest changes.
export function hashSiteCapabilityManifest(manifest: SiteCapabilityManifest): string {
  const normalized = normalizeSiteCapabilityManifest(manifest)
  const canonicalJson = JSON.stringify(
    normalized.pages.map((page) => ({
      page_key: page.pageKey,
      supported_locales: page.supportedLocales
    }))
  )
  return createHash('sha256')
    .update(Buffer.from(canonicalJson, 'utf8'))
    .digest('hex')
}

// normalizeSiteCapabilityRegistrationResponse strictly validates the frozen registration response contract.
export function normalizeSiteCapabilityRegistrationResponse(
  input: unknown,
  expectedManifestHash: string
): SiteCapabilityRegistrationResponse {
  const response = requiredPlainRecord(input, 'capability registration response')
  requireExactRegistrationFields(response)
  const accepted = requiredRegistrationBoolean(response, 'accepted', 'accepted')
  const idempotentReplay = requiredRegistrationBoolean(
    response,
    'idempotent_replay',
    'idempotentReplay'
  )
  const manifestHash = requiredRegistrationString(response, 'manifest_hash', 'manifestHash')
  if (manifestHash !== expectedManifestHash) {
    throw new Error('Invalid capability registration response: manifest_hash mismatch')
  }
  const discoveredCount = requiredRegistrationSafeInteger(
    response,
    'discovered_count',
    'discoveredCount'
  )
  return Object.freeze({
    accepted,
    idempotent_replay: idempotentReplay,
    manifest_hash: manifestHash,
    discovered_count: discoveredCount,
    unavailable_page_keys: Object.freeze(
      requiredRegistrationPageKeys(response, 'unavailable_page_keys', 'unavailablePageKeys')
    ),
    drift_page_keys: Object.freeze(
      requiredRegistrationPageKeys(response, 'drift_page_keys', 'driftPageKeys')
    ),
    recovered_page_keys: Object.freeze(
      requiredRegistrationPageKeys(response, 'recovered_page_keys', 'recoveredPageKeys')
    ),
    registration_generation: requireCanonicalUint64Decimal(
      requiredRegistrationField(
        response,
        'registration_generation',
        'registrationGeneration'
      ),
      'capability registration response registration_generation'
    )
  })
}

// requireExactRegistrationFields rejects missing, duplicated-alias, and unknown response fields.
function requireExactRegistrationFields(response: Record<string, unknown>): void {
  const aliases = [
    ['accepted', 'accepted'],
    ['idempotent_replay', 'idempotentReplay'],
    ['manifest_hash', 'manifestHash'],
    ['discovered_count', 'discoveredCount'],
    ['unavailable_page_keys', 'unavailablePageKeys'],
    ['drift_page_keys', 'driftPageKeys'],
    ['recovered_page_keys', 'recoveredPageKeys'],
    ['registration_generation', 'registrationGeneration']
  ] as const
  const allowed = new Set<string>(aliases.flat())
  if (Object.keys(response).some((key) => !allowed.has(key))) {
    throw new Error('Invalid capability registration response: unknown field')
  }
  for (const [snakeName, camelName] of aliases) {
    requiredRegistrationField(response, snakeName, camelName)
  }
}

// requiredRegistrationField returns exactly one alias representation for a required response field.
function requiredRegistrationField(
  response: Record<string, unknown>,
  snakeName: string,
  camelName: string
): unknown {
  const hasSnake = Object.prototype.hasOwnProperty.call(response, snakeName)
  const hasCamel = camelName !== snakeName && Object.prototype.hasOwnProperty.call(response, camelName)
  if ((hasSnake ? 1 : 0) + (hasCamel ? 1 : 0) !== 1) {
    throw new Error(`Invalid capability registration response: ${snakeName} is required exactly once`)
  }
  return response[hasSnake ? snakeName : camelName]
}

// requiredRegistrationBoolean validates one native boolean registration field.
function requiredRegistrationBoolean(
  response: Record<string, unknown>,
  snakeName: string,
  camelName: string
): boolean {
  const value = requiredRegistrationField(response, snakeName, camelName)
  if (typeof value !== 'boolean') {
    throw new Error(`Invalid capability registration response: ${snakeName} must be boolean`)
  }
  return value
}

// requiredRegistrationString validates one non-empty trimmed registration string.
function requiredRegistrationString(
  response: Record<string, unknown>,
  snakeName: string,
  camelName: string
): string {
  const value = requiredRegistrationField(response, snakeName, camelName)
  if (typeof value !== 'string' || value.length === 0 || value !== value.trim()) {
    throw new Error(`Invalid capability registration response: ${snakeName} must be a non-empty string`)
  }
  return value
}

// requiredRegistrationSafeInteger validates one non-negative safe integer without coercion.
function requiredRegistrationSafeInteger(
  response: Record<string, unknown>,
  snakeName: string,
  camelName: string
): number {
  const value = requiredRegistrationField(response, snakeName, camelName)
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`Invalid capability registration response: ${snakeName} must be a non-negative safe integer`)
  }
  return value
}

// requiredRegistrationPageKeys validates every required pageKey array without filtering or deduplication.
function requiredRegistrationPageKeys(
  response: Record<string, unknown>,
  snakeName: string,
  camelName: string
): string[] {
  const value = requiredRegistrationField(response, snakeName, camelName)
  if (!Array.isArray(value)) {
    throw new Error(`Invalid capability registration response: ${snakeName} must be an array`)
  }
  const pageKeys = value.map((pageKey) => {
    if (
      typeof pageKey !== 'string' ||
      pageKey.length === 0 ||
      pageKey !== pageKey.trim()
    ) {
      throw new Error(`Invalid capability registration response: ${snakeName} contains an invalid pageKey`)
    }
    return pageKey
  })
  if (new Set(pageKeys).size !== pageKeys.length) {
    throw new Error(`Invalid capability registration response: ${snakeName} contains a duplicate pageKey`)
  }
  return pageKeys
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
  const resourceType = requiredResourceType(view, 'public view')
  const status = requiredStringField(view, 'public view status', 'status')
  if (!['published', 'unpublished', 'deleted', 'disabled', 'draft_preview'].includes(status)) {
    throw new Error('Invalid public view member: unsupported status')
  }
  return {
    siteId: requiredStringField(view, 'public view siteId', 'site_id', 'siteId'),
    resourceType,
    resourceId: requiredStringField(view, 'public view resourceId', 'resource_id', 'resourceId'),
    locale: requiredLocaleField(view, 'public view locale', 'locale'),
    slug: requiredStringField(view, 'public view slug', 'slug'),
    status: status as PublicViewEnvelope['status'],
    publishVersion: requiredNonNegativeIntegerField(
      view,
      'public view publishVersion',
      'publish_version',
      'publishVersion'
    ),
    updatedAt: requiredTimestampField(view, 'public view updatedAt', 'updated_at', 'updatedAt'),
    payload: payloadField(view)
  }
}

// payloadField returns structured public payload whether OES responds with payload or payloadJson.
function payloadField(view: Record<string, unknown>): unknown {
  const payload = field(view, 'payload')
  if (payload !== undefined) {
    return requiredPlainRecord(payload, 'public view payload')
  }
  const payloadJson = field(view, 'payload_json', 'payloadJson')
  if (typeof payloadJson !== 'string') {
    throw new Error('Invalid public view member: payload or payload_json is required')
  }
  try {
    return requiredPlainRecord(JSON.parse(payloadJson) as unknown, 'public view payload_json')
  } catch {
    throw new Error('Invalid public view member: payload_json must contain an object')
  }
}

// requiredExposurePublication strictly normalizes the mandatory slug-free governance sync payload.
function requiredExposurePublication(response: Record<string, unknown>): SiteExposurePublication {
  const value = field(response, 'exposure_publication', 'exposurePublication')
  if (value === undefined) {
    throw new Error('Invalid site exposure publication: exposure_publication is required')
  }
  return normalizeSiteExposurePublication(value)
}

const PUBLIC_RESOURCE_TYPES = new Set<ResourceType>([
  'product',
  'category',
  'content',
  'blog',
  'news',
  'article',
  'article-category'
])

// toChangedResourceRef strictly parses one delta member including the exposure-only marker.
function toChangedResourceRef(resource: Record<string, unknown>, index: number): Record<string, unknown> {
  const label = `changed_resources member ${index}`
  const resourceType = requiredStringField(resource, `${label} resourceType`, 'resource_type', 'resourceType')
  if (resourceType !== 'site-exposure' && !PUBLIC_RESOURCE_TYPES.has(resourceType as ResourceType)) {
    throw new Error(`Invalid ${label}: unsupported resource_type`)
  }
  const localeValue = requiredField(resource, `${label} locale`, 'locale')
  if (typeof localeValue !== 'string') {
    throw new Error(`Invalid ${label}: locale must be a string`)
  }
  const locale =
    resourceType === 'site-exposure'
      ? localeValue
      : normalizeLocaleValue(localeValue, `${label} locale`)
  if (resourceType === 'site-exposure' && locale !== '') {
    throw new Error(`Invalid ${label}: site-exposure locale must be empty`)
  }
  const changeType = requiredStringField(resource, `${label} changeType`, 'change_type', 'changeType')
  if (!['create', 'update', 'unpublish', 'locale_activate', 'locale_disable'].includes(changeType)) {
    throw new Error(`Invalid ${label}: unsupported change_type`)
  }
  return {
    resource_type: resourceType,
    resource_id: requiredStringField(resource, `${label} resourceId`, 'resource_id', 'resourceId'),
    locale,
    latest_publish_version: requiredNonNegativeIntegerField(
      resource,
      `${label} latestPublishVersion`,
      'latest_publish_version',
      'latestPublishVersion'
    ),
    change_type: changeType
  }
}

// toPublicViewResourceRef strictly parses one business resource identity from missing_resources.
function toPublicViewResourceRef(resource: Record<string, unknown>, index: number): ChangedResourceRef {
  const label = `missing_resources member ${index}`
  return {
    resource_type: requiredResourceType(resource, label),
    resource_id: requiredStringField(resource, `${label} resourceId`, 'resource_id', 'resourceId'),
    locale: requiredLocaleField(resource, `${label} locale`, 'locale')
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

// booleanField reads a boolean field without trusting string truthiness.
function booleanField(object: Record<string, unknown>, ...names: string[]): boolean {
  return field(object, ...names) === true
}

// arrayField reads an array response field and drops malformed values at the boundary.
function requiredRecordArrayField(
  object: Record<string, unknown>,
  label: string,
  ...names: string[]
): Array<Record<string, unknown>> {
  const value = field(object, ...names)
  if (!Array.isArray(value)) {
    throw new Error(`Invalid ${label}: required field must be an array`)
  }
  return value.map((member, index) => requiredPlainRecord(member, `${label} member ${index}`))
}

// requiredRecordField validates one mandatory object response field.
function requiredRecordField(
  object: Record<string, unknown>,
  label: string,
  ...names: string[]
): Record<string, unknown> {
  return requiredPlainRecord(requiredField(object, label, ...names), label)
}

// requiredPlainRecord rejects null, arrays, and primitives at signed response member boundaries.
function requiredPlainRecord(input: unknown, label: string): Record<string, unknown> {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error(`Invalid ${label}: member must be an object`)
  }
  return input as Record<string, unknown>
}

// requiredField returns one present response field without coercing missing values.
function requiredField(object: Record<string, unknown>, label: string, ...names: string[]): unknown {
  const value = field(object, ...names)
  if (value === undefined) {
    throw new Error(`Invalid ${label}: required field is missing`)
  }
  return value
}

// requiredStringField validates a non-empty trimmed string response field.
function requiredStringField(object: Record<string, unknown>, label: string, ...names: string[]): string {
  const value = requiredField(object, label, ...names)
  if (typeof value !== 'string' || value.length === 0 || value !== value.trim()) {
    throw new Error(`Invalid ${label}: non-empty string is required`)
  }
  return value
}

// requiredResourceType validates one P1 business resource type.
function requiredResourceType(object: Record<string, unknown>, label: string): ResourceType {
  const value = requiredStringField(object, `${label} resourceType`, 'resource_type', 'resourceType')
  if (!PUBLIC_RESOURCE_TYPES.has(value as ResourceType)) {
    throw new Error(`Invalid ${label}: unsupported resource_type`)
  }
  return value as ResourceType
}

// requiredLocaleField validates and canonicalizes one required resource locale.
function requiredLocaleField(object: Record<string, unknown>, label: string, ...names: string[]): string {
  return normalizeLocaleValue(requiredField(object, label, ...names), label)
}

// normalizeLocaleValue validates one BCP 47 locale without filtering malformed values.
function normalizeLocaleValue(input: unknown, label: string): string {
  if (typeof input !== 'string' || input.length === 0 || input !== input.trim()) {
    throw new Error(`Invalid ${label}: locale is required`)
  }
  try {
    return Intl.getCanonicalLocales(input)[0]!
  } catch {
    throw new Error(`Invalid ${label}: BCP 47 locale is required`)
  }
}

// requiredNonNegativeIntegerField validates versions without numeric coercion.
function requiredNonNegativeIntegerField(
  object: Record<string, unknown>,
  label: string,
  ...names: string[]
): number {
  return requireNonNegativeSafeInteger(requiredField(object, label, ...names), label)
}

// requiredBooleanField validates a mandatory boolean without false-default coercion.
function requiredBooleanField(object: Record<string, unknown>, ...names: string[]): boolean {
  const label = names[0] ?? 'boolean field'
  return requireNativeBoolean(requiredField(object, label, ...names), label)
}

// optionalStringField accepts an omitted/empty page token and rejects non-string token values.
function optionalStringField(object: Record<string, unknown>, ...names: string[]): string | undefined {
  const value = field(object, ...names)
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  if (typeof value !== 'string' || value !== value.trim()) {
    throw new Error(`Invalid ${names[0] ?? 'string field'}: string is required`)
  }
  return value
}

// optionalNullableStringField accepts only a missing/null value or one non-empty trimmed native string.
function optionalNullableStringField(
  object: Record<string, unknown>,
  label: string,
  ...names: string[]
): string | null | undefined {
  const value = field(object, ...names)
  if (value === undefined) {
    return undefined
  }
  if (value === null) {
    return null
  }
  if (typeof value !== 'string' || value.length === 0 || value !== value.trim()) {
    throw new Error(`Invalid ${label}: optional string is required`)
  }
  return value
}

// requiredTimestampField validates a non-empty parseable timestamp response field.
function requiredTimestampField(object: Record<string, unknown>, label: string, ...names: string[]): string {
  return requireTimestamp(requiredField(object, label, ...names), label)
}

// requirePositiveLimit validates bounded-request configuration before the client can send traffic.
function requirePositiveLimit(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`Invalid SignedOesClient ${label}`)
  }
  return value
}

// readResponseText consumes a response stream while enforcing content-length and actual byte limits.
async function readResponseText(response: Response, maxBytes: number): Promise<string> {
  const contentLength = response.headers.get('content-length')
  if (contentLength && /^\d+$/.test(contentLength) && Number(contentLength) > maxBytes) {
    throw responseTooLargeError(maxBytes)
  }
  if (!response.body) {
    return ''
  }
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    totalBytes += value.byteLength
    if (totalBytes > maxBytes) {
      await reader.cancel()
      throw responseTooLargeError(maxBytes)
    }
    chunks.push(value)
  }
  const body = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(body)
}

// requestTimeoutError classifies an aborted request deadline without exposing transport details.
function requestTimeoutError(timeoutMs: number): SiteRuntimeError {
  return new SiteRuntimeError({
    code: 'REQUEST_TIMEOUT',
    message: `OES Site API request exceeded ${timeoutMs}ms`
  })
}

// responseTooLargeError classifies an oversized response before JSON parsing or retry.
function responseTooLargeError(maxBytes: number): SiteRuntimeError {
  return new SiteRuntimeError({
    code: 'RESPONSE_TOO_LARGE',
    message: `OES Site API response exceeded ${maxBytes} bytes`
  })
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
