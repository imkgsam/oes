import { Inject, Injectable } from '@nestjs/common'
import { AuditEnvelope, AuditResult, buildAuditEnvelope, flattenAuditEnvelope } from '@oes/common'
import { GrpcRequestContextStore } from '@oes/common/authorization'
import { OESExceptionBase } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { ItemMasterAuditWriter } from '../ports/item-master-audit-writer.port'
import { ItemMasterTransactionRunner } from '../ports/item-master-transaction-runner.port'

export interface RecordCommandAuditInput {
  tenantId: string
  commandName: string
  targetId: string | null
  requestSummary: Record<string, unknown>
}

/** ItemMasterAuditService records the local phase 1 command audit envelope around management execution. */
@Injectable()
export class ItemMasterAuditService {
  constructor(
    private readonly requestContextStore: GrpcRequestContextStore,
    @Inject(TOKENS.ITEM_MASTER_TRANSACTION_RUNNER)
    private readonly transactionRunner: ItemMasterTransactionRunner,
    @Inject(TOKENS.ITEM_MASTER_AUDIT_WRITER)
    private readonly writer: ItemMasterAuditWriter
  ) {}

  /** recordCommand wraps one management callback and persists a success, rejection, or failure envelope. */
  async recordCommand<T>(input: RecordCommandAuditInput, execute: () => Promise<T>): Promise<T> {
    try {
      return await this.transactionRunner.runInTransaction(async () => {
        const result = await execute()
        await this.writer.append(this.buildEnvelope(input, 'SUCCEEDED', { result: 'success' }))
        return result
      })
    } catch (error) {
      const auditResult: AuditResult = error instanceof OESExceptionBase ? 'REJECTED' : 'FAILED'
      await this.writer.append(
        this.buildEnvelope(input, auditResult, {
          result: 'error',
          error: error instanceof Error ? error.message : String(error)
        })
      )
      throw error
    }
  }

  /** buildEnvelope translates the current gRPC request context into the shared audit shape. */
  private buildEnvelope(
    input: RecordCommandAuditInput,
    result: AuditResult,
    details: Record<string, unknown>
  ): AuditEnvelope {
    const context = this.requestContextStore.getContext()
    const execution = context?.verifiedExecutionToken

    return buildAuditEnvelope({
      service: 'item-master-service',
      module: 'management',
      eventType: input.commandName,
      result,
      operator: {
        operatorId: execution?.subject ?? null,
        operatorType: execution?.principalType === 'HUMAN' ? 'HUMAN' : 'SYSTEM'
      },
      scope: {
        tenantId: input.tenantId,
        orgId: execution?.orgId ?? null
      },
      trace: {
        traceId: context?.traceId ?? null
      },
      resource: {
        resourceType: 'item_master',
        resourceId: input.targetId
      },
      details: {
        requestSummary: input.requestSummary,
        serviceContext: context?.verifiedWorkloadIdentity?.spiffeId ?? null,
        operatorContext: execution
          ? {
              operatorId: execution.subject,
              operatorType: execution.principalType,
              tenantId: execution.tenantId ?? null,
              orgId: execution.orgId ?? null
            }
          : null,
        traceContext: {
          traceId: context?.traceId ?? null,
          requestId: context?.requestId ?? null
        },
        ...details
      }
    })
  }
}

/** toFlatAuditLogRecord exposes a debug-friendly audit shape for infrastructure logging. */
export function toFlatAuditLogRecord(envelope: AuditEnvelope): Record<string, unknown> {
  return {
    ...flattenAuditEnvelope(envelope)
  }
}
