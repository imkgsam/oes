import type {
  VerifiedActionGrant,
  VerifiedExecutionToken,
  VerifiedWorkloadIdentity
} from '@oes/common/authorization'
import { TaskCommandService } from '../../src/application/services/task-command.service'
import type { TaskCommandTransactionPort } from '../../src/application/ports/task-command-transaction.port'
import type { TaskDelegatedExecutionPolicyPort } from '../../src/application/task/task-delegated-execution-policy.port'

const token: VerifiedExecutionToken = {
  issuer: 'https://auth.local.oes.example',
  audience: 'urn:oes:service:collaboration-service',
  subject: 'agent-1',
  principalType: 'DELEGATED',
  clientId: 'spiffe://local.oes/ai-platform',
  tenantId: 'tenant-1',
  permissionCodes: ['collaboration.task.assign'],
  tokenId: 'execution-1',
  issuedAt: 1,
  notBefore: 1,
  expiresAt: 300,
  certificateThumbprint: 'A'.repeat(43),
  actor: 'human-1',
  delegationId: 'delegation-1'
}
const workload: VerifiedWorkloadIdentity = {
  spiffeId: 'spiffe://local.oes/ai-platform',
  certificateThumbprint: 'A'.repeat(43)
}
const verifiedGrant: VerifiedActionGrant = {
  actionGrantJti: 'grant-1',
  humanPrincipalId: 'human-1',
  delegationId: 'delegation-1',
  agentPrincipalId: 'agent-1',
  tenantId: 'tenant-1',
  audience: 'urn:oes:service:collaboration-service',
  operationKey: 'collaboration.task.create-assigned.v1',
  toolContractId: 'oes.ai.task-assistant.collaboration-task',
  toolContractVersion: '1.0.0',
  descriptorDigest: 'digest-1',
  idempotencyKey: 'idem-1',
  confirmationReference: 'confirmation-1',
  authorizationDecisionReference: 'decision-1',
  expiresAt: 120
}

/** Builds a delegated Task command fixture with recorded transaction and ActionGrant policy boundaries. */
function fixture() {
  const transaction: jest.Mocked<TaskCommandTransactionPort> = {
    commit: jest.fn(async (input) => input.task)
  }
  const delegatedPolicy: jest.Mocked<TaskDelegatedExecutionPolicyPort> = {
    authorizeCreate: jest.fn().mockResolvedValue({
      operationKey: verifiedGrant.operationKey,
      idempotencyKey: verifiedGrant.idempotencyKey,
      descriptorDigest: verifiedGrant.descriptorDigest,
      actionGrantJti: verifiedGrant.actionGrantJti,
      delegationReference: verifiedGrant.delegationId,
      agentPrincipalId: verifiedGrant.agentPrincipalId,
      toolContractId: verifiedGrant.toolContractId,
      toolContractVersion: verifiedGrant.toolContractVersion,
      authorizationDecisionReference: verifiedGrant.authorizationDecisionReference
    })
  }
  return {
    transaction,
    delegatedPolicy,
    service: new TaskCommandService(
      { findById: jest.fn() } as never,
      { isActiveTenantAccount: jest.fn().mockResolvedValue(true) },
      transaction,
      { canAssignTask: jest.fn().mockResolvedValue(true) },
      delegatedPolicy
    )
  }
}

describe('Task delegated ActionGrant boundary', () => {
  it('requires an idempotency receipt but no ActionGrant for a delegated self todo', async () => {
    const { service, transaction, delegatedPolicy } = fixture()
    delegatedPolicy.authorizeCreate.mockResolvedValueOnce({
      operationKey: 'collaboration.task.create-self.v1',
      idempotencyKey: 'idem-self',
      descriptorDigest: 'digest-self',
      actionGrantJti: null,
      delegationReference: 'delegation-1',
      agentPrincipalId: 'agent-1',
      toolContractId: 'oes.ai.task-assistant.collaboration-task',
      toolContractVersion: '1.0.0',
      authorizationDecisionReference: 'execution-1'
    })
    await service.createTask({
      tenantId: 'tenant-1',
      operatorAccountId: 'human-1',
      title: 'My todo',
      idempotencyKey: 'idem-self',
      traceId: 'trace-1',
      auditId: 'audit-1',
      delegatedExecution: { executionToken: token, workloadIdentity: workload }
    })
    expect(transaction.commit).toHaveBeenCalledWith(
      expect.objectContaining({
        receipt: expect.objectContaining({
          actionGrantJti: null,
          operationKey: 'collaboration.task.create-self.v1'
        })
      })
    )
  })

  it('rejects an assigned delegated task without a verified ActionGrant before mutation', async () => {
    const { service, transaction, delegatedPolicy } = fixture()
    delegatedPolicy.authorizeCreate.mockRejectedValueOnce(
      new Error('ACTION_GRANT_CONFIRMATION_REQUIRED')
    )
    await expect(
      service.createTask({
        tenantId: 'tenant-1',
        operatorAccountId: 'human-1',
        assigneeAccountId: 'human-2',
        title: 'Assigned',
        idempotencyKey: 'idem-1',
        traceId: 'trace-1',
        auditId: 'audit-1',
        delegatedExecution: { executionToken: token, workloadIdentity: workload }
      })
    ).rejects.toThrow('ACTION_GRANT_CONFIRMATION_REQUIRED')
    expect(transaction.commit).not.toHaveBeenCalled()
  })

  it('commits Task, existing audit/outbox and ActionGrant receipt through the same transaction seam', async () => {
    const { service, transaction } = fixture()
    await service.createTask({
      tenantId: 'tenant-1',
      operatorAccountId: 'human-1',
      assigneeAccountId: 'human-2',
      title: ' Assigned ',
      description: null,
      priority: undefined,
      idempotencyKey: 'idem-1',
      traceId: 'trace-1',
      auditId: 'audit-1',
      delegatedExecution: {
        executionToken: token,
        workloadIdentity: workload,
        actionGrant: 'a.b.c'
      }
    })
    expect(transaction.commit).toHaveBeenCalledWith(
      expect.objectContaining({
        audit: expect.objectContaining({
          action: 'TASK_CREATED',
          payload: expect.objectContaining({
            actionGrantJti: 'grant-1',
            descriptorDigest: 'digest-1'
          })
        }),
        publicEvent: expect.objectContaining({ type: 'collaboration.task.assigned' }),
        receipt: expect.objectContaining({
          tenantId: 'tenant-1',
          operatorAccountId: 'human-1',
          operationKey: 'collaboration.task.create-assigned.v1',
          idempotencyKey: 'idem-1',
          descriptorDigest: 'digest-1',
          actionGrantJti: 'grant-1'
        })
      })
    )
  })

  it('keeps every other Task P1 mutation AI_FORBIDDEN', async () => {
    const { service } = fixture()
    await expect(
      service.startTask({
        tenantId: 'tenant-1',
        operatorAccountId: 'human-1',
        taskId: 'task-1',
        traceId: 'trace-1',
        delegatedExecution: { executionToken: token, workloadIdentity: workload }
      })
    ).rejects.toThrow('ACTION_GRANT_FORBIDDEN_OPERATION')
  })
})
