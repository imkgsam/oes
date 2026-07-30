import type { JsonWebKey } from 'node:crypto'

/** Describes one KMS/HSM-owned ES256 public key and its immutable publication timeline. */
export interface ExecutionTokenSigningKey {
  readonly kid: string
  readonly publicJwk: JsonWebKey
  readonly publishNotBeforeUnixSeconds: number
  readonly signingNotBeforeUnixSeconds: number
  readonly retireAfterUnixSeconds: number
}

/** Defines Auth's exclusive boundary for protected signing material; callers never receive private key access. */
export interface ExecutionTokenSigningPort {
  currentSigningKey(): Promise<ExecutionTokenSigningKey>
  publishedKeys(): Promise<readonly ExecutionTokenSigningKey[]>
  sign(kid: string, input: Uint8Array): Promise<Uint8Array>
}
