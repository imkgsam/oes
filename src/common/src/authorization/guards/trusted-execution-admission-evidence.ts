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
    sourceToken: VerifiedExecutionToken
    sourceWorkload: VerifiedWorkloadIdentity
  }>

const TRUSTED_EXECUTION_ADMISSIONS = new WeakMap<object, StoredEvidence>()

/** Binds one completed TrustedExecutionGuard result exactly once to its current request object. */
export function bindTrustedExecutionAdmissionEvidence(
  rpcData: unknown,
  input: Readonly<{
    handler: unknown
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
    evidence.sourceToken !== input.currentToken ||
    evidence.sourceWorkload !== input.currentWorkload ||
    !matchesTokenSnapshot(evidence.sourceToken, evidence.verifiedExecutionToken) ||
    !matchesWorkloadSnapshot(evidence.sourceWorkload, evidence.verifiedWorkloadIdentity)
  ) {
    return undefined
  }
  return evidence
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
