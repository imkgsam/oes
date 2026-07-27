export const SITE_CAPABILITY_REGISTRATION_LIMITS = {
  manifestPages: 256,
  pageKeyLength: 128,
  pageLocales: 32,
  localeLength: 32,
  idempotencyKeyLength: 255,
  runtimeVersionLength: 128
} as const

const PAGE_KEY_PATTERN = /^[^\s]+$/u

export interface SitePageCapabilityDeclaration {
  pageKey: string
  supportedLocales: string[]
}

export type SiteCapabilityRegistrationErrorCode =
  | 'SITE_CAPABILITY_REGISTRATION_VALIDATION_FAILED'
  | 'SITE_CAPABILITY_IDEMPOTENCY_CONFLICT'
  | 'SITE_CAPABILITY_REGISTRATION_GENERATION_EXHAUSTED'

/** SiteCapabilityRegistrationError carries stable registration codes without depending on NestJS or gRPC. */
export class SiteCapabilityRegistrationError extends Error {
  /** constructor preserves one stable code and structured diagnostic details across architectural boundaries. */
  constructor(
    readonly code: SiteCapabilityRegistrationErrorCode,
    message: string,
    readonly details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'SiteCapabilityRegistrationError'
  }
}

/** validateSiteCapabilityManifest rejects malformed complete manifests without repairing their original values. */
export function validateSiteCapabilityManifest(input: unknown): SitePageCapabilityDeclaration[] {
  const declarations = denseArray(
    input,
    'capabilities',
    SITE_CAPABILITY_REGISTRATION_LIMITS.manifestPages
  )
  const pageKeys = new Set<string>()

  return declarations.map((value, index) => {
    const field = `capabilities[${index}]`
    const declaration = plainRecord(value, field)
    requireExactKeys(declaration, ['pageKey', 'supportedLocales'], field)
    const pageKey = exactString(
      declaration.pageKey,
      `${field}.pageKey`,
      SITE_CAPABILITY_REGISTRATION_LIMITS.pageKeyLength
    )
    if (!PAGE_KEY_PATTERN.test(pageKey)) {
      throw validationError(`${field}.pageKey does not match the Runtime pageKey pattern`, {
        field: `${field}.pageKey`
      })
    }
    if (pageKeys.has(pageKey)) {
      throw validationError(`duplicate pageKey: ${pageKey}`, { field: `${field}.pageKey` })
    }
    pageKeys.add(pageKey)

    const locales = denseArray(
      declaration.supportedLocales,
      `${field}.supportedLocales`,
      SITE_CAPABILITY_REGISTRATION_LIMITS.pageLocales,
      true
    )
    const canonicalLocales = new Set<string>()
    const supportedLocales = locales.map((locale, localeIndex) => {
      const localeField = `${field}.supportedLocales[${localeIndex}]`
      const original = exactString(
        locale,
        localeField,
        SITE_CAPABILITY_REGISTRATION_LIMITS.localeLength
      )
      let canonicalIdentity: string
      try {
        canonicalIdentity = Intl.getCanonicalLocales(original)[0]!
      } catch {
        throw validationError(`${localeField} must be a valid BCP 47 locale`, {
          field: localeField
        })
      }
      if (!canonicalIdentity || canonicalLocales.has(canonicalIdentity)) {
        throw validationError(`duplicate canonical locale for ${pageKey}: ${original}`, {
          field: localeField
        })
      }
      canonicalLocales.add(canonicalIdentity)
      return original
    })

    return { pageKey, supportedLocales }
  })
}

/** validateCapabilityRegistrationText preserves exact metadata strings while enforcing frozen bounds. */
export function validateCapabilityRegistrationText(
  input: unknown,
  field: 'idempotencyKey' | 'runtimeVersion',
  maximumLength: number
): string {
  return exactString(input, field, maximumLength)
}

/** validationError creates the stable invalid-registration error used by domain and application validation. */
function validationError(
  message: string,
  details?: Record<string, unknown>
): SiteCapabilityRegistrationError {
  return new SiteCapabilityRegistrationError(
    'SITE_CAPABILITY_REGISTRATION_VALIDATION_FAILED',
    message,
    details
  )
}

/** denseArray rejects missing, sparse, empty-when-required, or oversized arrays without filtering values. */
function denseArray(
  input: unknown,
  field: string,
  maximumLength: number,
  requireNonEmpty = false
): unknown[] {
  if (!Array.isArray(input) || (requireNonEmpty && input.length === 0)) {
    throw validationError(`${field} must be a${requireNonEmpty ? ' non-empty' : ''} array`, {
      field
    })
  }
  if (input.length > maximumLength) {
    throw validationError(`${field} exceeds maximum length ${maximumLength}`, { field })
  }
  for (let index = 0; index < input.length; index += 1) {
    if (!(index in input)) {
      throw validationError(`${field} must be a dense array`, { field: `${field}[${index}]` })
    }
  }
  return input
}

/** plainRecord accepts only plain object declarations so arrays and class instances cannot masquerade as pages. */
function plainRecord(input: unknown, field: string): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw validationError(`${field} must be a plain object`, { field })
  }
  const prototype = Object.getPrototypeOf(input)
  if (prototype !== Object.prototype && prototype !== null) {
    throw validationError(`${field} must be a plain object`, { field })
  }
  return input as Record<string, unknown>
}

/** requireExactKeys rejects unknown or missing declaration fields at the application boundary. */
function requireExactKeys(
  record: Record<string, unknown>,
  expected: readonly string[],
  field: string
): void {
  const expectedKeys = new Set(expected)
  const unknown = Object.keys(record).find((key) => !expectedKeys.has(key))
  const missing = expected.find((key) => !Object.prototype.hasOwnProperty.call(record, key))
  if (unknown || missing) {
    const invalid = unknown ?? missing!
    throw validationError(
      unknown ? `${field} contains unknown field ${invalid}` : `${field}.${invalid} is required`,
      { field: `${field}.${invalid}` }
    )
  }
}

/** exactString rejects coercion, trimming, emptiness, and over-limit registration values. */
function exactString(input: unknown, field: string, maximumLength: number): string {
  if (
    typeof input !== 'string' ||
    input.length === 0 ||
    input !== input.trim() ||
    input.length > maximumLength
  ) {
    throw validationError(
      `${field} must be a non-empty untrimmed string of at most ${maximumLength} characters`,
      { field }
    )
  }
  return input
}
