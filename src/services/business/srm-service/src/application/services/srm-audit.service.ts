import { Inject, Injectable, Optional } from '@nestjs/common'
import { AuditEnvelope, AuditResult, buildAuditEnvelope } from '@oes/common'
import { GrpcRequestContextStore } from '@oes/common/authorization'
import { OESExceptionBase } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { SrmAuditWriter } from '../ports/srm-audit-writer.port'
import { SrmTransactionRunner } from '../ports/srm-transaction-runner.port'

export interface RecordSrmCommandAuditInput {
  readonly [key: string]: unknown
  tenantId: string
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
    private readonly writer: SrmAuditWriter,
    @Optional()
    private readonly requestContextStore?: GrpcRequestContextStore
  ) {}

  /** recordCommand persists success, rejection, and failure envelopes for the srm-service command surface. */
  async recordCommand<T>(input: RecordSrmCommandAuditInput, execute: () => Promise<T>): Promise<T> {
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

  /** buildEnvelope translates explicit request contexts into the shared audit envelope shape. */
  private buildEnvelope(
    input: RecordSrmCommandAuditInput,
    authority: SrmTrustedAuditAuthority,
    result: AuditResult,
    details: Record<string, unknown>
  ): AuditEnvelope {
    return buildAuditEnvelope({
      service: 'srm-service',
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
  private requireAuthority(tenantId: string): SrmTrustedAuditAuthority {
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
      throw new Error('SRM trusted audit authority is required')
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

type SrmTrustedAuditAuthority = Readonly<{
  subject: string
  orgId?: string
  tokenId: string
  workload: string
  requestId: string
  traceId: string
}>
