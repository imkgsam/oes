import type {
  RpcAuthorizationModeDeclaration,
  VerifiedExecutionToken,
  VerifiedWorkloadIdentity
} from '../trusted-execution'

/** Captures the exact immutable trusted-guard result consumed by later target admission. */
export type TrustedExecutionAdmissionEvidence = Readonly<{
  handler: unknown
  authorizationDeclaration: RpcAuthorizationModeDeclaration
  verifiedExecutionToken: VerifiedExecutionToken
  verifiedWorkloadIdentity: VerifiedWorkloadIdentity
  requestId: string
  traceId?: string
}>

type StoredEvidence = TrustedExecutionAdmissionEvidence &
  Readonly<{
    sourceCarrier: object
    sourceAuthorizationDeclaration: RpcAuthorizationModeDeclaration
    sourceToken: VerifiedExecutionToken
    sourceWorkload: VerifiedWorkloadIdentity
  }>

const TRUSTED_EXECUTION_ADMISSIONS = new WeakMap<object, StoredEvidence>()

/** Binds one completed TrustedExecutionGuard result exactly once to its current request object. */
export function bindTrustedExecutionAdmissionEvidence(
  rpcData: unknown,
  input: Readonly<{
    handler: unknown
    publicCarrier: unknown
    authorizationDeclaration: RpcAuthorizationModeDeclaration
    verifiedExecutionToken: VerifiedExecutionToken
    verifiedWorkloadIdentity: VerifiedWorkloadIdentity
    requestId: string
    traceId?: string
  }>
): boolean {
  if (
    rpcData === null ||
    typeof rpcData !== 'object' ||
    Array.isArray(rpcData) ||
    typeof input.handler !== 'function' ||
    input.publicCarrier === null ||
    typeof input.publicCarrier !== 'object' ||
    Array.isArray(input.publicCarrier) ||
    !isExactAuthorizationDeclaration(input.authorizationDeclaration) ||
    TRUSTED_EXECUTION_ADMISSIONS.has(rpcData)
  ) {
    return false
  }
  let evidence: StoredEvidence
  try {
    evidence = Object.freeze({
      handler: input.handler,
      authorizationDeclaration: snapshotAuthorizationDeclaration(input.authorizationDeclaration),
      verifiedExecutionToken: snapshotToken(input.verifiedExecutionToken),
      verifiedWorkloadIdentity: snapshotWorkload(input.verifiedWorkloadIdentity),
      requestId: input.requestId,
      ...(input.traceId === undefined ? {} : { traceId: input.traceId }),
      sourceCarrier: input.publicCarrier,
      sourceAuthorizationDeclaration: input.authorizationDeclaration,
      sourceToken: input.verifiedExecutionToken,
      sourceWorkload: input.verifiedWorkloadIdentity
    })
  } catch {
    return false
  }
  TRUSTED_EXECUTION_ADMISSIONS.set(rpcData, evidence)
  return true
}

/** Deep-copies the authorized RPC mode and Code set so later metadata mutation cannot widen it. */
function snapshotAuthorizationDeclaration(
  declaration: RpcAuthorizationModeDeclaration
): RpcAuthorizationModeDeclaration {
  if (declaration.mode === 'SELF_SERVICE') {
    return Object.freeze({
      mode: 'SELF_SERVICE',
      allowDelegated: declaration.allowDelegated,
      ...(declaration.sessionTerminals === undefined
        ? {}
        : { sessionTerminals: Object.freeze([...declaration.sessionTerminals]) })
    })
  }
  if (declaration.mode === 'INTERNAL') {
    return Object.freeze({
      mode: 'INTERNAL',
      permissions: Object.freeze({ all: Object.freeze([...declaration.permissions.all]) })
    })
  }
  const requirement = declaration.permissions
  return Object.freeze({
    mode: 'BUSINESS',
    permissions:
      'all' in requirement
        ? Object.freeze({ all: Object.freeze([...requirement.all]) })
        : Object.freeze({ any: Object.freeze([...requirement.any]) }),
    ...(declaration.principalType === undefined
      ? {}
      : { principalType: declaration.principalType }),
    ...(declaration.sessionTerminals === undefined
      ? {}
      : { sessionTerminals: Object.freeze([...declaration.sessionTerminals]) })
  })
}

/** Returns evidence only when handler identity and the public carrier still match the stamped sources. */
export function getTrustedExecutionAdmissionEvidence(
  rpcData: unknown,
  input: Readonly<{
    handler: unknown
    currentCarrier?: unknown
    currentAuthorizationDeclaration?: unknown
    currentToken?: VerifiedExecutionToken
    currentWorkload?: VerifiedWorkloadIdentity
  }>
): TrustedExecutionAdmissionEvidence | undefined {
  if (rpcData === null || typeof rpcData !== 'object' || Array.isArray(rpcData)) {
    return undefined
  }
  const evidence = TRUSTED_EXECUTION_ADMISSIONS.get(rpcData)
  if (
    evidence === undefined ||
    evidence.handler !== input.handler ||
    evidence.sourceCarrier !== input.currentCarrier ||
    evidence.sourceAuthorizationDeclaration !== input.currentAuthorizationDeclaration ||
    evidence.sourceToken !== input.currentToken ||
    evidence.sourceWorkload !== input.currentWorkload ||
    !isExactAuthorizationDeclaration(evidence.sourceAuthorizationDeclaration) ||
    !matchesAuthorizationDeclaration(
      evidence.sourceAuthorizationDeclaration,
      evidence.authorizationDeclaration
    ) ||
    !matchesTokenSnapshot(evidence.sourceToken, evidence.verifiedExecutionToken) ||
    !matchesWorkloadSnapshot(evidence.sourceWorkload, evidence.verifiedWorkloadIdentity)
  ) {
    return undefined
  }
  return evidence
}

/** Accepts only the exact deeply immutable shapes emitted by trusted RPC declaration builders. */
export function isTrustedExecutionAdmissionDeclaration(
  value: unknown
): value is RpcAuthorizationModeDeclaration {
  return isExactAuthorizationDeclaration(value)
}

/** Validates one immutable RPC declaration without canonicalizing malformed or extra authority. */
function isExactAuthorizationDeclaration(value: unknown): value is RpcAuthorizationModeDeclaration {
  try {
    if (!isFrozenPlainDataRecord(value)) {
      return false
    }
    if (value.mode === 'SELF_SERVICE') {
      const hasSessionTerminals = Object.prototype.hasOwnProperty.call(value, 'sessionTerminals')
      return (
        typeof value.allowDelegated === 'boolean' &&
        hasExactKeys(value, [
          'mode',
          'allowDelegated',
          ...(hasSessionTerminals ? ['sessionTerminals'] : [])
        ]) &&
        (!hasSessionTerminals ||
          (value.sessionTerminals !== undefined &&
            isOptionalSessionTerminalSet(value.sessionTerminals)))
      )
    }
    if (value.mode === 'INTERNAL') {
      return (
        hasExactKeys(value, ['mode', 'permissions']) &&
        isExactPermissionRequirement(value.permissions, 'all')
      )
    }
    if (value.mode !== 'BUSINESS') {
      return false
    }
    const hasPrincipalType = Object.prototype.hasOwnProperty.call(value, 'principalType')
    const hasSessionTerminals = Object.prototype.hasOwnProperty.call(value, 'sessionTerminals')
    const optionalKeys = [
      ...(hasPrincipalType ? ['principalType'] : []),
      ...(hasSessionTerminals ? ['sessionTerminals'] : [])
    ]
    return (
      hasExactKeys(value, ['mode', 'permissions', ...optionalKeys]) &&
      (!hasPrincipalType ||
        (value.principalType !== undefined &&
          ['HUMAN', 'MACHINE', 'DELEGATED'].includes(value.principalType as string))) &&
      (!hasSessionTerminals ||
        (value.sessionTerminals !== undefined &&
          isOptionalSessionTerminalSet(value.sessionTerminals))) &&
      (isExactPermissionRequirement(value.permissions, 'all') ||
        isExactPermissionRequirement(value.permissions, 'any'))
    )
  } catch {
    return false
  }
}

/** Checks one exact frozen all-or-any Code requirement with no second or extra field. */
function isExactPermissionRequirement(value: unknown, key: 'all' | 'any'): boolean {
  if (!isFrozenPlainDataRecord(value) || !hasExactKeys(value, [key])) {
    return false
  }
  const codes = value[key]
  return (
    Array.isArray(codes) &&
    Object.isFrozen(codes) &&
    codes.length > 0 &&
    codes.every((code) => typeof code === 'string' && code.length > 0 && code.trim() === code)
  )
}

/** Checks an omitted or exact frozen, unique platform terminal set. */
function isOptionalSessionTerminalSet(value: unknown): boolean {
  if (value === undefined) {
    return true
  }
  return (
    Array.isArray(value) &&
    Object.isFrozen(value) &&
    value.length > 0 &&
    new Set(value).size === value.length &&
    value.every((terminal) => ['WEB', 'BROWSER_EXTENSION', 'PDA'].includes(terminal as string))
  )
}

/** Compares the exact authority-bearing fields retained before and after the guard boundary. */
function matchesAuthorizationDeclaration(
  source: RpcAuthorizationModeDeclaration,
  snapshot: RpcAuthorizationModeDeclaration
): boolean {
  if (source.mode !== snapshot.mode) {
    return false
  }
  if (source.mode === 'SELF_SERVICE' && snapshot.mode === 'SELF_SERVICE') {
    return (
      source.allowDelegated === snapshot.allowDelegated &&
      sameOptionalStrings(source.sessionTerminals, snapshot.sessionTerminals)
    )
  }
  if (source.mode === 'INTERNAL' && snapshot.mode === 'INTERNAL') {
    return sameStrings(source.permissions.all, snapshot.permissions.all)
  }
  if (source.mode === 'BUSINESS' && snapshot.mode === 'BUSINESS') {
    const sourceRequirement = source.permissions
    const snapshotRequirement = snapshot.permissions
    const sameRequirement =
      'all' in sourceRequirement && 'all' in snapshotRequirement
        ? sameStrings(sourceRequirement.all, snapshotRequirement.all)
        : 'any' in sourceRequirement && 'any' in snapshotRequirement
          ? sameStrings(sourceRequirement.any, snapshotRequirement.any)
          : false
    return (
      sameRequirement &&
      source.principalType === snapshot.principalType &&
      sameOptionalStrings(source.sessionTerminals, snapshot.sessionTerminals)
    )
  }
  return false
}

/** Compares two exact immutable string arrays. */
function sameStrings(first: readonly string[], second: readonly string[]): boolean {
  return first.length === second.length && first.every((value, index) => value === second[index])
}

/** Compares optional immutable string arrays without treating absence as an empty declaration. */
function sameOptionalStrings(
  first: readonly string[] | undefined,
  second: readonly string[] | undefined
): boolean {
  return first === undefined || second === undefined ? first === second : sameStrings(first, second)
}

/** Requires a frozen plain record whose exact fields are immutable enumerable data properties. */
function isFrozenPlainDataRecord(value: unknown): value is Record<string, unknown> {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype ||
    !Object.isFrozen(value)
  ) {
    return false
  }
  return Reflect.ownKeys(value).every((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    return (
      descriptor !== undefined &&
      'value' in descriptor &&
      descriptor.enumerable &&
      !descriptor.writable &&
      !descriptor.configurable
    )
  })
}

/** Requires one immutable record to contain only the named own data properties. */
function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const ownKeys = Reflect.ownKeys(value)
  if (ownKeys.some((key) => typeof key !== 'string')) {
    return false
  }
  const keys = (ownKeys as string[]).sort()
  const wanted = [...expected].sort()
  return keys.length === wanted.length && keys.every((key, index) => key === wanted[index])
}

/** Copies only tenant-admission-relevant verified claims into an immutable evidence snapshot. */
function snapshotToken(token: VerifiedExecutionToken): VerifiedExecutionToken {
  return Object.freeze({
    issuer: token.issuer,
    audience: token.audience,
    subject: token.subject,
    principalType: token.principalType,
    clientId: token.clientId,
    ...(token.tenantId === undefined ? {} : { tenantId: token.tenantId }),
    permissionCodes: Object.freeze([...token.permissionCodes]),
    tokenId: token.tokenId,
    issuedAt: token.issuedAt,
    notBefore: token.notBefore,
    expiresAt: token.expiresAt,
    certificateThumbprint: token.certificateThumbprint
  })
}

/** Copies verified direct-workload identity into an immutable evidence snapshot. */
function snapshotWorkload(workload: VerifiedWorkloadIdentity): VerifiedWorkloadIdentity {
  return Object.freeze({
    spiffeId: workload.spiffeId,
    certificateThumbprint: workload.certificateThumbprint
  })
}

/** Detects replacement or in-place mutation of tenant-admission-relevant token evidence. */
function matchesTokenSnapshot(
  source: VerifiedExecutionToken,
  snapshot: VerifiedExecutionToken
): boolean {
  return (
    source.issuer === snapshot.issuer &&
    source.audience === snapshot.audience &&
    source.subject === snapshot.subject &&
    source.principalType === snapshot.principalType &&
    source.clientId === snapshot.clientId &&
    source.tenantId === snapshot.tenantId &&
    source.tokenId === snapshot.tokenId &&
    source.issuedAt === snapshot.issuedAt &&
    source.notBefore === snapshot.notBefore &&
    source.expiresAt === snapshot.expiresAt &&
    source.certificateThumbprint === snapshot.certificateThumbprint &&
    source.permissionCodes.length === snapshot.permissionCodes.length &&
    source.permissionCodes.every((code, index) => code === snapshot.permissionCodes[index])
  )
}

/** Detects replacement or in-place mutation of direct mTLS workload evidence. */
function matchesWorkloadSnapshot(
  source: VerifiedWorkloadIdentity,
  snapshot: VerifiedWorkloadIdentity
): boolean {
  return (
    source.spiffeId === snapshot.spiffeId &&
    source.certificateThumbprint === snapshot.certificateThumbprint
  )
}
