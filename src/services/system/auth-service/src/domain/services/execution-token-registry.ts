/** Defines the deployment-controlled audiences a verified workload may request from Auth STS. */
export interface WorkloadIssuancePolicy {
  readonly spiffeId: string
  readonly audiences: readonly string[]
  readonly humanObo?: Readonly<{
    selfAudience: string
    actorMachinePrincipalId: string
    actorBindingId: string
    actorBindingVersion: string
    targetAudiences: readonly string[]
  }>
}

export interface ExecutionTokenRegistryOptions {
  readonly issuer: string
  readonly workloadPolicies: readonly WorkloadIssuancePolicy[]
}

/** Enforces the immutable issuer, audience, and SPIFFE issuance policy that no exchange request may override. */
export class ExecutionTokenRegistry {
  readonly issuer: string
  private readonly audiencesByWorkload: ReadonlyMap<string, ReadonlySet<string>>
  private readonly humanOboByWorkload: ReadonlyMap<string, WorkloadIssuancePolicy['humanObo']>

  constructor(options: ExecutionTokenRegistryOptions) {
    this.issuer = validateIssuer(options.issuer)
    const policies = new Map<string, ReadonlySet<string>>()
    const humanObo = new Map<string, WorkloadIssuancePolicy['humanObo']>()
    const selfAudiences = new Set<string>()
    for (const policy of options.workloadPolicies) {
      if (!isCanonicalSpiffeId(policy.spiffeId) || policies.has(policy.spiffeId)) {
        throw new Error('execution token workload policy is invalid')
      }
      const audiences = new Set(policy.audiences)
      if (
        audiences.size === 0 ||
        audiences.size !== policy.audiences.length ||
        [...audiences].some((audience) => !/^urn:oes:service:[a-z0-9][a-z0-9-]*$/.test(audience))
      ) {
        throw new Error('execution token audience policy is invalid')
      }
      policies.set(policy.spiffeId, audiences)
      if (policy.humanObo) {
        validateHumanObo(policy.humanObo, audiences, selfAudiences)
        humanObo.set(
          policy.spiffeId,
          Object.freeze({
            ...policy.humanObo,
            targetAudiences: Object.freeze([...policy.humanObo.targetAudiences])
          })
        )
        selfAudiences.add(policy.humanObo.selfAudience)
      }
    }
    if (policies.size === 0) {
      throw new Error('execution token registry requires at least one workload policy')
    }
    this.audiencesByWorkload = policies
    this.humanOboByWorkload = humanObo
  }

  /** Fails closed unless the exact verified SPIFFE ID is allowed to obtain the one requested service audience. */
  assertIssuanceAllowed(spiffeId: string, audience: string): void {
    if (!this.audiencesByWorkload.get(spiffeId)?.has(audience)) {
      throw new Error('execution token workload is not permitted for the target audience')
    }
  }

  /** Resolves the sole deployment-owned SYSTEM actor selector for a verified HUMAN OBO hop. */
  resolveHumanOboActor(spiffeId: string, selfAudience: string, targetAudience: string) {
    this.assertIssuanceAllowed(spiffeId, targetAudience)
    const policy = this.humanOboByWorkload.get(spiffeId)
    if (
      !policy ||
      policy.selfAudience !== selfAudience ||
      !policy.targetAudiences.includes(targetAudience)
    ) {
      throw new Error('execution token HUMAN OBO policy is not permitted')
    }
    return policy
  }
}

/** Validates the exact five-field deployment selector and its bounded target subset at startup. */
function validateHumanObo(
  policy: NonNullable<WorkloadIssuancePolicy['humanObo']>,
  audiences: ReadonlySet<string>,
  selfAudiences: ReadonlySet<string>
): void {
  const fields = [
    'actorBindingId',
    'actorBindingVersion',
    'actorMachinePrincipalId',
    'selfAudience',
    'targetAudiences'
  ]
  const exact = (value: string) =>
    typeof value === 'string' && value.length > 0 && value.trim() === value
  const targets = policy.targetAudiences
  if (
    Object.keys(policy).sort().join('|') !== fields.join('|') ||
    !/^urn:oes:service:[a-z0-9][a-z0-9-]*$/.test(policy.selfAudience) ||
    selfAudiences.has(policy.selfAudience) ||
    !exact(policy.actorMachinePrincipalId) ||
    !exact(policy.actorBindingId) ||
    !/^[1-9][0-9]*$/.test(policy.actorBindingVersion) ||
    !Array.isArray(targets) ||
    !targets.length ||
    new Set(targets).size !== targets.length ||
    targets.some((value) => !audiences.has(value) || value.includes('*'))
  ) {
    throw new Error('execution token HUMAN OBO policy is invalid')
  }
}

/** Accepts one exact deployment SPIFFE URI with no wildcard, credentials, query, or fragment. */
function isCanonicalSpiffeId(value: unknown): value is string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.trim() !== value ||
    value.includes('*')
  ) {
    return false
  }
  try {
    const parsed = new URL(value)
    return (
      parsed.protocol === 'spiffe:' &&
      Boolean(parsed.hostname) &&
      !parsed.username &&
      !parsed.password &&
      !parsed.search &&
      !parsed.hash
    )
  } catch {
    return false
  }
}

/** Validates the one exact HTTPS issuer configured by the environment rather than trusting token input. */
function validateIssuer(issuer: string): string {
  try {
    const parsed = new URL(issuer)
    if (
      parsed.protocol !== 'https:' ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash ||
      issuer.includes('*')
    ) {
      throw new Error('invalid issuer')
    }
    return issuer
  } catch {
    throw new Error('execution token issuer must be an exact HTTPS URL')
  }
}
