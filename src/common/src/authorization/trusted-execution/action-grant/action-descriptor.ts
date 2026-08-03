import { createHash } from 'node:crypto'

export type ActionJsonPrimitive = null | boolean | number | string
export type ActionJsonValue =
  | ActionJsonPrimitive
  | readonly ActionJsonValue[]
  | { readonly [key: string]: ActionJsonValue }

export type ActionDescriptorV1 = {
  readonly descriptorVersion: 'v1'
  readonly operationKey: string
  readonly toolContract: {
    readonly id: string
    readonly version: string
  }
  readonly target: ActionJsonValue
  readonly input: ActionJsonValue
  readonly idempotencyKey: string
}

/** Computes the frozen RFC 8785 / SHA-256 / base64url binding for one complete ActionDescriptorV1. */
export function actionDescriptorDigest(descriptor: ActionDescriptorV1): string {
  validateDescriptor(descriptor)
  return actionValueDigest(descriptor)
}

/** Computes the same canonical digest for an owner-defined target or input value. */
export function actionValueDigest(value: ActionJsonValue): string {
  return createHash('sha256').update(canonicalizeActionJson(value), 'utf8').digest('base64url')
}

/** Serializes JSON-compatible values with recursively sorted UTF-16 object keys as required by JCS. */
export function canonicalizeActionJson(value: ActionJsonValue): string {
  if (value === null || typeof value === 'boolean') {
    return JSON.stringify(value)
  }
  if (typeof value === 'string') {
    assertWellFormedUnicode(value)
    return JSON.stringify(value)
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Action descriptor numbers must be finite')
    return JSON.stringify(Object.is(value, -0) ? 0 : value)
  }
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.prototype.hasOwnProperty.call(value, index)) {
        throw new Error('Action descriptor arrays must not be sparse')
      }
    }
    return `[${value.map((item) => canonicalizeActionJson(item)).join(',')}]`
  }
  if (typeof value !== 'object' || value === undefined) {
    throw new Error('Action descriptor values must be JSON-compatible')
  }
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error('Action descriptor values must be JSON-compatible plain objects')
  }
  const keys = Object.keys(value)
  keys.forEach(assertWellFormedUnicode)
  return `{${keys
    .sort()
    .map(
      (key) =>
        `${JSON.stringify(key)}:${canonicalizeActionJson((value as Record<string, ActionJsonValue>)[key])}`
    )
    .join(',')}}`
}

/** Rejects lone UTF-16 surrogates because RFC 8785 canonicalizes only valid Unicode strings. */
function assertWellFormedUnicode(value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1)
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        throw new Error('Action descriptor strings must contain valid Unicode')
      }
      index += 1
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      throw new Error('Action descriptor strings must contain valid Unicode')
    }
  }
}

/** Validates the fixed descriptor envelope before any digest is trusted as an authorization binding. */
function validateDescriptor(descriptor: ActionDescriptorV1): void {
  if (
    descriptor === null ||
    typeof descriptor !== 'object' ||
    descriptor.descriptorVersion !== 'v1' ||
    !isExactText(descriptor.operationKey) ||
    !isExactText(descriptor.toolContract?.id) ||
    !isExactText(descriptor.toolContract?.version) ||
    !isExactText(descriptor.idempotencyKey)
  ) {
    throw new Error('ActionDescriptorV1 contains an invalid stable reference')
  }
}

/** Accepts only non-blank, already-normalized stable descriptor strings. */
function isExactText(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.trim() === value
}
