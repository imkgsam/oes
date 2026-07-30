/** Defines the deployment-controlled audiences a verified workload may request from Auth STS. */
export interface WorkloadIssuancePolicy {
  readonly spiffeId: string
  readonly audiences: readonly string[]
}

export interface ExecutionTokenRegistryOptions {
  readonly issuer: string
  readonly workloadPolicies: readonly WorkloadIssuancePolicy[]
}

/** Enforces the immutable issuer, audience, and SPIFFE issuance policy that no exchange request may override. */
export class ExecutionTokenRegistry {
  readonly issuer: string
  private readonly audiencesByWorkload: ReadonlyMap<string, ReadonlySet<string>>

  constructor(options: ExecutionTokenRegistryOptions) {
    this.issuer = validateIssuer(options.issuer)
    const policies = new Map<string, ReadonlySet<string>>()
    for (const policy of options.workloadPolicies) {
      if (!policy.spiffeId.startsWith('spiffe://') || policies.has(policy.spiffeId)) {
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
    }
    if (policies.size === 0) {
      throw new Error('execution token registry requires at least one workload policy')
    }
    this.audiencesByWorkload = policies
  }

  /** Fails closed unless the exact verified SPIFFE ID is allowed to obtain the one requested service audience. */
  assertIssuanceAllowed(spiffeId: string, audience: string): void {
    if (!this.audiencesByWorkload.get(spiffeId)?.has(audience)) {
      throw new Error('execution token workload is not permitted for the target audience')
    }
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
