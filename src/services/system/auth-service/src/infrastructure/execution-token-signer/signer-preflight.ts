import { verify, createPublicKey, JsonWebKey } from 'node:crypto'

/** Validates the active protected signer key and bootstrap signature before Auth can expose STS routes. */
export function verifySignerBootstrap(jwk: JsonWebKey, signingInput: Uint8Array, signature: Uint8Array): void {
  if (jwk.kty !== 'EC' || jwk.crv !== 'P-256' || !jwk.x || !jwk.y || signature.length !== 64) throw new Error('signer preflight key is invalid')
  if (!verify('sha256', signingInput, { key: createPublicKey({ key: jwk, format: 'jwk' }), dsaEncoding: 'ieee-p1363' }, signature)) throw new Error('signer bootstrap verification failed')
}
