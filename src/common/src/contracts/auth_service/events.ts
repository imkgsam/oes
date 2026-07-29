import type { OesEventContract } from '../../events'

/** Identifies Auth as the sole owner of its public security-event descriptors. */
export const AUTH_SERVICE_EVENT_OWNER = 'auth-service' as const

/** Lists the exact selector dimensions that an emergency revocation may target. */
export type AuthExecutionTokenRevocationSelectorKind =
  | 'TOKEN_JTI'
  | 'PRINCIPAL'
  | 'SESSION'
  | 'CREDENTIAL'
  | 'MINIMUM_AUTHZ_VERSION'

/** Lists the sanitized incident categories permitted in the revocation fact. */
export type AuthExecutionTokenRevocationReasonCode =
  | 'TOKEN_COMPROMISE'
  | 'SESSION_COMPROMISE'
  | 'PRINCIPAL_COMPROMISE'
  | 'CREDENTIAL_COMPROMISE'
  | 'EMERGENCY_AUTHORIZATION_CHANGE'

/** Defines the frozen Auth-owned payload for one irreversible ExecutionToken revocation decision. */
export interface AuthExecutionTokenRevokedEventData {
  readonly selectorKind: AuthExecutionTokenRevocationSelectorKind
  readonly selectorRef: string
  readonly revocationVersion: number
  readonly effectiveAt: string
  readonly denyUntil: string
  readonly reasonCode: AuthExecutionTokenRevocationReasonCode
}

/** Describes the single security-critical fact that consumers use to deny affected ExecutionTokens. */
export const AUTH_EXECUTION_TOKEN_REVOKED_EVENT_CONTRACT: OesEventContract<AuthExecutionTokenRevokedEventData> = {
  eventType: 'auth.execution-token.revoked',
  eventVersion: 1,
  ownerService: AUTH_SERVICE_EVENT_OWNER,
  transportProfile: 'SECURITY_CRITICAL',
  validateData: isAuthExecutionTokenRevokedEventData,
}

/** Validates the exact frozen payload without accepting bearer material or version aliases. */
function isAuthExecutionTokenRevokedEventData(value: unknown): value is AuthExecutionTokenRevokedEventData {
  if (!isRecord(value) || !hasExactKeys(value, [
    'selectorKind',
    'selectorRef',
    'revocationVersion',
    'effectiveAt',
    'denyUntil',
    'reasonCode',
  ], [])) return false

  return SELECTOR_KINDS.has(value.selectorKind as AuthExecutionTokenRevocationSelectorKind)
    && isNonBlankString(value.selectorRef)
    && typeof value.revocationVersion === 'number'
    && Number.isSafeInteger(value.revocationVersion)
    && value.revocationVersion > 0
    && isUtcTimestamp(value.effectiveAt)
    && isUtcTimestamp(value.denyUntil)
    && Date.parse(value.denyUntil) >= Date.parse(value.effectiveAt)
    && REASON_CODES.has(value.reasonCode as AuthExecutionTokenRevocationReasonCode)
}

const SELECTOR_KINDS = new Set<AuthExecutionTokenRevocationSelectorKind>([
  'TOKEN_JTI',
  'PRINCIPAL',
  'SESSION',
  'CREDENTIAL',
  'MINIMUM_AUTHZ_VERSION',
])

const REASON_CODES = new Set<AuthExecutionTokenRevocationReasonCode>([
  'TOKEN_COMPROMISE',
  'SESSION_COMPROMISE',
  'PRINCIPAL_COMPROMISE',
  'CREDENTIAL_COMPROMISE',
  'EMERGENCY_AUTHORIZATION_CHANGE',
])

/** Ensures an event payload cannot smuggle uncontracted security-sensitive fields. */
function hasExactKeys(value: Record<string, unknown>, requiredKeys: readonly string[], optionalKeys: readonly string[]): boolean {
  const allowedKeys = new Set([...requiredKeys, ...optionalKeys])
  return requiredKeys.every((key) => Object.prototype.hasOwnProperty.call(value, key))
    && Object.keys(value).every((key) => allowedKeys.has(key))
}

/** Narrows decoded event data to a JSON object rather than a primitive or array. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Rejects blank identifier and correlation values. */
function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/** Validates canonical UTC timestamp fields before comparing their ordering. */
function isUtcTimestamp(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) && Number.isFinite(Date.parse(value))
}
