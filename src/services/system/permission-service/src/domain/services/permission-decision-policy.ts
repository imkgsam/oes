import { createHash } from 'node:crypto'
import {
  DelegatedAuthorizationDecision,
  DelegatedAuthorizationInput,
  DelegatedAuthorizationUpperBound,
  DelegatedRiskClass,
  IssuanceAuthorizationDecision,
  PermissionDecisionCatalogEntry,
  PrincipalAuthorizationFacts,
  PrincipalAuthorizationInput,
  WorkloadIssuanceInput,
  WorkloadIssuancePolicyFacts
} from '../authorization/permission-decision.types'

const TARGET_AUDIENCE_PATTERN = /^urn:oes:service:[a-z0-9][a-z0-9-]*$/
const RISK_ORDER: Record<DelegatedRiskClass, number> = {
  DELEGATION_ALLOWED: 1,
  ACTION_GRANT_REQUIRED: 2,
  AI_FORBIDDEN: 3
}

/** Resolves all Permission issuance and delegated upper bounds with canonical all-or-nothing semantics. */
export class PermissionDecisionPolicy {
  /** Resolves BUSINESS issuance from current principal grants and optional delegated upper bounds. */
  resolvePrincipalAuthorization(
    input: PrincipalAuthorizationInput,
    facts: PrincipalAuthorizationFacts | null,
    catalog: PermissionDecisionCatalogEntry[]
  ): IssuanceAuthorizationDecision {
    const requested = canonicalCodes(input.requestedPermissionCodes)
    const invalidBinding = validatePrincipalBinding(input, requested)
    if (invalidBinding) {
      return denied(
        requested.values,
        invalidBinding,
        principalDecisionAuthzVersion(input, facts, [])
      )
    }

    const catalogFailure = validateCatalog(requested.values, catalog, 'BUSINESS')
    if (catalogFailure) {
      return denied(
        requested.values,
        catalogFailure,
        principalDecisionAuthzVersion(input, facts, [])
      )
    }
    if (!facts || !principalFactsMatch(input, facts)) {
      return denied(
        requested.values,
        'AUTHORIZATION_PRINCIPAL_INACTIVE',
        principalDecisionAuthzVersion(input, facts, [])
      )
    }

    const grantedByRole = new Set(facts.permissionCodes)
    const policyAllowed = requested.values.filter(
      (code) => grantedByRole.has(code) && isAllowedByCoarsePolicy(code, input, facts)
    )
    let effective = policyAllowed
    let boundaryReason =
      effective.length === requested.values.length ? '' : 'AUTHORIZATION_PERMISSION_DENIED'

    if (input.principalType === 'DELEGATED') {
      const upperBoundFailure = validateDelegatedUpperBound(input, input.delegatedUpperBound)
      if (upperBoundFailure) {
        return denied(
          requested.values,
          upperBoundFailure,
          principalDecisionAuthzVersion(input, facts, []),
          facts.decisionReference
        )
      }
      const upperBound = input.delegatedUpperBound!
      const delegatedEffective = effective.filter((code) =>
        upperBound.delegationPermissionCodes.includes(code)
      )
      if (!boundaryReason && delegatedEffective.length !== requested.values.length) {
        boundaryReason = 'AUTHORIZATION_DELEGATION_DENIED'
      }
      effective = delegatedEffective
      const agentEffective = effective.filter((code) =>
        upperBound.agentPermissionCodes.includes(code)
      )
      if (!boundaryReason && agentEffective.length !== requested.values.length) {
        boundaryReason = 'AUTHORIZATION_DELEGATION_DENIED'
      }
      effective = agentEffective
      const toolEffective = effective.filter((code) =>
        upperBound.toolPermissionCodes.includes(code)
      )
      if (!boundaryReason && toolEffective.length !== requested.values.length) {
        boundaryReason = 'AUTHORIZATION_TOOL_BOUNDARY_DENIED'
      }
      effective = toolEffective
    }

    const deniedCodes = requested.values.filter((code) => !effective.includes(code))
    return {
      allowed: deniedCodes.length === 0,
      grantedPermissionCodes: effective,
      deniedPermissionCodes: deniedCodes,
      authzVersion: principalDecisionAuthzVersion(input, facts, effective),
      policyDecisionReference: facts.decisionReference,
      reasonCode:
        deniedCodes.length === 0
          ? 'AUTHORIZATION_GRANTED'
          : boundaryReason || 'AUTHORIZATION_PERMISSION_DENIED'
    }
  }

  /** Resolves INTERNAL issuance from exact catalog kind and deployment policy tuple. */
  resolveWorkloadIssuance(
    input: WorkloadIssuanceInput,
    catalog: PermissionDecisionCatalogEntry[],
    policy: WorkloadIssuancePolicyFacts | null
  ): IssuanceAuthorizationDecision {
    const requested = canonicalCodes(input.requestedPermissionCodes)
    const bindingFailure = validateWorkloadBinding(input, requested)
    if (bindingFailure) {
      return denied(
        requested.values,
        bindingFailure,
        workloadDecisionAuthzVersion(input, policy, [])
      )
    }

    const catalogFailure = validateCatalog(requested.values, catalog, 'INTERNAL')
    if (catalogFailure) {
      return denied(
        requested.values,
        catalogFailure,
        workloadDecisionAuthzVersion(input, policy, [])
      )
    }
    if (!policy) {
      return denied(
        requested.values,
        'AUTHORIZATION_WORKLOAD_POLICY_DENIED',
        workloadDecisionAuthzVersion(input, null, [])
      )
    }

    const policyMatches =
      policy.originalWorkloadSpiffeId === input.originalWorkloadSpiffeId &&
      policy.targetAudience === input.targetAudience &&
      policy.scopeLevel === input.scopeLevel &&
      policy.policyVersion === input.issuancePolicyVersion &&
      (input.scopeLevel === 'SYSTEM' || policy.tenantIds?.includes(input.tenantId!) === true)
    if (!policyMatches) {
      return denied(
        requested.values,
        'AUTHORIZATION_DECISION_BINDING_MISMATCH',
        workloadDecisionAuthzVersion(input, policy, []),
        workloadDecisionReference(policy)
      )
    }

    const granted = requested.values.filter((code) => policy.permissionCodes.includes(code))
    const deniedCodes = requested.values.filter((code) => !granted.includes(code))
    return {
      allowed: deniedCodes.length === 0,
      grantedPermissionCodes: granted,
      deniedPermissionCodes: deniedCodes,
      authzVersion: workloadDecisionAuthzVersion(input, policy, granted),
      policyDecisionReference: workloadDecisionReference(policy),
      reasonCode:
        deniedCodes.length === 0 ? 'AUTHORIZATION_GRANTED' : 'AUTHORIZATION_WORKLOAD_POLICY_DENIED'
    }
  }

  /** Resolves one delegated action by intersecting owner snapshots with current HUMAN grants. */
  resolveDelegatedAuthorization(
    input: DelegatedAuthorizationInput,
    humanFacts: PrincipalAuthorizationFacts | null,
    catalog: PermissionDecisionCatalogEntry[]
  ): DelegatedAuthorizationDecision {
    const requested = canonicalCodes(input.requestedPermissionCodes)
    const owner = input.ownerAuthorization
    const base = delegatedDenied(
      input,
      humanFacts,
      requested.values,
      'AUTHORIZATION_DELEGATION_DENIED'
    )
    if (
      !requested.valid ||
      !isExact(input.humanPrincipalId) ||
      input.scopeLevel !== 'TENANT' ||
      !isExact(input.tenantId) ||
      !TARGET_AUDIENCE_PATTERN.test(input.targetAudience) ||
      !isExact(input.operationKey)
    ) {
      return { ...base, reasonCode: 'AUTHORIZATION_DECISION_BINDING_MISMATCH' }
    }

    const catalogFailure = validateCatalog(requested.values, catalog, 'BUSINESS')
    if (catalogFailure) return { ...base, reasonCode: catalogFailure }
    if (
      !humanFacts ||
      humanFacts.principalType !== 'HUMAN' ||
      humanFacts.principalId !== input.humanPrincipalId ||
      humanFacts.scopeLevel !== input.scopeLevel ||
      humanFacts.tenantId !== input.tenantId
    ) {
      return { ...base, reasonCode: 'AUTHORIZATION_PRINCIPAL_INACTIVE' }
    }

    const upperBoundFailure = validateDelegatedActionUpperBound(input)
    if (upperBoundFailure) return { ...base, reasonCode: upperBoundFailure }
    if (!owner.current || !owner.resourcePolicyAllowed) {
      return { ...base, reasonCode: 'AUTHORIZATION_RESOURCE_FACTS_INVALID' }
    }
    if (RISK_ORDER[owner.effectiveRiskClass] < RISK_ORDER[owner.codeRiskBaseline]) {
      return { ...base, reasonCode: 'AUTHORIZATION_OPERATION_CLASS_INVALID' }
    }
    if (owner.effectiveRiskClass === 'AI_FORBIDDEN') {
      return { ...base, reasonCode: 'AUTHORIZATION_OPERATION_FORBIDDEN_FOR_AI' }
    }

    const upperBound = input.delegatedUpperBound
    const granted = requested.values.filter(
      (code) =>
        humanFacts.permissionCodes.includes(code) &&
        isAllowedByCoarsePolicy(
          code,
          {
            principalType: 'DELEGATED',
            principalId: input.humanPrincipalId,
            scopeLevel: input.scopeLevel,
            tenantId: input.tenantId,
            orgId: input.orgId,
            targetAudience: input.targetAudience,
            requestedPermissionCodes: requested.values,
            sessionReference: upperBound.sessionReference,
            securityReference: upperBound.securityReference,
            delegatedUpperBound: upperBound
          },
          humanFacts
        ) &&
        upperBound.delegationPermissionCodes.includes(code) &&
        upperBound.agentPermissionCodes.includes(code) &&
        upperBound.toolPermissionCodes.includes(code) &&
        owner.permissionCodes.includes(code)
    )
    const deniedCodes = requested.values.filter((code) => !granted.includes(code))
    return {
      allowed: deniedCodes.length === 0,
      allowedPermissionCodes: granted,
      deniedPermissionCodes: deniedCodes,
      riskClass: owner.effectiveRiskClass,
      policyVersion: owner.policyVersion,
      resourcePolicyAllowed: owner.resourcePolicyAllowed,
      resourcePolicyReference: owner.resourcePolicyReference,
      authzVersion: delegatedDecisionAuthzVersion(input, humanFacts, granted),
      policyDecisionReference: owner.policyReference,
      reasonCode:
        deniedCodes.length === 0 ? 'AUTHORIZATION_GRANTED' : 'AUTHORIZATION_DELEGATION_DENIED'
    }
  }
}

/** Validates exact principal, tenant, audience and canonical request binding. */
function validatePrincipalBinding(
  input: PrincipalAuthorizationInput,
  requested: CanonicalCodes
): string | undefined {
  if (
    !requested.valid ||
    !['HUMAN', 'MACHINE', 'DELEGATED'].includes(input.principalType) ||
    !['SYSTEM', 'TENANT'].includes(input.scopeLevel) ||
    !isExact(input.principalId) ||
    !TARGET_AUDIENCE_PATTERN.test(input.targetAudience)
  ) {
    return 'AUTHORIZATION_DECISION_BINDING_MISMATCH'
  }
  if (input.scopeLevel === 'TENANT' ? !isExact(input.tenantId) : input.tenantId !== undefined) {
    return 'AUTHORIZATION_SCOPE_MISMATCH'
  }
  if (input.principalType === 'DELEGATED' && !input.delegatedUpperBound) {
    return 'AUTHORIZATION_DELEGATION_DENIED'
  }
  return undefined
}

/** Validates exact workload, attribution, tenant and policy-version request binding. */
function validateWorkloadBinding(
  input: WorkloadIssuanceInput,
  requested: CanonicalCodes
): string | undefined {
  if (
    !requested.valid ||
    !['HUMAN', 'MACHINE', 'DELEGATED'].includes(input.principalType) ||
    !['SYSTEM', 'TENANT'].includes(input.scopeLevel) ||
    !isSpiffeId(input.originalWorkloadSpiffeId) ||
    !TARGET_AUDIENCE_PATTERN.test(input.targetAudience) ||
    !isExact(input.principalId) ||
    !isExact(input.issuancePolicyVersion)
  ) {
    return 'AUTHORIZATION_DECISION_BINDING_MISMATCH'
  }
  if (input.scopeLevel === 'TENANT' ? !isExact(input.tenantId) : input.tenantId !== undefined) {
    return 'AUTHORIZATION_SCOPE_MISMATCH'
  }
  return undefined
}

/** Confirms repository grant facts bind to the exact logical principal request. */
function principalFactsMatch(
  input: PrincipalAuthorizationInput,
  facts: PrincipalAuthorizationFacts
): boolean {
  const expectedType = input.principalType === 'DELEGATED' ? 'HUMAN' : input.principalType
  return (
    facts.principalType === expectedType &&
    facts.principalId === input.principalId &&
    facts.scopeLevel === input.scopeLevel &&
    facts.tenantId === input.tenantId &&
    isExact(facts.authzVersion) &&
    isExact(facts.decisionReference)
  )
}

/** Validates active delegated owner references and canonical restrictive Code sets. */
function validateDelegatedUpperBound(
  input: PrincipalAuthorizationInput,
  upperBound: DelegatedAuthorizationUpperBound | undefined
): string | undefined {
  if (!upperBound || upperBound.humanPrincipalId !== input.principalId) {
    return 'AUTHORIZATION_DELEGATION_DENIED'
  }
  if (
    upperBound.sessionReference !== input.sessionReference ||
    upperBound.securityReference !== input.securityReference ||
    !upperBound.delegationActive ||
    !upperBound.agentPrincipalActive ||
    !upperBound.toolContractActive ||
    !allDelegatedReferencesPresent(upperBound)
  ) {
    return 'AUTHORIZATION_DELEGATION_INACTIVE'
  }
  if (
    !canonicalCodes(upperBound.delegationPermissionCodes).valid ||
    !canonicalCodes(upperBound.agentPermissionCodes).valid ||
    !canonicalCodes(upperBound.toolPermissionCodes).valid
  ) {
    return 'AUTHORIZATION_DECISION_BINDING_MISMATCH'
  }
  return undefined
}

/** Extends delegated upper-bound validation with owner action and policy bindings. */
function validateDelegatedActionUpperBound(input: DelegatedAuthorizationInput): string | undefined {
  const upperBoundFailure = validateDelegatedUpperBound(
    {
      principalType: 'DELEGATED',
      principalId: input.humanPrincipalId,
      scopeLevel: input.scopeLevel,
      tenantId: input.tenantId,
      orgId: input.orgId,
      targetAudience: input.targetAudience,
      requestedPermissionCodes: input.requestedPermissionCodes,
      sessionReference: input.delegatedUpperBound.sessionReference,
      securityReference: input.delegatedUpperBound.securityReference,
      delegatedUpperBound: input.delegatedUpperBound
    },
    input.delegatedUpperBound
  )
  if (upperBoundFailure) return upperBoundFailure
  const owner = input.ownerAuthorization
  if (
    !isExact(owner.actionReference) ||
    !isExact(owner.policyReference) ||
    !isExact(owner.policyVersion) ||
    !isExact(owner.resourcePolicyReference) ||
    !canonicalCodes(owner.permissionCodes).valid
  ) {
    return 'AUTHORIZATION_RESOURCE_FACTS_INVALID'
  }
  return undefined
}

/** Confirms all delegated owner references and versions are auditable exact identifiers. */
function allDelegatedReferencesPresent(upperBound: DelegatedAuthorizationUpperBound): boolean {
  return [
    upperBound.humanPrincipalId,
    upperBound.sessionReference,
    upperBound.securityReference,
    upperBound.delegationReference,
    upperBound.delegationVersion,
    upperBound.agentPrincipalReference,
    upperBound.agentPrincipalVersion,
    upperBound.toolContractReference,
    upperBound.toolContractVersion
  ].every(isExact)
}

/** Enforces complete catalog presence and a single expected Permission kind. */
function validateCatalog(
  requested: string[],
  catalog: PermissionDecisionCatalogEntry[],
  expectedKind: 'BUSINESS' | 'INTERNAL'
): string | undefined {
  const byCode = new Map(catalog.map((entry) => [entry.code, entry]))
  if (requested.some((code) => !byCode.has(code))) return 'AUTHORIZATION_PERMISSION_UNKNOWN'
  if (requested.some((code) => byCode.get(code)?.kind !== expectedKind)) {
    return 'AUTHORIZATION_PERMISSION_KIND_MISMATCH'
  }
  return undefined
}

/** Applies DENY-first coarse policy semantics and fails closed on unresolved condition AST. */
function isAllowedByCoarsePolicy(
  permissionCode: string,
  input: PrincipalAuthorizationInput,
  facts: PrincipalAuthorizationFacts
): boolean {
  const policies = facts.policies.filter(
    (policy) =>
      policy.permissionCode === permissionCode &&
      (policy.tenantId === undefined || policy.tenantId === input.tenantId)
  )
  if (policies.length === 0) return true
  const applicable = policies.filter(
    (policy) =>
      policy.subjectType === 'ANY' ||
      (policy.subjectType === 'ACCOUNT' && policy.subjectId === input.principalId) ||
      (policy.subjectType === 'ROLE' && facts.roleCodes.includes(policy.subjectId ?? ''))
  )
  if (applicable.some((policy) => isExact(policy.conditionAstJson))) return false
  if (applicable.some((policy) => policy.effect === 'DENY')) return false
  return applicable.some((policy) => policy.effect === 'ALLOW')
}

type CanonicalCodes = { valid: boolean; values: string[] }

/** Accepts only non-empty, exact, unique and already-sorted Permission Code arrays. */
function canonicalCodes(codes: string[]): CanonicalCodes {
  if (!Array.isArray(codes) || codes.length === 0 || codes.some((code) => !isExact(code))) {
    return { valid: false, values: normalizeCodes(codes) }
  }
  const normalized = normalizeCodes(codes)
  return {
    valid:
      normalized.length === codes.length &&
      normalized.every((code, index) => code === codes[index]),
    values: normalized
  }
}

/** Produces a deterministic audit-safe Code list without granting from malformed input. */
function normalizeCodes(codes: string[]): string[] {
  return [...new Set((Array.isArray(codes) ? codes : []).filter(isExact))].sort()
}

/** Creates a fail-closed issuance decision while retaining safe binding evidence when available. */
function denied(
  requested: string[],
  reasonCode: string,
  authzVersion = '',
  policyDecisionReference = ''
): IssuanceAuthorizationDecision {
  return {
    allowed: false,
    grantedPermissionCodes: [],
    deniedPermissionCodes: requested,
    authzVersion,
    policyDecisionReference,
    reasonCode
  }
}

/** Creates a fail-closed delegated decision preserving only owner-safe risk and policy references. */
function delegatedDenied(
  input: DelegatedAuthorizationInput,
  facts: PrincipalAuthorizationFacts | null,
  requested: string[],
  reasonCode: string
): DelegatedAuthorizationDecision {
  return {
    allowed: false,
    allowedPermissionCodes: [],
    deniedPermissionCodes: requested,
    riskClass: input.ownerAuthorization?.effectiveRiskClass ?? 'AI_FORBIDDEN',
    policyVersion: input.ownerAuthorization?.policyVersion ?? '',
    resourcePolicyAllowed: false,
    resourcePolicyReference: input.ownerAuthorization?.resourcePolicyReference ?? '',
    authzVersion: delegatedDecisionAuthzVersion(input, facts, []),
    policyDecisionReference: input.ownerAuthorization?.policyReference ?? '',
    reasonCode
  }
}

type DecisionVersionScalar = string | number | boolean | null | undefined
type DecisionVersionField = readonly [name: string, value: DecisionVersionScalar]

/** Hashes canonical decision context and effective Codes without exposing raw version labels. */
export function buildOpaqueDecisionAuthzVersion(input: {
  decisionType: 'PRINCIPAL_AUTHORIZATION' | 'WORKLOAD_ISSUANCE' | 'DELEGATED_AUTHORIZATION'
  fields: readonly DecisionVersionField[]
  effectivePermissionCodes: readonly string[]
}): string {
  const fields = input.fields
    .map(([name, value]) => [name, value === undefined ? null : value] as const)
    .sort(
      ([leftName, leftValue], [rightName, rightValue]) =>
        leftName.localeCompare(rightName) || String(leftValue).localeCompare(String(rightValue))
    )
  const canonical = JSON.stringify({
    decisionType: input.decisionType,
    fields,
    effectivePermissionCodes: normalizeCodes([...input.effectivePermissionCodes])
  })
  return createHash('sha256').update(canonical).digest('hex')
}

/** Binds principal issuance versions to identity, scope, upper bounds and effective BUSINESS Codes. */
export function principalDecisionAuthzVersion(
  input: PrincipalAuthorizationInput,
  facts: PrincipalAuthorizationFacts | null,
  effectivePermissionCodes: readonly string[]
): string {
  const upperBound = input.delegatedUpperBound
  return buildOpaqueDecisionAuthzVersion({
    decisionType: 'PRINCIPAL_AUTHORIZATION',
    fields: [
      ['principalType', input.principalType],
      ['principalId', input.principalId],
      ['scopeLevel', input.scopeLevel],
      ['tenantId', input.tenantId],
      ['orgId', input.orgId],
      ['targetAudience', input.targetAudience],
      ['requestedPermissionCodes', normalizeCodes(input.requestedPermissionCodes).join('\n')],
      ['sessionReference', input.sessionReference],
      ['securityReference', input.securityReference],
      ['humanGrantVersion', facts?.authzVersion],
      ['delegationReference', upperBound?.delegationReference],
      ['delegationVersion', upperBound?.delegationVersion],
      ['delegationActive', upperBound?.delegationActive],
      ['agentPrincipalReference', upperBound?.agentPrincipalReference],
      ['agentPrincipalVersion', upperBound?.agentPrincipalVersion],
      ['agentPrincipalActive', upperBound?.agentPrincipalActive],
      ['toolContractReference', upperBound?.toolContractReference],
      ['toolContractVersion', upperBound?.toolContractVersion],
      ['toolContractActive', upperBound?.toolContractActive]
    ],
    effectivePermissionCodes
  })
}

/** Binds workload issuance versions to the exact attribution, policy and granted INTERNAL Codes. */
export function workloadDecisionAuthzVersion(
  input: WorkloadIssuanceInput,
  policy: WorkloadIssuancePolicyFacts | null,
  effectivePermissionCodes: readonly string[]
): string {
  return buildOpaqueDecisionAuthzVersion({
    decisionType: 'WORKLOAD_ISSUANCE',
    fields: [
      ['originalWorkloadSpiffeId', input.originalWorkloadSpiffeId],
      ['targetAudience', input.targetAudience],
      ['scopeLevel', input.scopeLevel],
      ['tenantId', input.tenantId],
      ['orgId', input.orgId],
      ['principalType', input.principalType],
      ['principalId', input.principalId],
      ['requestedPermissionCodes', normalizeCodes(input.requestedPermissionCodes).join('\n')],
      ['requestedPolicyVersion', input.issuancePolicyVersion],
      ['trustedPolicyVersion', policy?.policyVersion]
    ],
    effectivePermissionCodes
  })
}

/** Binds delegated-action versions to every owner snapshot and final effective BUSINESS Codes. */
export function delegatedDecisionAuthzVersion(
  input: DelegatedAuthorizationInput,
  facts: PrincipalAuthorizationFacts | null,
  effectivePermissionCodes: readonly string[]
): string {
  const upperBound = input.delegatedUpperBound
  const owner = input.ownerAuthorization
  return buildOpaqueDecisionAuthzVersion({
    decisionType: 'DELEGATED_AUTHORIZATION',
    fields: [
      ['humanPrincipalId', input.humanPrincipalId],
      ['scopeLevel', input.scopeLevel],
      ['tenantId', input.tenantId],
      ['orgId', input.orgId],
      ['targetAudience', input.targetAudience],
      ['operationKey', input.operationKey],
      ['requestedPermissionCodes', normalizeCodes(input.requestedPermissionCodes).join('\n')],
      ['humanGrantVersion', facts?.authzVersion],
      ['sessionReference', upperBound?.sessionReference],
      ['securityReference', upperBound?.securityReference],
      ['delegationReference', upperBound?.delegationReference],
      ['delegationVersion', upperBound?.delegationVersion],
      ['delegationActive', upperBound?.delegationActive],
      ['agentPrincipalReference', upperBound?.agentPrincipalReference],
      ['agentPrincipalVersion', upperBound?.agentPrincipalVersion],
      ['agentPrincipalActive', upperBound?.agentPrincipalActive],
      ['toolContractReference', upperBound?.toolContractReference],
      ['toolContractVersion', upperBound?.toolContractVersion],
      ['toolContractActive', upperBound?.toolContractActive],
      ['actionReference', owner?.actionReference],
      ['ownerPolicyReference', owner?.policyReference],
      ['ownerPolicyVersion', owner?.policyVersion],
      ['ownerCurrent', owner?.current],
      ['codeRiskBaseline', owner?.codeRiskBaseline],
      ['effectiveRiskClass', owner?.effectiveRiskClass],
      ['resourcePolicyAllowed', owner?.resourcePolicyAllowed],
      ['resourcePolicyReference', owner?.resourcePolicyReference]
    ],
    effectivePermissionCodes
  })
}

/** Produces one safe workload policy decision reference from immutable policy facts. */
function workloadDecisionReference(policy: WorkloadIssuancePolicyFacts): string {
  return `workload-policy:${policy.originalWorkloadSpiffeId}:${policy.targetAudience}:${policy.policyVersion}`
}

/** Checks exact non-empty strings without trimming caller data into authority. */
function isExact(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.trim() === value
}

/** Accepts only exact SPIFFE URI identities without wildcard authority. */
function isSpiffeId(value: string): boolean {
  return isExact(value) && value.startsWith('spiffe://') && !value.includes('*')
}
