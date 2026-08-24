// This Node test suite owns acceptance harness contracts without entering Jest governance discovery.
import { strict as assert } from 'node:assert'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { existsSync, readFileSync } from 'node:fs'
import { IncomingMessage, ServerResponse, type Server } from 'node:http'
import type { Socket } from 'node:net'
import { resolve } from 'node:path'
import { Duplex } from 'node:stream'
import test from 'node:test'

import type { INestApplication } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import {
  GatewayPermissionGuard,
  GRPC_METADATA_PROPAGATION_FACTORY,
  SITE_MANAGEMENT_PERMISSION_CODES
} from '../../../common/dist/authorization'
import { SERVICE_NAMES } from '../../../common/dist/constants'
import { AppLogger } from '../../../common/dist/logging'
import { getGrpcClientToken } from '../../../common/dist/transport'
import { GatewayExceptionFilter } from '../../../services/api-gateway/dist/common/filters/gateway-exception.filter'
import { ExternalApiAccessGuard } from '../../../services/api-gateway/dist/common/external-api/external-api-access.guard'
import { GatewayVerifiedSourceCredentialVault } from '../../../services/api-gateway/dist/common/grpc/gateway-verified-source-credential.vault'
import { GatewaySessionAuthGuard } from '../../../services/api-gateway/dist/common/guards/gateway-session-auth.guard'
import { ResponseTransformInterceptor } from '../../../services/api-gateway/dist/common/interceptors/response.interceptor'
import { TenantTargetBindingGuard } from '../../../services/api-gateway/dist/common/tenant-target'
import { AuthGrpcAdapter } from '../../../services/api-gateway/dist/modules/auth-bff/infrastructure/downstream/auth-service/auth-grpc.adapter'
import { SiteManagementController } from '../../../services/api-gateway/dist/modules/site-management-bff/interface/http/controllers/site-management.controller'
import { SiteManagementService } from '../../../services/api-gateway/dist/modules/site-management-bff/site-management.service'
import { createGatewayGuardProviders } from '../../../services/api-gateway/dist/security'
import { of } from 'rxjs'

import {
  ACCEPTANCE_DATABASE_CONFIRM_ENV,
  ACCEPTANCE_DATABASE_CONFIRM_VALUE,
  ACCEPTANCE_DATABASE_URL_ENV,
  AcceptanceSafeFailure,
  createCleanupCoordinator,
  createAcceptanceNamespace,
  createTerminationController,
  reportAcceptanceFailure,
  redactSensitiveValue,
  reserveIsolatedLoopbackPorts,
  resolveAcceptanceDatabaseConfig,
  runAcceptanceLifecycle,
  runCleanupSteps,
  runWithDeterministicCleanup,
  startManagedResource,
  startWithBoundedRetries
} from '../scripts/locale-governance-acceptance-harness'
import {
  acceptanceGatewayGuardProviderFactory,
  createGatewayHarnessModule
} from '../scripts/locale-governance-gateway-harness'

const siteRoot = resolve(__dirname, '..')
const packagePath = resolve(siteRoot, 'package.json')
const acceptanceHarnessPath = resolve(siteRoot, 'scripts/locale-governance-acceptance-harness.ts')
const oldRunnerPath = resolve(siteRoot, 'scripts/verify-live-sync-display.ts')
const acceptanceRunnerPath = resolve(siteRoot, 'scripts/verify-locale-governance-acceptance.ts')
const acceptanceTsconfigPath = resolve(siteRoot, 'tsconfig.acceptance.json')
const gatewayConfigServiceToken = readGatewayConfigServiceToken()

/** readGatewayConfigServiceToken reuses the production guard dependency without adding a Site package dependency. */
function readGatewayConfigServiceToken(): unknown {
  const dependencies = Reflect.getMetadata('design:paramtypes', ExternalApiAccessGuard) as
    | unknown[]
    | undefined
  const token = dependencies?.[1]
  if (!token) throw new Error('ExternalApiAccessGuard ConfigService token is unavailable')
  return token
}

/** readPackageScripts loads the local package command map for acceptance truth-source checks. */
function readPackageScripts(): Record<string, string> {
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8')) as {
    scripts?: Record<string, string>
  }
  return packageJson.scripts ?? {}
}

/** assertCommandOrder proves every required acceptance build fragment appears once in freshness order. */
function assertCommandOrder(command: string, fragments: readonly string[]): void {
  let previousIndex = -1
  for (const fragment of fragments) {
    const index = command.indexOf(fragment)
    assert.ok(index >= 0, `Missing acceptance command fragment: ${fragment}`)
    assert.ok(index > previousIndex, `Acceptance command fragment is out of order: ${fragment}`)
    assert.equal(command.indexOf(fragment, index + fragment.length), -1)
    previousIndex = index
  }
}

/** createDeferred exposes deterministic promise settlement for termination lifecycle tests. */
function createDeferred<T = void>(): {
  readonly promise: Promise<T>
  readonly resolve: (value: T | PromiseLike<T>) => void
  readonly reject: (reason?: unknown) => void
} {
  let resolvePromise!: (value: T | PromiseLike<T>) => void
  let rejectPromise!: (reason?: unknown) => void
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve
    rejectPromise = reject
  })
  return { promise, resolve: resolvePromise, reject: rejectPromise }
}

/** createTestSignalSource records listener installation and exposes captured handlers without touching this process. */
function createTestSignalSource(events: string[]) {
  type Signal = 'SIGINT' | 'SIGTERM'
  type Listener = () => void | Promise<void>
  const listeners = new Map<Signal, Listener>()
  const source = {
    on(signal: Signal, listener: Listener) {
      events.push(`on:${signal}`)
      listeners.set(signal, listener)
      return source
    },
    off(signal: Signal, listener: Listener) {
      assert.equal(listeners.get(signal), listener)
      events.push(`off:${signal}`)
      listeners.delete(signal)
      return source
    }
  }
  return { listeners, source }
}

/** disposableEnvironment creates an isolated environment map without inheriting developer DB state. */
function disposableEnvironment(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    [ACCEPTANCE_DATABASE_URL_ENV]:
      'postgresql://acceptance_user:acceptance_password@127.0.0.1:55432/oes?schema=oes_acceptance_phase_a',
    [ACCEPTANCE_DATABASE_CONFIRM_ENV]: ACCEPTANCE_DATABASE_CONFIRM_VALUE,
    ...overrides
  }
}

/** gatewaySecurityIdentity creates one mutable auth-service response for real guard composition tests. */
function gatewaySecurityIdentity(
  overrides: {
    tenantId?: string
    scopeLevel?: 'TENANT' | 'SYSTEM'
  } = {}
) {
  return {
    accessToken: 'acceptance-gateway-token',
    accountId: 'acceptance-operator',
    userId: 'acceptance-user',
    sessionId: 'acceptance-session',
    scopeLevel: overrides.scopeLevel ?? 'TENANT',
    tenantId: Object.prototype.hasOwnProperty.call(overrides, 'tenantId')
      ? overrides.tenantId
      : 'tenant_a'
  }
}

interface GatewaySecurityTestState {
  identity: ReturnType<typeof gatewaySecurityIdentity>
  permissionAllowed: boolean
  authCalls: number
  readonly events: string[]
  readonly permissionRequests: Array<Record<string, unknown>>
  readonly serviceTenantTargets: string[]
}

/** InMemoryHttpSocket captures an initialized Nest HTTP response without binding any operating-system port. */
class InMemoryHttpSocket extends Duplex {
  readonly responseChunks: Buffer[] = []
  readonly remoteAddress = '127.0.0.1'
  readonly remotePort = 0

  /** _read leaves the synthetic request body empty for this GET-only requester. */
  override _read(): void {}

  /** _write captures raw HTTP response bytes emitted by Node's ServerResponse. */
  override _write(
    chunk: Buffer | string,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void
  ): void {
    this.responseChunks.push(
      Buffer.isBuffer(chunk) ? Buffer.from(chunk) : Buffer.from(chunk, encoding)
    )
    callback()
  }

  /** destroySoon matches the socket lifecycle method used by Node's HTTP response finalizer. */
  destroySoon(): void {
    this.end()
  }
}

interface InMemoryHttpResponse {
  readonly status: number
  readonly rawResponse: string
}

/** requestInitializedNestApplication drives the real initialized Nest/Express route stack entirely in memory. */
async function requestInitializedNestApplication(
  app: INestApplication,
  input: {
    readonly method: 'GET'
    readonly path: string
    readonly headers?: Readonly<Record<string, string>>
  }
): Promise<InMemoryHttpResponse> {
  const server = app.getHttpServer() as Server
  assert.ok(
    server.listenerCount('request') > 0,
    'Nest HTTP application must be initialized before an in-memory request'
  )
  const socket = new InMemoryHttpSocket()
  const nodeSocket = socket as unknown as Socket
  const requestMessage = new IncomingMessage(nodeSocket)
  const headers = {
    host: 'locale-governance.acceptance.invalid',
    connection: 'close',
    ...Object.fromEntries(
      Object.entries(input.headers ?? {}).map(([name, value]) => [name.toLowerCase(), value])
    )
  }
  requestMessage.method = input.method
  requestMessage.url = input.path
  requestMessage.headers = headers
  requestMessage.rawHeaders = Object.entries(headers).flatMap(([name, value]) => [name, value])
  requestMessage.push(null)

  const responseMessage = new ServerResponse(requestMessage)
  responseMessage.shouldKeepAlive = false
  responseMessage.assignSocket(nodeSocket)
  const finished = once(responseMessage, 'finish')
  server.emit('request', requestMessage, responseMessage)
  await finished

  return {
    status: responseMessage.statusCode,
    rawResponse: Buffer.concat(socket.responseChunks).toString('utf8')
  }
}

/** resetGatewaySecurityTestState isolates observations between real in-memory HTTP scenarios. */
function resetGatewaySecurityTestState(
  state: GatewaySecurityTestState,
  input: {
    identity?: ReturnType<typeof gatewaySecurityIdentity>
    permissionAllowed?: boolean
  } = {}
): void {
  state.identity = input.identity ?? gatewaySecurityIdentity()
  state.permissionAllowed = input.permissionAllowed ?? true
  state.authCalls = 0
  state.events.length = 0
  state.permissionRequests.length = 0
  state.serviceTenantTargets.length = 0
}

/** createGatewaySecurityTestApplication mounts real production guards and controller over minimal boundary doubles. */
async function createGatewaySecurityTestApplication(
  state: GatewaySecurityTestState
): Promise<INestApplication> {
  const permissionService = {
    /** checkPermission records the exact production permission RPC payload and returns the configured decision. */
    checkPermission(permissionRequest: Record<string, unknown>) {
      state.events.push('permission')
      state.permissionRequests.push({ ...permissionRequest })
      return of({ allowed: state.permissionAllowed })
    }
  }
  const moduleRef = await Test.createTestingModule({
    controllers: [SiteManagementController],
    providers: [
      {
        provide: AuthGrpcAdapter,
        useValue: {
          /** validateAccessToken returns the current test identity through the production session guard adapter seam. */
          validateAccessToken: async (accessToken: string) => {
            state.authCalls += 1
            state.events.push('auth')
            assert.equal(accessToken, state.identity.accessToken)
            return {
              ...state.identity,
              roleIds: [],
              passwordSetupRequired: false,
              terminal: 'WEB',
              allowedTerminals: ['WEB'],
              displayName: 'Acceptance Operator'
            }
          }
        }
      },
      {
        provide: getGrpcClientToken(SERVICE_NAMES.PERMISSION),
        useValue: {
          /** getService exposes only the permission method consumed by GatewayPermissionGuard. */
          getService: (serviceName: string) => {
            assert.equal(serviceName, 'PermissionCheckService')
            return permissionService
          }
        }
      },
      {
        provide: GRPC_METADATA_PROPAGATION_FACTORY,
        useValue: {
          /** createInternalCallMetadata supplies the permission guard's internal-call metadata seam. */
          createInternalCallMetadata: () => ({})
        }
      },
      {
        provide: AppLogger,
        useValue: {
          error: () => undefined,
          warn: () => undefined
        }
      },
      {
        provide: gatewayConfigServiceToken as never,
        useValue: { get: (_key: string, fallback: unknown) => fallback }
      },
      {
        provide: SiteManagementService,
        useValue: {
          /** listSiteCards records the verified target delivered by the real controller parameter decorator. */
          listSiteCards: async (tenantId: string) => {
            state.events.push('service')
            state.serviceTenantTargets.push(tenantId)
            return { cards: [], tenantId }
          }
        }
      },
      GatewayPermissionGuard,
      GatewayVerifiedSourceCredentialVault,
      ...acceptanceGatewayGuardProviderFactory(),
      GatewayExceptionFilter,
      ResponseTransformInterceptor
    ]
  }).compile()
  const app = moduleRef.createNestApplication()
  app.setGlobalPrefix('api/v1')
  app.useGlobalInterceptors(app.get(ResponseTransformInterceptor))
  app.useGlobalFilters(app.get(GatewayExceptionFilter))
  await app.init()
  return app
}

// This contract test rejects the obsolete live-sync entry point and any untyped replacement.
test('exposes one strict locale-governance acceptance command', () => {
  const scripts = readPackageScripts()
  const command = scripts['test:acceptance:locale-governance']
  const acceptanceCommands = Object.keys(scripts).filter((name) =>
    name.startsWith('test:acceptance:locale-governance')
  )

  assert.deepEqual(acceptanceCommands, ['test:acceptance:locale-governance'])
  assert.equal(scripts['test:live-sync'], undefined)
  assert.doesNotMatch(command, /transpile-only/)
  assert.match(command, /proto:gen/)
  assert.match(command, /prisma:generate/)
  assertCommandOrder(command, [
    'proto:gen',
    'prisma:generate',
    '--filter @oes/common clear:build',
    '--filter @oes/common build',
    '--filter site-service clear:build',
    '--filter site-service build',
    '--filter api-gateway clear:build',
    '--filter api-gateway build',
    'tsc --noEmit -p tsconfig.acceptance.json',
    'node --test'
  ])
  assert.doesNotMatch(command, /pnpm --dir \.\.\/\.\.\/\.\. clear:build/)
  assert.match(command, /TS_NODE_TRANSPILE_ONLY=false/)
  assert.match(command, /verify-locale-governance-acceptance\.ts/)
  assert.equal(existsSync(acceptanceRunnerPath), true)
  assert.equal(existsSync(oldRunnerPath), false)
})

// This integration contract executes the production guard factory and verified-target decorator over in-memory HTTP.
test('composes production Gateway security through Nest in-memory HTTP', async (t) => {
  assert.equal(acceptanceGatewayGuardProviderFactory, createGatewayGuardProviders)
  assert.deepEqual(createGatewayGuardProviders(), [
    { provide: APP_GUARD, useClass: GatewaySessionAuthGuard },
    { provide: APP_GUARD, useClass: TenantTargetBindingGuard },
    { provide: APP_GUARD, useClass: ExternalApiAccessGuard },
    { provide: APP_GUARD, useExisting: GatewayPermissionGuard }
  ])

  const gatewayModule = createGatewayHarnessModule({
    siteGrpcUrl: '127.0.0.1:1',
    authGrpcUrl: '127.0.0.1:2',
    permissionGrpcUrl: '127.0.0.1:3'
  })
  const providers = Reflect.getMetadata('providers', gatewayModule) as Array<{
    provide?: unknown
    useClass?: unknown
    useExisting?: unknown
  }>
  assert.deepEqual(
    providers.filter((provider) => provider.provide === APP_GUARD),
    createGatewayGuardProviders()
  )
  const state: GatewaySecurityTestState = {
    identity: gatewaySecurityIdentity(),
    permissionAllowed: true,
    authCalls: 0,
    events: [],
    permissionRequests: [],
    serviceTenantTargets: []
  }
  const app = await createGatewaySecurityTestApplication(state)
  /** tenantPath constructs the one real Site Management route exercised by the security matrix. */
  const tenantPath = (tenantId: string) => `/api/v1/site-management/tenants/${tenantId}/sites`
  /** get dispatches one initialized in-memory Nest request with an optional valid bearer. */
  const get = (tenantId: string, authenticated = true) =>
    requestInitializedNestApplication(app, {
      method: 'GET',
      path: tenantPath(tenantId),
      headers: authenticated ? { authorization: 'Bearer acceptance-gateway-token' } : undefined
    })

  try {
    await t.test('returns 401 before auth permission or service without Bearer', async () => {
      resetGatewaySecurityTestState(state)

      assert.equal((await get('tenant_a', false)).status, 401)

      assert.equal(state.authCalls, 0)
      assert.deepEqual(state.events, [])
      assert.deepEqual(state.permissionRequests, [])
      assert.deepEqual(state.serviceTenantTargets, [])
    })

    await t.test('returns 403 after permission deny and before service', async () => {
      resetGatewaySecurityTestState(state, { permissionAllowed: false })

      assert.equal((await get('tenant_a')).status, 403)

      assert.deepEqual(state.events, ['auth', 'permission'])
      assert.deepEqual(state.permissionRequests, [
        {
          accountId: 'acceptance-operator',
          permissionCode: SITE_MANAGEMENT_PERMISSION_CODES.READ,
          tenantId: 'tenant_a'
        }
      ])
      assert.deepEqual(state.serviceTenantTargets, [])
    })

    for (const scenario of [
      {
        name: 'rejects a mismatched URL tenant before permission or service',
        status: 403,
        tenantId: 'tenant_b',
        identity: gatewaySecurityIdentity()
      },
      {
        name: 'rejects a TENANT identity without a tenant before permission or service',
        status: 401,
        tenantId: 'tenant_a',
        identity: gatewaySecurityIdentity({ tenantId: undefined })
      },
      {
        name: 'rejects a SYSTEM identity before permission or service',
        status: 403,
        tenantId: 'tenant_a',
        identity: gatewaySecurityIdentity({
          scopeLevel: 'SYSTEM',
          tenantId: undefined
        })
      }
    ]) {
      await t.test(scenario.name, async () => {
        resetGatewaySecurityTestState(state, { identity: scenario.identity })

        assert.equal((await get(scenario.tenantId)).status, scenario.status)

        assert.deepEqual(state.events, ['auth'])
        assert.deepEqual(state.permissionRequests, [])
        assert.deepEqual(state.serviceTenantTargets, [])
      })
    }

    await t.test('passes the exact verified target after permission', async () => {
      resetGatewaySecurityTestState(state)

      assert.equal((await get('tenant_a')).status, 200)

      assert.deepEqual(state.events, ['auth', 'permission', 'service'])
      assert.deepEqual(state.permissionRequests, [
        {
          accountId: 'acceptance-operator',
          permissionCode: SITE_MANAGEMENT_PERMISSION_CODES.READ,
          tenantId: 'tenant_a'
        }
      ])
      assert.deepEqual(state.serviceTenantTargets, ['tenant_a'])
    })
  } finally {
    await app.close()
  }
})

// This unit test proves the preflight never falls back to an ordinary DATABASE_URL.
test('rejects a missing explicit acceptance database even when DATABASE_URL exists', () => {
  assert.throws(
    () =>
      resolveAcceptanceDatabaseConfig({
        DATABASE_URL: 'postgresql://developer:secret@127.0.0.1:5432/oes'
      }),
    new RegExp(ACCEPTANCE_DATABASE_URL_ENV)
  )
})

// This unit test proves an explicit URL still requires the destructive-use acknowledgement.
test('rejects an unconfirmed acceptance database', () => {
  assert.throws(
    () =>
      resolveAcceptanceDatabaseConfig(
        disposableEnvironment({ [ACCEPTANCE_DATABASE_CONFIRM_ENV]: undefined })
      ),
    new RegExp(ACCEPTANCE_DATABASE_CONFIRM_ENV)
  )
})

// This unit test proves a confirmed target must carry a disposable database or schema marker.
test('rejects a production-shaped database target without an acceptance marker', () => {
  assert.throws(
    () =>
      resolveAcceptanceDatabaseConfig(
        disposableEnvironment({
          [ACCEPTANCE_DATABASE_URL_ENV]:
            'postgresql://acceptance_user:secret@db.internal:5432/oes?schema=public'
        })
      ),
    /database name or schema must contain/i
  )
})

// This unit test proves an acceptance-named schema cannot override an explicitly production-like hostname.
test('rejects an explicitly production-like database hostname', () => {
  for (const hostname of ['prod-db.internal', 'prod01-db.internal', 'prd-db.internal']) {
    assert.throws(
      () =>
        resolveAcceptanceDatabaseConfig(
          disposableEnvironment({
            [ACCEPTANCE_DATABASE_URL_ENV]: `postgresql://acceptance_user:secret@${hostname}:5432/oes?schema=oes_acceptance_phase_a`
          })
        ),
      /production-like hostname/i
    )
  }
})

// This unit test proves safe diagnostics omit user information and passwords.
test('accepts an isolated schema and returns a redacted target', () => {
  const config = resolveAcceptanceDatabaseConfig(disposableEnvironment())

  assert.match(config.safeTarget, /^127\.0\.0\.1:55432\/oes\?schema=oes_acceptance_phase_a$/)
  assert.doesNotMatch(config.safeTarget, /acceptance_user|acceptance_password/)
})

// This unit test proves all business and operator identifiers share one random run namespace.
test('creates namespaced tenant site-facing and operator identities', () => {
  const namespace = createAcceptanceNamespace(
    () => 1_721_536_000_000,
    () => Buffer.from('a1b2c3d4e5f6', 'hex')
  )

  assert.equal(namespace.runId, 'locale_gov_a_1721536000000_a1b2c3d4e5f6')
  for (const value of [
    namespace.tenantId,
    namespace.orgId,
    namespace.operatorId,
    namespace.traceId
  ]) {
    assert.match(value, new RegExp(`^${namespace.runId}_`))
  }
})

// This unit test proves the harness never emits bundle or client-secret bytes in diagnostics.
test('redacts every non-empty sensitive value', () => {
  const bundle = 'oes_site_cred_v1.super-secret-bundle'
  const secret = 'client-secret-material'

  assert.equal(redactSensitiveValue(bundle), '[REDACTED]')
  assert.equal(redactSensitiveValue(secret), '[REDACTED]')
  assert.doesNotMatch(`${redactSensitiveValue(bundle)}${redactSensitiveValue(secret)}`, /secret/)
})

// This unit test invokes the real terminal reporter and proves unknown nested errors cannot reach stderr-like sinks.
test('reports unknown terminal failures through a constant whitelist', () => {
  const sensitiveValues = [
    'postgresql://acceptance:db-secret@127.0.0.1:5432/oes_acceptance',
    'oes_site_cred_v1.credential-bundle-secret',
    'Bearer admin-access-token',
    'client-secret-material',
    'signing-secret-material',
    'upstream response body with private data'
  ]
  const output: string[] = []
  reportAcceptanceFailure(
    new AggregateError(
      sensitiveValues.map((value) => new Error(value)),
      sensitiveValues.join(' ')
    ),
    (line) => output.push(line)
  )

  assert.deepEqual(output, [
    JSON.stringify({
      code: 'LOCALE_GOVERNANCE_ACCEPTANCE_FAILED',
      message: 'Locale-governance Phase A acceptance failed'
    })
  ])
  for (const sensitive of sensitiveValues) {
    assert.doesNotMatch(
      output.join(''),
      new RegExp(sensitive.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    )
  }
})

// This unit test proves only explicitly safe configuration failures may add the redacted database target.
test('reports explicit safe configuration code and target without raw causes', () => {
  const output: string[] = []
  reportAcceptanceFailure(
    new AcceptanceSafeFailure({
      code: 'ACCEPTANCE_DATABASE_UNAVAILABLE',
      safeTarget: '127.0.0.1:55432/oes?schema=oes_acceptance_phase_a',
      cause: new Error('postgresql://user:raw-password@127.0.0.1/oes')
    }),
    (line) => output.push(line)
  )

  assert.deepEqual(output, [
    JSON.stringify({
      code: 'ACCEPTANCE_DATABASE_UNAVAILABLE',
      message: 'Disposable acceptance database is unavailable',
      safeTarget: '127.0.0.1:55432/oes?schema=oes_acceptance_phase_a'
    })
  ])
  assert.doesNotMatch(output.join(''), /raw-password|postgresql:\/\//)
})

// This unit test proves an unsafe value cannot leak merely by being labeled as a safe target.
test('omits malformed safe targets from the real terminal reporter', () => {
  const output: string[] = []
  reportAcceptanceFailure(
    new AcceptanceSafeFailure({
      code: 'ACCEPTANCE_DATABASE_UNAVAILABLE',
      safeTarget: 'postgresql://acceptance-user:database-secret@127.0.0.1/oes_acceptance'
    }),
    (line) => output.push(line)
  )

  assert.deepEqual(output, [
    JSON.stringify({
      code: 'ACCEPTANCE_DATABASE_UNAVAILABLE',
      message: 'Disposable acceptance database is unavailable'
    })
  ])
  assert.doesNotMatch(output.join(''), /postgresql|database-secret|acceptance-user/)
})

// This unit test proves automatically selected server ports are isolated from each other.
test('reserves distinct ephemeral loopback ports', async () => {
  const candidates = [41_001, 41_001, 41_002, 41_003]
  // This deterministic allocator lets the unit test verify collision removal without binding a real socket.
  const ports = await reserveIsolatedLoopbackPorts(3, async () => candidates.shift()!)

  assert.equal(ports.length, 3)
  assert.equal(new Set(ports).size, 3)
  assert.ok(ports.every((port) => Number.isInteger(port) && port > 0 && port <= 65_535))
})

// This unit test proves repeated kernel collisions cannot leave acceptance port selection looping forever.
test('bounds duplicate loopback port allocation attempts', async () => {
  let attempts = 0

  await assert.rejects(
    reserveIsolatedLoopbackPorts(
      2,
      async () => {
        attempts += 1
        return 41_001
      },
      3
    ),
    /after 3 attempts/i
  )
  assert.equal(attempts, 3)
})

// This unit test proves a stolen port can trigger a bounded fresh startup attempt.
test('retries only classified startup collisions within a fixed bound', async () => {
  let attempts = 0
  const result = await startWithBoundedRetries(
    async () => {
      attempts += 1
      if (attempts < 3) {
        throw new Error('EADDRINUSE')
      }
      return 'started'
    },
    (error) => error instanceof Error && error.message === 'EADDRINUSE',
    3
  )

  assert.equal(result, 'started')
  assert.equal(attempts, 3)
})

// This unit test proves a server object is closed even when it fails before entering the outer resource list.
test('closes a partially started resource when listen fails', async () => {
  const events: string[] = []
  const failure = new Error('listen failed')

  await assert.rejects(
    startManagedResource(
      async () => ({
        close: async () => {
          events.push('close')
        }
      }),
      async () => {
        events.push('start')
        throw failure
      }
    ),
    failure
  )
  assert.deepEqual(events, ['start', 'close'])
})

// This unit test proves a created resource is managed before deferred startup and closes once when termination wins.
test('registers before deferred start and closes once on abort', async () => {
  const events: string[] = []
  const startGate = createDeferred()
  const abortController = new AbortController()
  let closeCalls = 0
  const cleanup = createCleanupCoordinator(async () => {
    events.push('cleanup-data')
  })
  const startPromise = startManagedResource(
    async (signal) => {
      assert.equal(signal, abortController.signal)
      events.push('create')
      return {
        close: async () => {
          closeCalls += 1
          events.push('close')
        }
      }
    },
    async (_resource, signal) => {
      assert.equal(signal, abortController.signal)
      events.push('start')
      await startGate.promise
    },
    {
      cleanup,
      signal: abortController.signal,
      onRegistered: () => events.push('registered')
    }
  )
  while (!events.includes('start')) {
    await Promise.resolve()
  }
  assert.deepEqual(events, ['create', 'registered', 'start'])

  abortController.abort()
  await cleanup.cleanup()
  assert.equal(closeCalls, 1)
  startGate.resolve(undefined)
  await assert.rejects(startPromise, /termination requested/i)

  assert.equal(closeCalls, 1)
  assert.deepEqual(events, ['create', 'registered', 'start', 'close', 'cleanup-data'])
})

// This unit test proves resources and owned rows are cleaned when the acceptance body fails.
test('closes resources in reverse order and cleans owned data after failure', async () => {
  const events: string[] = []
  const failure = new Error('expected acceptance failure')
  const cleanup = createCleanupCoordinator(async () => {
    events.push('cleanup-data')
  })
  await cleanup.register({
    close: async () => {
      events.push('close-first')
    }
  })
  await cleanup.register({
    close: async () => {
      events.push('close-second')
    }
  })

  await assert.rejects(
    runWithDeterministicCleanup(async () => {
      events.push('work')
      throw failure
    }, cleanup),
    failure
  )
  assert.deepEqual(events, ['work', 'close-second', 'close-first', 'cleanup-data'])
})

// This unit test proves lifecycle listeners are installed before connect and normal cleanup runs exactly once.
test('orchestrates listener connect phase and cleanup order through injected dependencies', async () => {
  const events: string[] = []
  const { source } = createTestSignalSource(events)
  const database = {
    url: 'postgresql://acceptance.invalid/oes_acceptance',
    safeTarget: 'acceptance.invalid:5432/oes_acceptance'
  }
  const namespace = createAcceptanceNamespace(
    () => 1_721_536_000_001,
    () => Buffer.from('010203040506', 'hex')
  )
  const prisma = {
    $disconnect: async () => {
      events.push('disconnect')
    }
  }

  const lifecycle = await runAcceptanceLifecycle({
    database,
    namespace,
    prisma,
    signalSource: source,
    activePhaseTimeoutMs: 25,
    connectDatabase: async (
      connectedPrisma: typeof prisma,
      connectedDatabase: typeof database,
      signal: AbortSignal
    ) => {
      assert.equal(connectedPrisma, prisma)
      assert.equal(connectedDatabase, database)
      assert.equal(signal.aborted, false)
      events.push('connect')
    },
    cleanupNamespace: async () => {
      events.push('namespace-cleanup')
    },
    createRuntimeDirectory: () => {
      events.push('create-runtime-directory')
      return '/tmp/locale-governance-lifecycle'
    },
    removeRuntimeDirectory: async (directory: string) => {
      events.push(`remove:${directory}`)
    },
    executePhase: async (input: { runtimeDirectory: string }) => {
      events.push(`execute:${input.runtimeDirectory}`)
      return 'phase-result'
    },
    onExitIntent: () => events.push('exit-intent'),
    onForceExit: () => events.push('force-exit'),
    reportFailure: () => events.push('failure')
  })

  assert.deepEqual(lifecycle, {
    result: 'phase-result',
    terminationSignal: undefined
  })
  assert.deepEqual(events, [
    'on:SIGINT',
    'on:SIGTERM',
    'connect',
    'create-runtime-directory',
    'execute:/tmp/locale-governance-lifecycle',
    'namespace-cleanup',
    'disconnect',
    'remove:/tmp/locale-governance-lifecycle',
    'off:SIGINT',
    'off:SIGTERM'
  ])
})

// This unit test proves namespace cleanup failure cannot skip Prisma or temporary-directory cleanup.
test('continues injected lifecycle cleanup after namespace failure', async () => {
  const events: string[] = []
  const { source } = createTestSignalSource(events)
  const database = {
    url: 'postgresql://acceptance.invalid/oes_acceptance',
    safeTarget: 'acceptance.invalid:5432/oes_acceptance'
  }
  const namespace = createAcceptanceNamespace(
    () => 1_721_536_000_002,
    () => Buffer.from('111213141516', 'hex')
  )
  const prisma = {
    $disconnect: async () => {
      events.push('disconnect')
    }
  }

  await assert.rejects(
    runAcceptanceLifecycle({
      database,
      namespace,
      prisma,
      signalSource: source,
      activePhaseTimeoutMs: 25,
      connectDatabase: async () => {
        events.push('connect')
      },
      cleanupNamespace: async () => {
        events.push('namespace-cleanup')
        throw new Error('namespace-cleanup-sensitive-cause')
      },
      createRuntimeDirectory: () => '/tmp/locale-governance-cleanup-failure',
      removeRuntimeDirectory: async (directory: string) => {
        events.push(`remove:${directory}`)
      },
      executePhase: async () => 'phase-result',
      onExitIntent: () => events.push('exit-intent'),
      onForceExit: () => events.push('force-exit'),
      reportFailure: () => events.push('failure')
    }),
    (error: unknown) => {
      assert.ok(error instanceof AggregateError)
      assert.equal(error.message, 'locale-governance acceptance cleanup failed')
      assert.ok(error.errors[0] instanceof AggregateError)
      assert.equal(error.errors[0].message, 'locale-governance acceptance cleanup steps failed')
      return true
    }
  )

  assert.equal(events.filter((event) => event === 'namespace-cleanup').length, 1)
  assert.equal(events.filter((event) => event === 'disconnect').length, 1)
  assert.equal(
    events.filter((event) => event === 'remove:/tmp/locale-governance-cleanup-failure').length,
    1
  )
  assert.deepEqual(events.slice(-2), ['off:SIGINT', 'off:SIGTERM'])
})

// This unit test proves a connect that resolves after signal cleanup is disconnected a second time without namespace work.
test('disconnects a late database connection after signal cleanup', async () => {
  const events: string[] = []
  const { listeners, source } = createTestSignalSource(events)
  const connectGate = createDeferred()
  const database = {
    url: 'postgresql://acceptance.invalid/oes_acceptance',
    safeTarget: 'acceptance.invalid:5432/oes_acceptance'
  }
  const namespace = createAcceptanceNamespace(
    () => 1_721_536_000_003,
    () => Buffer.from('212223242526', 'hex')
  )
  const prisma = {
    $disconnect: async () => {
      events.push('disconnect')
    }
  }
  const lifecyclePromise = runAcceptanceLifecycle({
    database,
    namespace,
    prisma,
    signalSource: source,
    activePhaseTimeoutMs: 5,
    connectDatabase: async () => {
      events.push('connect-start')
      await connectGate.promise
      events.push('connect-settled')
    },
    cleanupNamespace: async () => {
      events.push('namespace-cleanup')
    },
    createRuntimeDirectory: () => {
      events.push('create-runtime-directory')
      return '/tmp/locale-governance-late-connect'
    },
    removeRuntimeDirectory: async (directory: string) => {
      events.push(`remove:${directory}`)
    },
    executePhase: async () => {
      events.push('execute')
      return 'phase-result'
    },
    onExitIntent: (signal: string, exitCode: number) => events.push(`exit:${signal}:${exitCode}`),
    onForceExit: (signal: string, exitCode: number) => events.push(`force:${signal}:${exitCode}`),
    reportFailure: () => events.push('failure')
  })
  while (!events.includes('connect-start')) {
    await Promise.resolve()
  }

  await listeners.get('SIGTERM')?.()
  assert.equal(events.filter((event) => event === 'disconnect').length, 1)
  connectGate.resolve(undefined)
  await assert.rejects(lifecyclePromise, /termination requested/i)

  assert.equal(events.filter((event) => event === 'disconnect').length, 2)
  assert.equal(events.includes('namespace-cleanup'), false)
  assert.equal(events.includes('create-runtime-directory'), false)
  assert.equal(events.includes('execute'), false)
  assert.deepEqual(events.slice(-2), ['off:SIGINT', 'off:SIGTERM'])
})

// This unit test proves first termination aborts new work, waits for the active phase, cleans once, and unloads listeners.
test('waits for active work before first-signal cleanup and records exit intent', async () => {
  type Signal = 'SIGINT' | 'SIGTERM'
  type Listener = () => void | Promise<void>
  const listeners = new Map<Signal, Listener>()
  const removed: Signal[] = []
  const signalSource = {
    on(signal: Signal, listener: Listener) {
      listeners.set(signal, listener)
      return signalSource
    },
    off(signal: Signal, listener: Listener) {
      assert.equal(listeners.get(signal), listener)
      listeners.delete(signal)
      removed.push(signal)
      return signalSource
    }
  }
  const events: string[] = []
  const activeGate = createDeferred()
  const cleanup = createCleanupCoordinator(async () => {
    events.push('cleanup')
  })
  const termination = createTerminationController({
    cleanup,
    activePhaseTimeoutMs: 50,
    onExitIntent: (signal, exitCode) => events.push(`exit:${signal}:${exitCode}`),
    onForceExit: (signal, exitCode) => events.push(`force:${signal}:${exitCode}`),
    reportFailure: () => events.push('reported')
  })
  const removeSignalListeners = termination.installSignalHandlers(signalSource)
  const activeWork = termination.runPhase('runtime-startup', async (signal) => {
    events.push(`active:${signal.aborted}`)
    await activeGate.promise
    events.push('active-settled')
  })
  await Promise.resolve()

  const firstSignal = listeners.get('SIGINT')?.()
  await Promise.resolve()
  assert.equal(termination.signal.aborted, true)
  assert.deepEqual(events, ['active:false', 'exit:SIGINT:130'])
  assert.throws(() => termination.throwIfTerminating(), /termination requested/i)

  activeGate.resolve(undefined)
  await activeWork
  await firstSignal
  removeSignalListeners()

  assert.deepEqual(events, ['active:false', 'exit:SIGINT:130', 'active-settled', 'cleanup'])
  assert.deepEqual(removed.sort(), ['SIGINT', 'SIGTERM'])
  assert.equal(listeners.size, 0)
})

// This unit test proves bounded wait permits cleanup and a second signal escalates through the injected force-exit boundary.
test('times out active work and escalates a second signal without calling process.exit', async () => {
  type Signal = 'SIGINT' | 'SIGTERM'
  type Listener = () => void | Promise<void>
  const listeners = new Map<Signal, Listener>()
  const signalSource = {
    on(signal: Signal, listener: Listener) {
      listeners.set(signal, listener)
      return signalSource
    },
    off(signal: Signal) {
      listeners.delete(signal)
      return signalSource
    }
  }
  const events: string[] = []
  const activeGate = createDeferred()
  const timeoutGate = createDeferred()
  const cleanup = createCleanupCoordinator(async () => {
    events.push('cleanup')
  })
  const termination = createTerminationController({
    cleanup,
    activePhaseTimeoutMs: 25,
    waitForActivePhase: async (_activePhase, timeoutMs) => {
      events.push(`wait:${timeoutMs}`)
      await timeoutGate.promise
    },
    onExitIntent: (signal, exitCode) => events.push(`exit:${signal}:${exitCode}`),
    onForceExit: (signal, exitCode) => events.push(`force:${signal}:${exitCode}`),
    reportFailure: () => events.push('reported')
  })
  termination.installSignalHandlers(signalSource)
  const activeWork = termination.runPhase('uncancellable-library-call', async () => {
    events.push('active')
    await activeGate.promise
  })
  await Promise.resolve()

  const firstSignal = listeners.get('SIGTERM')?.()
  await Promise.resolve()
  await listeners.get('SIGINT')?.()
  assert.deepEqual(events, ['active', 'exit:SIGTERM:143', 'wait:25', 'force:SIGINT:130'])

  timeoutGate.resolve(undefined)
  await firstSignal
  await cleanup.cleanup()
  activeGate.resolve(undefined)
  await activeWork
  assert.deepEqual(events, ['active', 'exit:SIGTERM:143', 'wait:25', 'force:SIGINT:130', 'cleanup'])
})

// This unit test proves the default bounded drain reaches cleanup while an uncancellable phase remains active.
test('uses the default bounded wait before cleaning an active phase', async () => {
  type Signal = 'SIGINT' | 'SIGTERM'
  type Listener = () => void | Promise<void>
  const listeners = new Map<Signal, Listener>()
  const signalSource = {
    on(signal: Signal, listener: Listener) {
      listeners.set(signal, listener)
      return signalSource
    },
    off(signal: Signal) {
      listeners.delete(signal)
      return signalSource
    }
  }
  const events: string[] = []
  const activeGate = createDeferred()
  const cleanup = createCleanupCoordinator(async () => {
    events.push('cleanup')
  })
  const termination = createTerminationController({
    cleanup,
    activePhaseTimeoutMs: 5,
    onExitIntent: (signal, exitCode) => events.push(`exit:${signal}:${exitCode}`),
    onForceExit: (signal, exitCode) => events.push(`force:${signal}:${exitCode}`),
    reportFailure: () => events.push('reported')
  })
  termination.installSignalHandlers(signalSource)
  let activeSettled = false
  const activeWork = termination.runPhase('uncancellable-phase', async () => {
    await activeGate.promise
    activeSettled = true
  })
  await Promise.resolve()

  try {
    await listeners.get('SIGINT')?.()
    assert.equal(activeSettled, false)
    assert.deepEqual(events, ['exit:SIGINT:130', 'cleanup'])
  } finally {
    activeGate.resolve(undefined)
    await activeWork
  }
})

// This integration test proves the bounded-wait timer keeps a signal-handling child alive until cleanup finishes.
test('keeps a termination child alive through bounded wait cleanup', async () => {
  const childProgram = [
    'const fs=require("node:fs")',
    `const harness=require(${JSON.stringify(acceptanceHarnessPath)})`,
    'const record=(event)=>fs.writeSync(1,event+"\\n")',
    'const keepAlive=setInterval(()=>undefined,1000)',
    'const cleanup=harness.createCleanupCoordinator(async()=>record("cleanup"))',
    'const termination=harness.createTerminationController({cleanup,activePhaseTimeoutMs:50,onExitIntent:(signal,code)=>{record("exit:"+signal+":"+code);clearInterval(keepAlive);process.exitCode=code},onForceExit:(signal,code)=>record("force:"+signal+":"+code),reportFailure:()=>record("failure")})',
    'termination.installSignalHandlers(process)',
    'void termination.runPhase("never-settles",async()=>new Promise(()=>undefined))',
    'record("ready")'
  ].join(';')
  const child = spawn(
    process.execPath,
    ['--require', 'ts-node/register', '--require', 'tsconfig-paths/register', '-e', childProgram],
    {
      cwd: siteRoot,
      env: {
        ...process.env,
        NODE_NO_WARNINGS: '1',
        TS_NODE_PROJECT: acceptanceTsconfigPath,
        TS_NODE_TRANSPILE_ONLY: 'false'
      }
    }
  )
  child.stdout.setEncoding('utf8')
  let stdout = ''
  child.stdout.on('data', (chunk: string) => {
    stdout += chunk
  })

  try {
    while (!stdout.includes('ready\n')) {
      await once(child.stdout, 'data', { signal: AbortSignal.timeout(5_000) })
    }
    assert.equal(child.kill('SIGTERM'), true)
    const [exitCode, exitSignal] = (await once(child, 'exit', {
      signal: AbortSignal.timeout(2_000)
    })) as [number | null, NodeJS.Signals | null]

    assert.equal(exitCode, 143)
    assert.equal(exitSignal, null)
    assert.deepEqual(stdout.trim().split('\n'), ['ready', 'exit:SIGTERM:143', 'cleanup'])
  } finally {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGKILL')
    }
  }
})

// This unit test proves an active-phase drain failure cannot skip cleanup or leak its nested error.
test('continues first-signal cleanup after active drain failure and reports safely once', async () => {
  type Signal = 'SIGINT' | 'SIGTERM'
  type Listener = () => void | Promise<void>
  const listeners = new Map<Signal, Listener>()
  const signalSource = {
    on(signal: Signal, listener: Listener) {
      listeners.set(signal, listener)
      return signalSource
    },
    off(signal: Signal) {
      listeners.delete(signal)
      return signalSource
    }
  }
  const events: string[] = []
  const output: string[] = []
  const activeGate = createDeferred()
  const cleanup = createCleanupCoordinator(async () => {
    events.push('cleanup')
  })
  const termination = createTerminationController({
    cleanup,
    activePhaseTimeoutMs: 25,
    waitForActivePhase: async () => {
      events.push('drain')
      throw new Error('Bearer active-phase-secret')
    },
    onExitIntent: (signal, exitCode) => events.push(`exit:${signal}:${exitCode}`),
    onForceExit: (signal, exitCode) => events.push(`force:${signal}:${exitCode}`),
    reportFailure: (error) => reportAcceptanceFailure(error, (line) => output.push(line))
  })
  termination.installSignalHandlers(signalSource)
  const activeWork = termination.runPhase('active-phase', async () => {
    await activeGate.promise
  })
  await Promise.resolve()

  await listeners.get('SIGTERM')?.()
  assert.deepEqual(events, ['exit:SIGTERM:143', 'drain', 'cleanup'])
  activeGate.resolve(undefined)
  await activeWork

  assert.deepEqual(output, [
    JSON.stringify({
      code: 'LOCALE_GOVERNANCE_ACCEPTANCE_FAILED',
      message: 'Locale-governance Phase A acceptance failed'
    })
  ])
  assert.doesNotMatch(output.join(''), /active-phase-secret|Bearer/)
})

// This unit test proves late resource registration closes immediately and never escapes an already-started cleanup.
test('closes and rejects resources registered after cleanup starts', async () => {
  let closeCalls = 0
  const cleanup = createCleanupCoordinator(async () => undefined)
  await cleanup.cleanup()

  await assert.rejects(
    cleanup.register({
      close: async () => {
        closeCalls += 1
      }
    }),
    /cleanup has already started/i
  )
  assert.equal(closeCalls, 1)
})

// This unit test proves every cleanup step and the final postcondition run even when an earlier delete fails.
test('continues cleanup through owner root audit and postcondition before aggregating errors', async () => {
  const events: string[] = []

  await assert.rejects(
    runCleanupSteps([
      {
        code: 'DELETE_CHILD',
        run: async () => {
          events.push('delete-child')
          throw new Error('credential-secret-must-not-leak')
        }
      },
      {
        code: 'DELETE_OWNER_ROOT',
        run: async () => {
          events.push('delete-owner-root')
        }
      },
      {
        code: 'DELETE_AUDIT',
        run: async () => {
          events.push('delete-audit')
        }
      },
      {
        code: 'POSTCONDITION_NAMESPACE_EMPTY',
        run: async () => {
          events.push('postcondition')
        }
      }
    ]),
    (error: unknown) => {
      assert.ok(error instanceof AggregateError)
      assert.equal(error.errors.length, 1)
      assert.equal(error.message, 'locale-governance acceptance cleanup steps failed')
      assert.doesNotMatch(error.message, /credential-secret/)
      return true
    }
  )
  assert.deepEqual(events, ['delete-child', 'delete-owner-root', 'delete-audit', 'postcondition'])
})
