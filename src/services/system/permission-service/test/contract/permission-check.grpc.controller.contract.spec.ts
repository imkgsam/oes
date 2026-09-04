import { CheckPermissionQuery } from '../../src/application/queries/authorization/check-permission.query'
import { BatchCheckPermissionQuery } from '../../src/application/queries/authorization/batch-check-permission.query'
import { PermissionCheckGrpcController } from '../../src/interfaces/grpc/permission-check.grpc.controller'
import * as permissionDecisionGuard from '../../src/interfaces/guards/permission-decision-transport.guard'
import { ResolvePrincipalAuthorizationQuery } from '../../src/application/queries/authorization/resolve-principal-authorization.query'
import { ResolveWorkloadIssuanceQuery } from '../../src/application/queries/authorization/resolve-workload-issuance.query'
import { ResolveDelegatedAuthorizationQuery } from '../../src/application/queries/authorization/resolve-delegated-authorization.query'

describe('PermissionCheckGrpcController Contract', () => {
  afterEach(() => jest.restoreAllMocks())
  it('gRPC 检查权限 / 当 RBAC 允许时 / 应返回 AuthorizationDecisionResponse', async () => {
    const queryBus = {
      execute: jest.fn().mockResolvedValue(true)
    }
    const controller = new PermissionCheckGrpcController(
      queryBus as any,
      { emitAuthorizationDecision: jest.fn() } as any
    )

    const result = await controller.checkPermission({
      accountId: 'account-id',
      permissionCode: 'permission.read'
    } as any)

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining<CheckPermissionQuery>({
        accountId: 'account-id',
        permissionCode: 'permission.read'
      })
    )
    expect(result).toEqual({
      allowed: true,
      evaluationMode: 1,
      matchedPolicy: '',
      reason: 'RBAC_GRANTED',
      explainCode: 'RBAC_GRANTED',
      matchedPolicyId: '',
      policyExplainEntries: []
    })
  })

  it('gRPC 批量检查权限 / 当收到多项请求时 / 应保留 requestId 并返回逐项结果', async () => {
    const queryBus = {
      execute: jest.fn().mockResolvedValue([
        {
          requestId: 'item-1',
          allowed: true,
          evaluationMode: 'RBAC',
          matchedPolicy: '',
          reason: 'RBAC_GRANTED',
          explainCode: 'RBAC_GRANTED'
        },
        {
          requestId: 'item-2',
          allowed: false,
          evaluationMode: 'RBAC',
          matchedPolicy: '',
          reason: 'RBAC_DENIED',
          explainCode: 'RBAC_DENIED'
        }
      ])
    }
    const permissionAuditService = {
      emitAuthorizationDecision: jest.fn()
    }
    const controller = new PermissionCheckGrpcController(
      queryBus as any,
      permissionAuditService as any
    )

    const result = await controller.batchCheckPermission({
      items: [
        {
          requestId: 'item-1',
          accountId: 'account-1',
          permissionCode: 'permission.read',
          tenantId: 'tenant-1'
        },
        {
          requestId: 'item-2',
          accountId: 'account-2',
          permissionCode: 'permission.write'
        }
      ]
    } as any)

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining<BatchCheckPermissionQuery>({
        items: [
          {
            requestId: 'item-1',
            accountId: 'account-1',
            permissionCode: 'permission.read',
            tenantId: 'tenant-1'
          },
          {
            requestId: 'item-2',
            accountId: 'account-2',
            permissionCode: 'permission.write',
            tenantId: undefined
          }
        ]
      })
    )
    expect(result).toEqual({
      decisions: [
        {
          requestId: 'item-1',
          allowed: true,
          evaluationMode: 1,
          matchedPolicy: '',
          reason: 'RBAC_GRANTED',
          explainCode: 'RBAC_GRANTED'
        },
        {
          requestId: 'item-2',
          allowed: false,
          evaluationMode: 1,
          matchedPolicy: '',
          reason: 'RBAC_DENIED',
          explainCode: 'RBAC_DENIED'
        }
      ]
    })
    expect(permissionAuditService.emitAuthorizationDecision).toHaveBeenCalledTimes(2)
  })

  it('maps protected principal authorization without deriving identity in the controller', async () => {
    const caller = verifiedCaller('HUMAN')
    jest
      .spyOn(permissionDecisionGuard, 'getPermissionDecisionCallerContext')
      .mockReturnValue(caller)
    const queryBus = {
      execute: jest.fn().mockResolvedValue({
        allowed: true,
        grantedPermissionCodes: ['inventory.read'],
        deniedPermissionCodes: [],
        decisionReference: 'principal-authorization:1',
        authzVersion: 'grant-v1',
        reasonCode: 'AUTHORIZATION_GRANTED'
      })
    }
    const controller = new PermissionCheckGrpcController(queryBus as never, {} as never)
    const request = {
      principalType: 1,
      principalId: 'human-1',
      scopeLevel: 2,
      tenantId: 'tenant-1',
      targetAudience: 'urn:oes:service:inventory-service',
      requestedBusinessPermissionCodes: ['inventory.read'],
      sessionReference: 'session-1',
      securityReference: 'source-authz-v1'
    }

    const result = await controller.resolvePrincipalAuthorization(request)

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining<ResolvePrincipalAuthorizationQuery>({
        input: expect.objectContaining({
          principalType: 'HUMAN',
          scopeLevel: 'TENANT',
          requestedPermissionCodes: ['inventory.read']
        }),
        caller
      })
    )
    expect(result).toMatchObject({
      allowed: true,
      principalType: 1,
      scopeLevel: 2,
      decisionReference: 'principal-authorization:1'
    })
  })

  it('maps mTLS-only workload issuance with no ExecutionToken fallback', async () => {
    const caller = verifiedCaller()
    jest
      .spyOn(permissionDecisionGuard, 'getPermissionDecisionCallerContext')
      .mockReturnValue(caller)
    const queryBus = {
      execute: jest.fn().mockResolvedValue({
        allowed: true,
        grantedPermissionCodes: ['asset.internal.resolve'],
        deniedPermissionCodes: [],
        decisionReference: 'workload-issuance:1',
        authzVersion: 'policy-v1',
        reasonCode: 'AUTHORIZATION_GRANTED'
      })
    }
    const controller = new PermissionCheckGrpcController(queryBus as never, {} as never)
    const request = {
      originalWorkloadSpiffeId: 'spiffe://local.test/site-service',
      targetAudience: 'urn:oes:service:asset-service',
      requestedInternalPermissionCodes: ['asset.internal.resolve'],
      scopeLevel: 2,
      tenantId: 'tenant-1',
      principalType: 1,
      principalId: 'human-1',
      issuancePolicyVersion: 'policy-v1'
    }

    const result = await controller.resolveWorkloadIssuance(request)

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining<ResolveWorkloadIssuanceQuery>({
        input: expect.objectContaining({
          originalWorkloadSpiffeId: 'spiffe://local.test/site-service',
          requestedPermissionCodes: ['asset.internal.resolve']
        }),
        caller
      })
    )
    expect(result).toMatchObject({ allowed: true, decisionReference: 'workload-issuance:1' })
  })

  it('maps owner-derived delegated snapshots and preserves owner risk in the response', async () => {
    const caller = verifiedCaller('DELEGATED')
    jest
      .spyOn(permissionDecisionGuard, 'getPermissionDecisionCallerContext')
      .mockReturnValue(caller)
    const queryBus = {
      execute: jest.fn().mockResolvedValue({
        allowed: true,
        allowedPermissionCodes: ['collaboration.task.assign'],
        deniedPermissionCodes: [],
        riskClass: 'ACTION_GRANT_REQUIRED',
        policyVersion: 'owner-policy-v1',
        resourcePolicyAllowed: true,
        resourcePolicyReference: 'resource-policy-1',
        decisionReference: 'delegated-authorization:1',
        authzVersion: 'delegated-v1',
        reasonCode: 'AUTHORIZATION_GRANTED'
      })
    }
    const controller = new PermissionCheckGrpcController(queryBus as never, {} as never)
    const request = delegatedRequest()

    const result = await controller.resolveDelegatedAuthorization(request as never)

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining<ResolveDelegatedAuthorizationQuery>({
        input: expect.objectContaining({
          humanPrincipalId: 'human-1',
          operationKey: 'collaboration.task.assign',
          ownerAuthorization: expect.objectContaining({
            effectiveRiskClass: 'ACTION_GRANT_REQUIRED'
          })
        }),
        caller
      })
    )
    expect(result).toMatchObject({
      allowed: true,
      riskClass: 2,
      decisionReference: 'delegated-authorization:1'
    })
  })
})

// Builds safe caller claims that the transport guard would attach to the request.
function verifiedCaller(principalType?: 'HUMAN' | 'DELEGATED') {
  return {
    directWorkloadSpiffeId: 'spiffe://local.test/auth-service',
    certificateThumbprint: 'certificate-thumbprint',
    ...(principalType
      ? {
          verifiedExecutionToken: {
            subject: 'human-1',
            principalType,
            tenantId: 'tenant-1',
            sessionId: 'session-1',
            delegationId: principalType === 'DELEGATED' ? 'delegation-1' : undefined,
            authzVersion: 'source-authz-v1'
          }
        }
      : {})
  }
}

// Builds one generated-contract-shaped delegated request for interface mapping tests.
function delegatedRequest() {
  return {
    humanPrincipalId: 'human-1',
    scopeLevel: 2,
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
      codeRiskBaseline: 2,
      effectiveRiskClass: 2,
      resourcePolicyAllowed: true,
      resourcePolicyReference: 'resource-policy-1'
    }
  }
}
