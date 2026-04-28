import { SrmAuditContext, SrmOperatorContext, SrmTraceContext } from '../../domain/models/srm-records';
import { SrmAuditWriter } from '../ports/srm-audit-writer.port';
import { SrmTransactionRunner } from '../ports/srm-transaction-runner.port';
export interface RecordSrmCommandAuditInput {
    tenantId: string;
    operatorContext: SrmOperatorContext;
    traceContext: SrmTraceContext;
    auditContext: SrmAuditContext;
    commandName: string;
    resourceType: string;
    targetId: string | null;
    requestSummary: Record<string, unknown>;
}
/** SrmAuditService records one local audit envelope around each SRM management command execution. */
export declare class SrmAuditService {
    private readonly transactionRunner;
    private readonly writer;
    constructor(transactionRunner: SrmTransactionRunner, writer: SrmAuditWriter);
    /** recordCommand persists success, rejection, and failure envelopes for the srm-service command surface. */
    recordCommand<T>(input: RecordSrmCommandAuditInput, execute: () => Promise<T>): Promise<T>;
    /** buildEnvelope translates explicit request contexts into the shared audit envelope shape. */
    private buildEnvelope;
}
