import { Policy } from '../../src/domain/aggregates/policy.aggregate'
import { PolicyEffect } from '../../src/domain/enums/policy-effect.enum'
import { PolicySubjectType } from '../../src/domain/enums/policy-subject-type.enum'
import { AuthzRequest, PolicyEngine } from '../../src/domain/services/policy-engine'

const createRequest = (overrides: Partial<AuthzRequest> = {}): AuthzRequest => ({
  accountId: 'account-1',
  permissionCode: 'permission.read',
  tenantId: 'tenant-1',
  subject: {
    role_codes: ['ADMIN']
  },
  resource: {
    resource_type: 'document'
  },
  environment: {},
  action: {},
  ...overrides
})

const createPolicy = (overrides: Partial<Policy> = {}): Policy =>
  new Policy(
    overrides.id ?? 'policy-1',
    overrides.name ?? 'default-policy',
    overrides.effect ?? PolicyEffect.ALLOW,
    overrides.priority ?? 0,
    overrides.subjectType ?? PolicySubjectType.ANY,
    overrides.subjectId ?? null,
    overrides.permissionCode ?? 'permission.read',
    overrides.resourceType ?? null,
    overrides.tenantId ?? null,
    overrides.isEnabled ?? true,
    overrides.conditionAstJson ?? null,
    overrides.description
  )

describe('PolicyEngine', () => {
  let engine: PolicyEngine

  beforeEach(() => {
    engine = new PolicyEngine()
  })

  it('权限判断 / 当没有启用的 policy 时 / 应允许通过 RBAC 结果', () => {
    const decision = engine.evaluate([], createRequest())

    expect(decision).toEqual({
      allowed: true,
      reason: 'No enabled policies, RBAC allow',
      evaluationMode: 'RBAC'
    })
  })

  it('权限判断 / 当同时命中 DENY 和 ALLOW policy 时 / 应优先返回拒绝', () => {
    const decision = engine.evaluate(
      [
        createPolicy({
          id: 'allow-1',
          name: 'allow-admin',
          effect: PolicyEffect.ALLOW,
          subjectType: PolicySubjectType.ROLE,
          subjectId: 'ADMIN'
        }),
        createPolicy({
          id: 'deny-1',
          name: 'deny-admin',
          effect: PolicyEffect.DENY,
          subjectType: PolicySubjectType.ROLE,
          subjectId: 'ADMIN',
          priority: 100
        })
      ],
      createRequest()
    )

    expect(decision.allowed).toBe(false)
    expect(decision.matchedPolicy).toBe('deny-admin')
    expect(decision.evaluationMode).toBe('RBAC_ABAC')
  })

  it('权限判断 / 当存在 policy 但没有一条命中目标范围时 / 应返回拒绝', () => {
    const decision = engine.evaluate(
      [
        createPolicy({
          name: 'other-resource',
          resourceType: 'invoice'
        })
      ],
      createRequest()
    )

    expect(decision).toEqual({
      allowed: false,
      reason: 'Policies exist but none matched target scope',
      evaluationMode: 'RBAC_ABAC'
    })
  })

  it('权限判断 / 当命中 ALLOW policy 时 / 应返回允许', () => {
    const decision = engine.evaluate(
      [
        createPolicy({
          name: 'allow-admin',
          subjectType: PolicySubjectType.ROLE,
          subjectId: 'ADMIN'
        })
      ],
      createRequest()
    )

    expect(decision.allowed).toBe(true)
    expect(decision.matchedPolicy).toBe('allow-admin')
    expect(decision.evaluationMode).toBe('RBAC_ABAC')
  })

  it('权限判断 / 当 tenantId 不匹配时 / 应忽略该 policy', () => {
    const decision = engine.evaluate(
      [
        createPolicy({
          name: 'tenant-2-only',
          tenantId: 'tenant-2'
        })
      ],
      createRequest({
        tenantId: 'tenant-1'
      })
    )

    expect(decision).toEqual({
      allowed: false,
      reason: 'Policies exist but none matched target scope',
      evaluationMode: 'RBAC_ABAC'
    })
  })

  it('权限判断 / 当 condition AST 非法时 / 应返回拒绝', () => {
    const decision = engine.evaluate(
      [
        createPolicy({
          name: 'allow-with-invalid-ast',
          conditionAstJson: '{invalid-json'
        })
      ],
      createRequest()
    )

    expect(decision).toEqual({
      allowed: false,
      reason: 'No ALLOW policy matched',
      evaluationMode: 'RBAC_ABAC'
    })
  })
})
