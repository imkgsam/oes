import { TransportPrivateSourceCredential } from '@oes/common/authorization'

/** Keeps one verifier-issued transport credential private to its owning HTTP request lifecycle. */
export class GatewayVerifiedSourceCredentialVault {
  private readonly entries = new WeakMap<object, GatewayVerifiedSourceCredentialEntry>()

  /** Admits a verified human-session handle only after the session owner has completed validation. */
  admitHumanSession(request: object, credential: TransportPrivateSourceCredential): void {
    this.entries.set(request, Object.freeze({ kind: 'HUMAN_SESSION', credential }))
  }

  /** Returns and removes the current request entry so an interceptor owns the remaining scope lifetime. */
  consume(request: object): GatewayVerifiedSourceCredentialEntry | undefined {
    const entry = this.entries.get(request)
    this.entries.delete(request)
    return entry
  }

  /** Removes an entry after a later guard denial or a terminal HTTP lifecycle event. */
  clear(request: object): void {
    this.entries.delete(request)
  }
}

/** Describes only the opaque handle and verifier-specific kind held by the private vault. */
export type GatewayVerifiedSourceCredentialEntry = Readonly<{
  readonly kind: 'HUMAN_SESSION' | 'EXTERNAL_API'
  readonly credential: TransportPrivateSourceCredential
}>
