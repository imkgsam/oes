import { AsyncLocalStorage } from 'node:async_hooks'
import {
  AsyncLocalTransportPrivateSourceCredentialAccessor,
  TransportPrivateSourceCredential,
  TransportPrivateSourceCredentialIssuer
} from './transport-private-source-credential'
import type { VerifiedExecutionToken } from './execution-token-verifier'

type Prepared = Readonly<{
  credential?: TransportPrivateSourceCredential
  token?: VerifiedExecutionToken
  correlation?: InboundExecutionCorrelation
}>
export type InboundExecutionCorrelation = Readonly<{
  requestId: string
  traceparent: string
  tracestate?: string
}>
type RequestState = { entry?: Prepared; active: boolean }
const prepared = new WeakMap<object, Prepared>()
const storage = new AsyncLocalStorage<RequestState>()

/** Keeps one guard-verified current-hop ExecutionToken bearer in request-private OBO scope. */
export class InboundExecutionTokenCredentialScope {
  readonly accessor = new AsyncLocalTransportPrivateSourceCredentialAccessor()
  private readonly issuer = new TransportPrivateSourceCredentialIssuer()

  /** Stages one successfully verified current-service HUMAN ET against the exact RPC data object. */
  prepare(
    data: object,
    bearer: string,
    token: VerifiedExecutionToken,
    correlation?: InboundExecutionCorrelation
  ): void {
    if (correlation !== undefined) assertCorrelation(correlation)
    const credential =
      token.principalType === 'HUMAN' && token.tenantId && token.sessionId
        ? this.issuer.issueVerifiedExecutionTokenSubjectCredential(bearer)
        : undefined
    prepared.set(
      data,
      Object.freeze({
        ...(credential === undefined ? {} : { credential }),
        token,
        ...(correlation === undefined ? {} : { correlation: Object.freeze({ ...correlation }) })
      })
    )
  }

  /** Stages exact public-admission correlation without creating any subject credential or ET. */
  preparePublicCorrelation(data: object, correlation: InboundExecutionCorrelation): void {
    assertCorrelation(correlation)
    prepared.set(data, Object.freeze({ correlation: Object.freeze({ ...correlation }) }))
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
    if (!entry.credential) {
      throw new Error('Transport-private HUMAN OBO subject credential is required')
    }
    return this.accessor.run(entry.credential, callback)
  }

  /** Temporarily upgrades an already verified public session source for its downstream STS hop only. */
  runVerifiedSessionSource<T>(bearer: string, callback: () => T): T {
    const current = requireEntry()
    if (!current.correlation || current.credential || current.token) {
      throw new Error('Verified public session source correlation is required')
    }
    const state: RequestState = {
      active: true,
      entry: Object.freeze({
        correlation: current.correlation,
        credential: this.issuer.issueVerifiedSessionAccessCredential(bearer)
      })
    }
    const result = storage.run(state, callback)
    if (isPromiseLike(result)) return result.finally(() => clear(state)) as T
    clear(state)
    return result
  }

  /** Returns only verified HUMAN execution facts; the retained bearer stays transport-private. */
  requireVerifiedExecution(): VerifiedExecutionToken {
    const token = requireEntry().token
    if (!token) throw new Error('Verified inbound ExecutionToken is required')
    return token
  }

  /** Returns guard-verified request and W3C trace facts without accepting application fallbacks. */
  requireCorrelation(): InboundExecutionCorrelation {
    const correlation = requireEntry().correlation
    if (!correlation) throw new Error('Verified inbound ExecutionToken correlation is required')
    return correlation
  }

  /** Invalidates retained facts for completion, error, cancellation, and leaked async descendants. */
  clearCurrent(): void {
    const state = storage.getStore()
    if (state) clear(state)
  }
}

export const inboundExecutionTokenCredentialScope = new InboundExecutionTokenCredentialScope()

/** Rejects missing or malformed transport correlation before it can enter a downstream token. */
function assertCorrelation(value: InboundExecutionCorrelation): void {
  if (
    !value.requestId ||
    value.requestId.trim() !== value.requestId ||
    !/^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/u.test(value.traceparent) ||
    (value.tracestate !== undefined &&
      (!value.tracestate || value.tracestate.trim() !== value.tracestate))
  ) {
    throw new Error('Verified inbound ExecutionToken correlation is invalid')
  }
}

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
