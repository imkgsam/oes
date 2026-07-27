// compareUtf8Unsigned orders contract strings by their unsigned UTF-8 byte sequences.
export function compareUtf8Unsigned(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, 'utf8'), Buffer.from(right, 'utf8'))
}

const UINT64_MAX = 18_446_744_073_709_551_615n

// requireCanonicalUint64Decimal validates generated uint64 strings without losing precision.
export function requireCanonicalUint64Decimal(input: unknown, label: string): string {
  if (typeof input !== 'string' || !/^(0|[1-9][0-9]*)$/.test(input)) {
    throw new Error(`Invalid ${label}: canonical unsigned 64-bit decimal string is required`)
  }
  if (BigInt(input) > UINT64_MAX) {
    throw new Error(`Invalid ${label}: canonical unsigned 64-bit decimal string is required`)
  }
  return input
}

// requirePlainRecord validates a JSON object boundary without accepting arrays or null.
export function requirePlainRecord(input: unknown, label: string): Record<string, unknown> {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error(`Invalid ${label}: object is required`)
  }
  return input as Record<string, unknown>
}

// requireNonNegativeSafeInteger validates remote versions and counts without numeric coercion.
export function requireNonNegativeSafeInteger(input: unknown, label: string): number {
  if (typeof input !== 'number' || !Number.isSafeInteger(input) || input < 0) {
    throw new Error(`Invalid ${label}: non-negative integer within the safe range is required`)
  }
  return input
}

// requireNativeBoolean validates one mandatory control-plane boolean without truthiness coercion.
export function requireNativeBoolean(input: unknown, label: string): boolean {
  if (typeof input !== 'boolean') {
    throw new Error(`Invalid ${label}: boolean is required`)
  }
  return input
}

// requireTrimmedString validates one non-empty string without silently rewriting contract data.
export function requireTrimmedString(input: unknown, label: string): string {
  if (typeof input !== 'string' || input.length === 0 || input !== input.trim()) {
    throw new Error(`Invalid ${label}: non-empty trimmed string is required`)
  }
  return input
}

// requireTimestamp validates one non-empty parseable timestamp at a remote contract boundary.
export function requireTimestamp(input: unknown, label: string): string {
  const timestamp = requireTrimmedString(input, label)
  if (!Number.isFinite(Date.parse(timestamp))) {
    throw new Error(`Invalid ${label}: timestamp is required`)
  }
  return timestamp
}

export interface SyncReportAcknowledgement extends Readonly<Record<string, unknown>> {
  readonly accepted: true
  readonly server_time: string
}

// normalizeSyncReportAcknowledgement strictly accepts only a positive sync report acknowledgement.
export function normalizeSyncReportAcknowledgement(input: unknown): SyncReportAcknowledgement {
  const response = requirePlainRecord(input, 'sync report response')
  const allowed = new Set(['accepted', 'server_time', 'serverTime'])
  if (Object.keys(response).some((key) => !allowed.has(key))) {
    throw new Error('Invalid sync report response: unknown field')
  }
  if (!Object.prototype.hasOwnProperty.call(response, 'accepted') || response.accepted !== true) {
    throw new Error('Invalid sync report response: accepted must be true')
  }
  const hasSnake = Object.prototype.hasOwnProperty.call(response, 'server_time')
  const hasCamel = Object.prototype.hasOwnProperty.call(response, 'serverTime')
  if ((hasSnake ? 1 : 0) + (hasCamel ? 1 : 0) !== 1) {
    throw new Error('Invalid sync report response: exactly one server_time field is required')
  }
  return Object.freeze({
    accepted: true,
    server_time: requireTimestamp(
      response[hasSnake ? 'server_time' : 'serverTime'],
      'sync report response server_time'
    )
  })
}
