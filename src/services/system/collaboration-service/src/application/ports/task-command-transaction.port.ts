import type { OesCloudEvent } from '@oes/common'
import type { TaskFactEvent } from '../events/task.events'
import type { TaskEntity } from '../../domain/entities/task.entity'
import type { TaskAuditPort } from './task-audit.port'

/** Captures every service-owned write that must commit atomically for one Task command. */
export interface TaskCommandTransactionInput {
  readonly operation: 'CREATE' | 'UPDATE'
  readonly task: TaskEntity
  readonly audit: Parameters<TaskAuditPort['record']>[0]
  readonly localEvents: readonly TaskFactEvent[]
  readonly publicEvents?: readonly OesCloudEvent[]
}

/** Defines the application seam that commits Task state, audit, and optional public outbox body together. */
export interface TaskCommandTransactionPort {
  commit(input: TaskCommandTransactionInput): Promise<TaskEntity>
}

export const TASK_COMMAND_TRANSACTION_PORT = Symbol('TASK_COMMAND_TRANSACTION_PORT')
