import { randomBytes as nodeRandomBytes } from 'node:crypto'
import { createServer } from 'node:net'

export const ACCEPTANCE_DATABASE_URL_ENV = 'OES_LOCALE_GOVERNANCE_ACCEPTANCE_DATABASE_URL'
export const ACCEPTANCE_DATABASE_CONFIRM_ENV = 'OES_LOCALE_GOVERNANCE_ACCEPTANCE_DISPOSABLE'
export const ACCEPTANCE_DATABASE_CONFIRM_VALUE = 'YES_DISPOSABLE_ACCEPTANCE_DATABASE'

export interface AcceptanceDatabaseConfig {
  readonly url: string
  readonly safeTarget: string
}

export interface AcceptanceNamespace {
  readonly runId: string
  readonly tenantId: string
  readonly orgId: string
  readonly operatorId: string
  readonly traceId: string
}

const ACCEPTANCE_SAFE_FAILURE_MESSAGES = {
  ACCEPTANCE_DATABASE_CONFIGURATION_INVALID: 'Acceptance database configuration is invalid',
  ACCEPTANCE_DATABASE_UNAVAILABLE: 'Disposable acceptance database is unavailable',
  ACCEPTANCE_TERMINATION_CLEANUP_FAILED: 'Locale-governance acceptance termination cleanup failed'
} as const

export type AcceptanceSafeFailureCode = keyof typeof ACCEPTANCE_SAFE_FAILURE_MESSAGES

export interface SanitizedAcceptanceFailure {
  readonly code: string
  readonly message: string
  readonly safeTarget?: string
}

/** AcceptanceSafeFailure exposes only enumerated operator-safe codes, messages, and optional redacted targets. */
export class AcceptanceSafeFailure extends Error {
  readonly code: AcceptanceSafeFailureCode
  readonly safeTarget?: string

  constructor(input: { code: AcceptanceSafeFailureCode; safeTarget?: string; cause?: unknown }) {
    super(ACCEPTANCE_SAFE_FAILURE_MESSAGES[input.code], { cause: input.cause })
    this.name = 'AcceptanceSafeFailure'
    this.code = input.code
    this.safeTarget = input.safeTarget
  }
}

export interface AsyncCloseable {
  close(): void | Promise<void>
}

export type AcceptanceTerminationSignal = 'SIGINT' | 'SIGTERM'

export interface CleanupCoordinator {
  register(resource: AsyncCloseable): Promise<AsyncCloseable>
  cleanup(): Promise<void>
}

export interface ManagedResourceStartOptions {
  readonly cleanup?: CleanupCoordinator
  readonly signal?: AbortSignal
  readonly onRegistered?: (resource: AsyncCloseable) => void
}

export interface TerminationSignalSource {
  on(signal: AcceptanceTerminationSignal, listener: () => void | Promise<void>): unknown
  off(signal: AcceptanceTerminationSignal, listener: () => void | Promise<void>): unknown
}

export interface CleanupStep {
  readonly code: string
  readonly run: () => Promise<void>
}

export interface TerminationControllerOptions {
  readonly cleanup: CleanupCoordinator
  readonly activePhaseTimeoutMs: number
  readonly waitForActivePhase?: (activePhase: Promise<void>, timeoutMs: number) => Promise<void>
  readonly onExitIntent: (signal: AcceptanceTerminationSignal, exitCode: number) => void
  readonly onForceExit: (signal: AcceptanceTerminationSignal, exitCode: number) => void
  readonly reportFailure: (error: unknown) => void
}

export interface AcceptanceTerminationController {
  readonly signal: AbortSignal
  runPhase<T>(phaseName: string, work: (signal: AbortSignal) => Promise<T>): Promise<T>
  throwIfTerminating(): void
  installSignalHandlers(signalSource: TerminationSignalSource): () => void
}

export interface AcceptanceLifecyclePrisma {
  $disconnect(): Promise<void>
}

export interface AcceptanceLifecyclePhaseInput<TPrisma extends AcceptanceLifecyclePrisma> {
  readonly prisma: TPrisma
  readonly runtimeDirectory: string
  readonly cleanup: CleanupCoordinator
  readonly termination: AcceptanceTerminationController
}

export interface AcceptanceLifecycleDependencies<
  TPrisma extends AcceptanceLifecyclePrisma,
  TResult
> {
  readonly database: AcceptanceDatabaseConfig
  readonly namespace: AcceptanceNamespace
  readonly prisma: TPrisma
  readonly signalSource: TerminationSignalSource
  readonly activePhaseTimeoutMs: number
  readonly connectDatabase: (
    prisma: TPrisma,
    database: AcceptanceDatabaseConfig,
    signal: AbortSignal
  ) => Promise<void>
  readonly cleanupNamespace: (prisma: TPrisma, namespace: AcceptanceNamespace) => Promise<void>
  readonly createRuntimeDirectory: () => string | Promise<string>
  readonly removeRuntimeDirectory: (directory: string) => void | Promise<void>
  readonly executePhase: (input: AcceptanceLifecyclePhaseInput<TPrisma>) => Promise<TResult>
  readonly onExitIntent: (signal: AcceptanceTerminationSignal, exitCode: number) => void
  readonly onForceExit: (signal: AcceptanceTerminationSignal, exitCode: number) => void
  readonly reportFailure: (error: unknown) => void
}

export interface AcceptanceLifecycleResult<TResult> {
  readonly result: TResult
  readonly terminationSignal: AcceptanceTerminationSignal | undefined
}

/** startManagedResource registers a created resource before abort-aware startup and closes it idempotently on failure. */
export async function startManagedResource<T extends AsyncCloseable>(
  create: (signal?: AbortSignal) => Promise<T>,
  start: (resource: T, signal?: AbortSignal) => Promise<void>,
  options: ManagedResourceStartOptions = {}
): Promise<T> {
  throwIfResourceStartAborted(options.signal)
  const resource = await create(options.signal)
  const managed = options.cleanup
    ? await options.cleanup.register(resource)
    : createIdempotentCloseable(resource)
  try {
    options.onRegistered?.(managed)
    throwIfResourceStartAborted(options.signal)
    await start(resource, options.signal)
    throwIfResourceStartAborted(options.signal)
    return resource
  } catch (startError) {
    try {
      await managed.close()
    } catch (closeError) {
      throw new AggregateError(
        [startError, closeError],
        'locale-governance acceptance startup and immediate close both failed',
        { cause: startError }
      )
    }
    throw startError
  }
}

/** throwIfResourceStartAborted prevents acquisition or startup from crossing a requested termination. */
function throwIfResourceStartAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw new Error('locale-governance acceptance termination requested during resource startup')
  }
}

/** startWithBoundedRetries retries only explicitly classified transient startup failures. */
export async function startWithBoundedRetries<T>(
  start: () => Promise<T>,
  shouldRetry: (error: unknown) => boolean,
  maxAttempts = 3
): Promise<T> {
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 8) {
    throw new Error('acceptance startup attempts must be an integer from 1 through 8')
  }

  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await start()
    } catch (error) {
      lastError = error
      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error
      }
    }
  }
  throw lastError
}

/** resolveAcceptanceDatabaseConfig accepts only an explicitly confirmed disposable PostgreSQL target. */
export function resolveAcceptanceDatabaseConfig(
  environment: NodeJS.ProcessEnv = process.env
): AcceptanceDatabaseConfig {
  const rawUrl = environment[ACCEPTANCE_DATABASE_URL_ENV]?.trim()
  if (!rawUrl) {
    throw new Error(
      `${ACCEPTANCE_DATABASE_URL_ENV} is required; DATABASE_URL is intentionally ignored`
    )
  }
  if (environment[ACCEPTANCE_DATABASE_CONFIRM_ENV] !== ACCEPTANCE_DATABASE_CONFIRM_VALUE) {
    throw new Error(
      `${ACCEPTANCE_DATABASE_CONFIRM_ENV} must equal ${ACCEPTANCE_DATABASE_CONFIRM_VALUE}`
    )
  }

  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new Error(`${ACCEPTANCE_DATABASE_URL_ENV} must be a valid PostgreSQL URL`)
  }
  if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
    throw new Error(`${ACCEPTANCE_DATABASE_URL_ENV} must use postgresql:// or postgres://`)
  }
  if (!parsed.hostname || !parsed.pathname.replace(/^\/+/, '')) {
    throw new Error(`${ACCEPTANCE_DATABASE_URL_ENV} must include a host and database name`)
  }
  if (isProductionLikeHostname(parsed.hostname)) {
    throw new Error('Acceptance database must not use a production-like hostname')
  }

  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''))
  const schemaName = parsed.searchParams.get('schema') ?? ''
  if (!hasDisposableMarker(databaseName) && !hasDisposableMarker(schemaName)) {
    throw new Error(
      'Acceptance database name or schema must contain acceptance, disposable, or test'
    )
  }

  const port = parsed.port || '5432'
  const schema = schemaName ? `?schema=${encodeURIComponent(schemaName)}` : ''
  return {
    url: rawUrl,
    safeTarget: `${parsed.hostname}:${port}/${databaseName}${schema}`
  }
}

/** createAcceptanceNamespace creates one collision-resistant identity namespace for a harness run. */
export function createAcceptanceNamespace(
  now: () => number = Date.now,
  randomBytes: (size: number) => Buffer = nodeRandomBytes
): AcceptanceNamespace {
  const runId = `locale_gov_a_${now()}_${randomBytes(6).toString('hex')}`
  return {
    runId,
    tenantId: `${runId}_tenant`,
    orgId: `${runId}_org`,
    operatorId: `${runId}_operator`,
    traceId: `${runId}_trace`
  }
}

/** reserveIsolatedLoopbackPorts allocates distinct ephemeral ports for acceptance-only servers. */
export async function reserveIsolatedLoopbackPorts(
  count: number,
  reserveOne: () => Promise<number> = reserveOneLoopbackPort,
  maxAttempts: number = Math.max(16, count * 8)
): Promise<number[]> {
  if (!Number.isSafeInteger(count) || count < 1 || count > 16) {
    throw new Error('acceptance port count must be an integer from 1 through 16')
  }
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < count || maxAttempts > 256) {
    throw new Error('acceptance port attempts must cover the requested count and not exceed 256')
  }

  const ports = new Set<number>()
  for (let attempt = 0; attempt < maxAttempts && ports.size < count; attempt += 1) {
    ports.add(await reserveOne())
  }
  if (ports.size === count) {
    return [...ports]
  }
  throw new Error(
    `Could not reserve ${count} distinct loopback ports after ${maxAttempts} attempts`
  )
}

/** redactSensitiveValue returns a stable marker instead of credential or secret material. */
export function redactSensitiveValue(value: string): string {
  return value ? '[REDACTED]' : '[EMPTY]'
}

/** sanitizeAcceptanceFailure converts arbitrary nested errors into a terminal-safe whitelist payload. */
export function sanitizeAcceptanceFailure(error: unknown): SanitizedAcceptanceFailure {
  if (error instanceof AcceptanceSafeFailure) {
    return {
      code: error.code,
      message: ACCEPTANCE_SAFE_FAILURE_MESSAGES[error.code],
      ...(isSafeAcceptanceTarget(error.safeTarget) ? { safeTarget: error.safeTarget } : {})
    }
  }
  return {
    code: 'LOCALE_GOVERNANCE_ACCEPTANCE_FAILED',
    message: 'Locale-governance Phase A acceptance failed'
  }
}

/** reportAcceptanceFailure emits exactly one JSON whitelist payload to the injected terminal sink. */
export function reportAcceptanceFailure(
  error: unknown,
  sink: (line: string) => void = console.error
): void {
  sink(JSON.stringify(sanitizeAcceptanceFailure(error)))
}

/** runCleanupSteps attempts every named cleanup action and aggregates only stable step codes. */
export async function runCleanupSteps(steps: readonly CleanupStep[]): Promise<void> {
  const failures: Error[] = []
  for (const step of steps) {
    try {
      await step.run()
    } catch (error) {
      failures.push(
        new Error(`Acceptance cleanup step failed: ${step.code}`, {
          cause: error
        })
      )
    }
  }
  if (failures.length > 0) {
    throw new AggregateError(failures, 'locale-governance acceptance cleanup steps failed')
  }
}

/** createCleanupCoordinator owns dynamically registered resources and performs one reverse-order cleanup. */
export function createCleanupCoordinator(cleanupData: () => Promise<void>): CleanupCoordinator {
  const resources: AsyncCloseable[] = []
  let cleanupStarted = false
  let cleanupPromise: Promise<void> | undefined

  return {
    async register(resource: AsyncCloseable): Promise<AsyncCloseable> {
      const managed = createIdempotentCloseable(resource)
      if (cleanupStarted) {
        await managed.close()
        throw new Error('locale-governance acceptance cleanup has already started')
      }
      resources.push(managed)
      return managed
    },
    cleanup(): Promise<void> {
      cleanupStarted = true
      cleanupPromise ??= performDeterministicCleanup(resources, cleanupData)
      return cleanupPromise
    }
  }
}

/** createTerminationController coordinates abort, bounded active-work drain, cleanup, and second-signal escalation. */
export function createTerminationController(
  options: TerminationControllerOptions
): AcceptanceTerminationController {
  if (
    !Number.isSafeInteger(options.activePhaseTimeoutMs) ||
    options.activePhaseTimeoutMs < 1 ||
    options.activePhaseTimeoutMs > 60_000
  ) {
    throw new Error('acceptance active phase timeout must be an integer from 1 through 60000')
  }

  const abortController = new AbortController()
  const waitForActivePhase = options.waitForActivePhase ?? waitForPromiseWithTimeout
  let activePhase: Promise<void> | undefined
  let firstSignal: AcceptanceTerminationSignal | undefined
  let forceExitRequested = false
  let terminationPromise: Promise<void> | undefined
  let cleanupFailureReported = false

  /** handleSignal aborts once, drains active work within bounds, and escalates the next signal. */
  async function handleSignal(signal: AcceptanceTerminationSignal): Promise<void> {
    const exitCode = terminationExitCode(signal)
    if (firstSignal) {
      if (!forceExitRequested) {
        forceExitRequested = true
        options.onForceExit(signal, exitCode)
      }
      return
    }

    firstSignal = signal
    abortController.abort()
    options.onExitIntent(signal, exitCode)
    const phaseAtSignal = activePhase
    terminationPromise = (async () => {
      const terminationErrors: unknown[] = []
      if (phaseAtSignal) {
        try {
          await waitForActivePhase(phaseAtSignal, options.activePhaseTimeoutMs)
        } catch (error) {
          terminationErrors.push(error)
        }
      }
      try {
        await options.cleanup.cleanup()
      } catch (error) {
        terminationErrors.push(error)
      }
      if (terminationErrors.length > 0) {
        throw new AggregateError(
          terminationErrors,
          'locale-governance acceptance termination failed'
        )
      }
    })()

    try {
      await terminationPromise
    } catch (error) {
      if (!cleanupFailureReported) {
        cleanupFailureReported = true
        options.reportFailure(
          new Error('Locale-governance acceptance termination cleanup failed', {
            cause: error
          })
        )
      }
    }
  }

  return {
    signal: abortController.signal,
    async runPhase<T>(phaseName: string, work: (signal: AbortSignal) => Promise<T>): Promise<T> {
      if (activePhase) {
        throw new Error(`locale-governance acceptance phase already active: ${phaseName}`)
      }
      if (abortController.signal.aborted) {
        throw new Error('locale-governance acceptance termination requested')
      }

      const workPromise = Promise.resolve().then(() => work(abortController.signal))
      const settled = workPromise.then(
        () => undefined,
        () => undefined
      )
      activePhase = settled
      try {
        return await workPromise
      } finally {
        if (activePhase === settled) {
          activePhase = undefined
        }
      }
    },
    throwIfTerminating(): void {
      if (abortController.signal.aborted) {
        throw new Error('locale-governance acceptance termination requested')
      }
    },
    installSignalHandlers(signalSource: TerminationSignalSource): () => void {
      const handlers: Record<AcceptanceTerminationSignal, () => Promise<void>> = {
        SIGINT: () => handleSignal('SIGINT'),
        SIGTERM: () => handleSignal('SIGTERM')
      }
      signalSource.on('SIGINT', handlers.SIGINT)
      signalSource.on('SIGTERM', handlers.SIGTERM)

      /** removeTerminationSignalListeners prevents duplicate handlers across repeated acceptance runs. */
      return function removeTerminationSignalListeners(): void {
        signalSource.off('SIGINT', handlers.SIGINT)
        signalSource.off('SIGTERM', handlers.SIGTERM)
      }
    }
  }
}

/** runAcceptanceLifecycle owns signal installation, connection races, one cleanup, and temporary Runtime state. */
export async function runAcceptanceLifecycle<TPrisma extends AcceptanceLifecyclePrisma, TResult>(
  dependencies: AcceptanceLifecycleDependencies<TPrisma, TResult>
): Promise<AcceptanceLifecycleResult<TResult>> {
  let databaseConnected = false
  let runtimeDirectory: string | undefined
  let terminationSignal: AcceptanceTerminationSignal | undefined
  const cleanup = createCleanupCoordinator(() =>
    runCleanupSteps([
      {
        code: 'CLEANUP_ACCEPTANCE_NAMESPACE',
        /** run cleans namespace rows only after a completed database connection. */
        run: async () => {
          if (databaseConnected) {
            await dependencies.cleanupNamespace(dependencies.prisma, dependencies.namespace)
          }
        }
      },
      {
        code: 'DISCONNECT_PRISMA',
        /** run always attempts Prisma disconnect after namespace cleanup. */
        run: async () => {
          databaseConnected = false
          await dependencies.prisma.$disconnect()
        }
      },
      {
        code: 'DELETE_RUNTIME_DIRECTORY',
        /** run removes only the directory created by this lifecycle attempt. */
        run: async () => {
          if (runtimeDirectory) {
            await dependencies.removeRuntimeDirectory(runtimeDirectory)
          }
        }
      }
    ])
  )
  const termination = createTerminationController({
    cleanup,
    activePhaseTimeoutMs: dependencies.activePhaseTimeoutMs,
    onExitIntent: (signal, exitCode) => {
      terminationSignal = signal
      dependencies.onExitIntent(signal, exitCode)
    },
    onForceExit: dependencies.onForceExit,
    reportFailure: dependencies.reportFailure
  })
  const removeSignalListeners = termination.installSignalHandlers(dependencies.signalSource)

  try {
    const result = await runWithDeterministicCleanup(
      () =>
        termination.runPhase('phase-a', async () => {
          await dependencies.connectDatabase(
            dependencies.prisma,
            dependencies.database,
            termination.signal
          )
          if (termination.signal.aborted) {
            await dependencies.prisma.$disconnect()
            termination.throwIfTerminating()
          }
          databaseConnected = true
          termination.throwIfTerminating()
          runtimeDirectory = await dependencies.createRuntimeDirectory()
          termination.throwIfTerminating()
          return dependencies.executePhase({
            prisma: dependencies.prisma,
            runtimeDirectory,
            cleanup,
            termination
          })
        }),
      cleanup
    )
    return { result, terminationSignal }
  } finally {
    removeSignalListeners()
  }
}

/** runWithDeterministicCleanup always invokes the shared coordinator and preserves work failures. */
export async function runWithDeterministicCleanup<T>(
  work: () => Promise<T>,
  cleanup: CleanupCoordinator
): Promise<T> {
  let result: T | undefined
  let workError: unknown
  let cleanupError: unknown

  try {
    result = await work()
  } catch (error) {
    workError = error
  }

  try {
    await cleanup.cleanup()
  } catch (error) {
    cleanupError = error
  }

  if (workError !== undefined && cleanupError === undefined) {
    throw workError
  }
  if (workError !== undefined) {
    throw new AggregateError(
      [workError, cleanupError],
      'locale-governance acceptance failed and cleanup also reported errors',
      { cause: workError }
    )
  }
  if (cleanupError !== undefined) {
    throw cleanupError
  }
  return result as T
}

/** performDeterministicCleanup closes resources in reverse order before deleting owned data. */
async function performDeterministicCleanup(
  resources: readonly AsyncCloseable[],
  cleanupData: () => Promise<void>
): Promise<void> {
  const cleanupErrors: unknown[] = []
  for (const resource of [...resources].reverse()) {
    try {
      await resource.close()
    } catch (error) {
      cleanupErrors.push(error)
    }
  }
  try {
    await cleanupData()
  } catch (error) {
    cleanupErrors.push(error)
  }
  if (cleanupErrors.length > 0) {
    throw new AggregateError(cleanupErrors, 'locale-governance acceptance cleanup failed')
  }
}

/** createIdempotentCloseable guarantees local finally blocks and signal cleanup cannot close twice. */
function createIdempotentCloseable(resource: AsyncCloseable): AsyncCloseable {
  let closePromise: Promise<void> | undefined
  return {
    close(): Promise<void> {
      closePromise ??= Promise.resolve().then(async () => {
        await resource.close()
      })
      return closePromise
    }
  }
}

/** waitForPromiseWithTimeout drains active work until settlement or a bounded timer expires. */
function waitForPromiseWithTimeout(activePhase: Promise<void>, timeoutMs: number): Promise<void> {
  return new Promise((resolveWait) => {
    let settled = false
    const finish = (): void => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolveWait()
    }
    const timer = setTimeout(finish, timeoutMs)
    void activePhase.then(finish, finish)
  })
}

/** terminationExitCode maps POSIX termination signals to their conventional process codes. */
function terminationExitCode(signal: AcceptanceTerminationSignal): number {
  return signal === 'SIGINT' ? 130 : 143
}

/** isSafeAcceptanceTarget permits only credential-free host:port/database diagnostics with an optional schema. */
function isSafeAcceptanceTarget(value: string | undefined): value is string {
  if (!value || value.includes('://') || value.includes('@') || /\s/.test(value)) {
    return false
  }
  try {
    const parsed = new URL(`acceptance://${value}`)
    const databaseName = parsed.pathname.replace(/^\/+/, '')
    const searchKeys = [...parsed.searchParams.keys()]
    return (
      parsed.protocol === 'acceptance:' &&
      !parsed.username &&
      !parsed.password &&
      Boolean(parsed.hostname) &&
      /^\d{1,5}$/.test(parsed.port) &&
      Boolean(databaseName) &&
      !databaseName.includes('/') &&
      !parsed.hash &&
      searchKeys.every((key) => key === 'schema') &&
      searchKeys.length <= 1
    )
  } catch {
    return false
  }
}

/** hasDisposableMarker recognizes explicit disposable database or schema naming. */
function hasDisposableMarker(value: string): boolean {
  return /(^|[_-])(acceptance|disposable|test)([_-]|$)/i.test(value)
}

/** isProductionLikeHostname rejects common production labels including numbered prod and prd aliases. */
function isProductionLikeHostname(hostname: string): boolean {
  return /(^|[-._])(prod(?:uction)?|prd)[0-9]*(?=$|[-._])/i.test(hostname)
}

/** reserveOneLoopbackPort asks the kernel for one currently unused loopback TCP port. */
function reserveOneLoopbackPort(): Promise<number> {
  return new Promise((resolvePort, rejectPort) => {
    const server = createServer()
    server.unref()
    server.once('error', rejectPort)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        server.close()
        rejectPort(new Error('kernel did not return an isolated loopback port'))
        return
      }
      server.close((error) => {
        if (error) {
          rejectPort(error)
          return
        }
        resolvePort(address.port)
      })
    })
  })
}
