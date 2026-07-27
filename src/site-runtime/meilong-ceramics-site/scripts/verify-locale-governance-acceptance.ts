import 'reflect-metadata'

import { strict as assert } from 'node:assert'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { type INestMicroservice } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { type MicroserviceOptions, Transport } from '@nestjs/microservices'

import { SITE_MANAGEMENT_PERMISSION_CODES } from '../../../common/dist/authorization'
import { AppModule as SiteServiceAppModule } from '../../../services/system/site-service/dist/app.module'
import { PrismaService } from '../../../services/system/site-service/dist/infrastructure/prisma/prisma.service'
import { parseSiteCredential } from '../../site-runtime-kit/src/config/credential'
import type { SiteCapabilityRegistrationResponse } from '../../site-runtime-kit/src/client/signed-oes-client'
import {
  createSiteRuntime,
  type SiteRuntimeStatusSnapshot
} from '../../site-runtime-kit/src/runtime/site-runtime'
import { NodeSqlitePublishedStore } from '../../site-runtime-kit/src/store/node-sqlite-published-store'
import {
  normalizeSiteCapabilityManifest,
  type SiteCredential,
  type StoredCapabilityRegistrationState
} from '../../site-runtime-kit/src/types'
import { MEILONG_RUNTIME_MODULE_OPTIONS } from '../runtime/src/site-runtime-options'
import {
  AcceptanceSafeFailure,
  type AcceptanceTerminationController,
  type AcceptanceDatabaseConfig,
  type AcceptanceNamespace,
  type AsyncCloseable,
  type CleanupCoordinator,
  type ManagedResourceStartOptions,
  createAcceptanceNamespace,
  reportAcceptanceFailure,
  reserveIsolatedLoopbackPorts,
  resolveAcceptanceDatabaseConfig,
  runAcceptanceLifecycle,
  runCleanupSteps,
  startManagedResource,
  startWithBoundedRetries
} from './locale-governance-acceptance-harness'
import {
  configureAcceptanceGatewayDoubles,
  readAcceptanceGatewayObservations,
  startAuthServiceDouble,
  startGateway,
  startPermissionServiceDouble
} from './locale-governance-gateway-harness'

const REPOSITORY_ROOT = join(__dirname, '../../../..')
const SITE_PROTO_PATH = join(REPOSITORY_ROOT, 'src/common/src/contracts/site_service/site.proto')
const LOOPBACK_HOST = '127.0.0.1'
const GOVERNED_PAGE_KEY = 'HOME'
const RUNTIME_VERSION = 'meilong-locale-governance-phase-a'
const RUNTIME_CREDENTIAL_SCOPES = [
  'site:read',
  'site:sync',
  'site:preview',
  'site:status',
  'site:capabilities'
] as const
const NORMALIZED_MANIFEST = normalizeSiteCapabilityManifest(
  MEILONG_RUNTIME_MODULE_OPTIONS.capabilityManifest
)

interface CreateSiteResponse {
  readonly siteId: string
  readonly status: string
  readonly defaultLocale: string
}

interface GenerateCredentialResponse {
  readonly metadata: {
    readonly credentialId: string
    readonly clientId: string
    readonly status: string
    readonly scopes: string[]
  }
  readonly credentialBundle: string
}

interface SitePageResponse {
  readonly pageKey: string
  readonly supportedLocales: string[]
  readonly capabilityAvailable: boolean
  readonly enabled: boolean
  readonly indexable: boolean
  readonly capabilityDrift: boolean
  readonly syncStatus: string
}

interface ListSitePagesResponse {
  readonly pages: SitePageResponse[]
}

interface RuntimeStartupObservation {
  readonly registration: SiteCapabilityRegistrationResponse
  readonly status: SiteRuntimeStatusSnapshot
}

interface GovernanceSnapshot {
  readonly enabled: boolean
  readonly indexable: boolean
  readonly capabilityAvailable: boolean
  readonly capabilityDrift: boolean
  readonly syncStatus: string
}

interface ControlPlaneCounts {
  readonly registrationRows: number
  readonly syncBatches: number
  readonly webhookDeliveries: number
  readonly exposurePublications: number
}

interface AcceptanceBoundaryStack {
  readonly gatewayPort: number
}

interface AcceptanceResult {
  readonly status: 'phase-a-completed'
  readonly phase: 'phase-a'
  readonly mode: 'real-runtime-startup-http-grpc-signing-prisma'
  readonly coveredScenarios: readonly string[]
  readonly uncoveredPhases: readonly ['phase-b', 'phase-c', 'phase-d', 'phase-e', 'phase-f']
  readonly unifiedAcceptanceClosed: false
  readonly databaseTarget: string
  readonly discoveredCount: number
  readonly governedPageKey: string
  readonly manifestHash: string
  readonly registrationGeneration: string
  readonly idempotentReplay: boolean
  readonly credentialMaterialPrinted: false
}

/** configureIsolatedProcessEnvironment prevents service discovery and points persistence only at the accepted target. */
function configureIsolatedProcessEnvironment(database: AcceptanceDatabaseConfig): void {
  process.env.DATABASE_URL = database.url
  process.env.NODE_ENV = 'acceptance'
  delete process.env.NACOS_SERVER
  delete process.env.MODULE_NAME
}

/** configureGatewayEndpoint binds newly issued Runtime credentials to the current isolated HTTP attempt. */
function configureGatewayEndpoint(gatewayPort: number): void {
  process.env.OES_SITE_API_BASE_URL = `http://${LOOPBACK_HOST}:${gatewayPort}/api/v1/site`
}

/** connectAcceptanceDatabase verifies connectivity and every Phase A observation model before test rows are created. */
async function connectAcceptanceDatabase(
  prisma: PrismaService,
  database: AcceptanceDatabaseConfig,
  _signal: AbortSignal
): Promise<void> {
  try {
    await prisma.$connect()
    await Promise.all([
      prisma.sitePageCapability.count(),
      prisma.sitePageGovernance.count(),
      prisma.siteCapabilityRegistration.count(),
      prisma.siteCapabilityRegistrationStream.count(),
      prisma.siteSyncBatch.count(),
      prisma.siteWebhookDelivery.count(),
      prisma.siteExposurePublication.count()
    ])
  } catch (error) {
    await prisma.$disconnect().catch(() => undefined)
    throw new AcceptanceSafeFailure({
      code: 'ACCEPTANCE_DATABASE_UNAVAILABLE',
      safeTarget: database.safeTarget,
      cause: error
    })
  }
}

/** startSiteService starts the production site-service module on an isolated real gRPC socket. */
async function startSiteService(
  grpcPort: number,
  options: ManagedResourceStartOptions = {}
): Promise<INestMicroservice> {
  return startManagedResource(
    (_signal) =>
      NestFactory.createMicroservice<MicroserviceOptions>(SiteServiceAppModule, {
        logger: false,
        transport: Transport.GRPC,
        options: {
          package: 'site_service',
          protoPath: [SITE_PROTO_PATH],
          loader: { longs: String, arrays: true },
          url: `${LOOPBACK_HOST}:${grpcPort}`
        }
      }),
    async (service, _signal) => {
      await service.listen()
    },
    options
  )
}

/** startAcceptanceBoundaryStack retries a fully cleaned four-port boundary stack when a reserved port is stolen. */
async function startAcceptanceBoundaryStack(
  cleanup: CleanupCoordinator,
  termination: AcceptanceTerminationController
): Promise<AcceptanceBoundaryStack> {
  return startWithBoundedRetries(
    async () => {
      termination.throwIfTerminating()
      const attemptResources: AsyncCloseable[] = []
      const [siteGrpcPort, authGrpcPort, permissionGrpcPort, gatewayPort] =
        await reserveIsolatedLoopbackPorts(4)
      configureGatewayEndpoint(gatewayPort)
      try {
        termination.throwIfTerminating()
        await startAuthServiceDouble(authGrpcPort, {
          cleanup,
          signal: termination.signal,
          onRegistered: (resource) => attemptResources.push(resource)
        })
        termination.throwIfTerminating()
        await startPermissionServiceDouble(permissionGrpcPort, {
          cleanup,
          signal: termination.signal,
          onRegistered: (resource) => attemptResources.push(resource)
        })
        termination.throwIfTerminating()
        await startSiteService(siteGrpcPort, {
          cleanup,
          signal: termination.signal,
          onRegistered: (resource) => attemptResources.push(resource)
        })
        termination.throwIfTerminating()
        await startGateway(siteGrpcPort, authGrpcPort, permissionGrpcPort, gatewayPort, {
          cleanup,
          signal: termination.signal,
          onRegistered: (resource) => attemptResources.push(resource)
        })
        termination.throwIfTerminating()
        return { gatewayPort }
      } catch (error) {
        return closeFailedBoundaryAttempt(attemptResources, error)
      }
    },
    isAddressInUseError,
    3
  )
}

/** closeFailedBoundaryAttempt closes every server from one failed bind attempt before retrying. */
async function closeFailedBoundaryAttempt(
  resources: readonly AsyncCloseable[],
  startError: unknown
): Promise<never> {
  const closeErrors: unknown[] = []
  for (const resource of [...resources].reverse()) {
    try {
      await resource.close()
    } catch (error) {
      closeErrors.push(error)
    }
  }
  if (closeErrors.length > 0) {
    const cleanupError = new AggregateError(
      [startError, ...closeErrors],
      'Acceptance boundary startup failed and partial-stack cleanup also failed',
      { cause: startError }
    )
    cleanupError.name = 'AcceptanceBoundaryCleanupError'
    throw cleanupError
  }
  throw startError
}

/** isAddressInUseError recognizes nested bind collisions without retrying unrelated startup failures. */
function isAddressInUseError(error: unknown): boolean {
  if (error instanceof AggregateError) {
    if (
      error.name === 'AcceptanceBoundaryCleanupError' ||
      /immediate close both failed/i.test(error.message)
    ) {
      return false
    }
    return error.errors.some(isAddressInUseError)
  }
  if (!(error instanceof Error)) {
    return false
  }
  const candidate = error as Error & { code?: unknown; cause?: unknown }
  return (
    candidate.code === 'EADDRINUSE' ||
    /EADDRINUSE|address already in use|bind failed/i.test(candidate.message) ||
    (candidate.cause !== undefined && isAddressInUseError(candidate.cause))
  )
}

/** runRuntimeStartup executes the production Runtime registration and startup-sync orchestration against one persisted store. */
async function runRuntimeStartup(input: {
  credential: SiteCredential
  storePath: string
  capabilityRegistrationId: string
  cleanup: CleanupCoordinator
  termination: AcceptanceTerminationController
}): Promise<RuntimeStartupObservation> {
  input.termination.throwIfTerminating()
  const runtime = await createSiteRuntime({
    credential: input.credential,
    storePath: input.storePath,
    capabilityManifest: MEILONG_RUNTIME_MODULE_OPTIONS.capabilityManifest,
    capabilityRegistrationIdFactory: () => input.capabilityRegistrationId,
    pullIntervalMs: 0,
    kitVersion: RUNTIME_VERSION
  })
  const managedRuntime = await input.cleanup.register({
    close: () => runtime.stop()
  })

  try {
    input.termination.throwIfTerminating()
    await runtime.start()
    input.termination.throwIfTerminating()
    const registration = runtime.capabilities.getLastRegistration()
    assert.ok(registration, 'Runtime startup must complete capability registration')
    return {
      registration,
      status: await runtime.getStatus()
    }
  } finally {
    await managedRuntime.close()
  }
}

/** readPersistedRuntimeRegistration inspects only public-safe Runtime registration metadata after both Runtime instances stop. */
async function readPersistedRuntimeRegistration(input: {
  storePath: string
  siteId: string
  clientId: string
}): Promise<StoredCapabilityRegistrationState> {
  const store = new NodeSqlitePublishedStore({ path: input.storePath })
  await store.init()
  try {
    const state = await store.getCapabilityRegistrationState(input.siteId, input.clientId)
    assert.ok(state, 'Runtime SQLite must persist capability registration state across restart')
    return state
  } finally {
    await store.close()
  }
}

/** readControlPlaneCounts captures the Phase A database rows that startup discovery must not advance. */
async function readControlPlaneCounts(
  prisma: PrismaService,
  siteId: string
): Promise<ControlPlaneCounts> {
  const [registrationRows, syncBatches, webhookDeliveries, exposurePublications] =
    await Promise.all([
      prisma.siteCapabilityRegistration.count({ where: { siteId } }),
      prisma.siteSyncBatch.count({ where: { siteId } }),
      prisma.siteWebhookDelivery.count({ where: { siteId } }),
      prisma.siteExposurePublication.count({ where: { siteId } })
    ])
  return { registrationRows, syncBatches, webhookDeliveries, exposurePublications }
}

/** configureAuthPermissionDoubles creates one namespaced session response and explicit coarse permission set. */
function configureAuthPermissionDoubles(
  namespace: AcceptanceNamespace,
  allowedPermissions: readonly string[] = [],
  overrides: { tenantId?: string; scopeLevel?: 'TENANT' | 'SYSTEM' } = {}
): string {
  const accessToken = `${namespace.runId}_admin_access_token`
  configureAcceptanceGatewayDoubles(
    {
      accessToken,
      tenantId: Object.prototype.hasOwnProperty.call(overrides, 'tenantId')
        ? overrides.tenantId
        : namespace.tenantId,
      accountId: namespace.operatorId,
      userId: `${namespace.runId}_user`,
      sessionId: `${namespace.runId}_session`,
      scopeLevel: overrides.scopeLevel ?? 'TENANT'
    },
    allowedPermissions
  )
  return accessToken
}

/** verifyAdminGatewaySecurity exercises production session, tenant binding, and permission guards before mutation. */
async function verifyAdminGatewaySecurity(input: {
  gatewayBaseUrl: string
  namespace: AcceptanceNamespace
  accessToken: string
  requestHeaders: Record<string, string>
  termination: AcceptanceTerminationController
}): Promise<void> {
  input.termination.throwIfTerminating()
  const localeOptionsUrl = `${input.gatewayBaseUrl}/api/v1/site-management/tenants/${encodeURIComponent(
    input.namespace.tenantId
  )}/locale-options`
  await expectHttpStatus({
    url: localeOptionsUrl,
    headers: input.requestHeaders,
    expectedStatus: 401,
    signal: input.termination.signal
  })

  const authorizedHeaders = {
    ...input.requestHeaders,
    authorization: `Bearer ${input.accessToken}`
  }
  await expectHttpStatus({
    url: localeOptionsUrl,
    headers: authorizedHeaders,
    expectedStatus: 403,
    signal: input.termination.signal
  })

  configureAuthPermissionDoubles(input.namespace, [SITE_MANAGEMENT_PERMISSION_CODES.READ])
  await expectHttpStatus({
    url: localeOptionsUrl,
    headers: authorizedHeaders,
    expectedStatus: 200,
    signal: input.termination.signal
  })
  const successfulObservations = readAcceptanceGatewayObservations()
  assert.ok(successfulObservations.authTokens.includes(input.accessToken))
  const successfulPermissionCheck = successfulObservations.permissionChecks.at(-1)
  assert.deepEqual(successfulPermissionCheck, {
    accountId: input.namespace.operatorId,
    permissionCode: SITE_MANAGEMENT_PERMISSION_CODES.READ,
    callerServiceName: 'api-gateway'
  })

  configureAuthPermissionDoubles(input.namespace, [SITE_MANAGEMENT_PERMISSION_CODES.READ])
  const mismatchedTenantId = `${input.namespace.runId}_mismatched_tenant`
  await expectHttpStatus({
    url: `${input.gatewayBaseUrl}/api/v1/site-management/tenants/${encodeURIComponent(
      mismatchedTenantId
    )}/locale-options`,
    headers: authorizedHeaders,
    expectedStatus: 403,
    signal: input.termination.signal,
    failureMessage:
      'Production Admin BFF must reject a URL tenant that differs from the validated session tenant'
  })
  assert.deepEqual(readAcceptanceGatewayObservations().permissionChecks, [])

  configureAuthPermissionDoubles(input.namespace, [SITE_MANAGEMENT_PERMISSION_CODES.READ], {
    tenantId: undefined
  })
  await expectHttpStatus({
    url: localeOptionsUrl,
    headers: authorizedHeaders,
    expectedStatus: 401,
    signal: input.termination.signal,
    failureMessage:
      'Production Admin BFF must reject a TENANT session without a tenant before permission'
  })
  assert.deepEqual(readAcceptanceGatewayObservations().permissionChecks, [])

  configureAuthPermissionDoubles(input.namespace, [SITE_MANAGEMENT_PERMISSION_CODES.READ], {
    tenantId: undefined,
    scopeLevel: 'SYSTEM'
  })
  await expectHttpStatus({
    url: localeOptionsUrl,
    headers: authorizedHeaders,
    expectedStatus: 403,
    signal: input.termination.signal,
    failureMessage:
      'Production Admin BFF must deny SYSTEM sessions before permission on tenant-bound routes'
  })
  assert.deepEqual(readAcceptanceGatewayObservations().permissionChecks, [])
}

/** expectHttpStatus validates one protected HTTP boundary without logging bodies or bearer material. */
async function expectHttpStatus(input: {
  url: string
  headers: Record<string, string>
  expectedStatus: number
  failureMessage?: string
  signal: AbortSignal
}): Promise<void> {
  const response = await fetch(input.url, {
    method: 'GET',
    headers: input.headers,
    signal: input.signal
  })
  assert.equal(
    response.status,
    input.expectedStatus,
    input.failureMessage ??
      `${new URL(input.url).pathname} returned HTTP ${response.status}, expected ${input.expectedStatus}`
  )
  await response.body?.cancel()
}

/** executePhaseA proves credential issuance, Runtime restart replay, and governance preservation through public boundaries. */
async function executePhaseA(input: {
  database: AcceptanceDatabaseConfig
  namespace: AcceptanceNamespace
  prisma: PrismaService
  runtimeStorePath: string
  cleanup: CleanupCoordinator
  termination: AcceptanceTerminationController
}): Promise<AcceptanceResult> {
  input.termination.throwIfTerminating()
  const accessToken = configureAuthPermissionDoubles(input.namespace)
  const boundaries = await startAcceptanceBoundaryStack(input.cleanup, input.termination)

  const gatewayBaseUrl = `http://${LOOPBACK_HOST}:${boundaries.gatewayPort}`
  const adminBaseUrl = `${gatewayBaseUrl}/api/v1/site-management/tenants/${encodeURIComponent(
    input.namespace.tenantId
  )}`
  const requestHeaders = {
    'x-request-id': `${input.namespace.runId}_request`,
    'x-trace-id': input.namespace.traceId
  }
  await verifyAdminGatewaySecurity({
    gatewayBaseUrl,
    namespace: input.namespace,
    accessToken,
    requestHeaders,
    termination: input.termination
  })
  input.termination.throwIfTerminating()
  configureAuthPermissionDoubles(input.namespace, [
    SITE_MANAGEMENT_PERMISSION_CODES.READ,
    SITE_MANAGEMENT_PERMISSION_CODES.MANAGE
  ])
  const authorizedRequestHeaders = {
    ...requestHeaders,
    authorization: `Bearer ${accessToken}`
  }

  const site = await postJson<CreateSiteResponse>(
    `${adminBaseUrl}/sites`,
    {
      siteName: `${input.namespace.runId} Site`,
      siteType: 'brand',
      defaultLocale: 'en-US',
      primaryDomain: `${input.namespace.runId}.acceptance.invalid`,
      previewBaseUrl: 'https://acceptance.invalid/preview'
    },
    authorizedRequestHeaders,
    input.termination.signal
  )
  assert.ok(site.siteId.startsWith('site_'), 'Admin BFF must return the site-service site id')

  const issued = await postJson<GenerateCredentialResponse>(
    `${adminBaseUrl}/sites/${encodeURIComponent(site.siteId)}/credentials`,
    { scopes: [...RUNTIME_CREDENTIAL_SCOPES] },
    authorizedRequestHeaders,
    input.termination.signal
  )
  assert.deepEqual(issued.metadata.scopes, RUNTIME_CREDENTIAL_SCOPES)
  assert.ok(
    issued.credentialBundle.startsWith('oes_site_cred_v1.'),
    'Admin BFF must return one opaque Runtime credential bundle'
  )

  const credential = parseSiteCredential(issued.credentialBundle)
  assert.equal(credential.siteId, site.siteId)
  assert.equal(
    credential.oesBaseUrl,
    `${gatewayBaseUrl}/api/v1/site`,
    'issued credential must target the acceptance Runtime BFF HTTP boundary'
  )
  const firstRegistrationKey = `${input.namespace.runId}_runtime_start_1`
  const firstRuntimeStartup = await runRuntimeStartup({
    credential,
    storePath: input.runtimeStorePath,
    capabilityRegistrationId: firstRegistrationKey,
    cleanup: input.cleanup,
    termination: input.termination
  })
  const first = firstRuntimeStartup.registration
  assertFirstRegistration(first)
  assertRuntimeStartupSync(firstRuntimeStartup.status)

  const initiallyDiscovered = await getJson<ListSitePagesResponse>(
    `${adminBaseUrl}/sites/${encodeURIComponent(site.siteId)}/pages`,
    authorizedRequestHeaders,
    input.termination.signal
  )
  assertCompleteUniqueManifest(initiallyDiscovered.pages)
  const initialGovernance = requirePage(initiallyDiscovered.pages, GOVERNED_PAGE_KEY)
  assert.equal(initialGovernance.enabled, false)
  assert.equal(initialGovernance.indexable, false)

  const pageKey = GOVERNED_PAGE_KEY
  await postJson(
    `${adminBaseUrl}/sites/${encodeURIComponent(site.siteId)}/pages/${encodeURIComponent(pageKey)}/governance`,
    { enabled: true, indexable: true },
    authorizedRequestHeaders,
    input.termination.signal
  )

  const governed = await getJson<ListSitePagesResponse>(
    `${adminBaseUrl}/sites/${encodeURIComponent(site.siteId)}/pages`,
    authorizedRequestHeaders,
    input.termination.signal
  )
  const governanceBeforeSecondStartup = governanceSnapshot(requirePage(governed.pages, pageKey))
  assert.deepEqual(governanceBeforeSecondStartup, {
    enabled: true,
    indexable: true,
    capabilityAvailable: true,
    capabilityDrift: false,
    syncStatus: 'pending'
  })
  input.termination.throwIfTerminating()
  const countsBeforeSecondStartup = await readControlPlaneCounts(input.prisma, site.siteId)
  input.termination.throwIfTerminating()
  assert.deepEqual(countsBeforeSecondStartup, {
    registrationRows: 1,
    syncBatches: 0,
    webhookDeliveries: 0,
    exposurePublications: 0
  })

  const secondRuntimeStartup = await runRuntimeStartup({
    credential,
    storePath: input.runtimeStorePath,
    capabilityRegistrationId: `${input.namespace.runId}_must_not_replace`,
    cleanup: input.cleanup,
    termination: input.termination
  })
  const second = secondRuntimeStartup.registration
  assertSecondRegistration(first, second)
  assertRuntimeStartupSync(secondRuntimeStartup.status)

  input.termination.throwIfTerminating()
  const persistedRegistration = await readPersistedRuntimeRegistration({
    storePath: input.runtimeStorePath,
    siteId: site.siteId,
    clientId: issued.metadata.clientId
  })
  input.termination.throwIfTerminating()
  assert.equal(persistedRegistration.idempotencyKey, firstRegistrationKey)
  assert.equal(persistedRegistration.expectedRegistrationGeneration, '0')
  assert.equal(persistedRegistration.remoteRegistrationGeneration, first.registration_generation)

  const afterReplay = await getJson<ListSitePagesResponse>(
    `${adminBaseUrl}/sites/${encodeURIComponent(site.siteId)}/pages`,
    authorizedRequestHeaders,
    input.termination.signal
  )
  assertCompleteUniqueManifest(afterReplay.pages)
  assert.deepEqual(
    governanceSnapshot(requirePage(afterReplay.pages, pageKey)),
    governanceBeforeSecondStartup
  )
  input.termination.throwIfTerminating()
  const countsAfterSecondStartup = await readControlPlaneCounts(input.prisma, site.siteId)
  input.termination.throwIfTerminating()
  assert.deepEqual(countsAfterSecondStartup, countsBeforeSecondStartup)

  return {
    status: 'phase-a-completed',
    phase: 'phase-a',
    mode: 'real-runtime-startup-http-grpc-signing-prisma',
    coveredScenarios: [
      'production-gateway-session-tenant-binding-and-permission-guards',
      'admin-auth-401-permission-403-success-and-tenant-binding',
      'admin-http-runtime-credential-with-exact-five-scopes',
      'runtime-kit-first-startup-complete-manifest-registration',
      'runtime-kit-sqlite-restart-idempotent-second-startup',
      'admin-http-page-governance-preserved-after-second-startup',
      'startup-registration-does-not-create-sync-batch-webhook-or-publication'
    ],
    uncoveredPhases: ['phase-b', 'phase-c', 'phase-d', 'phase-e', 'phase-f'],
    unifiedAcceptanceClosed: false,
    databaseTarget: input.database.safeTarget,
    discoveredCount: second.discovered_count,
    governedPageKey: pageKey,
    manifestHash: second.manifest_hash,
    registrationGeneration: second.registration_generation,
    idempotentReplay: second.idempotent_replay,
    credentialMaterialPrinted: false
  }
}

/** assertFirstRegistration validates the real protocol fields returned for a newly discovered complete manifest. */
function assertFirstRegistration(response: SiteCapabilityRegistrationResponse): void {
  assert.equal(response.accepted, true)
  assert.equal(response.idempotent_replay, false)
  assert.equal(response.discovered_count, NORMALIZED_MANIFEST.pages.length)
  assert.match(response.manifest_hash, /^[a-f0-9]{64}$/)
  assert.match(response.registration_generation, /^[1-9][0-9]*$/)
  assert.deepEqual(response.unavailable_page_keys, [])
  assert.deepEqual(response.drift_page_keys, [])
  assert.deepEqual(response.recovered_page_keys, [])
}

/** assertSecondRegistration validates an exact replay without inventing a new hash or generation. */
function assertSecondRegistration(
  first: SiteCapabilityRegistrationResponse,
  second: SiteCapabilityRegistrationResponse
): void {
  assert.equal(second.accepted, true)
  assert.equal(second.idempotent_replay, true)
  assert.equal(second.manifest_hash, first.manifest_hash)
  assert.equal(second.registration_generation, first.registration_generation)
  assert.equal(second.discovered_count, first.discovered_count)
  assert.deepEqual(second.unavailable_page_keys, first.unavailable_page_keys)
  assert.deepEqual(second.drift_page_keys, first.drift_page_keys)
  assert.deepEqual(second.recovered_page_keys, first.recovered_page_keys)
}

/** assertCompleteUniqueManifest proves Admin observes every normalized page and locale declaration exactly once. */
function assertCompleteUniqueManifest(pages: readonly SitePageResponse[]): void {
  const declared = NORMALIZED_MANIFEST.pages.map((page) => page.pageKey)
  const actual = pages.map((page) => page.pageKey)
  assert.equal(actual.length, declared.length)
  assert.equal(new Set(actual).size, declared.length)
  assert.deepEqual([...actual].sort(), [...declared].sort())
  for (const declaredPage of NORMALIZED_MANIFEST.pages) {
    const actualPage = requirePage(pages, declaredPage.pageKey)
    assert.deepEqual(actualPage.supportedLocales, declaredPage.supportedLocales)
    assert.equal(actualPage.capabilityAvailable, true)
  }
}

/** governanceSnapshot isolates every operator/discovery field that a repeated Runtime startup must preserve. */
function governanceSnapshot(page: SitePageResponse): GovernanceSnapshot {
  return {
    enabled: page.enabled,
    indexable: page.indexable,
    capabilityAvailable: page.capabilityAvailable,
    capabilityDrift: page.capabilityDrift,
    syncStatus: page.syncStatus
  }
}

/** assertRuntimeStartupSync proves production startup sync ran without advancing the local publication version. */
function assertRuntimeStartupSync(status: SiteRuntimeStatusSnapshot): void {
  assert.equal(status.local_publish_version, 0)
  assert.equal(status.last_sync_status, 'completed')
  assert.equal(status.store_ready, true)
}

/** requirePage returns one Admin page read model or fails the acceptance chain with its stable key. */
function requirePage(pages: readonly SitePageResponse[], pageKey: string): SitePageResponse {
  const page = pages.find((candidate) => candidate.pageKey === pageKey)
  assert.ok(page, `Admin BFF did not return the discovered ${pageKey} page`)
  return page
}

/** getJson performs one Admin BFF GET and unwraps the production success envelope. */
async function getJson<T>(
  url: string,
  headers: Record<string, string>,
  signal: AbortSignal
): Promise<T> {
  return requestJson<T>(url, { method: 'GET', headers, signal })
}

/** postJson performs one Admin BFF POST without ever including body contents in thrown diagnostics. */
async function postJson<T = unknown>(
  url: string,
  body: Record<string, unknown>,
  headers: Record<string, string>,
  signal: AbortSignal
): Promise<T> {
  return requestJson<T>(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal
  })
}

/** requestJson enforces successful JSON BFF responses while keeping credentials out of error output. */
async function requestJson<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  if (!response.ok) {
    throw new Error(
      `${init.method ?? 'GET'} ${new URL(url).pathname} returned HTTP ${response.status}`
    )
  }
  const payload = (await response.json()) as unknown
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error(`${new URL(url).pathname} returned a non-object JSON response`)
  }
  const envelope = payload as { data?: unknown }
  return (Object.prototype.hasOwnProperty.call(envelope, 'data') ? envelope.data : payload) as T
}

/** cleanupOwnedAcceptanceData removes only rows reachable from the generated tenant namespace. */
async function cleanupOwnedAcceptanceData(
  prisma: PrismaService,
  namespace: AcceptanceNamespace
): Promise<void> {
  const tenantWhere = { tenantId: { startsWith: namespace.runId } }
  await runCleanupSteps([
    {
      code: 'DELETE_EXPOSURE_PUBLICATION',
      run: async () => {
        await prisma.siteExposurePublication.deleteMany({ where: { site: tenantWhere } })
      }
    },
    {
      code: 'DELETE_CAPABILITY_REGISTRATION',
      run: async () => {
        await prisma.siteCapabilityRegistration.deleteMany({ where: { site: tenantWhere } })
      }
    },
    {
      code: 'DELETE_CAPABILITY_REGISTRATION_STREAM',
      run: async () => {
        await prisma.siteCapabilityRegistrationStream.deleteMany({ where: { site: tenantWhere } })
      }
    },
    {
      code: 'DELETE_EXPOSURE_DRAFT',
      run: async () => {
        await prisma.siteExposureDraft.deleteMany({ where: { site: tenantWhere } })
      }
    },
    {
      code: 'DELETE_PAGE_GOVERNANCE',
      run: async () => {
        await prisma.sitePageGovernance.deleteMany({ where: { site: tenantWhere } })
      }
    },
    {
      code: 'DELETE_PAGE_CAPABILITY',
      run: async () => {
        await prisma.sitePageCapability.deleteMany({ where: { site: tenantWhere } })
      }
    },
    {
      code: 'DELETE_WEBHOOK_DELIVERY',
      run: async () => {
        await prisma.siteWebhookDelivery.deleteMany({ where: tenantWhere })
      }
    },
    {
      code: 'DELETE_SYNC_RESOURCE',
      run: async () => {
        await prisma.siteSyncResource.deleteMany({ where: { syncBatch: tenantWhere } })
      }
    },
    {
      code: 'DELETE_SYNC_BATCH',
      run: async () => {
        await prisma.siteSyncBatch.deleteMany({ where: tenantWhere })
      }
    },
    {
      code: 'DELETE_PUBLIC_VIEW',
      run: async () => {
        await prisma.sitePublicView.deleteMany({ where: tenantWhere })
      }
    },
    {
      code: 'DELETE_CREDENTIAL_NONCE',
      run: async () => {
        await prisma.siteCredentialNonce.deleteMany({
          where: { credential: { site: tenantWhere } }
        })
      }
    },
    {
      code: 'DELETE_CREDENTIAL',
      run: async () => {
        await prisma.siteCredential.deleteMany({ where: { site: tenantWhere } })
      }
    },
    {
      code: 'DELETE_RUNTIME_STATUS',
      run: async () => {
        await prisma.siteRuntimeStatus.deleteMany({ where: { site: tenantWhere } })
      }
    },
    {
      code: 'DELETE_LOCALE',
      run: async () => {
        await prisma.siteLocale.deleteMany({ where: { site: tenantWhere } })
      }
    },
    {
      code: 'DELETE_AUDIT',
      run: async () => {
        await prisma.siteAuditEnvelope.deleteMany({ where: tenantWhere })
      }
    },
    {
      code: 'DELETE_OWNER_ROOT',
      run: async () => {
        await prisma.site.deleteMany({ where: tenantWhere })
      }
    },
    {
      code: 'POSTCONDITION_NAMESPACE_EMPTY',
      run: async () => {
        const remainingRows = await countOwnedAcceptanceRows(prisma, tenantWhere)
        if (remainingRows !== 0) {
          throw new Error(`Acceptance namespace cleanup left ${remainingRows} owned rows`)
        }
      }
    }
  ])
}

/** countOwnedAcceptanceRows checks every acceptance-owned model without short-circuiting on one count failure. */
async function countOwnedAcceptanceRows(
  prisma: PrismaService,
  tenantWhere: { tenantId: { startsWith: string } }
): Promise<number> {
  const counts = await Promise.allSettled([
    prisma.siteExposurePublication.count({ where: { site: tenantWhere } }),
    prisma.siteCapabilityRegistration.count({ where: { site: tenantWhere } }),
    prisma.siteCapabilityRegistrationStream.count({ where: { site: tenantWhere } }),
    prisma.siteExposureDraft.count({ where: { site: tenantWhere } }),
    prisma.sitePageGovernance.count({ where: { site: tenantWhere } }),
    prisma.sitePageCapability.count({ where: { site: tenantWhere } }),
    prisma.siteWebhookDelivery.count({ where: tenantWhere }),
    prisma.siteSyncResource.count({ where: { syncBatch: tenantWhere } }),
    prisma.siteSyncBatch.count({ where: tenantWhere }),
    prisma.sitePublicView.count({ where: tenantWhere }),
    prisma.siteCredentialNonce.count({ where: { credential: { site: tenantWhere } } }),
    prisma.siteCredential.count({ where: { site: tenantWhere } }),
    prisma.siteRuntimeStatus.count({ where: { site: tenantWhere } }),
    prisma.siteLocale.count({ where: { site: tenantWhere } }),
    prisma.siteAuditEnvelope.count({ where: tenantWhere }),
    prisma.site.count({ where: tenantWhere })
  ])
  const failures = counts.flatMap((result, index) =>
    result.status === 'rejected'
      ? [
          new Error(`Acceptance namespace count failed: ${index}`, {
            cause: result.reason
          })
        ]
      : []
  )
  if (failures.length > 0) {
    throw new AggregateError(failures, 'locale-governance acceptance namespace count failed')
  }
  return counts.reduce(
    (total, result) => total + (result.status === 'fulfilled' ? result.value : 0),
    0
  )
}

/** main applies safety preflight before starting either real boundary and owns all teardown paths. */
async function main(): Promise<void> {
  const database = resolveAcceptanceDatabaseConfig()
  const namespace = createAcceptanceNamespace()
  configureIsolatedProcessEnvironment(database)
  const prisma = new PrismaService()
  const lifecycle = await runAcceptanceLifecycle({
    database,
    namespace,
    prisma,
    signalSource: process,
    activePhaseTimeoutMs: 5_000,
    connectDatabase: connectAcceptanceDatabase,
    cleanupNamespace: cleanupOwnedAcceptanceData,
    createRuntimeDirectory: () => mkdtempSync(join(tmpdir(), `${namespace.runId}_`)),
    removeRuntimeDirectory: (runtimeDirectory) => {
      rmSync(runtimeDirectory, { recursive: true, force: true })
    },
    executePhase: ({ prisma, runtimeDirectory, cleanup, termination }) =>
      executePhaseA({
        database,
        namespace,
        prisma,
        runtimeStorePath: join(runtimeDirectory, 'runtime.sqlite'),
        cleanup,
        termination
      }),
    onExitIntent: (signal) => {
      process.exitCode = signal === 'SIGINT' ? 130 : 143
    },
    onForceExit: (_signal, exitCode) => process.exit(exitCode),
    reportFailure: (error) => reportAcceptanceFailure(error)
  })

  if (!lifecycle.terminationSignal) {
    console.log(JSON.stringify(lifecycle.result, null, 2))
  }
}

// This terminal handler emits only a sanitized failure message and never an Error object with nested secrets.
if (require.main === module) {
  void main().catch((error: unknown) => {
    reportAcceptanceFailure(error)
    if (!process.exitCode) {
      process.exitCode = 1
    }
  })
}
