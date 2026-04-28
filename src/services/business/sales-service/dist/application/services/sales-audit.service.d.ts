import { SalesAuditContext, SalesOperatorContext, SalesTraceContext } from '../../domain/models/sales-records';
import { SalesAuditWriter } from '../ports/sales-audit-writer.port';
import { SalesTransactionRunner } from '../ports/sales-transaction-runner.port';
export interface RecordSalesCommandAuditInput {
    tenantId: string;
    operatorContext: SalesOperatorContext;
    traceContext: SalesTraceContext;
    auditContext: SalesAuditContext;
    commandName: string;
    resourceType: string;
    targetId: string | null;
    requestSummary: Record<string, unknown>;
}
/** SalesAuditService records one local audit envelope around each management command execution. */
export declare class SalesAuditService {
    private readonly transactionRunner;
    private readonly writer;
    constructor(transactionRunner: SalesTransactionRunner, writer: SalesAuditWriter);
    /** recordCommand persists success, rejection, and failure envelopes for the sales phase 1 command surface. */
    recordCommand<T>(input: RecordSalesCommandAuditInput, execute: () => Promise<T>): Promise<T>;
    /** buildEnvelope translates explicit request contexts into the shared audit envelope shape. */
    private buildEnvelope;
}
