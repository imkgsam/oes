import { GrpcWorkloadIdentityProvider, GrpcJsVerifiedPeerAdapter } from '../../transport'
import { ExecutionTokenJwks, ExecutionTokenJwksCache } from './execution-token-jwks-cache'
import { ExecutionTokenVerifier } from './execution-token-verifier'
import { TrustedExecutionRegistry } from './trusted-execution-registry'

type WorkloadPolicy = {
  readonly spiffeId: string
  readonly audiences: readonly string[]
}

type TrustedExecutionRuntime = {
  readonly verifier: ExecutionTokenVerifier
  readonly workloadIdentityProvider: GrpcWorkloadIdentityProvider
}

/** Creates a lazy verifier/workload runtime so focused services can fail closed without forcing global startup migration. */
export function createLazyTrustedExecutionRuntime(
  targetAudience: string,
  environment: NodeJS.ProcessEnv = process.env
): TrustedExecutionRuntime {
  let runtime: TrustedExecutionRuntime | undefined

  const resolveRuntime = (): TrustedExecutionRuntime => {
    if (runtime) {
      return runtime
    }

    const issuer = requireValue(environment, 'AUTH_EXECUTION_ISSUER')
    const policies = parsePolicies(requireValue(environment, 'AUTH_EXECUTION_WORKLOAD_POLICIES'))
    const workloadIdentities = [
      ...new Set(
        policies
          .filter((policy) => policy.audiences.includes(targetAudience))
          .map((policy) => policy.spiffeId)
      )
    ]
    const registry = new TrustedExecutionRegistry({
      issuer,
      audiences: [targetAudience],
      workloadIdentities
    })
    const jwksCache = new ExecutionTokenJwksCache({
      load: () => loadIssuerJwks(issuer),
      maxAgeMs: 300_000
    })

    runtime = Object.freeze({
      verifier: new ExecutionTokenVerifier({ registry, jwksCache }),
      workloadIdentityProvider: new GrpcWorkloadIdentityProvider({
        registry,
        adapter: new GrpcJsVerifiedPeerAdapter()
      })
    })
    return runtime
  }

  return Object.freeze({
    verifier: {
      verify: (input) => resolveRuntime().verifier.verify(input)
    } as ExecutionTokenVerifier,
    workloadIdentityProvider: {
      getVerifiedWorkloadIdentity: (call) =>
        resolveRuntime().workloadIdentityProvider.getVerifiedWorkloadIdentity(call)
    } as GrpcWorkloadIdentityProvider
  })
}

async function loadIssuerJwks(issuer: string): Promise<ExecutionTokenJwks> {
  const response = await fetch(`${issuer.replace(/\/$/, '')}/.well-known/jwks.json`)
  if (!response.ok) {
    throw new Error('Configured ExecutionToken JWKS loader returned an invalid key set')
  }

  const payload = (await response.json()) as { keys?: unknown }
  if (!Array.isArray(payload.keys)) {
    throw new Error('Configured ExecutionToken JWKS loader returned an invalid key set')
  }

  return Object.freeze({ keys: payload.keys })
}

function parsePolicies(raw: string): readonly WorkloadPolicy[] {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      throw new Error('not an array')
    }

    return parsed as readonly WorkloadPolicy[]
  } catch {
    throw new Error('AUTH_EXECUTION_WORKLOAD_POLICIES must be valid JSON')
  }
}

function requireValue(environment: NodeJS.ProcessEnv, name: string): string {
  const value = environment[name]?.trim()
  if (!value) {
    throw new Error(`${name} is required`)
  }
  return value
}
