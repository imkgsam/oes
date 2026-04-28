import { CrmAuditContext, CrmOperatorContext, CrmTraceContext } from '../../domain/models/crm-records';
import { CrmAuditWriter } from '../ports/crm-audit-writer.port';
import { CrmTransactionRunner } from '../ports/crm-transaction-runner.port';
export interface RecordCrmCommandAuditInput {
    tenantId: string;
    operatorContext: CrmOperatorContext;
    traceContext: CrmTraceContext;
    auditContext: CrmAuditContext;
    commandName: string;
    resourceType: string;
    targetId: string | null;
    requestSummary: Record<string, unknown>;
}
/** CrmAuditService records one local audit envelope around each CRM management command execution. */
export declare class CrmAuditService {
    private readonly transactionRunner;
    private readonly writer;
    constructor(transactionRunner: CrmTransactionRunner, writer: CrmAuditWriter);
    /** recordCommand persists success, rejection, and failure envelopes for the crm-service command surface. */
    recordCommand<T>(input: RecordCrmCommandAuditInput, execute: () => Promise<T>): Promise<T>;
    /** buildEnvelope translates explicit request contexts into the shared audit envelope shape. */
    private buildEnvelope;
}
