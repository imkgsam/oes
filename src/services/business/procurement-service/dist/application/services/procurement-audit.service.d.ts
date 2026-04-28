import { ProcurementAuditContext, ProcurementOperatorContext, ProcurementTraceContext } from '../../domain/models/procurement-records';
import { ProcurementAuditWriter } from '../ports/procurement-audit-writer.port';
import { ProcurementTransactionRunner } from '../ports/procurement-transaction-runner.port';
export interface RecordProcurementCommandAuditInput {
    tenantId: string;
    operatorContext: ProcurementOperatorContext;
    traceContext: ProcurementTraceContext;
    auditContext: ProcurementAuditContext;
    commandName: string;
    resourceType: string;
    targetId: string | null;
    requestSummary: Record<string, unknown>;
}
/** ProcurementAuditService records one local audit envelope around each procurement management command execution. */
export declare class ProcurementAuditService {
    private readonly transactionRunner;
    private readonly writer;
    constructor(transactionRunner: ProcurementTransactionRunner, writer: ProcurementAuditWriter);
    /** recordCommand persists success, rejection, and failure envelopes for the procurement-service command surface. */
    recordCommand<T>(input: RecordProcurementCommandAuditInput, execute: () => Promise<T>): Promise<T>;
    /** buildEnvelope translates explicit request contexts into the shared audit envelope shape. */
    private buildEnvelope;
}
