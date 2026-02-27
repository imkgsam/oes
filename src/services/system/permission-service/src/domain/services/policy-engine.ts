import { Policy } from '../aggregates/policy.aggregate'
import { PolicyEffect } from '../enums/policy-effect.enum'
import { PolicySubjectType } from '../enums/policy-subject-type.enum'
import { EvaluationContext } from './evaluation-context'

/** Authorization request carrying RBAC + ABAC context */
export interface AuthzRequest {
  accountId: string
  permissionCode: string
  tenantId?: string
  subject: Record<string, any>
  resource: Record<string, any>
  environment: Record<string, any>
  action: Record<string, any>
}

/** Result of an authorization decision */
export interface AuthzDecision {
  allowed: boolean
  matchedPolicy?: string
  reason?: string
}

/**
 * Stateless policy evaluation engine.
 *
 * Rules:
 *  1. No applicable policy → allow (RBAC already passed)
 *  2. DENY-first: any matching DENY → reject
 *  3. If ALLOW policies exist, at least one must match
 */
export class PolicyEngine {
  evaluate(policies: Policy[], request: AuthzRequest): AuthzDecision {
    const applicable = policies.filter((p) => p.isEnabled && this.isApplicable(p, request))

    if (applicable.length === 0) {
      return { allowed: true, reason: 'No applicable policies, default allow' }
    }

    const sorted = applicable.sort((a, b) => b.priority - a.priority)
    const denyPolicies = sorted.filter((p) => p.effect === PolicyEffect.DENY)
    const allowPolicies = sorted.filter((p) => p.effect === PolicyEffect.ALLOW)

    const ctx: EvaluationContext = {
      subject: request.subject,
      resource: request.resource,
      environment: request.environment,
      action: request.action
    }

    // DENY takes precedence
    for (const policy of denyPolicies) {
      if (this.evaluatePolicy(policy, ctx)) {
        return {
          allowed: false,
          matchedPolicy: policy.name,
          reason: `Denied by policy "${policy.name}"`
        }
      }
    }

    // If no ALLOW policies exist, default allow
    if (allowPolicies.length === 0) {
      return { allowed: true, reason: 'No DENY triggered, no ALLOW required' }
    }

    // At least one ALLOW must match
    const matched = allowPolicies.some((p) => this.evaluatePolicy(p, ctx))
    return matched
      ? { allowed: true, reason: 'Allowed by policy' }
      : { allowed: false, reason: 'No ALLOW policy matched' }
  }

  /** Check whether a policy applies to the current request */
  private isApplicable(policy: Policy, request: AuthzRequest): boolean {
    if (policy.tenantId != null && policy.tenantId !== request.tenantId) return false
    if (policy.permissionCode != null && policy.permissionCode !== request.permissionCode)
      return false
    if (policy.resourceType != null && policy.resourceType !== request.resource?.type) return false

    switch (policy.subjectType) {
      case PolicySubjectType.ANY:
        return true
      case PolicySubjectType.ROLE: {
        const codes = request.subject.roleCodes
        if (Array.isArray(codes)) return codes.includes(policy.subjectId)
        return request.subject.roleCode === policy.subjectId
      }
      case PolicySubjectType.ACCOUNT:
        return request.accountId === policy.subjectId
      default:
        return false
    }
  }

  /** Evaluate all conditions of a policy (AND logic); empty conditions → match */
  private evaluatePolicy(policy: Policy, ctx: EvaluationContext): boolean {
    if (policy.conditions.length === 0) return true
    return policy.conditions.every((cond) => cond.evaluate(ctx))
  }
}
