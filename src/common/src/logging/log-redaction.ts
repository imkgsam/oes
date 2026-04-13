import { LogMeta } from './oes-logger.interface'

const REDACTED = '[REDACTED]'
const SECRET_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /authorization/i,
  /cookie/i,
  /session/i,
  /api[-_]?key/i,
  /refresh[-_]?token/i,
  /access[-_]?token/i
]
const EMAIL_KEY_PATTERNS = [/email/i]
const PHONE_KEY_PATTERNS = [/phone/i, /mobile/i, /tel/i]

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)
}

function shouldRedactKey(key: string): boolean {
  return SECRET_KEY_PATTERNS.some((pattern) => pattern.test(key))
}

function shouldMaskEmailKey(key: string): boolean {
  return EMAIL_KEY_PATTERNS.some((pattern) => pattern.test(key))
}

function shouldMaskPhoneKey(key: string): boolean {
  return PHONE_KEY_PATTERNS.some((pattern) => pattern.test(key))
}

function maskEmail(value: string): string {
  const atIndex = value.indexOf('@')
  if (atIndex <= 1) {
    return REDACTED
  }

  return `${value.slice(0, 1)}***${value.slice(atIndex)}`
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length < 7) {
    return REDACTED
  }

  return `${digits.slice(0, 3)}****${digits.slice(-4)}`
}

function sanitizeValue(key: string, value: unknown): unknown {
  if (shouldRedactKey(key)) {
    return REDACTED
  }

  if (typeof value === 'string') {
    if (shouldMaskEmailKey(key)) {
      return maskEmail(value)
    }

    if (shouldMaskPhoneKey(key)) {
      return maskPhone(value)
    }

    return value
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(key, item))
  }

  if (isPlainObject(value)) {
    return sanitizeObject(value)
  }

  return value
}

function sanitizeObject(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, sanitizeValue(key, item)])
  )
}

export function sanitizeLogMeta(meta?: LogMeta): Record<string, unknown> {
  if (!meta) {
    return {}
  }

  return sanitizeObject(meta as Record<string, unknown>)
}

export { REDACTED }
