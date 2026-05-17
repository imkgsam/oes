import {
  AuthorizationSubjectFacts,
  BuiltInPolicyTemplateRegistry,
  PolicyInstance,
  PolicyTemplateInstanceAuthorizationService,
  QueryScopeExpression
} from '../../src/application/authorization/resource-policy'

const subject: AuthorizationSubjectFacts = {
  accountId: 'account-1',
  tenantId: 'tenant-1',
  roleIds: ['buyer-role'],
  visibleOrgIds: ['org-1', 'org-2']
}

/** policy creates a complete in-memory policy instance for resource authorization tests. */
function policy(overrides: Partial<PolicyInstance>): PolicyInstance {
  return {
    id: overrides.id ?? 'policy-1',
    tenantId: overrides.tenantId ?? 'tenant-1',
    subjectSelector: overrides.subjectSelector ?? {
      type: 'ACCOUNT',
      accountId: 'account-1'
    },
    permissionCode: overrides.permissionCode ?? 'procurement.purchase.create',
    resourceType: overrides.resourceType ?? 'item',
    templateCode: overrides.templateCode ?? 'resource-field-in-set',
    effect: overrides.effect ?? 'ALLOW',
    params: overrides.params ?? {
      field: 'categoryId',
      allowedValues: ['raw-material']
    },
    enabled: overrides.enabled ?? true,
    priority: overrides.priority ?? 0,
    createdBy: overrides.createdBy ?? 'system',
    updatedBy: overrides.updatedBy ?? 'system',
    createdAt: overrides.createdAt ?? '2026-05-16T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-05-16T00:00:00.000Z'
  }
}

/** service creates the authorization service with an in-memory enabled policy reader. */
function service(instances: PolicyInstance[]) {
  return new PolicyTemplateInstanceAuthorizationService({
    listEnabledPolicyInstances: async () => instances.filter((instance) => instance.enabled)
  })
}

describe('PolicyTemplateInstanceAuthorizationService', () => {
  it('内置 template registry / 应包含第一阶段冻结的模板集合', () => {
    const registry = new BuiltInPolicyTemplateRegistry()

    expect(registry.list().map((template) => template.code).sort()).toEqual([
      'ip-allowlist',
      'org-scope',
      'own-resource',
      'resource-field-equals',
      'resource-field-in-set',
      'resource-field-matches-subject-field',
      'working-hours'
    ])
    expect(registry.get('resource-field-in-set')).toEqual(
      expect.objectContaining({
        category: 'RESOURCE',
        queryScopeCapable: true,
        checkResourceCapable: true
      })
    )
    expect(registry.get('ip-allowlist')).toEqual(
      expect.objectContaining({
        category: 'SECURITY',
        queryScopeCapable: false,
        checkResourceCapable: true
      })
    )
  })

  it('checkResource / 当 policy 引用未知 template code 时 / 应 fail closed', async () => {
    const result = await service([
      policy({
        id: 'invalid-template',
        templateCode: 'tenant-custom-script'
      })
    ]).checkResource({
      subject,
      permissionCode: 'procurement.purchase.create',
      resource: {
        tenantId: 'tenant-1',
        resourceType: 'item',
        categoryId: 'raw-material'
      }
    })

    expect(result.allowed).toBe(false)
    expect(result.reasonCode).toBe('POLICY_TEMPLATE_NOT_FOUND')
    expect(result.trace?.evaluatedPolicyIds).toEqual(['invalid-template'])
  })

  it('checkResource / ACCOUNT resource-field-in-set / 应允许命中值并拒绝未命中值', async () => {
    const authz = service([
      policy({
        params: {
          field: 'categoryId',
          allowedValues: ['raw-material', 'packaging']
        }
      })
    ])

    await expect(
      authz.checkResource({
        subject,
        permissionCode: 'procurement.purchase.create',
        resource: {
          tenantId: 'tenant-1',
          resourceType: 'item',
          categoryId: 'packaging'
        }
      })
    ).resolves.toEqual(
      expect.objectContaining({
        allowed: true,
        matchedPolicyIds: ['policy-1'],
        reasonCode: 'POLICY_ALLOW_MATCHED'
      })
    )

    await expect(
      authz.checkResource({
        subject,
        permissionCode: 'procurement.purchase.create',
        resource: {
          tenantId: 'tenant-1',
          resourceType: 'item',
          categoryId: 'finished-good'
        }
      })
    ).resolves.toEqual(
      expect.objectContaining({
        allowed: false,
        reasonCode: 'POLICY_NO_ALLOW_MATCHED'
      })
    )
  })

  it('checkResource / 多个 ACCOUNT 同 field ALLOW / 应按并集判断', async () => {
    const authz = service([
      policy({
        id: 'account-category-a',
        params: { field: 'categoryId', allowedValues: ['raw-material'] }
      }),
      policy({
        id: 'account-category-b',
        params: { field: 'categoryId', allowedValues: ['packaging'] }
      })
    ])

    const result = await authz.checkResource({
      subject,
      permissionCode: 'procurement.purchase.create',
      resource: {
        tenantId: 'tenant-1',
        resourceType: 'item',
        categoryId: 'packaging'
      }
    })

    expect(result.allowed).toBe(true)
    expect(result.matchedPolicyIds).toEqual(['account-category-b'])
  })

  it('checkResource / TENANT_WIDE 与 ACCOUNT 同 field ALLOW / 应按交集判断', async () => {
    const authz = service([
      policy({
        id: 'tenant-category',
        subjectSelector: { type: 'TENANT_WIDE' },
        params: { field: 'categoryId', allowedValues: ['raw-material', 'packaging'] }
      }),
      policy({
        id: 'account-category',
        params: { field: 'categoryId', allowedValues: ['packaging', 'service'] }
      })
    ])

    await expect(
      authz.checkResource({
        subject,
        permissionCode: 'procurement.purchase.create',
        resource: {
          tenantId: 'tenant-1',
          resourceType: 'item',
          categoryId: 'packaging'
        }
      })
    ).resolves.toEqual(expect.objectContaining({ allowed: true }))

    await expect(
      authz.checkResource({
        subject,
        permissionCode: 'procurement.purchase.create',
        resource: {
          tenantId: 'tenant-1',
          resourceType: 'item',
          categoryId: 'service'
        }
      })
    ).resolves.toEqual(
      expect.objectContaining({
        allowed: false,
        reasonCode: 'POLICY_NO_ALLOW_MATCHED'
      })
    )
  })

  it('checkResource / 不同 field ALLOW / 应按 AND 判断', async () => {
    const authz = service([
      policy({
        id: 'category-policy',
        params: { field: 'categoryId', allowedValues: ['raw-material'] }
      }),
      policy({
        id: 'warehouse-policy',
        params: { field: 'warehouseId', allowedValues: ['W1'] }
      })
    ])

    await expect(
      authz.checkResource({
        subject,
        permissionCode: 'procurement.purchase.create',
        resource: {
          tenantId: 'tenant-1',
          resourceType: 'item',
          categoryId: 'raw-material',
          warehouseId: 'W1'
        }
      })
    ).resolves.toEqual(expect.objectContaining({ allowed: true }))

    await expect(
      authz.checkResource({
        subject,
        permissionCode: 'procurement.purchase.create',
        resource: {
          tenantId: 'tenant-1',
          resourceType: 'item',
          categoryId: 'raw-material',
          warehouseId: 'W2'
        }
      })
    ).resolves.toEqual(expect.objectContaining({ allowed: false }))
  })

  it('checkResource / DENY 命中时 / 应覆盖 ALLOW', async () => {
    const result = await service([
      policy({
        id: 'allow-category',
        params: { field: 'categoryId', allowedValues: ['raw-material'] }
      }),
      policy({
        id: 'deny-category',
        effect: 'DENY',
        params: { field: 'categoryId', allowedValues: ['raw-material'] }
      })
    ]).checkResource({
      subject,
      permissionCode: 'procurement.purchase.create',
      resource: {
        tenantId: 'tenant-1',
        resourceType: 'item',
        categoryId: 'raw-material'
      }
    })

    expect(result.allowed).toBe(false)
    expect(result.deniedPolicyIds).toEqual(['deny-category'])
    expect(result.reasonCode).toBe('POLICY_DENY_MATCHED')
  })

  it('checkResource / 无启用 policy 时 / 应沿用已通过 RBAC 的允许结果', async () => {
    await expect(
      service([]).checkResource({
        subject,
        permissionCode: 'procurement.purchase.create',
        resource: {
          tenantId: 'tenant-1',
          resourceType: 'item',
          categoryId: 'any-category'
        }
      })
    ).resolves.toEqual(
      expect.objectContaining({
        allowed: true,
        reasonCode: 'RBAC_POLICY_BYPASS_NO_ENABLED_POLICY'
      })
    )
  })

  it('checkResource / 有启用 policy 但无 ALLOW 命中时 / 应默认拒绝', async () => {
    const result = await service([
      policy({
        id: 'other-account-policy',
        subjectSelector: {
          type: 'ACCOUNT',
          accountId: 'account-2'
        }
      })
    ]).checkResource({
      subject,
      permissionCode: 'procurement.purchase.create',
      resource: {
        tenantId: 'tenant-1',
        resourceType: 'item',
        categoryId: 'raw-material'
      }
    })

    expect(result.allowed).toBe(false)
    expect(result.reasonCode).toBe('POLICY_NO_ALLOW_MATCHED')
  })

  it('buildQueryScope / 应返回结构化表达式而不是 raw SQL', async () => {
    const result = await service([
      policy({
        id: 'category-a',
        params: { field: 'categoryId', allowedValues: ['raw-material'] }
      }),
      policy({
        id: 'category-b',
        subjectSelector: { type: 'TENANT_WIDE' },
        params: { field: 'categoryId', allowedValues: ['raw-material', 'packaging'] }
      }),
      policy({
        id: 'warehouse',
        params: { field: 'warehouseId', allowedValues: ['W1'] }
      })
    ]).buildQueryScope({
      subject,
      permissionCode: 'procurement.purchase.create',
      resourceType: 'item'
    })

    expect(result.allowed).toBe(true)
    expect(result.scope).toEqual<QueryScopeExpression>({
      and: [
        { field: 'categoryId', op: 'IN', value: ['raw-material'] },
        { field: 'warehouseId', op: 'IN', value: ['W1'] }
      ]
    })
    expect(JSON.stringify(result.scope)).not.toContain('SELECT')
  })

  it('checkResource / working-hours 与 ip-allowlist / 应按环境事实判断', async () => {
    const authz = service([
      policy({
        id: 'working-hours',
        templateCode: 'working-hours',
        resourceType: undefined,
        subjectSelector: { type: 'TENANT_WIDE' },
        params: {
          timezone: 'Asia/Shanghai',
          windows: [{ days: [1, 2, 3, 4, 5], start: '09:00', end: '18:00' }]
        }
      }),
      policy({
        id: 'ip-allowlist',
        templateCode: 'ip-allowlist',
        resourceType: undefined,
        subjectSelector: { type: 'TENANT_WIDE' },
        params: { cidrs: ['203.0.113.10/32'] }
      })
    ])

    await expect(
      authz.checkResource({
        subject,
        permissionCode: 'procurement.purchase.create',
        resource: {
          tenantId: 'tenant-1',
          resourceType: 'item'
        },
        environment: {
          requestTime: '2026-05-18T10:00:00+08:00',
          clientIp: '203.0.113.10'
        }
      })
    ).resolves.toEqual(expect.objectContaining({ allowed: true }))

    await expect(
      authz.checkResource({
        subject,
        permissionCode: 'procurement.purchase.create',
        resource: {
          tenantId: 'tenant-1',
          resourceType: 'item'
        },
        environment: {
          requestTime: '2026-05-18T20:00:00+08:00',
          clientIp: '203.0.113.10'
        }
      })
    ).resolves.toEqual(
      expect.objectContaining({
        allowed: false,
        reasonCode: 'POLICY_NO_ALLOW_MATCHED'
      })
    )
  })

  it('buildQueryScope / security template 不支持通用查询范围时 / 应 fail closed', async () => {
    const result = await service([
      policy({
        id: 'ip-allowlist',
        templateCode: 'ip-allowlist',
        resourceType: undefined,
        subjectSelector: { type: 'TENANT_WIDE' },
        params: { cidrs: ['203.0.113.10/32'] }
      })
    ]).buildQueryScope({
      subject,
      permissionCode: 'procurement.purchase.create',
      resourceType: 'item',
      environment: {
        clientIp: '203.0.113.10'
      }
    })

    expect(result.allowed).toBe(false)
    expect(result.scope).toBeUndefined()
    expect(result.reasonCode).toBe('POLICY_QUERY_SCOPE_UNSUPPORTED')
  })
})
