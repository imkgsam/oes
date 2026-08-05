import { PermissionDecisionPolicy } from '../../src/domain/services/permission-decision-policy'
import {
  DelegatedAuthorizationInput,
  PrincipalAuthorizationFacts,
  PrincipalAuthorizationInput,
  WorkloadIssuanceInput
} from '../../src/domain/authorization/permission-decision.types'

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
      authzVersion: 'policy-v1',
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
function businessCatalog(codes: string[]) {
  return codes.map((code) => ({ code, kind: 'BUSINESS' as const }))
}

// Maps test Codes to INTERNAL catalog metadata.
function internalCatalog(codes: string[]) {
  return codes.map((code) => ({ code, kind: 'INTERNAL' as const }))
}
