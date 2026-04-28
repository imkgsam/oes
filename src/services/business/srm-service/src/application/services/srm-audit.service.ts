import { Inject, Injectable } from '@nestjs/common'
import {
  AuditEnvelope,
  AuditResult,
  buildAuditEnvelope
} from '@oes/common'
import { OESExceptionBase } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import {
  SrmAuditContext,
  SrmOperatorContext,
  SrmTraceContext
} from '../../domain/models/srm-records'
import { SrmAuditWriter } from '../ports/srm-audit-writer.port'
import { SrmTransactionRunner } from '../ports/srm-transaction-runner.port'

export interface RecordSrmCommandAuditInput {
  tenantId: string
  operatorContext: SrmOperatorContext
  traceContext: SrmTraceContext
  auditContext: SrmAuditContext
  commandName: string
  resourceType: string
  targetId: string | null
  requestSummary: Record<string, unknown>
}

/** SrmAuditService records one local audit envelope around each SRM management command execution. */
@Injectable()
export class SrmAuditService {
  constructor(
    @Inject(TOKENS.SRM_TRANSACTION_RUNNER)
    private readonly transactionRunner: SrmTransactionRunner,
    @Inject(TOKENS.SRM_AUDIT_WRITER)
    private readonly writer: SrmAuditWriter
  ) {}

  /** recordCommand persists success, rejection, and failure envelopes for the srm-service command surface. */
  async recordCommand<T>(input: RecordSrmCommandAuditInput, execute: () => Promise<T>): Promise<T> {
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
    input: RecordSrmCommandAuditInput,
    result: AuditResult,
    details: Record<string, unknown>
  ): AuditEnvelope {
    return buildAuditEnvelope({
      service: 'srm-service',
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
