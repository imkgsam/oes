import { Inject, Injectable } from '@nestjs/common'
import {
  AuditEnvelope,
  AuditResult,
  buildAuditEnvelope
} from '@oes/common'
import { OESExceptionBase } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import {
  SalesAuditContext,
  SalesOperatorContext,
  SalesTraceContext
} from '../../domain/models/sales-records'
import { SalesAuditWriter } from '../ports/sales-audit-writer.port'
import { SalesTransactionRunner } from '../ports/sales-transaction-runner.port'

export interface RecordSalesCommandAuditInput {
  tenantId: string
  operatorContext: SalesOperatorContext
  traceContext: SalesTraceContext
  auditContext: SalesAuditContext
  commandName: string
  resourceType: string
  targetId: string | null
  requestSummary: Record<string, unknown>
}

/** SalesAuditService records one local audit envelope around each management command execution. */
@Injectable()
export class SalesAuditService {
  constructor(
    @Inject(TOKENS.SALES_TRANSACTION_RUNNER)
    private readonly transactionRunner: SalesTransactionRunner,
    @Inject(TOKENS.SALES_AUDIT_WRITER)
    private readonly writer: SalesAuditWriter
  ) {}

  /** recordCommand persists success, rejection, and failure envelopes for the sales phase 1 command surface. */
  async recordCommand<T>(input: RecordSalesCommandAuditInput, execute: () => Promise<T>): Promise<T> {
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
    input: RecordSalesCommandAuditInput,
    result: AuditResult,
    details: Record<string, unknown>
  ): AuditEnvelope {
    return buildAuditEnvelope({
      service: 'sales-service',
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
