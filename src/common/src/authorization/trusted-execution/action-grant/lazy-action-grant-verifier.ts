import { ExecutionTokenJwksCache, type ExecutionTokenJwks } from '../execution-token-jwks-cache'
import { TrustedExecutionRegistry } from '../trusted-execution-registry'
import { ActionGrantVerifier } from './action-grant-verifier'

type WorkloadPolicy = {
  readonly spiffeId: string
  readonly audiences: readonly string[]
}

/** Creates a lazy ActionGrant verifier sharing the exact configured DG-1 issuer, audience, workload and JWKS trust. */
export function createLazyActionGrantVerifier(
  targetAudience: string,
  environment: NodeJS.ProcessEnv = process.env
): ActionGrantVerifier {
  let verifier: ActionGrantVerifier | undefined
  const resolve = (): ActionGrantVerifier => {
    if (verifier) return verifier
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
    verifier = new ActionGrantVerifier({ registry, jwksCache })
    return verifier
  }
  return {
    verify: async (input) => resolve().verify(input)
  } as ActionGrantVerifier
}

/** Loads only the configured issuer's fixed JWKS endpoint and accepts no token-provided key source. */
async function loadIssuerJwks(issuer: string): Promise<ExecutionTokenJwks> {
  const response = await fetch(`${issuer.replace(/\/$/, '')}/.well-known/jwks.json`)
  if (!response.ok)
    throw new Error('Configured ActionGrant JWKS loader returned an invalid key set')
  const payload = (await response.json()) as { keys?: unknown }
  if (!Array.isArray(payload.keys))
    throw new Error('Configured ActionGrant JWKS loader returned an invalid key set')
  return Object.freeze({ keys: payload.keys })
}

/** Parses the immutable deployment workload registry without accepting request-derived policy. */
function parsePolicies(raw: string): readonly WorkloadPolicy[] {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) throw new Error('not an array')
    return parsed as readonly WorkloadPolicy[]
  } catch {
    throw new Error('AUTH_EXECUTION_WORKLOAD_POLICIES must be valid JSON')
  }
}

/** Reads one mandatory deployment trust value with no permissive local fallback. */
function requireValue(environment: NodeJS.ProcessEnv, name: string): string {
  const value = environment[name]?.trim()
  if (!value) throw new Error(`${name} is required`)
  return value
}
