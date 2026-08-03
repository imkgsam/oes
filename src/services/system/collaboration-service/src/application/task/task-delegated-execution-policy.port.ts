import type { VerifiedExecutionToken, VerifiedWorkloadIdentity } from '@oes/common/authorization'
import type { TaskPriority } from '../../domain/value-objects/task.enums'

export type TaskDelegatedExecutionInput = {
  readonly executionToken: VerifiedExecutionToken
  readonly workloadIdentity: VerifiedWorkloadIdentity
  readonly actionGrant?: string
}

export type TaskCommandReceiptInput = {
  readonly tenantId: string
  readonly operatorAccountId: string
  readonly operationKey: string
  readonly idempotencyKey: string
  readonly descriptorDigest: string
  readonly actionGrantJti: string | null
  readonly taskId?: string
  readonly resultReference?: string
  readonly delegationReference: string
  readonly agentPrincipalId: string
  readonly toolContractId: string
  readonly toolContractVersion: string
  readonly authorizationDecisionReference: string
}

/** Authorizes only the two frozen delegated CreateTask variants and returns transaction-ready receipt facts. */
export interface TaskDelegatedExecutionPolicyPort {
  authorizeCreate(input: {
    readonly tenantId: string
    readonly operatorAccountId: string
    readonly assigneeAccountId: string
    readonly title: string
    readonly description: string | null
    readonly dueAt: Date | null
    readonly priority: TaskPriority
    readonly idempotencyKey?: string
    readonly execution: TaskDelegatedExecutionInput
  }): Promise<TaskCommandReceiptInput>
}

export const TASK_DELEGATED_EXECUTION_POLICY_PORT = Symbol('TASK_DELEGATED_EXECUTION_POLICY_PORT')
