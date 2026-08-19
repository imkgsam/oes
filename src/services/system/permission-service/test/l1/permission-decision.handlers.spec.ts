import { ResolveDelegatedAuthorizationHandler } from '../../src/application/queries/authorization/resolve-delegated-authorization.handler'
import { ResolveDelegatedAuthorizationQuery } from '../../src/application/queries/authorization/resolve-delegated-authorization.query'
import { ResolvePrincipalAuthorizationHandler } from '../../src/application/queries/authorization/resolve-principal-authorization.handler'
import { ResolvePrincipalAuthorizationQuery } from '../../src/application/queries/authorization/resolve-principal-authorization.query'
import { ResolveWorkloadIssuanceHandler } from '../../src/application/queries/authorization/resolve-workload-issuance.handler'
import { ResolveWorkloadIssuanceQuery } from '../../src/application/queries/authorization/resolve-workload-issuance.query'
import { PermissionDecisionPolicy } from '../../src/domain/services/permission-decision-policy'
import {
  getPermissionCodeDefinition,
  permissionDefinitionFingerprint
} from '@oes/common/authorization'

describe('Permission decision query handlers', () => {
  it('resolves and audits a HUMAN principal decision from independent repository facts', async () => {
    const dependencies = handlerDependencies()
    const handler = new ResolvePrincipalAuthorizationHandler(
      dependencies.principalRepository as never,
      dependencies.permissionRepository as never,
      new PermissionDecisionPolicy(),
      dependencies.auditService as never
    )

    const result = await handler.execute(
      new ResolvePrincipalAuthorizationQuery(principalInput(), protectedCaller('HUMAN'))
    )

    expect(result).toMatchObject({
      allowed: true,
      grantedPermissionCodes: ['site.management.read'],
      reasonCode: 'AUTHORIZATION_GRANTED'
    })
    expect(result.decisionReference).toMatch(/^principal-authorization:/)
    expect(dependencies.auditService.emitIssuanceDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        decisionType: 'PRINCIPAL_AUTHORIZATION',
        requestedPermissionCodes: ['site.management.read'],
        directWorkloadSpiffeId: 'spiffe://local.test/auth-service'
      })
    )
  })

  it('denies principal resolution before repository access when token principal binding mismatches', async () => {
    const dependencies = handlerDependencies()
    const handler = new ResolvePrincipalAuthorizationHandler(
      dependencies.principalRepository as never,
      dependencies.permissionRepository as never,
      new PermissionDecisionPolicy(),
      dependencies.auditService as never
    )
    const caller = protectedCaller('HUMAN')
    caller.verifiedExecutionToken.subject = 'another-human'

    const result = await handler.execute(
      new ResolvePrincipalAuthorizationQuery(principalInput(), caller)
    )

    expect(result).toMatchObject({
      allowed: false,
      reasonCode: 'AUTHORIZATION_DECISION_BINDING_MISMATCH'
    })
    expect(result.authzVersion).toMatch(/^[a-f0-9]{64}$/)
    expect(dependencies.principalRepository.resolveAuthorizationFacts).not.toHaveBeenCalled()
  })

  it('denies principal resolution before repository access when the security version is stale', async () => {
    const dependencies = handlerDependencies()
    const handler = new ResolvePrincipalAuthorizationHandler(
      dependencies.principalRepository as never,
      dependencies.permissionRepository as never,
      new PermissionDecisionPolicy(),
      dependencies.auditService as never
    )
    const caller = protectedCaller('HUMAN')
    caller.verifiedExecutionToken.authzVersion = 'stale-source-authz'

    const result = await handler.execute(
      new ResolvePrincipalAuthorizationQuery(principalInput(), caller)
    )

    expect(result).toMatchObject({
      allowed: false,
      reasonCode: 'AUTHORIZATION_DECISION_BINDING_MISMATCH'
    })
    expect(result.authzVersion).toMatch(/^[a-f0-9]{64}$/)
    expect(dependencies.principalRepository.resolveAuthorizationFacts).not.toHaveBeenCalled()
  })

  it('resolves and audits workload issuance from an independent deployment policy', async () => {
    const dependencies = handlerDependencies()
    const handler = new ResolveWorkloadIssuanceHandler(
      dependencies.workloadRepository as never,
      dependencies.permissionRepository as never,
      new PermissionDecisionPolicy(),
      dependencies.auditService as never
    )

    const result = await handler.execute(
      new ResolveWorkloadIssuanceQuery(workloadInput(), bootstrapCaller())
    )

    expect(result).toMatchObject({
      allowed: true,
      grantedPermissionCodes: ['crm.internal.object_reference.validate'],
      reasonCode: 'AUTHORIZATION_GRANTED'
    })
    expect(result.decisionReference).toMatch(/^workload-issuance:/)
    expect(dependencies.auditService.emitIssuanceDecision).toHaveBeenCalledWith(
      expect.objectContaining({ decisionType: 'WORKLOAD_ISSUANCE' })
    )
  })

  it('resolves delegated authorization from current HUMAN grants and owner snapshots', async () => {
    const dependencies = handlerDependencies()
    const handler = new ResolveDelegatedAuthorizationHandler(
      dependencies.principalRepository as never,
      dependencies.permissionRepository as never,
      new PermissionDecisionPolicy(),
      dependencies.auditService as never
    )

    const result = await handler.execute(
      new ResolveDelegatedAuthorizationQuery(delegatedInput(), protectedCaller('DELEGATED'))
    )

    expect(result).toMatchObject({
      allowed: true,
      allowedPermissionCodes: ['collaboration.task.assign'],
      riskClass: 'ACTION_GRANT_REQUIRED',
      reasonCode: 'AUTHORIZATION_GRANTED'
    })
    expect(result.decisionReference).toMatch(/^delegated-authorization:/)
    expect(dependencies.auditService.emitIssuanceDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        decisionType: 'DELEGATED_AUTHORIZATION',
        policyVersion: 'owner-policy-v1'
      })
    )
  })

  it('returns an opaque delegated version before repository access when caller binding mismatches', async () => {
    const dependencies = handlerDependencies()
    const handler = new ResolveDelegatedAuthorizationHandler(
      dependencies.principalRepository as never,
      dependencies.permissionRepository as never,
      new PermissionDecisionPolicy(),
      dependencies.auditService as never
    )
    const caller = protectedCaller('DELEGATED')
    caller.verifiedExecutionToken.subject = 'another-human'

    const result = await handler.execute(
      new ResolveDelegatedAuthorizationQuery(delegatedInput(), caller)
    )

    expect(result).toMatchObject({
      allowed: false,
      reasonCode: 'AUTHORIZATION_DECISION_BINDING_MISMATCH'
    })
    expect(result.authzVersion).toMatch(/^[a-f0-9]{64}$/)
    expect(dependencies.principalRepository.resolveAuthorizationFacts).not.toHaveBeenCalled()
  })
})

// Builds isolated repository and audit ports for application orchestration tests.
function handlerDependencies() {
  return {
    principalRepository: {
      resolveAuthorizationFacts: jest.fn().mockResolvedValue({
        principalType: 'HUMAN',
        principalId: 'human-1',
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        permissionCodes: ['collaboration.task.assign', 'site.management.read'],
        roleCodes: ['tenant-member'],
        policies: [],
        authzVersion: 'grant-v1',
        decisionReference: 'grant-decision-1'
      })
    },
    permissionRepository: {
      findByCodes: jest.fn().mockImplementation(async (codes: string[]) =>
        codes.map((code) => {
          const definition = getPermissionCodeDefinition(code)!
          return {
            code,
            kind: definition.kind,
            externalApiEligible: definition.externalApiEligible === true,
            allowedScopeLevels: [...definition.allowedScopeLevels],
            definitionFingerprint: permissionDefinitionFingerprint(definition)
          }
        })
      )
    },
    workloadRepository: {
      findPolicy: jest.fn().mockResolvedValue({
        originalWorkloadSpiffeId: 'spiffe://local.test/site-service',
        targetAudience: 'urn:oes:service:asset-service',
        permissionCodes: ['crm.internal.object_reference.validate'],
        scopeLevel: 'TENANT',
        tenantIds: ['tenant-1'],
        policyVersion: 'policy-v1'
      })
    },
    auditService: {
      emitIssuanceDecision: jest.fn()
    }
  }
}

// Builds a valid protected resolver caller with no retained bearer plaintext.
function protectedCaller(principalType: 'HUMAN' | 'DELEGATED') {
  return {
    directWorkloadSpiffeId: 'spiffe://local.test/auth-service',
    certificateThumbprint: 'certificate-thumbprint',
    requestId: 'request-1',
    traceId: 'trace-1',
    verifiedExecutionToken: {
      subject: 'human-1',
      principalType,
      tenantId: 'tenant-1',
      orgId: undefined,
      sessionId: 'session-1',
      delegationId: principalType === 'DELEGATED' ? 'delegation-1' : undefined,
      authzVersion: 'source-authz-v1'
    }
  }
}

// Builds a valid exact-Auth mTLS bootstrap caller without an ExecutionToken.
function bootstrapCaller() {
  return {
    directWorkloadSpiffeId: 'spiffe://local.test/auth-service',
    certificateThumbprint: 'certificate-thumbprint',
    requestId: 'request-1',
    traceId: 'trace-1'
  }
}

// Builds one canonical HUMAN principal request.
function principalInput() {
  return {
    principalType: 'HUMAN' as const,
    principalId: 'human-1',
    scopeLevel: 'TENANT' as const,
    tenantId: 'tenant-1',
    targetAudience: 'urn:oes:service:inventory-service',
    requestedPermissionCodes: ['site.management.read'],
    sessionReference: 'session-1',
    securityReference: 'source-authz-v1'
  }
}

// Builds one canonical workload issuance request.
function workloadInput() {
  return {
    originalWorkloadSpiffeId: 'spiffe://local.test/site-service',
    targetAudience: 'urn:oes:service:asset-service',
    requestedPermissionCodes: ['crm.internal.object_reference.validate'],
    scopeLevel: 'TENANT' as const,
    tenantId: 'tenant-1',
    principalType: 'HUMAN' as const,
    principalId: 'human-1',
    issuancePolicyVersion: 'policy-v1'
  }
}

// Builds one canonical delegated action with owner-resolved immutable snapshots.
function delegatedInput() {
  return {
    humanPrincipalId: 'human-1',
    scopeLevel: 'TENANT' as const,
    tenantId: 'tenant-1',
    targetAudience: 'urn:oes:service:collaboration-service',
    operationKey: 'collaboration.task.assign',
    requestedPermissionCodes: ['collaboration.task.assign'],
    delegatedUpperBound: {
      humanPrincipalId: 'human-1',
      sessionReference: 'session-1',
      securityReference: 'source-authz-v1',
      delegationReference: 'delegation-1',
      delegationVersion: 'delegation-v1',
      delegationActive: true,
      delegationPermissionCodes: ['collaboration.task.assign'],
      agentPrincipalReference: 'agent-1',
      agentPrincipalVersion: 'agent-v1',
      agentPrincipalActive: true,
      agentPermissionCodes: ['collaboration.task.assign'],
      toolContractReference: 'tool-1',
      toolContractVersion: 'tool-v1',
      toolContractActive: true,
      toolPermissionCodes: ['collaboration.task.assign']
    },
    ownerAuthorization: {
      actionReference: 'action-1',
      policyReference: 'owner-policy-1',
      policyVersion: 'owner-policy-v1',
      current: true,
      permissionCodes: ['collaboration.task.assign'],
      codeRiskBaseline: 'ACTION_GRANT_REQUIRED' as const,
      effectiveRiskClass: 'ACTION_GRANT_REQUIRED' as const,
      resourcePolicyAllowed: true,
      resourcePolicyReference: 'resource-policy-1'
    }
  }
}
