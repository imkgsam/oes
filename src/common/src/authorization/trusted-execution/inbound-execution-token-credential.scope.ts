import { AsyncLocalStorage } from 'node:async_hooks'
import {
  AsyncLocalTransportPrivateSourceCredentialAccessor,
  TransportPrivateSourceCredential,
  TransportPrivateSourceCredentialIssuer
} from './transport-private-source-credential'
import type { VerifiedExecutionToken } from './execution-token-verifier'

type Prepared = Readonly<{
  credential: TransportPrivateSourceCredential
  token: VerifiedExecutionToken
}>
type RequestState = { entry?: Prepared; active: boolean }
const prepared = new WeakMap<object, Prepared>()
const storage = new AsyncLocalStorage<RequestState>()

/** Keeps one guard-verified current-hop ExecutionToken bearer in request-private OBO scope. */
export class InboundExecutionTokenCredentialScope {
  readonly accessor = new AsyncLocalTransportPrivateSourceCredentialAccessor()
  private readonly issuer = new TransportPrivateSourceCredentialIssuer()

  /** Stages one successfully verified current-service HUMAN ET against the exact RPC data object. */
  prepare(data: object, bearer: string, token: VerifiedExecutionToken): void {
    if (token.principalType !== 'HUMAN' || !token.tenantId || !token.sessionId) {
      return
    }
    prepared.set(
      data,
      Object.freeze({
        credential: this.issuer.issueVerifiedExecutionTokenSubjectCredential(bearer),
        token
      })
    )
  }

  /** Consumes the staged credential exactly once and bounds its lifetime to the handler subscription. */
  runPrepared<T>(data: object, callback: () => T): T {
    const entry = prepared.get(data)
    prepared.delete(data)
    if (!entry) return callback()
    const state: RequestState = { entry, active: true }
    const result = storage.run(state, callback)
    if (isPromiseLike(result)) {
      return result.finally(() => clear(state)) as T
    }
    if (typeof result === 'function') {
      return (() => {
        try {
          return (result as () => unknown)()
        } finally {
          clear(state)
        }
      }) as T
    }
    clear(state)
    return result
  }

  /** Exposes the opaque handle only while one downstream STS transport operation executes. */
  async run<T>(callback: () => Promise<T>): Promise<T> {
    const entry = requireEntry()
    return this.accessor.run(entry.credential, callback)
  }

  /** Returns only verified HUMAN execution facts; the retained bearer stays transport-private. */
  requireVerifiedExecution(): VerifiedExecutionToken {
    return requireEntry().token
  }

  /** Invalidates retained facts for completion, error, cancellation, and leaked async descendants. */
  clearCurrent(): void {
    const state = storage.getStore()
    if (state) clear(state)
  }
}

export const inboundExecutionTokenCredentialScope = new InboundExecutionTokenCredentialScope()

/** Reads only an active request state so leaked async descendants fail after request cleanup. */
function requireEntry(): Prepared {
  const state = storage.getStore()
  if (!state?.active || !state.entry) {
    throw new Error('Transport-private HUMAN OBO subject credential is required')
  }
  return state.entry
}

/** Erases both the bearer reference and verified subject facts from one completed request state. */
function clear(state: RequestState): void {
  state.active = false
  state.entry = undefined
}

/** Detects asynchronous callbacks whose cleanup must run after their settled result. */
function isPromiseLike<T>(value: T): value is T & Promise<unknown> {
  return Boolean(value && typeof (value as { then?: unknown }).then === 'function')
}
