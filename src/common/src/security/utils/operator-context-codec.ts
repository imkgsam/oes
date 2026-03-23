import { OperatorContextPayload, UnsignedOperatorContextPayload } from '../types'

const SIGNATURE_FIELD = 'signature'

function stableSortObject(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stableSortObject(item))
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  return Object.keys(value as Record<string, unknown>)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      const nestedValue = (value as Record<string, unknown>)[key]
      if (nestedValue !== undefined) {
        acc[key] = stableSortObject(nestedValue)
      }
      return acc
    }, {})
}

export function encodeOperatorContext(payload: OperatorContextPayload): string {
  return JSON.stringify(payload)
}

export function decodeOperatorContext(rawPayload: string): OperatorContextPayload {
  const parsed = JSON.parse(rawPayload) as OperatorContextPayload

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('operator context must be a JSON object')
  }

  return parsed
}

export function getUnsignedOperatorContextPayload(
  payload: OperatorContextPayload | UnsignedOperatorContextPayload
): UnsignedOperatorContextPayload {
  const { signature, ...unsignedPayload } = payload as OperatorContextPayload
  return unsignedPayload
}

export function canonicalizeOperatorContextForSigning(
  payload: OperatorContextPayload | UnsignedOperatorContextPayload
): string {
  const unsignedPayload = getUnsignedOperatorContextPayload(payload)
  return JSON.stringify(stableSortObject(unsignedPayload))
}

export function validateOperatorContextPayload(payload: OperatorContextPayload): string | undefined {
  const requiredFields: Array<keyof OperatorContextPayload> = [
    'operator_id',
    'operator_type',
    'issued_at',
    'expires_at',
    'issuer',
    'signature'
  ]

  for (const field of requiredFields) {
    const value = payload[field]
    if (typeof value !== 'string' || value.trim().length === 0) {
      return `missing required field: ${field}`
    }
  }

  if (payload.operator_roles && !Array.isArray(payload.operator_roles)) {
    return 'operator_roles must be an array'
  }

  if (payload.operator_permissions && !Array.isArray(payload.operator_permissions)) {
    return 'operator_permissions must be an array'
  }

  const issuedAt = Date.parse(payload.issued_at)
  const expiresAt = Date.parse(payload.expires_at)
  if (Number.isNaN(issuedAt) || Number.isNaN(expiresAt)) {
    return 'issued_at or expires_at is invalid'
  }

  if (expiresAt <= issuedAt) {
    return 'expires_at must be later than issued_at'
  }

  if (Date.now() >= expiresAt) {
    return 'operator context has expired'
  }

  return undefined
}
