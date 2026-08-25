import { Inject, Injectable } from '@nestjs/common'
import { Client } from '@grpc/grpc-js'
import { createGrpcClientCredentials } from '@oes/common/transport'

/** Names one required downstream gRPC workload whose authenticated channel participates in readiness. */
export interface GatewayReadinessTarget {
  readonly name: string
  readonly host: string
  readonly port: number
  readonly expectedSpiffeId: string
}

/** Carries validated readiness configuration without making environment parsing a controller concern. */
export interface GatewayReadinessOptions {
  readonly targets: readonly GatewayReadinessTarget[]
  readonly timeoutMs: number
  readonly configurationErrors: readonly string[]
}

/** Opens one bounded gRPC channel and resolves only after its authenticated HTTP/2 transport is ready. */
export type GatewayReadinessConnector = (
  target: GatewayReadinessTarget,
  timeoutMs: number
) => Promise<void>

export const GATEWAY_READINESS_OPTIONS = Symbol('GATEWAY_READINESS_OPTIONS')
export const GATEWAY_READINESS_CONNECTOR = Symbol('GATEWAY_READINESS_CONNECTOR')

export type GatewayReadinessResult = Readonly<{
  ready: boolean
  status: 'ready' | 'not_ready'
  service: 'api-gateway'
  checks: {
    readonly app: 'up'
    readonly configuration: 'up' | 'down'
    readonly downstream: Readonly<
      Record<
        string,
        Readonly<{ status: 'up'; latencyMs: number } | { status: 'down'; reason: string }>
      >
    >
  }
  errors: readonly string[]
  timestamp: string
}>

/** Aggregates bounded authenticated gRPC probes and never reports ready for invalid configuration. */
@Injectable()
export class GatewayReadinessService {
  constructor(
    @Inject(GATEWAY_READINESS_OPTIONS) private readonly options: GatewayReadinessOptions,
    @Inject(GATEWAY_READINESS_CONNECTOR) private readonly connector: GatewayReadinessConnector
  ) {}

  /** Checks every configured required dependency independently so one failure cannot hide another. */
  async check(): Promise<GatewayReadinessResult> {
    const downstreamEntries = await Promise.all(
      this.options.targets.map(async (target) => {
        const startedAt = Date.now()
        try {
          await withTimeout(
            this.connector(target, this.options.timeoutMs),
            this.options.timeoutMs,
            'GATEWAY_READINESS_TIMEOUT'
          )
          return [
            target.name,
            { status: 'up' as const, latencyMs: Math.max(0, Date.now() - startedAt) }
          ] as const
        } catch (error) {
          return [target.name, { status: 'down' as const, reason: safeProbeReason(error) }] as const
        }
      })
    )
    const downstream = Object.fromEntries(downstreamEntries)
    const errors = [
      ...this.options.configurationErrors,
      ...downstreamEntries
        .filter(([, result]) => result.status === 'down')
        .map(([name, result]) => `${name}:${result.status === 'down' ? result.reason : 'UNKNOWN'}`)
    ]
    const ready = errors.length === 0 && this.options.targets.length > 0
    const result: GatewayReadinessResult = {
      ready,
      status: ready ? 'ready' : 'not_ready',
      service: 'api-gateway',
      checks: {
        app: 'up',
        configuration: this.options.configurationErrors.length === 0 ? 'up' : 'down',
        downstream
      },
      errors,
      timestamp: new Date().toISOString()
    }
    return Object.freeze(result)
  }
}

/** Parses the explicit required target list and retains compact error codes for a non-ready response. */
export function loadGatewayReadinessOptions(
  environment: NodeJS.ProcessEnv = process.env
): GatewayReadinessOptions {
  const configurationErrors: string[] = []
  const timeoutMs = parseTimeout(environment.GATEWAY_READINESS_TIMEOUT_MS, configurationErrors)
  const trustDomain = readinessTrustDomain(environment.OES_WORKLOAD_SPIFFE_ID, configurationErrors)
  const rawTargets = environment.GATEWAY_READINESS_TARGETS?.trim()
  const targets: GatewayReadinessTarget[] = []
  const names = new Set<string>()
  if (!rawTargets) {
    configurationErrors.push('GATEWAY_READINESS_TARGETS_REQUIRED')
  } else {
    const entries = rawTargets.split(',').map((value) => value.trim())
    if (entries.length > 64) configurationErrors.push('GATEWAY_READINESS_TARGET_LIMIT_EXCEEDED')
    for (const entry of entries.slice(0, 64)) {
      const parsed = parseTarget(entry, trustDomain)
      if (parsed.ok === false) {
        configurationErrors.push(parsed.error)
        continue
      }
      if (names.has(parsed.target.name)) {
        configurationErrors.push(`GATEWAY_READINESS_TARGET_DUPLICATE:${parsed.target.name}`)
        continue
      }
      names.add(parsed.target.name)
      targets.push(parsed.target)
    }
  }
  return Object.freeze({
    targets: Object.freeze(targets),
    timeoutMs,
    configurationErrors: Object.freeze(configurationErrors)
  })
}

/** Binds the readiness probe to this Gateway workload's task-owned mTLS credentials. */
export function createGatewayReadinessConnector(
  environment: NodeJS.ProcessEnv = process.env
): GatewayReadinessConnector {
  return (target, timeoutMs) => connectGatewayReadinessTarget(target, timeoutMs, environment)
}

/** Opens one mTLS-authenticated HTTP/2 gRPC channel and verifies the exact target workload identity. */
export async function connectGatewayReadinessTarget(
  target: GatewayReadinessTarget,
  timeoutMs: number,
  environment: NodeJS.ProcessEnv = process.env
): Promise<void> {
  const host = target.host.includes(':') ? `[${target.host}]` : target.host
  const client = new Client(
    `${host}:${target.port}`,
    createGrpcClientCredentials(environment, target.expectedSpiffeId),
    {
      'grpc.ssl_target_name_override': target.name,
      'grpc.default_authority': target.name
    }
  )
  try {
    await new Promise<void>((resolve, reject) => {
      client.waitForReady(Date.now() + timeoutMs, (error) => {
        if (error) reject(new Error('GATEWAY_READINESS_UNAVAILABLE'))
        else resolve()
      })
    })
  } finally {
    client.close()
  }
}

/** Parses one `workload=grpcs://host:port` target without accepting credentials or hidden URL parts. */
function parseTarget(
  value: string,
  trustDomain: string
):
  | { readonly ok: true; readonly target: GatewayReadinessTarget }
  | { readonly ok: false; readonly error: string } {
  const separator = value.indexOf('=')
  const name = separator > 0 ? value.slice(0, separator).trim() : ''
  const endpoint = separator > 0 ? value.slice(separator + 1).trim() : ''
  if (!/^[a-z][a-z0-9-]{0,62}$/.test(name)) {
    return { ok: false, error: 'GATEWAY_READINESS_TARGET_NAME_INVALID' }
  }
  try {
    const url = new URL(endpoint)
    const port = Number(url.port)
    if (
      url.protocol !== 'grpcs:' ||
      !url.hostname ||
      !Number.isSafeInteger(port) ||
      port < 1 ||
      port > 65_535 ||
      url.username ||
      url.password ||
      !['', '/'].includes(url.pathname) ||
      url.search ||
      url.hash
    ) {
      return { ok: false, error: `GATEWAY_READINESS_TARGET_INVALID:${name}` }
    }
    return {
      ok: true,
      target: Object.freeze({
        name,
        host: url.hostname,
        port,
        expectedSpiffeId: `${trustDomain}/ns/oes/sa/${name}`
      })
    }
  } catch {
    return { ok: false, error: `GATEWAY_READINESS_TARGET_INVALID:${name}` }
  }
}

/** Derives only the configured local/staging/production SPIFFE trust domain from Gateway's own identity. */
function readinessTrustDomain(value: string | undefined, errors: string[]): string {
  const match = value?.trim().match(/^(spiffe:\/\/[^/]+)\/ns\/oes\/sa\/api-gateway$/)
  if (match) return match[1]
  errors.push('GATEWAY_READINESS_TRUST_IDENTITY_INVALID')
  return 'spiffe://invalid.oes.internal'
}

/** Accepts a bounded timeout and records invalid overrides instead of silently repairing them. */
function parseTimeout(value: string | undefined, errors: string[]): number {
  if (value === undefined || value.trim() === '') return 1_000
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 50 || parsed > 10_000) {
    errors.push('GATEWAY_READINESS_TIMEOUT_INVALID')
    return 1_000
  }
  return parsed
}

/** Bounds an injected connector that ignores its timeout contract. */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, code: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(code)), timeoutMs)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })
}

/** Reduces transport failures to stable readiness codes without leaking host details. */
function safeProbeReason(error: unknown): string {
  return error instanceof Error && error.message === 'GATEWAY_READINESS_TIMEOUT'
    ? 'TIMEOUT'
    : 'UNAVAILABLE'
}
