import { randomUUID } from 'node:crypto'
import type {
  DelegatedHumanGrantResolver,
  DelegatedResourcePolicyEvaluator
} from './delegated-authorization.ports'

export type DelegatedRiskClass = 'DELEGATION_ALLOWED' | 'ACTION_GRANT_REQUIRED' | 'AI_FORBIDDEN'

export type ResolveDelegatedAuthorizationInput = {
  readonly humanPrincipalId: string
  readonly delegationReference: string
  readonly agentPrincipalId: string
  readonly toolContractId: string
  readonly toolContractVersion: string
  readonly tenantId: string
  readonly orgId?: string
  readonly targetAudience: string
  readonly operationKey: string
  readonly requestedPermissionCodes: readonly string[]
  readonly delegationOperationKeys: readonly string[]
  readonly delegationPermissionCodes: readonly string[]
  readonly toolOperationKeys: readonly string[]
  readonly toolPermissionCodes: readonly string[]
  readonly ownerRiskClass: DelegatedRiskClass
  readonly resourceFacts: Readonly<Record<string, unknown>>
}

export type DelegatedAuthorizationResult = {
  readonly allowed: boolean
  readonly allowedPermissionCodes: readonly string[]
  readonly riskClass: DelegatedRiskClass
  readonly effectiveTenantId: string
  readonly effectiveOrgId?: string
  readonly authorizationDecisionReference: string
  readonly authzVersion: string
  readonly reasonCategory: string
  readonly stepUpRequired: boolean
}

type DelegatedAuthorizationServiceOptions = {
  readonly humanGrantResolver: DelegatedHumanGrantResolver
  readonly resourcePolicyEvaluator: DelegatedResourcePolicyEvaluator
  readonly randomId?: () => string
}

/** Resolves the least-privilege delegated intersection while keeping credential issuance outside Permission. */
export class DelegatedAuthorizationService {
  private readonly randomId: () => string

  constructor(private readonly options: DelegatedAuthorizationServiceOptions) {
    this.randomId = options.randomId ?? randomUUID
  }

  /** Produces one auditable decision from current HUMAN grant, fixed delegation/tool bounds and resource policy. */
  async resolve(input: ResolveDelegatedAuthorizationInput): Promise<DelegatedAuthorizationResult> {
    validateStableInput(input)
    const decisionReference = this.randomId()
    const human = await this.options.humanGrantResolver.resolve({
      humanPrincipalId: input.humanPrincipalId,
      tenantId: input.tenantId,
      ...(input.orgId === undefined ? {} : { orgId: input.orgId }),
      requestedPermissionCodes: input.requestedPermissionCodes
    })
    if (!human.active) {
      return denied(
        input,
        decisionReference,
        human.authzVersion,
        'AUTHORIZATION_DELEGATION_INACTIVE'
      )
    }
    if (input.ownerRiskClass === 'AI_FORBIDDEN') {
      return denied(
        input,
        decisionReference,
        human.authzVersion,
        'AUTHORIZATION_OPERATION_FORBIDDEN_FOR_AI'
      )
    }
    if (!input.delegationOperationKeys.includes(input.operationKey)) {
      return denied(input, decisionReference, human.authzVersion, 'AUTHORIZATION_DELEGATION_DENIED')
    }
    if (!input.toolOperationKeys.includes(input.operationKey)) {
      return denied(
        input,
        decisionReference,
        human.authzVersion,
        'AUTHORIZATION_TOOL_BOUNDARY_DENIED'
      )
    }
    if (input.requestedPermissionCodes.some((code) => !input.toolPermissionCodes.includes(code))) {
      return denied(
        input,
        decisionReference,
        human.authzVersion,
        'AUTHORIZATION_TOOL_BOUNDARY_DENIED'
      )
    }
    if (
      input.requestedPermissionCodes.some((code) => !input.delegationPermissionCodes.includes(code))
    ) {
      return denied(input, decisionReference, human.authzVersion, 'AUTHORIZATION_DELEGATION_DENIED')
    }
    if (input.requestedPermissionCodes.some((code) => !human.permissionCodes.includes(code))) {
      return denied(input, decisionReference, human.authzVersion, 'AUTHORIZATION_DELEGATION_DENIED')
    }
    const policy = await this.options.resourcePolicyEvaluator.evaluate({
      humanPrincipalId: input.humanPrincipalId,
      tenantId: input.tenantId,
      ...(input.orgId === undefined ? {} : { orgId: input.orgId }),
      targetAudience: input.targetAudience,
      operationKey: input.operationKey,
      resourceFacts: input.resourceFacts
    })
    if (!policy.allowed) {
      return denied(
        input,
        decisionReference,
        human.authzVersion,
        'AUTHORIZATION_RESOURCE_FACTS_INVALID'
      )
    }
    return Object.freeze({
      allowed: true,
      allowedPermissionCodes: Object.freeze([...input.requestedPermissionCodes]),
      riskClass: input.ownerRiskClass,
      effectiveTenantId: input.tenantId,
      ...(input.orgId === undefined ? {} : { effectiveOrgId: input.orgId }),
      authorizationDecisionReference: decisionReference,
      authzVersion: human.authzVersion,
      reasonCategory: 'AUTHORIZATION_DELEGATION_ALLOWED',
      stepUpRequired: policy.stepUpRequired
    })
  }
}

/** Builds one fail-closed decision without exposing role graphs or near-match details. */
function denied(
  input: ResolveDelegatedAuthorizationInput,
  decisionReference: string,
  authzVersion: string,
  reasonCategory: string
): DelegatedAuthorizationResult {
  return Object.freeze({
    allowed: false,
    allowedPermissionCodes: Object.freeze([]),
    riskClass: input.ownerRiskClass,
    effectiveTenantId: input.tenantId,
    ...(input.orgId === undefined ? {} : { effectiveOrgId: input.orgId }),
    authorizationDecisionReference: decisionReference,
    authzVersion,
    reasonCategory,
    stepUpRequired: false
  })
}

/** Rejects malformed or non-canonical trusted references before consulting Permission-owned facts. */
function validateStableInput(input: ResolveDelegatedAuthorizationInput): void {
  const references = [
    input.humanPrincipalId,
    input.delegationReference,
    input.agentPrincipalId,
    input.toolContractId,
    input.toolContractVersion,
    input.tenantId,
    input.targetAudience,
    input.operationKey
  ]
  if (
    references.some(
      (value) => typeof value !== 'string' || value.length === 0 || value.trim() !== value
    )
  ) {
    throw new Error('AUTHORIZATION_DELEGATION_DENIED')
  }
  for (const values of [input.delegationOperationKeys, input.toolOperationKeys]) {
    if (!Array.isArray(values) || values.length === 0 || new Set(values).size !== values.length) {
      throw new Error('AUTHORIZATION_DELEGATION_DENIED')
    }
  }
  for (const values of [
    input.requestedPermissionCodes,
    input.delegationPermissionCodes,
    input.toolPermissionCodes
  ]) {
    if (!Array.isArray(values) || new Set(values).size !== values.length) {
      throw new Error('AUTHORIZATION_DELEGATION_DENIED')
    }
  }
  if (
    !['DELEGATION_ALLOWED', 'ACTION_GRANT_REQUIRED', 'AI_FORBIDDEN'].includes(input.ownerRiskClass)
  ) {
    throw new Error('AUTHORIZATION_OPERATION_CLASS_INVALID')
  }
}
