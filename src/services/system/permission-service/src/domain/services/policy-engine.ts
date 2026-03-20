import { Policy } from '../aggregates/policy.aggregate'
import { PolicyEffect } from '../enums/policy-effect.enum'
import { PolicySubjectType } from '../enums/policy-subject-type.enum'
import { EvaluationContext } from './evaluation-context'
import {
  evaluatePolicyConditionAst,
  parsePolicyConditionAstJson
} from './policy-condition-ast'

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
  reason?: string
  evaluationMode?: 'RBAC' | 'RBAC_ABAC'
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
        evaluationMode: 'RBAC'
      }
    }

    const applicable = policies.filter((policy) => policy.isEnabled && this.isApplicable(policy, request))

    if (applicable.length === 0) {
      return {
        allowed: false,
        reason: 'Policies exist but none matched target scope',
        evaluationMode: 'RBAC_ABAC'
      }
    }

    const sorted = [...applicable].sort((a, b) => b.priority - a.priority)
    const denyPolicies = sorted.filter((policy) => policy.effect === PolicyEffect.DENY)
    const allowPolicies = sorted.filter((policy) => policy.effect === PolicyEffect.ALLOW)

    const ctx: EvaluationContext = {
      subject: request.subject,
      resource: request.resource,
      environment: request.environment,
      action: request.action
    }

    for (const policy of denyPolicies) {
      if (this.evaluatePolicy(policy, ctx)) {
        return {
          allowed: false,
          matchedPolicy: policy.name,
          reason: `Denied by policy "${policy.name}"`,
          evaluationMode: 'RBAC_ABAC'
        }
      }
    }

    if (allowPolicies.length === 0) {
      return {
        allowed: false,
        reason: 'Policies exist but no ALLOW policy is configured',
        evaluationMode: 'RBAC_ABAC'
      }
    }

    const matchedPolicy = allowPolicies.find((policy) => this.evaluatePolicy(policy, ctx))
    if (matchedPolicy) {
      return {
        allowed: true,
        matchedPolicy: matchedPolicy.name,
        reason: `Allowed by policy "${matchedPolicy.name}"`,
        evaluationMode: 'RBAC_ABAC'
      }
    }

    return {
      allowed: false,
      reason: 'No ALLOW policy matched',
      evaluationMode: 'RBAC_ABAC'
    }
  }

  private isApplicable(policy: Policy, request: AuthzRequest): boolean {
    const resourceType = request.resource?.resource_type ?? request.resource?.type
    if (policy.tenantId != null && policy.tenantId !== request.tenantId) return false
    if (policy.permissionCode !== request.permissionCode) return false
    if (policy.resourceType != null && policy.resourceType !== resourceType) return false

    switch (policy.subjectType) {
      case PolicySubjectType.ANY:
        return true
      case PolicySubjectType.ROLE: {
        const roleCodes = request.subject.role_codes ?? request.subject.roleCodes
        if (Array.isArray(roleCodes)) return roleCodes.includes(policy.subjectId)

        const roleCode = request.subject.role_code ?? request.subject.roleCode
        return roleCode === policy.subjectId
      }
      case PolicySubjectType.ACCOUNT:
        return request.accountId === policy.subjectId
      default:
        return false
    }
  }

  private evaluatePolicy(policy: Policy, ctx: EvaluationContext): boolean {
    if (policy.conditionAstJson) {
      try {
        const ast = parsePolicyConditionAstJson(policy.conditionAstJson)
        return evaluatePolicyConditionAst(ast, ctx)
      } catch {
        return false
      }
    }

    return true
  }
}
