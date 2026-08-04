import { AsyncLocalStorage } from 'node:async_hooks'
import { inspect } from 'node:util'

const REDACTED_SOURCE_CREDENTIAL = '[TransportPrivateSourceCredential]'
const sourceCredentialValues = new WeakMap<object, string>()

/** Represents one opaque source credential without exposing its bearer through object state. */
class TransportPrivateSourceCredentialHandle {
  /** Prevents accidental string interpolation from disclosing the opaque bearer. */
  toString(): string {
    return REDACTED_SOURCE_CREDENTIAL
  }

  /** Prevents JSON loggers and audit serializers from disclosing the opaque bearer. */
  toJSON(): string {
    return REDACTED_SOURCE_CREDENTIAL
  }

  /** Prevents Node inspection and structured logger previews from disclosing the opaque bearer. */
  [inspect.custom](): string {
    return REDACTED_SOURCE_CREDENTIAL
  }
}

/** Names the non-serializable handle issued only after an owner-specific verifier succeeds. */
export type TransportPrivateSourceCredential = Readonly<TransportPrivateSourceCredentialHandle>

/** Issues transport-private handles for explicit verified credential boundary kinds. */
export class TransportPrivateSourceCredentialIssuer {
  /** Wraps one Auth-verifiable active session/access credential after session verification. */
  issueVerifiedSessionAccessCredential(value: string): TransportPrivateSourceCredential {
    return issue(value)
  }

  /** Wraps one Auth-signed Gateway-only external credential after external-token verification. */
  issueVerifiedExternalAccessCredential(value: string): TransportPrivateSourceCredential {
    return issue(value)
  }

  /** Preserves the current signed ExecutionToken as an opaque multi-hop subject credential. */
  issueVerifiedExecutionTokenSubjectCredential(value: string): TransportPrivateSourceCredential {
    return issue(value)
  }

  /** Wraps one owner-verified MACHINE or DELEGATED credential/reference without interpreting it. */
  issueVerifiedMachineOrDelegationCredential(value: string): TransportPrivateSourceCredential {
    return issue(value)
  }
}

/** Keeps one opaque source credential in a separate request scope from TrustedExecutionContext. */
export class AsyncLocalTransportPrivateSourceCredentialAccessor {
  private readonly storage = new AsyncLocalStorage<TransportPrivateSourceCredential>()

  /** Runs one transport operation with an already-issued non-serializable credential handle. */
  run<T>(credential: TransportPrivateSourceCredential, callback: () => T): T {
    read(credential)
    return this.storage.run(credential, callback)
  }

  /** Exposes the raw value only to a dedicated transport consumer callback. */
  useCurrent<T>(consumer: (credential: string) => T): T {
    const credential = this.storage.getStore()
    if (credential === undefined) {
      throw new Error('Transport-private source credential is required')
    }
    return consumer(read(credential))
  }
}

/** Creates a frozen empty handle whose bearer exists only in the module-private WeakMap. */
function issue(value: string): TransportPrivateSourceCredential {
  validate(value)
  const handle = new TransportPrivateSourceCredentialHandle()
  sourceCredentialValues.set(handle, value)
  return Object.freeze(handle)
}

/** Reads only handles produced by this module's verified-boundary issuer. */
function read(handle: TransportPrivateSourceCredential): string {
  const value = sourceCredentialValues.get(handle)
  if (value === undefined) {
    throw new Error('Transport-private source credential is invalid')
  }
  return value
}

/** Rejects blank, whitespace-bearing, or already wrapped HTTP Authorization values. */
function validate(value: string): void {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.trim() !== value ||
    /\s/.test(value) ||
    /^Bearer\b/i.test(value)
  ) {
    throw new Error('Verified source credential is invalid')
  }
}
