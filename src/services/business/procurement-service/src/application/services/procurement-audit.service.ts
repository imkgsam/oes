import { Inject, Injectable } from '@nestjs/common'
import { AuditEnvelope, AuditResult, buildAuditEnvelope } from '@oes/common'
import { OESExceptionBase } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { ProcurementAuditContext, ProcurementOperatorContext, ProcurementTraceContext } from '../../domain/models/procurement-records'
import { ProcurementAuditWriter } from '../ports/procurement-audit-writer.port'
import { ProcurementTransactionRunner } from '../ports/procurement-transaction-runner.port'

export interface RecordProcurementCommandAuditInput {
  tenantId: string
  operatorContext: ProcurementOperatorContext
  traceContext: ProcurementTraceContext
  auditContext: ProcurementAuditContext
  commandName: string
  resourceType: string
  targetId: string | null
  requestSummary: Record<string, unknown>
}

/** ProcurementAuditService records one local audit envelope around each procurement management command execution. */
@Injectable()
export class ProcurementAuditService {
  constructor(
    @Inject(TOKENS.PROCUREMENT_TRANSACTION_RUNNER)
    private readonly transactionRunner: ProcurementTransactionRunner,
    @Inject(TOKENS.PROCUREMENT_AUDIT_WRITER)
    private readonly writer: ProcurementAuditWriter
  ) {}

  /** recordCommand persists success, rejection, and failure envelopes for the procurement-service command surface. */
  async recordCommand<T>(input: RecordProcurementCommandAuditInput, execute: () => Promise<T>): Promise<T> {
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
    input: RecordProcurementCommandAuditInput,
    result: AuditResult,
    details: Record<string, unknown>
  ): AuditEnvelope {
    return buildAuditEnvelope({
      service: 'procurement-service',
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
