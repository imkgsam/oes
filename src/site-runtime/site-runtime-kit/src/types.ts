import {
  compareUtf8Unsigned,
  requireNonNegativeSafeInteger
} from './client/internal-contract-codec'

export type SiteRuntimeStatus = 'healthy' | 'degraded' | 'blocked' | 'failed' | 'unknown'

export type ResourceType = 'product' | 'category' | 'content' | 'blog' | 'news' | 'article' | 'article-category' | 'faq'

export type HistoricalAliasNamespace = 'blog' | 'news' | 'article-category'

export type PublishedResourceStatus = 'published' | 'unpublished' | 'deleted' | 'disabled'

const EXPOSURE_PAGE_KEY_PATTERN = /^[^\s]+$/u

export interface SitePageCapability {
  readonly pageKey: string
  readonly supportedLocales: readonly string[]
}

export interface SiteCapabilityManifest {
  readonly pages: readonly SitePageCapability[]
}

export interface SitePageExposure {
  pageKey: string
  enabled: boolean
  indexable: boolean
  supportedLocales: string[]
}

export interface SiteExposurePublication {
  siteId: string
  publishVersion: number
  defaultLocale: string
  activeLocales: string[]
  pages: SitePageExposure[]
  publishedAt: string
}

export interface SiteCredential {
  siteId: string
  clientId: string
  credentialId: string
  clientSecret: string
  webhookSigningSecret: string
  oesBaseUrl: string
  environment: string
}

export interface PublicViewEnvelope<TPayload = unknown> {
  siteId: string
  resourceType: ResourceType
  resourceId: string
  locale: string
  slug: string
  status: PublishedResourceStatus | 'draft_preview'
  publishVersion: number
  updatedAt: string
  payload: TPayload
}

export interface StoredPublishedResource {
  siteId: string
  resourceType: ResourceType
  resourceId: string
  slug: string
  locale: string
  status: PublishedResourceStatus
  publishVersion: number
  payloadJson: string
  updatedAt: string
}

export interface PublishState {
  siteId: string
  localPublishVersion: number
  latestSyncId: string | null
  lastSuccessfulSyncAt: string | null
  lastKnownRemotePublishVersion: number | null
}

export interface RemotePublishObservation {
  siteId: string
  expectedLocalPublishVersion: number
  remotePublishVersion: number
}

export interface ListPublishedResourcesQuery {
  siteId: string
  resourceType: ResourceType
  locale?: string
  status?: PublishedResourceStatus
  cursor?: string
  limit?: number
}

export interface GetPublishedResourceBySlugQuery {
  siteId: string
  resourceType: ResourceType
  slug: string
  locale: string
  status?: PublishedResourceStatus
}

export interface PublishedResourceIdentity {
  resourceType: ResourceType
  resourceId: string
  locale: string
}

export interface GetPublishedResourceQuery extends PublishedResourceIdentity {
  siteId: string
}

export interface ResolveHistoricalAliasQuery {
  siteId: string
  namespace: HistoricalAliasNamespace
  locale: string
  slug: string
}

export interface HistoricalAliasResolution extends PublishedResourceIdentity {
  resourceType: HistoricalAliasNamespace
  canonicalSlug: string
}

export interface SyncRunStart {
  siteId: string
  trigger: string
  fromPublishVersion: number
  toPublishVersion: number | null
}

export interface SyncRunCompletion {
  status: 'completed' | 'failed' | 'degraded' | 'blocked'
  localPublishVersion: number
  errorCode?: string
  errorMessage?: string
}

export interface StoredSyncRun {
  runId: string
  siteId: string
  trigger: string
  fromPublishVersion: number
  toPublishVersion: number | null
  status: string
  startedAt: string
  completedAt: string | null
  localPublishVersion: number | null
  errorCode: string | null
  errorMessage: string | null
}

export interface SnapshotReplacement {
  siteId: string
  publishVersion: number
  resources: StoredPublishedResource[]
}

export interface PublicationCommit {
  mode: 'snapshot' | 'delta' | 'rebuild'
  siteId: string
  expectedLocalPublishVersion: number
  publishVersion: number
  latestSyncId: string | null
  lastKnownRemotePublishVersion: number
  exposure: SiteExposurePublication
  resources: StoredPublishedResource[]
  missingResources: PublishedResourceIdentity[]
}

export interface StoredCapabilityRegistrationState {
  siteId: string
  clientId: string
  manifestHash: string
  idempotencyKey: string
  responseJson: string | null
  generation: number
  claimToken: string | null
  claimExpiresAtMs: number | null
  remoteRegistrationGeneration: string
  expectedRegistrationGeneration: string
  idempotencyKeyTerminal: boolean
  updatedAt: string
}

export interface CapabilityRegistrationClaimInput {
  siteId: string
  clientId: string
  manifestHash: string
  proposedIdempotencyKey: string
  claimToken: string
  claimedAtMs: number
  leaseDurationMs: number
  updatedAt: string
}

export interface CapabilityRegistrationClaim {
  claimed: boolean
  state: StoredCapabilityRegistrationState
}

export interface CapabilityRegistrationClaimCompletion {
  siteId: string
  clientId: string
  manifestHash: string
  generation: number
  claimToken: string
  responseJson: string
  remoteRegistrationGeneration: string
  idempotencyKeyTerminal: boolean
  updatedAt: string
}

export interface CapabilityRegistrationGenerationObservation {
  siteId: string
  clientId: string
  remoteRegistrationGeneration: string
}

export interface CapabilityRegistrationClaimRelease {
  siteId: string
  clientId: string
  manifestHash: string
  generation: number
  claimToken: string
  updatedAt: string
}

export interface LocalPublishedStore {
  init(): Promise<void>
  close(): Promise<void>
  getPublishState(siteId: string): Promise<PublishState>
  updatePublishState(state: PublishState): Promise<void>
  observeRemotePublishVersion(observation: RemotePublishObservation): Promise<boolean>
  beginSyncRun(input: SyncRunStart): Promise<string>
  completeSyncRun(runId: string, completion: SyncRunCompletion): Promise<void>
  getSyncRun(runId: string): Promise<StoredSyncRun | null>
  rememberWebhookEvent(siteId: string, eventId: string, nonce: string): Promise<boolean>
  hasWebhookEvent(siteId: string, eventId: string): Promise<boolean>
  hasWebhookNonce(siteId: string, nonce: string): Promise<boolean>
  rememberWebhookNonce(siteId: string, nonce: string): Promise<void>
  upsertPublishedResources(resources: StoredPublishedResource[]): Promise<void>
  replaceSnapshot(input: SnapshotReplacement): Promise<void>
  commitPublication(input: PublicationCommit): Promise<void>
  getCapabilityRegistrationState(
    siteId: string,
    clientId: string
  ): Promise<StoredCapabilityRegistrationState | null>
  saveCapabilityRegistrationState(state: StoredCapabilityRegistrationState): Promise<void>
  claimCapabilityRegistration(input: CapabilityRegistrationClaimInput): Promise<CapabilityRegistrationClaim>
  completeCapabilityRegistrationClaim(input: CapabilityRegistrationClaimCompletion): Promise<boolean>
  releaseCapabilityRegistrationClaim(input: CapabilityRegistrationClaimRelease): Promise<boolean>
  observeCapabilityRegistrationGeneration(
    input: CapabilityRegistrationGenerationObservation
  ): Promise<boolean>
  getSiteExposurePublication(siteId: string): Promise<SiteExposurePublication | null>
  getPublishedResource(query: GetPublishedResourceQuery): Promise<StoredPublishedResource | null>
  listPublishedResources(query: ListPublishedResourcesQuery): Promise<{
    items: StoredPublishedResource[]
    nextCursor: string | null
  }>
  getPublishedResourceBySlug(
    query: GetPublishedResourceBySlugQuery
  ): Promise<StoredPublishedResource | null>
  resolveHistoricalAlias(
    query: ResolveHistoricalAliasQuery
  ): Promise<HistoricalAliasResolution | null>
}

// normalizeDynamicSlug applies the frozen comparison form shared by canonical and historical slug handling.
export function normalizeDynamicSlug(slug: string): string {
  if (typeof slug !== 'string') {
    throw new Error('Invalid dynamic slug: string is required')
  }
  const normalized = slug.trim().normalize('NFKC').toLowerCase()
  if (normalized.length === 0) {
    throw new Error('Invalid dynamic slug: non-empty value is required')
  }
  return normalized
}

// normalizeSiteCapabilityManifest validates the complete Storefront declaration and returns stable ordering.
export function normalizeSiteCapabilityManifest(input: unknown): SiteCapabilityManifest {
  const manifest = requirePlainRecord(input, 'capability manifest')
  requireExactKeys(manifest, ['pages'], 'capability manifest')
  if (!Array.isArray(manifest.pages)) {
    throw new Error('Invalid capability manifest: pages must be an array')
  }

  const seenPageKeys = new Set<string>()
  const pages = manifest.pages.map((value, index) => {
    const page = requirePlainRecord(value, `capability manifest page ${index}`)
    requireExactKeys(page, ['pageKey', 'supportedLocales'], `capability manifest page ${index}`)
    if (
      typeof page.pageKey !== 'string' ||
      page.pageKey.length === 0 ||
      page.pageKey !== page.pageKey.trim()
    ) {
      throw new Error(`Invalid capability manifest: pageKey at index ${index}`)
    }
    const pageKey = page.pageKey
    if (seenPageKeys.has(pageKey)) {
      throw new Error(`Invalid capability manifest: duplicate pageKey ${pageKey}`)
    }
    seenPageKeys.add(pageKey)
    if (!Array.isArray(page.supportedLocales) || page.supportedLocales.length === 0) {
      throw new Error(`Invalid capability manifest: supportedLocales is required for ${pageKey}`)
    }
    const validatedLocales = page.supportedLocales.map((locale) =>
      validateCapabilityLocale(locale, pageKey)
    )
    if (
      new Set(validatedLocales.map((locale) => locale.canonicalIdentity)).size !==
      validatedLocales.length
    ) {
      throw new Error(`Invalid capability manifest: duplicate supportedLocales for ${pageKey}`)
    }
    const supportedLocales = validatedLocales.map((locale) => locale.value)
    return Object.freeze({
      pageKey,
      supportedLocales: Object.freeze([...supportedLocales].sort(compareUtf8Unsigned))
    })
  })

  return Object.freeze({
    pages: Object.freeze(
      pages.sort((left, right) => compareUtf8Unsigned(left.pageKey, right.pageKey))
    )
  })
}

// normalizeSiteExposurePublication strictly validates one slug-free publication across snake/camel boundaries.
export function normalizeSiteExposurePublication(input: unknown): SiteExposurePublication {
  const publication = requireJsonRecord(input, 'site exposure publication')
  requireAllowedKeys(
    publication,
    [
      'site_id',
      'siteId',
      'publish_version',
      'publishVersion',
      'default_locale',
      'defaultLocale',
      'active_locales',
      'activeLocales',
      'pages',
      'published_at',
      'publishedAt'
    ],
    'site exposure publication'
  )
  const siteId = requireTrimmedString(
    requireAliasedField(publication, 'site_id', 'siteId', 'site exposure publication'),
    'site exposure publication siteId'
  )
  const publishVersion = requireNonNegativeInteger(
    requireAliasedField(publication, 'publish_version', 'publishVersion', 'site exposure publication'),
    'site exposure publication publishVersion'
  )
  const defaultLocale = normalizeStrictLocale(
    requireAliasedField(publication, 'default_locale', 'defaultLocale', 'site exposure publication'),
    'site exposure publication defaultLocale'
  )
  const activeLocales = normalizeStrictLocaleArray(
    requireAliasedField(publication, 'active_locales', 'activeLocales', 'site exposure publication'),
    'site exposure publication activeLocales',
    true
  )
  if (!activeLocales.includes(defaultLocale)) {
    throw new Error('Invalid site exposure publication: defaultLocale must be active')
  }
  const pagesInput = requireAliasedField(
    publication,
    'pages',
    'pages',
    'site exposure publication'
  )
  if (!Array.isArray(pagesInput)) {
    throw new Error('Invalid site exposure publication: pages must be an array')
  }
  const pageKeys = new Set<string>()
  const pages = pagesInput.map((inputPage, index) => {
    const page = requireJsonRecord(inputPage, `site exposure page ${index}`)
    requireAllowedKeys(
      page,
      [
        'page_key',
        'pageKey',
        'enabled',
        'indexable',
        'supported_locales',
        'supportedLocales'
      ],
      `site exposure page ${index}`
    )
    const pageKey = requireTrimmedString(
      requireAliasedField(page, 'page_key', 'pageKey', `site exposure page ${index}`),
      `site exposure page ${index} pageKey`
    )
    if (!EXPOSURE_PAGE_KEY_PATTERN.test(pageKey) || pageKeys.has(pageKey)) {
      throw new Error(`Invalid site exposure publication: invalid or duplicate pageKey ${pageKey}`)
    }
    pageKeys.add(pageKey)
    const enabled = requireBooleanField(page, 'enabled', `site exposure page ${pageKey}`)
    const indexable = requireBooleanField(page, 'indexable', `site exposure page ${pageKey}`)
    const supportedLocales = normalizeStrictLocaleArray(
      requireAliasedField(page, 'supported_locales', 'supportedLocales', `site exposure page ${pageKey}`),
      `site exposure page ${pageKey} supportedLocales`,
      true
    )
    return { pageKey, enabled, indexable, supportedLocales }
  })
  const publishedAt = requireTrimmedString(
    requireAliasedField(publication, 'published_at', 'publishedAt', 'site exposure publication'),
    'site exposure publication publishedAt'
  )
  if (!Number.isFinite(Date.parse(publishedAt))) {
    throw new Error('Invalid site exposure publication: publishedAt must be an ISO-compatible timestamp')
  }
  return {
    siteId,
    publishVersion,
    defaultLocale,
    activeLocales,
    pages: pages.sort((left, right) => left.pageKey.localeCompare(right.pageKey)),
    publishedAt
  }
}

// requirePlainRecord rejects arrays, class instances, and primitives at the manifest boundary.
function requirePlainRecord(input: unknown, label: string): Record<string, unknown> {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error(`Invalid ${label}: expected an object`)
  }
  const prototype = Object.getPrototypeOf(input)
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error(`Invalid ${label}: expected a plain object`)
  }
  return input as Record<string, unknown>
}

// requireJsonRecord accepts cross-realm JSON objects while still rejecting arrays, null, and primitives.
function requireJsonRecord(input: unknown, label: string): Record<string, unknown> {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error(`Invalid ${label}: expected an object`)
  }
  return input as Record<string, unknown>
}

// requireExactKeys prevents layout, routing, content, resource, and sitemap data from crossing the manifest boundary.
function requireExactKeys(record: Record<string, unknown>, expected: string[], label: string): void {
  const allowed = new Set(expected)
  const unexpected = Object.keys(record).filter((key) => !allowed.has(key))
  const missing = expected.filter((key) => !(key in record))
  if (unexpected.length > 0 || missing.length > 0) {
    throw new Error(`Invalid ${label}: expected only ${expected.join(', ')}`)
  }
}

// requireAllowedKeys rejects unrecognized contract fields while alias validation enforces required fields.
function requireAllowedKeys(record: Record<string, unknown>, allowedKeys: string[], label: string): void {
  const allowed = new Set(allowedKeys)
  if (Object.keys(record).some((key) => !allowed.has(key))) {
    throw new Error(`Invalid ${label}: unexpected field`)
  }
}

// requireAliasedField returns exactly one snake_case or camelCase representation of a required field.
function requireAliasedField(
  record: Record<string, unknown>,
  snakeName: string,
  camelName: string,
  label: string
): unknown {
  const hasSnake = Object.prototype.hasOwnProperty.call(record, snakeName)
  const hasCamel = camelName !== snakeName && Object.prototype.hasOwnProperty.call(record, camelName)
  if ((hasSnake ? 1 : 0) + (hasCamel ? 1 : 0) !== 1) {
    throw new Error(`Invalid ${label}: exactly one of ${snakeName}/${camelName} is required`)
  }
  return record[hasSnake ? snakeName : camelName]
}

// requireTrimmedString validates a non-empty string without silently trimming contract data.
function requireTrimmedString(input: unknown, label: string): string {
  if (typeof input !== 'string' || input.length === 0 || input !== input.trim()) {
    throw new Error(`Invalid ${label}: non-empty trimmed string is required`)
  }
  return input
}

// requireNonNegativeInteger validates publication versions without numeric coercion.
function requireNonNegativeInteger(input: unknown, label: string): number {
  return requireNonNegativeSafeInteger(input, label)
}

// requireBooleanField preserves true/false semantics instead of coercing malformed values.
function requireBooleanField(record: Record<string, unknown>, name: string, label: string): boolean {
  if (!Object.prototype.hasOwnProperty.call(record, name) || typeof record[name] !== 'boolean') {
    throw new Error(`Invalid ${label}: ${name} must be boolean`)
  }
  return record[name]
}

// normalizeStrictLocaleArray validates every locale, canonicalizes ordering, and rejects canonical duplicates.
function normalizeStrictLocaleArray(input: unknown, label: string, requireNonEmpty: boolean): string[] {
  if (!Array.isArray(input) || (requireNonEmpty && input.length === 0)) {
    throw new Error(`Invalid ${label}: locale array is required`)
  }
  const locales = input.map((locale) => normalizeStrictLocale(locale, label))
  if (new Set(locales).size !== locales.length) {
    throw new Error(`Invalid ${label}: duplicate locale`)
  }
  return locales.sort()
}

// normalizeStrictLocale canonicalizes one BCP 47 locale without filtering malformed input.
function normalizeStrictLocale(input: unknown, label: string): string {
  const locale = requireTrimmedString(input, label)
  try {
    return Intl.getCanonicalLocales(locale)[0]!
  } catch {
    throw new Error(`Invalid ${label}: BCP 47 locale is required`)
  }
}

// validateCapabilityLocale checks BCP 47 identity while preserving the exact bytes hashed and sent.
function validateCapabilityLocale(
  input: unknown,
  pageKey: string
): { value: string; canonicalIdentity: string } {
  if (typeof input !== 'string' || input.length === 0 || input !== input.trim()) {
    throw new Error(`Invalid capability manifest: locale for ${pageKey}`)
  }
  try {
    return { value: input, canonicalIdentity: Intl.getCanonicalLocales(input)[0]! }
  } catch {
    throw new Error(`Invalid capability manifest: locale for ${pageKey}`)
  }
}
