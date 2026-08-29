import {
  AsyncLocalTransportPrivateSourceCredentialAccessor,
  TransportPrivateSourceCredential
} from '@oes/common/authorization'

/** Defines the minimal terminal response lifecycle needed to clear a request-private credential. */
type GatewayCredentialResponseLifecycle = {
  once(event: 'finish' | 'close', listener: () => void): unknown
  removeListener(event: 'finish' | 'close', listener: () => void): unknown
}

/** Keeps one verifier-issued transport credential private to its owning HTTP request lifecycle. */
export class GatewayVerifiedSourceCredentialVault {
  private readonly entries = new WeakMap<object, GatewayVerifiedSourceCredentialEntry>()
  private readonly lifecycleCleanups = new WeakMap<object, () => void>()

  /** Admits a verified human-session handle only after the session owner has completed validation. */
  admitHumanSession(
    request: object,
    credential: TransportPrivateSourceCredential,
    response?: GatewayCredentialResponseLifecycle
  ): void {
    this.clear(request)
    this.entries.set(request, Object.freeze({ kind: 'HUMAN_SESSION', credential }))
    if (response === undefined) return

    const clear = () => {
      this.clear(request)
    }
    this.lifecycleCleanups.set(request, () => {
      response.removeListener('finish', clear)
      response.removeListener('close', clear)
      this.lifecycleCleanups.delete(request)
    })
    response.once('finish', clear)
    response.once('close', clear)
  }

  /** Returns and removes the current request entry so an interceptor owns the remaining scope lifetime. */
  consume(request: object): GatewayVerifiedSourceCredentialEntry | undefined {
    const entry = this.entries.get(request)
    this.clear(request)
    return entry
  }

  /** Runs an earlier guard-time operation with the admitted opaque credential without consuming handler scope. */
  run<T>(
    request: object,
    accessor: AsyncLocalTransportPrivateSourceCredentialAccessor,
    callback: () => T
  ): T {
    const entry = this.entries.get(request)
    if (entry === undefined) throw new Error('Verified source credential is required')
    return accessor.run(entry.credential, callback)
  }

  /** Removes an entry after a later guard denial or a terminal HTTP lifecycle event. */
  clear(request: object): void {
    this.entries.delete(request)
    this.lifecycleCleanups.get(request)?.()
  }
}

/** Describes only the opaque handle and verifier-specific kind held by the private vault. */
export type GatewayVerifiedSourceCredentialEntry = Readonly<{
  readonly kind: 'HUMAN_SESSION' | 'EXTERNAL_API'
  readonly credential: TransportPrivateSourceCredential
}>
