import { BadRequestException } from '@nestjs/common'

// requireSingleQueryString accepts only one present string value from an HTTP query parameter.
export function requireSingleQueryString(value: unknown, name: string): string {
  if (typeof value !== 'string') {
    throw new BadRequestException(`${name} must be a single string`)
  }
  return value
}

// parseOptionalSingleQueryString accepts a missing query value or one string without altering its content.
export function parseOptionalSingleQueryString(
  value: unknown,
  name: string
): string | undefined {
  return value === undefined ? undefined : requireSingleQueryString(value, name)
}

// parseOptionalIntegerInRange converts one optional single-string query into an explicitly bounded safe integer.
export function parseOptionalIntegerInRange(
  value: unknown,
  name: string,
  minimum: number,
  maximum: number
): number | undefined {
  const text = parseOptionalSingleQueryString(value, name)
  if (text === undefined) {
    return undefined
  }
  if (!/^\d+$/.test(text)) {
    throw new BadRequestException(
      `${name} must be a safe integer from ${minimum} to ${maximum}`
    )
  }
  const parsed = Number(text)
  if (
    !Number.isSafeInteger(parsed) ||
    parsed < minimum ||
    parsed > maximum
  ) {
    throw new BadRequestException(
      `${name} must be a safe integer from ${minimum} to ${maximum}`
    )
  }
  return parsed
}
