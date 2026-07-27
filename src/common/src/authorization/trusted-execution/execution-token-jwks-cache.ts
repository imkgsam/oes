import { createPublicKey, JsonWebKey, KeyObject } from 'node:crypto'

export interface ExecutionTokenJwk {
  kty: string
  alg: string
  crv: string
  use: string
  kid: string
  x: string
  y: string
}

export interface PublishedExecutionTokenJwks {
  issuer: string
  keys: readonly ExecutionTokenJwk[]
  maxAgeSeconds: number
}

export interface ExecutionTokenJwksProvider {
  fetch(): Promise<PublishedExecutionTokenJwks>
}

interface CachedJwks {
  expiresAtMs: number
  keysById: ReadonlyMap<string, KeyObject>
}

/** Caches issuer-pinned ES256 public keys and bounds unknown-kid refreshes to one retry per verification. */
export class ExecutionTokenJwksCache {
  private cached?: CachedJwks

  constructor(
    private readonly provider: ExecutionTokenJwksProvider,
    private readonly now: () => number = Date.now,
    private readonly maxAgeSeconds = 300
  ) {}

  /** Returns a trusted public key, performing one bounded refresh when its kid is unknown. */
  async getKey(kid: string, expectedIssuer: string): Promise<KeyObject | undefined> {
    await this.ensureCurrent(expectedIssuer)
    const cachedKey = this.cached?.keysById.get(kid)
    if (cachedKey) {
      return cachedKey
    }

    await this.refresh(expectedIssuer)
    return this.cached?.keysById.get(kid)
  }

  /** Reuses a still-valid issuer-bound JWKS snapshot instead of making Auth part of the RPC hot path. */
  private async ensureCurrent(expectedIssuer: string): Promise<void> {
    if (!this.cached || this.cached.expiresAtMs <= this.now()) {
      await this.refresh(expectedIssuer)
    }
  }

  /** Fetches and validates an entire JWKS document before atomically replacing the local snapshot. */
  private async refresh(expectedIssuer: string): Promise<void> {
    const document = await this.provider.fetch()
    if (document.issuer !== expectedIssuer) {
      throw new Error('untrusted JWKS issuer')
    }
    if (
      !Number.isInteger(document.maxAgeSeconds) ||
      document.maxAgeSeconds <= 0 ||
      document.maxAgeSeconds > this.maxAgeSeconds
    ) {
      throw new Error('invalid JWKS cache lifetime')
    }

    const keysById = new Map<string, KeyObject>()
    for (const jwk of document.keys) {
      if (keysById.has(jwk.kid)) {
        throw new Error('duplicate JWKS kid')
      }
      keysById.set(jwk.kid, this.toEs256PublicKey(jwk))
    }
    this.cached = {
      expiresAtMs: this.now() + document.maxAgeSeconds * 1_000,
      keysById
    }
  }

  /** Converts only fully constrained P-256 signing JWKs into Node verification keys. */
  private toEs256PublicKey(jwk: ExecutionTokenJwk): KeyObject {
    if (
      jwk.kty !== 'EC' ||
      jwk.alg !== 'ES256' ||
      jwk.crv !== 'P-256' ||
      jwk.use !== 'sig' ||
      !jwk.kid ||
      !isP256Coordinate(jwk.x) ||
      !isP256Coordinate(jwk.y)
    ) {
      throw new Error('untrusted JWKS key')
    }
    return createPublicKey({ key: jwk as unknown as JsonWebKey, format: 'jwk' })
  }
}

/** Confirms an unpadded base64url P-256 coordinate has the required 32-byte width. */
function isP256Coordinate(value: string): boolean {
  return /^[A-Za-z0-9_-]+$/.test(value) && Buffer.from(value, 'base64url').length === 32
}
