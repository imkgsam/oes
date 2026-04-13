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
      evaluationMode: 'RBAC',
      explainCode: 'RBAC_POLICY_BYPASS_NO_ENABLED_POLICY',
      policyExplainEntries: []
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
    expect(decision.matchedPolicyId).toBe('deny-1')
    expect(decision.evaluationMode).toBe('RBAC_ABAC')
    expect(decision.explainCode).toBe('POLICY_DENY_MATCHED')
    expect(decision.policyExplainEntries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          policyId: 'deny-1',
          policyName: 'deny-admin',
          effect: 'DENY',
          applicable: true,
          matched: true,
          reasonCode: 'DENY_POLICY_MATCHED'
        }),
        expect.objectContaining({
          policyId: 'allow-1',
          policyName: 'allow-admin',
          effect: 'ALLOW',
          applicable: true
        })
      ])
    )
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
      evaluationMode: 'RBAC_ABAC',
      explainCode: 'POLICY_SCOPE_NOT_MATCHED',
      policyExplainEntries: [
        {
          policyId: 'policy-1',
          policyName: 'other-resource',
          effect: 'ALLOW',
          priority: 0,
          applicable: false,
          matched: false,
          reasonCode: 'RESOURCE_TYPE_MISMATCH'
        }
      ]
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
    expect(decision.matchedPolicyId).toBe('policy-1')
    expect(decision.evaluationMode).toBe('RBAC_ABAC')
    expect(decision.explainCode).toBe('POLICY_ALLOW_MATCHED')
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
      evaluationMode: 'RBAC_ABAC',
      explainCode: 'POLICY_SCOPE_NOT_MATCHED',
      policyExplainEntries: [
        {
          policyId: 'policy-1',
          policyName: 'tenant-2-only',
          effect: 'ALLOW',
          priority: 0,
          applicable: false,
          matched: false,
          reasonCode: 'TENANT_SCOPE_MISMATCH'
        }
      ]
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
      evaluationMode: 'RBAC_ABAC',
      explainCode: 'POLICY_NO_ALLOW_MATCHED',
      policyExplainEntries: [
        {
          policyId: 'policy-1',
          policyName: 'allow-with-invalid-ast',
          effect: 'ALLOW',
          priority: 0,
          applicable: true,
          matched: false,
          reasonCode: 'CONDITION_NOT_MATCHED',
          conditionExplainTree: {
            nodeType: 'COMPARISON',
            path: '$',
            matched: false,
            reasonCode: 'INVALID_CONDITION_AST'
          }
        }
      ]
    })
  })

  it('权限判断 / 当命中带 AST 的 policy 时 / 应返回节点级 explain 树', () => {
    const decision = engine.evaluate(
      [
        createPolicy({
          id: 'allow-ast',
          name: 'allow-document-owner',
          conditionAstJson: JSON.stringify({
            all: [
              {
                comparison: {
                  left: { source: 'resource', key: 'owner_id' },
                  operator: 'EQUALS',
                  right: { type: 'literal', value: 'account-1' }
                }
              },
              {
                comparison: {
                  left: { source: 'action', key: 'name' },
                  operator: 'EQUALS',
                  right: { type: 'literal', value: 'read' }
                }
              }
            ]
          })
        })
      ],
      createRequest({
        resource: {
          resource_type: 'document',
          owner_id: 'account-1'
        },
        action: {
          name: 'read'
        }
      })
    )

    expect(decision.allowed).toBe(true)
    expect(decision.policyExplainEntries).toEqual([
      expect.objectContaining({
        policyId: 'allow-ast',
        matched: true,
        reasonCode: 'ALLOW_POLICY_MATCHED',
        conditionExplainTree: {
          nodeType: 'ALL',
          path: '$',
          matched: true,
          reasonCode: 'ALL_MATCHED',
          children: [
            {
              nodeType: 'COMPARISON',
              path: '$.all[0]',
              matched: true,
              reasonCode: 'COMPARISON_MATCHED',
              source: 'resource',
              key: 'owner_id',
              operator: 'EQUALS',
              actualValue: 'account-1',
              expectedValue: 'account-1'
            },
            {
              nodeType: 'COMPARISON',
              path: '$.all[1]',
              matched: true,
              reasonCode: 'COMPARISON_MATCHED',
              source: 'action',
              key: 'name',
              operator: 'EQUALS',
              actualValue: 'read',
              expectedValue: 'read'
            }
          ]
        }
      })
    ])
  })
})
