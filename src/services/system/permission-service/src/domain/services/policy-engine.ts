import { Policy } from '../aggregates/policy.aggregate'
import { PolicyEffect } from '../enums/policy-effect.enum'
import { PolicySubjectType } from '../enums/policy-subject-type.enum'
import { EvaluationContext } from './evaluation-context'
import {
  buildInvalidPolicyConditionExplainTree,
  evaluatePolicyConditionAstWithExplain,
  parsePolicyConditionAstJson
} from './policy-condition-ast'
import type { PolicyConditionExplainNode } from './policy-condition-ast'

export interface AuthzRequest {
  accountId: string
  permissionCode: string
  tenantId?: string
  subject: Record<string, any>
  resource: Record<string, any>
  environment: Record<string, any>
  action: Record<string, any>
}

export interface AuthzDecision {
  allowed: boolean
  matchedPolicy?: string
  matchedPolicyId?: string
  reason?: string
  evaluationMode?: 'RBAC' | 'RBAC_ABAC'
  explainCode?: string
  policyExplainEntries?: PolicyExplainEntry[]
}

export interface PolicyExplainEntry {
  policyId: string
  policyName: string
  effect: 'ALLOW' | 'DENY'
  priority: number
  applicable: boolean
  matched: boolean
  reasonCode: string
  conditionExplainTree?: PolicyConditionExplainNode
}

/**
 * Stateless policy evaluation engine.
 *
 * Rules:
 *  1. No applicable policy => allow (RBAC already passed)
 *  2. DENY-first: any matching DENY => reject
 *  3. If ALLOW policies exist, at least one must match
 */
export class PolicyEngine {
  evaluate(policies: Policy[], request: AuthzRequest): AuthzDecision {
    if (policies.length === 0) {
      return {
        allowed: true,
        reason: 'No enabled policies, RBAC allow',
        evaluationMode: 'RBAC',
        explainCode: 'RBAC_POLICY_BYPASS_NO_ENABLED_POLICY',
        policyExplainEntries: []
      }
    }

    const sorted = [...policies].sort((a, b) => b.priority - a.priority)
    const explainEntries: PolicyExplainEntry[] = sorted.map((policy) =>
      this.buildExplainEntry(policy, request)
    )
    const applicable = explainEntries.filter((entry) => entry.applicable)

    if (applicable.length === 0) {
      return {
        allowed: false,
        reason: 'Policies exist but none matched target scope',
        evaluationMode: 'RBAC_ABAC',
        explainCode: 'POLICY_SCOPE_NOT_MATCHED',
        policyExplainEntries: explainEntries
      }
    }

    const denyEntries = applicable.filter((entry) => entry.effect === 'DENY')
    const allowEntries = applicable.filter((entry) => entry.effect === 'ALLOW')

    for (const entry of denyEntries) {
      if (entry.matched) {
        return {
          allowed: false,
          matchedPolicy: entry.policyName,
          matchedPolicyId: entry.policyId,
          reason: `Denied by policy "${entry.policyName}"`,
          evaluationMode: 'RBAC_ABAC',
          explainCode: 'POLICY_DENY_MATCHED',
          policyExplainEntries: explainEntries
        }
      }
    }

    if (allowEntries.length === 0) {
      return {
        allowed: false,
        reason: 'Policies exist but no ALLOW policy is configured',
        evaluationMode: 'RBAC_ABAC',
        explainCode: 'POLICY_NO_ALLOW_CONFIGURED',
        policyExplainEntries: explainEntries
      }
    }

    const matchedPolicy = allowEntries.find((entry) => entry.matched)
    if (matchedPolicy) {
      return {
        allowed: true,
        matchedPolicy: matchedPolicy.policyName,
        matchedPolicyId: matchedPolicy.policyId,
        reason: `Allowed by policy "${matchedPolicy.policyName}"`,
        evaluationMode: 'RBAC_ABAC',
        explainCode: 'POLICY_ALLOW_MATCHED',
        policyExplainEntries: explainEntries
      }
    }

    return {
      allowed: false,
      reason: 'No ALLOW policy matched',
      evaluationMode: 'RBAC_ABAC',
      explainCode: 'POLICY_NO_ALLOW_MATCHED',
      policyExplainEntries: explainEntries
    }
  }

  private buildExplainEntry(policy: Policy, request: AuthzRequest): PolicyExplainEntry {
    const applicability = this.determineApplicability(policy, request)
    const evaluationContext = {
      subject: request.subject,
      resource: request.resource,
      environment: request.environment,
      action: request.action
    }
    const policyEvaluation = applicability.applicable
      ? this.evaluatePolicy(policy, evaluationContext)
      : { matched: false, explainTree: undefined }

    return {
      policyId: policy.id,
      policyName: policy.name,
      effect: policy.effect === PolicyEffect.ALLOW ? 'ALLOW' : 'DENY',
      priority: policy.priority,
      applicable: applicability.applicable,
      matched: policyEvaluation.matched,
      reasonCode: !applicability.applicable
        ? applicability.reasonCode
        : policyEvaluation.matched
          ? policy.effect === PolicyEffect.DENY
            ? 'DENY_POLICY_MATCHED'
            : 'ALLOW_POLICY_MATCHED'
          : 'CONDITION_NOT_MATCHED',
      conditionExplainTree: policyEvaluation.explainTree
    }
  }

  private determineApplicability(
    policy: Policy,
    request: AuthzRequest
  ): { applicable: boolean; reasonCode: string } {
    const resourceType = request.resource?.resource_type ?? request.resource?.type
    if (policy.tenantId != null && policy.tenantId !== request.tenantId) {
      return { applicable: false, reasonCode: 'TENANT_SCOPE_MISMATCH' }
    }
    if (policy.permissionCode !== request.permissionCode) {
      return { applicable: false, reasonCode: 'PERMISSION_CODE_MISMATCH' }
    }
    if (policy.resourceType != null && policy.resourceType !== resourceType) {
      return { applicable: false, reasonCode: 'RESOURCE_TYPE_MISMATCH' }
    }

    switch (policy.subjectType) {
      case PolicySubjectType.ANY:
        return { applicable: true, reasonCode: 'SUBJECT_ANY' }
      case PolicySubjectType.ROLE: {
        const roleCodes = request.subject.role_codes ?? request.subject.roleCodes
        if (Array.isArray(roleCodes)) {
          return {
            applicable: roleCodes.includes(policy.subjectId),
            reasonCode: roleCodes.includes(policy.subjectId) ? 'ROLE_MATCHED' : 'ROLE_NOT_MATCHED'
          }
        }

        const roleCode = request.subject.role_code ?? request.subject.roleCode
        return {
          applicable: roleCode === policy.subjectId,
          reasonCode: roleCode === policy.subjectId ? 'ROLE_MATCHED' : 'ROLE_NOT_MATCHED'
        }
      }
      case PolicySubjectType.ACCOUNT:
        return {
          applicable: request.accountId === policy.subjectId,
          reasonCode: request.accountId === policy.subjectId ? 'ACCOUNT_MATCHED' : 'ACCOUNT_NOT_MATCHED'
        }
      default:
        return { applicable: false, reasonCode: 'UNSUPPORTED_SUBJECT_TYPE' }
    }
  }

  private evaluatePolicy(
    policy: Policy,
    ctx: EvaluationContext
  ): { matched: boolean; explainTree?: PolicyConditionExplainNode } {
    if (policy.conditionAstJson) {
      try {
        const ast = parsePolicyConditionAstJson(policy.conditionAstJson)
        return evaluatePolicyConditionAstWithExplain(ast, ctx)
      } catch {
        return {
          matched: false,
          explainTree: buildInvalidPolicyConditionExplainTree('INVALID_CONDITION_AST')
        }
      }
    }

    return {
      matched: true
    }
  }
}
