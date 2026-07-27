/** Defines the deployment-controlled issuer, target-audience, and workload allowlist facts. */
export interface TrustedExecutionRegistry {
  readonly issuer: string
  audienceForService(serviceName: string): string | undefined
  permitsWorkload(spiffeId: string): boolean
}

export interface StaticTrustedExecutionRegistryOptions {
  issuer: string
  audiences: Readonly<Record<string, string>>
  permittedSpiffeIds: readonly string[]
}

/** Provides an immutable adapter for registry facts supplied by deployment configuration. */
export class StaticTrustedExecutionRegistry implements TrustedExecutionRegistry {
  readonly issuer: string
  private readonly audiences: ReadonlyMap<string, string>
  private readonly permittedSpiffeIds: ReadonlySet<string>

  constructor(options: StaticTrustedExecutionRegistryOptions) {
    if (!options.issuer.startsWith('https://')) {
      throw new Error('trusted execution issuer must use HTTPS')
    }
    this.issuer = options.issuer
    this.audiences = new Map(Object.entries(options.audiences))
    this.permittedSpiffeIds = new Set(options.permittedSpiffeIds)
  }

  /** Resolves only a statically registered service audience. */
  audienceForService(serviceName: string): string | undefined {
    return this.audiences.get(serviceName)
  }

  /** Checks whether a transport-verified SPIFFE identity is registered for this runtime. */
  permitsWorkload(spiffeId: string): boolean {
    return this.permittedSpiffeIds.has(spiffeId)
  }
}
