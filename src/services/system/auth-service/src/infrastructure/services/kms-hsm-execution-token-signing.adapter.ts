import { ExecutionTokenSigningKey, ExecutionTokenSigningPort } from '../../domain/ports/execution-token-signing.port'

/** Represents the deployment-provided KMS/HSM API that alone may hold Auth's private P-256 signing keys. */
export interface KmsHsmExecutionTokenClient {
  activeSigningKey(): Promise<ExecutionTokenSigningKey>
  publishedSigningKeys(): Promise<readonly ExecutionTokenSigningKey[]>
  signEs256(kid: string, input: Uint8Array): Promise<Uint8Array>
}

/** Adapts a protected KMS/HSM client to Auth's domain port without importing, serializing, or caching private keys. */
export class KmsHsmExecutionTokenSigningAdapter implements ExecutionTokenSigningPort {
  constructor(private readonly client: KmsHsmExecutionTokenClient) {}

  /** Resolves the currently eligible protected key by opaque identifier only. */
  currentSigningKey(): Promise<ExecutionTokenSigningKey> {
    return this.client.activeSigningKey()
  }

  /** Returns public key lifecycle facts used by JWKS publication and safe rotation overlap. */
  publishedKeys(): Promise<readonly ExecutionTokenSigningKey[]> {
    return this.client.publishedSigningKeys()
  }

  /** Delegates ES256 signing to the protected key system while retaining no local private-key material. */
  sign(kid: string, input: Uint8Array): Promise<Uint8Array> {
    return this.client.signEs256(kid, input)
  }
}
