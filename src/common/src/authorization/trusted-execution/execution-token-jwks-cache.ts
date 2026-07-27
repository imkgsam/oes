import { createPublicKey, JsonWebKey, KeyObject } from 'node:crypto'

/** Represents the only JWKS shape accepted from the configured issuer loader. */
export type ExecutionTokenJwks = {
  readonly keys: readonly JsonWebKey[]
}

/** Configures a bounded process-local cache without accepting a token-supplied key URL. */
export type ExecutionTokenJwksCacheOptions = {
  readonly load: () => Promise<ExecutionTokenJwks>
  readonly maxAgeMs: number
  readonly now?: () => number
}

/** Caches configured-issuer ES256 public keys and performs at most one unknown-kid refresh per lookup. */
export class ExecutionTokenJwksCache {
  private readonly load: () => Promise<ExecutionTokenJwks>
  private readonly maxAgeMs: number
  private readonly now: () => number
  private keys = new Map<string, KeyObject>()
  private observedKeyMaterial = new Map<string, string>()
  private unknownKidRefreshUsed = false
  private expiresAt = 0
  private refreshInFlight?: Promise<void>

  constructor(options: ExecutionTokenJwksCacheOptions) {
    if (!Number.isFinite(options.maxAgeMs) || options.maxAgeMs <= 0 || options.maxAgeMs > 300_000) {
      throw new Error('ExecutionToken JWKS cache maximum age must be between 1 and 300000 ms')
    }
    this.load = options.load
    this.maxAgeMs = options.maxAgeMs
    this.now = options.now ?? Date.now
  }

  /** Resolves one trusted key and fails closed after a single controlled refresh when its kid is unknown. */
  async getKey(kid: string): Promise<KeyObject> {
    if (typeof kid !== 'string' || kid.length === 0) {
      throw new Error('ExecutionToken kid must be a non-empty string')
    }

    let refreshed = false
    if (this.expiresAt === 0 || this.now() >= this.expiresAt) {
      await this.refresh()
      refreshed = true
    }

    let key = this.keys.get(kid)
    if (key === undefined && !refreshed && !this.unknownKidRefreshUsed) {
      await this.refresh()
      refreshed = true
      this.unknownKidRefreshUsed = true
      key = this.keys.get(kid)
    }

    if (key === undefined) {
      this.unknownKidRefreshUsed = true
      throw new Error('ExecutionToken kid is not present in the trusted JWKS')
    }
    return key
  }

  /** Atomically replaces cached keys with a validated configured-issuer JWKS. */
  private async refresh(): Promise<void> {
    if (this.refreshInFlight === undefined) {
      this.refreshInFlight = this.loadAndValidate().finally(() => {
        this.refreshInFlight = undefined
      })
    }
    await this.refreshInFlight
  }

  /** Validates the full JWKS before publishing any of its keys to concurrent verifiers. */
  private async loadAndValidate(): Promise<void> {
    const jwks = await this.load()
    if (jwks === null || !Array.isArray(jwks.keys)) {
      throw new Error('Configured ExecutionToken JWKS loader returned an invalid key set')
    }

    const nextKeys = new Map<string, KeyObject>()
    const nextObservedKeyMaterial = new Map(this.observedKeyMaterial)
    for (const jwk of jwks.keys) {
      const kid = jwk.kid
      if (
        typeof kid !== 'string' ||
        kid.length === 0 ||
        nextKeys.has(kid) ||
        jwk.kty !== 'EC' ||
        jwk.crv !== 'P-256' ||
        jwk.alg !== 'ES256' ||
        jwk.d !== undefined ||
        (jwk.use !== undefined && jwk.use !== 'sig')
      ) {
        throw new Error('Configured ExecutionToken JWKS contains an untrusted or duplicate key')
      }
      const keyMaterial = `${jwk.kty}|${jwk.crv}|${jwk.x}|${jwk.y}`
      const observedKeyMaterial = nextObservedKeyMaterial.get(kid)
      if (observedKeyMaterial !== undefined && observedKeyMaterial !== keyMaterial) {
        throw new Error('Configured ExecutionToken JWKS reused a kid for different key material')
      }
      nextObservedKeyMaterial.set(kid, keyMaterial)
      nextKeys.set(kid, createPublicKey({ key: jwk, format: 'jwk' }))
    }

    this.keys = nextKeys
    this.observedKeyMaterial = nextObservedKeyMaterial
    this.unknownKidRefreshUsed = false
    this.expiresAt = this.now() + this.maxAgeMs
  }
}
