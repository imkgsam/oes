import { ACCESS_DENIED, ExceptionFactory } from '../../core/exceptions'
import type { VerifiedExecutionToken, VerifiedWorkloadIdentity } from './execution-token-verifier'

const TENANT_SELECTOR_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const SELECTOR_FIELD_PATTERN = /^[A-Za-z_][A-Za-z0-9_]{0,63}$/
const PERMISSION_CODE_PATTERN = /^[a-z][a-z0-9]*(?:[._:-][a-z0-9]+)+$/

/** Declares an ordinary tenant-target method whose SYSTEM behavior is explicitly denied. */
export type TenantTargetMethodDeclaration = Readonly<{
  kind: 'TENANT_SYSTEM_DENY'
  selectorField: string
  tenantAuthority: 'TOKEN_TENANT_EQUALITY'
  systemAuthority: 'DENY'
}>

/** Declares a dedicated SYSTEM tenant-target method with its complete target-owned authority tuple. */
export type SystemTenantTargetMethodDeclaration = Readonly<{
  kind: 'SYSTEM_TARGET'
  selectorField: string
  tenantAuthority: 'TOKEN_TENANT_EQUALITY'
  systemAuthority: 'DEDICATED'
  gatewayWorkloadIdentity: string
  permissionCode: string
  range: 'ALL'
}>

/** Represents the only method declaration shapes accepted by tenant-selector admission. */
export type TenantTargetAdmissionDeclaration =
  | TenantTargetMethodDeclaration
  | SystemTenantTargetMethodDeclaration

/** Records the immutable target authorization facts passed to the target-owned audit binding. */
export type TenantTargetAdmissionDecision = Readonly<{
  selector: string
  selectorField: string
  subjectScope: 'TENANT' | 'SYSTEM'
  subject: string
  subjectTenantId?: string
  tokenId: string
  workloadIdentity: string
  declarationKind: TenantTargetAdmissionDeclaration['kind']
  permissionCode?: string
  range?: 'ALL'
}>

/** Supplies only verified execution evidence, business input, local declaration, and audit binding. */
export type TenantTargetAdmissionInput = Readonly<{
  verifiedExecutionToken: VerifiedExecutionToken
  verifiedWorkloadIdentity: VerifiedWorkloadIdentity
  declaration: TenantTargetAdmissionDeclaration
  selector: unknown
  bindAudit: (decision: TenantTargetAdmissionDecision) => boolean | Promise<boolean>
}>

/** Creates and freezes an ordinary TENANT declaration with an explicit SYSTEM deny. */
export function createTenantTargetMethodDeclaration(input: {
  readonly selectorField: string
}): TenantTargetMethodDeclaration {
  return Object.freeze({
    kind: 'TENANT_SYSTEM_DENY',
    selectorField: requireSelectorField(input?.selectorField),
    tenantAuthority: 'TOKEN_TENANT_EQUALITY',
    systemAuthority: 'DENY'
  })
}

/** Creates and freezes a dedicated SYSTEM declaration with exact Gateway, Code, and ALL bindings. */
export function createSystemTenantTargetMethodDeclaration(input: {
  readonly selectorField: string
  readonly gatewayWorkloadIdentity: string
  readonly permissionCode: string
}): SystemTenantTargetMethodDeclaration {
  return Object.freeze({
    kind: 'SYSTEM_TARGET',
    selectorField: requireSelectorField(input?.selectorField),
    tenantAuthority: 'TOKEN_TENANT_EQUALITY',
    systemAuthority: 'DEDICATED',
    gatewayWorkloadIdentity: requireWorkloadIdentity(input?.gatewayWorkloadIdentity),
    permissionCode: requirePermissionCode(input?.permissionCode),
    range: 'ALL'
  })
}

/** Parses an exact opaque selector without trimming, coercing, case-folding, or wildcard expansion. */
export function parseTenantTargetSelector(value: unknown): string {
  if (!isTenantSelector(value)) {
    throw denied('tenant target selector is invalid or non-canonical')
  }
  return value
}

/** Returns a frozen target decision only after exact local authorization and audit binding succeed. */
export async function admitTenantTargetSelector(
  input: TenantTargetAdmissionInput
): Promise<TenantTargetAdmissionDecision> {
  const declaration = requireDeclaration(input?.declaration)
  const selector = parseTenantTargetSelector(input?.selector)
  const token = requireTokenProjection(input?.verifiedExecutionToken)
  const workload = requireWorkloadProjection(input?.verifiedWorkloadIdentity)

  if (
    token.clientId !== workload.spiffeId ||
    token.certificateThumbprint !== workload.certificateThumbprint
  ) {
    throw denied('tenant target execution provenance is ambiguous')
  }

  const subjectScope = token.tenantId === undefined ? 'SYSTEM' : 'TENANT'
  if (subjectScope === 'TENANT') {
    if (token.tenantId !== selector) {
      throw denied('tenant target selector does not equal the verified subject tenant')
    }
  } else if (
    declaration.kind !== 'SYSTEM_TARGET' ||
    declaration.systemAuthority !== 'DEDICATED' ||
    declaration.range !== 'ALL' ||
    declaration.gatewayWorkloadIdentity !== workload.spiffeId ||
    token.permissionCodes.length !== 1 ||
    token.permissionCodes[0] !== declaration.permissionCode
  ) {
    throw denied('dedicated SYSTEM tenant target authority does not match')
  }

  const decision: TenantTargetAdmissionDecision = Object.freeze({
    selector,
    selectorField: declaration.selectorField,
    subjectScope,
    subject: token.subject,
    ...(token.tenantId === undefined ? {} : { subjectTenantId: token.tenantId }),
    tokenId: token.tokenId,
    workloadIdentity: workload.spiffeId,
    declarationKind: declaration.kind,
    ...(subjectScope === 'SYSTEM' && declaration.kind === 'SYSTEM_TARGET'
      ? { permissionCode: declaration.permissionCode, range: declaration.range }
      : {})
  })

  if (typeof input?.bindAudit !== 'function') {
    throw denied('tenant target audit binding is missing')
  }
  let bound = false
  try {
    bound = (await input.bindAudit(decision)) === true
  } catch {
    throw denied('tenant target audit binding failed')
  }
  if (!bound) {
    throw denied('tenant target audit binding failed')
  }
  return decision
}

/** Revalidates declaration shape at the runtime trust boundary, including the fixed ALL range. */
function requireDeclaration(value: unknown): TenantTargetAdmissionDeclaration {
  if (!isFrozenPlainDataRecord(value)) {
    throw denied('tenant target method declaration is missing or invalid')
  }
  const commonValid =
    isSelectorField(value.selectorField) && value.tenantAuthority === 'TOKEN_TENANT_EQUALITY'
  if (
    commonValid &&
    value.kind === 'TENANT_SYSTEM_DENY' &&
    value.systemAuthority === 'DENY' &&
    hasExactKeys(value, ['kind', 'selectorField', 'tenantAuthority', 'systemAuthority'])
  ) {
    return value as TenantTargetMethodDeclaration
  }
  if (
    commonValid &&
    value.kind === 'SYSTEM_TARGET' &&
    value.systemAuthority === 'DEDICATED' &&
    value.range === 'ALL' &&
    isWorkloadIdentity(value.gatewayWorkloadIdentity) &&
    isPermissionCode(value.permissionCode) &&
    hasExactKeys(value, [
      'kind',
      'selectorField',
      'tenantAuthority',
      'systemAuthority',
      'gatewayWorkloadIdentity',
      'permissionCode',
      'range'
    ])
  ) {
    return value as SystemTenantTargetMethodDeclaration
  }
  throw denied('tenant target method declaration is missing or invalid')
}

/** Validates the verified-token projection without adding a target tenant claim or credential field. */
function requireTokenProjection(value: unknown): VerifiedExecutionToken {
  if (!isRecord(value)) throw denied('verified execution token projection is missing or invalid')
  const requiredStrings = ['issuer', 'audience', 'subject', 'clientId', 'tokenId']
  const stringsValid = requiredStrings.every((field) => isExactString(value[field]))
  const codes = value.permissionCodes
  const codesValid =
    Array.isArray(codes) &&
    codes.every(isPermissionCode) &&
    new Set(codes).size === codes.length &&
    [...codes].sort().every((code, index) => code === codes[index])
  const timesValid = ['issuedAt', 'notBefore', 'expiresAt'].every((field) =>
    Number.isInteger(value[field])
  )
  if (
    !stringsValid ||
    !['HUMAN', 'MACHINE', 'DELEGATED'].includes(value.principalType as string) ||
    !isThumbprint(value.certificateThumbprint) ||
    !codesValid ||
    !timesValid
  ) {
    throw denied('verified execution token projection is missing or invalid')
  }
  if (
    (Object.prototype.hasOwnProperty.call(value, 'tenantId') && value.tenantId === undefined) ||
    (value.tenantId !== undefined && !isTenantSelector(value.tenantId))
  ) {
    throw denied('verified execution subject scope is unknown or ambiguous')
  }
  return value as VerifiedExecutionToken
}

/** Validates the verified mTLS projection used for direct workload provenance. */
function requireWorkloadProjection(value: unknown): VerifiedWorkloadIdentity {
  if (
    !isRecord(value) ||
    !isWorkloadIdentity(value.spiffeId) ||
    !isThumbprint(value.certificateThumbprint)
  ) {
    throw denied('verified workload identity is missing or invalid')
  }
  return value as VerifiedWorkloadIdentity
}

/** Requires one exact target-owned selector field name. */
function requireSelectorField(value: unknown): string {
  if (!isSelectorField(value)) throw denied('tenant target selector field must be canonical')
  return value
}

/** Requires one exact non-wildcard deployment-owned workload identity. */
function requireWorkloadIdentity(value: unknown): string {
  if (!isWorkloadIdentity(value)) {
    throw denied('SYSTEM tenant target Gateway workload identity must be canonical')
  }
  return value
}

/** Requires one canonical target-owned Permission Code. */
function requirePermissionCode(value: unknown): string {
  if (!isPermissionCode(value)) {
    throw denied('SYSTEM tenant target Permission Code must be canonical')
  }
  return value
}

/** Checks the frozen opaque tenant-selector grammar. */
function isTenantSelector(value: unknown): value is string {
  return typeof value === 'string' && TENANT_SELECTOR_PATTERN.test(value)
}

/** Checks a declaration-owned selector field without lossy normalization. */
function isSelectorField(value: unknown): value is string {
  return typeof value === 'string' && SELECTOR_FIELD_PATTERN.test(value)
}

/** Checks a deployment identity without accepting whitespace or wildcards. */
function isWorkloadIdentity(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 512 &&
    value.trim() === value &&
    !/\s|\*/.test(value)
  )
}

/** Checks one canonical Permission Code without normalization or wildcard semantics. */
function isPermissionCode(value: unknown): value is string {
  return typeof value === 'string' && PERMISSION_CODE_PATTERN.test(value)
}

/** Checks a verified SHA-256 certificate thumbprint projection. */
function isThumbprint(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value)
}

/** Checks a required projection string without trimming it. */
function isExactString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.trim() === value
}

/** Narrows an unknown runtime value to a non-array record. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/** Accepts only builder-produced immutable plain data, never prototypes, accessors, or mutable metadata. */
function isFrozenPlainDataRecord(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value) || !Object.isFrozen(value)) {
    return false
  }
  try {
    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) {
      return false
    }
    return Object.values(Object.getOwnPropertyDescriptors(value)).every(
      (descriptor) => 'value' in descriptor && descriptor.enumerable
    )
  } catch {
    return false
  }
}

/** Rejects undeclared fields that could make target authority provenance ambiguous. */
function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort()
  const canonical = [...expected].sort()
  return (
    actual.length === canonical.length && actual.every((key, index) => key === canonical[index])
  )
}

/** Creates the repository's stable 403 ACCESS_DENIED application exception. */
function denied(reason: string) {
  return ExceptionFactory.application(ACCESS_DENIED, { reason })
}
