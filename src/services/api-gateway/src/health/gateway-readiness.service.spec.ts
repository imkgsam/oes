import {
  GatewayReadinessService,
  loadGatewayReadinessOptions,
  type GatewayReadinessConnector,
  type GatewayReadinessOptions
} from './gateway-readiness.service'

/** Builds one explicit readiness configuration for focused behavior tests. */
function options(overrides: Partial<GatewayReadinessOptions> = {}): GatewayReadinessOptions {
  return {
    targets: [
      {
        name: 'auth-service',
        host: '127.0.0.1',
        port: 50050,
        expectedSpiffeId: 'spiffe://local.oes.internal/ns/oes/sa/auth-service'
      }
    ],
    timeoutMs: 50,
    configurationErrors: [],
    ...overrides
  }
}

describe('GatewayReadinessService', () => {
  it('reports ready only after every required dependency probe succeeds', async () => {
    const seen: string[] = []
    const connector: GatewayReadinessConnector = async (target) => {
      seen.push(target.name)
    }
    const service = new GatewayReadinessService(
      options({
        targets: [
          {
            name: 'auth-service',
            host: 'auth-service',
            port: 50050,
            expectedSpiffeId: 'spiffe://local.oes.internal/ns/oes/sa/auth-service'
          },
          {
            name: 'permission-service',
            host: 'permission-service',
            port: 50051,
            expectedSpiffeId: 'spiffe://local.oes.internal/ns/oes/sa/permission-service'
          }
        ]
      }),
      connector
    )

    const result = await service.check()

    expect(result.ready).toBe(true)
    expect(result.status).toBe('ready')
    expect(result.checks.configuration).toBe('up')
    expect(Object.values(result.checks.downstream).every((entry) => entry.status === 'up')).toBe(
      true
    )
    expect(seen.sort()).toEqual(['auth-service', 'permission-service'])
  })

  it('reports every unavailable dependency without retaining a stale ready result', async () => {
    let available = true
    const connector: GatewayReadinessConnector = async () => {
      if (!available) throw new Error('socket failure with private host detail')
    }
    const service = new GatewayReadinessService(options(), connector)

    expect((await service.check()).ready).toBe(true)
    available = false
    const failed = await service.check()

    expect(failed.ready).toBe(false)
    expect(failed.status).toBe('not_ready')
    expect(failed.checks.downstream['auth-service']).toEqual({
      status: 'down',
      reason: 'UNAVAILABLE'
    })
    expect(JSON.stringify(failed)).not.toContain('private host detail')
  })

  it('bounds a connector that never settles', async () => {
    const service = new GatewayReadinessService(
      options({ timeoutMs: 20 }),
      () => new Promise<void>(() => undefined)
    )

    const result = await service.check()

    expect(result.ready).toBe(false)
    expect(result.checks.downstream['auth-service']).toEqual({
      status: 'down',
      reason: 'TIMEOUT'
    })
  })

  it('fails closed for missing, duplicate, malformed, excessive, and unsafe target configuration', () => {
    expect(loadGatewayReadinessOptions({}).configurationErrors).toContain(
      'GATEWAY_READINESS_TARGETS_REQUIRED'
    )
    expect(
      loadGatewayReadinessOptions({
        OES_WORKLOAD_SPIFFE_ID: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway',
        GATEWAY_READINESS_TARGETS:
          'auth-service=grpcs://auth-service:50050,auth-service=grpcs://permission-service:50051',
        GATEWAY_READINESS_TIMEOUT_MS: '0'
      }).configurationErrors
    ).toEqual([
      'GATEWAY_READINESS_TIMEOUT_INVALID',
      'GATEWAY_READINESS_TARGET_DUPLICATE:auth-service'
    ])
    expect(
      loadGatewayReadinessOptions({
        OES_WORKLOAD_SPIFFE_ID: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway',
        GATEWAY_READINESS_TARGETS: 'auth-service=grpcs://user:password@auth-service:50050/path'
      }).configurationErrors
    ).toEqual(['GATEWAY_READINESS_TARGET_INVALID:auth-service'])
  })

  it('derives the exact expected target SPIFFE identity and rejects plaintext target schemes', () => {
    expect(
      loadGatewayReadinessOptions({
        OES_WORKLOAD_SPIFFE_ID: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway',
        GATEWAY_READINESS_TARGETS: 'auth-service=grpcs://127.0.0.1:50050'
      }).targets
    ).toEqual([
      {
        name: 'auth-service',
        host: '127.0.0.1',
        port: 50050,
        expectedSpiffeId: 'spiffe://local.oes.internal/ns/oes/sa/auth-service'
      }
    ])
    expect(
      loadGatewayReadinessOptions({
        OES_WORKLOAD_SPIFFE_ID: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway',
        GATEWAY_READINESS_TARGETS: 'auth-service=tcp://127.0.0.1:50050'
      }).configurationErrors
    ).toEqual(['GATEWAY_READINESS_TARGET_INVALID:auth-service'])
    expect(
      loadGatewayReadinessOptions({
        OES_WORKLOAD_SPIFFE_ID: 'spiffe://wrong.example/ns/oes/sa/not-gateway',
        GATEWAY_READINESS_TARGETS: 'auth-service=grpcs://127.0.0.1:50050'
      }).configurationErrors
    ).toContain('GATEWAY_READINESS_TRUST_IDENTITY_INVALID')
  })
})
