import { DelegatedAuthorizationService } from '../../src/application/delegated-authorization/delegated-authorization.service'

const base = {
  humanPrincipalId: 'human-1',
  delegationReference: 'delegation-1',
  agentPrincipalId: 'agent-1',
  toolContractId: 'oes.ai.task-assistant.collaboration-task',
  toolContractVersion: '1.0.0',
  tenantId: 'tenant-1',
  targetAudience: 'urn:oes:service:collaboration-service',
  operationKey: 'collaboration.task.create-assigned.v1',
  requestedPermissionCodes: ['collaboration.task.assign'],
  delegationOperationKeys: ['collaboration.task.create-assigned.v1'],
  delegationPermissionCodes: ['collaboration.task.assign'],
  toolOperationKeys: ['collaboration.task.create-assigned.v1'],
  toolPermissionCodes: ['collaboration.task.assign'],
  ownerRiskClass: 'ACTION_GRANT_REQUIRED' as const,
  resourceFacts: { assigneeTenantId: 'tenant-1', assigneeActive: true }
}

/** Creates the Permission-owned decision service with current HUMAN grants and policy facts behind ports. */
function fixture(humanCodes = ['collaboration.task.assign'], policyAllowed = true) {
  return new DelegatedAuthorizationService({
    humanGrantResolver: {
      resolve: jest
        .fn()
        .mockResolvedValue({ active: true, permissionCodes: humanCodes, authzVersion: 'v7' })
    },
    resourcePolicyEvaluator: {
      evaluate: jest.fn().mockResolvedValue({
        allowed: policyAllowed,
        decisionReference: 'policy-1',
        stepUpRequired: false
      })
    },
    randomId: () => 'decision-1'
  })
}

describe('DelegatedAuthorizationService', () => {
  it('authorizes the self-todo operation with an empty Permission Code intersection', async () => {
    await expect(
      fixture([]).resolve({
        ...base,
        operationKey: 'collaboration.task.create-self.v1',
        requestedPermissionCodes: [],
        delegationOperationKeys: ['collaboration.task.create-self.v1'],
        delegationPermissionCodes: [],
        toolOperationKeys: ['collaboration.task.create-self.v1'],
        toolPermissionCodes: [],
        ownerRiskClass: 'DELEGATION_ALLOWED'
      })
    ).resolves.toMatchObject({
      allowed: true,
      allowedPermissionCodes: [],
      riskClass: 'DELEGATION_ALLOWED'
    })
  })

  it('allows only the exact HUMAN, delegation, ToolContract and policy intersection', async () => {
    await expect(fixture().resolve(base)).resolves.toEqual({
      allowed: true,
      allowedPermissionCodes: ['collaboration.task.assign'],
      riskClass: 'ACTION_GRANT_REQUIRED',
      effectiveTenantId: 'tenant-1',
      authorizationDecisionReference: 'decision-1',
      authzVersion: 'v7',
      reasonCategory: 'AUTHORIZATION_DELEGATION_ALLOWED',
      stepUpRequired: false
    })
  })

  it('does not let a wider HUMAN grant widen the ToolContract boundary', async () => {
    await expect(
      fixture(['collaboration.task.assign', 'permission.role.manage']).resolve({
        ...base,
        requestedPermissionCodes: ['permission.role.manage']
      })
    ).resolves.toMatchObject({
      allowed: false,
      reasonCategory: 'AUTHORIZATION_TOOL_BOUNDARY_DENIED'
    })
  })

  it('always denies AI_FORBIDDEN even when the HUMAN holds the permission', async () => {
    await expect(
      fixture().resolve({ ...base, ownerRiskClass: 'AI_FORBIDDEN' })
    ).resolves.toMatchObject({
      allowed: false,
      allowedPermissionCodes: [],
      reasonCategory: 'AUTHORIZATION_OPERATION_FORBIDDEN_FOR_AI'
    })
  })

  it('fails closed on tenant/resource policy mismatch', async () => {
    await expect(
      fixture(['collaboration.task.assign'], false).resolve(base)
    ).resolves.toMatchObject({
      allowed: false,
      reasonCategory: 'AUTHORIZATION_RESOURCE_FACTS_INVALID'
    })
  })
})
