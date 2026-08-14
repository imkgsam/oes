import { Inject, Injectable, Optional } from '@nestjs/common'
import { AuditEnvelope, AuditResult, buildAuditEnvelope } from '@oes/common'
import { GrpcRequestContextStore } from '@oes/common/authorization'
import { OESExceptionBase } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import {
  ProcurementAuditContext,
  ProcurementOperatorContext,
  ProcurementTraceContext
} from '../../domain/models/procurement-records'
import { ProcurementAuditWriter } from '../ports/procurement-audit-writer.port'
import { ProcurementTransactionRunner } from '../ports/procurement-transaction-runner.port'

export interface RecordProcurementCommandAuditInput {
  readonly [key: string]: unknown
  tenantId: string
  operatorContext: ProcurementOperatorContext
  traceContext: ProcurementTraceContext
  auditContext: ProcurementAuditContext
  commandName: string
  resourceType: string
  targetId: string | null
  requestSummary: Record<string, unknown>
}

/** Records Procurement command audit from verified ET/mTLS facts in the mutation transaction. */
@Injectable()
export class ProcurementAuditService {
  constructor(
    @Inject(TOKENS.PROCUREMENT_TRANSACTION_RUNNER)
    private readonly transactionRunner: ProcurementTransactionRunner,
    @Inject(TOKENS.PROCUREMENT_AUDIT_WRITER)
    private readonly writer: ProcurementAuditWriter,
    @Optional()
    private readonly requestContextStore?: GrpcRequestContextStore
  ) {}

  /** Persists success atomically with mutation and records rejected/failed command evidence. */
  async recordCommand<T>(
    input: RecordProcurementCommandAuditInput,
    execute: () => Promise<T>
  ): Promise<T> {
    const authority = this.requireAuthority(input.tenantId)
    try {
      return await this.transactionRunner.runInTransaction(async () => {
        const result = await execute()
        await this.writer.append(
          this.buildEnvelope(input, authority, 'SUCCEEDED', { result: 'success' })
        )
        return result
      })
    } catch (error) {
      const auditResult: AuditResult = error instanceof OESExceptionBase ? 'REJECTED' : 'FAILED'
      await this.writer.append(
        this.buildEnvelope(input, authority, auditResult, {
          result: 'error',
          error: error instanceof Error ? error.message : String(error)
        })
      )
      throw error
    }
  }

  /** Builds the audit envelope from immutable verified authority and business-only request summary. */
  private buildEnvelope(
    input: RecordProcurementCommandAuditInput,
    authority: ProcurementTrustedAuditAuthority,
    result: AuditResult,
    details: Record<string, unknown>
  ): AuditEnvelope {
    return buildAuditEnvelope({
      service: 'procurement-service',
      module: 'management',
      eventType: input.commandName,
      result,
      operator: {
        operatorId: authority.subject,
        operatorType: 'HUMAN'
      },
      scope: {
        tenantId: input.tenantId,
        orgId: authority.orgId ?? null
      },
      trace: {
        traceId: authority.traceId
      },
      resource: {
        resourceType: input.resourceType,
        resourceId: input.targetId
      },
      details: {
        requestSummary: input.requestSummary,
        operatorContext: {
          operatorId: authority.subject,
          operatorType: 'HUMAN',
          tenantId: input.tenantId,
          orgId: authority.orgId ?? null
        },
        traceContext: {
          traceId: authority.traceId,
          requestId: authority.requestId
        },
        auditContext: {
          auditId: authority.tokenId,
          reason: input.commandName,
          source: authority.workload
        },
        ...details
      }
    })
  }

  /** Freezes audit identity from the verified ET and mTLS context before mutation begins. */
  private requireAuthority(tenantId: string): ProcurementTrustedAuditAuthority {
    const context = this.requestContextStore?.getContext()
    const execution = context?.verifiedExecutionToken
    const workload = context?.verifiedWorkloadIdentity?.spiffeId
    if (
      execution?.principalType !== 'HUMAN' ||
      execution.tenantId !== tenantId ||
      !execution.subject ||
      !execution.tokenId ||
      !workload ||
      !context?.requestId ||
      !context.traceId
    ) {
      throw new Error('Procurement trusted audit authority is required')
    }
    return Object.freeze({
      subject: execution.subject,
      orgId: execution.orgId,
      tokenId: execution.tokenId,
      workload,
      requestId: context.requestId,
      traceId: context.traceId
    })
  }
}

type ProcurementTrustedAuditAuthority = Readonly<{
  subject: string
  orgId?: string
  tokenId: string
  workload: string
  requestId: string
  traceId: string
}>
