import { Inject, Injectable } from '@nestjs/common'
import { AuditEnvelope, AuditResult, buildAuditEnvelope } from '@oes/common'
import { OESExceptionBase } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { WmsAuditContext, WmsOperatorContext, WmsTraceContext } from '../../domain/models/wms-records'
import { WmsAuditWriter } from '../ports/wms-audit-writer.port'
import { WmsTransactionRunner } from '../ports/wms-transaction-runner.port'

export interface RecordWmsCommandAuditInput {
  tenantId: string
  operatorContext: WmsOperatorContext
  traceContext: WmsTraceContext
  auditContext: WmsAuditContext
  commandName: string
  resourceType: string
  targetId: string | null
  requestSummary: Record<string, unknown>
}

/** WmsAuditService records one local audit envelope around each WMS management command execution. */
@Injectable()
export class WmsAuditService {
  constructor(
    @Inject(TOKENS.WMS_TRANSACTION_RUNNER)
    private readonly transactionRunner: WmsTransactionRunner,
    @Inject(TOKENS.WMS_AUDIT_WRITER)
    private readonly writer: WmsAuditWriter
  ) {}

  /** recordCommand persists success, rejection, and failure envelopes for the WMS management surface. */
  async recordCommand<T>(input: RecordWmsCommandAuditInput, execute: () => Promise<T>): Promise<T> {
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

  /** buildEnvelope translates explicit WMS request contexts into the shared audit envelope shape. */
  private buildEnvelope(
    input: RecordWmsCommandAuditInput,
    result: AuditResult,
    details: Record<string, unknown>
  ): AuditEnvelope {
    return buildAuditEnvelope({
      service: 'wms-service',
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
