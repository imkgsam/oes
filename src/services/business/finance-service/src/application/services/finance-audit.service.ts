import { Inject, Injectable } from '@nestjs/common'
import {
  AuditEnvelope,
  AuditResult,
  buildAuditEnvelope
} from '@oes/common'
import { OESExceptionBase } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import {
  FinanceAuditContext,
  FinanceOperatorContext,
  FinanceTraceContext
} from '../../domain/models/finance-records'
import { FinanceAuditWriter } from '../ports/finance-audit-writer.port'
import { FinanceTransactionRunner } from '../ports/finance-transaction-runner.port'

export interface RecordFinanceCommandAuditInput {
  tenantId: string
  operatorContext: FinanceOperatorContext
  traceContext: FinanceTraceContext
  auditContext: FinanceAuditContext
  commandName: string
  resourceType: string
  targetId: string | null
  requestSummary: Record<string, unknown>
}

/** FinanceAuditService records one local audit envelope around each management command execution. */
@Injectable()
export class FinanceAuditService {
  constructor(
    @Inject(TOKENS.FINANCE_TRANSACTION_RUNNER)
    private readonly transactionRunner: FinanceTransactionRunner,
    @Inject(TOKENS.FINANCE_AUDIT_WRITER)
    private readonly writer: FinanceAuditWriter
  ) {}

  /** recordCommand persists success, rejection, and failure envelopes for the finance phase 1A command surface. */
  async recordCommand<T>(input: RecordFinanceCommandAuditInput, execute: () => Promise<T>): Promise<T> {
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

  /** buildEnvelope translates explicit request contexts into the shared audit envelope shape. */
  private buildEnvelope(
    input: RecordFinanceCommandAuditInput,
    result: AuditResult,
    details: Record<string, unknown>
  ): AuditEnvelope {
    return buildAuditEnvelope({
      service: 'finance-service',
      module: 'management',
      eventType: input.commandName,
      result,
      operator: {
        operatorId: input.operatorContext.operatorId,
        operatorType: input.operatorContext.operatorType === 'SYSTEM' ? 'SYSTEM' : 'HUMAN'
      },
      scope: {
        tenantId: input.tenantId,
        orgId: input.operatorContext.orgId ?? null
      },
      trace: {
        traceId: input.traceContext.traceId
      },
      resource: {
        resourceType: input.resourceType,
        resourceId: input.targetId
      },
      details: {
        requestSummary: input.requestSummary,
        operatorContext: input.operatorContext,
        traceContext: input.traceContext,
        auditContext: input.auditContext,
        ...details
      }
    })
  }
}
