/** Describes the deployment-owned trust values that Common may consume. */
export type TrustedExecutionRegistryOptions = {
  readonly issuer: string
  readonly audiences: readonly string[]
  readonly workloadIdentities: readonly string[]
}

/** Exposes a read-only copy of the configured trust registry. */
export type TrustedExecutionRegistrySnapshot = {
  readonly issuer: string
  readonly audiences: readonly string[]
  readonly workloadIdentities: readonly string[]
}

/** Holds the immutable issuer, audience, and workload allowlists supplied by deployment configuration. */
export class TrustedExecutionRegistry {
  readonly issuer: string
  private readonly audiences: ReadonlySet<string>
  private readonly workloadIdentities: ReadonlySet<string>
  private readonly registrySnapshot: TrustedExecutionRegistrySnapshot

  constructor(options: TrustedExecutionRegistryOptions) {
    this.issuer = validateIssuer(options.issuer)
    const audiences = normalizeUniqueValues(options.audiences, 'audience', (audience) =>
      /^urn:oes:service:[a-z0-9][a-z0-9-]*$/.test(audience)
    )
    const workloadIdentities = normalizeUniqueValues(
      options.workloadIdentities,
      'workload identity',
      (identity) => identity.startsWith('spiffe://')
    )

    this.audiences = new Set(audiences)
    this.workloadIdentities = new Set(workloadIdentities)
    this.registrySnapshot = Object.freeze({
      issuer: this.issuer,
      audiences: Object.freeze(audiences),
      workloadIdentities: Object.freeze(workloadIdentities)
    })
    Object.freeze(this)
  }

  /** Rejects any issuer other than the single deployment-configured value. */
  assertIssuer(issuer: string): void {
    if (issuer !== this.issuer) {
      throw new Error('ExecutionToken issuer does not match the registered issuer')
    }
  }

  /** Rejects caller-selected, wildcard, or otherwise unregistered audiences. */
  assertAudience(audience: string): void {
    if (!this.audiences.has(audience)) {
      throw new Error('ExecutionToken audience is not registered')
    }
  }

  /** Rejects any workload identity absent from the immutable deployment registry. */
  assertWorkloadIdentity(spiffeId: string): void {
    if (!this.workloadIdentities.has(spiffeId)) {
      throw new Error('Workload identity is not registered')
    }
  }

  /** Returns the already-frozen registry values without exposing mutable collections. */
  snapshot(): TrustedExecutionRegistrySnapshot {
    return this.registrySnapshot
  }
}

/** Validates the exact HTTPS issuer configured for one environment. */
function validateIssuer(issuer: string): string {
  if (typeof issuer !== 'string' || issuer.length === 0 || issuer.includes('*')) {
    throw new Error('Trusted execution issuer must be one exact HTTPS URL')
  }

  let parsed: URL
  try {
    parsed = new URL(issuer)
  } catch {
    throw new Error('Trusted execution issuer must be one exact HTTPS URL')
  }

  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.hash) {
    throw new Error('Trusted execution issuer must be one exact HTTPS URL')
  }

  return issuer
}

/** Normalizes a non-empty unique registry list while enforcing its deployment identifier shape. */
function normalizeUniqueValues(
  values: readonly string[],
  label: string,
  isValid: (value: string) => boolean
): string[] {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error(`Trusted execution ${label} registry must not be empty`)
  }

  const normalized = values.map((value) => {
    if (typeof value !== 'string' || value.trim() !== value || !isValid(value)) {
      throw new Error(`Trusted execution ${label} is invalid`)
    }
    return value
  })

  if (new Set(normalized).size !== normalized.length) {
    throw new Error(`Trusted execution ${label} registry contains duplicates`)
  }

  return normalized
}
