import {
  ActionGrantVerifier,
  actionDescriptorDigest,
  type ActionDescriptorV1
} from '@oes/common/authorization'
import type {
  TaskCommandReceiptInput,
  TaskDelegatedExecutionPolicyPort
} from './task-delegated-execution-policy.port'

const TOOL_CONTRACT_ID = 'oes.ai.task-assistant.collaboration-task'
const TOOL_CONTRACT_VERSION = '1.0.0'
const SELF_OPERATION = 'collaboration.task.create-self.v1'
const ASSIGNED_OPERATION = 'collaboration.task.create-assigned.v1'
const TARGET_AUDIENCE = 'urn:oes:service:collaboration-service'

/** Enforces Task Assistant's frozen self/assigned split and exact ActionDescriptorV1 binding. */
export class TaskDelegatedExecutionPolicy implements TaskDelegatedExecutionPolicyPort {
  constructor(private readonly verifier: ActionGrantVerifier) {}

  /** Authorizes a delegated create and projects only non-secret values into the local atomic receipt. */
  async authorizeCreate(
    input: Parameters<TaskDelegatedExecutionPolicyPort['authorizeCreate']>[0]
  ): Promise<TaskCommandReceiptInput> {
    const idempotencyKey = requireText(input.idempotencyKey, 'idempotency key')
    const token = input.execution.executionToken
    if (
      token.principalType !== 'DELEGATED' ||
      token.audience !== TARGET_AUDIENCE ||
      token.tenantId !== input.tenantId ||
      delegatedHumanId(token.actor) !== input.operatorAccountId ||
      !token.delegationId
    ) {
      throw new Error('DELEGATION_AUTHENTICATION_REQUIRED')
    }
    const selfTodo = input.assigneeAccountId === input.operatorAccountId
    const operationKey = selfTodo ? SELF_OPERATION : ASSIGNED_OPERATION
    const descriptor: ActionDescriptorV1 = {
      descriptorVersion: 'v1',
      operationKey,
      toolContract: { id: TOOL_CONTRACT_ID, version: TOOL_CONTRACT_VERSION },
      target: { tenantId: input.tenantId, assigneeAccountId: input.assigneeAccountId },
      input: {
        title: input.title,
        description: input.description,
        dueAt: input.dueAt?.toISOString() ?? null,
        priority: input.priority
      },
      idempotencyKey
    }
    if (selfTodo) {
      if (input.execution.actionGrant !== undefined)
        throw new Error('ACTION_GRANT_FORBIDDEN_OPERATION')
      return Object.freeze({
        tenantId: input.tenantId,
        operatorAccountId: input.operatorAccountId,
        operationKey,
        idempotencyKey,
        descriptorDigest: actionDescriptorDigest(descriptor),
        actionGrantJti: null,
        delegationReference: token.delegationId,
        agentPrincipalId: token.subject,
        toolContractId: TOOL_CONTRACT_ID,
        toolContractVersion: TOOL_CONTRACT_VERSION,
        authorizationDecisionReference: token.tokenId
      })
    }
    if (!input.execution.actionGrant) throw new Error('ACTION_GRANT_CONFIRMATION_REQUIRED')
    const verified = await this.verifier.verify({
      token: input.execution.actionGrant,
      targetAudience: TARGET_AUDIENCE,
      workloadIdentity: input.execution.workloadIdentity,
      executionToken: token,
      expectedDescriptor: descriptor
    })
    return Object.freeze({
      tenantId: input.tenantId,
      operatorAccountId: input.operatorAccountId,
      operationKey,
      idempotencyKey,
      descriptorDigest: verified.descriptorDigest,
      actionGrantJti: verified.actionGrantJti,
      delegationReference: verified.delegationId,
      agentPrincipalId: verified.agentPrincipalId,
      toolContractId: verified.toolContractId,
      toolContractVersion: verified.toolContractVersion,
      authorizationDecisionReference: verified.authorizationDecisionReference
    })
  }
}

/** Resolves the HUMAN attribution from the verified DELEGATED ExecutionToken only. */
function delegatedHumanId(actor: unknown): string {
  if (typeof actor === 'string' && actor.length > 0) return actor
  if (actor !== null && typeof actor === 'object' && !Array.isArray(actor)) {
    const subject = (actor as Record<string, unknown>).sub
    if (typeof subject === 'string' && subject.length > 0) return subject
  }
  throw new Error('DELEGATION_AUTHENTICATION_REQUIRED')
}

/** Requires a caller-generated opaque idempotency reference without normalizing it into another command identity. */
function requireText(value: string | undefined, label: string): string {
  if (!value || value.trim() !== value) throw new Error(`${label} is required`)
  return value
}
