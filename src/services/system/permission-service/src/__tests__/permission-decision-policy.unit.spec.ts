import {
  buildOpaqueDecisionAuthzVersion,
  PermissionDecisionPolicy
} from '../domain/services/permission-decision-policy'
import {
  DelegatedAuthorizationInput,
  PrincipalAuthorizationFacts,
  PrincipalAuthorizationInput,
  WorkloadIssuanceInput
} from '../domain/authorization/permission-decision.types'

describe('PermissionDecisionPolicy', () => {
  const policy = new PermissionDecisionPolicy()

  it('allows a canonical HUMAN BUSINESS request only when every current grant is present', () => {
    const decision = policy.resolvePrincipalAuthorization(
      principalInput(),
      principalFacts(['inventory.read', 'inventory.write']),
      businessCatalog(['inventory.read'])
    )

    expect(decision).toMatchObject({
      allowed: true,
      grantedPermissionCodes: ['inventory.read'],
      deniedPermissionCodes: [],
      reasonCode: 'AUTHORIZATION_GRANTED'
    })
  })

  it('denies the complete principal request when one Code is not currently granted', () => {
    const decision = policy.resolvePrincipalAuthorization(
      principalInput({ requestedPermissionCodes: ['inventory.read', 'inventory.write'] }),
      principalFacts(['inventory.read']),
      businessCatalog(['inventory.read', 'inventory.write'])
    )

    expect(decision).toMatchObject({
      allowed: false,
      grantedPermissionCodes: ['inventory.read'],
      deniedPermissionCodes: ['inventory.write'],
      reasonCode: 'AUTHORIZATION_PERMISSION_DENIED'
    })
  })

  it('denies principal issuance when an enabled policy has no applicable allow', () => {
    const decision = policy.resolvePrincipalAuthorization(
      principalInput(),
      principalFacts(['inventory.read'], {
        policies: [
          {
            permissionCode: 'inventory.read',
            effect: 'ALLOW',
            subjectType: 'ACCOUNT',
            subjectId: 'another-account',
            tenantId: 'tenant-1'
          }
        ]
      }),
      businessCatalog(['inventory.read'])
    )

    expect(decision).toMatchObject({
      allowed: false,
      deniedPermissionCodes: ['inventory.read'],
      reasonCode: 'AUTHORIZATION_PERMISSION_DENIED'
    })
  })

  it('intersects DELEGATED issuance with human, delegation, agent and tool bounds', () => {
    const decision = policy.resolvePrincipalAuthorization(
      principalInput({
        principalType: 'DELEGATED',
        principalId: 'human-1',
        requestedPermissionCodes: ['inventory.read'],
        delegatedUpperBound: delegatedUpperBound(['inventory.read'])
      }),
      principalFacts(['inventory.read', 'inventory.write']),
      businessCatalog(['inventory.read'])
    )

    expect(decision).toMatchObject({
      allowed: true,
      grantedPermissionCodes: ['inventory.read'],
      reasonCode: 'AUTHORIZATION_GRANTED'
    })
  })

  it('does not let a wider HUMAN grant widen a ToolContract upper bound', () => {
    const upperBound = delegatedUpperBound(['inventory.write'])
    upperBound.toolPermissionCodes = ['inventory.read']
    const decision = policy.resolvePrincipalAuthorization(
      principalInput({
        principalType: 'DELEGATED',
        principalId: 'human-1',
        requestedPermissionCodes: ['inventory.write'],
        delegatedUpperBound: upperBound
      }),
      principalFacts(['inventory.read', 'inventory.write']),
      businessCatalog(['inventory.write'])
    )

    expect(decision).toMatchObject({
      allowed: false,
      deniedPermissionCodes: ['inventory.write'],
      reasonCode: 'AUTHORIZATION_TOOL_BOUNDARY_DENIED'
    })
  })

  it('reports missing current HUMAN grant before delegated owner boundaries', () => {
    const decision = policy.resolvePrincipalAuthorization(
      principalInput({
        principalType: 'DELEGATED',
        principalId: 'human-1',
        requestedPermissionCodes: ['inventory.write'],
        delegatedUpperBound: delegatedUpperBound(['inventory.write'])
      }),
      principalFacts(['inventory.read']),
      businessCatalog(['inventory.write'])
    )

    expect(decision).toMatchObject({
      allowed: false,
      deniedPermissionCodes: ['inventory.write'],
      reasonCode: 'AUTHORIZATION_PERMISSION_DENIED'
    })
  })

  it('allows an INTERNAL workload request only for the exact current policy tuple', () => {
    const decision = policy.resolveWorkloadIssuance(
      workloadInput(),
      internalCatalog(['asset.internal.resolve']),
      {
        originalWorkloadSpiffeId: 'spiffe://local.test/site-service',
        targetAudience: 'urn:oes:service:asset-service',
        permissionCodes: ['asset.internal.resolve'],
        scopeLevel: 'TENANT',
        tenantIds: ['tenant-1'],
        policyVersion: 'policy-v1'
      }
    )

    expect(decision).toMatchObject({
      allowed: true,
      grantedPermissionCodes: ['asset.internal.resolve'],
      deniedPermissionCodes: [],
      reasonCode: 'AUTHORIZATION_GRANTED'
    })
  })

  it('denies workload issuance when any requested Code is not INTERNAL', () => {
    const decision = policy.resolveWorkloadIssuance(
      workloadInput(),
      businessCatalog(['asset.internal.resolve']),
      {
        originalWorkloadSpiffeId: 'spiffe://local.test/site-service',
        targetAudience: 'urn:oes:service:asset-service',
        permissionCodes: ['asset.internal.resolve'],
        scopeLevel: 'TENANT',
        tenantIds: ['tenant-1'],
        policyVersion: 'policy-v1'
      }
    )

    expect(decision).toMatchObject({
      allowed: false,
      deniedPermissionCodes: ['asset.internal.resolve'],
      reasonCode: 'AUTHORIZATION_PERMISSION_KIND_MISMATCH'
    })
  })

  it('denies workload issuance when principal type or scope is unspecified', () => {
    const input = workloadInput()
    input.principalType = '' as never
    input.scopeLevel = '' as never

    const decision = policy.resolveWorkloadIssuance(
      input,
      internalCatalog(['asset.internal.resolve']),
      {
        originalWorkloadSpiffeId: 'spiffe://local.test/site-service',
        targetAudience: 'urn:oes:service:asset-service',
        permissionCodes: ['asset.internal.resolve'],
        scopeLevel: 'TENANT',
        tenantIds: ['tenant-1'],
        policyVersion: 'policy-v1'
      }
    )

    expect(decision).toMatchObject({
      allowed: false,
      reasonCode: 'AUTHORIZATION_DECISION_BINDING_MISMATCH'
    })
  })

  it('denies principal issuance when current metadata excludes the subject scope', () => {
    const input = principalInput({ scopeLevel: 'SYSTEM', tenantId: undefined })
    const decision = policy.resolvePrincipalAuthorization(
      input,
      principalFacts(['inventory.read'], {
        scopeLevel: 'SYSTEM',
        tenantId: undefined
      }),
      businessCatalog(['inventory.read'], { allowedScopeLevels: ['TENANT'] })
    )

    expect(decision).toMatchObject({
      allowed: false,
      grantedPermissionCodes: [],
      reasonCode: 'AUTHORIZATION_SCOPE_MISMATCH'
    })
  })

  it('denies MACHINE principal issuance when current metadata is HUMAN-only', () => {
    const input = principalInput({ principalType: 'MACHINE', principalId: 'machine-1' })
    const decision = policy.resolvePrincipalAuthorization(
      input,
      principalFacts(['inventory.read'], {
        principalType: 'MACHINE',
        principalId: 'machine-1'
      }),
      businessCatalog(['inventory.read'], { assignableTo: ['HUMAN'] })
    )

    expect(decision).toMatchObject({
      allowed: false,
      grantedPermissionCodes: [],
      reasonCode: 'AUTHORIZATION_PRINCIPAL_TYPE_MISMATCH'
    })
  })

  it('denies issuance when persisted Permission metadata is stale', () => {
    const decision = policy.resolvePrincipalAuthorization(
      principalInput(),
      principalFacts(['inventory.read']),
      businessCatalog(['inventory.read'], { metadataCurrent: false })
    )

    expect(decision).toMatchObject({
      allowed: false,
      grantedPermissionCodes: [],
      reasonCode: 'AUTHORIZATION_PERMISSION_METADATA_STALE'
    })
  })

  it('allows an ACTION_GRANT_REQUIRED delegated upper bound after every restrictive snapshot intersects', () => {
    const decision = policy.resolveDelegatedAuthorization(
      delegatedInput(),
      principalFacts(['collaboration.task.assign']),
      businessCatalog(['collaboration.task.assign'])
    )

    expect(decision).toMatchObject({
      allowed: true,
      allowedPermissionCodes: ['collaboration.task.assign'],
      deniedPermissionCodes: [],
      riskClass: 'ACTION_GRANT_REQUIRED',
      reasonCode: 'AUTHORIZATION_GRANTED'
    })
  })

  it('denies delegated authorization when tenant policy attempts to lower the owner risk baseline', () => {
    const input = delegatedInput()
    input.ownerAuthorization.effectiveRiskClass = 'DELEGATION_ALLOWED'

    const decision = policy.resolveDelegatedAuthorization(
      input,
      principalFacts(['collaboration.task.assign']),
      businessCatalog(['collaboration.task.assign'])
    )

    expect(decision).toMatchObject({
      allowed: false,
      riskClass: 'DELEGATION_ALLOWED',
      reasonCode: 'AUTHORIZATION_OPERATION_CLASS_INVALID'
    })
  })

  it('always denies AI_FORBIDDEN delegated operations', () => {
    const input = delegatedInput()
    input.ownerAuthorization.codeRiskBaseline = 'AI_FORBIDDEN'
    input.ownerAuthorization.effectiveRiskClass = 'AI_FORBIDDEN'

    const decision = policy.resolveDelegatedAuthorization(
      input,
      principalFacts(['collaboration.task.assign']),
      businessCatalog(['collaboration.task.assign'])
    )

    expect(decision).toMatchObject({
      allowed: false,
      reasonCode: 'AUTHORIZATION_OPERATION_FORBIDDEN_FOR_AI'
    })
  })

  it('returns opaque principal versions bound to trusted grant versions and effective Codes', () => {
    const baseline = policy.resolvePrincipalAuthorization(
      principalInput(),
      principalFacts(['inventory.read']),
      businessCatalog(['inventory.read'])
    )
    const changedVersion = policy.resolvePrincipalAuthorization(
      principalInput(),
      principalFacts(['inventory.read'], { authzVersion: 'grant-v2' }),
      businessCatalog(['inventory.read'])
    )
    const changedCodes = policy.resolvePrincipalAuthorization(
      principalInput({ requestedPermissionCodes: ['inventory.write'] }),
      principalFacts(['inventory.write']),
      businessCatalog(['inventory.write'])
    )
    const denied = policy.resolvePrincipalAuthorization(
      principalInput(),
      principalFacts([]),
      businessCatalog(['inventory.read'])
    )

    expect(baseline.authzVersion).toMatch(/^[a-f0-9]{64}$/)
    expect(baseline.authzVersion).not.toContain('grant-v1')
    expect(changedVersion.authzVersion).not.toBe(baseline.authzVersion)
    expect(changedCodes.authzVersion).not.toBe(baseline.authzVersion)
    expect(denied.authzVersion).toMatch(/^[a-f0-9]{64}$/)
  })

  it('returns opaque workload versions bound to policy versions and granted INTERNAL Codes', () => {
    const policyFacts = {
      originalWorkloadSpiffeId: 'spiffe://local.test/site-service',
      targetAudience: 'urn:oes:service:asset-service',
      permissionCodes: ['asset.internal.resolve'],
      scopeLevel: 'TENANT' as const,
      tenantIds: ['tenant-1'],
      policyVersion: 'policy-v1'
    }
    const baseline = policy.resolveWorkloadIssuance(
      workloadInput(),
      internalCatalog(['asset.internal.resolve']),
      policyFacts
    )
    const changedVersion = policy.resolveWorkloadIssuance(
      { ...workloadInput(), issuancePolicyVersion: 'policy-v2' },
      internalCatalog(['asset.internal.resolve']),
      { ...policyFacts, policyVersion: 'policy-v2' }
    )
    const changedCodes = policy.resolveWorkloadIssuance(
      { ...workloadInput(), requestedPermissionCodes: ['asset.internal.write'] },
      internalCatalog(['asset.internal.write']),
      { ...policyFacts, permissionCodes: ['asset.internal.write'] }
    )

    expect(baseline.authzVersion).toMatch(/^[a-f0-9]{64}$/)
    expect(baseline.authzVersion).not.toContain('policy-v1')
    expect(changedVersion.authzVersion).not.toBe(baseline.authzVersion)
    expect(changedCodes.authzVersion).not.toBe(baseline.authzVersion)
  })

  it('returns opaque delegated versions bound to every trusted version and effective Code set', () => {
    const baselineInput = delegatedInput()
    const baseline = policy.resolveDelegatedAuthorization(
      baselineInput,
      principalFacts(['collaboration.task.assign']),
      businessCatalog(['collaboration.task.assign'])
    )
    const changedVersions = [
      { humanAuthzVersion: 'grant-v2' },
      { delegationVersion: 'delegation-v2' },
      { agentPrincipalVersion: 'agent-v2' },
      { toolContractVersion: 'tool-v2' },
      { ownerPolicyVersion: 'owner-policy-v2' }
    ].map((change) => {
      const input = delegatedInput()
      if (change.delegationVersion) {
        input.delegatedUpperBound.delegationVersion = change.delegationVersion
      }
      if (change.agentPrincipalVersion) {
        input.delegatedUpperBound.agentPrincipalVersion = change.agentPrincipalVersion
      }
      if (change.toolContractVersion) {
        input.delegatedUpperBound.toolContractVersion = change.toolContractVersion
      }
      if (change.ownerPolicyVersion) {
        input.ownerAuthorization.policyVersion = change.ownerPolicyVersion
      }
      return policy.resolveDelegatedAuthorization(
        input,
        principalFacts(['collaboration.task.assign'], {
          authzVersion: change.humanAuthzVersion ?? 'grant-v1'
        }),
        businessCatalog(['collaboration.task.assign'])
      )
    })
    const expandedInput = delegatedInput()
    const expandedCodes = ['collaboration.task.assign', 'collaboration.task.read']
    expandedInput.requestedPermissionCodes = expandedCodes
    expandedInput.delegatedUpperBound.delegationPermissionCodes = expandedCodes
    expandedInput.delegatedUpperBound.agentPermissionCodes = expandedCodes
    expandedInput.delegatedUpperBound.toolPermissionCodes = expandedCodes
    expandedInput.ownerAuthorization.permissionCodes = expandedCodes
    const changedCodes = policy.resolveDelegatedAuthorization(
      expandedInput,
      principalFacts(expandedCodes),
      businessCatalog(expandedCodes)
    )

    expect(baseline.authzVersion).toMatch(/^[a-f0-9]{64}$/)
    for (const rawVersion of [
      'grant-v1',
      'delegation-v1',
      'agent-v1',
      'tool-v1',
      'owner-policy-v1'
    ]) {
      expect(baseline.authzVersion).not.toContain(rawVersion)
    }
    for (const changed of changedVersions) {
      expect(changed.authzVersion).not.toBe(baseline.authzVersion)
    }
    expect(changedCodes.authzVersion).not.toBe(baseline.authzVersion)
  })

  it('keeps opaque versions deterministic when equivalent grant facts are reordered or repeated', () => {
    const canonical = policy.resolvePrincipalAuthorization(
      principalInput(),
      principalFacts(['inventory.read', 'inventory.write']),
      businessCatalog(['inventory.read'])
    )
    const noisy = policy.resolvePrincipalAuthorization(
      principalInput(),
      principalFacts(['inventory.write', 'inventory.read', 'inventory.read']),
      businessCatalog(['inventory.read'])
    )

    expect(noisy.authzVersion).toBe(canonical.authzVersion)
  })

  it('canonicalizes version fields and effective Codes before hashing', () => {
    const baseline = buildOpaqueDecisionAuthzVersion({
      decisionType: 'WORKLOAD_ISSUANCE',
      fields: [
        ['tenantId', 'tenant-1'],
        ['trustedPolicyVersion', 'policy-v1']
      ],
      effectivePermissionCodes: ['z.internal.resolve', 'a.internal.resolve', 'a.internal.resolve']
    })
    const reordered = buildOpaqueDecisionAuthzVersion({
      decisionType: 'WORKLOAD_ISSUANCE',
      fields: [
        ['trustedPolicyVersion', 'policy-v1'],
        ['tenantId', 'tenant-1']
      ],
      effectivePermissionCodes: ['a.internal.resolve', 'z.internal.resolve']
    })

    expect(reordered).toBe(baseline)
    expect(baseline).toMatch(/^[a-f0-9]{64}$/)
  })
})

// Builds the smallest valid tenant principal decision input for focused policy tests.
function principalInput(
  override: Partial<PrincipalAuthorizationInput> = {}
): PrincipalAuthorizationInput {
  return {
    principalType: 'HUMAN',
    principalId: 'human-1',
    scopeLevel: 'TENANT',
    tenantId: 'tenant-1',
    targetAudience: 'urn:oes:service:inventory-service',
    requestedPermissionCodes: ['inventory.read'],
    sessionReference: 'session-1',
    securityReference: 'security-v1',
    ...override
  }
}

// Builds active HUMAN grant facts with optional policy overrides.
function principalFacts(
  permissionCodes: string[],
  override: Partial<PrincipalAuthorizationFacts> = {}
): PrincipalAuthorizationFacts {
  return {
    principalType: 'HUMAN',
    principalId: 'human-1',
    scopeLevel: 'TENANT',
    tenantId: 'tenant-1',
    permissionCodes,
    roleCodes: ['tenant-member'],
    policies: [],
    authzVersion: 'grant-v1',
    decisionReference: 'grant-decision-1',
    ...override
  }
}

// Builds the trusted Auth-orchestrated delegated upper-bound snapshot.
function delegatedUpperBound(permissionCodes: string[]) {
  return {
    humanPrincipalId: 'human-1',
    sessionReference: 'session-1',
    securityReference: 'security-v1',
    delegationReference: 'delegation-1',
    delegationVersion: 'delegation-v1',
    delegationActive: true,
    delegationPermissionCodes: permissionCodes,
    agentPrincipalReference: 'agent-1',
    agentPrincipalVersion: 'agent-v1',
    agentPrincipalActive: true,
    agentPermissionCodes: permissionCodes,
    toolContractReference: 'tool-1',
    toolContractVersion: 'tool-v1',
    toolContractActive: true,
    toolPermissionCodes: permissionCodes
  }
}

// Builds the smallest valid workload issuance tuple and attribution.
function workloadInput(): WorkloadIssuanceInput {
  return {
    originalWorkloadSpiffeId: 'spiffe://local.test/site-service',
    targetAudience: 'urn:oes:service:asset-service',
    requestedPermissionCodes: ['asset.internal.resolve'],
    scopeLevel: 'TENANT',
    tenantId: 'tenant-1',
    principalType: 'HUMAN',
    principalId: 'human-1',
    issuancePolicyVersion: 'policy-v1'
  }
}

// Builds one delegated action with owner-authenticated risk and resource results.
function delegatedInput(): DelegatedAuthorizationInput {
  return {
    humanPrincipalId: 'human-1',
    scopeLevel: 'TENANT',
    tenantId: 'tenant-1',
    targetAudience: 'urn:oes:service:collaboration-service',
    operationKey: 'collaboration.task.assign',
    requestedPermissionCodes: ['collaboration.task.assign'],
    delegatedUpperBound: delegatedUpperBound(['collaboration.task.assign']),
    ownerAuthorization: {
      actionReference: 'action-1',
      policyReference: 'owner-policy-1',
      policyVersion: 'owner-policy-v1',
      current: true,
      permissionCodes: ['collaboration.task.assign'],
      codeRiskBaseline: 'ACTION_GRANT_REQUIRED',
      effectiveRiskClass: 'ACTION_GRANT_REQUIRED',
      resourcePolicyAllowed: true,
      resourcePolicyReference: 'resource-policy-1'
    }
  }
}

// Maps test Codes to BUSINESS catalog metadata.
function businessCatalog(
  codes: string[],
  overrides: Partial<{
    allowedScopeLevels: Array<'SYSTEM' | 'TENANT'>
    assignableTo: Array<'HUMAN' | 'MACHINE' | 'WORKLOAD_POLICY'>
    metadataCurrent: boolean
  }> = {}
) {
  return codes.map((code) => ({
    code,
    kind: 'BUSINESS' as const,
    allowedScopeLevels: ['SYSTEM', 'TENANT'] as Array<'SYSTEM' | 'TENANT'>,
    assignableTo: ['HUMAN', 'MACHINE'] as Array<'HUMAN' | 'MACHINE' | 'WORKLOAD_POLICY'>,
    metadataCurrent: true,
    ...overrides
  }))
}

// Maps test Codes to INTERNAL catalog metadata.
function internalCatalog(codes: string[]) {
  return codes.map((code) => ({
    code,
    kind: 'INTERNAL' as const,
    allowedScopeLevels: ['SYSTEM', 'TENANT'] as Array<'SYSTEM' | 'TENANT'>,
    assignableTo: ['WORKLOAD_POLICY'] as Array<'HUMAN' | 'MACHINE' | 'WORKLOAD_POLICY'>,
    metadataCurrent: true
  }))
}
