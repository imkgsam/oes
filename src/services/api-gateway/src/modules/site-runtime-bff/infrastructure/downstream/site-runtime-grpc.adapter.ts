import { createHash } from 'node:crypto'
import { Metadata } from '@grpc/grpc-js'
import { BadRequestException, Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SITE_MANAGEMENT_INTERNAL_PERMISSION_CODES } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  BatchGetPublicViewsRequest,
  GetLatestPublishStateRequest,
  GetPreviewViewRequest,
  GetSnapshotRequest,
  ListChangedResourcesRequest,
  ReportSyncResultRequest,
  RegisterPageCapabilitiesRequest,
  SITE_RUNTIME_SYNC_SERVICE_NAME,
  SignedSiteContext,
  SiteRuntimeSyncServiceClient
} from '@oes/common/generated/site_service'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import { SiteRuntimeDownstream, SiteRuntimeSignedHttpRequest } from '../../site-runtime.service'
import { GatewayMachineTrustedGrpcExecutionProducer } from '../../../../common/grpc/gateway-machine-trusted-grpc-execution-producer'

const CALLER = 'api-gateway'
const SITE_AUDIENCE = 'urn:oes:service:site-service'
const MAX_UINT64_DECIMAL = '18446744073709551615'
const REGISTRATION_VALIDATION_CODE = 'SITE_CAPABILITY_REGISTRATION_VALIDATION_FAILED'
const MAX_REGISTRATION_PAGES = 256
const MAX_PAGE_KEY_LENGTH = 128
const MAX_PAGE_LOCALES = 32
const MAX_LOCALE_LENGTH = 32
const MAX_IDEMPOTENCY_KEY_LENGTH = 255
const MAX_RUNTIME_VERSION_LENGTH = 128
const PAGE_KEY_PATTERN = /^[^\s]+$/u

/** RegisterPageCapabilitiesHttpResponse exposes all eight response fields under fixed snake_case names. */
type RegisterPageCapabilitiesHttpResponse = {
  accepted: boolean
  idempotent_replay: boolean
  manifest_hash: string
  discovered_count: number
  unavailable_page_keys: string[]
  drift_page_keys: string[]
  recovered_page_keys: string[]
  registration_generation: string
}

/** SiteRuntimeGrpcAdapter maps signed Site-facing HTTP requests to site-service runtime gRPC calls. */
@Injectable()
export class SiteRuntimeGrpcAdapter implements SiteRuntimeDownstream, OnModuleInit {
  private runtime!: SiteRuntimeSyncServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.SITE)
    private readonly client: ClientGrpc,
    private readonly machineExecution: GatewayMachineTrustedGrpcExecutionProducer
  ) {}

  /** onModuleInit resolves the generated site runtime gRPC client from the transport registry. */
  onModuleInit(): void {
    this.runtime = this.client.getService<SiteRuntimeSyncServiceClient>(
      SITE_RUNTIME_SYNC_SERVICE_NAME
    )
  }

  /** registerPageCapabilities rejects malformed manifests before forwarding exact signed values downstream. */
  async registerPageCapabilities(request: SiteRuntimeSignedHttpRequest) {
    const decoded = decodeRegisterPageCapabilitiesRequest(request.body)
    const input: RegisterPageCapabilitiesRequest = {
      signedContext: this.signedContext(request),
      ...decoded
    }
    return this.call<unknown>(
      'registerPageCapabilities',
      this.runtime.registerPageCapabilities(input, await this.internalMetadata('registerPageCapabilities'))
    ).then(mapRegisterPageCapabilitiesResponse)
  }

  /** getLatestPublishState forwards latest-version checks with signed material preserved. */
  async getLatestPublishState(request: SiteRuntimeSignedHttpRequest) {
    const input: GetLatestPublishStateRequest = {
      signedContext: this.signedContext(request),
      localPublishVersion: numberField(
        request.body.local_publish_version ?? request.body.localPublishVersion
      )
    }

    return this.call(
      'getLatestPublishState',
      this.runtime.getLatestPublishState(input, await this.internalMetadata('getLatestPublishState'))
    )
  }

  /** listChangedResources forwards delta requests using only the signed site identity. */
  async listChangedResources(request: SiteRuntimeSignedHttpRequest) {
    const input: ListChangedResourcesRequest = {
      signedContext: this.signedContext(request),
      fromPublishVersion: numberField(
        request.body.from_publish_version ?? request.body.fromPublishVersion
      ),
      toPublishVersion: numberField(
        request.body.to_publish_version ?? request.body.toPublishVersion
      ),
      resourceTypes: stringArrayField(request.body.resource_types ?? request.body.resourceTypes)
    }

    return this.call(
      'listChangedResources',
      this.runtime.listChangedResources(input, await this.internalMetadata('listChangedResources'))
    )
  }

  /** batchGetPublicViews forwards public-view resource refs without accepting body site ownership. */
  async batchGetPublicViews(request: SiteRuntimeSignedHttpRequest) {
    const input: BatchGetPublicViewsRequest = {
      signedContext: this.signedContext(request),
      targetPublishVersion: numberField(
        request.body.target_publish_version ?? request.body.targetPublishVersion
      ),
      resources: Array.isArray(request.body.resources)
        ? request.body.resources.map((resource) => ({
            resourceType: stringField(
              (resource as Record<string, unknown>).resource_type ??
                (resource as Record<string, unknown>).resourceType
            ),
            resourceId: stringField(
              (resource as Record<string, unknown>).resource_id ??
                (resource as Record<string, unknown>).resourceId
            ),
            locale: stringField((resource as Record<string, unknown>).locale)
          }))
        : []
    }

    return this.call(
      'batchGetPublicViews',
      this.runtime.batchGetPublicViews(input, await this.internalMetadata('batchGetPublicViews'))
    )
  }

  /** getSnapshot forwards consistent snapshot requests with signed material preserved. */
  async getSnapshot(request: SiteRuntimeSignedHttpRequest) {
    const input: GetSnapshotRequest = {
      signedContext: this.signedContext(request),
      resourceTypes: stringArrayField(request.body.resource_types ?? request.body.resourceTypes),
      locales: stringArrayField(request.body.locales),
      pageToken: stringField(request.body.page_token ?? request.body.pageToken),
      pageSize: numberField(request.body.page_size ?? request.body.pageSize),
      targetPublishVersion: numberField(
        request.body.target_publish_version ?? request.body.targetPublishVersion
      )
    }

    return this.call('getSnapshot', this.runtime.getSnapshot(input, await this.internalMetadata('getSnapshot')))
  }

  /** reportSyncResult forwards runtime sync status reports to site-service. */
  async reportSyncResult(request: SiteRuntimeSignedHttpRequest) {
    const input: ReportSyncResultRequest = {
      signedContext: this.signedContext(request),
      syncId: stringField(request.body.sync_id ?? request.body.syncId),
      localPublishVersion: numberField(
        request.body.local_publish_version ?? request.body.localPublishVersion
      ),
      status: stringField(request.body.status),
      startedAt: stringField(request.body.started_at ?? request.body.startedAt),
      completedAt: stringField(request.body.completed_at ?? request.body.completedAt),
      errorCode: stringField(request.body.error_code ?? request.body.errorCode),
      errorMessage: stringField(request.body.error_message ?? request.body.errorMessage)
    }

    return this.call(
      'reportSyncResult',
      this.runtime.reportSyncResult(input, await this.internalMetadata('reportSyncResult'))
    )
  }

  /** getPreviewView forwards preview-token reads while preserving signed verification context. */
  async getPreviewView(request: SiteRuntimeSignedHttpRequest) {
    const input: GetPreviewViewRequest = {
      signedContext: this.signedContext(request),
      previewToken: stringField(request.body.preview_token ?? request.body.previewToken),
      resourceType: stringField(request.body.resource_type ?? request.body.resourceType),
      resourceId: stringField(request.body.resource_id ?? request.body.resourceId),
      locale: stringField(request.body.locale)
    }

    return this.call('getPreviewView', this.runtime.getPreviewView(input, await this.internalMetadata('getPreviewView')))
  }

  /** signedContext converts required OES signing headers and canonical request fields into gRPC input. */
  private signedContext(request: SiteRuntimeSignedHttpRequest): SignedSiteContext {
    return {
      siteId: header(request, 'x-oes-site-id'),
      clientId: header(request, 'x-oes-client-id'),
      credentialId: header(request, 'x-oes-credential-id'),
      requestId: header(request, 'x-oes-request-id'),
      traceId: header(request, 'x-oes-trace-id'),
      timestamp: header(request, 'x-oes-timestamp'),
      nonce: header(request, 'x-oes-nonce'),
      signature: header(request, 'x-oes-signature'),
      method: request.method,
      path: request.path,
      normalizedQuery: request.normalizedQuery,
      bodySha256: createHash('sha256').update(request.rawBody).digest('hex'),
      idempotencyKey: header(request, 'x-oes-idempotency-key')
    }
  }

  /** metadata creates internal gRPC metadata for the site-service runtime verification boundary. */
  private async internalMetadata(method: string) {
    const code = method === 'registerPageCapabilities' ? SITE_MANAGEMENT_INTERNAL_PERMISSION_CODES.RUNTIME_CAPABILITY_REGISTER : method === 'reportSyncResult' ? SITE_MANAGEMENT_INTERNAL_PERMISSION_CODES.RUNTIME_SYNC_REPORT : method === 'getPreviewView' ? SITE_MANAGEMENT_INTERNAL_PERMISSION_CODES.RUNTIME_PREVIEW_READ : SITE_MANAGEMENT_INTERNAL_PERMISSION_CODES.RUNTIME_PUBLICATION_READ
    return this.machineExecution.forInternalCall(SITE_AUDIENCE, code, async (metadata) => metadata)
  }

  /** call wraps one site runtime gRPC call with the shared gateway safety behavior. */
  private call<TResponse>(method: string, call$: any): Promise<TResponse> {
    return safeGrpcCall<TResponse>(call$, this.opts(method))
  }

  /** opts identifies the gateway caller and downstream method for transport error context. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}

/** header reads one signed header case-insensitively from the incoming request. */
function header(request: SiteRuntimeSignedHttpRequest, name: string): string | undefined {
  return request.signedHeaders[name] ?? request.signedHeaders[name.toLowerCase()]
}

/** stringField normalizes BFF body values before sending them over gRPC. */
function stringField(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

/** numberField normalizes JSON numeric values before sending them over gRPC. */
function numberField(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

/** decodeRegisterPageCapabilitiesRequest validates the complete registration body without coercion or repair. */
function decodeRegisterPageCapabilitiesRequest(
  value: unknown
): Omit<RegisterPageCapabilitiesRequest, 'signedContext'> {
  const body = registrationRecord(value, 'registration body')
  requireRegistrationKeys(
    body,
    [
      'idempotency_key',
      'idempotencyKey',
      'expected_registration_generation',
      'expectedRegistrationGeneration',
      'capabilities',
      'runtime_version',
      'runtimeVersion'
    ],
    'registration body'
  )

  const idempotencyKey = registrationString(
    aliasedRegistrationField(body, 'idempotency_key', 'idempotencyKey'),
    'idempotency_key',
    MAX_IDEMPOTENCY_KEY_LENGTH
  )
  const runtimeVersion = registrationString(
    aliasedRegistrationField(body, 'runtime_version', 'runtimeVersion'),
    'runtime_version',
    MAX_RUNTIME_VERSION_LENGTH
  )
  const expectedRegistrationGeneration = uint64Field(
    aliasedRegistrationField(
      body,
      'expected_registration_generation',
      'expectedRegistrationGeneration'
    )
  )
  const declarations = denseRegistrationArray(
    requiredRegistrationField(body, 'capabilities'),
    'capabilities',
    MAX_REGISTRATION_PAGES
  )
  const seenPageKeys = new Set<string>()
  const capabilities = declarations.map((value, index) => {
    const capability = registrationRecord(value, `capabilities[${index}]`)
    requireRegistrationKeys(
      capability,
      ['page_key', 'pageKey', 'supported_locales', 'supportedLocales'],
      `capabilities[${index}]`
    )
    const pageKey = registrationString(
      aliasedRegistrationField(capability, 'page_key', 'pageKey'),
      `capabilities[${index}].page_key`,
      MAX_PAGE_KEY_LENGTH
    )
    if (!PAGE_KEY_PATTERN.test(pageKey)) {
      return registrationValidation(
        `capabilities[${index}].page_key does not match the Runtime pageKey pattern`,
        `capabilities[${index}].page_key`
      )
    }
    if (seenPageKeys.has(pageKey)) {
      return registrationValidation(
        `duplicate page_key: ${pageKey}`,
        `capabilities[${index}].page_key`
      )
    }
    seenPageKeys.add(pageKey)

    const locales = denseRegistrationArray(
      aliasedRegistrationField(capability, 'supported_locales', 'supportedLocales'),
      `capabilities[${index}].supported_locales`,
      MAX_PAGE_LOCALES,
      true
    )
    const canonicalLocales = new Set<string>()
    const supportedLocales = locales.map((locale, localeIndex) => {
      const field = `capabilities[${index}].supported_locales[${localeIndex}]`
      const original = registrationString(locale, field, MAX_LOCALE_LENGTH)
      let canonicalIdentity: string
      try {
        canonicalIdentity = Intl.getCanonicalLocales(original)[0]!
      } catch {
        return registrationValidation(`${field} must be a valid BCP 47 locale`, field)
      }
      if (!canonicalIdentity || canonicalLocales.has(canonicalIdentity)) {
        return registrationValidation(
          `duplicate canonical locale for ${pageKey}: ${original}`,
          field
        )
      }
      canonicalLocales.add(canonicalIdentity)
      return original
    })

    return { pageKey, supportedLocales }
  })

  return {
    idempotencyKey,
    expectedRegistrationGeneration,
    capabilities,
    runtimeVersion
  }
}

/** registrationRecord accepts only JSON-like plain objects for registration structures. */
function registrationRecord(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return registrationValidation(`${field} must be a plain object`, field)
  }
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) {
    return registrationValidation(`${field} must be a plain object`, field)
  }
  return value as Record<string, unknown>
}

/** requireRegistrationKeys rejects every registration member outside the frozen alias set. */
function requireRegistrationKeys(
  record: Record<string, unknown>,
  allowed: readonly string[],
  field: string
): void {
  const allowedKeys = new Set(allowed)
  const unknown = Object.keys(record).find((key) => !allowedKeys.has(key))
  if (unknown) {
    registrationValidation(`${field} contains unknown field ${unknown}`, `${field}.${unknown}`)
  }
}

/** requiredRegistrationField returns one required own property without accepting inherited values. */
function requiredRegistrationField(record: Record<string, unknown>, field: string): unknown {
  if (!Object.prototype.hasOwnProperty.call(record, field)) {
    return registrationValidation(`${field} is required`, field)
  }
  return record[field]
}

/** aliasedRegistrationField accepts exactly one snake_case or camelCase representation. */
function aliasedRegistrationField(
  record: Record<string, unknown>,
  snakeCase: string,
  camelCase: string
): unknown {
  const hasSnakeCase = Object.prototype.hasOwnProperty.call(record, snakeCase)
  const hasCamelCase = Object.prototype.hasOwnProperty.call(record, camelCase)
  if (hasSnakeCase === hasCamelCase) {
    return registrationValidation(
      hasSnakeCase
        ? `${snakeCase} and ${camelCase} cannot both be present`
        : `${snakeCase} is required`,
      snakeCase
    )
  }
  return record[hasSnakeCase ? snakeCase : camelCase]
}

/** denseRegistrationArray enforces dense bounded arrays and an optional non-empty constraint. */
function denseRegistrationArray(
  value: unknown,
  field: string,
  maximumLength: number,
  requireNonEmpty = false
): unknown[] {
  if (!Array.isArray(value) || (requireNonEmpty && value.length === 0)) {
    return registrationValidation(
      `${field} must be a${requireNonEmpty ? ' non-empty' : ''} array`,
      field
    )
  }
  if (value.length > maximumLength) {
    return registrationValidation(`${field} exceeds maximum length ${maximumLength}`, field)
  }
  for (let index = 0; index < value.length; index += 1) {
    if (!(index in value)) {
      return registrationValidation(`${field} must be a dense array`, `${field}[${index}]`)
    }
  }
  return value
}

/** registrationString preserves exact input bytes while enforcing non-empty, untrimmed length bounds. */
function registrationString(value: unknown, field: string, maximumLength: number): string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value !== value.trim() ||
    value.length > maximumLength
  ) {
    return registrationValidation(
      `${field} must be a non-empty untrimmed string of at most ${maximumLength} characters`,
      field
    )
  }
  return value
}

/** registrationValidation creates the single HTTP 400 error shape for malformed registration input. */
function registrationValidation(message: string, field: string): never {
  throw new BadRequestException({
    code: REGISTRATION_VALIDATION_CODE,
    message,
    details: { field }
  })
}

/** uint64Field requires a canonical decimal uint64 request string without coercion or trimming. */
function uint64Field(value: unknown): string {
  if (typeof value !== 'string' || !isCanonicalUint64Decimal(value)) {
    return registrationValidation(
      'expected_registration_generation must be a canonical uint64 decimal string',
      'expected_registration_generation'
    )
  }

  return value
}

/** mapRegisterPageCapabilitiesResponse exposes only validated registration response fields to HTTP. */
function mapRegisterPageCapabilitiesResponse(value: unknown): RegisterPageCapabilitiesHttpResponse {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('site-service returned an invalid page capability registration response')
  }

  const response = value as Record<string, unknown>
  return {
    accepted: booleanResponseField(response.accepted, 'accepted'),
    idempotent_replay: booleanResponseField(response.idempotentReplay, 'idempotentReplay'),
    manifest_hash: manifestHashResponseField(response.manifestHash),
    discovered_count: uint32ResponseField(response.discoveredCount, 'discoveredCount'),
    unavailable_page_keys: stringArrayResponseField(
      response.unavailablePageKeys,
      'unavailablePageKeys'
    ),
    drift_page_keys: stringArrayResponseField(response.driftPageKeys, 'driftPageKeys'),
    recovered_page_keys: stringArrayResponseField(response.recoveredPageKeys, 'recoveredPageKeys'),
    registration_generation: uint64ResponseField(response.registrationGeneration)
  }
}

/** uint64ResponseField converts a proto-loader Long or string into one canonical uint64 decimal string. */
function uint64ResponseField(value: unknown): string {
  const decimal =
    typeof value === 'string' ? value : isProtoLoaderLong(value) ? value.toString() : undefined

  if (!decimal || !isCanonicalUint64Decimal(decimal)) {
    throw new Error('site-service returned an invalid registration_generation')
  }

  return decimal
}

/** isCanonicalUint64Decimal recognizes the exact unsigned 64-bit decimal wire representation. */
function isCanonicalUint64Decimal(value: string): boolean {
  return (
    /^(0|[1-9][0-9]*)$/.test(value) &&
    (value.length < MAX_UINT64_DECIMAL.length ||
      (value.length === MAX_UINT64_DECIMAL.length && value <= MAX_UINT64_DECIMAL))
  )
}

/** isProtoLoaderLong identifies the unsigned Long instances emitted by the default proto-loader. */
function isProtoLoaderLong(
  value: unknown
): value is { low: number; high: number; unsigned: true; toString(): string } {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as {
    __isLong__?: unknown
    low?: unknown
    high?: unknown
    unsigned?: unknown
    toString?: unknown
  }
  return (
    candidate.__isLong__ === true &&
    Number.isInteger(candidate.low) &&
    Number.isInteger(candidate.high) &&
    candidate.unsigned === true &&
    typeof candidate.toString === 'function'
  )
}

/** booleanResponseField rejects non-boolean values from the registration gRPC response. */
function booleanResponseField(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`site-service returned an invalid ${field}`)
  }
  return value
}

/** stringResponseField rejects non-string values from the registration gRPC response. */
function stringResponseField(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new Error(`site-service returned an invalid ${field}`)
  }
  return value
}

/** manifestHashResponseField requires the frozen lowercase SHA-256 manifest identity. */
function manifestHashResponseField(value: unknown): string {
  const manifestHash = stringResponseField(value, 'manifestHash')
  if (!/^[a-f0-9]{64}$/.test(manifestHash)) {
    throw new Error('site-service returned an invalid manifestHash')
  }
  return manifestHash
}

/** uint32ResponseField rejects non-canonical uint32 values from the registration gRPC response. */
function uint32ResponseField(value: unknown, field: string): number {
  if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > 4_294_967_295) {
    throw new Error(`site-service returned an invalid ${field}`)
  }
  return value as number
}

/** stringArrayResponseField applies proto3 empty-array defaults and rejects invalid repeated values. */
function stringArrayResponseField(value: unknown, field: string): string[] {
  if (value === undefined) {
    return []
  }

  if (!Array.isArray(value)) {
    throw new Error(`site-service returned an invalid ${field}`)
  }

  for (let index = 0; index < value.length; index += 1) {
    if (!(index in value) || typeof value[index] !== 'string') {
      throw new Error(`site-service returned an invalid ${field}`)
    }
  }
  return [...value]
}

/** stringArrayField normalizes optional string arrays from Site Runtime requests. */
function stringArrayField(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  const normalized = value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim())
  return normalized.length ? normalized : undefined
}
