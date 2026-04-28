import { Inject, Injectable } from '@nestjs/common'
import {
  AuditEnvelope,
  AuditResult,
  buildAuditEnvelope
} from '@oes/common'
import { OESExceptionBase } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import {
  CrmAuditContext,
  CrmOperatorContext,
  CrmTraceContext
} from '../../domain/models/crm-records'
import { CrmAuditWriter } from '../ports/crm-audit-writer.port'
import { CrmTransactionRunner } from '../ports/crm-transaction-runner.port'

export interface RecordCrmCommandAuditInput {
  tenantId: string
  operatorContext: CrmOperatorContext
  traceContext: CrmTraceContext
  auditContext: CrmAuditContext
  commandName: string
  resourceType: string
  targetId: string | null
  requestSummary: Record<string, unknown>
}

/** CrmAuditService records one local audit envelope around each CRM management command execution. */
@Injectable()
export class CrmAuditService {
  constructor(
    @Inject(TOKENS.CRM_TRANSACTION_RUNNER)
    private readonly transactionRunner: CrmTransactionRunner,
    @Inject(TOKENS.CRM_AUDIT_WRITER)
    private readonly writer: CrmAuditWriter
  ) {}

  /** recordCommand persists success, rejection, and failure envelopes for the crm-service command surface. */
  async recordCommand<T>(input: RecordCrmCommandAuditInput, execute: () => Promise<T>): Promise<T> {
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
    input: RecordCrmCommandAuditInput,
    result: AuditResult,
    details: Record<string, unknown>
  ): AuditEnvelope {
    return buildAuditEnvelope({
      service: 'crm-service',
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
