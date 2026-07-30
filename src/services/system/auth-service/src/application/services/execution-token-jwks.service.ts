import { ExecutionTokenSigningKey, ExecutionTokenSigningPort } from '../../domain/ports/execution-token-signing.port'
import { ExecutionTokenRegistry } from '../../domain/services/execution-token-registry'

/** Publishes Auth's issuer-pinned metadata and ES256 public key set without exposing private signing material. */
export class ExecutionTokenJwksService {
  static readonly CACHE_MAX_AGE_SECONDS = 300

  constructor(private readonly registry: ExecutionTokenRegistry, private readonly signer: ExecutionTokenSigningPort) {}

  /** Returns the HTTPS metadata discovery values configured for this exact Auth issuer. */
  async metadata(): Promise<{ issuer: string; jwksUri: string; cacheMaxAgeSeconds: number }> {
    return Object.freeze({ issuer: this.registry.issuer, jwksUri: `${this.registry.issuer}/.well-known/jwks.json`, cacheMaxAgeSeconds: ExecutionTokenJwksService.CACHE_MAX_AGE_SECONDS })
  }

  /** Returns only published P-256 public keys with the rotation boundaries consumers need for safe cache behavior. */
  async jwks(): Promise<Record<string, unknown>> {
    const keys = await this.signer.publishedKeys()
    const seen = new Set<string>()
    const rotations = keys.map((key) => this.toRotation(key, seen))
    return Object.freeze({
      issuer: this.registry.issuer,
      keys: rotations.map(({ publicJwk, ...rotation }) => ({ kty: 'EC', alg: 'ES256', crv: 'P-256', use: 'sig', kid: rotation.kid, x: publicJwk.x, y: publicJwk.y })),
      maxAgeSeconds: ExecutionTokenJwksService.CACHE_MAX_AGE_SECONDS,
      unknownKidRefreshLimit: 1,
      rotations: rotations.map(({ publicJwk, ...rotation }) => rotation)
    })
  }

  /** Rejects malformed or prematurely signable keys so publication always precedes use by a full cache window. */
  private toRotation(key: ExecutionTokenSigningKey, seen: Set<string>): ExecutionTokenSigningKey {
    if (seen.has(key.kid) || !key.kid || key.publicJwk.kty !== 'EC' || key.publicJwk.crv !== 'P-256' || !key.publicJwk.x || !key.publicJwk.y || key.publishNotBeforeUnixSeconds + ExecutionTokenJwksService.CACHE_MAX_AGE_SECONDS > key.signingNotBeforeUnixSeconds || key.signingNotBeforeUnixSeconds >= key.retireAfterUnixSeconds) {
      throw new Error('execution token published key is invalid')
    }
    seen.add(key.kid)
    return key
  }
}
